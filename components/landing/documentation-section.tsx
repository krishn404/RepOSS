"use client"

import { useState, useEffect } from "react"
import type React from "react"

// Badge component for consistency
function Badge({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="px-[14px] py-[6px] bg-[#303030] shadow-[0px_0px_0px_4px_rgba(0,0,0,0.2)] overflow-hidden rounded-[90px] flex justify-start items-center gap-[8px] border border-[rgba(255,255,255,0.1)] shadow-xs">
      <div className="w-[14px] h-[14px] relative overflow-hidden flex items-center justify-center">{icon}</div>
      <div className="text-center flex justify-center flex-col text-[#d9d9d9] text-xs font-medium leading-3 font-sans">
        {text}
      </div>
    </div>
  )
}

export default function DocumentationSection() {
  const [activeCard, setActiveCard] = useState(0)
  const [animationKey, setAnimationKey] = useState(0)

  const cards = [
    {
      title: "Find repositories that fit you",
      description: "Search across GitHub and filter by language,\nstars, topics, and more in one place.",
      image: "/modern-dashboard-interface-with-data-visualization.jpg",
    },
    {
      title: "Understand projects at a glance",
      description: "Turn stars, forks, and activity into\nclear signals so you know where to invest time.",
      image: "/analytics-dashboard.png",
    },
    {
      title: "Keep your open source work organized",
      description: "Save repos, compare options, and come back\nlater without losing your research.",
      image: "/team-collaboration-interface-with-shared-workspace.jpg",
    },
  ]

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveCard((prev) => (prev + 1) % cards.length)
      setAnimationKey((prev) => prev + 1)
    }, 5000)

    return () => clearInterval(interval)
  }, [cards.length])

  const handleCardClick = (index: number) => {
    setActiveCard(index)
    setAnimationKey((prev) => prev + 1)
  }

  return (
    <div className="w-full border-b border-[rgba(255,255,255,0.1)] flex flex-col justify-center items-center">
      {/* Header Section */}
      <div className="self-stretch px-6 md:px-24 py-12 md:py-16 border-b border-[rgba(255,255,255,0.1)] flex justify-center items-center gap-6">
        <div className="w-full max-w-[586px] px-6 py-5 shadow-none overflow-hidden rounded-lg flex flex-col justify-start items-center gap-4">
          <Badge
            icon={
              <div className="w-[10.50px] h-[10.50px] outline outline-[1.17px] outline-[#d9d9d9] outline-offset-[-0.58px] rounded-full"></div>
            }
            text="How reposs helps"
          />
          <div className="self-stretch text-center flex justify-center flex-col text-[#d9d9d9] text-3xl md:text-5xl font-semibold leading-tight md:leading-[60px] font-sans tracking-tight">
            Everything you need to find your next repo
          </div>
          <div className="self-stretch text-center text-[#a0a0a0] text-base font-normal leading-7 font-sans">
            Discover, evaluate, and track open source projects
            <br />
            without fighting GitHub&apos;s search every time.
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="self-stretch px-4 md:px-9 overflow-hidden flex justify-start items-center">
        <div className="flex-1 py-8 md:py-11 flex flex-col md:flex-row justify-start items-center gap-6 md:gap-12">
          {/* Left Column - Feature Cards */}
          <div className="w-full md:w-auto md:max-w-[400px] flex flex-col justify-center items-center gap-4 order-2 md:order-1">
            {cards.map((card, index) => {
              const isActive = index === activeCard

              return (
                <div
                  key={index}
                  onClick={() => handleCardClick(index)}
                  className={`w-full overflow-hidden flex flex-col justify-start items-start transition-all duration-300 cursor-pointer ${isActive
                    ? "bg-[#303030] shadow-[0px_0px_0px_0.75px_rgba(255,255,255,0.1)_inset]"
                    : "border border-[rgba(255,255,255,0.1)]"
                    }`}
                >
                  <div
                    className={`w-full h-0.5 bg-[rgba(255,255,255,0.1)] overflow-hidden ${isActive ? "opacity-100" : "opacity-0"}`}
                  >
                    <div
                      key={animationKey}
                      className="h-0.5 bg-[#a0a0a0] animate-[progressBar_5s_linear_forwards] will-change-transform"
                    />
                  </div>
                  <div className="px-6 py-5 w-full flex flex-col gap-2">
                    <div className="self-stretch flex justify-center flex-col text-[#d9d9d9] text-sm font-semibold leading-6 font-sans">
                      {card.title}
                    </div>
                    <div className="self-stretch text-[#a0a0a0] text-[13px] font-normal leading-[22px] font-sans whitespace-pre-line">
                      {card.description}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Right Column - Image */}
          <div className="w-full md:w-auto rounded-lg flex flex-col justify-center items-center gap-2 order-1 md:order-2 md:px-0 px-[00]">
            <div className="w-full md:w-[580px] h-[250px] md:h-[420px] bg-[#303030] shadow-[0px_0px_0px_0.9056603908538818px_rgba(255,255,255,0.1)] overflow-hidden rounded-lg flex flex-col justify-start items-start">
              <div
                className={`w-full h-full transition-all duration-300 ${activeCard === 0
                  ? "bg-gradient-to-br from-blue-900/20 to-blue-800/20"
                  : activeCard === 1
                    ? "bg-gradient-to-br from-purple-900/20 to-purple-800/20"
                    : "bg-gradient-to-br from-green-900/20 to-green-800/20"
                  }`}
              />
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes progressBar {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(0%);
          }
        }
      `}</style>
    </div>
  )
}
