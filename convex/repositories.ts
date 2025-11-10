import { query, mutation } from "./_generated/server"
import { v } from "convex/values"

const CACHE_DURATION = 60 * 60 * 1000 // 1 hour in milliseconds

export const getRepositoriesFromCache = query({
  args: {
    cacheKey: v.string(),
  },
  async handler(ctx, args) {
    const cached = await ctx.db
      .query("repositoriesCache")
      .withIndex("by_cache_key", (q) => q.eq("cacheKey", args.cacheKey))
      .first()

    if (cached && cached.expiresAt > Date.now()) {
      return cached
    }

    // Return null if cache expired
    // Note: Cannot delete in queries (read-only), expired entries will be ignored
    return null
  },
})

export const cacheRepositories = mutation({
  args: {
    cacheKey: v.string(),
    query: v.string(),
    language: v.optional(v.string()),
    page: v.number(),
    repositories: v.array(
      v.object({
        id: v.number(),
        name: v.string(),
        full_name: v.string(),
        description: v.optional(v.string()),
        html_url: v.string(),
        language: v.optional(v.string()),
        stargazers_count: v.number(),
        forks_count: v.number(),
        topics: v.optional(v.array(v.string())),
        updated_at: v.optional(v.string()),
        owner: v.object({
          avatar_url: v.string(),
          login: v.string(),
        }),
      }),
    ),
    total: v.number(),
    hasMore: v.boolean(),
  },
  async handler(ctx, args) {
    const now = Date.now()
    const expiresAt = now + CACHE_DURATION

    // Delete any existing cache entry with the same key (including expired ones)
    const existing = await ctx.db
      .query("repositoriesCache")
      .withIndex("by_cache_key", (q) => q.eq("cacheKey", args.cacheKey))
      .first()

    if (existing) {
      await ctx.db.delete(existing._id)
    }

    await ctx.db.insert("repositoriesCache", {
      cacheKey: args.cacheKey,
      repositories: args.repositories,
      total: args.total,
      hasMore: args.hasMore,
      page: args.page,
      query: args.query,
      language: args.language,
      createdAt: now,
      expiresAt,
    })
  },
})

export const saveRepository = mutation({
  args: {
    userId: v.string(),
    repositoryId: v.number(),
    repositoryName: v.string(),
    repositoryUrl: v.string(),
  },
  async handler(ctx, args) {
    // Check if already saved
    const existing = await ctx.db
      .query("savedRepositories")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("repositoryId"), args.repositoryId))
      .first()

    if (existing) {
      return existing
    }

    const id = await ctx.db.insert("savedRepositories", {
      userId: args.userId,
      repositoryId: args.repositoryId,
      repositoryName: args.repositoryName,
      repositoryUrl: args.repositoryUrl,
      savedAt: Date.now(),
    })

    return await ctx.db.get(id)
  },
})

export const getSavedRepositories = query({
  args: {
    userId: v.string(),
  },
  async handler(ctx, args) {
    return await ctx.db
      .query("savedRepositories")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect()
  },
})

export const removeSavedRepository = mutation({
  args: {
    userId: v.string(),
    repositoryId: v.number(),
  },
  async handler(ctx, args) {
    const saved = await ctx.db
      .query("savedRepositories")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("repositoryId"), args.repositoryId))
      .first()

    if (saved) {
      await ctx.db.delete(saved._id)
    }
  },
})
