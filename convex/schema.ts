import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  workouts: defineTable({
    userId: v.string(),
    date: v.string(), // YYYY-MM-DD
    completed: v.boolean(),
    exercises: v.any(),
  }).index("by_user", ["userId"]),
  
  foodHistory: defineTable({
    userId: v.string(),
    data: v.any(), // The full NutritionAnalysisResult object
  }).index("by_user", ["userId"]),
  
userGoals: defineTable({
    userId: v.string(),
    data: v.any(), // The full UserGoals object
  }).index("by_user", ["userId"]),
  
  userSettings: defineTable({
    userId: v.string(),
    data: v.any(), // NotificationSettings
  }).index("by_user", ["userId"]),
  
  notifications: defineTable({
    userId: v.string(),
    data: v.any(), // Array of AppNotification
  }).index("by_user", ["userId"]),
});
