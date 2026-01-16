"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { AlertCircle, Loader2, Github, Sparkles } from "lucide-react"

interface GitHubUsernameInputProps {
  onSubmit: (username: string) => Promise<void>
  loading?: boolean
}

export function GitHubUsernameInput({ onSubmit, loading = false }: GitHubUsernameInputProps) {
  const [username, setUsername] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [focused, setFocused] = useState(false)

  const exampleUsernames = ["torvalds", "gvanrossum", "gaearon", "sindresorhus"]

  // Clear error when username changes
  useEffect(() => {
    if (error && username) {
      setError(null)
    }
  }, [username, error])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!username.trim()) {
      setError("Please enter a GitHub username")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      await onSubmit(username.trim())
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch recommendations")
      setIsLoading(false)
    }
  }

  function handleExampleClick(example: string) {
    setUsername(example)
    setError(null)
    // Auto-focus the input after setting example
    setTimeout(() => {
      const input = document.querySelector('input[type="text"]') as HTMLInputElement
      input?.focus()
    }, 0)
  }

  const isEmpty = !username.trim()
  const showEmptyState = isEmpty && !focused && !error

  return (
    <Card className="border-white/10 bg-gradient-to-br from-white/[0.03] to-white/[0.01] mb-6 transition-all duration-300">
      <CardContent className="p-6">
        <div className="space-y-5">
          {/* Header with icon */}
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-white/10 flex items-center justify-center flex-shrink-0">
              <Github className="w-5 h-5 text-blue-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-base font-semibold text-white mb-1">Get Personalized Recommendations</h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                Enter your GitHub username to discover open-source repositories that match your skills and interests
              </p>
            </div>
          </div>

          {/* Input form with enhanced styling */}
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">@</div>
              <Input
                type="text"
                placeholder="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                disabled={isLoading || loading}
                className={`pl-8 pr-4 py-2.5 border-white/10 text-white placeholder:text-gray-600 transition-all duration-200 ${
                  focused
                    ? "border-blue-500/50 bg-white/[0.08] shadow-lg shadow-blue-500/10"
                    : "bg-white/[0.05] hover:bg-white/[0.07]"
                } ${error ? "border-rose-500/50 bg-rose-500/5" : ""}`}
                style={{ backgroundColor: focused ? "rgba(255, 255, 255, 0.08)" : "rgba(255, 255, 255, 0.05)" }}
              />
            </div>

            <Button
              type="submit"
              disabled={!username.trim() || isLoading || loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg shadow-blue-500/20"
            >
              {isLoading || loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing your profile...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Get Recommendations
                </>
              )}
            </Button>
          </form>

          {/* Error state with smooth animation */}
          {error && (
            <div className="flex items-start gap-3 p-3.5 rounded-lg bg-rose-500/10 border border-rose-500/20 animate-in slide-in-from-top-2 duration-200">
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-rose-300 mb-1">Error</p>
                <p className="text-xs text-rose-400/80">{error}</p>
              </div>
            </div>
          )}

          {/* Empty state / Helper text */}
          {showEmptyState && (
            <div className="space-y-3 pt-2 border-t border-white/10 animate-in fade-in duration-300">
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-2.5">
                  How it works
                </p>
                <ul className="space-y-1.5 text-xs text-gray-400">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-400 mt-0.5">•</span>
                    <span>We analyze your GitHub activity, languages, and contributions</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-400 mt-0.5">•</span>
                    <span>Find repos that match your skills and have open issues</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-400 mt-0.5">•</span>
                    <span>Get personalized recommendations with clear next steps</span>
                  </li>
                </ul>
              </div>

              <div>
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-2.5">
                  Try these examples
                </p>
                <div className="flex flex-wrap gap-2">
                  {exampleUsernames.map((example) => (
                    <button
                      key={example}
                      onClick={() => handleExampleClick(example)}
                      type="button"
                      disabled={isLoading || loading}
                      className="px-3 py-1.5 rounded-md text-xs font-medium bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 transition-all duration-200 hover:border-white/20 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      @{example}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Example usernames (shown when input has value) */}
          {!showEmptyState && username && !error && (
            <div className="pt-2 border-t border-white/10">
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-2.5">
                Quick examples
              </p>
              <div className="flex flex-wrap gap-2">
                {exampleUsernames.map((example) => (
                  <button
                    key={example}
                    onClick={() => handleExampleClick(example)}
                    type="button"
                    disabled={isLoading || loading}
                    className="px-3 py-1.5 rounded-md text-xs font-medium bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 transition-all duration-200 hover:border-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    @{example}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
