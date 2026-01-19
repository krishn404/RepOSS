"use client"

import { useEffect, useState } from "react"

interface Repo {
  name: string
  owner: string
  description: string
  stars: number
  forks: number
  language: string
  url: string
}

const getLanguageColor = (language: string) => {
  const colors: Record<string, string> = {
    Python: "bg-emerald-500",
    JavaScript: "bg-yellow-500",
    TypeScript: "bg-blue-500",
    Swift: "bg-orange-500",
    Go: "bg-cyan-500",
    Rust: "bg-orange-600",
    Java: "bg-red-500",
    "C++": "bg-pink-500",
    Ruby: "bg-red-600",
  }
  return colors[language] || "bg-gray-500"
}

const getPopularityBadge = (stars: number) => {
  if (stars >= 50000) return { label: "Legendary", color: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" }
  if (stars >= 10000) return { label: "Famous", color: "bg-purple-500/10 text-purple-400 border-purple-500/20" }
  return { label: "Popular", color: "bg-blue-500/10 text-blue-400 border-blue-500/20" }
}

const formatStars = (stars: number) => {
  if (stars >= 1000) return `${(stars / 1000).toFixed(1)}k`
  return stars.toString()
}

export function GitHubRepoTable() {
  const [repos, setRepos] = useState<Repo[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchRepos = async () => {
      try {
        const response = await fetch(
          "/api/opensource?trending=1&trendingPeriod=year&sortBy=stars"
        )

        if (!response.ok) {
          throw new Error(`Failed to load repositories: ${response.status}`)
        }

        const data = await response.json()
        const repositories = Array.isArray(data.repositories) ? data.repositories : []

        const mapped: Repo[] = repositories.slice(0, 6).map((repo: any) => ({
          name: repo.name,
          owner: repo.owner?.login ?? "owner",
          description: repo.description ?? "",
          stars: repo.stargazers_count ?? 0,
          forks: repo.forks_count ?? 0,
          language: repo.language ?? "Other",
          url: repo.html_url ?? "#",
        }))

        setRepos(mapped)
      } catch (error) {
        console.error("[GitHubRepoTable] Error fetching repos:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchRepos()
  }, [])

  if (loading) {
    return (
      <div className="rounded-lg border border-border/60 bg-card/50 backdrop-blur-sm overflow-hidden shadow-sm">
        <div className="p-8 text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent" />
          <p className="mt-3 text-sm text-muted-foreground">Loading repositories...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-border/60 bg-card/50 backdrop-blur-sm overflow-hidden shadow-sm">
      <div className="grid grid-cols-12 gap-3 px-3 py-2.5 border-b border-border/40 bg-muted/30 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
        <div className="col-span-5">Repository</div>
        <div className="col-span-2 hidden sm:block">Language</div>
        <div className="col-span-2 hidden md:block">Forks</div>
        <div className="col-span-1 text-right">Stars</div>
        <div className="col-span-2 text-right">Popularity</div>
      </div>

      <div className="divide-y divide-border/30">
        {repos.slice(0, 4).map((repo) => {
          const popularity = getPopularityBadge(repo.stars)
          return (
            <div
              key={`${repo.owner}-${repo.name}`}
              className="grid grid-cols-12 gap-3 px-3 py-2.5 hover:bg-accent/30 transition-colors cursor-pointer group"
            >
              <div className="col-span-5 flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-full bg-muted border border-border flex-shrink-0" />
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                    {repo.name}
                  </span>
                  <span className="text-xs text-muted-foreground truncate">{repo.owner}</span>
                </div>
              </div>

              <div className="col-span-2 hidden sm:flex items-center">
                {repo.language && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted/60 border border-border/50 text-xs font-medium text-foreground">
                    <span className={`w-2 h-2 rounded-full ${getLanguageColor(repo.language)}`} />
                    {repo.language}
                  </span>
                )}
              </div>

              <div className="col-span-2 hidden md:flex items-center">
                <span className="text-sm text-muted-foreground">{formatStars(repo.forks)}</span>
              </div>

              <div className="col-span-1 flex items-center justify-end">
                <span className="text-sm font-medium text-foreground">{formatStars(repo.stars)}</span>
              </div>

              <div className="col-span-2 flex items-center justify-end">
                <span className={`px-2.5 py-1 rounded-md border text-xs font-semibold ${popularity.color}`}>
                  {popularity.label}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}


