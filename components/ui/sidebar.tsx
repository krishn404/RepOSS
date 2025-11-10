"use client"

import { cn } from "@/lib/utils"
import { useState } from "react"
import { ChevronDown, Home, TrendingUp, Compass } from "lucide-react"
import { useOpenSourceView } from "@/components/opensource/opensource-context"


export function Sidebar() {
  const { activeNav, setActiveNav, selectedLanguages, toggleLanguage } = useOpenSourceView()
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

  return (
    <div className="flex h-full flex-col px-4 py-6">
      <div className="shrink-0 space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-xl font-bold text-white">OSS Finder</h1>
          <p className="mt-1 text-xs text-gray-400">Discover amazing open-source projects</p>
        </div>

        {/* Navigation */}
        <div>
          <p className="mb-4 px-2 text-xs uppercase tracking-wider text-gray-500">Navigation</p>
          <div className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = activeNav === item.id
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveNav(item.id)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
                    isActive ? "bg-white/10 text-white" : "text-gray-400 hover:bg-white/5 hover:text-white",
                  )}
                  suppressHydrationWarning
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 pt-4">
        <div className="flex h-full flex-col gap-4">
          {/* Filters Section - Expandable */}
          <section className="flex min-h-[220px] flex-1 flex-col overflow-hidden">
            <button
              onClick={() => setFiltersOpen((prev) => !prev)}
              className="mb-4 flex w-full items-center justify-between px-2 text-xs uppercase tracking-wider text-gray-500 transition-colors hover:text-gray-300"
              suppressHydrationWarning
            >
              <span>Filters</span>
              <ChevronDown className={cn("h-4 w-4 transition-transform", filtersOpen && "rotate-180")} />
            </button>

            {filtersOpen && (
              <div className="flex-1 overflow-y-auto pr-1">
                <div className="space-y-4">
                  {/* Language Badges */}
                  <div>
                    <p className="mb-3 px-2 text-xs text-gray-400">Programming Languages</p>
                    <div className="flex flex-wrap gap-2">
                      {languages.map((lang) => {
                        const isSelected = selectedLanguages.includes(lang.name)
                        return (
                          <button
                            key={lang.name}
                            onClick={() => toggleLanguage(lang.name)}
                            className={cn(
                              "cursor-pointer rounded-full border px-3 py-1 text-xs font-medium transition-all duration-200",
                              isSelected
                                ? `${lang.color} scale-105 opacity-100`
                                : "border-white/10 bg-white/5 text-gray-400 hover:bg-white/10",
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
              </div>
            )}
          </section>

          
        </div>
      </div>

      {/* Footer */}
      <div className="mt-4 border-t border-white/10 pt-4">
        <p className="text-center text-xs text-gray-500">Browsing as guest</p>
        <p className="mt-1 text-center text-xs text-gray-600">Auth in production</p>
      </div>
    </div>
  )
}
