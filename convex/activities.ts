import { mutation, query } from "./_generated/server"
import { v } from "convex/values"

export const logActivity = mutation({
  args: {
    userId: v.string(),
    activityType: v.string(),
    details: v.optional(
      v.object({
        repositoryId: v.optional(v.number()),
        repositoryName: v.optional(v.string()),
        searchQuery: v.optional(v.string()),
        language: v.optional(v.string()),
        preferenceType: v.optional(v.string()),
        preferenceValue: v.optional(v.any()),
      }),
    ),
  },
  async handler(ctx, args) {
    await ctx.db.insert("userActivities", {
      userId: args.userId,
      activityType: args.activityType,
      details: args.details,
      timestamp: Date.now(),
    })
  },
})

export const getUserActivities = query({
  args: {
    userId: v.string(),
    limit: v.optional(v.number()),
  },
  async handler(ctx, args) {
    const limit = args.limit ?? 100
    const activities = await ctx.db
      .query("userActivities")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(limit)

    return activities
  },
})

export const getUserActivitiesByType = query({
  args: {
    userId: v.string(),
    activityType: v.string(),
    limit: v.optional(v.number()),
  },
  async handler(ctx, args) {
    const limit = args.limit ?? 100
    const activities = await ctx.db
      .query("userActivities")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("activityType"), args.activityType))
      .order("desc")
      .take(limit)

    return activities
  },
})
