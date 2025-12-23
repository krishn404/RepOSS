"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import FAQSection from "@/components/landing/faq-section"
import CTASection from "@/components/landing/cta-section"
import FooterSection from "@/components/landing/footer-section"
import { HomeSection } from "@/components/opensource/home-section"
import { DottedGlowBackground } from "@/components/ui/dotted-glow-background"
import Link from "next/link"
import {
  staggerContainer,
  staggerItem,
  scrollFadeIn,
  scrollScale,
  floatingBlob,
  scaleInSpring,
  textReveal
} from "@/lib/animations"

type Repo = {
  id: number
  name: string
  full_name: string
  description: string
  language: string
  stargazers_count: number
  forks_count: number
  topics: string[]
  html_url: string
  owner: { login: string; avatar_url: string }
}

// Reusable Badge Component
function Badge({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <motion.div
      variants={scaleInSpring}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      className="px-[14px] py-[6px] bg-[#303030] shadow-[0px_0px_0px_4px_rgba(0,0,0,0.2)] overflow-hidden rounded-[90px] flex justify-start items-center gap-[8px] border border-[rgba(255,255,255,0.1)] shadow-xs"
    >
      <div className="w-[14px] h-[14px] relative overflow-hidden flex items-center justify-center">{icon}</div>
      <div className="text-center flex justify-center flex-col text-[#d9d9d9] text-xs font-medium leading-3 font-sans">
        {text}
      </div>
    </motion.div>
  )
}

function FeatureTile({
  title,
  description,
  badge,
  accent,
  className = "",
  children
}: {
  title: string
  description: string
  badge?: string
  accent?: string
  className?: string
  children?: React.ReactNode
}) {
  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.005 }}
      transition={{ type: "spring", stiffness: 220, damping: 24 }}
      className={`relative overflow-hidden rounded-3xl border border-white/5 bg-gradient-to-br from-[#0b0b0d] via-[#0b0b0e] to-[#070708] shadow-[0_24px_60px_rgba(0,0,0,0.45)] backdrop-blur-[6px] ${className}`}
    >
      <div className="pointer-events-none absolute inset-0 opacity-70">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_22%,rgba(111,214,255,0.08),transparent_32%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_86%_78%,rgba(255,214,102,0.06),transparent_30%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(140deg,rgba(255,255,255,0.04),transparent_28%,transparent)]" />
      </div>
      <div className="relative flex flex-col gap-4 sm:gap-5 p-5 sm:p-6 lg:p-7">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            {badge ? (
              <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-medium text-[#cfd0d3] tracking-tight">
                {badge}
              </span>
            ) : null}
            <p className="text-[18px] sm:text-[19px] lg:text-[20px] font-semibold text-[#f5f5f5] tracking-tight leading-tight">
              {title}
            </p>
          </div>
          {accent ? (
            <span className="text-[11px] font-medium text-[#8ddcff] tracking-wide whitespace-nowrap">
              {accent}
            </span>
          ) : null}
        </div>
        <p className="text-sm sm:text-[15px] text-[#a8a8b3] leading-relaxed max-w-[720px]">
          {description}
        </p>
        {children}
      </div>
    </motion.div>
  )
}

