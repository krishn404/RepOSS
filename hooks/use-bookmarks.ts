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

  // Only load local bookmarks for guest users
  useEffect(() => {
    if (isAuthenticated) {
      setLocalLoading(false)
      setLocalBookmarks([])
      return
    }

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
  }, [isAuthenticated])

  const mergedBookmarks: BookmarkRepository[] = useMemo(() => {
    // For authenticated users: only use remote (Convex) bookmarks
    if (isAuthenticated) {
      const remoteBookmarks: any[] = remoteData?.bookmarks || []
      return remoteBookmarks.map((rb) => {
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

        return {
          ...base,
          source: "remote" as const,
          upstream: rb.upstream ?? {
            exists: true,
            lastCheckedAt: null,
          },
        }
      })
    }

    // For guest users: only use local (IndexedDB) bookmarks
    return localBookmarks.map((local) => ({
      ...local,
      source: "local" as const,
      upstream: undefined,
    }))
  }, [localBookmarks, remoteData, isAuthenticated])

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
          // Guest users: Store bookmarks locally in IndexedDB
          if (already) {
            await removeLocalBookmark(repo.id)
            setLocalBookmarks((prev) => prev.filter((b) => b.id !== repo.id))
          } else {
            await saveLocalBookmark(validated)
            setLocalBookmarks((prev) => [...prev, { ...validated }])
          }
          return
        }

        // Authenticated users (Google/GitHub): Store bookmarks in Convex database
        if (already) {
          const response = await fetch("/api/bookmarks", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
              repositoryId: repo.id,
              repositoryName: validated.full_name ?? validated.name,
            }),
          })
          if (!response.ok) {
            throw new Error("Failed to remove bookmark")
          }
        } else {
          const response = await fetch("/api/bookmarks", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ repository: validated }),
          })
          if (!response.ok) {
            throw new Error("Failed to save bookmark")
          }
        }

        await mutateRemote()
      } catch (error) {
        console.error("Failed to toggle bookmark:", error)
        // Revert optimistic update on error
        setOptimisticState((prev) => ({ ...prev, [repo.id]: already }))
        throw error
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


