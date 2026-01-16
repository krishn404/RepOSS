import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authConfig } from "@/lib/auth"
import { createOctokit } from "@/lib/github"
import { ConvexHttpClient } from "convex/browser"
import { redis } from "@/lib/redis"
import {
  buildUserProfile,
  extractRepoSignals,
  scoreRepository,
  ensureDiversity,
} from "@/lib/contribution-picks"
import {
  getGroqRecommendations,
  generateMatchReasoning,
} from "@/lib/groq-recommendations"
import type { ContributionPick } from "@/types/index"
import type { Repository, UserProfile, RepoSignals } from "@/types/index"

function getConvexClient() {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL
  if (!convexUrl) {
    return null
  }
  return new ConvexHttpClient(convexUrl)
}

// Cache duration: 18 hours (between 12-24 hours as specified)
const CACHE_DURATION = 18 * 60 * 60 // 18 hours in seconds

/**
 * Get candidate repositories from GitHub based on user's profile
 * Searches for repos matching user's languages and interests
 */
async function getCandidateRepositories(
  octokit: ReturnType<typeof createOctokit>,
  userProfile: UserProfile,
  existingRepos: Set<string>,
): Promise<any[]> {
  const repos: any[] = []
  const userLanguages = Array.from(userProfile.languages.keys()).slice(0, 3) // Top 3 languages

  // Search for repos based on user's primary languages
  for (const lang of userLanguages) {
    try {
      const { data } = await octokit.search.repos({
        q: `language:${lang} is:public stars:>100`,
        sort: "stars",
        order: "desc",
        per_page: 30,
      })
      
      // Filter out existing repos
      const newRepos = data.items.filter((repo: any) => !existingRepos.has(repo.full_name))
      repos.push(...newRepos)
    } catch (error) {
      console.warn(`Failed to search repos for language ${lang}:`, error)
    }
  }

  // Also search for repos with help-wanted label
  try {
    const { data } = await octokit.search.repos({
      q: `is:public stars:>500`,
      sort: "updated",
      order: "desc",
      per_page: 50,
    })
    
    const newRepos = data.items.filter((repo: any) => !existingRepos.has(repo.full_name))
    repos.push(...newRepos)
  } catch (error) {
    console.warn("Failed to search help-wanted repos:", error)
  }

  // Remove duplicates
  const uniqueRepos = new Map<string, any>()
  for (const repo of repos) {
    if (!uniqueRepos.has(repo.full_name) && !existingRepos.has(repo.full_name)) {
      uniqueRepos.set(repo.full_name, repo)
    }
  }

  return Array.from(uniqueRepos.values())
}

/**
 * Get user's GitHub username from session or GitHub API
 */
async function getGitHubUsername(
  session: any,
  octokit: ReturnType<typeof createOctokit>,
  convexClient: ConvexHttpClient | null,
): Promise<string | null> {
  // First, try to get from session (stored during OAuth)
  // @ts-ignore - custom property added in auth.ts
  if (session?.user?.githubUsername) {
    return session.user.githubUsername
  }

  // Try to get from Convex user profile (providerAccountId might be GitHub username)
  if (convexClient && session?.user?.id) {
    try {
      const user = await convexClient.query("users:getUserProfile" as any, {
        userId: session.user.id,
      })
      if (user?.provider === "github" && user?.providerAccountId) {
        // Try to use providerAccountId as username (might be numeric ID, so verify)
        try {
          const { data } = await octokit.users.getByUsername({
            username: user.providerAccountId,
          })
          if (data.login) {
            return data.login
          }
        } catch {
          // providerAccountId might be numeric, skip for now (would need different API endpoint)
          // Continue to other methods
        }
      }
    } catch (error) {
      console.warn("Failed to get user from Convex:", error)
    }
  }

  // Try to extract from email (GitHub noreply emails)
  if (session?.user?.email) {
    const emailMatch = session.user.email.match(/^([^@]+)@users\.noreply\.github\.com$/)
    if (emailMatch) {
      const candidate = emailMatch[1].replace(/\+/g, "-")
      // Verify it's a valid GitHub username
      try {
        const { data } = await octokit.users.getByUsername({ username: candidate })
        if (data.login) {
          return data.login
        }
      } catch {
        // Not a valid username
      }
    }
  }

  // Try using name as username (common pattern)
  if (session?.user?.name) {
    const candidate = session.user.name.toLowerCase().replace(/\s+/g, "")
    try {
      const { data } = await octokit.users.getByUsername({ username: candidate })
      if (data.login) {
        return data.login
      }
    } catch {
      // Not a valid username
    }
  }

  return null
}

/**
 * Add function to get user's existing repos (starred, forked, owned, contributed to)
 */
