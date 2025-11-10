import { query, mutation } from "./_generated/server"
import { v } from "convex/values"

const CACHE_DURATION = 24 * 60 * 60 * 1000 // 24 hours

export const getTrendingRepositories = query({
  args: {
    period: v.string(), // "today", "week", "month"
  },
  async handler(ctx, args) {
    const cached = await ctx.db
      .query("trendingRepositories")
      .withIndex("by_period", (q) => q.eq("period", args.period))
      .first()

    if (cached && cached.expiresAt > Date.now()) {
      return cached.repositories
    }

    return []
  },
})

export const cacheTrendingRepositories = mutation({
  args: {
    period: v.string(),
    repositories: v.array(
      v.object({
        id: v.number(),
        name: v.string(),
        full_name: v.string(),
        description: v.optional(v.string()),
        url: v.string(),
        language: v.optional(v.string()),
        stargazers_count: v.number(),
      }),
    ),
  },
  async handler(ctx, args) {
    const now = Date.now()
    const expiresAt = now + CACHE_DURATION

    // Delete old cache for this period
    const existing = await ctx.db
      .query("trendingRepositories")
      .withIndex("by_period", (q) => q.eq("period", args.period))
      .first()

    if (existing) {
      await ctx.db.delete(existing._id)
    }

    await ctx.db.insert("trendingRepositories", {
      repositories: args.repositories,
      period: args.period,
      createdAt: now,
      expiresAt,
    })
  },
})
