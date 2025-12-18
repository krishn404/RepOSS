import { defineSchema, defineTable } from "convex/server"
import { v } from "convex/values"

// Allow arbitrary staff pick "Type" labels, including custom ones
const BadgeEnum = v.string()

export default defineSchema({
  repositoriesCache: defineTable({
    cacheKey: v.string(),
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
      })
    ),
    total: v.number(),
    hasMore: v.boolean(),
    page: v.number(),
    query: v.string(),
    language: v.optional(v.string()),
    createdAt: v.number(),
    expiresAt: v.number(),
  })
    .index("by_cache_key", ["cacheKey"])
    .index("by_expires", ["expiresAt"]),

  savedRepositories: defineTable({
    userId: v.string(),
    repositoryId: v.number(),
    repositoryName: v.string(),
    repositoryUrl: v.string(),
    savedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_repository", ["repositoryId"]),

  userPreferences: defineTable({
    userId: v.string(),
    preferredLanguages: v.array(v.string()),
    theme: v.string(),
    resultsPerPage: v.number(),
    updatedAt: v.number(),
  }).index("by_user", ["userId"]),

  trendingRepositories: defineTable({
    repositories: v.array(
      v.object({
        id: v.number(),
        name: v.string(),
        full_name: v.string(),
        description: v.optional(v.string()),
        url: v.string(),
        language: v.optional(v.string()),
        stargazers_count: v.number(),
      })
    ),
    period: v.string(),
    createdAt: v.number(),
    expiresAt: v.number(),
  })
    .index("by_period", ["period"])
    .index("by_expires", ["expiresAt"]),

  repositories: defineTable({
    repoId: v.number(),
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
    category: v.optional(v.string()),
    createdAt: v.number(),
    pushedAt: v.optional(v.number()),
    nameOwnerSearch: v.string(),
    isStaffPicked: v.boolean(),
    staffPickBadges: v.array(BadgeEnum),
    staffPickNote: v.optional(v.string()),
    staffPickedAt: v.optional(v.number()),
  })
    .index("by_repo_id", ["repoId"])
    .index("by_isStaffPicked", ["isStaffPicked"])
    .index("by_staff_pick", ["isStaffPicked", "staffPickedAt"])
    .index("by_category", ["category"])
    .index("by_name_owner_search", ["nameOwnerSearch"])
    .index("by_stars", ["stars"])
    .index("by_created_at", ["createdAt"]),

  users: defineTable({
    userId: v.string(),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    image: v.optional(v.string()),
    provider: v.string(),
    providerAccountId: v.string(),
    role: v.union(v.literal("user"), v.literal("admin")),
    createdAt: v.number(),
    lastLoginAt: v.number(),
    loginCount: v.number(),
  })
    .index("by_user_id", ["userId"])
    .index("by_email", ["email"])
    .index("by_provider", ["provider"])
    .index("by_role", ["role"]),

  userActivities: defineTable({
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
      })
    ),
    timestamp: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_activity_type", ["activityType"])
    .index("by_timestamp", ["timestamp"]),
})
