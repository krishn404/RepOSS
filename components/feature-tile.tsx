import type React from "react"
import { cn } from "@/lib/utils"

interface FeatureTileProps {
  title: string
  description: string
  children: React.ReactNode
  className?: string
}

export function FeatureTile({ title, description, children, className }: FeatureTileProps) {
  return (
    <div
      className={cn(
        "relative flex flex-col gap-4 sm:gap-5 rounded-2xl border border-border/60 bg-card/40 backdrop-blur-sm p-4 sm:p-5 md:p-6 shadow-sm",
        className,
      )}
    >

      <div className="relative flex flex-col gap-2 sm:gap-3">
        <h3 className="text-foreground text-base sm:text-lg md:text-xl font-semibold leading-tight tracking-tight">{title}</h3>
        <p className="text-muted-foreground text-xs sm:text-sm md:text-base leading-relaxed">{description}</p>
      </div>

      <div className="relative flex-1">{children}</div>
    </div>
  )
}


