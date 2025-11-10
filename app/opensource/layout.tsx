"use client"

import type { ReactNode } from "react"
import { Sidebar } from "@/components/ui/sidebar"
import { OpenSourceViewProvider } from "@/components/opensource/opensource-context"

export default function OpenSourceLayout({ children }: { children: ReactNode }) {
  return (
    <OpenSourceViewProvider>
      <div className="flex h-screen w-screen bg-background">
        {/* Fixed Sidebar - 20rem (320px) width, no scroll */}
        <aside className="fixed left-0 top-0 h-screen w-80 border-r border-border bg-card overflow-hidden z-50">
          <Sidebar />
        </aside>

        {/* Main Content Area - Starts immediately after sidebar */}
        <main className="flex-1 h-screen overflow-y-auto ml-80 bg-background">{children}</main>
      </div>
    </OpenSourceViewProvider>
  )
}