async function getUserExistingRepos(octokit: ReturnType<typeof createOctokit>, username: string): Promise<Set<string>> {
  const existingRepoFullNames = new Set<string>()

  try {
    // Get owned repos
    const { data: ownedRepos } = await octokit.repos.listForUser({
      username,
      per_page: 100,
      type: "owner",
    })
    ownedRepos.forEach((repo) => existingRepoFullNames.add(repo.full_name))
  } catch (error) {
    console.warn("Failed to fetch owned repos:", error)
  }

  try {
    // Get starred repos - MOST IMPORTANT - check all pages
    let page = 1
    let hasMore = true
    while (hasMore && page <= 5) {
      const { data: starredRepos } = await octokit.activity.listReposStarredByUser({
        username,
        per_page: 100,
        page,
      })
      starredRepos.forEach((item) => {
        const repo = 'repo' in item ? item.repo : item
        if (repo.full_name) existingRepoFullNames.add(repo.full_name)
      })
      hasMore = starredRepos.length === 100
      page++
    }
  } catch (error) {
    console.warn("Failed to fetch starred repos:", error)
  }

  try {
    // Get forked repos
    const { data: allRepos } = await octokit.repos.listForUser({
      username,
      per_page: 100,
      type: "all",
    })
    allRepos.filter((repo) => repo.fork).forEach((repo) => existingRepoFullNames.add(repo.full_name))
  } catch (error) {
    console.warn("Failed to fetch forked repos:", error)
  }

  return existingRepoFullNames
}

/**
 * Convert scored picks to Repository format for RepoTable
 */
function convertPicksToRepositories(picks: (ContributionPick & { repo: any })[]): Repository[] {
  return picks.map((pick) => ({
    id: pick.repo.id,
    name: pick.repo.name,
    full_name: pick.repo.full_name,
    description: pick.repo.description || "",
    url: pick.repo.html_url,
    language: pick.repo.language || "",
    stargazers_count: pick.repo.stargazers_count,
    forks_count: pick.repo.forks_count,
    watchers_count: 0,
    open_issues_count: pick.repo.open_issues_count || 0,
    owner: {
      login: pick.repo.owner?.login || "",
      avatar_url: pick.repo.owner?.avatar_url || "",
    },
    topics: pick.repo.topics || [],
    updated_at: pick.repo.updated_at,
    html_url: pick.repo.html_url,
  }))
}

