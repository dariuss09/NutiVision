import { query } from "./_generated/server";
export const countFood = query({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("foodHistory").collect();
    return all.length;
  }
});
