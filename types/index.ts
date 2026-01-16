export interface Repository {
  id: number
  name: string
  full_name: string
  description: string
  url: string
  language: string
  stargazers_count: number
  forks_count: number
  watchers_count: number
  open_issues_count: number
  owner: {
    avatar_url: string
    login: string
  }
}

export interface User {
  id: string
  name?: string
  email?: string
  image?: string
  provider?: string
}

export interface SearchResult {
  repositories: Repository[]
  hasMore: boolean
  total: number
  page: number
}

export interface UserProfile {
  languages: Map<string, number> // language -> bytes count
  topics: Set<string> // topics from starred repos
  frameworks: Set<string> // inferred frameworks
  activeRepos: Array<{
    fullName: string
    language: string | null
    pushedAt: string
    topics: string[]
  }>
  repoTypes: {
    apps: number
    libraries: number
    tooling: number
  }
  lastActivityWindow: number // days since last commit
}

export interface RepoSignals {
  languages: string[]
  topics: string[]
  frameworks: string[]
  maintenanceHealth: number // 0-100
  contributionFriendliness: number // 0-100
  repoType: "app" | "library" | "tool" | "unknown"
  complexity: "Easy" | "Medium" | "Hard"
  hasGoodFirstIssue: boolean
  hasHelpWanted: boolean
  hasContributing: boolean
  hasCodeOfConduct: boolean
  recentCommits: boolean
  openIssuesTrend: "increasing" | "stable" | "decreasing"
}

export interface ContributionPick {
  name: string
  url: string
  score: number
  difficulty: "Easy" | "Medium" | "Hard"
  reason: string
  match_factors: string[]
  first_steps: string
}
