"use client"

import { cn } from "@/lib/utils"
import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  ChevronDown,
  Home,
  TrendingUp,
  Star,
  Heart,
  PanelLeftClose,
  Bookmark,
  Sparkles,
} from "lucide-react"
import { useOpenSourceView } from "@/components/opensource/opensource-context"
import { AdCard } from "@/components/AdCard"

export type SidebarProps = {
  isOpen?: boolean
  onToggle?: () => void
}

export function Sidebar({ isOpen = true, onToggle }: SidebarProps) {
  const router = useRouter()
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
    { id: "home" as const, label: "Home", icon: Home, href: "/opensource" },
    { id: "trending" as const, label: "Trending", icon: TrendingUp, href: "/opensource" },
    { id: "staffPicked" as const, label: "Staff Picked", icon: Star, href: "/opensource" },
    {
      id: "contributionPicks" as const,
      label: "Contribution Picks",
      icon: Sparkles,
      href: "/opensource/contribution-picks",
    },
    { id: "bookmarks" as const, label: "Bookmarks", icon: Bookmark, href: "/opensource/bookmarks" },
  ]

  return (
    <aside className="flex h-full min-h-0 flex-col px-4 py-6">
      {/* TOP: Header + Nav */}
      <div className="shrink-0 space-y-8">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div>
            <h1 className="text-xl font-bold text-white">reposs</h1>
            <p className="mt-1 text-xs text-gray-400">Discover amazing open-source projects</p>
          </div>

          {onToggle && (
            <button
              aria-label={isOpen ? "Close sidebar" : "Open sidebar"}
              onClick={onToggle}
              className="rounded-md p-1 text-gray-400 transition-colors hover:bg-white/5 hover:text-white"
            >
              <PanelLeftClose className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Navigation (GRID) */}
        <div>
          <p className="mb-4 px-2 text-xs uppercase tracking-wider text-gray-500">Navigation</p>

          <div className="grid grid-cols-2 gap-2">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = activeNav === item.id

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveNav(item.id)
                    if (item.href) router.push(item.href)
                  }}
                  className={cn(
                    "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
                    "border border-white/10 bg-white/5 hover:bg-white/10 hover:text-white",
                    isActive ? "bg-white/10 text-white" : "text-gray-400",
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* MIDDLE: Scroll area (filters + ad together) */}
      <div className="mt-6 min-h-0 flex-1 overflow-y-auto pr-1">
        <section className="space-y-4 pb-4">
          <button
            onClick={() => setFiltersOpen((prev) => !prev)}
            className="flex w-full items-center justify-between px-2 text-xs uppercase tracking-wider text-gray-500 transition-colors hover:text-gray-300"
          >
            <span>Filters</span>
            <ChevronDown className={cn("h-4 w-4 transition-transform", filtersOpen && "rotate-180")} />
          </button>

          {filtersOpen && (
            <div className="space-y-4">
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
                          "rounded-full border px-3 py-1 text-xs font-medium transition-all duration-200",
                          isSelected
                            ? `${lang.color} scale-[1.03] opacity-100`
                            : "border-white/10 bg-white/5 text-gray-400 hover:bg-white/10",
                        )}
                      >
                        {lang.name}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          <div className="pt-4">
            <AdCard />
          </div>
        </section>
      </div>

      {/* BOTTOM: Footer */}
      <div className="mt-4 shrink-0 border-t border-white/10 pt-4">
        <a
          href="https://github.com/sponsors/krishn404?target=krishn404/reposs"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 rounded-md border border-white/10 bg-[#1c1c1d] px-4 py-2 text-sm font-medium text-white transition-all duration-200 hover:bg-[#2a2a2b] hover:border-white/20"
        >
          <Heart size={16} className="text-pink-400" />
          Sponsor This Project On GitHub
        </a>
      </div>
    </aside>
  )
}
