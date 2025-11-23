"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search } from "lucide-react"
import { HomeSection } from "@/components/opensource/home-section"
import { TrendingSection } from "@/components/opensource/trending-section"
import { DiscoverSection } from "@/components/opensource/discover-section"
import { BeamsBackground } from "@/components/opensource/bg-beams"
import { useOpenSourceView } from "@/components/opensource/opensource-context"

type Repo = {
  id: number
  name: string
  full_name: string
  description: string
  language: string
  stargazers_count: number
  forks_count: number
  topics: string[]
  html_url: string
  owner: { login: string; avatar_url: string }
}

export default function OpenSourcePage() {
  const [repositories, setRepositories] = useState<Repo[]>([])
  const [loading, setLoading] = useState(true)
  const [trendingPeriod, setTrendingPeriod] = useState<"day" | "month" | "year">("day")
  const [filters, setFilters] = useState({
    search: "",
    language: "all",
    minStars: "any",
    sortBy: "stars",
  })

  const { activeNav, selectedLanguages, setSelectedLanguages } = useOpenSourceView()

  // Debounced sidebar toggle to prevent rapid clicking
  const toggleSidebar = () => {
    // Placeholder for sidebar toggle logic
  }

  useEffect(() => {
    fetchRepositories()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, activeNav, trendingPeriod, selectedLanguages])

  const fetchRepositories = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()

      if (activeNav === "trending") {
        params.append("trending", "1")
        params.append("trendingPeriod", trendingPeriod)
        params.append("sortBy", "stars")
      } else {
        // home & discover share base search; discover emphasizes recent activity
        params.append("search", filters.search || "")
        params.append("language", filters.language || "all")
        params.append("minStars", filters.minStars || "any")
        params.append("sortBy", activeNav === "discover" ? "updated" : filters.sortBy || "stars")
      }

      const response = await fetch(`/api/opensource?${params.toString()}`)
      const data = await response.json()
      setRepositories(data.repositories || [])
    } catch (error) {
      console.error("Error fetching repositories:", error)
    } finally {
      setLoading(false)
    }
  }

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + "k"
    }
    return num.toString()
  }

  const getLanguageColor = (language: string) => {
    const colors: Record<string, string> = {
      Go: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
      TypeScript: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      JavaScript: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
      Python: "bg-green-500/20 text-green-400 border-green-500/30",
      Java: "bg-orange-500/20 text-orange-400 border-orange-500/30",
      "C++": "bg-purple-500/20 text-purple-400 border-purple-500/30",
      Rust: "bg-red-500/20 text-red-400 border-red-500/30",
      PHP: "bg-indigo-500/20 text-indigo-400 border-indigo-500/30",
    }
    return colors[language] || "bg-gray-500/20 text-gray-400 border-gray-500/30"
  }

  const getPopularityBadge = (stars: number, index: number) => {
    if (index < 3) {
      return (
        <div className="bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 font-medium px-2 py-1">
          Legendary
        </div>
      )
    }
    return (
      <div className="bg-purple-500/20 text-purple-400 border border-purple-500/30 font-medium px-2 py-1">Famous</div>
    )
  }

  const renderRankBadge = (index: number) => {
    if (index > 2) return null
    const labels = ["1st", "2nd", "3rd"]
    const styles = [
      "bg-[hsl(var(--muted)/0.2)] text-[hsl(var(--foreground))] border border-[hsl(var(--border)/0.4)]",
      "bg-[hsl(var(--muted)/0.18)] text-[hsl(var(--foreground))] border border-[hsl(var(--border)/0.35)]",
      "bg-[hsl(var(--muted)/0.16)] text-[hsl(var(--foreground))] border border-[hsl(var(--border)/0.3)]",
    ]
    return <div className={`${styles[index]} font-semibold px-2 py-0.5`}>{labels[index]}</div>
  }

  const navItems = [
    { id: "home", label: "Home", icon: null },
    { id: "trending", label: "Trending", icon: null },
    { id: "discover", label: "Discover", icon: null },
  ] as const

  const handleSaveRepository = async (repo: Repo) => {
    console.log("Save repository feature requires authentication in production:", repo.name)
  }

  return (
    <div className="relative min-h-screen w-full text-white" style={{ backgroundColor: "#121212" }}>
      <BeamsBackground className="fixed inset-0 -z-10" />

      <div className="sticky top-0 z-30 backdrop-blur-lg border-b border-white/10" style={{ backgroundColor: "rgba(18, 18, 18, 0.8)" }}>
        <div className="px-6 py-4">
          <div className="flex flex-col gap-4">
            {/* Search and primary filters */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search repositories..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  className="pl-10 border-white/10 text-white placeholder:text-gray-500 focus:border-white/20 transition-colors"
                  style={{ backgroundColor: "rgba(255, 255, 255, 0.05)" }}
                />
              </div>

              {activeNav !== "trending" && (
                <>
                  <Select
                    value={filters.language}
                    onValueChange={(value) => setFilters({ ...filters, language: value })}
                  >
                    <SelectTrigger className="w-full sm:w-40 border-white/10 text-white" style={{ backgroundColor: "rgba(255, 255, 255, 0.05)" }}>
                      <SelectValue placeholder="All Languages" />
                    </SelectTrigger>
                    <SelectContent className="border-white/10 text-white" style={{ backgroundColor: "#1a1a1a" }}>
                      <SelectItem value="all">All Languages</SelectItem>
                      <SelectItem value="TypeScript">TypeScript</SelectItem>
                      <SelectItem value="JavaScript">JavaScript</SelectItem>
                      <SelectItem value="Python">Python</SelectItem>
                      <SelectItem value="Go">Go</SelectItem>
                      <SelectItem value="Java">Java</SelectItem>
                      <SelectItem value="Rust">Rust</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={filters.sortBy} onValueChange={(value) => setFilters({ ...filters, sortBy: value })}>
                    <SelectTrigger className="w-full sm:w-40 border-white/10 text-white" style={{ backgroundColor: "rgba(255, 255, 255, 0.05)" }}>
                      <SelectValue placeholder="Sort By" />
                    </SelectTrigger>
                    <SelectContent className="border-white/10 text-white" style={{ backgroundColor: "#1a1a1a" }}>
                      <SelectItem value="stars">Most Stars</SelectItem>
                      <SelectItem value="forks">Most Forks</SelectItem>
                      <SelectItem value="updated">Recently Updated</SelectItem>
                      <SelectItem value="name">Name</SelectItem>
                    </SelectContent>
                  </Select>
                </>
              )}

              {activeNav === "trending" && (
                <div className="flex items-center gap-2">
                  {(["day", "month", "year"] as const).map((p) => (
                    <button
                      key={p}
                      onClick={() => setTrendingPeriod(p)}
                      className={`px-3 py-2 rounded-md text-xs sm:text-sm border transition-colors`}
                      style={{
                        backgroundColor: trendingPeriod === p ? "rgba(255, 255, 255, 0.1)" : "rgba(255, 255, 255, 0.05)",
                        borderColor: trendingPeriod === p ? "rgba(255, 255, 255, 0.2)" : "rgba(255, 255, 255, 0.1)",
                        color: trendingPeriod === p ? "white" : "#a0a0a0"
                      }}
                      suppressHydrationWarning
                    >
                      {p === "day" ? "Day" : p === "month" ? "Month" : "Year"}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {selectedLanguages.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selectedLanguages.map((lang) => (
                  <div
                    key={lang}
                    className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs bg-blue-500/20 text-blue-400 border border-blue-500/30"
                  >
                    {lang}
                    <button
                      onClick={() => setSelectedLanguages((prev) => prev.filter((l) => l !== lang))}
                      className="hover:opacity-70 transition-opacity"
                      suppressHydrationWarning
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="px-6 py-6">
        <div className="mb-3 text-sm text-gray-400">
          {activeNav === "home" && <span>Home • Explore and filter repositories</span>}
          {activeNav === "trending" && <span>Trending • Top repositories by {trendingPeriod}</span>}
          {activeNav === "discover" && <span>Discover • Recently active repositories</span>}
        </div>

        {activeNav === "home" && <HomeSection repositories={repositories} loading={loading} />}
        {activeNav === "trending" && <TrendingSection repositories={repositories} loading={loading} />}
        {activeNav === "discover" && <DiscoverSection repositories={repositories} loading={loading} />}
      </div>
    </div>
  )
}
