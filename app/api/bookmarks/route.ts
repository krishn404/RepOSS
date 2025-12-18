import { NextResponse, type NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authConfig } from "@/lib/auth"
import { ConvexHttpClient } from "convex/browser"
import { createOctokit } from "@/lib/github"

function getConvexClient() {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL
  if (!convexUrl) {
    console.warn("NEXT_PUBLIC_CONVEX_URL environment variable is not set")
    return null
  }
  
  try {
    // For server-side API routes with public functions, URL alone should work
    // If you need authentication, set CONVEX_AUTH_TOKEN (JWT) in environment variables
    const authToken = process.env.CONVEX_AUTH_TOKEN
    
    if (authToken) {
      // Use auth token if provided (for authenticated server-side calls)
      const client = new ConvexHttpClient(convexUrl, {
        auth: authToken,
      })
      return client
    } else {
      // Use URL directly (works for public functions)
      const client = new ConvexHttpClient(convexUrl)
      return client
    }
  } catch (error: any) {
    console.error("Failed to initialize Convex client:", error?.message || error)
    return null
  }
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

    try {
      // Query saved repositories from Convex
      let saved: any[] = []
      try {
        const result = await convex.query("repositories:getSavedRepositories" as any, { userId })
        saved = Array.isArray(result) ? result : []
      } catch (convexError: any) {
        console.error("Convex query error:", {
          message: convexError?.message,
          stack: convexError?.stack,
          name: convexError?.name,
          statusCode: convexError?.statusCode,
          data: convexError?.data,
          userId,
        })
        // Return empty bookmarks if Convex query fails
        return NextResponse.json(
          { 
            bookmarks: [], 
            source: "error" as const,
            error: convexError?.message || "Convex query failed",
            statusCode: convexError?.statusCode,
          }, 
          { status: 500 }
        )
      }

    // If no saved repositories, return early
    if (!saved || saved.length === 0) {
      return NextResponse.json({ bookmarks: [], source: "convex" as const })
    }

    // Fetch full repository details from GitHub
    let octokit
    try {
      octokit = createOctokit()
    } catch (octokitError: any) {
      console.error("Failed to create Octokit client:", octokitError)
      // Return bookmarks with minimal data if Octokit fails
      const bookmarks = saved.map((entry: any) => ({
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
      }))
      return NextResponse.json({ bookmarks, source: "convex" as const })
    }

    const bookmarks = await Promise.all(
      saved.map(async (entry: any) => {
        try {
          if (!entry.repositoryId) {
            throw new Error("Missing repositoryId")
          }

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
        } catch (repoError: any) {
          console.warn(`Failed to fetch repo ${entry.repositoryId} from GitHub:`, repoError?.message || repoError)
          // Return fallback data if GitHub API fails for this repo
          return {
            id: entry.repositoryId,
            name: entry.repositoryName || "Unknown",
            full_name: entry.repositoryName || "unknown/unknown",
            description: "",
            language: "",
            stargazers_count: 0,
            forks_count: 0,
            topics: [] as string[],
            html_url: entry.repositoryUrl || "",
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
  } catch (error: any) {
    console.error("Failed to fetch bookmarks:", error?.message || error, error?.stack)
    return NextResponse.json(
      { 
        bookmarks: [], 
        source: "error" as const,
        error: error?.message || "Unknown error" 
      }, 
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authConfig)
    const userId = session?.user?.id as string | undefined

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL
    if (!convexUrl) {
      console.error("NEXT_PUBLIC_CONVEX_URL is not set")
      return NextResponse.json({ error: "Convex URL not configured" }, { status: 500 })
    }

    const convex = getConvexClient()
    if (!convex) {
      console.error("Failed to create Convex client. URL:", convexUrl ? "set" : "not set")
      return NextResponse.json({ error: "Convex client unavailable" }, { status: 500 })
    }

    const body = await request.json()
    const repo = body?.repository

    if (!repo || typeof repo.id !== "number" || typeof repo.name !== "string" || typeof repo.html_url !== "string") {
      return NextResponse.json({ error: "Invalid repository payload" }, { status: 400 })
    }

    const repositoryName = repo.full_name ?? repo.name
    const mutationArgs = {
      userId,
      repositoryId: repo.id,
      repositoryName,
      repositoryUrl: repo.html_url,
    }

    // Save bookmark to Convex
    try {
      // Verify mutation name matches what's exported
      const mutationName = "repositories:saveRepository"
      await convex.mutation(mutationName as any, mutationArgs)
    } catch (convexError: any) {
      // Extract all possible error information
      let errorString = ""
      try {
        errorString = JSON.stringify(convexError, Object.getOwnPropertyNames(convexError), 2)
      } catch {
        errorString = String(convexError)
      }
      
      const errorInfo = {
        message: convexError?.message || String(convexError),
        name: convexError?.name,
        stack: convexError?.stack,
        code: convexError?.code,
        statusCode: convexError?.statusCode,
        status: convexError?.status,
        data: convexError?.data,
        response: convexError?.response,
        cause: convexError?.cause,
        toString: convexError?.toString?.(),
        valueOf: convexError?.valueOf?.(),
        errorString,
      }
      
      console.error("Convex mutation error (full):", errorInfo)
      console.error("Convex mutation error (raw):", convexError)
      console.error("Convex mutation error (type):", typeof convexError)
      console.error("Convex mutation error (constructor):", convexError?.constructor?.name)
      
      // Try to get a meaningful error message
      const errorMessage = 
        convexError?.message || 
        convexError?.data?.message ||
        convexError?.response?.data?.message ||
        convexError?.cause?.message ||
        String(convexError) ||
        "Unknown Convex error"
      
      return NextResponse.json(
        {
          error: "Failed to save bookmark to Convex",
          details: errorMessage,
          statusCode: convexError?.statusCode || convexError?.status || convexError?.code,
          errorType: convexError?.name || typeof convexError,
        },
        { status: 500 }
      )
    }

    // Log activity (non-blocking)
    try {
      await convex.mutation("activities:logActivity" as any, {
        userId,
        activityType: "bookmark_saved",
        details: {
          repositoryId: repo.id,
          repositoryName,
        },
      })
    } catch (activityError: any) {
      console.error("Failed to log bookmark activity (non-blocking):", activityError?.message || activityError)
      // Don't fail the request if activity logging fails
    }

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    console.error("Unexpected error in POST /api/bookmarks:", {
      message: error?.message,
      stack: error?.stack,
      name: error?.name,
    })
    return NextResponse.json(
      {
        error: "Failed to save bookmark",
        details: error?.message || "Unknown error",
      },
      { status: 500 }
    )
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


