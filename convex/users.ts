import { query, mutation } from "./_generated/server"
import { v } from "convex/values"

export const getUserProfile = query({
  args: {
    userId: v.string(),
  },
  async handler(ctx, args) {
    const user = await ctx.db
      .query("users")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .first()

    return user
  },
})

export const createOrUpdateUser = mutation({
  args: {
    userId: v.string(),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    image: v.optional(v.string()),
    provider: v.string(),
    providerAccountId: v.string(),
  },
  async handler(ctx, args) {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .first()

    const now = Date.now()

    if (existing) {
      // Update existing user
      await ctx.db.patch(existing._id, {
        name: args.name ?? existing.name,
        email: args.email ?? existing.email,
        image: args.image ?? existing.image,
        lastLoginAt: now,
        loginCount: existing.loginCount + 1,
      })
      return await ctx.db.get(existing._id)
    } else {
      // Create new user
      const id = await ctx.db.insert("users", {
        userId: args.userId,
        name: args.name,
        email: args.email,
        image: args.image,
        provider: args.provider,
        providerAccountId: args.providerAccountId,
        createdAt: now,
        lastLoginAt: now,
        loginCount: 1,
      })
      return await ctx.db.get(id)
    }
  },
})
