"use client"

import { useEffect, useMemo, useState, useCallback } from "react"
import { useSession } from "next-auth/react"
import useSWR from "swr"
import {
  getAllLocalBookmarks,
  saveLocalBookmark,
  removeLocalBookmark,
  type LocalBookmarkRepository,
} from "@/lib/bookmarks-local"

export type BookmarkSource = "local" | "remote"

export type BookmarkRepository = LocalBookmarkRepository & {
  source: BookmarkSource
  upstream?: {
    exists: boolean
    lastCheckedAt: number | null
  }
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function useBookmarks() {
  const { data: session } = useSession()
  const isAuthenticated = !!session?.user?.id

  const [localBookmarks, setLocalBookmarks] = useState<LocalBookmarkRepository[]>([])
  const [localLoading, setLocalLoading] = useState(true)

  const {
    data: remoteData,
    isLoading: remoteLoading,
    mutate: mutateRemote,
  } = useSWR(isAuthenticated ? "/api/bookmarks" : null, fetcher)

  const [optimisticState, setOptimisticState] = useState<Record<number, boolean>>({})

  useEffect(() => {
    let cancelled = false

    async function loadLocal() {
      setLocalLoading(true)
      try {
        const data = await getAllLocalBookmarks()
        if (!cancelled) setLocalBookmarks(data)
      } catch {
        if (!cancelled) setLocalBookmarks([])
      } finally {
        if (!cancelled) setLocalLoading(false)
      }
    }

    loadLocal()

    return () => {
      cancelled = true
    }
  }, [])

  const mergedBookmarks: BookmarkRepository[] = useMemo(() => {
    const merged = new Map<number, BookmarkRepository>()

    const remoteBookmarks: any[] = remoteData?.bookmarks || []

    // Remote takes precedence
    for (const rb of remoteBookmarks) {
      const base: LocalBookmarkRepository = {
        id: rb.id,
        name: rb.name,
        full_name: rb.full_name,
        description: rb.description ?? "",
        language: rb.language ?? "",
        stargazers_count: rb.stargazers_count ?? 0,
        forks_count: rb.forks_count ?? 0,
        topics: rb.topics ?? [],
        html_url: rb.html_url,
        owner: {
          login: rb.owner?.login ?? "",
          avatar_url: rb.owner?.avatar_url ?? "",
        },
        savedAt: rb.savedAt ?? Date.now(),
      }

      merged.set(base.id, {
        ...base,
        source: "remote",
        upstream: rb.upstream ?? {
          exists: true,
          lastCheckedAt: null,
        },
      })
    }

    for (const local of localBookmarks) {
      if (!merged.has(local.id)) {
        merged.set(local.id, {
          ...local,
          source: "local",
          upstream: undefined,
        })
      }
    }

    return Array.from(merged.values()).sort((a, b) => (b.savedAt ?? 0) - (a.savedAt ?? 0))
  }, [localBookmarks, remoteData])

  const isBookmarked = useCallback(
    (id: number) => {
      if (id in optimisticState) return optimisticState[id]
      return mergedBookmarks.some((b) => b.id === id)
    },
    [mergedBookmarks, optimisticState],
  )

  const toggleBookmark = useCallback(
    async (repo: Omit<LocalBookmarkRepository, "savedAt">) => {
      const already = isBookmarked(repo.id)

      // optimistic flip
      setOptimisticState((prev) => ({ ...prev, [repo.id]: !already }))

      try {
        // Validate/normalize via Octokit before persisting
        let validated = repo as LocalBookmarkRepository
        try {
          const res = await fetch("/api/bookmarks/validate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: repo.id, full_name: repo.full_name }),
          })
          if (res.ok) {
            const data = await res.json()
            if (data?.repository) {
              validated = data.repository
            }
          }
        } catch {
          // fall back to client-provided repo if validation fails
        }

        if (!isAuthenticated) {
          // Guest: local IndexedDB
          if (already) {
            await removeLocalBookmark(repo.id)
            setLocalBookmarks((prev) => prev.filter((b) => b.id !== repo.id))
          } else {
            await saveLocalBookmark(validated)
            setLocalBookmarks((prev) => [...prev, { ...validated }])
          }
          return
        }

        // Authenticated: Convex via API
        if (already) {
          await fetch("/api/bookmarks", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ repositoryId: repo.id }),
          })
        } else {
          await fetch("/api/bookmarks", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ repository: validated }),
          })
        }

        await mutateRemote()
      } finally {
        // Clear optimistic entry; derived state will fall back to mergedBookmarks
        setOptimisticState((prev) => {
          const next = { ...prev }
          delete next[repo.id]
          return next
        })
      }
    },
    [isAuthenticated, isBookmarked, mutateRemote],
  )

  const refreshRemote = useCallback(async () => {
    if (!isAuthenticated) return
    await mutateRemote()
  }, [isAuthenticated, mutateRemote])

  const loading = localLoading || (isAuthenticated && remoteLoading)

  return {
    bookmarks: mergedBookmarks,
    loading,
    isBookmarked,
    toggleBookmark,
    refreshRemote,
    hasRemote: isAuthenticated && !!remoteData,
  }
}


