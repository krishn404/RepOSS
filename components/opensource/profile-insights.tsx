"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Code2, GitBranch, Zap, Calendar } from "lucide-react"

interface ProfileInsightsProps {
  languages?: string[]
  topicsCount?: number
  contributionsCount?: number
  lastActivityDays?: number
  loading?: boolean
}

export function ProfileInsights({
  languages = [],
  topicsCount = 0,
  contributionsCount = 0,
  lastActivityDays = 0,
  loading = false,
}: ProfileInsightsProps) {
  return (
    <Card className="border-white/10 bg-white/[0.02] backdrop-blur-sm">
      <CardContent className="pt-6">
        <div className="space-y-4">
          {/* Header */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-4">Your Profile Match</h3>
            <p className="text-xs text-gray-400">Recommendations personalized to your GitHub activity and interests</p>
          </div>

          {/* Insights Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Languages */}
            <div className="p-3 rounded-lg bg-white/[0.03] border border-white/5">
              <div className="flex items-center gap-2 mb-2">
                <Code2 className="w-4 h-4 text-blue-400" />
                <span className="text-xs text-gray-400">Languages</span>
              </div>
              <p className="text-sm font-semibold text-white">{loading ? "..." : languages.length || 0}</p>
            </div>

            {/* Topics */}
            <div className="p-3 rounded-lg bg-white/[0.03] border border-white/5">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-4 h-4 text-amber-400" />
                <span className="text-xs text-gray-400">Topics</span>
              </div>
              <p className="text-sm font-semibold text-white">{loading ? "..." : topicsCount}</p>
            </div>

            {/* Contributions */}
            <div className="p-3 rounded-lg bg-white/[0.03] border border-white/5">
              <div className="flex items-center gap-2 mb-2">
                <GitBranch className="w-4 h-4 text-green-400" />
                <span className="text-xs text-gray-400">Repos</span>
              </div>
              <p className="text-sm font-semibold text-white">{loading ? "..." : contributionsCount}</p>
            </div>

            {/* Last Activity */}
            <div className="p-3 rounded-lg bg-white/[0.03] border border-white/5">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4 text-purple-400" />
                <span className="text-xs text-gray-400">Active</span>
              </div>
              <p className="text-sm font-semibold text-white">{loading ? "..." : `${lastActivityDays}d ago`}</p>
            </div>
          </div>

          {/* Top Languages */}
          {!loading && languages.length > 0 && (
            <div>
              <p className="text-xs text-gray-400 mb-2">Top Languages</p>
              <div className="flex flex-wrap gap-2">
                {languages.slice(0, 4).map((lang) => (
                  <Badge key={lang} className="text-xs bg-blue-500/10 text-blue-300 border-blue-500/20">
                    {lang}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
