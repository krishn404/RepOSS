import type { Octokit } from "@octokit/rest"
import type { UserProfile, RepoSignals, ContributionPick } from "@/types/index"

export async function buildUserProfile(octokit: Octokit, username: string): Promise<UserProfile> {
  const languages = new Map<string, number>()
  const topics = new Set<string>()
  const frameworks = new Set<string>()
  const activeRepos: UserProfile["activeRepos"] = []
  const repoTypes = { apps: 0, libraries: 0, tooling: 0 }
  let lastActivityWindow = 365 // default to 1 year

  try {
    // Get user's owned repositories
    const { data: ownedRepos } = await octokit.repos.listForUser({
      username,
      sort: "updated",
      per_page: 100,
      type: "owner",
    })

    // Get languages from owned repos
    for (const repo of ownedRepos.slice(0, 50)) {
      if (repo.language) {
        languages.set(repo.language, (languages.get(repo.language) || 0) + (repo.size || 0))
      }

      // Infer repo type
      const name = repo.name.toLowerCase()
      const desc = (repo.description || "").toLowerCase()
      if (name.includes("app") || name.includes("web") || desc.includes("application")) {
        repoTypes.apps++
      } else if (name.includes("lib") || desc.includes("library")) {
        repoTypes.libraries++
      } else if (name.includes("cli") || name.includes("tool") || desc.includes("tool")) {
        repoTypes.tooling++
      }

      // Track active repos (updated in last 90 days)
      const pushedAt = repo.pushed_at ? new Date(repo.pushed_at).getTime() : 0
      const daysSincePush = (Date.now() - pushedAt) / (1000 * 60 * 60 * 24)
      if (daysSincePush < 90) {
        activeRepos.push({
          fullName: repo.full_name,
          language: repo.language || null,
          pushedAt: repo.pushed_at || "",
          topics: repo.topics || [],
        })
      }

      // Update last activity window
      if (pushedAt > 0) {
        const days = (Date.now() - pushedAt) / (1000 * 60 * 60 * 24)
        if (days < lastActivityWindow) {
          lastActivityWindow = Math.floor(days)
        }
      }
    }

    // Get starred repositories (topics and ecosystems)
    try {
      const { data: starredRepos } = await octokit.activity.listReposStarredByUser({
        username,
        per_page: 100,
        sort: "updated",
      })

      for (const repo of starredRepos) {
        // Collect topics
        if (repo.topics) {
          repo.topics.forEach((topic) => topics.add(topic))
        }

        // Infer frameworks from topics and description
        const desc = (repo.description || "").toLowerCase()
        const allText = `${repo.name} ${desc} ${(repo.topics || []).join(" ")}`.toLowerCase()

        if (allText.includes("react") || allText.includes("next.js")) frameworks.add("React")
        if (allText.includes("vue")) frameworks.add("Vue")
        if (allText.includes("angular")) frameworks.add("Angular")
        if (allText.includes("express") || allText.includes("koa")) frameworks.add("Node.js")
        if (allText.includes("django") || allText.includes("flask")) frameworks.add("Python")
        if (allText.includes("rails")) frameworks.add("Ruby on Rails")
        if (allText.includes("spring")) frameworks.add("Spring")
        if (allText.includes("gin") || allText.includes("echo")) frameworks.add("Go")
        if (allText.includes("actix") || allText.includes("rocket")) frameworks.add("Rust")
      }
    } catch (error) {
      console.warn("Failed to fetch starred repos:", error)
    }

    // Get recent activity (commits)
    try {
      const { data: events } = await octokit.activity.listPublicEventsForUser({
        username,
        per_page: 30,
      })

      for (const event of events) {
        if (event.type === "PushEvent" && event.created_at) {
          const eventTime = new Date(event.created_at).getTime()
          const days = (Date.now() - eventTime) / (1000 * 60 * 60 * 24)
          if (days < lastActivityWindow) {
            lastActivityWindow = Math.floor(days)
          }
        }
      }
    } catch (error) {
      console.warn("Failed to fetch user events:", error)
    }
  } catch (error) {
    console.warn("Error building user profile:", error)
  }

  return {
    languages,
    topics,
    frameworks,
    activeRepos,
    repoTypes,
    lastActivityWindow: Math.min(lastActivityWindow, 365),
  }
}

