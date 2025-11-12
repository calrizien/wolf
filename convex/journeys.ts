import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get current active journey for a user
export const getCurrent = query({
  args: {
    userId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (!args.userId) return null;

    const journey = await ctx.db
      .query("journeys")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .first();

    return journey;
  },
});

// Create a new journey
export const create = mutation({
  args: {
    userId: v.optional(v.string()),
    startQuoteId: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const journeyId = await ctx.db.insert("journeys", {
      userId: args.userId,
      quotes: [args.startQuoteId],
      startedAt: now,
      lastActiveAt: now,
      isActive: true,
    });

    return journeyId;
  },
});

// Add a quote to an existing journey
export const addQuote = mutation({
  args: {
    journeyId: v.id("journeys"),
    quoteId: v.string(),
  },
  handler: async (ctx, args) => {
    const journey = await ctx.db.get(args.journeyId);
    if (!journey) return;

    await ctx.db.patch(args.journeyId, {
      quotes: [...journey.quotes, args.quoteId],
      lastActiveAt: Date.now(),
    });
  },
});

// End a journey
export const end = mutation({
  args: {
    journeyId: v.id("journeys"),
  },
  handler: async (ctx, args) => {
    const journey = await ctx.db.get(args.journeyId);
    if (!journey) return;

    const duration = Date.now() - journey.startedAt;

    await ctx.db.patch(args.journeyId, {
      isActive: false,
      totalDuration: duration,
    });
  },
});
