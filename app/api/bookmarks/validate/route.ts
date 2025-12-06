import { NextResponse } from "next/server"
import { createOctokit } from "@/lib/github"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { id, full_name } = body ?? {}

    if (typeof id !== "number" && typeof full_name !== "string") {
      return NextResponse.json({ error: "Missing repository identifier" }, { status: 400 })
    }

    const octokit = createOctokit()

    let repo
    if (typeof id === "number") {
      const { data } = await octokit.request("GET /repositories/{repository_id}", {
        repository_id: id,
      })
      repo = data
    } else {
      const [owner, repoName] = (full_name as string).split("/")
      if (!owner || !repoName) {
        return NextResponse.json({ error: "Invalid full_name" }, { status: 400 })
      }
      const { data } = await octokit.repos.get({ owner, repo: repoName })
      repo = data
    }

    const normalized = {
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
      savedAt: Date.now(),
      upstream: {
        exists: true,
        lastCheckedAt: Date.now(),
      },
    }

    return NextResponse.json({ repository: normalized })
  } catch (error) {
    console.error("Failed to validate repository:", error)
    return NextResponse.json({ error: "Failed to validate repository" }, { status: 500 })
  }
}


