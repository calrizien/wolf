import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// List quotes with optional filtering
export const list = query({
  args: {
    limit: v.optional(v.number()),
    category: v.optional(v.string()),
    author: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;

    let quotesQuery = ctx.db.query("quotes");

    if (args.category) {
      quotesQuery = quotesQuery
        .withIndex("by_category", (q) => q.eq("category", args.category));
    } else if (args.author) {
      quotesQuery = quotesQuery
        .withIndex("by_author", (q) => q.eq("author", args.author));
    }

    const quotes = await quotesQuery
      .order("desc")
      .take(limit);

    return quotes;
  },
});

// Get a single quote by ID
export const getById = query({
  args: {
    id: v.id("quotes"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Get random quotes (optionally from same category)
export const getRandomThree = query({
  args: {
    category: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let quotesQuery = ctx.db.query("quotes");

    if (args.category) {
      quotesQuery = quotesQuery
        .withIndex("by_category", (q) => q.eq("category", args.category));
    }

    // Get all quotes and randomly select 3
    const allQuotes = await quotesQuery.collect();

    // Fisher-Yates shuffle and take first 3
    const shuffled = [...allQuotes];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    return shuffled.slice(0, 3);
  },
});

// Create a new quote
export const create = mutation({
  args: {
    text: v.string(),
    author: v.string(),
    source: v.optional(v.string()),
    category: v.string(),
    tags: v.array(v.string()),
    scrapedFrom: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const quoteId = await ctx.db.insert("quotes", {
      text: args.text,
      author: args.author,
      source: args.source,
      category: args.category,
      tags: args.tags,
      scrapedFrom: args.scrapedFrom,
      likes: 0,
      views: 0,
    });

    return quoteId;
  },
});

// Increment view count
export const incrementViews = mutation({
  args: {
    id: v.id("quotes"),
  },
  handler: async (ctx, args) => {
    const quote = await ctx.db.get(args.id);
    if (!quote) return;

    await ctx.db.patch(args.id, {
      views: quote.views + 1,
    });
  },
});

// Toggle like for a quote
export const toggleLike = mutation({
  args: {
    id: v.id("quotes"),
  },
  handler: async (ctx, args) => {
    const quote = await ctx.db.get(args.id);
    if (!quote) return;

    await ctx.db.patch(args.id, {
      likes: quote.likes + 1,
    });
  },
});

// Get all unique categories
export const getCategories = query({
  args: {},
  handler: async (ctx) => {
    const quotes = await ctx.db.query("quotes").collect();
    const categories = new Set(quotes.map(q => q.category));
    return Array.from(categories).sort();
  },
});
