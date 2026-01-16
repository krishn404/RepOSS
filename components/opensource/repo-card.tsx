"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ExternalLink, Code2, TrendingUp, GitFork, Star, Bookmark, BookmarkCheck } from "lucide-react"
import Link from "next/link"
import { useBookmarks } from "@/hooks/use-bookmarks"

export interface RepoCardProps {
  id: number
  name: string
  url: string
  owner: string
  description: string
  reason: string
  difficulty: "Easy" | "Medium" | "Hard"
  matchScore: number
  languages: string[]
  stars: number
  forks: number
  lastUpdated: string
}

function getDifficultyColor(difficulty: "Easy" | "Medium" | "Hard") {
  switch (difficulty) {
    case "Easy":
      return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/15"
    case "Medium":
      return "bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/15"
    case "Hard":
      return "bg-rose-500/10 text-rose-400 border-rose-500/20 hover:bg-rose-500/15"
  }
}

function getMatchColor(score: number) {
  if (score >= 80) return { bg: "bg-emerald-500/10", text: "text-emerald-400" }
  if (score >= 60) return { bg: "bg-amber-500/10", text: "text-amber-400" }
  return { bg: "bg-slate-500/10", text: "text-slate-400" }
}

export function RepoCard({
  id,
  name,
  url,
  owner,
  description,
  reason,
  difficulty,
  matchScore,
  languages,
  stars,
  forks,
  lastUpdated,
}: RepoCardProps) {
  const { isBookmarked, toggleBookmark } = useBookmarks()
  const matchColor = getMatchColor(matchScore)

  const handleBookmarkToggle = async () => {
    try {
      await toggleBookmark({
        id,
        name,
        full_name: `${owner}/${name}`,
        description,
        language: languages[0] || "",
        stargazers_count: stars,
        forks_count: forks,
        topics: languages,
        html_url: url,
        owner: { login: owner, avatar_url: "" },
      })
    } catch (error) {
      console.error("Failed to toggle bookmark:", error)
    }
  }

  return (
    <Card className="group relative overflow-hidden border-white/10 bg-gradient-to-br from-white/[0.03] to-white/[0.01] backdrop-blur-sm transition-all duration-300 hover:border-white/20 hover:bg-gradient-to-br hover:from-white/[0.05] hover:to-white/[0.02] hover:shadow-xl">
      {/* Top-left icon + top-right status pill and bookmark */}
      <CardContent className="p-5 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
              <Code2 className="w-5 h-5 text-blue-400/60" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-white text-sm truncate group-hover:text-blue-300 transition-colors">
                {name}
              </h3>
              <p className="text-xs text-gray-500">{owner}</p>
            </div>
          </div>

          {/* Top-right: Status pill + bookmark button */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${matchColor.bg} border-white/10`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span className={`text-xs font-semibold ${matchColor.text}`}>{Math.round(matchScore)}%</span>
            </div>
            {/* Bookmark button with existing hook */}
            <button
              type="button"
              aria-label={isBookmarked(id) ? "Remove bookmark" : "Save bookmark"}
              onClick={handleBookmarkToggle}
              className={
                "inline-flex items-center justify-center rounded-lg border p-2 text-xs transition-colors " +
                (isBookmarked(id)
                  ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/20"
                  : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:text-white")
              }
            >
              {isBookmarked(id) ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Title / main description */}
        <div>
          <p className="text-sm text-gray-300 leading-relaxed line-clamp-2">{description}</p>
        </div>

        {/* Compact meta row */}
        <div className="flex items-center justify-between text-xs text-gray-500 gap-2">
          <div className="flex items-center gap-1">
            <Star className="w-3.5 h-3.5" />
            <span>{stars.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-1">
            <GitFork className="w-3.5 h-3.5" />
            <span>{forks.toLocaleString()}</span>
          </div>
          <span className="ml-auto">{lastUpdated}</span>
        </div>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-white/10 to-transparent" />

        {/* Bottom section: difficulty, languages, reason, action */}
        <div className="space-y-3">
          {/* Difficulty + Languages */}
          <div className="flex items-center justify-between gap-2">
            <Badge className={`${getDifficultyColor(difficulty)} border text-xs font-medium px-2 py-0.5`}>
              {difficulty}
            </Badge>
            <div className="flex items-center gap-1.5 flex-wrap justify-end">
              {languages.slice(0, 2).map((lang) => (
                <Badge
                  key={lang}
                  className="bg-blue-500/10 text-blue-300 border border-blue-500/20 text-xs px-2 py-0.5"
                >
                  {lang}
                </Badge>
              ))}
            </div>
          </div>

          {/* Reason / match rationale */}
          <div className="text-xs text-gray-400 leading-relaxed italic">{reason}</div>

          <Button
            asChild
            className="w-full h-8 bg-blue-500/15 hover:bg-blue-500/25 text-blue-200 border border-blue-500/30 text-xs font-medium transition-all"
          >
            <Link href={url} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
              View Repo
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
