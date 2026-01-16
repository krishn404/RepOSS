"use client"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { X } from "lucide-react"
import { useState } from "react"

interface RecommendationFiltersProps {
  onLanguageChange?: (language: string | null) => void
  onDifficultyChange?: (difficulty: string | null) => void
  onTypeChange?: (type: string | null) => void
  onSortChange?: (sort: string) => void
  selectedLanguage?: string | null
  selectedDifficulty?: string | null
  selectedType?: string | null
  currentSort?: string
}

const LANGUAGES = ["TypeScript", "JavaScript", "Python", "Go", "Rust", "Java", "C++", "PHP"]
const DIFFICULTIES = ["Easy", "Medium", "Hard"]
const TYPES = ["Library", "App", "Tool"]

export function RecommendationFilters({
  onLanguageChange,
  onDifficultyChange,
  onTypeChange,
  onSortChange,
  selectedLanguage,
  selectedDifficulty,
  selectedType,
  currentSort = "best-match",
}: RecommendationFiltersProps) {
  const [isOpen, setIsOpen] = useState(false)

  const activeFilterCount = [selectedLanguage, selectedDifficulty, selectedType].filter(Boolean).length

  return (
    <div className="space-y-3">
      {/* Sort Control */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-400">Filter & Sort</p>
        <Select value={currentSort} onValueChange={onSortChange}>
          <SelectTrigger className="w-40 h-9 border-white/10 text-white text-sm bg-white/[0.03]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="border-white/10 bg-card">
            <SelectItem value="best-match">Best Match</SelectItem>
            <SelectItem value="recently-active">Recently Active</SelectItem>
            <SelectItem value="trending">Trending</SelectItem>
            <SelectItem value="easiest">Easiest First</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Filter Pills */}
      <div className="flex flex-wrap gap-2">
        {/* Language Filter */}
        <Select
          value={selectedLanguage || "all"}
          onValueChange={(value) => onLanguageChange?.(value === "all" ? null : value)}
        >
          <SelectTrigger className="h-8 px-3 text-xs border-white/10 text-white bg-white/[0.03] hover:bg-white/[0.05]">
            <span className="flex items-center gap-2">
              <span>{selectedLanguage || "Language"}</span>
              {selectedLanguage && <X className="w-3 h-3" />}
            </span>
          </SelectTrigger>
          <SelectContent className="border-white/10 bg-card">
            {selectedLanguage && <SelectItem value="all">Clear Language</SelectItem>}
            {LANGUAGES.map((lang) => (
              <SelectItem key={lang} value={lang}>
                {lang}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Difficulty Filter */}
        <Select
          value={selectedDifficulty || "all"}
          onValueChange={(value) => onDifficultyChange?.(value === "all" ? null : value)}
        >
          <SelectTrigger className="h-8 px-3 text-xs border-white/10 text-white bg-white/[0.03] hover:bg-white/[0.05]">
            <span className="flex items-center gap-2">
              <span>{selectedDifficulty || "Difficulty"}</span>
              {selectedDifficulty && <X className="w-3 h-3" />}
            </span>
          </SelectTrigger>
          <SelectContent className="border-white/10 bg-card">
            {selectedDifficulty && <SelectItem value="all">Clear Difficulty</SelectItem>}
            {DIFFICULTIES.map((diff) => (
              <SelectItem key={diff} value={diff}>
                {diff}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Type Filter */}
        <Select value={selectedType || "all"} onValueChange={(value) => onTypeChange?.(value === "all" ? null : value)}>
          <SelectTrigger className="h-8 px-3 text-xs border-white/10 text-white bg-white/[0.03] hover:bg-white/[0.05]">
            <span className="flex items-center gap-2">
              <span>{selectedType || "Type"}</span>
              {selectedType && <X className="w-3 h-3" />}
            </span>
          </SelectTrigger>
          <SelectContent className="border-white/10 bg-card">
            {selectedType && <SelectItem value="all">Clear Type</SelectItem>}
            {TYPES.map((type) => (
              <SelectItem key={type} value={type}>
                {type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Active Filters Summary */}
      {activeFilterCount > 0 && (
        <p className="text-xs text-gray-500">
          {activeFilterCount} filter{activeFilterCount !== 1 ? "s" : ""} active
        </p>
      )}
    </div>
  )
}