export async function extractRepoSignals(
  octokit: Octokit,
  repo: {
    id: number
    full_name: string
    language: string | null
    topics: string[]
    description: string | null
    stargazers_count: number
    forks_count: number
    open_issues_count: number
    updated_at: string
    pushed_at?: string
  },
): Promise<RepoSignals> {
  const [owner, repoName] = repo.full_name.split("/")
  const languages: string[] = []
  const topics: string[] = [...(repo.topics || [])]
  const frameworks: Set<string> = new Set()

  // Get languages
  try {
    const { data: langData } = await octokit.repos.listLanguages({
      owner,
      repo: repoName,
    })
    languages.push(...Object.keys(langData).slice(0, 3))
    if (repo.language && !languages.includes(repo.language)) {
      languages.unshift(repo.language)
    }
  } catch (error) {
    if (repo.language) languages.push(repo.language)
  }

  // Infer frameworks from topics and description
  const desc = (repo.description || "").toLowerCase()
  const allText = `${repo.name} ${desc} ${topics.join(" ")}`.toLowerCase()

  if (allText.includes("react") || allText.includes("next.js") || topics.includes("react")) {
    frameworks.add("React")
  }
  if (allText.includes("vue") || topics.includes("vue")) frameworks.add("Vue")
  if (allText.includes("angular") || topics.includes("angular")) frameworks.add("Angular")
  if (allText.includes("express") || allText.includes("koa") || topics.includes("express")) {
    frameworks.add("Node.js")
  }
  if (allText.includes("django") || allText.includes("flask") || topics.includes("django")) {
    frameworks.add("Python")
  }
  if (allText.includes("rails") || topics.includes("rails")) frameworks.add("Ruby on Rails")
  if (allText.includes("spring") || topics.includes("spring")) frameworks.add("Spring")
  if (allText.includes("gin") || allText.includes("echo") || topics.includes("golang")) {
    frameworks.add("Go")
  }
  if (allText.includes("actix") || allText.includes("rocket") || topics.includes("rust")) {
    frameworks.add("Rust")
  }

  // Check for contribution-friendly files
  let hasContributing = false
  let hasCodeOfConduct = false
  try {
    const { data: contents } = await octokit.repos.getContent({
      owner,
      repo: repoName,
      path: "",
    })
    if (Array.isArray(contents)) {
      const fileNames = contents.map((item: any) => item.name.toLowerCase())
      hasContributing = fileNames.some((name) => name.includes("contributing"))
      hasCodeOfConduct = fileNames.some((name) => name.includes("code-of-conduct") || name.includes("conduct"))
    }
  } catch (error) {
    // Non-fatal
  }

  // Check for good first issue and help wanted labels
  let hasGoodFirstIssue = false
  let hasHelpWanted = false
  try {
    const { data: issues } = await octokit.issues.listForRepo({
      owner,
      repo: repoName,
      labels: "good first issue",
      state: "open",
      per_page: 1,
    })
    hasGoodFirstIssue = issues.length > 0
  } catch (error) {
    // Non-fatal
  }

  try {
    const { data: issues } = await octokit.issues.listForRepo({
      owner,
      repo: repoName,
      labels: "help wanted",
      state: "open",
      per_page: 1,
    })
    hasHelpWanted = issues.length > 0
  } catch (error) {
    // Non-fatal
  }

  // Maintenance health (0-100)
  const pushedAt = repo.pushed_at ? new Date(repo.pushed_at).getTime() : 0
  const daysSincePush = pushedAt > 0 ? (Date.now() - pushedAt) / (1000 * 60 * 60 * 24) : 365
  const recentCommits = daysSincePush < 30
  let maintenanceHealth = 50

  if (recentCommits) maintenanceHealth += 30
  if (daysSincePush < 90) maintenanceHealth += 10
  if (repo.open_issues_count < 50) maintenanceHealth += 10
  if (repo.stargazers_count > 100) maintenanceHealth += 10

  // Contribution friendliness (0-100)
  let contributionFriendliness = 30
  if (hasGoodFirstIssue) contributionFriendliness += 25
  if (hasHelpWanted) contributionFriendliness += 20
  if (hasContributing) contributionFriendliness += 15
  if (hasCodeOfConduct) contributionFriendliness += 10

  // Open issues trend (simplified - would need historical data for real trend)
  const openIssuesTrend: "increasing" | "stable" | "decreasing" =
    repo.open_issues_count > 100 ? "increasing" : repo.open_issues_count < 20 ? "decreasing" : "stable"

  // Infer repo type
  const name = repo.full_name.toLowerCase()
  const repoType: "app" | "library" | "tool" | "unknown" =
    name.includes("app") || desc.includes("application")
      ? "app"
      : name.includes("lib") || desc.includes("library")
        ? "library"
        : name.includes("cli") || name.includes("tool") || desc.includes("tool")
          ? "tool"
          : "unknown"

  // Estimate complexity
  let complexity: "Easy" | "Medium" | "Hard" = "Medium"
  if (repo.stargazers_count < 100 && languages.length <= 1) {
    complexity = "Easy"
  } else if (repo.stargazers_count > 1000 || languages.length > 3) {
    complexity = "Hard"
  }

  return {
    languages,
    topics,
    frameworks: Array.from(frameworks),
    maintenanceHealth: Math.min(100, Math.max(0, maintenanceHealth)),
    contributionFriendliness: Math.min(100, Math.max(0, contributionFriendliness)),
    repoType,
    complexity,
    hasGoodFirstIssue,
    hasHelpWanted,
    hasContributing,
    hasCodeOfConduct,
    recentCommits,
    openIssuesTrend,
  }
}

