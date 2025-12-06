"use client"

import { ArrowUpRight, Github, Star } from "lucide-react"
import React from "react"

export const AdCard = () => {
  return (
    <div className="group relative w-full rounded-2xl border border-white/10 bg-[#0f0f10] px-6 py-5 overflow-hidden transition-all duration-500 min-h-[200px]">
      {/* Top-right glow (purple/indigo) - toned down */}
      <div className="pointer-events-none absolute -top-28 -right-16 h-[340px] w-[340px] rounded-full bg-gradient-to-bl from-[#7c5cff]/30 via-[#5b5bd6]/20 to-transparent blur-3xl opacity-70 transition-all duration-700 group-hover:scale-105 group-hover:opacity-85"></div>
      {/* Subtle diagonal dark sweep - lighter */}
      <div className="pointer-events-none absolute -top-10 -left-6 h-[180px] w-[140%] rotate-[-6deg] bg-gradient-to-br from-black/20 via-black/10 to-transparent opacity-50"></div>
      {/* Minimal neon accent at top-right */}
      <div className="pointer-events-none absolute -top-4 -right-4 h-[120px] w-[120px] rounded-full bg-[radial-gradient(circle_at_center,rgba(167,139,250,0.45),rgba(124,92,255,0.30)_50%,transparent_75%)] blur-xl opacity-70 mix-blend-screen"></div>

      {/* Content */}
      <div className="relative z-10 flex flex-col gap-3">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#000000]">
              <Github className="h-5 w-5 text-white fill-white/90" />
            </div>
          </div>

          <a
            href="https://github.com/krishn404/reposs"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Star reposs on GitHub"
          className="group relative inline-flex items-center gap-1.5 rounded-lg bg-[#2b2b2d] px-5 py-2 text-sm font-medium text-white transition-all duration-300 hover:bg-[#3b3b3d] shadow-[0_2px_10px_rgba(0,0,0,0.35),0_6px_18px_rgba(124,92,255,0.25)] hover:shadow-[0_3px_12px_rgba(0,0,0,0.45),0_10px_26px_rgba(124,92,255,0.32)] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/20"
          >
            <span className="relative z-10 text-white transition-opacity duration-300 group-hover:opacity-90">
              Star Us
            </span>
            <Star
              fill="yellow"
              size={16}
              className="relative z-10 transition-transform duration-300 text-yellow-500"
            />
          </a>
        </div>

        {/* Body */}
        <div className="flex flex-col gap-2 ">
          <p className="text-[15px] font-semibold leading-snug text-white">
            Star us on GitHub
          </p>
          <p className="text-sm text-gray-300 leading-snug">
            Show your support by starring our GitHub repository. It helps
            others discover the project and keeps development active.
          </p>
        </div>

      </div>
    </div>
  )
}
