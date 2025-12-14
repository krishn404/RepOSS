import { query, mutation } from "./_generated/server"
import { v } from "convex/values"

export const getUserPreferences = query({
  args: {
    userId: v.string(),
  },
  async handler(ctx, args) {
    const prefs = await ctx.db
      .query("userPreferences")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first()

    if (!prefs) {
      // Return default preferences
      return {
        userId: args.userId,
        preferredLanguages: [],
        theme: "dark",
        resultsPerPage: 20,
      }
    }

    return prefs
  },
})

export const updateUserPreferences = mutation({
  args: {
    userId: v.string(),
    preferredLanguages: v.optional(v.array(v.string())),
    theme: v.optional(v.string()),
    resultsPerPage: v.optional(v.number()),
  },
  async handler(ctx, args) {
    const existing = await ctx.db
      .query("userPreferences")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first()

    const updateData = {
      userId: args.userId,
      preferredLanguages: args.preferredLanguages ?? existing?.preferredLanguages ?? [],
      theme: args.theme ?? existing?.theme ?? "dark",
      resultsPerPage: args.resultsPerPage ?? existing?.resultsPerPage ?? 20,
      updatedAt: Date.now(),
    }

    let result
    if (existing) {
      await ctx.db.patch(existing._id, updateData)
      result = await ctx.db.get(existing._id)
    } else {
      const id = await ctx.db.insert("userPreferences", updateData)
      result = await ctx.db.get(id)
    }

    // Log preference update activities
    if (args.preferredLanguages !== undefined) {
      await ctx.db.insert("userActivities", {
        userId: args.userId,
        activityType: "preference_updated",
        details: {
          preferenceType: "preferredLanguages",
          preferenceValue: args.preferredLanguages,
        },
        timestamp: Date.now(),
      })
    }
    if (args.theme !== undefined) {
      await ctx.db.insert("userActivities", {
        userId: args.userId,
        activityType: "preference_updated",
        details: {
          preferenceType: "theme",
          preferenceValue: args.theme,
        },
        timestamp: Date.now(),
      })
    }
    if (args.resultsPerPage !== undefined) {
      await ctx.db.insert("userActivities", {
        userId: args.userId,
        activityType: "preference_updated",
        details: {
          preferenceType: "resultsPerPage",
          preferenceValue: args.resultsPerPage,
        },
        timestamp: Date.now(),
      })
    }

    return result
  },
})