export function scoreRepository(
  userProfile: UserProfile,
  repoSignals: RepoSignals,
  repo: { full_name: string; description: string | null; stargazers_count: number },
): number {
  let score = 0

  // Language match (highest weight: 40 points)
  const userLanguages = Array.from(userProfile.languages.keys())
  const languageMatches = repoSignals.languages.filter((lang) => userLanguages.includes(lang))
  if (languageMatches.length > 0) {
    score += 40 * (languageMatches.length / Math.max(repoSignals.languages.length, 1))
  } else {
    // Partial penalty for no language match
    score -= 10
  }

  // Framework/tooling match (20 points)
  const frameworkMatches = repoSignals.frameworks.filter((fw) => userProfile.frameworks.has(fw))
  if (frameworkMatches.length > 0) {
    score += 20
  }

  // Interest alignment from topics (15 points)
  const topicMatches = repoSignals.topics.filter((topic) => userProfile.topics.has(topic))
  if (topicMatches.length > 0) {
    score += 15 * Math.min(topicMatches.length / 3, 1)
  }

  // Activity alignment (10 points)
  if (repoSignals.recentCommits) {
    score += 10
  } else {
    score -= 5
  }

  // Contribution entry ease (15 points)
  score += (repoSignals.contributionFriendliness / 100) * 15

  // Maintenance health bonus (5 points)
  score += (repoSignals.maintenanceHealth / 100) * 5

  // Repo type alignment (5 points)
  const userPrefersApps = userProfile.repoTypes.apps > userProfile.repoTypes.libraries
  const userPrefersLibraries = userProfile.repoTypes.libraries > userProfile.repoTypes.apps
  if (
    (userPrefersApps && repoSignals.repoType === "app") ||
    (userPrefersLibraries && repoSignals.repoType === "library")
  ) {
    score += 5
  }

  // Normalize to 0-100
  return Math.min(100, Math.max(0, score))
}

