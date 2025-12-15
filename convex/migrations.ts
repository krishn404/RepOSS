import { internalMutation } from "./_generated/server"

// One-off migration to backfill missing user roles. Run from the Convex dashboard.
export const backfillUserRoles = internalMutation({
  args: {},
  async handler(ctx) {
    const users = await ctx.db.query("users").collect()

    for (const user of users) {
      if (!user.role) {
        await ctx.db.patch(user._id, {
          role: "user",
        })
      }
    }

    return { migrated: users.length }
  },
})

// Migration to initialize staff-pick flags on repositories
export const backfillRepositoriesStaffPick = internalMutation({
  args: {},
  async handler(ctx) {
    const repos = await ctx.db.query("repositories").collect()
    let patched = 0

    for (const repo of repos) {
      const shouldPatch =
        repo.isStaffPicked === undefined ||
        repo.staffPickBadges === undefined ||
        repo.nameOwnerSearch === undefined

      if (!shouldPatch) continue

      await ctx.db.patch(repo._id, {
        isStaffPicked: repo.isStaffPicked ?? false,
        staffPickBadges: repo.staffPickBadges ?? [],
        staffPickNote: repo.staffPickNote,
        staffPickedAt: repo.staffPickedAt,
        nameOwnerSearch:
          repo.nameOwnerSearch ??
          `${repo.ownerLogin ?? ""}/${repo.name ?? ""}`.toLowerCase(),
      })
      patched += 1
    }

    return { migrated: patched }
  },
})
