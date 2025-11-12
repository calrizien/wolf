import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Quotes table - stores all quotes in the system
  quotes: defineTable({
    text: v.string(),
    author: v.string(),
    source: v.optional(v.string()),
    category: v.string(),
    tags: v.array(v.string()),
    scrapedFrom: v.optional(v.string()),
    likes: v.number(),
    views: v.number(),
  })
    .index("by_category", ["category"])
    .index("by_author", ["author"]),

  // Journeys table - tracks user journey sessions through quotes
  journeys: defineTable({
    userId: v.optional(v.string()),
    quotes: v.array(v.string()), // Array of quote IDs
    startedAt: v.number(),
    lastActiveAt: v.number(),
    isActive: v.boolean(),
    totalDuration: v.optional(v.number()),
  }).index("by_userId", ["userId"]),

  // User profiles - stores user preferences and personalization data
  userProfiles: defineTable({
    userId: v.string(),
    name: v.optional(v.string()),
    favoriteQuotes: v.array(v.string()),
    categories: v.array(v.string()),
    totalJourneys: v.number(),
    joinedAt: v.number(),
  }).index("by_userId", ["userId"]),

  // Keep numbers table for now (can remove later)
  numbers: defineTable({
    value: v.number(),
  }),
});