export function generateRecommendationDetails(
  userProfile: UserProfile,
  repoSignals: RepoSignals,
  repo: { full_name: string; description: string | null },
): {
  reason: string
  match_factors: string[]
  first_steps: string
} {
  const matchFactors: string[] = []
  const reasons: string[] = []

  // Language match
  const userLanguages = Array.from(userProfile.languages.keys())
  const languageMatches = repoSignals.languages.filter((lang) => userLanguages.includes(lang))
  if (languageMatches.length > 0) {
    matchFactors.push(languageMatches[0])
    reasons.push(`matches your ${languageMatches[0]} experience`)
  }

  // Framework match
  const frameworkMatches = repoSignals.frameworks.filter((fw) => userProfile.frameworks.has(fw))
  if (frameworkMatches.length > 0) {
    matchFactors.push(frameworkMatches[0])
    reasons.push(`uses ${frameworkMatches[0]}`)
  }

  // Contribution friendliness
  if (repoSignals.hasGoodFirstIssue) {
    matchFactors.push("good first issues")
    reasons.push("has good first issues")
  }
  if (repoSignals.hasHelpWanted) {
    matchFactors.push("help wanted")
  }
  if (repoSignals.hasContributing) {
    matchFactors.push("contributing guide")
  }

  // Activity
  if (repoSignals.recentCommits) {
    matchFactors.push("recently active")
    reasons.push("actively maintained")
  }

  // Generate reason
  let reason = `This ${repoSignals.complexity.toLowerCase()} project`
  if (reasons.length > 0) {
    reason += ` ${reasons.slice(0, 2).join(" and ")}`
  } else {
    reason += " aligns with your interests"
  }

  // Generate first steps
  let firstSteps = "Explore the repository and read the README"
  if (repoSignals.hasGoodFirstIssue) {
    firstSteps = "Pick a good first issue to get started"
  } else if (repoSignals.hasContributing) {
    firstSteps = "Read the CONTRIBUTING.md guide"
  } else if (repoSignals.hasHelpWanted) {
    firstSteps = "Look for help wanted issues"
  } else if (repo.description && repo.description.length < 100) {
    firstSteps = "Improve documentation"
  } else {
    firstSteps = "Add tests or fix a small bug"
  }

  return {
    reason,
    match_factors: matchFactors.slice(0, 4),
    first_steps: firstSteps,
  }
}

export function ensureDiversity(picks: ContributionPick[], minCount = 5, maxCount = 10): ContributionPick[] {
  if (picks.length <= maxCount) {
    return picks.slice(0, maxCount)
  }

  // Group by primary language/framework
  const groups = new Map<string, ContributionPick[]>()
  for (const pick of picks) {
    const primaryFactor = pick.match_factors[0] || "other"
    if (!groups.has(primaryFactor)) {
      groups.set(primaryFactor, [])
    }
    groups.get(primaryFactor)!.push(pick)
  }

  // Select top picks from each group
  const diverse: ContributionPick[] = []
  const groupEntries = Array.from(groups.entries()).sort((a, b) => b[1].length - a[1].length)

  for (const [, groupPicks] of groupEntries) {
    if (diverse.length >= maxCount) break
    const toAdd = Math.min(2, groupPicks.length, maxCount - diverse.length)
    diverse.push(...groupPicks.slice(0, toAdd))
  }

  // Fill remaining slots with highest scores
  if (diverse.length < minCount) {
    const remaining = picks
      .filter((p) => !diverse.includes(p))
      .sort((a, b) => b.score - a.score)
      .slice(0, minCount - diverse.length)
    diverse.push(...remaining)
  }

  return diverse.slice(0, maxCount)
}
