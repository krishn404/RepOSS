"use client"

import { Star, GitFork, Bookmark, BookmarkCheck, ExternalLink, Folder, BarChart3, AlertCircle } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useBookmarks } from "@/hooks/use-bookmarks"
import type { Repository } from "@/components/opensource/repo-table"

interface ContributionPicksCardProps {
  repo: Repository & {
    matchReason?: string
    matchFactors?: string[]
    firstSteps?: string[]
    matchScore?: number
    difficulty?: "Easy" | "Medium" | "Hard"
  }
  index: number
}

export function ContributionPicksCard({ repo, index }: ContributionPicksCardProps) {
  const { isBookmarked, toggleBookmark } = useBookmarks()
  const bookmarked = isBookmarked(repo.id)

  const matchScore = repo.matchScore || 75
  const difficulty = repo.difficulty || "Medium"

  // Status based on match score
  const getStatus = () => {
    if (matchScore >= 80) return { label: "Excellent Match", color: "bg-emerald-500", dotColor: "bg-emerald-500" }
    if (matchScore >= 65) return { label: "Good Match", color: "bg-blue-500", dotColor: "bg-blue-500" }
    return { label: "Recommended", color: "bg-amber-500", dotColor: "bg-amber-500" }
  }

  const status = getStatus()

  const difficultyColors = {
    Easy: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    Medium: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    Hard: "bg-rose-500/15 text-rose-300 border-rose-500/30",
  }

  const priorityLevels = {
    Easy: 1,
    Medium: 2,
    Hard: 3,
  }

  function formatNumber(num: number) {
    if (num >= 1000) return (num / 1000).toFixed(1) + "k"
    return num.toString()
  }

  const handleBookmark = async () => {
    try {
      await toggleBookmark({
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
    } catch (error) {
      console.error("[v0] Failed to toggle bookmark:", error)
    }
  }

  // Circular progress component
  const CircularProgress = ({ percentage }: { percentage: number }) => {
    const radius = 14
    const circumference = 2 * Math.PI * radius
    const offset = circumference - (percentage / 100) * circumference

    return (
      <div className="relative w-8 h-8 flex items-center justify-center">
        <svg className="w-8 h-8 transform -rotate-90" viewBox="0 0 32 32">
          <circle
            cx="16"
            cy="16"
            r={radius}
            stroke="currentColor"
            strokeWidth="2.5"
            fill="none"
            className="text-white/10"
          />
          <circle
            cx="16"
            cy="16"
            r={radius}
            stroke="currentColor"
            strokeWidth="2.5"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="text-blue-400 transition-all duration-500"
          />
        </svg>
        <span className="absolute text-[10px] font-semibold text-white">{Math.round(percentage)}%</span>
      </div>
    )
  }

  return (
    <div className="group relative bg-white/[0.02] backdrop-blur-md border border-white/10 rounded-lg p-4 hover:bg-white/[0.04] hover:border-white/20 transition-all duration-300">
      {/* Top row: Icon + Status */}
      <div className="flex items-start justify-between mb-3">
        <div className="w-8 h-8 rounded-md bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
          <Folder className="w-4 h-4 text-white/60" />
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/5 border border-white/10">
            <div className={`w-1.5 h-1.5 rounded-full ${status.dotColor}`} />
            <span className="text-xs font-medium text-white/70">{status.label}</span>
          </div>
        </div>
      </div>

      {/* Title + Owner Avatar */}
      <div className="mb-2.5 flex items-start gap-2">
        <Avatar className="w-7 h-7 flex-shrink-0 border border-white/10">
          <AvatarImage src={repo.owner.avatar_url || "/placeholder.svg"} alt={repo.owner.login} />
          <AvatarFallback className="bg-white/10 text-white/70 text-xs">
            {repo.owner.login.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-white mb-0.5 line-clamp-1">{repo.name}</h3>
          <p className="text-xs text-white/50 line-clamp-1">@{repo.owner.login}</p>
        </div>
      </div>

      {/* Description */}
      <p className="text-xs text-white/60 line-clamp-2 mb-3">{repo.description || "No description provided"}</p>

      {/* Associated details: Language */}
      <div className="mb-3">
        <p className="text-xs text-white/50">
          {repo.language || "Multiple languages"} • {formatNumber(repo.stargazers_count)} stars
        </p>
      </div>

      {/* Match Score with Progress */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs text-white/50">Match</span>
          <span className="text-xs font-semibold text-white">{Math.round(matchScore)}%</span>
        </div>
        <CircularProgress percentage={matchScore} />
      </div>

      {/* Priority (Difficulty) */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <BarChart3 className="w-3.5 h-3.5 text-white/40" />
          <span className="text-xs text-white/50">Difficulty</span>
        </div>
        <div className="flex items-center gap-1">
          {[1, 2, 3].map((level) => (
            <div
              key={level}
              className={`w-1.5 h-1.5 rounded ${
                level <= priorityLevels[difficulty] ? "bg-amber-400" : "bg-white/10"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Compact Stats Row */}
      <div className="mb-3 flex items-center gap-3 text-xs text-white/50 pb-3 border-b border-white/10">
        <div className="flex items-center gap-1">
          <Star className="w-3 h-3 text-amber-400" />
          <span>{formatNumber(repo.stargazers_count)}</span>
        </div>
        <div className="flex items-center gap-1">
          <GitFork className="w-3 h-3 text-blue-400" />
          <span>{formatNumber(repo.forks_count)}</span>
        </div>
        <div className="flex items-center gap-1">
          <AlertCircle className="w-3 h-3 text-white/40" />
          <span>{(repo as any).open_issues_count || 0}</span>
        </div>
      </div>

      {/* Why you should contribute section */}
      <div className="mb-3">
        <p className="text-xs text-white/40 font-medium uppercase tracking-wide mb-1.5">Why contribute</p>
        <p className="text-xs text-white/70 leading-relaxed line-clamp-2">
          {repo.matchReason || "A great project to contribute to based on your profile"}
        </p>
      </div>

      {/* Why this repo matches you section */}
      {repo.matchFactors && repo.matchFactors.length > 0 && (
        <div className="mb-3">
          <p className="text-xs text-white/40 font-medium uppercase tracking-wide mb-1.5">Why it matches you</p>
          <ul className="space-y-1">
            {repo.matchFactors.slice(0, 2).map((factor, idx) => (
              <li key={idx} className="flex items-start gap-1.5 text-xs text-white/60">
                <span className="text-blue-400 mt-0.5">•</span>
                <span className="line-clamp-1">{factor}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Best first contribution steps */}
      {repo.firstSteps && repo.firstSteps.length > 0 && (
        <div className="mb-3">
          <p className="text-xs text-white/40 font-medium uppercase tracking-wide mb-1.5">First steps</p>
          <ul className="space-y-1">
            {repo.firstSteps.slice(0, 2).map((step, idx) => (
              <li key={idx} className="flex items-start gap-1.5 text-xs text-white/60">
                <span className="text-emerald-400 mt-0.5">•</span>
                <span className="line-clamp-1">{step}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-2">
        <a href={repo.html_url} target="_blank" rel="noopener noreferrer" className="flex-1">
          <Button
            variant="default"
            size="sm"
            className="w-full h-8 bg-blue-600 hover:bg-blue-700 text-white border-0 text-xs transition-all duration-200"
          >
            <ExternalLink className="w-3 h-3 mr-1.5" />
            Visit
          </Button>
        </a>
        <Button
          variant="outline"
          size="sm"
          onClick={handleBookmark}
          className="h-8 border-white/10 hover:bg-white/5 bg-transparent transition-all duration-200"
          title={bookmarked ? "Remove bookmark" : "Add bookmark"}
        >
          {bookmarked ? (
            <BookmarkCheck className="w-3.5 h-3.5 text-blue-400" />
          ) : (
            <Bookmark className="w-3.5 h-3.5 text-white/40" />
          )}
        </Button>
      </div>
    </div>
  )
}
