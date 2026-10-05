import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getWorkouts = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("workouts")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
  },
});

export const saveWorkout = mutation({
  args: {
    userId: v.string(),
    date: v.string(),
    completed: v.boolean(),
    exercises: v.any(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("workouts")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("date"), args.date))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        completed: args.completed,
        exercises: args.exercises,
      });
      return existing._id;
    } else {
      return await ctx.db.insert("workouts", {
        userId: args.userId,
        date: args.date,
        completed: args.completed,
        exercises: args.exercises,
      });
    }
  },
});
