"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ExternalLink, CheckCircle2, Clock } from "lucide-react"
import Link from "next/link"

export interface RecommendationCardProps {
  name: string
  url: string
  reason: string
  matchFactors: string[]
  difficulty: "Easy" | "Medium" | "Hard"
  matchScore: number
  lastActivity?: string
  firstSteps: string
}

function getDifficultyColor(difficulty: "Easy" | "Medium" | "Hard") {
  switch (difficulty) {
    case "Easy":
      return "bg-green-500/10 text-green-400 border-green-500/20"
    case "Medium":
      return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
    case "Hard":
      return "bg-red-500/10 text-red-400 border-red-500/20"
  }
}

function getScoreColor(score: number) {
  if (score >= 80) return "text-green-400"
  if (score >= 60) return "text-yellow-400"
  return "text-gray-400"
}

export function RecommendationCard({
  name,
  url,
  reason,
  matchFactors,
  difficulty,
  matchScore,
  lastActivity,
  firstSteps,
}: RecommendationCardProps) {
  const [owner, repo] = name.split("/")

  return (
    <Card className="group relative overflow-hidden border-white/10 bg-white/[0.02] backdrop-blur-sm transition-all duration-300 hover:border-white/20 hover:bg-white/[0.05] hover:shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <CardTitle className="text-base font-semibold text-white group-hover:text-blue-300 transition-colors truncate">
                {repo}
              </CardTitle>
            </div>
            <CardDescription className="text-xs text-gray-500">{owner}</CardDescription>
          </div>
          <div className="flex flex-col items-end gap-2 flex-shrink-0">
            <div className={`text-lg font-bold ${getScoreColor(matchScore)}`}>{Math.round(matchScore)}</div>
            <div className="text-xs text-gray-500">match</div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Difficulty Badge and Last Activity */}
        <div className="flex items-center justify-between gap-2">
          <Badge className={`${getDifficultyColor(difficulty)} border text-xs font-medium`}>{difficulty}</Badge>
          {lastActivity && (
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Clock className="w-3 h-3" />
              <span>{lastActivity}</span>
            </div>
          )}
        </div>

        {/* Reason */}
        <div className="pt-1">
          <p className="text-sm text-gray-300 leading-relaxed">{reason}</p>
        </div>

        {/* Match Factors */}
        {matchFactors.length > 0 && (
          <div className="pt-2 border-t border-white/5">
            <div className="flex flex-wrap gap-1.5">
              {matchFactors.map((factor, idx) => (
                <Badge key={idx} className="text-xs font-normal bg-blue-500/10 text-blue-300 border border-blue-500/20">
                  {factor}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* First Steps */}
        <div className="pt-2 border-t border-white/5">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-xs text-gray-500 mb-1">First step:</p>
              <p className="text-xs text-gray-300">{firstSteps}</p>
            </div>
          </div>
        </div>

        {/* Action */}
        <div className="pt-2">
          <Button
            asChild
            className="w-full h-8 bg-white/10 hover:bg-white/15 text-white border border-white/20 text-sm"
          >
            <Link href={url} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="w-3.5 h-3.5 mr-2" />
              View Repository
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
