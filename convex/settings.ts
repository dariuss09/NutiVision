import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getSettings = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("userSettings")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();
  },
});

export const saveSettings = mutation({
  args: { userId: v.string(), data: v.any() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("userSettings")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, { data: args.data });
    } else {
      await ctx.db.insert("userSettings", { userId: args.userId, data: args.data });
    }
  },
});

export const getNotifications = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();
  },
});

export const saveNotifications = mutation({
  args: { userId: v.string(), data: v.any() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, { data: args.data });
    } else {
      await ctx.db.insert("notifications", { userId: args.userId, data: args.data });
    }
  },
});
