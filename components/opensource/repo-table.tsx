"use client"

import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Star, GitFork, Bookmark, BookmarkCheck } from "lucide-react"
import { useBookmarks } from "@/hooks/use-bookmarks"

export interface Repository {
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
  staffPickBadges?: string[]
}

function formatNumber(num: number) {
  if (num >= 1000) return (num / 1000).toFixed(1) + "k"
  return num.toString()
}

function getLanguageBadge(language?: string) {
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
  const cls = language && colors[language] ? colors[language] : "bg-gray-500/20 text-gray-400 border-gray-500/30"
  return language ? <Badge className={`${cls} border font-medium`}>{language}</Badge> : null
}

function RankBadge({ index }: { index: number }) {
  if (index > 2) return null
  const labels = ["1st", "2nd", "3rd"]
  const styles = [
    "bg-[hsl(var(--muted)/0.2)] text-[hsl(var(--foreground))] border border-[hsl(var(--border)/0.4)]",
    "bg-[hsl(var(--muted)/0.18)] text-[hsl(var(--foreground))] border border-[hsl(var(--border)/0.35)]",
    "bg-[hsl(var(--muted)/0.16)] text-[hsl(var(--foreground))] border border-[hsl(var(--border)/0.3)]",
  ]
  return <Badge className={`${styles[index]} font-semibold px-2 py-0.5`}>{labels[index]}</Badge>
}

function PopularityBadge({ stars, index }: { stars: number; index: number }) {
  if (index < 3) {
    return <Badge className="bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 font-medium">Legendary</Badge>
  }
  return <Badge className="bg-purple-500/20 text-purple-400 border border-purple-500/30 font-medium">Famous</Badge>
}

const TYPE_LABELS: Record<string, string> = {
  startup: "Startup",
  bug_bounty: "Bug Bounty",
  gssoc: "GSSoC",
  ai: "AI",
  devtools: "DevTools",
}

