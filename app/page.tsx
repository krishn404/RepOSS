"use client"

import { useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { RiNextjsFill } from "react-icons/ri"
import FAQSection from "@/components/landing/faq-section"
import CTASection from "@/components/landing/cta-section"
import FooterSection from "@/components/landing/footer-section"
import { HomeSection } from "@/components/opensource/home-section"
import { Badge } from "@/components/ui/badge"
import { FeatureTile } from "@/components/feature-tile"
import { GitHubRepoTable } from "@/components/github-repo-table"
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
            <div className="w-full border-t border-b border-border/50 bg-gradient-to-b from-background via-background to-muted/20 relative overflow-hidden">
              <div
                className="absolute inset-0 pointer-events-none opacity-30"
                style={{
                  background: `
                    radial-gradient(circle at 20% 20%, oklch(0.65 0.18 200 / 0.2) 0%, transparent 50%),
                    radial-gradient(circle at 80% 20%, oklch(0.7 0.2 220 / 0.15) 0%, transparent 45%),
                    radial-gradient(circle at 50% 80%, oklch(0.6 0.16 180 / 0.18) 0%, transparent 40%)
                  `,
                }}
              />

              <div className="relative w-full px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 py-12 sm:py-16 md:py-20 lg:py-24 xl:py-28 flex justify-center">
                <div className="w-full max-w-[1200px] flex flex-col gap-8 sm:gap-10 md:gap-12 lg:gap-14 xl:gap-16">
                  <motion.div 
                    initial={{ opacity: 0, y: 50 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] as const }}
                    className="flex flex-col items-center text-center gap-3 sm:gap-4 md:gap-5 lg:gap-6 relative"
                  >
                    <div className="absolute inset-0 flex items-start justify-center pointer-events-none -top-8 sm:-top-12 md:-top-16">
                      <div className="relative">
                        <div
                          className="absolute inset-0 blur-3xl opacity-40"
                          style={{
                            background: `
                              radial-gradient(circle at 30% 30%, oklch(0.7 0.2 220 / 0.4) 0%, transparent 60%),
                              radial-gradient(circle at 70% 50%, oklch(0.65 0.18 180 / 0.35) 0%, transparent 60%),
                              radial-gradient(circle at 50% 80%, oklch(0.6 0.15 200 / 0.3) 0%, transparent 50%)
                            `,
                            width: "clamp(250px, 80vw, 400px)",
                            height: "clamp(250px, 80vw, 400px)",
                            transform: "translate(-50%, 0)",
                            left: "50%",
                          }}
                        />
                        <div className="relative w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 lg:w-28 lg:h-28 mx-auto mb-4 sm:mb-6">
                          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/20 via-cyan-500/10 to-blue-500/20 border border-primary/20 backdrop-blur-sm" />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <svg
                              width="100%"
                              height="100%"
                              viewBox="0 0 100 100"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                              className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 text-primary"
                            >
                              <path
                                d="M50 10C27.91 10 10 27.91 10 50c0 17.67 11.47 32.65 27.38 37.93 2 .37 2.73-.87 2.73-1.93 0-.95-.03-3.46-.05-6.79-11.13 2.42-13.48-5.37-13.48-5.37-1.82-4.62-4.44-5.85-4.44-5.85-3.63-2.48.27-2.43.27-2.43 4.01.28 6.12 4.12 6.12 4.12 3.57 6.11 9.36 4.35 11.64 3.32.36-2.58 1.4-4.35 2.54-5.35-8.88-1.01-18.22-4.44-18.22-19.76 0-4.36 1.56-7.92 4.12-10.71-.41-1.01-1.79-5.08.39-10.58 0 0 3.36-1.07 11 4.1 3.19-.89 6.61-1.33 10.01-1.35 3.4.02 6.82.46 10.01 1.35 7.64-5.17 11-4.1 11-4.1 2.18 5.5.8 9.57.39 10.58 2.56 2.79 4.12 6.35 4.12 10.71 0 15.36-9.35 18.74-18.26 19.73 1.44 1.24 2.72 3.68 2.72 7.42 0 5.35-.05 9.67-.05 10.98 0 1.07.72 2.32 2.74 1.93C78.54 82.64 90 67.66 90 50c0-22.09-17.91-40-40-40z"
                                fill="currentColor"
                                fillOpacity="0.9"
                              />
                              
                            </svg>
                          </div>
                          <div className="absolute inset-0 rounded-2xl border border-primary/30" />
                          <div className="absolute -inset-2 rounded-2xl border border-primary/10" />
                        </div>
                      </div>
                    </div>

                    <div className="mt-16 sm:mt-20 md:mt-24 lg:mt-28 xl:mt-32" />

                    <Badge
                      variant="outline"
                      className="h-6 sm:h-7 px-2.5 sm:px-3 gap-1.5 sm:gap-2 bg-muted/50 border-border/60 text-muted-foreground"
                    >
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 14 14"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="opacity-70 w-3 h-3 sm:w-3.5 sm:h-3.5"
                      >
                        <path d="M7 1L12 4v6l-5 3-5-3V4l5-3z" stroke="currentColor" strokeWidth="1.2" fill="none" />
                      </svg>
                      <span className="text-[10px] sm:text-xs font-medium">Features</span>
                    </Badge>
                    <h2 className="text-foreground text-[24px] sm:text-[32px] md:text-[40px] lg:text-[48px] xl:text-[56px] font-semibold leading-[1.1] tracking-tight max-w-[860px] text-balance px-2">
                      Built to simplify open-source discovery
                    </h2>
                    <p className="text-muted-foreground text-sm sm:text-base md:text-lg lg:text-xl leading-relaxed max-w-[720px] text-pretty px-2">
                      Explore GitHub repositories with structured filters, curated signals, and fast navigation that reduce
                      noise and surface relevance.
                    </p>
                  </motion.div>

                  <motion.div 
                    initial={{ opacity: 0, y: 50 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] as const }}
                    className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 md:gap-6 lg:gap-7"
                  >
                    <FeatureTile
                      title="Repository discovery"
                      description="Search and browse GitHub repositories using language, stars, topics, and activity to quickly find relevant projects."
                      className="lg:col-span-7"
                    >
                      <div className="space-y-3 sm:space-y-4">
                        <div className="rounded-lg border border-border/60 bg-card/80 backdrop-blur-sm px-2.5 sm:px-3 py-2 sm:py-2.5 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shadow-sm">
                          <div className="h-8 sm:h-9 flex-1 rounded-md border border-border bg-background/95 px-2.5 sm:px-3 flex items-center gap-1.5 sm:gap-2 text-muted-foreground text-xs sm:text-sm">
                            <svg
                              width="14"
                              height="14"
                              viewBox="0 0 14 14"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                              className="opacity-60"
                            >
                              <circle cx="6" cy="6" r="4" stroke="currentColor" strokeWidth="1.2" fill="none" />
                              <path d="M9 9l3 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                            </svg>
                            <span className="opacity-60 text-[10px] sm:text-xs">Search repositories...</span>
                          </div>
                          <button className="h-8 sm:h-9 px-2.5 sm:px-3.5 rounded-md border border-border bg-card text-[10px] sm:text-xs font-medium text-foreground flex items-center gap-1 sm:gap-1.5">
                            All Languages
                            <svg width="10" height="10" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-2.5 h-2.5 sm:w-3 sm:h-3">
                              <path d="M3 5l3 3 3-3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                            </svg>
                          </button>
                          <button className="h-8 sm:h-9 px-2.5 sm:px-3.5 rounded-md border border-border bg-card text-[10px] sm:text-xs font-medium text-foreground flex items-center gap-1 sm:gap-1.5">
                            Most Stars
                            <svg width="10" height="10" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-2.5 h-2.5 sm:w-3 sm:h-3">
                              <path d="M3 5l3 3 3-3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                            </svg>
                          </button>
                        </div>

                        <GitHubRepoTable />

                        <p className="text-[12px] sm:text-[13px] text-muted-foreground leading-relaxed">
                          Instantly browse repositories with unified metadata and familiar GitHub structure.
                        </p>
                      </div>
                    </FeatureTile>

                    <FeatureTile
                      title="Staff-picked curation"
                      description="Highlighted repositories manually selected to surface high-quality, noteworthy, or emerging projects."
                      className="lg:col-span-5"
                    >
                      <div className="space-y-3 sm:space-y-4">
                        <div className="rounded-lg border border-border/60 bg-card/80 backdrop-blur-sm overflow-hidden shadow-sm">
                          <div className="px-2.5 sm:px-3 py-2 sm:py-2.5 border-b border-border/40 bg-muted/20">
                            <div className="flex items-center gap-2">
                              <span className="text-xs sm:text-sm font-semibold text-foreground">reposs</span>
                            </div>
                            <p className="text-[10px] sm:text-[11px] text-muted-foreground mt-0.5">Discover amazing open-source projects</p>
                          </div>

                          <div className="p-1.5 sm:p-2">
                            <div className="space-y-0.5 sm:space-y-1">
                              {[
                                { name: "Home", active: false },
                                { name: "Trending", active: false },
                                { name: "Staff Picked", active: true },
                                { name: "Bookmarks", active: false },
                              ].map((item) => (
                                <div
                                  key={item.name}
                                  className={`flex items-center gap-2 sm:gap-2.5 px-2 sm:px-3 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm ${
                                    item.active
                                      ? "bg-accent text-foreground font-medium"
                                      : "text-muted-foreground"
                                  }`}
                                >
                                  <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded bg-muted/60 flex-shrink-0" />
                                  {item.name}
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="px-2.5 sm:px-3 py-2 sm:py-2.5 border-t border-border/40 bg-muted/10">
                            <div className="flex items-start gap-1.5 sm:gap-2 p-2 sm:p-2.5 rounded-md bg-primary/10 border border-primary/20">
                              <svg
                                width="14"
                                height="14"
                                viewBox="0 0 16 16"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                                className="text-primary flex-shrink-0 mt-0.5 w-3.5 h-3.5 sm:w-4 sm:h-4"
                              >
                                <path
                                  d="M8 1l2 5h5l-4 3 2 5-5-3-5 3 2-5-4-3h5l2-5z"
                                  stroke="currentColor"
                                  strokeWidth="1.2"
                                  fill="none"
                                />
                              </svg>
                              <div>
                                <p className="text-[10px] sm:text-[11px] font-medium text-primary">Curated Selection</p>
                                <p className="text-[9px] sm:text-[10px] text-muted-foreground mt-0.5">
                                  Quality projects reviewed by maintainers
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>

                        <p className="text-[12px] sm:text-[13px] text-muted-foreground leading-relaxed">
                          Navigate to staff picks through the sidebar to discover high-quality, vetted repositories.
                        </p>
                      </div>
                    </FeatureTile>

                    <FeatureTile
                      title="Badge-based classification"
                      description="Repositories grouped using clear badges such as startup, devtools, AI, bug bounty, and GSSoC for faster contextual scanning."
                      className="lg:col-span-4"
                    >
                      <div className="space-y-3 sm:space-y-4">
                        <div className="rounded-lg border border-border/60 bg-card/50 backdrop-blur-sm p-2.5 sm:p-3 space-y-2.5 sm:space-y-3 shadow-sm">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                              Categories
                            </span>
                            <button className="text-[10px] sm:text-xs text-primary">Clear all</button>
                          </div>

                          <div className="flex flex-wrap gap-1.5 sm:gap-2">
                            {[
                              { name: "Startup", active: true },
                              { name: "Devtools", active: true },
                              { name: "AI", active: false },
                              { name: "Bug Bounty", active: false },
                              { name: "GSSoC", active: false },
                              { name: "Community", active: false },
                            ].map((badge) => (
                              <button
                                key={badge.name}
                                className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-md border text-[10px] sm:text-xs font-semibold uppercase tracking-wide ${
                                  badge.active
                                    ? "bg-primary/10 border-primary/30 text-primary"
                                    : "bg-muted/40 border-border/50 text-muted-foreground"
                                }`}
                              >
                                {badge.name}
                              </button>
                            ))}
                          </div>

                          <div className="pt-1.5 sm:pt-2 border-t border-border/40">
                            <div className="flex items-center justify-between text-[10px] sm:text-xs">
                              <span className="text-muted-foreground">154 repositories</span>
                              <span className="text-primary font-medium">2 active</span>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-1.5 sm:space-y-2">
                          {[
                            { category: "Devtools", color: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
                            { category: "Startup", color: "bg-green-500/10 text-green-400 border-green-500/20" },
                          ].map((item, idx) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg border border-border/40 bg-muted/30 text-[10px] sm:text-xs"
                            >
                              <span className="text-foreground font-medium truncate">Repository {idx + 1}</span>
                              <span className={`px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-md border text-[9px] sm:text-[10px] font-semibold flex-shrink-0 ${item.color}`}>
                                {item.category}
                              </span>
                            </div>
                          ))}
                        </div>

                        <p className="text-[12px] sm:text-[13px] text-muted-foreground leading-relaxed">
                          Filter by badge categories to instantly narrow down repositories by context and purpose.
                        </p>
                      </div>
                    </FeatureTile>

                    <FeatureTile
                      title="Unified repository view"
                      description="Essential GitHub metadata presented cleanly in one place: stars, forks, language, and last activity."
                      className="lg:col-span-4"
                    >
                      <div className="space-y-2.5 sm:space-y-3">
                        <div className="rounded-lg border border-border/60 bg-card/80 backdrop-blur-sm overflow-hidden shadow-sm">
                          <div className="p-3 sm:p-4 space-y-2.5 sm:space-y-3">
                            <div className="flex items-start gap-2.5 sm:gap-3">
                              <RiNextjsFill className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex-shrink-0 text-foreground" />
                              <div className="flex-1 min-w-0">
                                <h4 className="text-xs sm:text-sm font-semibold text-foreground truncate">next.js</h4>
                                <p className="text-[10px] sm:text-xs text-muted-foreground">vercel</p>
                              </div>
                            </div>

                            <p className="text-[10px] sm:text-xs text-muted-foreground leading-relaxed line-clamp-2">
                              The React Framework for the Web
                            </p>

                            <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
                              <div className="flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-xs">
                                <svg width="12" height="12" viewBox="0 0 14 14" fill="none" className="text-yellow-500 w-3 h-3 sm:w-3.5 sm:h-3.5">
                                  <path d="M7 1l2 4 4 .5-3 3 .5 4-3.5-2-3.5 2 .5-4-3-3 4-.5 2-4z" fill="currentColor" />
                                </svg>
                                <span className="text-muted-foreground">120k</span>
                              </div>
                              <div className="flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-xs">
                                <svg width="12" height="12" viewBox="0 0 14 14" fill="none" className="text-muted-foreground w-3 h-3 sm:w-3.5 sm:h-3.5">
                                  <path
                                    d="M5 4c0-1 1-2 2-2s2 1 2 2-1 2-2 2zm4 7c0 1-1 2-2 2s-2-1-2-2 1-2 2-2z"
                                    stroke="currentColor"
                                    strokeWidth="1.2"
                                    fill="none"
                                  />
                                  <path d="M7 6v2" stroke="currentColor" strokeWidth="1.2" />
                                </svg>
                                <span className="text-muted-foreground">26k</span>
                              </div>
                            </div>

                            <div className="flex items-center justify-between pt-1.5 sm:pt-2 border-t border-border/40">
                              <span className="inline-flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md bg-muted/60 border border-border/50 text-[10px] sm:text-xs">
                                <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-yellow-500" />
                                TypeScript
                              </span>
                              <span className="text-[10px] sm:text-xs text-muted-foreground">Updated today</span>
                            </div>
                          </div>
                        </div>

                        <p className="text-[12px] sm:text-[13px] text-muted-foreground leading-relaxed">
                          All essential metadata in a single, scannable view for quick repository evaluation.
                        </p>
                      </div>
                    </FeatureTile>

                    <FeatureTile
                      title="Fast filtering and exploration"
                      description="Instant filtering without losing context, designed for rapid comparison across multiple repositories."
                      className="lg:col-span-4"
                    >
                      <div className="space-y-2.5 sm:space-y-3">
                        <div className="rounded-lg border border-border/60 bg-card/50 backdrop-blur-sm p-2.5 sm:p-3 space-y-2 sm:space-y-2.5 shadow-sm">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                              Filters
                            </span>
                            <span className="text-[10px] sm:text-xs text-primary font-medium">3 active</span>
                          </div>

                          <div className="space-y-1.5 sm:space-y-2">
                            {["JavaScript", "Stars > 1000", "Updated this year"].map((label) => (
                              <div
                                key={label}
                                className="flex items-center justify-between p-1.5 sm:p-2 rounded-md bg-muted/40 border border-border/50"
                              >
                                <span className="text-[10px] sm:text-xs font-medium text-foreground truncate">{label}</span>
                                <button className="text-[10px] sm:text-xs text-muted-foreground flex-shrink-0 ml-1">✕</button>
                              </div>
                            ))}
                          </div>

                          <div className="pt-1.5 sm:pt-2 border-t border-border/40">
                            <div className="flex items-center justify-between text-[10px] sm:text-xs">
                              <span className="text-muted-foreground">847 results</span>
                              <button className="text-primary">Add filter</button>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
                          {["Python", "TypeScript", "Go", "Rust"].map((lang) => (
                            <button
                              key={lang}
                              className="px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-md border border-border bg-card text-[10px] sm:text-xs font-medium text-foreground"
                            >
                              {lang}
                            </button>
                          ))}
                        </div>

                        <p className="text-[12px] sm:text-[13px] text-muted-foreground leading-relaxed">
                          Apply multiple filters instantly and switch between language contexts without page reloads.
                        </p>
                      </div>
                    </FeatureTile>
                  </motion.div>
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