export default function LandingPage() {
  const { status } = useSession()
  const router = useRouter()

  const [activeCard, setActiveCard] = useState(0)
  const [progress, setProgress] = useState(0)
  const mountedRef = useRef(true)
  const [repositories, setRepositories] = useState<Repo[]>([])
  const [loadingRepositories, setLoadingRepositories] = useState(true)

  // If user is already authenticated, send them straight to /opensource
  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/opensource")
    }
  }, [status, router])

  useEffect(() => {
    const fetchRepositories = async () => {
      setLoadingRepositories(true)
      try {
        const params = new URLSearchParams()
        params.append("trending", "1")
        // Show trending repositories over the last year on the landing page
        params.append("trendingPeriod", "year")
        params.append("sortBy", "stars")

        const response = await fetch(`/api/opensource?${params.toString()}`)
        const data = await response.json()
        setRepositories((data.repositories || []).slice(0, 10))
      } catch (error) {
        console.error("Error fetching repositories for landing hero:", error)
      } finally {
        setLoadingRepositories(false)
      }
    }

    fetchRepositories()
  }, [])

  useEffect(() => {
    const progressInterval = setInterval(() => {
      if (!mountedRef.current) return

      setProgress((prev) => {
        if (prev >= 100) {
          if (mountedRef.current) {
            setActiveCard((current) => (current + 1) % 3)
          }
          return 0
        }
        return prev + 1 // 1% every 200ms = 20 seconds total (reduced frequency)
      })
    }, 200) // Reduced from 100ms to 200ms

    return () => {
      clearInterval(progressInterval)
      mountedRef.current = false
    }
  }, [])

  useEffect(() => {
    return () => {
      mountedRef.current = false
    }
  }, [])

  const handleCardClick = (index: number) => {
    if (!mountedRef.current) return
    setActiveCard(index)
    setProgress(0)
  }

  const getDashboardContent = () => {
    switch (activeCard) {
      case 0:
        return <div className="text-[#a0a0a0] text-sm">Customer Subscription Status and Details</div>
      case 1:
        return <div className="text-[#a0a0a0] text-sm">Analytics Dashboard - Real-time Insights</div>
      case 2:
        return <div className="text-[#a0a0a0] text-sm">Data Visualization - Charts and Metrics</div>
      default:
        return <div className="text-[#a0a0a0] text-sm">Customer Subscription Status and Details</div>
    }
  }

  return (
    <div className="w-full min-h-screen relative overflow-x-hidden flex flex-col justify-start items-center" style={{
      background: `
        linear-gradient(135deg, 
          rgba(0, 0, 0, 0.95) 0%, 
          rgba(20, 20, 20, 0.98) 25%,
          rgba(255, 255, 255, 0.03) 50%,
          rgba(20, 20, 20, 0.98) 75%,
          rgba(0, 0, 0, 0.95) 100%
        ),
        radial-gradient(ellipse at top, rgba(255, 255, 255, 0.05) 0%, transparent 50%),
        radial-gradient(ellipse at bottom, rgba(0, 0, 0, 0.3) 0%, transparent 50%),
        linear-gradient(180deg, 
          rgba(0, 0, 0, 0.9) 0%,
          rgba(10, 10, 10, 0.95) 50%,
          rgba(0, 0, 0, 0.9) 100%
        )
      `,
      backgroundBlendMode: 'overlay, normal, normal, normal'
    }}>
      <div className="relative flex flex-col justify-start items-center w-full">
        {/* Main container with proper margins */}
        <div className="w-full px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 relative flex flex-col justify-start items-start min-h-screen">
          {/* Left vertical line */}
          <div className="w-[1px] h-full absolute left-4 sm:left-6 md:left-8 lg:left-12 xl:left-16 top-0 bg-[rgba(255,255,255,0.1)] shadow-[1px_0px_0px_rgba(255,255,255,0.05)] z-0"></div>

          {/* Right vertical line */}
          <div className="w-[1px] h-full absolute right-4 sm:right-6 md:right-8 lg:right-12 xl:right-16 top-0 bg-[rgba(255,255,255,0.1)] shadow-[1px_0px_0px_rgba(255,255,255,0.05)] z-0"></div>

          <div className="self-stretch pt-[9px] overflow-hidden border-b border-[rgba(255,255,255,0.05)] flex flex-col justify-center items-center gap-4 sm:gap-6 md:gap-8 lg:gap-[66px] relative z-10">
            {/* Navigation */}
            <div className="w-full h-12 sm:h-14 md:h-16 lg:h-[84px] absolute left-0 top-0 flex justify-center items-center z-20 px-6 sm:px-8 md:px-12 lg:px-12 xl:px-16">
              <div className="w-full h-0 absolute left-0 top-6 sm:top-7 md:top-8 lg:top-[42px] border-t border-[rgba(255,255,255,0.1)] shadow-[0px_1px_0px_rgba(255,255,255,0.05)]"></div>

              <div className="w-full max-w-[calc(100%-32px)] sm:max-w-[calc(100%-48px)] md:max-w-[calc(100%-64px)] lg:max-w-[800px] xl:max-w-[1000px] h-10 sm:h-11 md:h-12 py-1.5 sm:py-2 px-3 sm:px-4 md:px-4 pr-2 sm:pr-3 bg-[#1a1a1a] shadow-[0px_0px_0px_2px_rgba(255,255,255,0.1)] overflow-hidden rounded-[50px] flex justify-between items-center relative z-30">
                <div className="flex justify-center items-center">
                  <div className="flex justify-start items-center">
                    <div className="flex flex-col justify-center text-[#d9d9d9] text-sm sm:text-base md:text-lg lg:text-xl font-medium leading-5 font-sans">
                      reposs
                    </div>
                  </div>
                </div>

                <div className="h-6 sm:h-7 md:h-8 flex justify-start items-start gap-2 sm:gap-3">
                  <Link href="/auth/signin">
                    <motion.div
                      whileHover={{ scale: 1.05, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      className="cursor-pointer px-2 sm:px-3 md:px-[14px] py-1 sm:py-[6px] bg-[#303030] shadow-[0px_1px_2px_rgba(0,0,0,0.2)] overflow-hidden rounded-full flex justify-center items-center">
                      <div className="text-[#d9d9d9] text-xs md:text-[13px] font-medium leading-5 font-sans">
                        Log in
                      </div>
                    </motion.div>
                  </Link>

                </div>
              </div>
            </div>

            {/* Hero Section */}
            <div className="pt-16 sm:pt-20 md:pt-24 lg:pt-[216px] pb-8 sm:pb-12 md:pb-16 flex flex-col justify-start items-center px-2 sm:px-4 md:px-8 lg:px-0 w-full sm:pl-0 sm:pr-0 pl-0 pr-0 relative overflow-hidden">
              {/* Dotted Glow Background - Optimized */}
              <DottedGlowBackground
                className="absolute inset-0 z-0"
                gap={24}
                radius={1.5}
                color="rgba(217, 217, 217, 0.15)"
                darkColor="rgba(217, 217, 217, 0.15)"
                glowColor="rgba(102, 217, 255, 0.9)"
                darkGlowColor="rgba(102, 217, 255, 0.9)"
                opacity={0.7}
                backgroundOpacity={0}
                speedMin={0.2}
                speedMax={0.6}
                speedScale={0.7}
              />


              <motion.div
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
                className="w-full max-w-[1400px] flex flex-col justify-center items-center gap-3 sm:gap-4 md:gap-5 lg:gap-6 relative z-10"
              >
                <div className="self-stretch rounded-[3px] flex flex-col justify-center items-center gap-4 sm:gap-5 md:gap-6 lg:gap-8">
                  <motion.div
                    variants={staggerItem}
                    className="w-full max-w-[1200px] text-center flex justify-center flex-col text-[#d9d9d9] text-[20px] xs:text-[28px] sm:text-[36px] md:text-[52px] lg:text-[80px] font-normal leading-[1.1] sm:leading-[1.15] md:leading-[1.2] lg:leading-24 font-serif px-2 sm:px-4 md:px-0"
                  >
                    Explore. Filter. Review. Contribute.
                  </motion.div>
                  <motion.div
                    variants={staggerItem}
                    className="w-full max-w-[800px] text-center flex justify-center flex-col text-[#a0a0a0] sm:text-lg md:text-xl leading-[1.4] sm:leading-[1.45] md:leading-[1.5] lg:leading-7 font-sans px-2 sm:px-4 md:px-0 lg:text-lg font-medium text-sm"
                  >
                    reposs helps you search, filter, and explore GitHub repositories
                    so you can find the right projects to learn from and contribute to.
                  </motion.div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.6, ease: [0.22, 1, 0.36, 1] as const }}
                className="w-full max-w-[600px] flex flex-col justify-center items-center gap-6 sm:gap-8 md:gap-10 lg:gap-12 relative z-10 mt-6 sm:mt-8 md:mt-10 lg:mt-12"
              >
                <div className="flex justify-start items-center gap-4">
                <Link href="/auth/signin">
                  <motion.button
                    whileHover={{ scale: 1.04, y: -1 }}
                    whileTap={{ scale: 0.97 }}
                    className="h-10 sm:h-11 md:h-12 px-6 sm:px-8 md:px-10 rounded-full bg-neutral-200 text-neutral-900 text-sm md:text-base font-medium tracking-tight flex items-center justify-center transition-colors duration-150"
                  >
                    Start for free
                  </motion.button>
                </Link>


                </div>
              </motion.div>


              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-15%" }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] as const }}
                className="w-full pt-2 sm:pt-4 pb-6 sm:pb-8 md:pb-10 px-2 sm:px-4 md:px-6 lg:px-11 flex flex-col justify-center items-center gap-2 relative z-5 my-8 sm:my-12 md:my-16 lg:my-16 mb-0 lg:pb-0"
              >

                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] as const }}
                  className="relative w-full bg-[#303030] shadow-[0px_0px_0px_0.9px_rgba(255,255,255,0.1)] overflow-hidden rounded-[6px] sm:rounded-[8px] lg:rounded-[9px]"
                >
                  <HomeSection
                    repositories={repositories}
                    loading={loadingRepositories}
                    variant="landing"
                  />
                </motion.div>

                <div className="relative w-full -mt-60 pointer-events-none">
                  <div className="relative w-full h-80 flex items-center justify-center pointer-events-auto rounded-b-[12px] overflow-hidden">

                    <div
                      className="absolute inset-0 backdrop-blur-[8px]"
                      style={{
                        maskImage:
                          "linear-gradient(to bottom, transparent 0%, black 12%, black 100%), linear-gradient(to right, black 0%, black 100%)",
                        WebkitMaskImage:
                          "linear-gradient(to bottom, transparent 0%, black 12%, black 100%), linear-gradient(to right, black 0%, black 100%)",
                        maskComposite: "intersect",
                        WebkitMaskComposite: "source-in"
                      }}
                    />

                    <div
                      className="absolute inset-0 backdrop-blur-[15px]"
                      style={{
                        maskImage:
                          "linear-gradient(to bottom, transparent 0%, black 10%, black 60%, transparent 100%), linear-gradient(to right, black 0%, black 100%)",
                        WebkitMaskImage:
                          "linear-gradient(to bottom, transparent 0%, black 10%, black 60%, transparent 100%), linear-gradient(to right, black 0%, black 100%)",
                        maskComposite: "intersect",
                        WebkitMaskComposite: "source-in"
                      }}
                    />

                    <div
                      className="absolute inset-0 backdrop-blur-[25px]"
                      style={{
                        maskImage:
                          "linear-gradient(to top, black 0%, black 55%, transparent 100%), linear-gradient(to right, black 0%, black 100%)",
                        WebkitMaskImage:
                          "linear-gradient(to top, black 0%, black 55%, transparent 100%), linear-gradient(to right, black 0%, black 100%)",
                        maskComposite: "intersect",
                        WebkitMaskComposite: "source-in"
                      }}
                    />

                    <Link href="/auth/signin">
                      <div className="cursor-pointer relative z-10 px-4 py-2 bg-black text-white rounded-md text-sm shadow-sm">
                        Sign in to unlock
                      </div>
                    </Link>
                  </div>
                </div>

              </motion.div>
            </div>
            {/* Feature Section */}
            <div className="w-full border-t border-b border-[rgba(255,255,255,0.08)] bg-gradient-to-b from-[#0a0a0b] via-[#080808] to-[#060607] relative overflow-hidden">
              <div
                className="absolute inset-0 pointer-events-none opacity-90"
                style={{
                  background: `
                    radial-gradient(circle at 18% 22%, rgba(111, 214, 255, 0.08), transparent 32%),
                    radial-gradient(circle at 82% 18%, rgba(130, 119, 255, 0.08), transparent 30%),
                    radial-gradient(circle at 64% 82%, rgba(0, 255, 178, 0.05), transparent 28%)
                  `
                }}
              />

              <div className="relative w-full px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 py-12 sm:py-14 md:py-16 lg:py-20 flex justify-center">
                <div className="w-full max-w-[1180px] flex flex-col gap-8 sm:gap-10 md:gap-12">
                  <div className="flex flex-col items-center text-center gap-3 sm:gap-4 md:gap-5">
                    <Badge
                      icon={
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <rect x="1" y="1" width="10" height="10" rx="2" stroke="#d9d9d9" strokeWidth="1" fill="none" />
                          <path d="M3 6h6" stroke="#d9d9d9" strokeWidth="1" strokeLinecap="round" />
                        </svg>
                      }
                      text="Features"
                    />
                    <div className="text-[#f5f5f5] text-[28px] sm:text-[34px] md:text-[40px] lg:text-[44px] font-semibold leading-[1.1] tracking-tight max-w-[760px]">
                      Built to simplify open-source discovery
                    </div>
                    <p className="text-[#a0a0a0] text-sm sm:text-base md:text-lg leading-relaxed max-w-[760px]">
                      Explore GitHub repositories with structured filters, curated signals, and fast navigation that reduce noise and surface relevance.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 lg:grid-rows-2 gap-4 sm:gap-5 lg:gap-6">
                    <FeatureTile
                      title="Repository discovery"
                      description="Search and browse GitHub repositories using language, stars, topics, and activity to quickly find relevant projects."
                      className="lg:col-span-6 lg:row-span-1 min-h-[320px]"
                    >
                      <div className="space-y-4 text-sm text-[#a8a8b3] leading-relaxed">
                        <div className="rounded-2xl border border-white/5 bg-white/5 px-3 py-2 flex items-center gap-2 text-[13px] text-[#dfe1e6]">
                          <div className="h-9 flex-1 rounded-xl border border-white/10 bg-[#0f0f12] px-3 flex items-center text-[#a8a8b3]">
                            Search repositories
                          </div>
                          <div className="h-9 px-3 rounded-xl border border-white/10 bg-[#11121a] text-[12px] text-[#dfe1e6] flex items-center">
                            All Languages
                          </div>
                          <div className="h-9 px-3 rounded-xl border border-white/10 bg-[#11121a] text-[12px] text-[#dfe1e6] flex items-center">
                            Most Stars
                          </div>
                        </div>
                        <div className="space-y-2 rounded-2xl border border-white/5 bg-[#0d0e12]/80 px-3 py-2">
                          {["ml-sharp", "agentskills"].map((name) => (
                            <div key={name} className="flex items-center justify-between gap-3 rounded-xl px-2 py-2 hover:bg-white/5 transition-colors">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-white/10 border border-white/10" />
                                <div className="flex flex-col gap-1">
                                  <span className="text-[#dfe1e6] text-[13px] font-medium">{name}</span>
                                  <span className="text-xs text-[#a0a0a8]">owner</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="px-3 py-1 rounded-full bg-[#0f1115] border border-white/10 text-[12px] text-[#dfe1e6]">Python</span>
                                <span className="px-3 py-1 rounded-full bg-[#11121a] border border-white/10 text-[12px] text-[#dfe1e6]">Legendary</span>
                                <div className="w-8 h-8 rounded-full border border-white/10 bg-white/5 flex items-center justify-center text-[#dfe1e6]">
                                  ✕
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                        <p>Use familiar search, filters, and row structure to keep results stable.</p>
                      </div>
                    </FeatureTile>

                    <FeatureTile
                      title="Fast filtering and exploration"
                      description="Instant filtering without losing context, designed for rapid comparison across multiple repositories."
                      className="lg:col-span-6 lg:row-span-1 min-h-[320px]"
                    >
                      <div className="space-y-4 text-sm text-[#a8a8b3] leading-relaxed">
                        <div className="rounded-2xl border border-white/5 bg-[#0d0e12]/80 p-3 space-y-3">
                          <div className="flex items-center gap-2">
                            <div className="h-8 flex-1 rounded-xl border border-white/10 bg-white/5 px-3 text-[12px] text-[#a8a8b3] flex items-center">
                              Inline filter keeps context
                            </div>
                            <div className="h-8 px-3 rounded-xl border border-white/10 bg-[#11121a] text-[12px] text-[#dfe1e6] flex items-center">
                              Apply
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {["Keyboard", "Inline", "Context on"].map((chip) => (
                              <span key={chip} className="px-3 py-1 rounded-full border border-white/10 bg-white/5 text-[12px] text-[#dfe1e6]">
                                {chip}
                              </span>
                            ))}
                          </div>
                          <div className="flex items-center justify-between gap-3 text-[13px] text-[#dfe1e6]">
                            <span className="inline-flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-white/20" />
                              Context preserved
                            </span>
                            <div className="w-8 h-8 rounded-full border border-white/10 bg-white/5 flex items-center justify-center text-[#dfe1e6]">
                              ⇄
                            </div>
                          </div>
                        </div>
                        <p>Filters apply instantly while preserving comparisons side by side.</p>
                        <p>Consistent spacing and alignment keep every change calm.</p>
                      </div>
                    </FeatureTile>

                    <FeatureTile
                      title="Staff-picked curation"
                      description="Highlighted repositories manually selected to surface high-quality, noteworthy, or emerging projects."
                      className="lg:col-span-4 lg:row-span-1 min-h-[280px]"
                    >
                      <div className="space-y-4 text-sm text-[#a8a8b3] leading-relaxed">
                        <div className="rounded-2xl border border-white/5 bg-[#0d0e12]/80 p-3 space-y-2">
                          {["Readable docs", "Responsive maintainers", "Clear roadmap"].map((item) => (
                            <div key={item} className="flex items-center justify-between gap-3 rounded-xl border border-white/5 bg-white/5 px-3 py-2 text-[13px] text-[#dfe1e6]">
                              <span className="inline-flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-white/20" />
                                {item}
                              </span>
                              <span className="h-6 px-2 rounded-lg border border-white/10 bg-[#11121a] text-[11px] text-[#cfd0d3] flex items-center">
                                curated
                              </span>
                            </div>
                          ))}
                        </div>
                        <p>Each pick is reviewed for quality, clarity, and momentum before it’s highlighted.</p>
                        <p>Selections refresh regularly to keep discoveries feeling current.</p>
                      </div>
                    </FeatureTile>

                    <FeatureTile
                      title="Badge-based classification"
                      description="Repositories grouped using clear badges such as startup, devtools, AI, bug bounty, and GSSoC for faster contextual scanning."
                      className="lg:col-span-4 lg:row-span-1 min-h-[280px]"
                    >
                      <div className="space-y-4 text-sm text-[#a8a8b3] leading-relaxed">
                        <div className="rounded-2xl border border-white/5 bg-white/5 px-3 py-2 flex flex-wrap gap-2">
                          {["Startup", "Devtools", "AI", "Bug bounty", "GSSoC", "Community"].map((badge) => (
                            <span
                              key={badge}
                              className="px-3 py-1.5 rounded-full border border-white/10 bg-[#0f1117] text-[12px] text-[#dfe1e6] uppercase tracking-wide"
                            >
                              {badge}
                            </span>
                          ))}
                        </div>
                        <div className="rounded-2xl border border-white/5 bg-[#0d0e12]/80 p-3 space-y-2">
                          {["Signals stay consistent across categories", "Text-first labels keep scanning calm"].map((line) => (
                            <div key={line} className="flex items-center justify-between gap-2 text-[13px] text-[#dfe1e6] rounded-xl px-2 py-2 border border-white/5 bg-white/5">
                              <span className="inline-flex items-center gap-2">
                                <span className="h-2 w-2 rounded-full bg-white/20" />
                                {line}
                              </span>
                              <span className="h-6 px-2 rounded-lg border border-white/10 bg-[#11121a] text-[11px] text-[#cfd0d3] flex items-center">
                                badge
                              </span>
                            </div>
                          ))}
                        </div>
                        <p>Badges keep scanning fast while remaining low-noise.</p>
                      </div>
                    </FeatureTile>

                    <FeatureTile
                      title="Unified repository view"
                      description="Essential GitHub metadata presented cleanly in one place: stars, forks, language, and last activity."
                      className="lg:col-span-4 lg:row-span-1 min-h-[280px]"
                    >
                      <div className="space-y-4 text-sm text-[#a8a8b3] leading-relaxed">
                        <div className="rounded-2xl border border-white/5 bg-[#0d0e12]/80 p-3 space-y-2">
                          {["Core details stay together", "Layout stays predictable", "Muted labels keep balance"].map((line) => (
                            <div key={line} className="flex items-center justify-between gap-3 rounded-xl border border-white/5 bg-white/5 px-3 py-2 text-[13px] text-[#dfe1e6]">
                              <span className="inline-flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-white/20" />
                                {line}
                              </span>
                              <div className="flex items-center gap-2">
                                <span className="px-3 py-1 rounded-full bg-[#0f1115] border border-white/10 text-[12px] text-[#dfe1e6]">TypeScript</span>
                                <div className="w-8 h-8 rounded-full border border-white/10 bg-white/5 flex items-center justify-center text-[#dfe1e6]">
                                  ⧉
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                        <p>Core metadata sits in one place without clutter.</p>
                        <p>Muted supporting text keeps the hierarchy calm.</p>
                      </div>
                    </FeatureTile>
                  </div>
                </div>
              </div>
            </div>
            {/* FAQ Section */}
            <FAQSection />

            {/* CTA Section */}
            <CTASection />

            {/* Footer Section */}
            <FooterSection />
          </div>
        </div>
      </div>
    </div>
  )
}

// FeatureCard component definition inline to fix import error
function FeatureCard({
  title,
  description,
  isActive,
  progress,
  onClick,
}: {
  title: string
  description: string
  isActive: boolean
  progress: number
  onClick: () => void
}) {
  return (
    <div
      className={`w-full md:flex-1 self-stretch px-6 py-5 overflow-hidden flex flex-col justify-start items-start gap-2 cursor-pointer relative border-b md:border-b-0 last:border-b-0 ${isActive
        ? "bg-[#303030] shadow-[0px_0px_0px_0.75px_rgba(255,255,255,0.1)_inset]"
        : "border-l-0 border-r-0 md:border border-[rgba(255,255,255,0.1)]"
        }`}
      onClick={onClick}
    >
      {isActive && (
        <div className="absolute top-0 left-0 w-full h-0.5 bg-[rgba(255,255,255,0.1)]">
          <div
            className="h-full bg-[#a0a0a0] transition-all duration-100 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      <div className="self-stretch flex justify-center flex-col text-[#d9d9d9] text-sm md:text-sm font-semibold leading-6 md:leading-6 font-sans">
        {title}
      </div>
      <div className="self-stretch text-[#a0a0a0] text-[13px] md:text-[13px] font-normal leading-[22px] md:leading-[22px] font-sans">
        {description}
      </div>
    </div>
  )
}