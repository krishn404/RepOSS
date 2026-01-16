"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { BeamsBackground } from "@/components/opensource/bg-beams"
import { UserMenu } from "@/components/user-menu"
import { ContributionPickCard, type ContributionPick } from "@/components/opensource/contribution-pick-card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Sparkles, Github, AlertCircle, RefreshCw } from "lucide-react"
import { useOpenSourceView } from "@/components/opensource/opensource-context"

export default function ContributionPicksPage() {
  const { setActiveNav } = useOpenSourceView()
  const { data: session } = useSession()
  const [picks, setPicks] = useState<ContributionPick[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [githubUsername, setGithubUsername] = useState("")
  const [showUsernameInput, setShowUsernameInput] = useState(false)

  // Set active nav on mount
  useEffect(() => {
    setActiveNav("contributionPicks")
  }, [setActiveNav])

  // Check if user needs to provide GitHub username
  useEffect(() => {
    // If user is not logged in with GitHub, show input
    // @ts-ignore - custom property
    const hasGithubUsername = session?.user?.githubUsername || session?.user?.provider === "github"
    setShowUsernameInput(!hasGithubUsername)
  }, [session])

  const fetchContributionPicks = async (username?: string) => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      if (username) {
        params.append("githubUsername", username)
      }

      const response = await fetch(`/api/contribution-picks?${params.toString()}`)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to fetch contribution picks")
      }

      const data = await response.json()
      setPicks(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
      setPicks([])
    } finally {
      setLoading(false)
    }
  }

  const handleGetPicks = () => {
    if (showUsernameInput && !githubUsername.trim()) {
      setError("Please enter a GitHub username")
      return
    }
    fetchContributionPicks(showUsernameInput ? githubUsername.trim() : undefined)
  }

  // Auto-fetch on mount if user has GitHub auth
  useEffect(() => {
    if (session?.user && !showUsernameInput) {
      fetchContributionPicks()
    }
  }, [session, showUsernameInput])

  return (
    <div className="relative min-h-screen w-full text-white" style={{ backgroundColor: "#121212" }}>
      <BeamsBackground className="fixed inset-0 -z-10" />

      {/* Header */}
      <div
        className="sticky top-0 z-30 backdrop-blur-lg border-b border-white/10"
        style={{ backgroundColor: "rgba(18, 18, 18, 0.8)" }}
      >
        <div className="px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-xl font-semibold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-yellow-400" />
                Contribution Picks
              </h1>
              <p className="text-sm text-gray-400 mt-1">
                Personalized repository recommendations based on your GitHub profile
              </p>
            </div>
            <UserMenu />
          </div>

          {/* GitHub Username Input (for non-GitHub users) */}
          {showUsernameInput && (
            <Card className="border-white/10 bg-white/5 mb-4">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Github className="w-4 h-4" />
                  Enter GitHub Username
                </CardTitle>
                <CardDescription>
                  Provide your GitHub username to get personalized recommendations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Input
                    placeholder="e.g., octocat"
                    value={githubUsername}
                    onChange={(e) => setGithubUsername(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleGetPicks()
                      }
                    }}
                    className="flex-1 border-white/10 text-white placeholder:text-gray-500 focus:border-white/20"
                    style={{ backgroundColor: "rgba(255, 255, 255, 0.05)" }}
                  />
                  <Button
                    onClick={handleGetPicks}
                    disabled={loading || !githubUsername.trim()}
                    className="bg-white/10 hover:bg-white/20 text-white border border-white/20"
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      "Get Picks"
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Refresh Button (for GitHub users) */}
          {!showUsernameInput && (
            <div className="flex items-center justify-end">
              <Button
                onClick={() => fetchContributionPicks()}
                disabled={loading}
                variant="outline"
                className="border-white/10 text-white hover:bg-white/10"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Refreshing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-6">
        {error && (
          <Card className="border-red-500/20 bg-red-500/10 mb-6">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-red-400">
                <AlertCircle className="w-5 h-5" />
                <p>{error}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {loading && picks.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="border-white/10 bg-white/5">
                <CardHeader>
                  <Skeleton className="h-6 w-32 bg-white/10 mb-2" />
                  <Skeleton className="h-4 w-24 bg-white/10" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-20 w-full bg-white/10 mb-4" />
                  <Skeleton className="h-16 w-full bg-white/10" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : picks.length === 0 && !loading ? (
          <Card className="border-white/10 bg-white/5">
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <Sparkles className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">No recommendations yet</h3>
                <p className="text-gray-400 mb-6">
                  {showUsernameInput
                    ? "Enter your GitHub username and click 'Get Picks' to see personalized recommendations"
                    : "Click 'Refresh' to generate your personalized contribution picks"}
                </p>
                {showUsernameInput && (
                  <Button
                    onClick={handleGetPicks}
                    disabled={!githubUsername.trim()}
                    className="bg-white/10 hover:bg-white/20 text-white border border-white/20"
                  >
                    Get My Picks
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-400">
                Found <span className="text-white font-semibold">{picks.length}</span> personalized
                recommendations
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {picks.map((pick, index) => (
                <ContributionPickCard key={pick.url} pick={pick} index={index} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

