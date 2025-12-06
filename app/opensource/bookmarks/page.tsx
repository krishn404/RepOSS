"use client"

import { useMemo } from "react"
import { BeamsBackground } from "@/components/opensource/bg-beams"
import { RepoTable } from "@/components/opensource/repo-table"
import { useBookmarks } from "@/hooks/use-bookmarks"

export default function BookmarksPage() {
  const { bookmarks, loading } = useBookmarks()

  const repositories = useMemo(
    () =>
      bookmarks.map((b) => ({
        id: b.id,
        name: b.name,
        full_name: b.full_name,
        description: b.description,
        language: b.language,
        stargazers_count: b.stargazers_count,
        forks_count: b.forks_count,
        topics: b.topics,
        html_url: b.html_url,
        owner: b.owner,
      })),
    [bookmarks],
  )

  return (
    <div className="relative min-h-screen w-full text-white" style={{ backgroundColor: "#121212" }}>
      <BeamsBackground className="fixed inset-0 -z-10" />

      <div
        className="sticky top-0 z-30 backdrop-blur-lg border-b border-white/10"
        style={{ backgroundColor: "rgba(18, 18, 18, 0.8)" }}
      >
        <div className="px-6 py-4 flex flex-col gap-1">
          <h1 className="text-lg font-semibold">Bookmarks</h1>
          <p className="text-sm text-gray-400">
            Your saved repositories, merged from local and cloud bookmarks.
          </p>
        </div>
      </div>

      <div className="px-6 py-6">
        {repositories.length === 0 && !loading ? (
          <div className="text-sm text-gray-400">
            You don&apos;t have any bookmarks yet. Browse repositories and bookmark them to see them here.
          </div>
        ) : (
          <RepoTable repositories={repositories} loading={loading} showRank={false} />
        )}
      </div>
    </div>
  )
}


