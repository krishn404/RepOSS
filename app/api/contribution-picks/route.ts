import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authConfig } from "@/lib/auth"
import { createOctokit } from "@/lib/github"
import { ConvexHttpClient } from "convex/browser"
import { redis } from "@/lib/redis"
import {
  buildUserProfile,
  extractRepoSignals,
  scoreRepository,
  generateRecommendationDetails,
  ensureDiversity,
  type ContributionPick,
} from "@/lib/contribution-picks"

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
 * Get all repositories from reposs.xyz
 * Fetches from Convex database or falls back to GitHub search
 */
async function getRepossRepositories(
  octokit: ReturnType<typeof createOctokit>,
  convexClient: ConvexHttpClient | null
): Promise<
  Array<{
    id: number
    full_name: string
    name: string
    description: string | null
    language: string | null
    topics: string[]
    stargazers_count: number
    forks_count: number
    open_issues_count: number
    updated_at: string
    pushed_at?: string
    html_url: string
  }>
> {
  const repos: any[] = []

  // Try to get from Convex first
  if (convexClient) {
    try {
      const convexRepos = await convexClient.query("repositories:getAllRepositories" as any, {
        limit: 200,
      })

      if (convexRepos && convexRepos.length > 0) {
        repos.push(...convexRepos)
      }
    } catch (error) {
      console.warn("Failed to fetch from Convex, falling back to GitHub:", error)
    }
  }

  // Fallback: Get popular open-source repos from GitHub
  if (repos.length === 0) {
    try {
      const { data } = await octokit.search.repos({
        q: "is:public stars:>1000",
        sort: "stars",
        order: "desc",
        per_page: 100,
      })

      for (const repo of data.items) {
        repos.push({
          id: repo.id,
          full_name: repo.full_name,
          name: repo.name,
          description: repo.description || null,
          language: repo.language || null,
          topics: repo.topics || [],
          stargazers_count: repo.stargazers_count,
          forks_count: repo.forks_count,
          open_issues_count: repo.open_issues_count || 0,
          updated_at: repo.updated_at,
          pushed_at: repo.pushed_at,
          html_url: repo.html_url,
        })
      }
    } catch (error) {
      console.error("Failed to fetch repositories from GitHub:", error)
    }
  }

  return repos
}

/**
 * Get user's GitHub username from session or GitHub API
 */
async function getGitHubUsername(
  session: any,
  octokit: ReturnType<typeof createOctokit>,
  convexClient: ConvexHttpClient | null
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
          // providerAccountId might be numeric, try fetching user by ID
          try {
            const { data } = await octokit.users.getById({
              user_id: parseInt(user.providerAccountId, 10),
            })
            if (data.login) {
              return data.login
            }
          } catch {
            // Continue to other methods
          }
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

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authConfig)
    
    // Allow authenticated users (GitHub, Google, or any provider) and guests
    // For guests/unauthenticated users, they must provide githubUsername parameter
    const { searchParams } = new URL(request.url)
    const providedGithubUsername = searchParams.get("githubUsername")?.trim() || null

    // If no session and no GitHub username provided, require authentication or GitHub username
    if (!session?.user && !providedGithubUsername) {
      return NextResponse.json(
        { error: "Authentication required or provide githubUsername query parameter" },
        { status: 401 }
      )
    }

    // Use session user ID if available, otherwise use guest identifier with GitHub username
    const userId = session?.user?.id || `guest:${providedGithubUsername || "anonymous"}`
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
        return NextResponse.json(
          { error: `Invalid GitHub username: ${providedGithubUsername}` },
          { status: 400 }
        )
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
      const cached = await redis.get<ContributionPick[]>(cacheKey)
      if (cached) {
        return NextResponse.json(cached)
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

    // Get repositories from reposs.xyz
    const repos = await getRepossRepositories(octokit, convexClient)

    if (repos.length === 0) {
      return await getFallbackRecommendations()
    }

    // Score and rank repositories
    const scoredRepos: Array<ContributionPick & { repo: any; signals: any }> = []

    // Process in batches to avoid rate limits and timeouts
    const batchSize = 10
    for (let i = 0; i < Math.min(repos.length, 100); i += batchSize) {
      const batch = repos.slice(i, i + batchSize)

      const batchPromises = batch.map(async (repo) => {
        try {
          const signals = await extractRepoSignals(octokit, repo)
          const score = scoreRepository(userProfile, signals, repo)
          const details = generateRecommendationDetails(userProfile, signals, repo)

          return {
            name: repo.full_name,
            url: repo.html_url,
            score,
            difficulty: signals.complexity,
            reason: details.reason,
            match_factors: details.match_factors,
            first_steps: details.first_steps,
            repo,
            signals,
          }
        } catch (error) {
          console.warn(`Failed to process repo ${repo.full_name}:`, error)
          return null
        }
      })

      const results = await Promise.all(batchPromises)
      scoredRepos.push(...(results.filter((r) => r !== null) as any))
    }

    // Sort by score and ensure diversity
    scoredRepos.sort((a, b) => b.score - a.score)
    const diversePicks = ensureDiversity(
      scoredRepos.map(({ repo, signals, ...pick }) => pick),
      5,
      10
    )

    // Cache results
    try {
      await redis.set(cacheKey, diversePicks, { ex: CACHE_DURATION })
    } catch (error) {
      console.warn("Failed to cache results:", error)
    }

    return NextResponse.json(diversePicks)
  } catch (error) {
    console.error("Error generating contribution picks:", error)
    return await getFallbackRecommendations()
  }
}

/**
 * Fallback recommendations when GitHub data is minimal
 */
async function getFallbackRecommendations(): Promise<NextResponse> {
  const octokit = createOctokit()

  try {
    // Get beginner-friendly repositories
    const { data } = await octokit.search.repos({
      q: "is:public label:good-first-issue stars:>100",
      sort: "stars",
      order: "desc",
      per_page: 10,
    })

    const picks: ContributionPick[] = data.items.slice(0, 10).map((repo, index) => {
      const languages = repo.language ? [repo.language] : []
      const topics = (repo.topics || []).slice(0, 3)

      return {
        name: repo.full_name,
        url: repo.html_url,
        score: 70 - index * 2, // Decreasing scores
        difficulty: repo.stargazers_count < 500 ? "Easy" : repo.stargazers_count < 2000 ? "Medium" : "Hard",
        reason: `This ${repo.stargazers_count < 500 ? "beginner-friendly" : "popular"} project has good first issues and active maintenance`,
        match_factors: [
          ...languages,
          ...topics.slice(0, 2),
          "good first issues",
          "active community",
        ].slice(0, 4),
        first_steps: "Pick a good first issue to get started",
      }
    })

    return NextResponse.json(picks)
  } catch (error) {
    console.error("Fallback recommendations failed:", error)
    // Ultimate fallback: return empty array
    return NextResponse.json([])
  }
}

