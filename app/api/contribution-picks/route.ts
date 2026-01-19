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
 * Major organizations to prioritize
 */
const MAJOR_ORGS = [
  'facebook', 'meta', 'google', 'vercel', 'microsoft', 
  'shopify', 'stripe', 'netflix', 'aws', 'amazon'
]

/**
 * Filter repositories to only include active, high-quality repos
 */
function filterActiveRepos(repos: any[]): any[] {
  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
  const sixMonthsAgoISO = sixMonthsAgo.toISOString().split('T')[0]

  return repos.filter((repo: any) => {
    // Must have pushed_at within last 6 months
    if (!repo.pushed_at || new Date(repo.pushed_at) < sixMonthsAgo) {
      return false
    }

    // Must have at least 500 stars
    if (repo.stargazers_count < 500) {
      return false
    }

    // Must not be archived
    if (repo.archived === true) {
      return false
    }

    // Must be from major orgs OR have 1000+ stars (for smaller orgs)
    const owner = repo.owner?.login?.toLowerCase() || ''
    const isMajorOrg = MAJOR_ORGS.some(org => owner.includes(org))
    const hasHighStars = repo.stargazers_count >= 1000

    return isMajorOrg || hasHighStars
  })
}

/**
 * Get user's last 10 commits to extract keywords for matching
 */
async function getUserCommitKeywords(
  octokit: ReturnType<typeof createOctokit>,
  username: string,
): Promise<Set<string>> {
  const keywords = new Set<string>()
  
  try {
    // Get user's public events to find recent commits
    const { data: events } = await octokit.activity.listPublicEventsForUser({
      username,
      per_page: 30,
    })

    // Extract commit messages from PushEvents
    let commitCount = 0
    for (const event of events) {
      if (event.type === 'PushEvent' && 'payload' in event && commitCount < 10) {
        const payload = event.payload as any
        if (payload.commits && Array.isArray(payload.commits)) {
          for (const commit of payload.commits.slice(0, 10 - commitCount)) {
            if (commit.message) {
              // Extract keywords from commit message
              const message = commit.message.toLowerCase()
              // Split by common separators and extract meaningful words
              const words = message
                .split(/[\s\-_\/:]+/)
                .filter(word => 
                  word.length > 3 && 
                  !['fix', 'add', 'update', 'remove', 'change', 'refactor'].includes(word)
                )
                .slice(0, 5) // Take top 5 words per commit
              
              words.forEach(word => keywords.add(word))
              commitCount++
              if (commitCount >= 10) break
            }
          }
        }
      }
      if (commitCount >= 10) break
    }
  } catch (error) {
    console.warn('Failed to fetch user commits for keyword extraction:', error)
  }

  return keywords
}

/**
 * Score repository based on commit keyword matches
 */
function scoreByCommitKeywords(
  repo: any,
  commitKeywords: Set<string>,
): number {
  if (commitKeywords.size === 0) return 0

  let score = 0
  const repoText = `${repo.name} ${repo.description || ''} ${(repo.topics || []).join(' ')}`.toLowerCase()

  // Check for keyword matches in repo name, description, and topics
  for (const keyword of commitKeywords) {
    if (repoText.includes(keyword.toLowerCase())) {
      score += 10 // 10 points per keyword match
    }
  }

  return Math.min(100, score) // Cap at 100
}

/**
 * Get candidate repositories from GitHub based on user's profile
 * Filters for active repos only: <6 months old, 500+ stars, not archived, major orgs
 */