export async function GET(request: NextRequest) {
  try {
    const session = (await getServerSession(authConfig as any)) as any

    // Allow authenticated users (GitHub, Google, or any provider) and guests
    // For guests/unauthenticated users, they must provide githubUsername parameter
    const { searchParams } = new URL(request.url)
    const providedGithubUsername = searchParams.get("githubUsername")?.trim() || null

    // If no session and no GitHub username provided, require authentication or GitHub username
    if (!session?.user && !providedGithubUsername) {
      return NextResponse.json(
        { error: "Authentication required or provide githubUsername query parameter" },
        { status: 401 },
      )
    }

    // Use session user ID if available, otherwise use guest identifier with GitHub username
    const userId = (session?.user as any)?.id || `guest:${providedGithubUsername || "anonymous"}`
    const octokit = createOctokit()
    const convexClient = getConvexClient()

    // Get GitHub username - prioritize provided username, then try auto-detection
    let githubUsername: string | null = null

    if (providedGithubUsername) {
      // Validate provided username
      try {
        const { data } = await octokit.users.getByUsername({
          username: providedGithubUsername,
        })
        githubUsername = data.login
      } catch (error) {
        return NextResponse.json({ error: `Invalid GitHub username: ${providedGithubUsername}` }, { status: 400 })
      }
    } else if (session?.user) {
      // Try to auto-detect from session
      githubUsername = await getGitHubUsername(session, octokit, convexClient)
    }

    if (!githubUsername) {
      // Fallback: Use top languages from user preferences or return beginner-friendly repos
      return await getFallbackRecommendations()
    }

    // Check cache first (include username in cache key for proper caching)
    const cacheKey = `contribution-picks:${userId}:${githubUsername}`
    try {
      const cached = await redis.get<Repository[]>(cacheKey)
      if (cached) {
        return NextResponse.json({ repositories: cached })
      }
    } catch (error) {
      console.warn("Cache read error:", error)
    }

    // Build user profile
    let userProfile
    try {
      userProfile = await buildUserProfile(octokit, githubUsername)
    } catch (error) {
      console.warn("Failed to build user profile, using fallback:", error)
      return await getFallbackRecommendations()
    }

    // Get user's existing repos (starred, forked, owned) to exclude
    let existingRepoIds: Set<string> = new Set()
    try {
      existingRepoIds = await getUserExistingRepos(octokit, githubUsername)
      console.log(`[Groq] User has ${existingRepoIds.size} existing repos to exclude`)
    } catch (error) {
      console.warn("Failed to fetch user's existing repos:", error)
    }

    // Get candidate repositories based on user's profile
    const candidateRepos = await getCandidateRepositories(octokit, userProfile, existingRepoIds)
    console.log(`[Groq] Found ${candidateRepos.length} candidate repos (excluding ${existingRepoIds.size} existing)`)

    if (candidateRepos.length === 0) {
      return await getFallbackRecommendations()
    }

    // Use Groq to analyze and select best matching repos
    const groqSelectedRepos = await getGroqRecommendations(userProfile, candidateRepos, existingRepoIds)
    console.log(`[Groq] Selected ${groqSelectedRepos.length} repos via Groq analysis`)

    // If Groq didn't return enough, fallback to scoring
    let finalRepos = groqSelectedRepos
    if (finalRepos.length < 5) {
      // Score remaining candidates and add top ones
      const scoredRepos: Array<{ repo: any; score: number }> = []
      
      for (const repo of candidateRepos) {
        if (existingRepoIds.has(repo.full_name)) continue
        if (groqSelectedRepos.some((r) => r.full_name === repo.full_name)) continue

        try {
          const signals = await extractRepoSignals(octokit, repo)
          const score = scoreRepository(userProfile, signals, repo)
          scoredRepos.push({ repo, score })
        } catch (error) {
          console.warn(`Failed to score repo ${repo.full_name}:`, error)
        }
      }

      scoredRepos.sort((a, b) => b.score - a.score)
      const topScored = scoredRepos.slice(0, 10 - finalRepos.length).map((item) => item.repo)
      finalRepos = [...finalRepos, ...topScored]
    }

    // Limit to 10 repos
    finalRepos = finalRepos.slice(0, 10)

    // Convert to repository format and enhance with Groq data
    const enhancedRepositories = await Promise.all(
      finalRepos.map(async (repo) => {
        try {
          const repoSignals = await extractRepoSignals(octokit, repo)
          const groqData = (repo as any).groqData
          const { reason, matchFactors, firstSteps, matchScore, difficulty } = await generateMatchReasoning(
            userProfile,
            repo,
            repoSignals,
            groqData,
          )

          return {
            id: repo.id,
            name: repo.name,
            full_name: repo.full_name,
            description: repo.description || "",
            url: repo.html_url,
            language: repo.language || "",
            stargazers_count: repo.stargazers_count,
            forks_count: repo.forks_count,
            watchers_count: 0,
            open_issues_count: repo.open_issues_count || 0,
            owner: {
              login: repo.owner?.login || "",
              avatar_url: repo.owner?.avatar_url || "",
            },
            topics: repo.topics || [],
            updated_at: repo.updated_at,
            html_url: repo.html_url,
            matchReason: reason,
            matchFactors,
            firstSteps,
            matchScore,
            difficulty,
          }
        } catch (error) {
          console.error(`Failed to process repo ${repo.full_name}:`, error)
          return null
        }
      }),
    )

    const repositories = enhancedRepositories.filter((r) => r !== null) as any[]

    // Cache results
    try {
      await redis.set(cacheKey, enhancedRepositories, { ex: CACHE_DURATION })
    } catch (error) {
      console.warn("Failed to cache results:", error)
    }

    return NextResponse.json({ repositories: enhancedRepositories })
  } catch (error) {
    console.error("Error generating contribution picks:", error)
    return await getFallbackRecommendations()
  }
}

/**
 * Fallback recommendations in Repository format
 */
async function getFallbackRecommendations(): Promise<NextResponse> {
  const octokit = createOctokit()

  try {
    const { data } = await octokit.search.repos({
      q: "is:public label:good-first-issue stars:>100",
      sort: "stars",
      order: "desc",
      per_page: 10,
    })

    const repositories: Repository[] = data.items.slice(0, 10).map((repo) => ({
      id: repo.id,
      name: repo.name,
      full_name: repo.full_name,
      description: repo.description || "",
      url: repo.html_url,
      language: repo.language || "",
      stargazers_count: repo.stargazers_count,
      forks_count: repo.forks_count,
      watchers_count: 0,
      open_issues_count: repo.open_issues_count || 0,
      owner: {
        login: repo.owner?.login || "",
        avatar_url: repo.owner?.avatar_url || "",
      },
      topics: repo.topics || [],
      updated_at: repo.updated_at || new Date().toISOString(),
      html_url: repo.html_url,
    }))

    return NextResponse.json({ repositories })
  } catch (error) {
    console.error("Fallback recommendations failed:", error)
    return NextResponse.json({ repositories: [] })
  }
}
