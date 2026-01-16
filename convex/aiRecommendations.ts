import { query } from "./_generated/server"
import { v } from "convex/values"

/**
 * Query repositories from the database that match user profile
 * Prioritizes matches by language and topics
 */
export const getCandidateRepositories = query({
  args: {
    languages: v.array(v.string()),
    topics: v.array(v.string()),
    limit: v.number(),
  },
  async handler(ctx, args) {
    const candidateRepos: any[] = []
    const seenIds = new Set<number>()

    try {
      // Query repositories matching user's languages
      for (const lang of args.languages.slice(0, 3)) {
        if (candidateRepos.length >= args.limit) break

        // Query all repos and filter by language
        // Note: Since we don't have a language index, we'll use pagination
        const repos = await ctx.db
          .query("repositories")
          .filter((q) => q.eq(q.field("language"), lang))
          .order("desc")
          .take(Math.min(30, args.limit - candidateRepos.length))

        for (const repo of repos) {
          if (!seenIds.has(repo.repoId) && candidateRepos.length < args.limit) {
            seenIds.add(repo.repoId)
            candidateRepos.push({
              id: repo.repoId,
              name: repo.name,
              full_name: repo.fullName,
              description: repo.description,
              language: repo.language,
              stargazers_count: repo.stars,
              forks_count: repo.forks,
              topics: repo.topics || [],
              html_url: repo.htmlUrl,
            })
          }
        }
      }

      // Query repositories matching user's topics
      // Use pagination with stars index for better performance
      for (const topic of args.topics.slice(0, 5)) {
        if (candidateRepos.length >= args.limit) break

        // Query popular repos and filter by topics (more efficient than collect())
        const repos = await ctx.db
          .query("repositories")
          .withIndex("by_stars")
          .order("desc")
          .take(100) // Take more to increase chances of topic matches

        for (const repo of repos) {
          if (
            !seenIds.has(repo.repoId) &&
            candidateRepos.length < args.limit &&
            repo.topics &&
            repo.topics.some((t: string) => t.toLowerCase().includes(topic.toLowerCase()))
          ) {
            seenIds.add(repo.repoId)
            candidateRepos.push({
              id: repo.repoId,
              name: repo.name,
              full_name: repo.fullName,
              description: repo.description,
              language: repo.language,
              stargazers_count: repo.stars,
              forks_count: repo.forks,
              topics: repo.topics || [],
              html_url: repo.htmlUrl,
            })
          }
        }
      }

      // If still not enough, get staff picks and popular repos
      if (candidateRepos.length < args.limit) {
        const additionalRepos = await ctx.db
          .query("repositories")
          .withIndex("by_stars")
          .order("desc")
          .take(args.limit - candidateRepos.length)

        for (const repo of additionalRepos) {
          if (!seenIds.has(repo.repoId)) {
            seenIds.add(repo.repoId)
            candidateRepos.push({
              id: repo.repoId,
              name: repo.name,
              full_name: repo.fullName,
              description: repo.description,
              language: repo.language,
              stargazers_count: repo.stars,
              forks_count: repo.forks,
              topics: repo.topics || [],
              html_url: repo.htmlUrl,
            })
          }
        }
      }

      return candidateRepos.slice(0, args.limit)
    } catch (error) {
      console.error("[Convex] Error querying candidate repositories:", error)
      return []
    }
  },
})

