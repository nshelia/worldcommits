import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  ...authTables,
  users: defineTable({
    name: v.optional(v.string()),
    image: v.optional(v.string()),
    email: v.optional(v.string()),
    emailVerificationTime: v.optional(v.number()),
    phone: v.optional(v.string()),
    phoneVerificationTime: v.optional(v.number()),
    isAnonymous: v.optional(v.boolean()),
    githubUsername: v.optional(v.string()),
    country: v.optional(v.string()),
  })
    .index("email", ["email"])
    .index("githubUsername", ["githubUsername"])
    .index("by_country", ["country"]),
  posts: defineTable({
    sessionId: v.string(),
    userId: v.optional(v.string()),
    githubUsername: v.string(),
    title: v.string(),
    description: v.string(),
    status: v.union(v.literal("active"), v.literal("completed")),
    promptCount: v.number(),
    totalWords: v.number(),
    totalLinesAdded: v.number(),
    totalLinesRemoved: v.number(),
    aiAcceptedCount: v.number(),
    manualOverrideCount: v.number(),
    highRetryEventsCount: v.number(),
    startedAt: v.number(),
    lastPromptAt: v.number(),
    endedAt: v.optional(v.number()),
    lastRewriteAt: v.optional(v.number()),
    lastRewriteProvider: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_session_id", ["sessionId"])
    .index("by_github_username", ["githubUsername"])
    .index("by_updated_at", ["updatedAt"]),
  timelineEvents: defineTable({
    postId: v.id("posts"),
    sessionId: v.string(),
    githubUsername: v.string(),
    timestamp: v.number(),
    promptLength: v.number(),
    containsCodeBlock: v.boolean(),
    modelUsed: v.string(),
    retryIndex: v.number(),
    timeSinceLastPromptMs: v.number(),
    aiEditSuggested: v.boolean(),
    aiEditAccepted: v.boolean(),
    manualOverride: v.boolean(),
    linesAddedCount: v.number(),
    linesRemovedCount: v.number(),
    repeatedPatternDetected: v.boolean(),
    highRetryRate: v.boolean(),
    microSummary: v.string(),
    createdAt: v.number(),
  })
    .index("by_post_id_timestamp", ["postId", "timestamp"])
    .index("by_session_id_timestamp", ["sessionId", "timestamp"])
    .index("by_github_username_timestamp", ["githubUsername", "timestamp"]),
  apiKeys: defineTable({
    userId: v.id("users"),
    keyHash: v.string(),
    keyPrefix: v.string(),
    label: v.optional(v.string()),
    createdAt: v.number(),
    lastUsedAt: v.optional(v.number()),
    revokedAt: v.optional(v.number()),
  })
    .index("by_user_id", ["userId"])
    .index("by_key_hash", ["keyHash"]),
});
