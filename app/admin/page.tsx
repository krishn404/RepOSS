"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useSession } from "next-auth/react"
import { useMutation, usePaginatedQuery, useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { UserMenu } from "@/components/user-menu"
import { BeamsBackground } from "@/components/opensource/bg-beams"
import { useVirtualizer, type VirtualItem } from "@tanstack/react-virtual"
import { Loader2, Search, ShieldCheck, Star, CheckCircle2 } from "lucide-react"
import Link from "next/link"

const BADGE_OPTIONS = [
  { value: "startup", label: "Startup" },
  { value: "bug_bounty", label: "Bug Bounty" },
  { value: "gssoc", label: "GSSoC" },
  { value: "ai", label: "AI" },
  { value: "devtools", label: "DevTools" },
] as const

type BadgeValue = (typeof BADGE_OPTIONS)[number]["value"]

type RepoRow = {
  repoId: number
  name: string
  fullName: string
  ownerLogin: string
  stars: number
  language?: string
  htmlUrl?: string
  staffPickBadges: BadgeValue[]
  isStaffPicked: boolean
  staffPickedAt?: number
}

export default function AdminPage() {
  const { data: session, status } = useSession()
  // @ts-ignore - NextAuth augments user
  const userId = session?.user?.id as string | undefined

  const isAdmin = useQuery(
    api.users.checkIsAdmin,
    userId ? { userId } : "skip"
  )

  const overview = useQuery(
    api.admin.getOverview,
    userId && isAdmin ? { userId } : "skip"
  )

  const [searchTerm, setSearchTerm] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(searchTerm.trim().toLowerCase()), 250)
    return () => clearTimeout(id)
  }, [searchTerm])

  const [badgeFilter, setBadgeFilter] = useState<BadgeValue | null>(null)
  const [staffOnly, setStaffOnly] = useState(true)
  const [sort, setSort] = useState<"staffPickedAt" | "stars" | "createdAt">("staffPickedAt")

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
          badges: badgeFilter ? [badgeFilter] : undefined,
          staffPickOnly: staffOnly || undefined,
          sort,
        }
      : "skip",
    { initialNumItems: 40 }
  )

  const setStaffPick = useMutation(api.admin.setStaffPick)

  const [optimistic, setOptimistic] = useState<Record<number, Partial<RepoRow>>>({})
  const [modalRepo, setModalRepo] = useState<RepoRow | null>(null)
  const [modalBadges, setModalBadges] = useState<BadgeValue[]>([])
  const [modalNote, setModalNote] = useState("")
  const [modalTargetPick, setModalTargetPick] = useState<boolean>(true)

  const mergedResults = useMemo(() => {
    return results.map((repo: any) => ({
      ...repo,
      ...(optimistic[repo.repoId] ?? {}),
    })) as RepoRow[]
  }, [results, optimistic])

  const parentRef = useRef<HTMLDivElement | null>(null)
  const rowVirtualizer = useVirtualizer({
    count: mergedResults.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 88,
    overscan: 8,
  })

  const handleOpenModal = (repo: RepoRow, nextPicked: boolean) => {
    setModalRepo(repo)
    setModalTargetPick(nextPicked)
    setModalBadges(repo.staffPickBadges ?? [])
    setModalNote("")
  }

  const handleConfirmStaffPick = async () => {
    if (!modalRepo || !userId) return
    const repoId = modalRepo.repoId
    const badges: BadgeValue[] = modalTargetPick ? modalBadges : []

    setOptimistic((prev) => ({
      ...prev,
      [repoId]: {
        isStaffPicked: modalTargetPick,
        staffPickBadges: badges,
        staffPickedAt: modalTargetPick ? Date.now() : undefined,
      },
    }))

    try {
      const updated = await setStaffPick({
        userId,
        repoId,
        badges,
        note: modalNote || undefined,
        picked: modalTargetPick,
      })
      setOptimistic((prev) => ({ ...prev, [repoId]: updated as Partial<RepoRow> }))
    } catch (error) {
      console.error(error)
      // revert
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
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-white/10 bg-[#141414]">
            <CardHeader className="pb-2">
              <CardDescription>Total repositories</CardDescription>
              <CardTitle className="text-3xl">
                {overview ? overview.totalRepositories : <Loader2 className="h-5 w-5 animate-spin" />}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card className="border-white/10 bg-[#141414]">
            <CardHeader className="pb-2">
              <CardDescription>Staff picks</CardDescription>
              <CardTitle className="flex items-center gap-2 text-3xl">
                <ShieldCheck className="h-5 w-5 text-blue-300" />
                {overview ? overview.staffPickCount : <Loader2 className="h-5 w-5 animate-spin" />}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card className="border-white/10 bg-[#141414]">
            <CardHeader className="pb-2">
              <CardDescription>Badges</CardDescription>
              <CardContent className="flex flex-wrap gap-2 p-0 pt-2">
                {BADGE_OPTIONS.map((badge) => (
                  <Badge key={badge.value} variant="outline" className="border-white/20 text-xs text-white">
                    {badge.label}: {overview?.badgeCounts?.[badge.value] ?? 0}
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
                  variant={staffOnly ? "default" : "outline"}
                  onClick={() => setStaffOnly((prev) => !prev)}
                >
                  Staff picks only
                </Button>
                <Button
                  size="sm"
                  variant={sort === "staffPickedAt" ? "default" : "outline"}
                  onClick={() => setSort("staffPickedAt")}
                >
                  Sort: Staff Picked
                </Button>
                <Button
                  size="sm"
                  variant={sort === "stars" ? "default" : "outline"}
                  onClick={() => setSort("stars")}
                >
                  Sort: Stars
                </Button>
                <Button
                  size="sm"
                  variant={sort === "createdAt" ? "default" : "outline"}
                  onClick={() => setSort("createdAt")}
                >
                  Sort: Newest
                </Button>
              </div>
            </CardTitle>
            <CardDescription className="flex flex-wrap items-center gap-3">
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
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div
              ref={parentRef}
              className="h-[620px] overflow-auto rounded-lg border border-white/5 bg-black/40"
            >
              <div
                style={{
                  height: `${rowVirtualizer.getTotalSize()}px`,
                  position: "relative",
                }}
              >
                {rowVirtualizer.getVirtualItems().map((virtualRow: VirtualItem) => {
                  const repo = mergedResults[virtualRow.index]
                  if (!repo) return null
                  return (
                    <div
                      key={repo.repoId}
                      className="absolute left-0 right-0 px-4"
                      style={{ transform: `translateY(${virtualRow.start}px)` }}
                    >
                      <div className="flex flex-col gap-2 border-b border-white/5 py-4 last:border-b-0 md:flex-row md:items-center md:justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-white">{repo.fullName}</span>
                            {repo.isStaffPicked && (
                              <Badge className="bg-blue-500/20 text-blue-200 border-blue-300/30">
                                Staff Pick
                              </Badge>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-2 text-sm text-gray-400">
                            <span className="flex items-center gap-1">
                              <Star className="h-4 w-4" /> {repo.stars.toLocaleString()}
                            </span>
                            {repo.language && (
                              <span className="rounded-full bg-white/5 px-2 py-0.5 text-xs">
                                {repo.language}
                              </span>
                            )}
                            {repo.staffPickBadges?.length ? (
                              repo.staffPickBadges.map((badge) => (
                                <Badge key={badge} variant="outline" className="text-xs border-white/10">
                                  {badge}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-xs text-gray-500">No badges</span>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenModal(repo, !repo.isStaffPicked)}
                          >
                            {repo.isStaffPicked ? "Unmark" : "Mark staff pick"}
                          </Button>
                          <Link
                            href={repo.htmlUrl || `https://github.com/${repo.fullName}`}
                            target="_blank"
                            className="text-sm text-blue-300 hover:text-blue-200"
                          >
                            View repo
                          </Link>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-500">
                Showing {mergedResults.length} repositories
              </div>
              <Button
                variant="outline"
                disabled={!loadMore || reposStatus === "Exhausted" || isLoading}
                onClick={() => loadMore && loadMore(30)}
              >
                {isLoading || reposStatus === "CanLoadMore" ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Load more
              </Button>
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
              {modalRepo?.fullName}
            </DialogDescription>
          </DialogHeader>
          {modalTargetPick && (
            <div className="space-y-3 py-2">
              <p className="text-sm text-gray-400">Select badges to apply.</p>
              <div className="grid grid-cols-2 gap-2">
                {BADGE_OPTIONS.map((badge) => {
                  const checked = modalBadges.includes(badge.value)
                  return (
                    <label
                      key={badge.value}
                      className="flex items-center gap-2 rounded-md border border-white/10 px-3 py-2 hover:border-white/30 cursor-pointer"
                    >
                      <Checkbox
                        checked={checked}
                        onCheckedChange={(v: boolean) => {
                          setModalBadges((prev) =>
                            v
                              ? [...prev, badge.value]
                              : prev.filter((b) => b !== badge.value)
                          )
                        }}
                      />
                      <span className="text-sm">{badge.label}</span>
                    </label>
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