async function getCandidateRepositories(
  octokit: ReturnType<typeof createOctokit>,
  userProfile: UserProfile,
  existingRepos: Set<string>,
  commitKeywords?: Set<string>,
): Promise<any[]> {
  const repos: any[] = []
  const userLanguages = Array.from(userProfile.languages.keys()).slice(0, 3) // Top 3 languages
  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
  const sixMonthsAgoISO = sixMonthsAgo.toISOString().split('T')[0]

  // Build org filter for major organizations
  const orgFilter = MAJOR_ORGS.map(org => `user:${org}`).join(' OR ')

  // Search for repos based on user's primary languages from major orgs
  for (const lang of userLanguages) {
    try {
      const { data } = await octokit.search.repos({
        q: `language:${lang} is:public stars:>500 pushed:>${sixMonthsAgoISO} (${orgFilter})`,
        sort: "updated",
        order: "desc",
        per_page: 30,
      })
      
      // Filter out existing repos and apply additional filters
      const filtered = data.items.filter((repo: any) => 
        !existingRepos.has(repo.full_name) &&
        !repo.archived &&
        repo.pushed_at &&
        new Date(repo.pushed_at) >= sixMonthsAgo
      )
      repos.push(...filtered)
    } catch (error) {
      console.warn(`Failed to search repos for language ${lang}:`, error)
    }
  }

  // Search for recently active repos from major orgs (prioritize last 30 days)
  try {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const thirtyDaysAgoISO = thirtyDaysAgo.toISOString().split('T')[0]

    const { data } = await octokit.search.repos({
      q: `is:public stars:>500 pushed:>${thirtyDaysAgoISO} (${orgFilter})`,
      sort: "updated",
      order: "desc",
      per_page: 50,
    })
    
    const filtered = data.items.filter((repo: any) => 
      !existingRepos.has(repo.full_name) &&
      !repo.archived &&
      repo.pushed_at &&
      new Date(repo.pushed_at) >= sixMonthsAgo
    )
    repos.push(...filtered)
  } catch (error) {
    console.warn("Failed to search recently active repos:", error)
  }

  // Also search for high-star repos (1000+) that are active, even if not from major orgs
  try {
    const { data } = await octokit.search.repos({
      q: `is:public stars:>1000 pushed:>${sixMonthsAgoISO}`,
      sort: "updated",
      order: "desc",
      per_page: 30,
    })
    
    const filtered = data.items.filter((repo: any) => 
      !existingRepos.has(repo.full_name) &&
      !repo.archived &&
      repo.pushed_at &&
      new Date(repo.pushed_at) >= sixMonthsAgo
    )
    repos.push(...filtered)
  } catch (error) {
    console.warn("Failed to search high-star repos:", error)
  }

  // Remove duplicates and apply final filtering
  const uniqueRepos = new Map<string, any>()
  for (const repo of repos) {
    if (!uniqueRepos.has(repo.full_name) && !existingRepos.has(repo.full_name)) {
      uniqueRepos.set(repo.full_name, repo)
    }
  }

  let finalRepos = Array.from(uniqueRepos.values())
  
  // Apply active repo filters
  finalRepos = filterActiveRepos(finalRepos)

  // If we have commit keywords, prioritize repos that match
  if (commitKeywords && commitKeywords.size > 0) {
    finalRepos = finalRepos.map(repo => ({
      ...repo,
      _commitMatchScore: scoreByCommitKeywords(repo, commitKeywords),
    }))
    
    // Sort by commit match score (higher first), then by updated date
    finalRepos.sort((a, b) => {
      if (b._commitMatchScore !== a._commitMatchScore) {
        return b._commitMatchScore - a._commitMatchScore
      }
      return new Date(b.pushed_at || b.updated_at).getTime() - new Date(a.pushed_at || a.updated_at).getTime()
    })
  } else {
    // Sort by recency (prioritize repos active in last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    finalRepos.sort((a, b) => {
      const aPushed = new Date(a.pushed_at || a.updated_at)
      const bPushed = new Date(b.pushed_at || b.updated_at)
      const aRecent = aPushed >= thirtyDaysAgo
      const bRecent = bPushed >= thirtyDaysAgo
      
      // Prioritize repos active in last 30 days
      if (aRecent && !bRecent) return -1
      if (!aRecent && bRecent) return 1
      
      // Then sort by recency
      return bPushed.getTime() - aPushed.getTime()
    })
  }

  return finalRepos
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

    // Check for previously shown repos to avoid repeats
    const previouslyShownKey = `contribution-picks-shown:${userId}:${githubUsername}`
    let previouslyShownRepos: Set<string> = new Set()
    
    const forceRefresh = searchParams.get("refresh") === "true"
    
    // On refresh, we want to exclude ALL previously shown repos to get 100% new list
    if (forceRefresh) {
      try {
        const shown = await redis.get<string[]>(previouslyShownKey)
        if (shown) {
          previouslyShownRepos = new Set(shown)
          console.log(`[Refresh] Excluding ${previouslyShownRepos.size} previously shown repos for fresh recommendations`)
        }
      } catch (error) {
        console.warn("Failed to fetch previously shown repos:", error)
      }
    } else {
      // Normal flow: check cache first
      try {
        const shown = await redis.get<string[]>(previouslyShownKey)
        if (shown) {
          previouslyShownRepos = new Set(shown)
          console.log(`[Groq] Excluding ${previouslyShownRepos.size} previously shown repos`)
        }
      } catch (error) {
        console.warn("Failed to fetch previously shown repos:", error)
      }
    }

    // Check cache first (include username in cache key for proper caching)
    // But bypass cache if we need fresh recommendations (when explicitly requested)
    const includeProgress = searchParams.get("includeProgress") === "true"
    const cacheKey = `contribution-picks:${userId}:${githubUsername}`
    
    if (!forceRefresh) {
      try {
        const cached = await redis.get<Repository[]>(cacheKey)
        if (cached) {
          // Filter out previously shown repos if we have any
          if (previouslyShownRepos.size > 0) {
            const filtered = cached.filter((r) => !previouslyShownRepos.has(r.full_name))
            if (filtered.length >= 5) {
              return NextResponse.json({ repositories: filtered.slice(0, 10) })
            }
            // If we filtered out too many, continue to generate fresh ones
          } else {
            return NextResponse.json({ repositories: cached })
          }
        }
      } catch (error) {
        console.warn("Cache read error:", error)
      }
    } else {
      // On refresh, clear cache to force fresh generation
      try {
        await redis.del(cacheKey)
        console.log("[Refresh] Cleared cache to generate fresh recommendations")
      } catch (error) {
        console.warn("Failed to clear cache on refresh:", error)
      }
    }

    // Helper function to send progress (if streaming supported)
    const sendProgress = (progress: number, message: string) => {
      // Progress steps are tracked but sent via response metadata
      // Real streaming would require SSE/WebSocket implementation
      console.log(`[Progress] ${progress}%: ${message}`)
    }

    // Build user profile
    sendProgress(10, "Analyzing your GitHub profile...")
    let userProfile
    try {
      userProfile = await buildUserProfile(octokit, githubUsername)
      sendProgress(25, "Profile analysis complete")
    } catch (error) {
      console.warn("Failed to build user profile, using fallback:", error)
      return await getFallbackRecommendations()
    }

    // Get user's commit keywords for better matching
    sendProgress(27, "Analyzing your recent commits...")
    const commitKeywords = await getUserCommitKeywords(octokit, githubUsername)
    console.log(`[Matching] Extracted ${commitKeywords.size} keywords from user's commits`)

    // Get user's existing repos (starred, forked, owned) to exclude
    sendProgress(30, "Checking your existing repositories...")
    let existingRepoIds: Set<string> = new Set()
    try {
      existingRepoIds = await getUserExistingRepos(octokit, githubUsername)
      console.log(`[Groq] User has ${existingRepoIds.size} existing repos to exclude`)
      sendProgress(40, `Found ${existingRepoIds.size} repositories to exclude`)
    } catch (error) {
      console.warn("Failed to fetch user's existing repos:", error)
    }

    // Combine existing repos and previously shown repos for exclusion
    const allExcludedRepos = new Set([...existingRepoIds, ...previouslyShownRepos])

    // Get candidate repositories based on user's profile (with commit keyword matching)
    sendProgress(50, "Searching for matching repositories...")
    const candidateRepos = await getCandidateRepositories(octokit, userProfile, allExcludedRepos, commitKeywords)
    console.log(`[Groq] Found ${candidateRepos.length} candidate repos (excluding ${allExcludedRepos.size} total: ${existingRepoIds.size} existing + ${previouslyShownRepos.size} previously shown)`)
    sendProgress(60, `Found ${candidateRepos.length} potential matches`)

    if (candidateRepos.length === 0) {
      return await getFallbackRecommendations()
    }

    // Use Groq to analyze and select best matching repos
    sendProgress(70, "Analyzing repositories with AI...")
    const groqSelectedRepos = await getGroqRecommendations(userProfile, candidateRepos, allExcludedRepos)
    console.log(`[Groq] Selected ${groqSelectedRepos.length} repos via Groq analysis`)
    sendProgress(85, `Selected ${groqSelectedRepos.length} best matches`)

    // If Groq didn't return enough, fallback to scoring
    let finalRepos = groqSelectedRepos
    if (finalRepos.length < 5) {
      // Score remaining candidates and add top ones
      const scoredRepos: Array<{ repo: any; score: number }> = []
      
      for (const repo of candidateRepos) {
        if (allExcludedRepos.has(repo.full_name)) continue
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
    sendProgress(90, "Generating personalized recommendations...")
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
    sendProgress(95, "Finalizing recommendations...")

    // Update previously shown repos list (track all shown repo IDs for refresh exclusion)
    try {
      const newShownRepos = repositories.map((r: any) => r.full_name)
      // On refresh, replace the list; otherwise append (keep last 100 to ensure variety)
      const updatedShown = forceRefresh 
        ? newShownRepos // On refresh, start fresh with new repos
        : [...Array.from(previouslyShownRepos), ...newShownRepos].slice(-100) // Keep last 100
      
      await redis.set(previouslyShownKey, updatedShown, { ex: CACHE_DURATION * 2 }) // Keep for 2x cache duration
      console.log(`[Tracking] Updated shown repos list: ${updatedShown.length} total (${newShownRepos.length} new)`)
    } catch (error) {
      console.warn("Failed to update previously shown repos:", error)
    }

    // Cache results
    try {
      await redis.set(cacheKey, enhancedRepositories, { ex: CACHE_DURATION })
    } catch (error) {
      console.warn("Failed to cache results:", error)
    }

    sendProgress(100, "Recommendations ready!")

    return NextResponse.json({ repositories: enhancedRepositories })
  } catch (error) {
    console.error("Error generating contribution picks:", error)
    return await getFallbackRecommendations()
  }
}

/**
 * Fallback recommendations in Repository format
 * Uses same filtering criteria: active repos only
 */
async function getFallbackRecommendations(): Promise<NextResponse> {
  const octokit = createOctokit()
  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
  const sixMonthsAgoISO = sixMonthsAgo.toISOString().split('T')[0]
  const orgFilter = MAJOR_ORGS.map(org => `user:${org}`).join(' OR ')

  try {
    const { data } = await octokit.search.repos({
      q: `is:public stars:>500 pushed:>${sixMonthsAgoISO} (${orgFilter})`,
      sort: "updated",
      order: "desc",
      per_page: 10,
    })

    // Apply same filters as main function
    const filtered = filterActiveRepos(data.items)

    const repositories: Repository[] = filtered.slice(0, 10).map((repo) => ({
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