import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get or create user profile
async function getOrCreateProfile(ctx: any, userId: string) {
  const existing = await ctx.db
    .query("userProfiles")
    .withIndex("by_userId", (q: any) => q.eq("userId", userId))
    .first();

  if (existing) {
    return existing;
  }

  // Create new profile
  const profileId = await ctx.db.insert("userProfiles", {
    userId,
    favoriteQuotes: [],
    categories: [],
    totalJourneys: 0,
    joinedAt: Date.now(),
  });

  return await ctx.db.get(profileId);
}

// Toggle favorite status for a quote
export const toggleFavorite = mutation({
  args: {
    userId: v.string(),
    quoteId: v.string(),
  },
  handler: async (ctx, args) => {
    const profile = await getOrCreateProfile(ctx, args.userId);
    if (!profile) return { isFavorited: false };

    const favorites = profile.favoriteQuotes || [];
    const index = favorites.indexOf(args.quoteId);

    let newFavorites: Array<string>;
    let isFavorited: boolean;

    if (index > -1) {
      // Remove from favorites
      newFavorites = favorites.filter((id: any) => id !== args.quoteId);
      isFavorited = false;
    } else {
      // Add to favorites
      newFavorites = [...favorites, args.quoteId];
      isFavorited = true;
    }

    await ctx.db.patch(profile._id, {
      favoriteQuotes: newFavorites,
    });

    return { isFavorited };
  },
});

// Check if a quote is favorited by a user
export const isFavorited = query({
  args: {
    userId: v.string(),
    quoteId: v.string(),
  },
  handler: async (ctx, args) => {
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();

    if (!profile) return false;

    return profile.favoriteQuotes.includes(args.quoteId);
  },
});

// Get all favorite quotes for a user
export const getFavorites = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();

    if (!profile || !profile.favoriteQuotes.length) {
      return [];
    }

    // Fetch all favorite quotes
    const quotes = await Promise.all(
      profile.favoriteQuotes.map((id) => ctx.db.get(id as any))
    );

    // Filter out any null values (deleted quotes)
    return quotes.filter((q) => q !== null);
  },
});

// Get user profile with stats
export const getProfile = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();

    return profile;
  },
});

// Update user's preferred categories based on their journey
export const updatePreferences = mutation({
  args: {
    userId: v.string(),
    category: v.string(),
  },
  handler: async (ctx, args) => {
    const profile = await getOrCreateProfile(ctx, args.userId);
    if (!profile) return;

    const categories = profile.categories || [];
    if (!categories.includes(args.category)) {
      await ctx.db.patch(profile._id, {
        categories: [...categories, args.category],
      });
    }
  },
});
