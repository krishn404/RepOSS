import { paginationOptsValidator } from "convex/server"
import { query, mutation } from "./_generated/server"
import { v } from "convex/values"
import { QueryCtx, MutationCtx } from "./_generated/server"

const BadgeEnum = v.union(
  v.literal("startup"),
  v.literal("bug_bounty"),
  v.literal("gssoc"),
  v.literal("ai"),
  v.literal("devtools")
)

/* -------------------------
   SAFE ADMIN CHECK HELPERS
-------------------------- */

async function getAdminUser(ctx: QueryCtx | MutationCtx, userId: string) {
  const user = await ctx.db
    .query("users")
    .withIndex("by_user_id", (q) => q.eq("userId", userId))
    .first()

  if (!user || user.role !== "admin") return null
  return user
}

/* -------------------------
   ADMIN ACCESS CHECK
-------------------------- */

export const checkAdminAccess = query({
  args: { userId: v.string() },
  async handler(ctx, args) {
    const admin = await getAdminUser(ctx, args.userId)
    return { isAdmin: Boolean(admin) }
  },
})

const clampPageSize = (size?: number) =>
  Math.min(Math.max(size ?? 25, 1), 100)

/* -------------------------
   LIST REPOSITORIES
-------------------------- */

export const listRepositories = query({
  args: {
    userId: v.string(),
    search: v.optional(v.string()),
    badges: v.optional(v.array(BadgeEnum)),
    category: v.optional(v.string()),
    staffPickOnly: v.optional(v.boolean()),
    sort: v.optional(
      v.union(
        v.literal("staffPickedAt"),
        v.literal("stars"),
        v.literal("createdAt")
      )
    ),
    paginationOpts: paginationOptsValidator,
  },
  async handler(ctx, args) {
    const admin = await getAdminUser(ctx, args.userId)
    if (!admin) {
      return {
        page: [],
        isDone: true,
        continueCursor: null,
      }
    }

    const badgeFilter = args.badges?.length
      ? Array.from(new Set(args.badges))
      : []

    const staffOnly = args.staffPickOnly || badgeFilter.length > 0
    const searchTerm = args.search?.trim().toLowerCase()

    let queryBuilder = ctx.db.query("repositories")

    if (searchTerm) {
      const upper = `${searchTerm}\uffff`
      queryBuilder = queryBuilder.withIndex(
        "by_name_owner_search",
        (q) =>
          q.gte("nameOwnerSearch", searchTerm).lt(upper)
      )
    } else if (staffOnly || args.sort === "staffPickedAt") {
      queryBuilder = queryBuilder
        .withIndex("by_staff_picked_at")
        .filter((q) => q.eq(q.field("isStaffPicked"), true))
    } else if (args.sort === "stars") {
      queryBuilder = queryBuilder.withIndex("by_stars")
    } else {
      queryBuilder = queryBuilder.withIndex("by_created_at")
    }

    queryBuilder = queryBuilder.order("desc")

    if (args.category) {
      queryBuilder = queryBuilder.filter((q) =>
        q.eq(q.field("category"), args.category)
      )
    }

    const page = await queryBuilder.paginate({
      ...args.paginationOpts,
      numItems: clampPageSize(args.paginationOpts.numItems),
    })

    const filtered = page.page.filter((repo) => {
      if (
        badgeFilter.length &&
        !badgeFilter.every((b) =>
          repo.staffPickBadges?.includes(b)
        )
      )
        return false

      if (searchTerm) {
        return repo.nameOwnerSearch?.includes(searchTerm)
      }
      return true
    })

    return { ...page, page: filtered }
  },
})

/* -------------------------
   SET STAFF PICK (STRICT)
-------------------------- */

export const setStaffPick = mutation({
  args: {
    userId: v.string(),
    repoId: v.number(),
    badges: v.array(BadgeEnum),
    note: v.optional(v.string()),
    picked: v.boolean(),
  },
  async handler(ctx, args) {
    const admin = await getAdminUser(ctx, args.userId)
    if (!admin) throw new Error("Unauthorized")

    const repo = await ctx.db
      .query("repositories")
      .withIndex("by_repo_id", (q) => q.eq("repoId", args.repoId))
      .first()

    if (!repo) throw new Error("Repository not found")

    if (!args.picked) {
      await ctx.db.patch(repo._id, {
        isStaffPicked: false,
        staffPickBadges: [],
        staffPickNote: undefined,
        staffPickedAt: undefined,
      })
      return ctx.db.get(repo._id)
    }

    await ctx.db.patch(repo._id, {
      isStaffPicked: true,
      staffPickBadges: Array.from(new Set(args.badges)),
      staffPickNote: args.note?.trim(),
      staffPickedAt: Date.now(),
    })

    return ctx.db.get(repo._id)
  },
})

/* -------------------------
   GET OVERVIEW (FIXED)
-------------------------- */

export const getOverview = query({
  args: { userId: v.string() },
  async handler(ctx, args) {
    const admin = await getAdminUser(ctx, args.userId)
    if (!admin) {
      return {
        totalRepositories: 0,
        staffPickCount: 0,
        badgeCounts: {},
      }
    }

    let total = 0
    let staffPicks = 0
    const badgeTally: Record<string, number> = {}

    let cursor: string | null = null
    do {
      const page = await ctx.db
        .query("repositories")
        .withIndex("by_created_at")
        .order("desc")
        .paginate({ cursor, numItems: 200 })

      total += page.page.length

      for (const repo of page.page) {
        if (repo.isStaffPicked === true) {
          staffPicks++
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
