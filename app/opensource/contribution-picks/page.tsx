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
  const { data: session, status } = useSession()

  const [repositories, setRepositories] = useState<EnhancedRepository[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showUsernameInput, setShowUsernameInput] = useState(false)
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [progressMessage, setProgressMessage] = useState<string>("Analyzing your profile and finding matches...")

  useEffect(() => {
    setActiveNav("contributionPicks")
  }, [setActiveNav])

  useEffect(() => {
    // Wait for session to be determined (not loading)
    if (status === "loading") return
    
    const provider = (session?.user as any)?.provider
    const hasGithub = provider === "github" || !!(session?.user as any)?.githubUsername
    
    // If user logged in via GitHub, skip username input and fetch immediately
    if (session?.user && hasGithub && provider === "github" && !showUsernameInput && repositories.length === 0 && !isLoading) {
      fetchRecommendations()
    }
    // If user logged in via Google only, automatically show username input on mount
    else if (session?.user && provider === "google" && !hasGithub && repositories.length === 0 && !isLoading) {
      setShowUsernameInput(true)
    }
    // If no session or GitHub auth but no username detected, show input as fallback
    else if (status === "unauthenticated" && repositories.length === 0 && !isLoading && !showUsernameInput) {
      setShowUsernameInput(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, status])

  const fetchRecommendations = useCallback(async (username?: string, forceRefresh = false) => {
    setIsLoading(true)
    setError(null)
    setLoadingProgress(0)
    setProgressMessage(forceRefresh ? "Refreshing recommendations..." : "Analyzing your profile and finding matches...")

    // Step-based progress simulation aligned with API steps
    const progressSteps = [
      { progress: 10, message: "Analyzing your GitHub profile..." },
      { progress: 25, message: "Profile analysis complete" },
      { progress: 27, message: "Analyzing your recent commits..." },
      { progress: 30, message: "Checking your existing repositories..." },
      { progress: 40, message: "Excluding previously seen repositories..." },
      { progress: 50, message: "Searching for matching repositories..." },
      { progress: 60, message: "Found potential matches" },
      { progress: 70, message: "Analyzing repositories with AI..." },
      { progress: 85, message: "Selecting best matches for you..." },
      { progress: 90, message: "Generating personalized recommendations..." },
      { progress: 95, message: "Finalizing recommendations..." },
      { progress: 100, message: "Recommendations ready!" },
    ]

    let currentStep = 0
    const progressInterval = setInterval(() => {
      if (currentStep < progressSteps.length - 1) {
        currentStep++
        const step = progressSteps[currentStep]
        setLoadingProgress(Math.min(100, Math.max(0, step.progress)))
        setProgressMessage(step.message)
      }
    }, 800) // Update every 800ms to simulate realistic progress

    try {
      const params = new URLSearchParams()
      if (username) {
        params.append("githubUsername", username)
      }
      if (forceRefresh) {
        params.append("refresh", "true")
      }

      const response = await fetch(`/api/contribution-picks?${params.toString()}`)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to fetch recommendations")
      }

      const data = await response.json()
      const repos = data.repositories || []
      setRepositories(repos)
      
      // If no repos returned and user is GitHub authenticated, show username input as fallback
      if (repos.length === 0) {
        const provider = (session?.user as any)?.provider
        if (provider === "github") {
          setShowUsernameInput(true)
          setError("Unable to fetch recommendations automatically. Please enter your GitHub username.")
        }
      } else {
        setShowUsernameInput(false)
      }
      
      setLoadingProgress(100)
      setProgressMessage("Recommendations ready!")
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred"
      setError(errorMessage)
      setRepositories([])
      setLoadingProgress(0)
      setProgressMessage("An error occurred")
      
      // If GitHub user and fetch failed, show username input as fallback
      const provider = (session?.user as any)?.provider
      if (provider === "github") {
        setShowUsernameInput(true)
      }
    } finally {
      setIsLoading(false)
      clearInterval(progressInterval)
    }
  }, [session])

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
            <div className="flex items-center gap-3">
              {repositories.length > 0 && !isLoading && (
                <Button
                  onClick={() => fetchRecommendations(undefined, true)}
                  variant="outline"
                  size="sm"
                  className="border-white/20 hover:bg-white/5 text-white/90"
                  title="Get fresh recommendations"
                >
                  <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                  Refresh
                </Button>
              )}
              <UserMenu />
            </div>
          </div>
          <p className="text-sm text-gray-400">
            Discover open-source repos where you can make an impact based on your GitHub profile
          </p>
        </div>
      </div>

      <div className="px-6 py-8 max-w-7xl mx-auto">
        {/* GitHub username prompt for Google auth users, unauthenticated users, or when auto-fetch fails */}
        {repositories.length === 0 && 
          !isLoading && 
          showUsernameInput && (
            <GitHubUsernameInput 
              onSubmit={async (username) => {
                await fetchRecommendations(username)
              }} 
              loading={isLoading} 
            />
          )}

        {/* Error state */}
        {error && (
          <Card className="mb-6 border-rose-500/30 bg-rose-500/10">
            <CardContent className="p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-rose-300 mb-3">{error}</p>
                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      setError(null)
                      const provider = (session?.user as any)?.provider
                      if (provider === "github") {
                        fetchRecommendations(undefined, true)
                      } else {
                        setShowUsernameInput(true)
                      }
                    }}
                    variant="outline"
                    size="sm"
                    className="border-rose-500/30 hover:bg-rose-500/10"
                  >
                    <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                    Try Again
                  </Button>
                  {(session?.user as any)?.provider !== "github" && (
                    <Button
                      onClick={() => {
                        setError(null)
                        setShowUsernameInput(true)
                      }}
                      variant="outline"
                      size="sm"
                      className="border-white/20 hover:bg-white/5"
                    >
                      Enter Username
                    </Button>
                  )}
                </div>
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
                  style={{ width: `${Math.min(100, Math.max(0, loadingProgress))}%` }}
                />
              </div>
              <span className="text-xs text-gray-400">{Math.round(Math.min(100, Math.max(0, loadingProgress)))}%</span>
            </div>
            <p className="text-xs text-gray-500">{progressMessage}</p>
          </div>
        )}

        {/* Repositories grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {isLoading && repositories.length === 0 ? (
            renderSkeletons(6)
          ) : repositories.length > 0 ? (
            repositories.map((repo, index) => <ContributionPicksCard key={repo.id} repo={repo} index={index} />)
          ) : status === "loading" ? (
            // Show skeletons while session is loading
            renderSkeletons(6)
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
