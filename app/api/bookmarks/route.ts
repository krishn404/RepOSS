import { NextResponse, type NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authConfig } from "@/lib/auth"
import { ConvexHttpClient } from "convex/browser"
import { createOctokit } from "@/lib/github"

function getConvexClient() {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL
  if (!convexUrl) return null
  return new ConvexHttpClient(convexUrl)
}

export async function GET() {
  const session = await getServerSession(authConfig)
  const userId = session?.user?.id as string | undefined

  if (!userId) {
    return NextResponse.json({ bookmarks: [], source: "anonymous" as const })
  }

  const convex = getConvexClient()
  if (!convex) {
    return NextResponse.json({ bookmarks: [], source: "convex_unavailable" as const })
  }

  const octokit = createOctokit()

  try {
    const saved = await convex.query("repositories:getSavedRepositories" as any, { userId })

    const bookmarks = await Promise.all(
      (saved || []).map(async (entry: any) => {
        try {
          const { data: repo } = await octokit.request("GET /repositories/{repository_id}", {
            repository_id: entry.repositoryId,
          })

          return {
            id: repo.id,
            name: repo.name,
            full_name: repo.full_name,
            description: repo.description || "",
            language: repo.language || "",
            stargazers_count: repo.stargazers_count,
            forks_count: repo.forks_count,
            topics: repo.topics || [],
            html_url: repo.html_url,
            owner: {
              login: repo.owner?.login || "",
              avatar_url: repo.owner?.avatar_url || "",
            },
            savedAt: entry.savedAt ?? Date.now(),
            upstream: {
              exists: true,
              lastCheckedAt: Date.now(),
            },
          }
        } catch {
          return {
            id: entry.repositoryId,
            name: entry.repositoryName,
            full_name: entry.repositoryName,
            description: "",
            language: "",
            stargazers_count: 0,
            forks_count: 0,
            topics: [] as string[],
            html_url: entry.repositoryUrl,
            owner: {
              login: "",
              avatar_url: "",
            },
            savedAt: entry.savedAt ?? Date.now(),
            upstream: {
              exists: false,
              lastCheckedAt: Date.now(),
            },
          }
        }
      }),
    )

    return NextResponse.json({ bookmarks, source: "convex" as const })
  } catch (error) {
    console.error("Failed to fetch bookmarks from Convex:", error)
    return NextResponse.json({ bookmarks: [], source: "error" as const }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authConfig)
  const userId = session?.user?.id as string | undefined

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const convex = getConvexClient()
  if (!convex) {
    return NextResponse.json({ error: "Convex client unavailable" }, { status: 500 })
  }

  const body = await request.json()
  const repo = body?.repository

  if (!repo || typeof repo.id !== "number" || typeof repo.name !== "string" || typeof repo.html_url !== "string") {
    return NextResponse.json({ error: "Invalid repository payload" }, { status: 400 })
  }

  try {
    const repositoryName = repo.full_name ?? repo.name
    await convex.mutation("repositories:saveRepository" as any, {
      userId,
      repositoryId: repo.id,
      repositoryName,
      repositoryUrl: repo.html_url,
    })

    // Log activity
    try {
      await convex.mutation("activities:logActivity" as any, {
        userId,
        activityType: "bookmark_saved",
        details: {
          repositoryId: repo.id,
          repositoryName,
        },
      })
    } catch (activityError) {
      console.error("Failed to log bookmark activity:", activityError)
      // Don't fail the request if activity logging fails
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Failed to save bookmark:", error)
    return NextResponse.json({ error: "Failed to save bookmark" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authConfig)
  const userId = session?.user?.id as string | undefined

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const convex = getConvexClient()
  if (!convex) {
    return NextResponse.json({ error: "Convex client unavailable" }, { status: 500 })
  }

  const body = await request.json()
  const repositoryId = body?.repositoryId
  const repositoryName = body?.repositoryName

  if (typeof repositoryId !== "number") {
    return NextResponse.json({ error: "Invalid repository id" }, { status: 400 })
  }

  try {
    await convex.mutation("repositories:removeSavedRepository" as any, {
      userId,
      repositoryId,
    })

    // Log activity
    try {
      await convex.mutation("activities:logActivity" as any, {
        userId,
        activityType: "bookmark_removed",
        details: {
          repositoryId,
          repositoryName: repositoryName || undefined,
        },
      })
    } catch (activityError) {
      console.error("Failed to log bookmark removal activity:", activityError)
      // Don't fail the request if activity logging fails
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Failed to remove bookmark:", error)
    return NextResponse.json({ error: "Failed to remove bookmark" }, { status: 500 })
  }
}


