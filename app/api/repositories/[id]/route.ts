import { NextRequest, NextResponse } from "next/server"
import { createOctokit } from "@/lib/github"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const repoId = parseInt(id, 10)
    if (isNaN(repoId)) {
      return NextResponse.json({ error: "Invalid repository ID" }, { status: 400 })
    }

    const octokit = createOctokit()

    // Fetch repository by ID using GitHub API
    const { data: repo } = await octokit.request("GET /repositories/{repository_id}", {
      repository_id: repoId,
    })

    // Normalize to match our Repository interface
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
      updated_at: repo.updated_at,
    }

    return NextResponse.json(normalized)
  } catch (error: any) {
    console.error("Failed to fetch repository:", error)
    if (error.status === 404) {
      return NextResponse.json({ error: "Repository not found" }, { status: 404 })
    }
    return NextResponse.json({ error: "Failed to fetch repository" }, { status: 500 })
  }
}
