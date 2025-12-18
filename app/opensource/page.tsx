"use client"

import { useState, useEffect } from "react"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search } from "lucide-react"
import { HomeSection } from "@/components/opensource/home-section"
import { TrendingSection } from "@/components/opensource/trending-section"
import { DiscoverSection } from "@/components/opensource/discover-section"
import { BeamsBackground } from "@/components/opensource/bg-beams"
import { useOpenSourceView } from "@/components/opensource/opensource-context"
import { UserMenu } from "@/components/user-menu"

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

  const isStaffPickedView = activeNav === "staffPicked"

  // Fetch staff picks from Convex when on staffPicked view
  const staffPicks = useQuery(
    api.staffPicks.getPublicStaffPicks,
    isStaffPickedView ? {} : "skip"
  )

  // Debounced sidebar toggle to prevent rapid clicking
  const toggleSidebar = () => {
    // Placeholder for sidebar toggle logic
  }

  useEffect(() => {
    if (activeNav !== "staffPicked") {
      fetchRepositories()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, activeNav, trendingPeriod, selectedLanguages])

  useEffect(() => {
    if (activeNav === "staffPicked") {
      fetchStaffPickedRepositories()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeNav, staffPicks])

  const fetchRepositories = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()

      if (activeNav === "trending") {
        params.append("trending", "1")
        params.append("trendingPeriod", trendingPeriod)
        params.append("sortBy", "stars")
      } else {
        // home uses base search
        params.append("search", filters.search || "")
        params.append("language", filters.language || "all")
        params.append("minStars", filters.minStars || "any")
        params.append("sortBy", filters.sortBy || "stars")
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

  const fetchStaffPickedRepositories = async () => {
    if (!staffPicks || staffPicks.length === 0) {
      setRepositories([])
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      // Fetch repository details from GitHub for each staff pick
      const repoPromises = staffPicks.map(async (pick) => {
        try {
          const response = await fetch(`/api/repositories/${pick.repoId}`)
          if (!response.ok) {
            console.warn(`Failed to fetch repo ${pick.repoId}`)
            return null
          }
          const repo = await response.json()
          return {
            ...repo,
            staffPickReason: pick.reason,
            staffPickOrder: pick.order,
            staffPickBadges: pick.staffPickBadges || [],
          }
        } catch (error) {
          console.error(`Error fetching repo ${pick.repoId}:`, error)
          return null
        }
      })

      const repos = (await Promise.all(repoPromises)).filter((repo) => repo !== null) as Repo[]
      // Sort by staff pick order (already sorted from Convex, but ensure it)
      repos.sort((a, b) => (a as any).staffPickOrder - (b as any).staffPickOrder)
      setRepositories(repos)
    } catch (error) {
      console.error("Error fetching staff picked repositories:", error)
      setRepositories([])
    } finally {
      setLoading(false)
    }
  }

  const navItems = [
    { id: "home", label: "Home", icon: null },
    { id: "trending", label: "Trending", icon: null },
    { id: "staffPicked", label: "Staff Picked", icon: null },
  ] as const

  return (
    <div className="relative min-h-screen w-full text-white" style={{ backgroundColor: "#121212" }}>
      <BeamsBackground className="fixed inset-0 -z-10" />

      <div className="sticky top-0 z-30 backdrop-blur-lg border-b border-white/10" style={{ backgroundColor: "rgba(18, 18, 18, 0.8)" }}>
        <div className="px-6 py-4">
          <div className="flex flex-col gap-4">
            {/* Header with User Menu */}
            <div className="flex items-center justify-between mb-2">
              <h1 className="text-xl font-semibold text-white">reposs</h1>
              <UserMenu />
            </div>

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

              {activeNav !== "trending" && activeNav !== "staffPicked" && (
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
          {activeNav === "staffPicked" && <span>Staff Picked • Curated repositories by our team</span>}
        </div>

    {activeNav === "home" && <HomeSection repositories={repositories} loading={loading} />}
    {activeNav === "trending" && <TrendingSection repositories={repositories} loading={loading} />}
    {activeNav === "staffPicked" && <DiscoverSection repositories={repositories} loading={loading} showType />}
      </div>
    </div>
  )
}
