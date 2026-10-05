import { internalAction, internalQuery, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";

export const getAllSettings = internalQuery({
  handler: async (ctx) => {
    return await ctx.db.query("userSettings").collect();
  },
});

export const appendNotification = internalMutation({
  args: { userId: v.string(), notif: v.any() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (existing) {
      const updated = [args.notif, ...(existing.data || [])];
      await ctx.db.patch(existing._id, { data: updated });
    } else {
      await ctx.db.insert("notifications", { userId: args.userId, data: [args.notif] });
    }
  },
});

import { v } from "convex/values";

export const processReminders = internalAction({
  handler: async (ctx) => {
    // 1. Get all settings
    const allSettings = await ctx.runQuery(internal.telegram.getAllSettings);
    
    // 2. Get current time
    const now = new Date();
    // Format to Romanian local time (UTC+3 EEST) because the user is there
    // The server is UTC. We need to manually adjust to EEST or rely on the user's saved time which might be local.
    // Wait! A better way is to format it using Romanian timezone:
    const options: Intl.DateTimeFormatOptions = { 
        timeZone: 'Europe/Bucharest', 
        hour: '2-digit', 
        minute: '2-digit', 
        hour12: false 
    };
    const formatter = new Intl.DateTimeFormat('en-US', options);
    const timeParts = formatter.formatToParts(now);
    const hh = timeParts.find(p => p.type === 'hour')?.value;
    const mm = timeParts.find(p => p.type === 'minute')?.value;
    const hhmm = `${hh}:${mm}`;

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;
    if (!botToken || !chatId) {
      console.error("Missing Telegram env vars");
      return;
    }

    const checkAndFire = async (settings: any, enabled: boolean, time: string, type: string, title: string, msg: string) => {
      if (!enabled || !time) return;
      if (hhmm === time) {
        // Build notification
        const notif = {
          id: `notif-${Date.now()}`,
          timestamp: new Date().toISOString(),
          title,
          message: msg,
          type: 'reminder',
          read: false
        };
        
        // Save to DB
        await ctx.runMutation(internal.telegram.appendNotification, {
          userId: settings.userId,
          notif
        });

        // Send to Telegram
        const textToSend = `*${title}*\n${msg}`;
        await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: chatId,
            text: textToSend,
            parse_mode: "Markdown",
          }),
        }).catch(err => console.error("Telegram push failed", err));
      }
    };

    // 3. Process each user's settings
    for (const user of allSettings) {
      const s = user.data;
      if (!s || !s.enabled) continue;
      
      await checkAndFire(user, s.breakfastEnabled, s.breakfastTime, 'breakfast', 'Breakfast Reminder 🍳', "It's time for your morning fuel! Don't forget to log your breakfast.");
      await checkAndFire(user, s.lunchEnabled, s.lunchTime, 'lunch', 'Lunch Reminder 🥗', "Time to eat! Log your lunch to keep your macros on track.");
      await checkAndFire(user, s.dinnerEnabled, s.dinnerTime, 'dinner', 'Dinner Reminder 🍽️', "Dinner time! Snap a pic of your meal and hit your protein goals.");
      await checkAndFire(user, s.dailyReviewEnabled, s.dailyReviewTime, 'review', 'Daily Review 📊', "Check your daily progress and prepare for tomorrow!");
    }
  },
});
