"use client"

import { cn } from "@/lib/utils"
import { useState } from "react"
import { ChevronDown, Home, TrendingUp, Compass } from "lucide-react"
import { News, type NewsArticle } from "@/components/ui/sidebar-news"

const NEWS_ARTICLES: NewsArticle[] = [
  {
    href: "https://github.com/krishn404/Git-Friend",
    title: "Git-Friend v2.0 Released!",
    summary:
      "New AI-powered features and improved Git workflow assistance. Check out the latest updates!",
    image: "mesh-gradient-1",
  },
  {
    href: "https://github.com/krishn404/Git-Friend/discussions",
    title: "Promote Your Repository",
    summary:
      "Want to showcase your amazing open-source project? DM us to get featured in our trending repositories section!",
    image: "mesh-gradient-2",
  },
  {
    href: "https://github.com/krishn404/Git-Friend/issues",
    title: "New Git Emoji Generator",
    summary:
      "Create expressive commit messages with our enhanced emoji generator. Make your Git history more readable and fun!",
    image: "mesh-gradient-3",
  },
  {
    href: "https://github.com/krishn404/Git-Friend/releases",
    title: "AI Chat Improvements",
    summary:
      "Our AI assistant now understands more Git commands and provides better context-aware suggestions for your workflow.",
    image: "mesh-gradient-4",
  },
  {
    href: "https://github.com/krishn404/Git-Friend/wiki",
    title: "Community Spotlight",
    summary:
      "Share your success stories with Git-Friend! How has it improved your development workflow? We'd love to hear from you.",
    image: "mesh-gradient-5",
  },
]

interface SidebarProps {
  activeNav?: "home" | "trending" | "discover"
  onNavChange?: (nav: "home" | "trending" | "discover") => void
  selectedLanguages?: string[]
  onLanguagesChange?: (languages: string[]) => void
  newsArticles?: NewsArticle[]
}

export function Sidebar({ activeNav = "home", onNavChange, selectedLanguages = [], onLanguagesChange, newsArticles = [] }: SidebarProps) {
  const [filtersOpen, setFiltersOpen] = useState(true)

  const languages = [
    { name: "JavaScript", color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" },
    { name: "Python", color: "bg-green-500/20 text-green-400 border-green-500/30" },
    { name: "TypeScript", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
    { name: "Go", color: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30" },
    { name: "Rust", color: "bg-red-500/20 text-red-400 border-red-500/30" },
    { name: "Java", color: "bg-orange-500/20 text-orange-400 border-orange-500/30" },
    { name: "C++", color: "bg-purple-500/20 text-purple-400 border-purple-500/30" },
    { name: "PHP", color: "bg-indigo-500/20 text-indigo-400 border-indigo-500/30" },
  ]

  const navItems = [
    { id: "home" as const, label: "Home", icon: Home },
    { id: "trending" as const, label: "Trending", icon: TrendingUp },
    { id: "discover" as const, label: "Discover", icon: Compass },
  ]

  const handleLanguageToggle = (language: string) => {
    if (!onLanguagesChange) return
    const updated = selectedLanguages.includes(language)
      ? selectedLanguages.filter((l) => l !== language)
      : [...selectedLanguages, language]
    onLanguagesChange(updated)
  }

  return (
    <div className="flex flex-col h-full px-4 py-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-xl font-bold text-white">OSS Finder</h1>
        <p className="text-xs text-gray-400 mt-1">Discover amazing open-source projects</p>
      </div>

      {/* Navigation */}
      <div className="mb-8">
        <p className="text-xs text-gray-500 uppercase tracking-wider mb-4 px-2">Navigation</p>
        <div className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = activeNav === item.id
            return (
              <button
                key={item.id}
                onClick={() => onNavChange?.(item.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 text-sm font-medium",
                  isActive ? "bg-white/10 text-white" : "text-gray-400 hover:text-white hover:bg-white/5",
                )}
                suppressHydrationWarning
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Filters Section - Expandable */}
      <div className="flex-1 overflow-y-auto">
        <button
          onClick={() => setFiltersOpen(!filtersOpen)}
          className="w-full flex items-center justify-between px-2 mb-4 text-xs text-gray-500 uppercase tracking-wider hover:text-gray-300 transition-colors"
          suppressHydrationWarning
        >
          <span>Filters</span>
          <ChevronDown className={cn("w-4 h-4 transition-transform", filtersOpen && "rotate-180")} />
        </button>

        {filtersOpen && (
          <div className="space-y-4">
            {/* Language Badges */}
            <div>
              <p className="text-xs text-gray-400 mb-3 px-2">Programming Languages</p>
              <div className="flex flex-wrap gap-2">
                {languages.map((lang) => {
                  const isSelected = selectedLanguages.includes(lang.name)
                  return (
                    <button
                      key={lang.name}
                      onClick={() => handleLanguageToggle(lang.name)}
                      className={cn(
                        "px-3 py-1 rounded-full text-xs font-medium border transition-all duration-200 cursor-pointer",
                        isSelected
                          ? `${lang.color} opacity-100 scale-105`
                          : "bg-white/5 text-gray-400 border-white/10 hover:bg-white/10",
                      )}
                      suppressHydrationWarning
                    >
                      {lang.name}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* News Section */}
      {(newsArticles.length > 0 || NEWS_ARTICLES.length > 0) && (
        <div className="mt-8 border-t border-white/10 pt-4">
          <News articles={newsArticles.length > 0 ? newsArticles : NEWS_ARTICLES} />
        </div>
      )}

      {/* Footer */}
      <div className="border-t border-white/10 pt-4 mt-auto">
        <p className="text-xs text-gray-500 text-center">Browsing as guest</p>
        <p className="text-xs text-gray-600 text-center mt-1">Auth in production</p>
      </div>
    </div>
  )
}
