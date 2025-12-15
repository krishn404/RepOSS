import { paginationOptsValidator } from "convex/server"
import { query, mutation } from "./_generated/server"
import { v } from "convex/values"

const BadgeEnum = v.union(
  v.literal("startup"),
  v.literal("bug_bounty"),
  v.literal("gssoc"),
  v.literal("ai"),
  v.literal("devtools")
)

type AdminContext = {
  db: any
}

// Helper to enforce admin access on every admin query/mutation.
async function verifyAdmin(ctx: AdminContext, userId: string) {
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

const clampPageSize = (size?: number) => Math.min(Math.max(size ?? 25, 1), 100)

export const listRepositories = query({
  args: {
    userId: v.string(),
    search: v.optional(v.string()),
    badges: v.optional(v.array(BadgeEnum)),
    category: v.optional(v.string()),
    staffPickOnly: v.optional(v.boolean()),
    sort: v.optional(
      v.union(v.literal("staffPickedAt"), v.literal("stars"), v.literal("createdAt"))
    ),
    paginationOpts: paginationOptsValidator,
  },
  async handler(ctx, args) {
    await verifyAdmin(ctx, args.userId)

    const badgeFilter = args.badges?.length ? Array.from(new Set(args.badges)) : []
    const staffOnly = args.staffPickOnly || badgeFilter.length > 0
    const searchTerm = args.search?.trim().toLowerCase()

    // Choose the primary index based on requested sort and filters to minimize scans.
    let queryBuilder = ctx.db.query("repositories")

    if (searchTerm) {
      // Prefix range on the lowercased name/owner search key
      const upperBound = `${searchTerm}\uffff`
      queryBuilder = queryBuilder
        .withIndex("by_name_owner_search", (q: any) =>
          q.gte("nameOwnerSearch", searchTerm).lt(upperBound)
        )
        .order("desc")
    } else if (staffOnly || args.sort === "staffPickedAt") {
      queryBuilder = queryBuilder
        .withIndex("by_staff_picked_at")
        .order("desc")
        .filter((q: any) => q.eq(q.field("isStaffPicked"), true))
    } else if (args.sort === "stars") {
      queryBuilder = queryBuilder.withIndex("by_stars").order("desc")
    } else {
      // Default: show newest repositories first
      queryBuilder = queryBuilder.withIndex("by_created_at").order("desc")
    }

    if (args.category) {
      queryBuilder = queryBuilder.filter((q: any) =>
        q.eq(q.field("category"), args.category)
      )
    }

    // Extra filter for staff picks when sort isn't already enforcing it.
    if (!searchTerm && staffOnly && args.sort !== "staffPickedAt") {
      queryBuilder = queryBuilder.filter((q: any) =>
        q.eq(q.field("isStaffPicked"), true)
      )
    }

    const page = await queryBuilder.paginate({
      ...args.paginationOpts,
      numItems: clampPageSize(args.paginationOpts.numItems),
    })

    // Apply badge filter and search fallback in-process (search already narrowed by index).
    const filteredPage = page.page.filter((repo: any) => {
      if (badgeFilter.length && !badgeFilter.every((b) => repo.staffPickBadges?.includes(b))) {
        return false
      }
      if (searchTerm) {
        return repo.nameOwnerSearch?.includes(searchTerm)
      }
      return true
    })

    return {
      ...page,
      page: filteredPage,
    }
  },
})

export const setStaffPick = mutation({
  args: {
    userId: v.string(),
    repoId: v.number(),
    badges: v.array(BadgeEnum),
    note: v.optional(v.string()),
    picked: v.boolean(),
  },
  async handler(ctx, args) {
    await verifyAdmin(ctx, args.userId)

    const badges = Array.from(new Set(args.badges))
    const repo = await ctx.db
      .query("repositories")
      .withIndex("by_repo_id", (q: any) => q.eq("repoId", args.repoId))
      .first()

    if (!repo) {
      throw new Error("Repository not found")
    }

    const normalizedNote = args.note?.trim() || undefined

    if (!args.picked) {
      if (!repo.isStaffPicked && !repo.staffPickBadges?.length) {
        return repo // idempotent noop
      }

      await ctx.db.patch(repo._id, {
        isStaffPicked: false,
        staffPickBadges: [],
        staffPickNote: undefined,
        staffPickedAt: undefined,
      })
      return await ctx.db.get(repo._id)
    }

    const isNoop =
      repo.isStaffPicked &&
      JSON.stringify(repo.staffPickBadges ?? []) === JSON.stringify(badges) &&
      repo.staffPickNote === normalizedNote

    if (isNoop) {
      return repo
    }

    await ctx.db.patch(repo._id, {
      isStaffPicked: true,
      staffPickBadges: badges,
      staffPickNote: normalizedNote,
      staffPickedAt: Date.now(),
    })

    return await ctx.db.get(repo._id)
  },
})

export const getOverview = query({
  args: { userId: v.string() },
  async handler(ctx, args) {
    await verifyAdmin(ctx, args.userId)

    let total = 0
    let staffPicks = 0
    const badgeTally: Record<string, number> = {}

    // Count using paginated scans to avoid loading everything at once.
    let cursor: string | null = null
    do {
      const page = await ctx.db
        .query("repositories")
        .withIndex("by_created_at")
        .order("desc")
        .paginate({ cursor, numItems: 200 })

      total += page.page.length
      for (const repo of page.page) {
        if (repo.isStaffPicked) {
          staffPicks += 1
          for (const badge of repo.staffPickBadges ?? []) {
            badgeTally[badge] = (badgeTally[badge] ?? 0) + 1
          }
        }
      }

      cursor = page.continueCursor ?? null
    } while (cursor)

    return {
      totalRepositories: total,
      staffPickCount: staffPicks,
      badgeCounts: badgeTally,
    }
  },
})
