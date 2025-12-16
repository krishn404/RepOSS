"use client"

import { useEffect, useMemo, useState } from "react"
import { useSession } from "next-auth/react"
import { useMutation, usePaginatedQuery, useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { UserMenu } from "@/components/user-menu"
import { BeamsBackground } from "@/components/opensource/bg-beams"
import { AdminRepoTable } from "@/components/admin/admin-repo-table"
import type { Repository } from "@/components/opensource/repo-table"
import { Loader2, Search, ShieldCheck, CheckCircle2 } from "lucide-react"
import Link from "next/link"

const BADGE_OPTIONS = [
  { value: "startup", label: "Startup" },
  { value: "bug_bounty", label: "Bug Bounty" },
  { value: "gssoc", label: "GSSoC" },
  { value: "ai", label: "AI" },
  { value: "devtools", label: "DevTools" },
] as const

const BADGE_VALUES = BADGE_OPTIONS.map((b) => b.value)

type BadgeValue = (typeof BADGE_OPTIONS)[number]["value"]

const isBadgeValue = (b: unknown): b is BadgeValue =>
  typeof b === "string" && (BADGE_VALUES as readonly string[]).includes(b)

type GitHubRepo = Repository & {
  staffPickBadges?: string[]
  isStaffPicked?: boolean
  repoId?: number
}

export default function AdminPage() {
  const { data: session, status } = useSession()
  // @ts-ignore - NextAuth augments user
  const userId = session?.user?.id as string | undefined

  const isAdmin = useQuery(api.users.checkIsAdmin, userId ? { userId } : "skip")
  const overview = useQuery(api.admin.getOverview, userId && isAdmin ? { userId } : "skip")

  const [searchTerm, setSearchTerm] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(searchTerm.trim().toLowerCase()), 250)
    return () => clearTimeout(id)
  }, [searchTerm])

  const [badgeFilter, setBadgeFilter] = useState<BadgeValue | null>(null)
  const [sort, setSort] = useState<"staffPickedAt" | "stars">("staffPickedAt")

  const {
    results = [],
    status: reposStatus,
    loadMore,
    isLoading,
  } = usePaginatedQuery(
    api.admin.listRepositories,
    userId && isAdmin
      ? {
          userId,
          search: debouncedSearch || undefined,
          type: badgeFilter || undefined,
          sort,
        }
      : "skip",
    { initialNumItems: 40 }
  )

  const setStaffPick = useMutation(api.admin.setStaffPick)

  const [optimistic, setOptimistic] = useState<Record<number, Partial<{ isStaffPicked: boolean; staffPickBadges: BadgeValue[] }>>>({})
  const [modalRepo, setModalRepo] = useState<GitHubRepo | null>(null)
  const [modalBadges, setModalBadges] = useState<BadgeValue | null>(null)
  const [modalNote, setModalNote] = useState("")
  const [modalTargetPick, setModalTargetPick] = useState<boolean>(true)

  const mergedResults = useMemo(() => {
    return results.map((repo: any) => ({
      ...repo,
      ...(optimistic[repo.repoId] ?? {}),
    })) as any[]
  }, [results, optimistic])

  const repositories = useMemo(() => {
    return mergedResults.map((repo: any) => ({
      id: repo.repoId,
      name: repo.name,
      full_name: repo.fullName,
      description: repo.description || "",
      language: repo.language || "",
      stargazers_count: repo.stars ?? 0,
      forks_count: repo.forks ?? 0,
      topics: repo.topics || [],
      html_url: repo.htmlUrl || `https://github.com/${repo.fullName}`,
      owner: {
        login: repo.ownerLogin,
        avatar_url: repo.ownerAvatarUrl || `https://github.com/${repo.ownerLogin}.png`,
      },
      staffPickBadges: repo.staffPickBadges,
      isStaffPicked: repo.isStaffPicked,
    })) as GitHubRepo[]
  }, [mergedResults])

  // Client-side filter by badge type (Type) — additive, does not exclude staff picks
  const filteredRepositories = useMemo(() => {
    if (!badgeFilter) return repositories
    return repositories.filter((repo) => (repo.staffPickBadges ?? []).includes(badgeFilter))
  }, [repositories, badgeFilter])

  // Badge counts and staff pick count derived from the same dataset (authoritative repositories table via Convex)
  const { badgeCounts, staffPickCount } = useMemo(() => {
    const counts: Record<BadgeValue, number> = {
      startup: 0,
      bug_bounty: 0,
      gssoc: 0,
      ai: 0,
      devtools: 0,
    }
    let picks = 0

    repositories.forEach((repo) => {
      if (repo.isStaffPicked) {
        picks += 1
        ;(repo.staffPickBadges || []).forEach((badge) => {
          if (isBadgeValue(badge)) {
            counts[badge] = (counts[badge] ?? 0) + 1
          }
        })
      }
    })

    return { badgeCounts: counts, staffPickCount: picks }
  }, [repositories])

  const handleOpenModal = (repo: GitHubRepo, nextPicked: boolean) => {
    setModalRepo(repo)
    setModalTargetPick(nextPicked)
    setModalBadges((repo.staffPickBadges?.[0] as BadgeValue | undefined) ?? null)
    setModalNote("")
  }

  const handleConfirmStaffPick = async () => {
    if (!modalRepo || !userId) return
    const repoId = modalRepo.id
    if (modalTargetPick && !modalBadges) {
      alert("Please select a Type before marking as staff pick.")
      return
    }
    const badges: BadgeValue[] = modalTargetPick && modalBadges ? [modalBadges] : []

    setOptimistic((prev) => ({
      ...prev,
      [repoId]: {
        isStaffPicked: modalTargetPick,
        staffPickBadges: badges,
      },
    }))

    try {
      await setStaffPick({
        userId,
        repoId,
        badges,
        note: modalNote || undefined,
        picked: modalTargetPick,
        // Include repo data so Convex can create the record if it doesn't exist
        repoData: modalTargetPick
          ? {
              name: modalRepo.name,
              fullName: modalRepo.full_name,
              description: modalRepo.description,
              htmlUrl: modalRepo.html_url,
              ownerLogin: modalRepo.owner.login,
              ownerAvatarUrl: modalRepo.owner.avatar_url,
              language: modalRepo.language,
              topics: modalRepo.topics,
              stars: modalRepo.stargazers_count,
              forks: modalRepo.forks_count,
            }
          : undefined,
      })
    } catch (error) {
      console.error(error)
      setOptimistic((prev) => {
        const next = { ...prev }
        delete next[repoId]
        return next
      })
      alert("Unable to update staff pick. Please try again.")
    } finally {
      setModalRepo(null)
    }
  }

  if (status === "loading") {
    return (
      <div className="relative min-h-screen w-full text-white" style={{ backgroundColor: "#121212" }}>
        <BeamsBackground className="fixed inset-0 -z-10" />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-gray-400">Loading session...</div>
        </div>
      </div>
    )
  }

  if (!session?.user) {
    return (
      <div className="relative min-h-screen w-full text-white" style={{ backgroundColor: "#121212" }}>
        <BeamsBackground className="fixed inset-0 -z-10" />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h1 className="text-2xl font-semibold mb-4">Authentication Required</h1>
            <Link href="/auth/signin">
              <Button>Sign In</Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (isAdmin === undefined) {
    return (
      <div className="relative min-h-screen w-full text-white" style={{ backgroundColor: "#121212" }}>
        <BeamsBackground className="fixed inset-0 -z-10" />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-gray-400">Checking permissions...</div>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="relative min-h-screen w-full text-white" style={{ backgroundColor: "#121212" }}>
        <BeamsBackground className="fixed inset-0 -z-10" />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center space-y-4">
            <h1 className="text-2xl font-semibold">Access denied</h1>
            <p className="text-gray-400">You need admin privileges to view this page.</p>
            <Link href="/opensource">
              <Button variant="outline">Back to home</Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen w-full text-white" style={{ backgroundColor: "#0e0e0e" }}>
      <BeamsBackground className="fixed inset-0 -z-10" />

      <header className="sticky top-0 z-30 border-b border-white/10 backdrop-blur-lg bg-black/60">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <Link href="/opensource">
              <span className="text-lg font-semibold text-white">reposs</span>
            </Link>
            <span className="text-gray-500">/</span>
            <span className="text-gray-200">Admin</span>
          </div>
          <UserMenu />
        </div>
      </header>

      <main className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-6">
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="border-white/10 bg-[#141414]">
            <CardHeader className="pb-2">
              <CardDescription>Staff picks</CardDescription>
              <CardTitle className="flex items-center gap-2 text-3xl">
                <ShieldCheck className="h-5 w-5 text-blue-300" />
                {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : staffPickCount}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card className="border-white/10 bg-[#141414]">
            <CardHeader className="pb-2">
              <CardDescription>Badges</CardDescription>
              <CardContent className="flex flex-wrap gap-2 p-0 pt-2">
                {BADGE_OPTIONS.map((badge) => (
                  <Badge key={badge.value} variant="outline" className="border-white/20 text-xs text-white">
                    {badge.label}: {badgeCounts[badge.value as BadgeValue] ?? 0}
                  </Badge>
                ))}
              </CardContent>
            </CardHeader>
          </Card>
        </div>

        <Card className="border-white/10 bg-[#141414]">
          <CardHeader className="space-y-2">
            <CardTitle className="flex items-center justify-between">
              <span>Repositories</span>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant={sort === "staffPickedAt" ? "default" : "outline"}
                  onClick={() => setSort("staffPickedAt")}
                >
                  Sort: Recent
                </Button>
                <Button
                  size="sm"
                  variant={sort === "stars" ? "default" : "outline"}
                  onClick={() => setSort("stars")}
                >
                  Sort: Stars
                </Button>
              </div>
            </CardTitle>
            <CardContent className="flex flex-wrap items-center gap-3 p-0 pt-2">
              <div className="relative flex-1 min-w-[260px]">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                <Input
                  placeholder="Search repositories (owner/name)..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 bg-black/40 border-white/10 text-white"
                />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {BADGE_OPTIONS.map((badge) => {
                  const active = badgeFilter === badge.value
                  return (
                    <Button
                      key={badge.value}
                      size="sm"
                      variant={active ? "default" : "outline"}
                      onClick={() => setBadgeFilter(active ? null : badge.value)}
                    >
                      {badge.label}
                    </Button>
                  )
                })}
                <Button size="sm" variant="ghost" onClick={() => setBadgeFilter(null)}>
                  Clear badges
                </Button>
              </div>
            </CardContent>
          </CardHeader>

          <CardContent className="space-y-4">
            <AdminRepoTable
              repositories={filteredRepositories}
              loading={isLoading && filteredRepositories.length === 0}
              badgeOptions={BADGE_OPTIONS}
              onStaffPickClick={(repo) => {
                handleOpenModal(repo, !repo.isStaffPicked)
              }}
            />
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-500">
                Showing {filteredRepositories.length} repositories
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

      <Dialog open={!!modalRepo} onOpenChange={(open: boolean) => !open && setModalRepo(null)}>
        <DialogContent className="bg-[#0f0f0f] text-white border-white/10">
          <DialogHeader>
            <DialogTitle>
              {modalTargetPick ? "Mark as staff pick" : "Remove staff pick"}
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              {modalRepo?.full_name}
            </DialogDescription>
          </DialogHeader>
          {modalTargetPick && (
            <div className="space-y-3 py-2">
              <p className="text-sm text-gray-400">Select a Type.</p>
              <div className="grid grid-cols-2 gap-2">
                {BADGE_OPTIONS.map((badge) => {
                  const checked = modalBadges === badge.value
                  return (
                    <Button
                      key={badge.value}
                      variant={checked ? "default" : "outline"}
                      className="justify-start"
                      onClick={() => setModalBadges(badge.value)}
                    >
                      {badge.label}
                    </Button>
                  )
                })}
              </div>
              <div>
                <p className="mb-1 text-sm text-gray-400">Note (optional)</p>
                <Input
                  value={modalNote}
                  onChange={(e) => setModalNote(e.target.value)}
                  placeholder="Short internal note"
                  className="bg-black/40 border-white/10 text-white"
                />
              </div>
            </div>
          )}
          <DialogFooter className="flex gap-2 sm:justify-end">
            <Button variant="outline" onClick={() => setModalRepo(null)}>
              Cancel
            </Button>
            <Button onClick={handleConfirmStaffPick} className="gap-2">
              {modalTargetPick ? <CheckCircle2 className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
              {modalTargetPick ? "Confirm" : "Remove"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
