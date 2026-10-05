import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Run every minute
crons.interval(
  "ping-telegram-reminders",
  { minutes: 1 },
  internal.telegram.processReminders
);

export default crons;
