import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

export const viewer = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return null;
    return await ctx.db.get("users", userId);
  },
});

export const updateProfile = mutation({
  args: {
    country: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Not authenticated");
    }
    const patch: Record<string, string | undefined> = {};
    if (args.country !== undefined) {
      patch.country = args.country || undefined;
    }
    await ctx.db.patch(userId, patch);
    return { updated: true };
  },
});
