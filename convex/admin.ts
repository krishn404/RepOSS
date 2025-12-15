import { query, mutation } from "./_generated/server"
import { v } from "convex/values"

const BadgeEnum = v.union(
  v.literal("startup"),
  v.literal("bug_bounty"),
  v.literal("gssoc"),
  v.literal("ai"),
  v.literal("devtools")
)

// Helper function to verify admin role - throws if not admin
async function verifyAdmin(ctx: any, userId: string) {
  const user = await ctx.db
    .query("users")
    .withIndex("by_user_id", (q: any) => q.eq("userId", userId))
    .first()

  if (!user || user.role !== "admin") {
    throw new Error("Unauthorized: Admin access required")
  }

  return user
}

// Admin-only query to check admin access (for UI gating)
export const checkAdminAccess = query({
  args: {
    userId: v.string(),
  },
  async handler(ctx, args) {
    await verifyAdmin(ctx, args.userId)
    return { isAdmin: true }
  },
})

// Admin list of repositories with filters/pagination
export const listRepositoriesAdmin = query({
  args: {
    userId: v.string(),
    search: v.optional(v.string()),
    category: v.optional(v.string()),
    staffPickOnly: v.optional(v.boolean()),
    sortBy: v.optional(v.union(v.literal("stars"), v.literal("createdAt"))),
    page: v.optional(v.number()),
    pageSize: v.optional(v.number()),
  },
  async handler(ctx, args) {
    await verifyAdmin(ctx, args.userId)

    const page = args.page ?? 1
    const pageSize = Math.min(Math.max(args.pageSize ?? 20, 1), 100)

    let queryBuilder = ctx.db.query("repositories")

    if (args.staffPickOnly) {
      queryBuilder = queryBuilder.withIndex("by_isStaffPicked", (q) =>
        q.eq("isStaffPicked", true)
      )
    } else if (args.category) {
      queryBuilder = queryBuilder.withIndex("by_category", (q) =>
        q.eq("category", args.category!)
      )
    }

    const searchTerm = args.search?.toLowerCase().trim()
    if (searchTerm) {
      queryBuilder = queryBuilder
        .withIndex("by_name_owner_search", (q) => q.eq("nameOwnerSearch", searchTerm))
        .filter((q) => q.eq(q.field("nameOwnerSearch"), searchTerm))
    }

    const all = await queryBuilder.collect()

    const sorted = all.sort((a: any, b: any) => {
      if (args.sortBy === "stars") {
        return b.stars - a.stars
      }
      if (args.sortBy === "createdAt") {
        return b.createdAt - a.createdAt
      }
      // Default to staff pick recency then stars
      if (a.isStaffPicked && b.isStaffPicked) {
        return (b.staffPickedAt ?? 0) - (a.staffPickedAt ?? 0)
      }
      if (a.isStaffPicked !== b.isStaffPicked) {
        return a.isStaffPicked ? -1 : 1
      }
      return b.stars - a.stars
    })

    const start = (page - 1) * pageSize
    const items = sorted.slice(start, start + pageSize)
    const total = sorted.length

    return {
      items,
      page,
      pageSize,
      total,
      hasMore: start + pageSize < total,
    }
  },
})

export const markAsStaffPick = mutation({
  args: {
    userId: v.string(),
    repoId: v.number(),
    badges: v.array(BadgeEnum),
    note: v.optional(v.string()),
  },
  async handler(ctx, args) {
    await verifyAdmin(ctx, args.userId)

    // enforce badge uniqueness and known values
    const badges = Array.from(new Set(args.badges))

    const repo = await ctx.db
      .query("repositories")
      .withIndex("by_repo_id", (q) => q.eq("repoId", args.repoId))
      .first()

    if (!repo) {
      throw new Error("Repository not found")
    }

    await ctx.db.patch(repo._id, {
      isStaffPicked: true,
      staffPickBadges: badges,
      staffPickNote: args.note,
      staffPickedAt: Date.now(),
    })

    return await ctx.db.get(repo._id)
  },
})

export const removeStaffPick = mutation({
  args: {
    userId: v.string(),
    repoId: v.number(),
  },
  async handler(ctx, args) {
    await verifyAdmin(ctx, args.userId)

    const repo = await ctx.db
      .query("repositories")
      .withIndex("by_repo_id", (q) => q.eq("repoId", args.repoId))
      .first()

    if (!repo) {
      throw new Error("Repository not found")
    }

    await ctx.db.patch(repo._id, {
      isStaffPicked: false,
      staffPickBadges: [],
      staffPickNote: undefined,
      staffPickedAt: undefined,
    })

    return await ctx.db.get(repo._id)
  },
})
