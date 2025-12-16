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

/* -------------------------
   GET ALL STAFF PICKS
-------------------------- */

export const getAllStaffPicks = query({
  args: { userId: v.string() },
  async handler(ctx, args) {
    const admin = await getAdminUser(ctx, args.userId)
    if (!admin) return []

    const staffPicks = await ctx.db
      .query("repositories")
      .withIndex("by_staff_pick", (q) => q.eq("isStaffPicked", true))
      .order("desc")
      .collect()

    return staffPicks.map((repo) => ({
      repoId: repo.repoId,
      staffPickBadges: repo.staffPickBadges,
      staffPickedAt: repo.staffPickedAt,
    }))
  },
})

const clampPageSize = (size?: number) =>
  Math.min(Math.max(size ?? 25, 1), 100)

/* -------------------------
   LIST STAFF PICKS (ADMIN)
-------------------------- */

export const listStaffPicks = query({
  args: {
    userId: v.string(),
    search: v.optional(v.string()),
    type: v.optional(BadgeEnum),
    sort: v.optional(v.union(v.literal("staffPickedAt"), v.literal("stars"))),
    paginationOpts: paginationOptsValidator,
  },
  async handler(ctx, args) {
    const admin = await getAdminUser(ctx, args.userId)
    if (!admin) {
      return { page: [], isDone: true, continueCursor: null as any }
    }

    const searchTerm = args.search?.trim().toLowerCase()

    const page = searchTerm
      ? await ctx.db
          .query("repositories")
          .withIndex("by_name_owner_search", (q) =>
            q
              .gte("nameOwnerSearch", searchTerm)
              .lt("nameOwnerSearch", `${searchTerm}\uffff`)
          )
          .paginate({
            ...args.paginationOpts,
            numItems: clampPageSize(args.paginationOpts.numItems),
          })
      : await ctx.db
          .query("repositories")
          .withIndex("by_staff_pick", (q) => q.eq("isStaffPicked", true))
          .order("desc")
          .paginate({
            ...args.paginationOpts,
            numItems: clampPageSize(args.paginationOpts.numItems),
          })

    let filtered = page.page

    if (args.type) {
      filtered = filtered.filter((repo) =>
        repo.staffPickBadges.includes(args.type!)
      )
    }

    if (args.sort === "stars") {
      filtered = [...filtered].sort(
        (a, b) => (b.stars ?? 0) - (a.stars ?? 0)
      )
    }

    return { ...page, page: filtered }
  },
})

/* -------------------------
   LIST ALL REPOSITORIES (ADMIN)
   - Uses same base table as clients
   - Badge filter is additive; includes staff picks too
-------------------------- */

export const listRepositories = query({
  args: {
    userId: v.string(),
    search: v.optional(v.string()),
    type: v.optional(BadgeEnum),
    sort: v.optional(v.union(v.literal("staffPickedAt"), v.literal("stars"))),
    paginationOpts: paginationOptsValidator,
  },
  async handler(ctx, args) {
    const emptyPage = { page: [], isDone: true, continueCursor: null as any }

    try {
      // Guard inputs and auth first; never throw for missing/unauthorized
      if (!args.userId || !args.paginationOpts) {
        return emptyPage
      }

      const admin = await getAdminUser(ctx, args.userId)
      if (!admin) {
        return emptyPage
      }

      const searchTerm = args.search?.trim().toLowerCase()

      // Base query: search uses nameOwnerSearch index; otherwise use primary index with default order
      const page = searchTerm
        ? await ctx.db
            .query("repositories")
            .withIndex("by_name_owner_search", (q) =>
              q
                .gte("nameOwnerSearch", searchTerm)
                .lt("nameOwnerSearch", `${searchTerm}\uffff`)
            )
            .paginate({
              ...args.paginationOpts,
              numItems: clampPageSize(args.paginationOpts.numItems),
            })
        : await ctx.db
            .query("repositories")
            .paginate({
              ...args.paginationOpts,
              numItems: clampPageSize(args.paginationOpts.numItems),
            })

      let filtered = page.page

      if (args.type) {
        filtered = filtered.filter((repo) =>
          (repo.staffPickBadges ?? []).includes(args.type!)
        )
      }

      if (args.sort === "stars") {
        filtered = [...filtered].sort((a, b) => (b.stars ?? 0) - (a.stars ?? 0))
      } else if (args.sort === "staffPickedAt") {
        filtered = [...filtered].sort((a, b) => (b.staffPickedAt ?? 0) - (a.staffPickedAt ?? 0))
      }

      return { ...page, page: filtered }
    } catch (error) {
      return emptyPage
    }
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
    repoData: v.optional(
      v.object({
        name: v.string(),
        fullName: v.string(),
        description: v.optional(v.string()),
        htmlUrl: v.string(),
        ownerLogin: v.string(),
        ownerAvatarUrl: v.optional(v.string()),
        language: v.optional(v.string()),
        topics: v.optional(v.array(v.string())),
        stars: v.number(),
        forks: v.number(),
      })
    ),
  },
  async handler(ctx, args) {
    const admin = await getAdminUser(ctx, args.userId)
    if (!admin) throw new Error("Unauthorized")

    let repo = await ctx.db
      .query("repositories")
      .withIndex("by_repo_id", (q) => q.eq("repoId", args.repoId))
      .first()

    if (!repo && args.repoData) {
      const now = Date.now()
      const nameOwnerSearch = args.repoData.fullName.toLowerCase()

      const id = await ctx.db.insert("repositories", {
        repoId: args.repoId,
        name: args.repoData.name,
        fullName: args.repoData.fullName,
        description: args.repoData.description,
        htmlUrl: args.repoData.htmlUrl,
        ownerLogin: args.repoData.ownerLogin,
        ownerAvatarUrl: args.repoData.ownerAvatarUrl,
        language: args.repoData.language,
        topics: args.repoData.topics,
        stars: args.repoData.stars,
        forks: args.repoData.forks,
        createdAt: now,
        nameOwnerSearch,
        isStaffPicked: false,
        staffPickBadges: [],
      })

      repo = await ctx.db.get(id)
    }

    if (!repo) {
      throw new Error("Repository not found.")
    }

    const selectedBadge = args.badges[0]
    if (args.picked && !selectedBadge) {
      throw new Error("A Type must be selected for staff picks.")
    }

    if (!args.picked) {
      await ctx.db.patch(repo._id, {
        isStaffPicked: false,
        staffPickBadges: [],
        staffPickNote: undefined,
        staffPickedAt: undefined,
      })
      return
    }

    await ctx.db.patch(repo._id, {
      isStaffPicked: true,
      staffPickBadges: [selectedBadge],
      staffPickNote: args.note?.trim(),
      staffPickedAt: Date.now(),
    })
  },
})

/* -------------------------
   GET OVERVIEW
-------------------------- */

export const getOverview = query({
  args: { userId: v.string() },
  async handler(ctx, args) {
    const admin = await getAdminUser(ctx, args.userId)
    if (!admin) {
      return { totalRepositories: 0, staffPickCount: 0, badgeCounts: {} }
    }

    let staffPickCount = 0
    const badgeCounts: Record<string, number> = {}

    const picks = await ctx.db
      .query("repositories")
      .withIndex("by_staff_pick", (q) => q.eq("isStaffPicked", true))
      .collect()

    staffPickCount = picks.length

    for (const repo of picks) {
      for (const badge of repo.staffPickBadges) {
        badgeCounts[badge] = (badgeCounts[badge] ?? 0) + 1
      }
    }

    return {
      totalRepositories: 0, // intentionally unused
      staffPickCount,
      badgeCounts,
    }
  },
})