export function RepoTable({
  repositories,
  loading,
  showRank = false,
  variant = "default",
  showType = false,
}: {
  repositories: Repository[]
  loading: boolean
  showRank?: boolean
  variant?: "default" | "landing"
  showType?: boolean
}) {
  const { isBookmarked, toggleBookmark } = useBookmarks()
  const isLanding = variant === "landing"

  return (
    <div
      className={
        isLanding
          ? "rounded-xl bg-[#1a1a1a] border border-[rgba(255,255,255,0.08)] overflow-hidden"
          : "rounded-xl border border-white/10 overflow-hidden backdrop-blur-xl"
      }
      style={
        !isLanding
          ? {
            backgroundColor: "rgba(255, 255, 255, 0.03)",
            backdropFilter: "blur(20px)",
            boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.37)",
          }
          : undefined
      }
    >
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr
              className={
                (isLanding ? "border-b border-[rgba(255,255,255,0.08)] bg-[#0a0a0a]" : "border-b border-white/10") +
                " align-middle"
              }
              style={!isLanding ? { backgroundColor: "rgba(255, 255, 255, 0.05)" } : undefined}
            >
              <th
                className={
                  "text-left px-4 py-3 font-medium text-xs md:text-sm " +
                  (isLanding ? "text-[#a0a0a0]" : "text-gray-400")
                }
              >
                Repository
              </th>
              <th
                className={
                  "text-left px-4 py-3 font-medium text-xs md:text-sm " +
                  (isLanding ? "text-[#a0a0a0]" : "text-gray-400")
                }
              >
                {showRank ? "Rank" : "Language"}
              </th>
              <th
                className={
                  "hidden lg:table-cell text-left px-4 py-3 font-medium text-sm " +
                  (isLanding ? "text-[#a0a0a0]" : "text-gray-400")
                }
              >
                Tags
              </th>
              <th
                className={
                  "text-right px-4 py-3 font-medium text-xs md:text-sm " +
                  (isLanding ? "text-[#a0a0a0]" : "text-gray-400")
                }
              >
                Stars
              </th>
              <th
                className={
                  "hidden sm:table-cell text-right px-4 py-3 font-medium text-sm " +
                  (isLanding ? "text-[#a0a0a0]" : "text-gray-400")
                }
              >
                Forks
              </th>
              <th
                className={
                  "hidden xl:table-cell text-left px-4 py-3 font-medium text-sm " +
                  (isLanding ? "text-[#a0a0a0]" : "text-gray-400")
                }
              >
                {showType ? "Type" : "Popularity"}
              </th>
              <th
                className={
                  "w-10 text-right px-4 py-3 font-medium text-xs md:text-sm " +
                  (isLanding ? "text-[#a0a0a0]" : "text-gray-400")
                }
              >
                Save
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 10 }).map((_, index) => (
                <tr key={index} className="border-b border-white/5">
                  <td className="p-3 md:p-4">
                    <div className="flex items-center space-x-3">
                      <Skeleton className="w-8 h-8 rounded-full bg-white/10" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-32 bg-white/10" />
                        <Skeleton className="h-3 w-20 bg-white/10" />
                      </div>
                    </div>
                  </td>
                  <td className="p-3 md:p-4">
                    <Skeleton className="h-6 w-20 rounded-md bg-white/10" />
                  </td>
                  <td className="hidden lg:table-cell p-4">
                    <div className="flex space-x-2">
                      <Skeleton className="h-5 w-16 rounded bg-white/10" />
                      <Skeleton className="h-5 w-20 rounded bg-white/10" />
                    </div>
                  </td>
                  <td className="p-3 md:p-4 text-right">
                    <Skeleton className="h-4 w-12 ml-auto bg-white/10" />
                  </td>
                  <td className="hidden sm:table-cell p-4 text-right">
                    <Skeleton className="h-4 w-12 ml-auto bg-white/10" />
                  </td>
                  <td className="hidden xl:table-cell p-4">
                    <Skeleton className="h-6 w-20 rounded-full bg-white/10" />
                  </td>
                </tr>
              ))
            ) : (
              <TooltipProvider>
                {repositories.map((repo, index) => (
                  <tr
                    key={repo.id}
                    className={
                      isLanding
                        ? "border-b border-[rgba(255,255,255,0.04)] hover:bg-[rgba(255,255,255,0.02)] transition-all duration-200 align-middle"
                        : "border-b border-white/5 hover:bg-white/5 transition-all duration-200 align-middle"
                    }
                  >
                    <td className="px-4 py-3 md:py-4 relative align-middle">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <a
                            href={repo.html_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 sm:gap-4 group cursor-pointer"
                          >
                            <Avatar
                              className={
                                "w-9 h-9 ring-1 transition-all duration-200 group-hover:ring-2 group-hover:scale-[1.05] " +
                                (isLanding ? "ring-[rgba(255,255,255,0.2)] group-hover:ring-[#a0a0a0]" : "ring-white/10 group-hover:ring-primary/40")
                              }
                            >
                              <AvatarImage
                                src={
                                  repo.owner.avatar_url ||
                                  "/placeholder.svg?height=32&width=32&query=github%20avatar" ||
                                  "/placeholder.svg"
                                }
                                alt={`${repo.owner.login} avatar`}
                                className="object-cover"
                              />
                              <AvatarFallback
                                className={
                                  "text-sm font-medium " +
                                  (isLanding ? "bg-[#404040] text-[#d9d9d9]" : "bg-white/10 text-white")
                                }
                              >
                                {repo.owner.login.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col gap-1">
                              <div
                                className={
                                  "font-medium transition-colors duration-200 " +
                                  (isLanding ? "text-[#d9d9d9] group-hover:text-[#ffffff]" : "text-white group-hover:text-primary")
                                }
                              >
                                {repo.name}
                              </div>
                              <div
                                className={
                                  "inline-flex items-center gap-2 text-[13px] " + (isLanding ? "text-[#a0a0a0]" : "text-gray-500")
                                }
                              >
                                <span className="h-2 w-2 rounded-full bg-white/15" />
                                {repo.owner.login}
                              </div>
                            </div>
                          </a>
                        </TooltipTrigger>
                        {repo.description ? (
                          <TooltipContent side="right" sideOffset={8} className="max-w-sm" clampLines={6}>
                            <div className="flex items-start gap-3">
                              <Avatar className="w-8 h-8 ring-1 ring-border/40">
                                <AvatarImage
                                  src={
                                    repo.owner.avatar_url ||
                                    "/placeholder.svg?height=32&width=32&query=github%20avatar" ||
                                    "/placeholder.svg"
                                  }
                                  alt={`${repo.owner.login} avatar`}
                                />
                                <AvatarFallback className="text-xs">
                                  {repo.owner.login.charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className="space-y-1">
                                <p className="text-xs text-muted-foreground">{repo.owner.login}</p>
                                <p className="text-sm leading-relaxed line-clamp-4">{repo.description}</p>
                                <div className="flex items-center gap-3 pt-1">
                                  <span className="inline-flex items-center gap-1 text-xs">
                                    <Star className="w-3.5 h-3.5 text-yellow-400" />
                                    {formatNumber(repo.stargazers_count)}
                                  </span>
                                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                                    <GitFork className="w-3.5 h-3.5" />
                                    {formatNumber(repo.forks_count)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </TooltipContent>
                        ) : null}
                      </Tooltip>
                    </td>
                    <td className="px-4 py-3 md:py-4 align-middle">
                      <div className="inline-flex items-center gap-2">
                        {showRank ? <RankBadge index={index} /> : getLanguageBadge(repo.language)}
                        <span className="hidden sm:inline-block h-6 px-2 rounded-full border border-white/10 bg-white/5 text-[11px] text-[#cfd0d3]">
                          Stable
                        </span>
                      </div>
                    </td>
                    <td className="hidden lg:table-cell px-4 py-3 md:py-4 align-middle">
                      <div className="flex flex-wrap gap-1.5 rounded-xl border border-white/5 bg-white/5 px-2.5 py-2">
                        {repo.topics?.slice(0, 3).map((topic) => (
                          <Badge
                            key={topic}
                            className={
                              "text-xs font-normal transition-colors " +
                              (isLanding
                                ? "bg-[#404040] text-[#d9d9d9] border border-[rgba(255,255,255,0.1)] hover:bg-[#505050]"
                                : "bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10")
                            }
                          >
                            {topic}
                          </Badge>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 md:py-4 text-right align-middle">
                      <span
                        className={
                          "font-medium " + (isLanding ? "text-[#d9d9d9]" : "text-white")
                        }
                      >
                        {formatNumber(repo.stargazers_count)}
                      </span>
                    </td>
                    <td className="hidden sm:table-cell px-4 py-3 md:py-4 text-right align-middle">
                      <span
                        className={
                          "font-medium " + (isLanding ? "text-[#a0a0a0]" : "text-gray-400")
                        }
                      >
                        {formatNumber(repo.forks_count)}
                      </span>
                    </td>
                    <td className="hidden xl:table-cell px-4 py-3 md:py-4 align-middle">
                      {showType ? (
                        repo.staffPickBadges?.[0] ? (
                          <Badge className="text-xs font-medium bg-blue-500/15 text-blue-200 border border-blue-500/30">
                            {TYPE_LABELS[repo.staffPickBadges[0]] ?? repo.staffPickBadges[0]}
                          </Badge>
                        ) : (
                          <span className="text-xs text-gray-500">No Type</span>
                        )
                      ) : (
                        <PopularityBadge stars={repo.stargazers_count} index={index} />
                      )}
                    </td>
                    <td className="px-4 py-3 md:py-4 text-right align-middle">
                      <button
                        type="button"
                        aria-label={isBookmarked(repo.id) ? "Remove bookmark" : "Save bookmark"}
                        className={
                          "inline-flex items-center justify-center rounded-full border px-2 py-1 text-xs transition-colors " +
                          (isBookmarked(repo.id)
                            ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/20"
                            : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:text-white")
                        }
                        onClick={() =>
                          toggleBookmark({
                            id: repo.id,
                            name: repo.name,
                            full_name: repo.full_name,
                            description: repo.description,
                            language: repo.language,
                            stargazers_count: repo.stargazers_count,
                            forks_count: repo.forks_count,
                            topics: repo.topics,
                            html_url: repo.html_url,
                            owner: repo.owner,
                          })
                        }
                      >
                        {isBookmarked(repo.id) ? (
                          <BookmarkCheck className="w-4 h-4" />
                        ) : (
                          <Bookmark className="w-4 h-4" />
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </TooltipProvider>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
