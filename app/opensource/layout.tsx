"use client"

import type { ReactNode } from "react"
import { Sidebar } from "@/components/ui/sidebar"
import { OpenSourceViewProvider } from "@/components/opensource/opensource-context"
import { motion, AnimatePresence } from "framer-motion"
import { useState, useMemo, useEffect } from "react"
import { useIsMobile } from "@/hooks/use-mobile"
import { PanelLeftOpen } from "lucide-react"

export default function OpenSourceLayout({ children }: { children: ReactNode }) {
  const isMobile = useIsMobile()
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true)

  const sidebarWidth = useMemo(() => (isMobile ? 320 : 320), [isMobile])
  const handleWidth = 24

  useEffect(() => {
    // Default: closed on mobile, open on desktop
    setIsSidebarOpen(!isMobile)
  }, [isMobile])

  return (
    <OpenSourceViewProvider>
      <div className="flex h-screen w-screen" style={{ backgroundColor: "#121212" }}>
        {/* Sidebar */}
        <AnimatePresence initial={false}>
          {(!isMobile || (isMobile && isSidebarOpen)) && (
            <motion.aside
              key="sidebar"
              className="fixed left-0 top-0 h-screen border-r border-border bg-card overflow-hidden z-50"
              initial={{ width: 0, x: isMobile ? -sidebarWidth : 0, opacity: isMobile ? 1 : 1 }}
              animate={{ width: isSidebarOpen || isMobile ? sidebarWidth : 0, x: 0 }}
              exit={{ width: 0, x: -sidebarWidth }}
              transition={{ type: "spring", stiffness: 260, damping: 30 }}
              style={{ willChange: "transform, width" }}
            >
              <Sidebar
                isOpen={isSidebarOpen}
                onToggle={() => setIsSidebarOpen((prev) => !prev)}
              />
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Backdrop for mobile */}
        <AnimatePresence>
          {isMobile && isSidebarOpen && (
            <motion.div
              key="backdrop"
              className="fixed inset-0 z-40 bg-black/50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setIsSidebarOpen(false)}
            />
          )}
        </AnimatePresence>

        {/* Desktop hover handle to open when closed */}
        {!isMobile && !isSidebarOpen && (
          <motion.button
            key="hover-handle"
            className="fixed left-0 top-4 z-40 h-10 w-6 rounded-r-md border border-border bg-card/90 hover:bg-card text-foreground shadow-sm flex items-center justify-center"
            initial={{ x: 0, opacity: 0.9 }}
            animate={{ x: 0, opacity: 1 }}
            whileHover={{ x: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 30 }}
            aria-label="Open panel"
            onMouseEnter={() => setIsSidebarOpen(true)}
            onFocus={() => setIsSidebarOpen(true)}
          >
            <PanelLeftOpen className="h-5 w-5" />
          </motion.button>
        )}

        {/* Main Content Area */}
        <motion.main
          className="flex-1 h-screen overflow-y-auto"
          style={{ backgroundColor: "#121212" }}
          animate={{
            marginLeft: isMobile ? 0 : isSidebarOpen ? sidebarWidth : handleWidth,
          }}
          transition={{ type: "spring", stiffness: 260, damping: 30 }}
        >
          {/* Mobile top bar to open sidebar when closed */}
          {isMobile && !isSidebarOpen && (
            <div className="sticky top-0 z-10 backdrop-blur border-b border-white/10" style={{ backgroundColor: "rgba(18, 18, 18, 0.8)" }}>
              <div className="h-12 flex items-center px-4">
                <button
                  onClick={() => setIsSidebarOpen(true)}
                  className="rounded-md px-2 py-1 text-sm text-foreground hover:bg-white/5"
                  aria-label="Open sidebar"
                >
                  {/* Simple hamburger */}
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
            </div>
          )}
          {children}
        </motion.main>
      </div>
    </OpenSourceViewProvider>
  )
}
