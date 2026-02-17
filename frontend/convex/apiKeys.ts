import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError, v } from "convex/values";
import {
  internalMutation,
  internalQuery,
  mutation,
  query,
} from "./_generated/server";

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

async function sha256(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return bytesToHex(new Uint8Array(digest));
}

function generateRawApiKey(): string {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return `wc_${bytesToHex(bytes)}`;
}

export const listMyApiKeys = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return [];
    const keys = await ctx.db
      .query("apiKeys")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .collect();
    return keys
      .sort((a, b) => b.createdAt - a.createdAt)
      .map((key) => ({
        _id: key._id,
        keyPrefix: key.keyPrefix,
        label: key.label ?? null,
        createdAt: key.createdAt,
        lastUsedAt: key.lastUsedAt ?? null,
        revokedAt: key.revokedAt ?? null,
      }));
  },
});

export const createApiKey = mutation({
  args: {
    label: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new ConvexError("Unauthorized");
    }

    const apiKey = generateRawApiKey();
    const keyHash = await sha256(apiKey);
    const keyPrefix = apiKey.slice(0, 12);
    const now = Date.now();

    const keyId = await ctx.db.insert("apiKeys", {
      userId,
      keyHash,
      keyPrefix,
      label: args.label?.trim() ? args.label.trim().slice(0, 120) : undefined,
      createdAt: now,
    });

    return {
      keyId,
      apiKey,
      keyPrefix,
      createdAt: now,
    };
  },
});

export const revokeApiKey = mutation({
  args: {
    keyId: v.id("apiKeys"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new ConvexError("Unauthorized");
    }
    const key = await ctx.db.get("apiKeys", args.keyId);
    if (!key || key.userId !== userId) {
      throw new ConvexError("Not found");
    }
    if (key.revokedAt) return { revoked: false };
    await ctx.db.patch("apiKeys", args.keyId, { revokedAt: Date.now() });
    return { revoked: true };
  },
});

export const resolveByHashInternal = internalQuery({
  args: {
    keyHash: v.string(),
  },
  handler: async (ctx, args) => {
    const key = await ctx.db
      .query("apiKeys")
      .withIndex("by_key_hash", (q) => q.eq("keyHash", args.keyHash))
      .unique();
    if (!key || key.revokedAt) return null;
    const user = await ctx.db.get("users", key.userId);
    if (!user) return null;
    return { key, user };
  },
});

export const touchApiKeyInternal = internalMutation({
  args: {
    keyId: v.id("apiKeys"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch("apiKeys", args.keyId, { lastUsedAt: Date.now() });
  },
});
