import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getUserGoals = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const goals = await ctx.db
      .query("userGoals")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();
    return goals;
  },
});

export const saveUserGoals = mutation({
  args: {
    userId: v.string(),
    data: v.any(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("userGoals")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, { data: args.data });
      return existing._id;
    } else {
      return await ctx.db.insert("userGoals", args);
    }
  },
});
