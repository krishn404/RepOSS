"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ExternalLink, TrendingUp, CheckCircle2, ArrowRight } from "lucide-react"
import Link from "next/link"

export interface ContributionPick {
  name: string
  url: string
  score: number
  difficulty: "Easy" | "Medium" | "Hard"
  reason: string
  match_factors: string[]
  first_steps: string
}

interface ContributionPickCardProps {
  pick: ContributionPick
  index: number
}

function getDifficultyColor(difficulty: "Easy" | "Medium" | "Hard") {
  switch (difficulty) {
    case "Easy":
      return "bg-green-500/20 text-green-400 border-green-500/30"
    case "Medium":
      return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
    case "Hard":
      return "bg-red-500/20 text-red-400 border-red-500/30"
  }
}

function getScoreColor(score: number) {
  if (score >= 80) return "text-green-400"
  if (score >= 60) return "text-yellow-400"
  return "text-gray-400"
}

export function ContributionPickCard({ pick, index }: ContributionPickCardProps) {
  const [owner, repo] = pick.name.split("/")

  return (
    <Card
      className="group relative overflow-hidden border-white/10 bg-white/5 backdrop-blur-xl transition-all duration-300 hover:bg-white/10 hover:border-white/20 hover:shadow-xl"
      style={{
        boxShadow: "0 4px 16px 0 rgba(0, 0, 0, 0.2)",
      }}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <CardTitle className="text-lg font-semibold text-white group-hover:text-primary transition-colors">
                {repo}
              </CardTitle>
              {index < 3 && (
                <Badge
                  className={`${
                    index === 0
                      ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                      : index === 1
                        ? "bg-gray-500/20 text-gray-400 border-gray-500/30"
                        : "bg-orange-500/20 text-orange-400 border-orange-500/30"
                  } border font-semibold`}
                >
                  #{index + 1}
                </Badge>
              )}
            </div>
            <CardDescription className="text-gray-400 text-sm">
              {owner}
            </CardDescription>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className={`text-2xl font-bold ${getScoreColor(pick.score)}`}>
              {Math.round(pick.score)}
            </div>
            <div className="text-xs text-gray-500">match score</div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Difficulty Badge */}
        <div className="flex items-center gap-2">
          <Badge className={`${getDifficultyColor(pick.difficulty)} border font-medium`}>
            {pick.difficulty}
          </Badge>
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <TrendingUp className="w-3 h-3" />
            <span>Personalized match</span>
          </div>
        </div>

        {/* Reason */}
        <div>
          <p className="text-sm text-gray-300 leading-relaxed">{pick.reason}</p>
        </div>

        {/* Match Factors */}
        <div>
          <p className="text-xs text-gray-500 mb-2">Why this matches:</p>
          <div className="flex flex-wrap gap-2">
            {pick.match_factors.map((factor, idx) => (
              <Badge
                key={idx}
                className="text-xs font-normal bg-blue-500/10 text-blue-300 border border-blue-500/20"
              >
                {factor}
              </Badge>
            ))}
          </div>
        </div>

        {/* First Steps */}
        <div className="pt-2 border-t border-white/10">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-xs text-gray-500 mb-1">First steps:</p>
              <p className="text-sm text-gray-300">{pick.first_steps}</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-2">
          <Button
            asChild
            className="flex-1 bg-white/10 hover:bg-white/20 text-white border border-white/20"
          >
            <Link href={pick.url} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="w-4 h-4 mr-2" />
              View Repository
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="border border-white/10 hover:bg-white/10"
            asChild
          >
            <Link href={pick.url} target="_blank" rel="noopener noreferrer">
              <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

