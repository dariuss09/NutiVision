import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getFoodHistory = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("foodHistory")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
  },
});

export const addFood = mutation({
  args: {
    userId: v.string(),
    data: v.any(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("foodHistory", args);
  },
});

export const deleteFood = mutation({
  args: { id: v.id("foodHistory") },
  handler: async (ctx, args) => {
    return await ctx.db.delete(args.id);
  },
});

export const clearFoodHistory = mutation({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const items = await ctx.db
      .query("foodHistory")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    for (const item of items) {
      await ctx.db.delete(item._id);
    }
  },
});

export const setFoodHistory = mutation({
  args: {
    userId: v.string(),
    history: v.any(),
  },
  handler: async (ctx, args) => {
    // Delete existing
    const existing = await ctx.db
      .query("foodHistory")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    for (const item of existing) {
      await ctx.db.delete(item._id);
    }
    // Insert new
    for (const data of args.history) {
      await ctx.db.insert("foodHistory", {
        userId: args.userId,
        data: data
      });
    }
  },
});
