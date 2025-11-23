import { NextResponse } from "next/server"
import { Octokit } from "@octokit/rest"

const octokit = new Octokit({
  auth: process.env.GITHUB_ACCESS_TOKEN || process.env.GITHUB_TOKEN,
})

export async function GET() {
  try {
    const response = await octokit.search.repos({
      q: "stars:>5000 created:>2024-01-01",
      sort: "stars",
      order: "desc",
      per_page: 10,
    })

    const trending = response.data.items.map((repo: any) => ({
      id: repo.id,
      name: repo.name,
      full_name: repo.full_name,
      description: repo.description,
      url: repo.html_url,
      language: repo.language,
      stargazers_count: repo.stargazers_count,
    }))

    return NextResponse.json({ trending })
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch trending repositories" }, { status: 500 })
  }
}
