"use client"

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react"

type NavSection = "home" | "trending" | "discover" | "bookmarks"

interface OpenSourceViewContextValue {
  activeNav: NavSection
  setActiveNav: (nav: NavSection) => void
  selectedLanguages: string[]
  setSelectedLanguages: (updater: string[] | ((prev: string[]) => string[])) => void
  toggleLanguage: (language: string) => void
}

const OpenSourceViewContext = createContext<OpenSourceViewContextValue | null>(null)

export function OpenSourceViewProvider({ children }: { children: ReactNode }) {
  const [activeNav, setActiveNav] = useState<NavSection>("home")
  const [selectedLanguages, setSelectedLanguagesState] = useState<string[]>([])

  const setSelectedLanguages = useCallback(
    (updater: string[] | ((prev: string[]) => string[])) => {
      setSelectedLanguagesState((prev) => (typeof updater === "function" ? updater(prev) : updater))
    },
    [],
  )

  const toggleLanguage = useCallback((language: string) => {
    setSelectedLanguagesState((prev) =>
      prev.includes(language) ? prev.filter((l) => l !== language) : [...prev, language],
    )
  }, [])

  const value = useMemo(
    () => ({
      activeNav,
      setActiveNav,
      selectedLanguages,
      setSelectedLanguages,
      toggleLanguage,
    }),
    [activeNav, selectedLanguages, setSelectedLanguages, toggleLanguage],
  )

  return <OpenSourceViewContext.Provider value={value}>{children}</OpenSourceViewContext.Provider>
}

export function useOpenSourceView() {
  const context = useContext(OpenSourceViewContext)
  if (!context) {
    throw new Error("useOpenSourceView must be used within an OpenSourceViewProvider")
  }
  return context
}


