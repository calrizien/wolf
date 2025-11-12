# QuoteJourney - Data Model Specification

## Overview

This document provides the complete Convex data model for QuoteJourney, including schema definitions, query/mutation signatures, indexes, relationships, and example data flows. This specification is implementation-ready and follows Convex best practices.

---

## Table of Contents

1. [Schema Definitions](#schema-definitions)
2. [Indexes](#indexes)
3. [Query Functions](#query-functions)
4. [Mutation Functions](#mutation-functions)
5. [Real-time Subscriptions](#real-time-subscriptions)
6. [Data Validation](#data-validation)
7. [Relationships](#relationships)
8. [Example Data Flows](#example-data-flows)

---

## Schema Definitions

### quotes

The central table storing all quote data.

```typescript
// convex/schema.ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  quotes: defineTable({
    // Core fields
    text: v.string(),           // The quote text
    author: v.string(),         // Author name

    // Categorization
    categories: v.array(v.string()),  // e.g., ["motivation", "philosophy"]
    tags: v.array(v.string()),        // e.g., ["courage", "change", "growth"]
    sentiment: v.union(
      v.literal("uplifting"),
      v.literal("contemplative"),
      v.literal("melancholy"),
      v.literal("inspiring"),
      v.literal("philosophical"),
      v.literal("humorous")
    ),

    // Metadata
    source: v.string(),         // e.g., "brainyquote.com", "manual"
    sourceUrl: v.optional(v.string()),  // Original URL if scraped

    // AI features
    embedding: v.optional(v.array(v.float64())),  // Vector embedding for similarity
    semanticKeywords: v.optional(v.array(v.string())),  // AI-extracted keywords

    // Quality & usage
    qualityScore: v.float64(),  // 0-1 score for quote quality
    viewCount: v.float64(),     // Number of times displayed
    selectionCount: v.float64(), // Number of times selected
    selectionRate: v.float64(), // selectionCount / viewCount

    // Timestamps
    createdAt: v.float64(),
    updatedAt: v.float64(),

    // Status
    isActive: v.boolean(),      // For soft deletion
    isVerified: v.boolean(),    // For quality control
  })
    .index("by_author", ["author"])
    .index("by_category", ["categories"])
    .index("by_sentiment", ["sentiment"])
    .index("by_quality", ["qualityScore"])
    .index("by_selection_rate", ["selectionRate"])
    .index("by_active", ["isActive"])
    .index("by_created", ["createdAt"])
    .searchIndex("search_text", {
      searchField: "text",
      filterFields: ["isActive", "categories", "sentiment"]
    })
    .searchIndex("search_author", {
      searchField: "author",
      filterFields: ["isActive"]
    }),

  // ... other tables defined below
});
```

### journeys

Tracks user quote exploration sessions.

```typescript
journeys: defineTable({
  // Identity
  userId: v.optional(v.string()),     // If authenticated
  sessionId: v.string(),              // Anonymous session identifier

  // Journey data
  quoteIds: v.array(v.id("quotes")), // Ordered list of quotes in journey
  currentIndex: v.float64(),          // Current position in journey

  // Reflections
  reflections: v.array(v.object({
    quoteIndex: v.float64(),         // Position in journey when reflection made
    quoteId: v.id("quotes"),         // The quote being reflected on
    text: v.string(),                // User's reflection text
    sentiment: v.optional(v.string()), // AI-detected sentiment
    timestamp: v.float64(),
  })),

  // AI-generated insights
  insights: v.array(v.object({
    content: v.string(),             // The insight text
    generatedAt: v.float64(),
    basedOnQuotes: v.array(v.id("quotes")),  // Quotes analyzed
    themes: v.array(v.string()),     // Detected themes
    emotionalArc: v.optional(v.string()),    // Journey's emotional pattern
    insightType: v.union(
      v.literal("theme_analysis"),
      v.literal("emotional_state"),
      v.literal("philosophical_direction"),
      v.literal("growth_insight")
    ),
  })),

  // Metadata
  startedAt: v.float64(),
  lastActiveAt: v.float64(),
  completedAt: v.optional(v.float64()),

  // Analytics
  totalDuration: v.float64(),        // Time spent in milliseconds
  reflectionCount: v.float64(),
  insightCount: v.float64(),

  // Settings
  soundEnabled: v.boolean(),
  animationIntensity: v.union(
    v.literal("low"),
    v.literal("medium"),
    v.literal("high")
  ),

  // Status
  isActive: v.boolean(),             // Currently ongoing
  isAbandoned: v.boolean(),          // User left without completing
})
  .index("by_user", ["userId"])
  .index("by_session", ["sessionId"])
  .index("by_active", ["isActive"])
  .index("by_started", ["startedAt"])
  .index("by_last_active", ["lastActiveAt"])
  .index("by_user_and_active", ["userId", "isActive"])
  .index("by_session_and_active", ["sessionId", "isActive"]),
```

### userProfiles

User preferences and aggregated statistics.

```typescript
userProfiles: defineTable({
  // Identity
  userId: v.string(),                // Unique user identifier
  email: v.optional(v.string()),
  displayName: v.optional(v.string()),

  // Preferences
  preferences: v.object({
    // Content preferences
    favoriteCategories: v.array(v.string()),
    avoidCategories: v.array(v.string()),
    preferredSentiments: v.array(v.string()),

    // UX preferences
    soundEnabled: v.boolean(),
    soundVolume: v.float64(),        // 0-1
    ambientMusicEnabled: v.boolean(),
    animationIntensity: v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high")
    ),

    // Reflection settings
    reflectionFrequency: v.float64(), // Every N quotes
    autoGenerateInsights: v.boolean(),
  }),

  // Statistics
  stats: v.object({
    journeyCount: v.float64(),
    totalQuotesExplored: v.float64(),
    totalReflections: v.float64(),
    totalInsights: v.float64(),
    totalTimeSpent: v.float64(),      // milliseconds
    averageJourneyLength: v.float64(),
    longestJourneyLength: v.float64(),
    favoriteQuoteIds: v.array(v.id("quotes")),  // Top 10
  }),

  // AI-generated profile
  aiProfile: v.optional(v.object({
    personalityTraits: v.array(v.string()),
    dominantThemes: v.array(v.string()),
    emotionalPattern: v.string(),
    philosophicalLeaning: v.string(),
    lastAnalyzedAt: v.float64(),
  })),

  // Timestamps
  createdAt: v.float64(),
  updatedAt: v.float64(),
  lastActiveAt: v.float64(),

  // Status
  isActive: v.boolean(),
  isPremium: v.boolean(),
})
  .index("by_user_id", ["userId"])
  .index("by_email", ["email"])
  .index("by_last_active", ["lastActiveAt"])
  .index("by_is_premium", ["isPremium"]),
```

### quoteRelationships

Pre-computed and AI-generated relationships between quotes.

```typescript
quoteRelationships: defineTable({
  // Source and target
  fromQuoteId: v.id("quotes"),
  toQuoteId: v.id("quotes"),

  // Relationship metadata
  relationshipType: v.union(
    v.literal("thematic"),          // Similar themes
    v.literal("contrasting"),       // Opposing views
    v.literal("sequential"),        // Natural progression
    v.literal("complementary"),     // Completes the thought
    v.literal("author_related")     // Same author
  ),

  // Strength and scoring
  similarityScore: v.float64(),     // 0-1, higher = more related
  userSelectionCount: v.float64(),  // Times users picked this relationship

  // AI metadata
  aiGenerated: v.boolean(),
  generatedAt: v.optional(v.float64()),

  // Timestamps
  createdAt: v.float64(),
  updatedAt: v.float64(),
})
  .index("by_from_quote", ["fromQuoteId"])
  .index("by_to_quote", ["toQuoteId"])
  .index("by_similarity", ["similarityScore"])
  .index("by_from_and_similarity", ["fromQuoteId", "similarityScore"])
  .index("by_relationship_type", ["relationshipType"]),
```

### reflectionPrompts

Curated prompts for reflection moments.

```typescript
reflectionPrompts: defineTable({
  // Prompt data
  text: v.string(),                  // The prompt text
  category: v.string(),              // e.g., "emotional", "philosophical"

  // Context
  triggerConditions: v.object({
    minQuoteCount: v.float64(),      // Minimum quotes before showing
    sentimentContext: v.optional(v.array(v.string())),  // Show for specific sentiments
    themeContext: v.optional(v.array(v.string())),      // Show for specific themes
  }),

  // Usage
  timesUsed: v.float64(),
  responseRate: v.float64(),         // % of times users responded

  // Timestamps
  createdAt: v.float64(),

  // Status
  isActive: v.boolean(),
})
  .index("by_category", ["category"])
  .index("by_response_rate", ["responseRate"])
  .index("by_active", ["isActive"]),
```

### scrapingJobs

Tracks Firecrawl scraping operations.

```typescript
scrapingJobs: defineTable({
  // Job configuration
  targetUrl: v.string(),
  targetUrls: v.optional(v.array(v.string())),  // For batch jobs
  categories: v.array(v.string()),

  // Job status
  status: v.union(
    v.literal("pending"),
    v.literal("in_progress"),
    v.literal("completed"),
    v.literal("failed"),
    v.literal("partial")
  ),

  // Results
  quotesFound: v.float64(),
  quotesStored: v.float64(),
  quotesDuplicate: v.float64(),
  quotesRejected: v.float64(),

  // Error handling
  errorMessage: v.optional(v.string()),
  retryCount: v.float64(),

  // Timestamps
  createdAt: v.float64(),
  startedAt: v.optional(v.float64()),
  completedAt: v.optional(v.float64()),

  // Metadata
  initiatedBy: v.optional(v.string()),  // User ID if admin
})
  .index("by_status", ["status"])
  .index("by_created", ["createdAt"])
  .index("by_completed", ["completedAt"]),
```

---

## Indexes

### Performance Indexes

Indexes are defined inline with the schema (shown above). Here's a summary of index strategies:

#### quotes Table
- **by_author**: Find all quotes by a specific author
- **by_category**: Filter quotes by category
- **by_sentiment**: Filter by emotional tone
- **by_quality**: Order by quality score
- **by_selection_rate**: Find most engaging quotes
- **search_text**: Full-text search on quote text
- **search_author**: Full-text search on author names

#### journeys Table
- **by_user**: Find all journeys for a user
- **by_session**: Find journey by session ID
- **by_active**: Query active/inactive journeys
- **by_user_and_active**: Find user's active journey
- **by_session_and_active**: Find session's active journey

#### quoteRelationships Table
- **by_from_quote**: Find all quotes related to a source quote
- **by_from_and_similarity**: Get related quotes ordered by similarity
- **by_relationship_type**: Filter by relationship type

---

## Query Functions

### Quote Queries

```typescript
// convex/queries/quotes.ts
import { query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Get random quotes for the landing page smorgasbord
 */
export const getRandomQuotes = query({
  args: {
    count: v.number(),
    categories: v.optional(v.array(v.string())),
    excludeIds: v.optional(v.array(v.id("quotes"))),
  },
  handler: async (ctx, args) => {
    // Implementation returns random selection of quotes
    // Returns: Quote[]
  },
});

/**
 * Get quotes related to a specific quote
 */
export const getRelatedQuotes = query({
  args: {
    quoteId: v.id("quotes"),
    count: v.number(),
    userContext: v.optional(v.object({
      recentQuoteIds: v.array(v.id("quotes")),
      preferredCategories: v.optional(v.array(v.string())),
      preferredSentiments: v.optional(v.array(v.string())),
    })),
  },
  handler: async (ctx, args) => {
    // Implementation uses quoteRelationships and user preferences
    // Returns: Quote[]
  },
});

/**
 * Search quotes by text or author
 */
export const searchQuotes = query({
  args: {
    searchTerm: v.string(),
    filters: v.optional(v.object({
      categories: v.optional(v.array(v.string())),
      sentiment: v.optional(v.string()),
      minQualityScore: v.optional(v.number()),
    })),
    limit: v.number(),
  },
  handler: async (ctx, args) => {
    // Implementation uses search indexes
    // Returns: Quote[]
  },
});

/**
 * Get a single quote by ID
 */
export const getQuote = query({
  args: {
    quoteId: v.id("quotes"),
  },
  handler: async (ctx, args) => {
    // Returns: Quote | null
  },
});

/**
 * Get top quotes by selection rate
 */
export const getTopQuotes = query({
  args: {
    limit: v.number(),
    category: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Returns: Quote[]
  },
});

/**
 * Get quotes by author
 */
export const getQuotesByAuthor = query({
  args: {
    author: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Returns: Quote[]
  },
});

/**
 * Get quotes by category
 */
export const getQuotesByCategory = query({
  args: {
    category: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Returns: Quote[]
  },
});
```

### Journey Queries

```typescript
// convex/queries/journeys.ts

/**
 * Get active journey for a user or session
 */
export const getActiveJourney = query({
  args: {
    userId: v.optional(v.string()),
    sessionId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Returns: Journey | null
  },
});

/**
 * Get full journey history with populated quotes
 */
export const getJourneyHistory = query({
  args: {
    journeyId: v.id("journeys"),
  },
  handler: async (ctx, args) => {
    // Returns: Journey with populated quotes, reflections, insights
  },
});

/**
 * Get all journeys for a user
 */
export const getUserJourneys = query({
  args: {
    userId: v.string(),
    limit: v.optional(v.number()),
    includeAbandoned: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    // Returns: Journey[]
  },
});

/**
 * Get journey statistics
 */
export const getJourneyStats = query({
  args: {
    journeyId: v.id("journeys"),
  },
  handler: async (ctx, args) => {
    // Returns: {
    //   totalQuotes: number,
    //   uniqueAuthors: number,
    //   dominantSentiments: string[],
    //   averageQualityScore: number,
    //   timeSpent: number,
    // }
  },
});

/**
 * Check if reflection should be triggered
 */
export const shouldTriggerReflection = query({
  args: {
    journeyId: v.id("journeys"),
  },
  handler: async (ctx, args) => {
    // Returns: {
    //   shouldTrigger: boolean,
    //   prompt: ReflectionPrompt | null,
    //   reason: string,
    // }
  },
});
```

### User Profile Queries

```typescript
// convex/queries/userProfiles.ts

/**
 * Get user profile
 */
export const getUserProfile = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    // Returns: UserProfile | null
  },
});

/**
 * Get user preferences
 */
export const getUserPreferences = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    // Returns: UserProfile["preferences"] | null
  },
});

/**
 * Get user statistics
 */
export const getUserStats = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    // Returns: UserProfile["stats"] | null
  },
});

/**
 * Get user's AI-generated profile
 */
export const getUserAIProfile = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    // Returns: UserProfile["aiProfile"] | null
  },
});
```

### Reflection Prompt Queries

```typescript
// convex/queries/reflectionPrompts.ts

/**
 * Get appropriate reflection prompt based on journey context
 */
export const getReflectionPrompt = query({
  args: {
    journeyContext: v.object({
      quoteCount: v.number(),
      recentSentiments: v.array(v.string()),
      recentThemes: v.array(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    // Returns: ReflectionPrompt | null
  },
});

/**
 * Get all active reflection prompts
 */
export const getActiveReflectionPrompts = query({
  args: {
    category: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Returns: ReflectionPrompt[]
  },
});
```

---

## Mutation Functions

### Quote Mutations

```typescript
// convex/mutations/quotes.ts
import { mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Create a new quote
 */
export const createQuote = mutation({
  args: {
    text: v.string(),
    author: v.string(),
    categories: v.array(v.string()),
    tags: v.array(v.string()),
    sentiment: v.string(),
    source: v.string(),
    sourceUrl: v.optional(v.string()),
    qualityScore: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Validation, deduplication check, create quote
    // Returns: Id<"quotes">
  },
});

/**
 * Update quote metadata
 */
export const updateQuote = mutation({
  args: {
    quoteId: v.id("quotes"),
    updates: v.object({
      categories: v.optional(v.array(v.string())),
      tags: v.optional(v.array(v.string())),
      sentiment: v.optional(v.string()),
      qualityScore: v.optional(v.number()),
      isVerified: v.optional(v.boolean()),
    }),
  },
  handler: async (ctx, args) => {
    // Returns: void
  },
});

/**
 * Increment quote view count
 */
export const recordQuoteView = mutation({
  args: {
    quoteId: v.id("quotes"),
  },
  handler: async (ctx, args) => {
    // Returns: void
  },
});

/**
 * Increment quote selection count
 */
export const recordQuoteSelection = mutation({
  args: {
    quoteId: v.id("quotes"),
  },
  handler: async (ctx, args) => {
    // Updates viewCount, selectionCount, selectionRate
    // Returns: void
  },
});

/**
 * Soft delete a quote
 */
export const deactivateQuote = mutation({
  args: {
    quoteId: v.id("quotes"),
  },
  handler: async (ctx, args) => {
    // Returns: void
  },
});

/**
 * Batch create quotes (for scraping)
 */
export const batchCreateQuotes = mutation({
  args: {
    quotes: v.array(v.object({
      text: v.string(),
      author: v.string(),
      categories: v.array(v.string()),
      tags: v.array(v.string()),
      sentiment: v.string(),
      source: v.string(),
      sourceUrl: v.optional(v.string()),
      qualityScore: v.optional(v.number()),
    })),
  },
  handler: async (ctx, args) => {
    // Deduplication, validation, bulk insert
    // Returns: {
    //   created: number,
    //   duplicates: number,
    //   failed: number,
    // }
  },
});
```

### Journey Mutations

```typescript
// convex/mutations/journeys.ts

/**
 * Start a new journey
 */
export const startJourney = mutation({
  args: {
    userId: v.optional(v.string()),
    sessionId: v.string(),
    initialQuoteId: v.id("quotes"),
    soundEnabled: v.optional(v.boolean()),
    animationIntensity: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Create new journey, mark any existing as inactive
    // Returns: Id<"journeys">
  },
});

/**
 * Add a quote to the journey
 */
export const addQuoteToJourney = mutation({
  args: {
    journeyId: v.id("journeys"),
    quoteId: v.id("quotes"),
  },
  handler: async (ctx, args) => {
    // Append to quoteIds, update currentIndex, lastActiveAt
    // Also calls recordQuoteSelection
    // Returns: void
  },
});

/**
 * Add a reflection to the journey
 */
export const addReflection = mutation({
  args: {
    journeyId: v.id("journeys"),
    quoteId: v.id("quotes"),
    text: v.string(),
  },
  handler: async (ctx, args) => {
    // Add reflection, update reflectionCount
    // Returns: void
  },
});

/**
 * Add an AI-generated insight to the journey
 */
export const addInsight = mutation({
  args: {
    journeyId: v.id("journeys"),
    content: v.string(),
    basedOnQuotes: v.array(v.id("quotes")),
    themes: v.array(v.string()),
    emotionalArc: v.optional(v.string()),
    insightType: v.string(),
  },
  handler: async (ctx, args) => {
    // Add insight, update insightCount
    // Returns: void
  },
});

/**
 * Update journey settings
 */
export const updateJourneySettings = mutation({
  args: {
    journeyId: v.id("journeys"),
    soundEnabled: v.optional(v.boolean()),
    animationIntensity: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Returns: void
  },
});

/**
 * Mark journey as completed
 */
export const completeJourney = mutation({
  args: {
    journeyId: v.id("journeys"),
  },
  handler: async (ctx, args) => {
    // Set completedAt, isActive = false, calculate totalDuration
    // Returns: void
  },
});

/**
 * Mark journey as abandoned
 */
export const abandonJourney = mutation({
  args: {
    journeyId: v.id("journeys"),
  },
  handler: async (ctx, args) => {
    // Set isAbandoned = true, isActive = false
    // Returns: void
  },
});

/**
 * Update last active timestamp
 */
export const updateJourneyActivity = mutation({
  args: {
    journeyId: v.id("journeys"),
  },
  handler: async (ctx, args) => {
    // Returns: void
  },
});
```

### User Profile Mutations

```typescript
// convex/mutations/userProfiles.ts

/**
 * Create or update user profile
 */
export const upsertUserProfile = mutation({
  args: {
    userId: v.string(),
    email: v.optional(v.string()),
    displayName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Returns: Id<"userProfiles">
  },
});

/**
 * Update user preferences
 */
export const updateUserPreferences = mutation({
  args: {
    userId: v.string(),
    preferences: v.object({
      favoriteCategories: v.optional(v.array(v.string())),
      avoidCategories: v.optional(v.array(v.string())),
      preferredSentiments: v.optional(v.array(v.string())),
      soundEnabled: v.optional(v.boolean()),
      soundVolume: v.optional(v.number()),
      ambientMusicEnabled: v.optional(v.boolean()),
      animationIntensity: v.optional(v.string()),
      reflectionFrequency: v.optional(v.number()),
      autoGenerateInsights: v.optional(v.boolean()),
    }),
  },
  handler: async (ctx, args) => {
    // Returns: void
  },
});

/**
 * Update user statistics after journey completion
 */
export const updateUserStats = mutation({
  args: {
    userId: v.string(),
    journeyId: v.id("journeys"),
  },
  handler: async (ctx, args) => {
    // Calculate and update aggregated stats
    // Returns: void
  },
});

/**
 * Update user AI profile
 */
export const updateUserAIProfile = mutation({
  args: {
    userId: v.string(),
    aiProfile: v.object({
      personalityTraits: v.array(v.string()),
      dominantThemes: v.array(v.string()),
      emotionalPattern: v.string(),
      philosophicalLeaning: v.string(),
    }),
  },
  handler: async (ctx, args) => {
    // Returns: void
  },
});
```

### Quote Relationship Mutations

```typescript
// convex/mutations/quoteRelationships.ts

/**
 * Create a relationship between quotes
 */
export const createQuoteRelationship = mutation({
  args: {
    fromQuoteId: v.id("quotes"),
    toQuoteId: v.id("quotes"),
    relationshipType: v.string(),
    similarityScore: v.number(),
    aiGenerated: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    // Returns: Id<"quoteRelationships">
  },
});

/**
 * Update relationship selection count
 */
export const recordRelationshipSelection = mutation({
  args: {
    fromQuoteId: v.id("quotes"),
    toQuoteId: v.id("quotes"),
  },
  handler: async (ctx, args) => {
    // Increment userSelectionCount
    // Returns: void
  },
});

/**
 * Batch create relationships (for AI generation)
 */
export const batchCreateRelationships = mutation({
  args: {
    relationships: v.array(v.object({
      fromQuoteId: v.id("quotes"),
      toQuoteId: v.id("quotes"),
      relationshipType: v.string(),
      similarityScore: v.number(),
    })),
  },
  handler: async (ctx, args) => {
    // Returns: { created: number, failed: number }
  },
});
```

### Scraping Job Mutations

```typescript
// convex/mutations/scrapingJobs.ts

/**
 * Create a new scraping job
 */
export const createScrapingJob = mutation({
  args: {
    targetUrl: v.optional(v.string()),
    targetUrls: v.optional(v.array(v.string())),
    categories: v.array(v.string()),
    initiatedBy: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Returns: Id<"scrapingJobs">
  },
});

/**
 * Update scraping job status
 */
export const updateScrapingJobStatus = mutation({
  args: {
    jobId: v.id("scrapingJobs"),
    status: v.string(),
    quotesFound: v.optional(v.number()),
    quotesStored: v.optional(v.number()),
    quotesDuplicate: v.optional(v.number()),
    quotesRejected: v.optional(v.number()),
    errorMessage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Returns: void
  },
});
```

---

## Real-time Subscriptions

### Journey Subscription Pattern

Real-time updates for active journeys:

```typescript
// Client-side: src/hooks/useJourneySubscription.ts
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export function useJourneySubscription(journeyId: Id<"journeys">) {
  // This automatically subscribes to changes
  const journey = useQuery(
    api.queries.journeys.getJourneyHistory,
    journeyId ? { journeyId } : "skip"
  );

  return journey;
}
```

**Data Flow:**
1. User selects a quote
2. Client calls `addQuoteToJourney` mutation
3. Mutation updates the journey document
4. Convex pushes update to all subscribed clients
5. UI automatically re-renders with new quote

### Multi-Device Sync Pattern

Same journey across devices:

```typescript
// Both devices subscribe to the same journey via sessionId or userId
const journey = useQuery(
  api.queries.journeys.getActiveJourney,
  { userId: currentUserId }
);

// When one device adds a quote, the other sees it instantly
// When one device adds a reflection, both show the reflection badge
```

### Quote Stats Real-time Updates

```typescript
// Admin dashboard watching quote statistics
const topQuotes = useQuery(
  api.queries.quotes.getTopQuotes,
  { limit: 10 }
);

// As users select quotes, rankings update in real-time
```

---

## Data Validation

### Client-Side Validation (Zod Schemas)

```typescript
// src/lib/validation.ts
import { z } from "zod";

export const ReflectionSchema = z.object({
  journeyId: z.string(),
  quoteId: z.string(),
  text: z.string().min(10).max(1000),
});

export const JourneySettingsSchema = z.object({
  soundEnabled: z.boolean(),
  animationIntensity: z.enum(["low", "medium", "high"]),
});

export const QuoteCreationSchema = z.object({
  text: z.string().min(10).max(500),
  author: z.string().min(2).max(100),
  categories: z.array(z.string()).min(1).max(5),
  tags: z.array(z.string()).max(10),
  sentiment: z.enum([
    "uplifting",
    "contemplative",
    "melancholy",
    "inspiring",
    "philosophical",
    "humorous"
  ]),
  source: z.string(),
  sourceUrl: z.string().url().optional(),
  qualityScore: z.number().min(0).max(1).optional(),
});
```

### Server-Side Validation

Validation occurs in mutation handlers:

```typescript
// Example: createQuote mutation
export const createQuote = mutation({
  args: { /* ... */ },
  handler: async (ctx, args) => {
    // 1. Validate required fields (Convex does this automatically)

    // 2. Check for duplicates
    const existing = await ctx.db
      .query("quotes")
      .filter(q => q.eq(q.field("text"), args.text))
      .first();

    if (existing) {
      throw new Error("Quote already exists");
    }

    // 3. Validate business rules
    if (args.qualityScore && args.qualityScore < 0.5) {
      throw new Error("Quality score too low");
    }

    // 4. Sanitize input
    const sanitizedText = args.text.trim();

    // 5. Create with validated data
    return await ctx.db.insert("quotes", {
      ...args,
      text: sanitizedText,
      viewCount: 0,
      selectionCount: 0,
      selectionRate: 0,
      isActive: true,
      isVerified: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});
```

### Validation Rules Summary

| Field | Rules |
|-------|-------|
| Quote text | 10-500 chars, trim whitespace, check duplicates |
| Author | 2-100 chars, trim whitespace |
| Categories | 1-5 categories, must exist in predefined list |
| Tags | Max 10 tags |
| Quality score | 0-1 range |
| Reflection text | 10-1000 chars |
| Journey sessionId | UUID format, required |
| Similarity score | 0-1 range |

---

## Relationships

### Entity Relationship Diagram

```
┌─────────────┐         ┌──────────────────┐
│   quotes    │◄────────┤ quoteRelationships│
│             │         │                  │
│  - id       │         │  - fromQuoteId   │
│  - text     │         │  - toQuoteId     │
│  - author   │         │  - type          │
│  - ...      │         │  - similarity    │
└─────────────┘         └──────────────────┘
      ▲
      │
      │ quoteIds[]
      │
┌─────────────┐         ┌──────────────────┐
│  journeys   │         │  userProfiles    │
│             │         │                  │
│  - id       │◄────────┤  - userId        │
│  - userId   │ userId  │  - preferences   │
│  - quoteIds │         │  - stats         │
│  - ...      │         │  - ...           │
└─────────────┘         └──────────────────┘
      │
      │ journeyId
      ▼
┌─────────────┐
│reflections  │
│(embedded)   │
│             │
│  - quoteId  │
│  - text     │
└─────────────┘
```

### Relationship Types

#### 1. quotes ↔ quoteRelationships
- **Type**: One-to-Many (bidirectional)
- **Relationship**: A quote can have many related quotes
- **Access Pattern**: Given a quote, find all related quotes ordered by similarity

#### 2. journeys → quotes
- **Type**: Many-to-Many (via array)
- **Relationship**: A journey contains many quotes; a quote appears in many journeys
- **Access Pattern**: Given a journey, get all quotes in order

#### 3. journeys → userProfiles
- **Type**: Many-to-One (optional)
- **Relationship**: Many journeys belong to one user
- **Access Pattern**: Given a user, get all their journeys

#### 4. journeys ⊃ reflections
- **Type**: Embedded Array
- **Relationship**: Reflections are embedded within journeys
- **Access Pattern**: Always loaded with journey

#### 5. journeys ⊃ insights
- **Type**: Embedded Array
- **Relationship**: Insights are embedded within journeys
- **Access Pattern**: Always loaded with journey

---

## Example Data Flows

### 1. Starting a Journey

**User Action**: User clicks on a quote from the landing page

**Data Flow**:

```typescript
// 1. Client calls mutation
const journeyId = await createJourney({
  userId: user?.id,
  sessionId: crypto.randomUUID(),
  initialQuoteId: clickedQuoteId,
  soundEnabled: true,
  animationIntensity: "high"
});

// Server: startJourney mutation
handler: async (ctx, { userId, sessionId, initialQuoteId, ... }) => {
  // A. Check for existing active journey
  const existing = await ctx.db
    .query("journeys")
    .withIndex("by_session_and_active", q =>
      q.eq("sessionId", sessionId).eq("isActive", true)
    )
    .first();

  // B. Mark existing as inactive
  if (existing) {
    await ctx.db.patch(existing._id, { isActive: false });
  }

  // C. Record quote view
  await ctx.runMutation(api.mutations.quotes.recordQuoteView, {
    quoteId: initialQuoteId
  });

  // D. Create new journey
  const journeyId = await ctx.db.insert("journeys", {
    userId,
    sessionId,
    quoteIds: [initialQuoteId],
    currentIndex: 0,
    reflections: [],
    insights: [],
    startedAt: Date.now(),
    lastActiveAt: Date.now(),
    totalDuration: 0,
    reflectionCount: 0,
    insightCount: 0,
    soundEnabled: soundEnabled ?? true,
    animationIntensity: animationIntensity ?? "medium",
    isActive: true,
    isAbandoned: false,
  });

  return journeyId;
}

// 2. Client subscribes to journey updates
const journey = useQuery(api.queries.journeys.getJourneyHistory, {
  journeyId
});

// 3. Client fetches related quotes for options
const relatedQuotes = useQuery(api.queries.quotes.getRelatedQuotes, {
  quoteId: clickedQuoteId,
  count: 4,
  userContext: {
    recentQuoteIds: [],
    preferredCategories: user?.preferences?.favoriteCategories,
  }
});

// Server: getRelatedQuotes query
handler: async (ctx, { quoteId, count, userContext }) => {
  // A. Get explicit relationships
  const relationships = await ctx.db
    .query("quoteRelationships")
    .withIndex("by_from_and_similarity", q =>
      q.eq("fromQuoteId", quoteId)
    )
    .order("desc")
    .take(count * 2);

  // B. Filter by user preferences if available
  let candidates = relationships;
  if (userContext?.preferredCategories) {
    candidates = candidates.filter(rel => {
      // Check if toQuote has preferred categories
    });
  }

  // C. Exclude recent quotes to avoid repetition
  if (userContext?.recentQuoteIds) {
    candidates = candidates.filter(rel =>
      !userContext.recentQuoteIds.includes(rel.toQuoteId)
    );
  }

  // D. Get full quote objects
  const quoteIds = candidates.slice(0, count).map(r => r.toQuoteId);
  const quotes = await Promise.all(
    quoteIds.map(id => ctx.db.get(id))
  );

  return quotes.filter(Boolean);
}
```

**Result**: Journey started, user sees 4 related quote options

---

### 2. Selecting a Quote

**User Action**: User clicks one of the related quote options

**Data Flow**:

```typescript
// 1. Client calls mutation
await addQuoteToJourney({
  journeyId: currentJourneyId,
  quoteId: selectedQuoteId
});

// 2. Play selection sound (client-side)
soundSystem.play("select");

// Server: addQuoteToJourney mutation
handler: async (ctx, { journeyId, quoteId }) => {
  // A. Get current journey
  const journey = await ctx.db.get(journeyId);
  if (!journey) throw new Error("Journey not found");

  // B. Update journey
  await ctx.db.patch(journeyId, {
    quoteIds: [...journey.quoteIds, quoteId],
    currentIndex: journey.currentIndex + 1,
    lastActiveAt: Date.now(),
  });

  // C. Record quote selection and view
  await ctx.runMutation(api.mutations.quotes.recordQuoteSelection, {
    quoteId
  });

  // D. Record relationship selection (for learning)
  const previousQuoteId = journey.quoteIds[journey.quoteIds.length - 1];
  if (previousQuoteId) {
    await ctx.runMutation(
      api.mutations.quoteRelationships.recordRelationshipSelection,
      { fromQuoteId: previousQuoteId, toQuoteId: quoteId }
    );
  }
}

// Server: recordQuoteSelection mutation
handler: async (ctx, { quoteId }) => {
  const quote = await ctx.db.get(quoteId);
  if (!quote) return;

  const newSelectionCount = quote.selectionCount + 1;
  const newViewCount = quote.viewCount + 1;

  await ctx.db.patch(quoteId, {
    selectionCount: newSelectionCount,
    viewCount: newViewCount,
    selectionRate: newSelectionCount / newViewCount,
    updatedAt: Date.now(),
  });
}

// 3. Client automatically receives updated journey via subscription
// 4. Client fetches new related quotes for next options
const nextOptions = useQuery(api.queries.quotes.getRelatedQuotes, {
  quoteId: selectedQuoteId,
  count: 4,
  userContext: {
    recentQuoteIds: journey?.quoteIds.slice(-5), // Last 5 quotes
    preferredCategories: userPreferences?.favoriteCategories,
  }
});

// 5. Client animates transition
// - Current quote fades out and scales up
// - New quote fades in at center
// - New options slide in from bottom

// 6. Play transition sound
soundSystem.play("transition");
```

**Result**: Journey updated, new quote displayed, new options presented

---

### 3. Adding a Reflection

**User Action**: User reaches 7 quotes, sees reflection prompt, types response

**Data Flow**:

```typescript
// 1. Client checks if reflection should trigger
const reflectionCheck = useQuery(
  api.queries.journeys.shouldTriggerReflection,
  { journeyId: currentJourneyId }
);

// Server: shouldTriggerReflection query
handler: async (ctx, { journeyId }) => {
  const journey = await ctx.db.get(journeyId);
  if (!journey) return { shouldTrigger: false, prompt: null };

  // A. Check reflection frequency
  const quotesSinceLastReflection =
    journey.currentIndex -
    (journey.reflections[journey.reflections.length - 1]?.quoteIndex ?? 0);

  // B. Default frequency: every 7 quotes
  const frequency = 7; // Could come from user preferences

  if (quotesSinceLastReflection < frequency) {
    return { shouldTrigger: false, prompt: null, reason: "too_soon" };
  }

  // C. Get appropriate prompt based on journey context
  const recentSentiments = journey.quoteIds
    .slice(-5)
    .map(async id => {
      const quote = await ctx.db.get(id);
      return quote?.sentiment;
    });

  const prompt = await ctx.db
    .query("reflectionPrompts")
    .filter(q => q.eq(q.field("isActive"), true))
    .first(); // Simple version - could be more sophisticated

  return {
    shouldTrigger: true,
    prompt,
    reason: "frequency_met"
  };
}

// 2. If should trigger, show reflection UI with animation
if (reflectionCheck?.shouldTrigger) {
  // Play reflection chime
  soundSystem.play("reflection");

  // Show dimmed overlay with prompt
  setShowReflectionModal(true);
}

// 3. User types and submits reflection
const handleReflectionSubmit = async (text: string) => {
  await addReflection({
    journeyId: currentJourneyId,
    quoteId: currentQuoteId,
    text
  });

  setShowReflectionModal(false);
};

// Server: addReflection mutation
handler: async (ctx, { journeyId, quoteId, text }) => {
  const journey = await ctx.db.get(journeyId);
  if (!journey) throw new Error("Journey not found");

  // A. Validate reflection text
  if (text.length < 10 || text.length > 1000) {
    throw new Error("Reflection must be 10-1000 characters");
  }

  // B. Add reflection to journey
  await ctx.db.patch(journeyId, {
    reflections: [
      ...journey.reflections,
      {
        quoteIndex: journey.currentIndex,
        quoteId,
        text: text.trim(),
        timestamp: Date.now(),
      }
    ],
    reflectionCount: journey.reflectionCount + 1,
    lastActiveAt: Date.now(),
  });

  // C. Update reflection prompt usage stats
  // (Track which prompts get responses)
}

// 4. Client receives updated journey via subscription
// 5. Show success animation and continue journey
```

**Result**: Reflection added to journey, user continues exploring

---

### 4. Generating Insights

**User Action**: System detects user has 2+ reflections, triggers insight generation

**Data Flow**:

```typescript
// 1. Check if insight should be generated (client or server-side trigger)
useEffect(() => {
  if (journey?.reflectionCount >= 2 &&
      journey?.insights.length < journey?.reflectionCount / 2) {
    generateInsight();
  }
}, [journey?.reflectionCount]);

// 2. Call server function (TanStack Start) for AI processing
const generateInsight = async () => {
  setIsGeneratingInsight(true);

  try {
    const insight = await generateJourneyInsight({
      journeyId: currentJourneyId
    });

    // Store insight in Convex
    await addInsight({
      journeyId: currentJourneyId,
      content: insight.content,
      basedOnQuotes: insight.quoteIds,
      themes: insight.themes,
      emotionalArc: insight.emotionalArc,
      insightType: "theme_analysis"
    });

    // Show insight modal with animation
    setShowInsightModal(true);
    soundSystem.play("insight");

  } finally {
    setIsGeneratingInsight(false);
  }
};

// Server Function: generateJourneyInsight (TanStack Start)
// src/server/ai/insights.ts
export const generateJourneyInsight = createServerFn({ method: "POST" })
  .inputValidator(z.object({
    journeyId: z.string()
  }))
  .handler(async ({ data, request }) => {
    // A. Fetch journey from Convex
    const journey = await convexClient.query(
      api.queries.journeys.getJourneyHistory,
      { journeyId: data.journeyId as any }
    );

    if (!journey) throw new Error("Journey not found");

    // B. Prepare context for AI
    const quotes = journey.quoteIds; // Already populated by query
    const reflections = journey.reflections;

    const context = {
      quotes: quotes.map(q => ({
        text: q.text,
        author: q.author,
        sentiment: q.sentiment,
        categories: q.categories
      })),
      reflections: reflections.map(r => r.text),
      journeyLength: quotes.length,
    };

    // C. Call Cloudflare AI
    const aiResponse = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/ai/run/@cf/meta/llama-3.1-8b-instruct`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${CLOUDFLARE_AI_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [
            {
              role: "system",
              content: "You are an insightful guide analyzing a person's journey through quotes. Provide deep, personal insights about their emotional and philosophical patterns."
            },
            {
              role: "user",
              content: `Analyze this quote journey and provide a personal insight:

Quotes explored:
${context.quotes.map((q, i) => `${i + 1}. "${q.text}" - ${q.author} (${q.sentiment})`).join('\n')}

User reflections:
${context.reflections.map((r, i) => `${i + 1}. ${r}`).join('\n')}

Provide:
1. A warm, personal insight paragraph (2-3 sentences)
2. 3-5 dominant themes you see
3. The emotional arc of their journey
4. A philosophical direction they seem drawn to

Format as JSON.`
            }
          ]
        })
      }
    );

    const aiResult = await aiResponse.json();
    const parsedInsight = JSON.parse(aiResult.result.response);

    // D. Return structured insight
    return {
      content: parsedInsight.insight,
      themes: parsedInsight.themes,
      emotionalArc: parsedInsight.emotionalArc,
      philosophicalDirection: parsedInsight.philosophicalDirection,
      quoteIds: journey.quoteIds.map(q => q._id),
    };
  });

// Server: addInsight mutation (already defined above)
handler: async (ctx, { journeyId, content, basedOnQuotes, themes, ... }) => {
  const journey = await ctx.db.get(journeyId);
  if (!journey) throw new Error("Journey not found");

  await ctx.db.patch(journeyId, {
    insights: [
      ...journey.insights,
      {
        content,
        generatedAt: Date.now(),
        basedOnQuotes,
        themes,
        emotionalArc,
        insightType,
      }
    ],
    insightCount: journey.insightCount + 1,
    lastActiveAt: Date.now(),
  });
}

// 3. Display insight with beautiful animation
// - Background blur/dim
// - Card scales in with glow effect
// - Text fades in line by line
// - "Continue Journey" button appears

// 4. Optionally update user's AI profile
if (userId) {
  await updateUserAIProfile({
    userId,
    aiProfile: {
      personalityTraits: insight.themes,
      dominantThemes: insight.themes,
      emotionalPattern: insight.emotionalArc,
      philosophicalLeaning: insight.philosophicalDirection,
    }
  });
}
```

**Result**: Personalized insight generated and displayed to user

---

### 5. Viewing History

**User Action**: User clicks "View History" button

**Data Flow**:

```typescript
// 1. Navigate to history page
router.push(`/journey/history?id=${journeyId}`);

// 2. Load full journey with all data
// Route: /journey/history
export const Route = createFileRoute('/journey/history')({
  loader: async ({ params }) => {
    const journeyId = params.id;

    // Pre-fetch journey data
    const journey = await convexQuery(
      api.queries.journeys.getJourneyHistory,
      { journeyId }
    );

    return { journey };
  },
});

// Server: getJourneyHistory query
handler: async (ctx, { journeyId }) => {
  // A. Get journey
  const journey = await ctx.db.get(journeyId);
  if (!journey) return null;

  // B. Populate all quotes
  const quotes = await Promise.all(
    journey.quoteIds.map(id => ctx.db.get(id))
  );

  // C. Return enriched journey
  return {
    ...journey,
    quotes: quotes.filter(Boolean),
    // reflections and insights already embedded
  };
}

// 3. Render timeline visualization
function JourneyHistoryPage() {
  const { journey } = Route.useLoaderData();
  const liveJourney = useQuery(
    api.queries.journeys.getJourneyHistory,
    { journeyId: journey._id }
  );

  return (
    <div>
      {/* Timeline of quotes */}
      {liveJourney.quotes.map((quote, index) => (
        <TimelineQuoteCard
          key={quote._id}
          quote={quote}
          index={index}
          isReflectionPoint={liveJourney.reflections.some(
            r => r.quoteIndex === index
          )}
          reflection={liveJourney.reflections.find(
            r => r.quoteIndex === index
          )}
        />
      ))}

      {/* Insights section */}
      {liveJourney.insights.map((insight, i) => (
        <InsightCard key={i} insight={insight} />
      ))}

      {/* Stats */}
      <JourneyStats
        totalQuotes={liveJourney.quotes.length}
        totalReflections={liveJourney.reflectionCount}
        timeSpent={formatDuration(liveJourney.totalDuration)}
        uniqueAuthors={new Set(liveJourney.quotes.map(q => q.author)).size}
      />
    </div>
  );
}

// 4. User can click any quote to revisit
const handleQuoteClick = async (clickedQuote, index) => {
  // Jump back to that point in the journey
  await updateJourneyActivity({ journeyId });

  // Navigate to journey view at that position
  router.push(`/journey?id=${journeyId}&at=${index}`);
};
```

**Result**: User sees complete journey timeline with all quotes, reflections, and insights

---

## Performance Optimization Strategies

### 1. Pagination for Large Journeys

```typescript
// For journeys with 100+ quotes, paginate the history view
export const getJourneyHistoryPaginated = query({
  args: {
    journeyId: v.id("journeys"),
    offset: v.number(),
    limit: v.number(),
  },
  handler: async (ctx, args) => {
    const journey = await ctx.db.get(args.journeyId);
    if (!journey) return null;

    // Get only the quotes for current page
    const quoteIdsPage = journey.quoteIds.slice(
      args.offset,
      args.offset + args.limit
    );

    const quotes = await Promise.all(
      quoteIdsPage.map(id => ctx.db.get(id))
    );

    return {
      quotes,
      total: journey.quoteIds.length,
      hasMore: args.offset + args.limit < journey.quoteIds.length,
    };
  },
});
```

### 2. Prefetching Related Quotes

```typescript
// Prefetch next set of options while user reads current quote
const prefetchRelatedQuotes = useMutation(
  api.mutations.quotes.prefetchRelated
);

useEffect(() => {
  if (currentQuote) {
    // Prefetch in background
    prefetchRelatedQuotes({ quoteId: currentQuote._id });
  }
}, [currentQuote]);
```

### 3. Caching AI Responses

```typescript
// Cache AI-generated insights for similar journey patterns
const insightCache = new Map();

// Before generating, check if similar journey exists
const cacheKey = generateJourneyCacheKey(quoteIds, themes);
if (insightCache.has(cacheKey)) {
  return insightCache.get(cacheKey);
}
```

### 4. Lazy Loading Embeddings

```typescript
// Don't load embeddings unless needed for similarity search
export const getQuote = query({
  args: { quoteId: v.id("quotes") },
  handler: async (ctx, args) => {
    const quote = await ctx.db.get(args.quoteId);

    // Exclude embedding from default response
    if (quote) {
      const { embedding, ...quoteWithoutEmbedding } = quote;
      return quoteWithoutEmbedding;
    }

    return null;
  },
});
```

---

## Migration and Seeding

### Initial Database Seeding

```typescript
// convex/seed.ts
import { internalMutation } from "./_generated/server";
import { v } from "convex/values";

export const seedInitialQuotes = internalMutation({
  args: {},
  handler: async (ctx) => {
    // Check if already seeded
    const existing = await ctx.db.query("quotes").first();
    if (existing) return { message: "Already seeded" };

    // Insert initial quotes
    const quotes = [
      {
        text: "The only way to do great work is to love what you do.",
        author: "Steve Jobs",
        categories: ["motivation", "work"],
        tags: ["passion", "excellence"],
        sentiment: "inspiring",
        source: "manual",
        qualityScore: 0.95,
        viewCount: 0,
        selectionCount: 0,
        selectionRate: 0,
        isActive: true,
        isVerified: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
      // ... more quotes
    ];

    for (const quote of quotes) {
      await ctx.db.insert("quotes", quote);
    }

    return { message: `Seeded ${quotes.length} quotes` };
  },
});
```

### Reflection Prompt Seeding

```typescript
export const seedReflectionPrompts = internalMutation({
  args: {},
  handler: async (ctx) => {
    const prompts = [
      {
        text: "What draws you to these quotes?",
        category: "general",
        triggerConditions: {
          minQuoteCount: 5,
        },
        timesUsed: 0,
        responseRate: 0,
        isActive: true,
        createdAt: Date.now(),
      },
      {
        text: "How do these words resonate with your current life situation?",
        category: "emotional",
        triggerConditions: {
          minQuoteCount: 7,
          sentimentContext: ["contemplative", "melancholy"],
        },
        timesUsed: 0,
        responseRate: 0,
        isActive: true,
        createdAt: Date.now(),
      },
      // ... more prompts
    ];

    for (const prompt of prompts) {
      await ctx.db.insert("reflectionPrompts", prompt);
    }

    return { message: `Seeded ${prompts.length} prompts` };
  },
});
```

---

## Summary

This data model provides:

1. **Scalable Schema**: Handles growth from MVP to thousands of users
2. **Real-time Capabilities**: Leverages Convex subscriptions for live updates
3. **AI-Ready**: Embeddings and metadata for intelligent recommendations
4. **Analytics-Friendly**: Tracks metrics for user behavior and quote performance
5. **Flexible Relationships**: Supports complex quote connections and user preferences
6. **Type-Safe**: Full TypeScript support via Convex code generation

All queries and mutations are optimized for the core user experience: smooth, meditative quote exploration with personalized insights.

---

*Last Updated: 2025-11-12*
