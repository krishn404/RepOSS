"use client"

import { useState, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"
import { BeamsBackground } from "@/components/opensource/bg-beams"
import { UserMenu } from "@/components/user-menu"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertCircle, RefreshCw } from "lucide-react"
import { useOpenSourceView } from "@/components/opensource/opensource-context"
import { GitHubUsernameInput } from "@/components/opensource/github-username-input"
import { ContributionPicksCard } from "@/components/opensource/contribution-picks-card"
import type { Repository } from "@/components/opensource/repo-table"

interface EnhancedRepository extends Repository {
  matchReason?: string
  matchFactors?: string[]
  firstSteps?: string[]
  matchScore?: number
  difficulty?: "Easy" | "Medium" | "Hard"
}

export default function ContributionPicksPage() {
  const { setActiveNav } = useOpenSourceView()
  const { data: session } = useSession()

  const [repositories, setRepositories] = useState<EnhancedRepository[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showUsernameInput, setShowUsernameInput] = useState(false)
  const [loadingProgress, setLoadingProgress] = useState(0)

  useEffect(() => {
    setActiveNav("contributionPicks")
  }, [setActiveNav])

  useEffect(() => {
    const hasGithub = (session?.user as any)?.provider === "github" || !!(session?.user as any)?.githubUsername
    if (session?.user && hasGithub && !showUsernameInput) {
      fetchRecommendations()
    }
  }, [session?.user, showUsernameInput])

  const fetchRecommendations = useCallback(async (username?: string) => {
    setIsLoading(true)
    setError(null)
    setLoadingProgress(0)

    // Simulate loading progress
    const progressInterval = setInterval(() => {
      setLoadingProgress((prev) => {
        if (prev >= 90) clearInterval(progressInterval)
        return prev + Math.random() * 30
      })
    }, 200)

    try {
      const params = new URLSearchParams()
      if (username) {
        params.append("githubUsername", username)
      }

      const response = await fetch(`/api/contribution-picks?${params.toString()}`)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to fetch recommendations")
      }

      const data = await response.json()
      setRepositories(data.repositories || [])
      setShowUsernameInput(false)
      setLoadingProgress(100)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
      setRepositories([])
      setLoadingProgress(0)
    } finally {
      setIsLoading(false)
      clearInterval(progressInterval)
    }
  }, [])

  function renderSkeletons(count = 6) {
    return Array.from({ length: count }).map((_, i) => (
      <div key={`skeleton-${i}`} className="animate-pulse">
        <div className="bg-white/[0.02] backdrop-blur-md border border-white/10 rounded-lg p-4 space-y-3">
          <div className="flex justify-between items-start">
            <div className="w-8 h-8 bg-white/10 rounded-md" />
            <div className="w-20 h-5 bg-white/10 rounded" />
          </div>
          <div className="space-y-2">
            <div className="h-4 bg-white/10 rounded w-3/4" />
            <div className="h-3 bg-white/10 rounded w-1/2" />
          </div>
          <div className="h-8 bg-white/10 rounded" />
          <div className="flex gap-2">
            <div className="flex-1 h-8 bg-white/10 rounded" />
            <div className="w-8 h-8 bg-white/10 rounded" />
          </div>
        </div>
      </div>
    ))
  }

  return (
    <div className="relative min-h-screen w-full text-white" style={{ backgroundColor: "#121212" }}>
      <BeamsBackground className="fixed inset-0 -z-10" />

      {/* Header */}
      <div
        className="sticky top-0 z-30 backdrop-blur-lg border-b border-white/10"
        style={{ backgroundColor: "rgba(18, 18, 18, 0.8)" }}
      >
        <div className="px-6 py-4">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-xl font-semibold text-white">Contribution Picks</h1>
            <UserMenu />
          </div>
          <p className="text-sm text-gray-400">
            Discover open-source repos where you can make an impact based on your GitHub profile
          </p>
        </div>
      </div>

      <div className="px-6 py-8 max-w-7xl mx-auto">
        {/* GitHub username prompt for Google auth users */}
        {session?.user &&
          (session?.user as any)?.provider !== "github" &&
          !showUsernameInput &&
          repositories.length === 0 &&
          !isLoading && <GitHubUsernameInput onSubmit={fetchRecommendations} loading={isLoading} />}

        {/* Error state */}
        {error && (
          <Card className="mb-6 border-rose-500/30 bg-rose-500/10">
            <CardContent className="p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-rose-300 mb-3">{error}</p>
                <Button
                  onClick={() => fetchRecommendations()}
                  variant="outline"
                  size="sm"
                  className="border-rose-500/30 hover:bg-rose-500/10"
                >
                  <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                  Try Again
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Loading progress indicator */}
        {isLoading && loadingProgress > 0 && (
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-600 to-blue-400 transition-all duration-300"
                  style={{ width: `${loadingProgress}%` }}
                />
              </div>
              <span className="text-xs text-gray-400">{Math.round(loadingProgress)}%</span>
            </div>
            <p className="text-xs text-gray-500">Analyzing your profile and finding matches...</p>
          </div>
        )}

        {/* Repositories grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {isLoading && repositories.length === 0 ? (
            renderSkeletons(6)
          ) : repositories.length > 0 ? (
            repositories.map((repo, index) => <ContributionPicksCard key={repo.id} repo={repo} index={index} />)
          ) : !isLoading && !error ? (
            // Empty state
            <div className="col-span-full">
              <Card className="border-white/10 bg-gradient-to-br from-white/[0.03] to-white/[0.01]">
                <CardContent className="p-12 text-center">
                  <p className="text-gray-400 text-sm mb-4">No recommendations available yet</p>
                  {(session?.user as any)?.provider !== "github" && (
                    <Button
                      onClick={() => setShowUsernameInput(true)}
                      variant="outline"
                      className="border-white/10 hover:bg-white/5"
                    >
                      Enter GitHub Username
                    </Button>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : null}
        </div>

        {/* Results summary */}
        {repositories.length > 0 && (
          <div className="mt-8 pt-6 border-t border-white/10">
            <p className="text-xs text-gray-500 font-medium">
              Showing {repositories.length} personalized recommendations based on your GitHub activity
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
