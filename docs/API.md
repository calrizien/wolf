# QuoteJourney API Documentation

> **Version**: 1.0.0
> **Last Updated**: 2025-11-12
> **Base URL**: https://wolf.topangasoft.workers.dev

This document provides comprehensive API specifications for QuoteJourney, organized by feature area. All server functions are implemented using TanStack Start's `createServerFn` with Zod validation.

---

## Table of Contents

1. [Common Types & Schemas](#common-types--schemas)
2. [Quote Management](#quote-management)
3. [Journey Tracking](#journey-tracking)
4. [AI Generation](#ai-generation)
5. [Reflections](#reflections)
6. [Insights](#insights)
7. [Admin & Scraping](#admin--scraping)
8. [Error Handling](#error-handling)
9. [Rate Limiting](#rate-limiting)
10. [Authentication](#authentication)

---

## Common Types & Schemas

### Base Schemas

```typescript
import { z } from 'zod';
import { Id } from '../convex/_generated/dataModel';

// Quote schema
export const QuoteSchema = z.object({
  _id: z.custom<Id<"quotes">>(),
  text: z.string().min(10).max(1000),
  author: z.string().min(2).max(200),
  categories: z.array(z.string()).min(1),
  tags: z.array(z.string()).default([]),
  sentiment: z.enum(['uplifting', 'contemplative', 'melancholy', 'inspiring']),
  source: z.string().url().or(z.literal('generated')),
  embedding: z.array(z.number()).optional(),
  qualityScore: z.number().min(0).max(10).default(5),
  createdAt: z.number(),
});

export type Quote = z.infer<typeof QuoteSchema>;

// Journey schema
export const JourneySchema = z.object({
  _id: z.custom<Id<"journeys">>(),
  userId: z.string().optional(),
  sessionId: z.string().uuid(),
  quoteIds: z.array(z.custom<Id<"quotes">>()),
  currentIndex: z.number().min(0),
  reflections: z.array(z.object({
    quoteIndex: z.number(),
    text: z.string().min(1).max(2000),
    timestamp: z.number(),
  })),
  insights: z.array(z.object({
    content: z.string().min(1).max(5000),
    generatedAt: z.number(),
    basedOnQuotes: z.array(z.custom<Id<"quotes">>()),
  })),
  startedAt: z.number(),
  lastActiveAt: z.number(),
});

export type Journey = z.infer<typeof JourneySchema>;

// User preferences schema
export const UserPreferencesSchema = z.object({
  userId: z.string(),
  preferences: z.object({
    categories: z.array(z.string()).default([]),
    soundEnabled: z.boolean().default(true),
    animationIntensity: z.enum(['low', 'medium', 'high']).default('medium'),
  }),
  journeyCount: z.number().min(0).default(0),
  totalQuotesExplored: z.number().min(0).default(0),
});

export type UserPreferences = z.infer<typeof UserPreferencesSchema>;

// Sentiment type
export type Sentiment = 'uplifting' | 'contemplative' | 'melancholy' | 'inspiring';

// Error response
export const ErrorResponseSchema = z.object({
  error: z.string(),
  code: z.string(),
  details: z.any().optional(),
  timestamp: z.number(),
});

export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;
```

---

## Quote Management

### 1. Get Random Quotes (Landing Page)

**Purpose**: Fetch random quotes for the landing page smorgasbord.

**Server Function**:
```typescript
import { createServerFn } from '@tanstack/start/server';

export const getRandomQuotes = createServerFn({ method: 'GET' })
  .inputValidator(z.object({
    count: z.number().min(1).max(50).default(20),
    categories: z.array(z.string()).optional(),
    excludeIds: z.array(z.string()).optional(),
  }))
  .handler(async ({ data }) => {
    const { count, categories, excludeIds } = data;

    // Query Convex
    const quotes = await ctx.runQuery(api.quotes.getRandomQuotes, {
      count,
      categories,
      excludeIds,
    });

    return {
      quotes,
      total: quotes.length,
    };
  });
```

**Input Schema**:
```typescript
const GetRandomQuotesInput = z.object({
  count: z.number().min(1).max(50).default(20),
  categories: z.array(z.string()).optional(),
  excludeIds: z.array(z.string()).optional(),
});
```

**Response Schema**:
```typescript
const GetRandomQuotesResponse = z.object({
  quotes: z.array(QuoteSchema),
  total: z.number(),
});
```

**Example Request**:
```typescript
const result = await getRandomQuotes({
  data: {
    count: 20,
    categories: ['motivation', 'wisdom'],
    excludeIds: [],
  }
});
```

**Example Response**:
```json
{
  "quotes": [
    {
      "_id": "jd7s9f8s9df",
      "text": "The only way to do great work is to love what you do.",
      "author": "Steve Jobs",
      "categories": ["motivation", "work"],
      "tags": ["passion", "career"],
      "sentiment": "inspiring",
      "source": "https://example.com/quotes",
      "qualityScore": 8.5,
      "createdAt": 1699876543210
    }
  ],
  "total": 20
}
```

---

### 2. Get Quote by ID

**Purpose**: Fetch a specific quote by its ID.

**Server Function**:
```typescript
export const getQuoteById = createServerFn({ method: 'GET' })
  .inputValidator(z.object({
    quoteId: z.string(),
  }))
  .handler(async ({ data }) => {
    const quote = await ctx.runQuery(api.quotes.getById, {
      quoteId: data.quoteId,
    });

    if (!quote) {
      throw new Error('Quote not found');
    }

    return quote;
  });
```

**Input Schema**:
```typescript
const GetQuoteByIdInput = z.object({
  quoteId: z.string(),
});
```

**Response Schema**:
```typescript
const GetQuoteByIdResponse = QuoteSchema;
```

---

### 3. Get Related Quotes

**Purpose**: Fetch semantically related quotes for journey continuation.

**Server Function**:
```typescript
export const getRelatedQuotes = createServerFn({ method: 'POST' })
  .inputValidator(z.object({
    quoteId: z.string(),
    count: z.number().min(3).max(10).default(5),
    userContext: z.object({
      recentQuoteIds: z.array(z.string()).optional(),
      preferredCategories: z.array(z.string()).optional(),
      currentSentiment: z.enum(['uplifting', 'contemplative', 'melancholy', 'inspiring']).optional(),
    }).optional(),
  }))
  .handler(async ({ data }) => {
    const { quoteId, count, userContext } = data;

    // Get the current quote
    const currentQuote = await ctx.runQuery(api.quotes.getById, { quoteId });

    if (!currentQuote) {
      throw new Error('Quote not found');
    }

    // Use Cloudflare AI to find semantically similar quotes
    // Or use embedding-based similarity search
    const relatedQuotes = await ctx.runQuery(api.quotes.getRelated, {
      quoteId,
      count,
      excludeIds: userContext?.recentQuoteIds || [],
      preferredCategories: userContext?.preferredCategories,
    });

    return {
      currentQuote,
      relatedQuotes,
      count: relatedQuotes.length,
    };
  });
```

**Input Schema**:
```typescript
const GetRelatedQuotesInput = z.object({
  quoteId: z.string(),
  count: z.number().min(3).max(10).default(5),
  userContext: z.object({
    recentQuoteIds: z.array(z.string()).optional(),
    preferredCategories: z.array(z.string()).optional(),
    currentSentiment: z.enum(['uplifting', 'contemplative', 'melancholy', 'inspiring']).optional(),
  }).optional(),
});
```

**Response Schema**:
```typescript
const GetRelatedQuotesResponse = z.object({
  currentQuote: QuoteSchema,
  relatedQuotes: z.array(QuoteSchema),
  count: z.number(),
});
```

**Example Request**:
```typescript
const result = await getRelatedQuotes({
  data: {
    quoteId: 'jd7s9f8s9df',
    count: 5,
    userContext: {
      recentQuoteIds: ['abc123', 'def456'],
      preferredCategories: ['philosophy', 'wisdom'],
      currentSentiment: 'contemplative',
    }
  }
});
```

**Example Response**:
```json
{
  "currentQuote": {
    "_id": "jd7s9f8s9df",
    "text": "The unexamined life is not worth living.",
    "author": "Socrates",
    "categories": ["philosophy"],
    "sentiment": "contemplative",
    "source": "https://example.com",
    "qualityScore": 9.2,
    "createdAt": 1699876543210
  },
  "relatedQuotes": [
    {
      "_id": "xyz789",
      "text": "Know thyself.",
      "author": "Socrates",
      "categories": ["philosophy", "wisdom"],
      "sentiment": "contemplative",
      "source": "https://example.com",
      "qualityScore": 9.0,
      "createdAt": 1699876543211
    }
  ],
  "count": 5
}
```

---

### 4. Search Quotes

**Purpose**: Full-text search across quotes.

**Server Function**:
```typescript
export const searchQuotes = createServerFn({ method: 'GET' })
  .inputValidator(z.object({
    query: z.string().min(1).max(200),
    categories: z.array(z.string()).optional(),
    sentiment: z.enum(['uplifting', 'contemplative', 'melancholy', 'inspiring']).optional(),
    limit: z.number().min(1).max(100).default(20),
    offset: z.number().min(0).default(0),
  }))
  .handler(async ({ data }) => {
    const results = await ctx.runQuery(api.quotes.search, data);

    return {
      quotes: results.quotes,
      total: results.total,
      hasMore: results.total > (data.offset + data.limit),
    };
  });
```

**Input Schema**:
```typescript
const SearchQuotesInput = z.object({
  query: z.string().min(1).max(200),
  categories: z.array(z.string()).optional(),
  sentiment: z.enum(['uplifting', 'contemplative', 'melancholy', 'inspiring']).optional(),
  limit: z.number().min(1).max(100).default(20),
  offset: z.number().min(0).default(0),
});
```

**Response Schema**:
```typescript
const SearchQuotesResponse = z.object({
  quotes: z.array(QuoteSchema),
  total: z.number(),
  hasMore: z.boolean(),
});
```

---

## Journey Tracking

### 1. Create Journey Session

**Purpose**: Initialize a new journey session.

**Server Function**:
```typescript
export const createJourneySession = createServerFn({ method: 'POST' })
  .inputValidator(z.object({
    userId: z.string().optional(),
    initialQuoteId: z.string(),
  }))
  .handler(async ({ data }) => {
    const { userId, initialQuoteId } = data;

    // Generate session ID
    const sessionId = crypto.randomUUID();

    // Create journey in Convex
    const journeyId = await ctx.runMutation(api.journeys.create, {
      userId,
      sessionId,
      initialQuoteId,
      startedAt: Date.now(),
    });

    const journey = await ctx.runQuery(api.journeys.getById, { journeyId });

    return {
      journeyId,
      sessionId,
      journey,
    };
  });
```

**Input Schema**:
```typescript
const CreateJourneySessionInput = z.object({
  userId: z.string().optional(),
  initialQuoteId: z.string(),
});
```

**Response Schema**:
```typescript
const CreateJourneySessionResponse = z.object({
  journeyId: z.string(),
  sessionId: z.string().uuid(),
  journey: JourneySchema,
});
```

**Example Request**:
```typescript
const result = await createJourneySession({
  data: {
    userId: 'user_123',
    initialQuoteId: 'quote_abc',
  }
});
```

**Example Response**:
```json
{
  "journeyId": "journey_xyz789",
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "journey": {
    "_id": "journey_xyz789",
    "userId": "user_123",
    "sessionId": "550e8400-e29b-41d4-a716-446655440000",
    "quoteIds": ["quote_abc"],
    "currentIndex": 0,
    "reflections": [],
    "insights": [],
    "startedAt": 1699876543210,
    "lastActiveAt": 1699876543210
  }
}
```

---

### 2. Add Quote to Journey

**Purpose**: Record a user selecting a quote during their journey.

**Server Function**:
```typescript
export const addQuoteToJourney = createServerFn({ method: 'POST' })
  .inputValidator(z.object({
    journeyId: z.string(),
    quoteId: z.string(),
  }))
  .handler(async ({ data }) => {
    const { journeyId, quoteId } = data;

    // Update journey
    const updatedJourney = await ctx.runMutation(api.journeys.addQuote, {
      journeyId,
      quoteId,
      timestamp: Date.now(),
    });

    return {
      success: true,
      journey: updatedJourney,
      currentIndex: updatedJourney.currentIndex,
    };
  });
```

**Input Schema**:
```typescript
const AddQuoteToJourneyInput = z.object({
  journeyId: z.string(),
  quoteId: z.string(),
});
```

**Response Schema**:
```typescript
const AddQuoteToJourneyResponse = z.object({
  success: z.boolean(),
  journey: JourneySchema,
  currentIndex: z.number(),
});
```

---

### 3. Get Journey by ID

**Purpose**: Retrieve complete journey data.

**Server Function**:
```typescript
export const getJourneyById = createServerFn({ method: 'GET' })
  .inputValidator(z.object({
    journeyId: z.string(),
    includeQuotes: z.boolean().default(true),
  }))
  .handler(async ({ data }) => {
    const { journeyId, includeQuotes } = data;

    const journey = await ctx.runQuery(api.journeys.getById, { journeyId });

    if (!journey) {
      throw new Error('Journey not found');
    }

    let quotes: Quote[] = [];
    if (includeQuotes) {
      quotes = await ctx.runQuery(api.quotes.getByIds, {
        quoteIds: journey.quoteIds,
      });
    }

    return {
      journey,
      quotes,
      stats: {
        totalQuotes: journey.quoteIds.length,
        reflectionCount: journey.reflections.length,
        insightCount: journey.insights.length,
        duration: Date.now() - journey.startedAt,
      },
    };
  });
```

**Input Schema**:
```typescript
const GetJourneyByIdInput = z.object({
  journeyId: z.string(),
  includeQuotes: z.boolean().default(true),
});
```

**Response Schema**:
```typescript
const GetJourneyByIdResponse = z.object({
  journey: JourneySchema,
  quotes: z.array(QuoteSchema),
  stats: z.object({
    totalQuotes: z.number(),
    reflectionCount: z.number(),
    insightCount: z.number(),
    duration: z.number(),
  }),
});
```

---

### 4. Get User Journey History

**Purpose**: Retrieve all journeys for a user.

**Server Function**:
```typescript
export const getUserJourneyHistory = createServerFn({ method: 'GET' })
  .inputValidator(z.object({
    userId: z.string().optional(),
    sessionId: z.string().optional(),
    limit: z.number().min(1).max(50).default(10),
    offset: z.number().min(0).default(0),
  }))
  .handler(async ({ data }) => {
    const { userId, sessionId, limit, offset } = data;

    if (!userId && !sessionId) {
      throw new Error('Either userId or sessionId is required');
    }

    const journeys = await ctx.runQuery(api.journeys.getHistory, {
      userId,
      sessionId,
      limit,
      offset,
    });

    return {
      journeys,
      total: journeys.length,
      hasMore: journeys.length === limit,
    };
  });
```

**Input Schema**:
```typescript
const GetUserJourneyHistoryInput = z.object({
  userId: z.string().optional(),
  sessionId: z.string().optional(),
  limit: z.number().min(1).max(50).default(10),
  offset: z.number().min(0).default(0),
});
```

**Response Schema**:
```typescript
const GetUserJourneyHistoryResponse = z.object({
  journeys: z.array(JourneySchema),
  total: z.number(),
  hasMore: z.boolean(),
});
```

---

## AI Generation

### 1. Generate Related Quotes with AI

**Purpose**: Use Cloudflare AI to generate semantically similar quotes.

**Server Function**:
```typescript
export const generateRelatedQuotes = createServerFn({ method: 'POST' })
  .inputValidator(z.object({
    currentQuote: z.object({
      text: z.string(),
      author: z.string(),
      categories: z.array(z.string()),
    }),
    count: z.number().min(1).max(10).default(3),
    style: z.enum(['similar', 'contrasting', 'deeper']).default('similar'),
    userContext: z.object({
      recentThemes: z.array(z.string()).optional(),
      preferredSentiment: z.enum(['uplifting', 'contemplative', 'melancholy', 'inspiring']).optional(),
    }).optional(),
  }))
  .handler(async ({ data, context }) => {
    const { currentQuote, count, style, userContext } = data;

    // Cloudflare AI integration
    const env = context.cloudflare.env;

    // Build prompt based on style
    let prompt = '';
    switch (style) {
      case 'similar':
        prompt = `Given this quote: "${currentQuote.text}" by ${currentQuote.author}, generate ${count} similar quotes that explore the same theme but from different perspectives. Each quote should be meaningful, concise (under 200 characters), and include the author name.`;
        break;
      case 'contrasting':
        prompt = `Given this quote: "${currentQuote.text}" by ${currentQuote.author}, generate ${count} contrasting quotes that present an opposing or complementary viewpoint. Each quote should be meaningful, concise (under 200 characters), and include the author name.`;
        break;
      case 'deeper':
        prompt = `Given this quote: "${currentQuote.text}" by ${currentQuote.author}, generate ${count} quotes that dive deeper into this theme, exploring more nuanced or profound aspects. Each quote should be meaningful, concise (under 200 characters), and include the author name.`;
        break;
    }

    // Add user context to prompt if available
    if (userContext?.recentThemes) {
      prompt += `\n\nThe user has been exploring themes of: ${userContext.recentThemes.join(', ')}. Consider these in your generation.`;
    }

    if (userContext?.preferredSentiment) {
      prompt += `\n\nPrefer quotes with a ${userContext.preferredSentiment} sentiment.`;
    }

    // Call Cloudflare AI
    const response = await env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
      messages: [
        {
          role: 'system',
          content: 'You are a wise curator of meaningful quotes. Generate quotes in this format: "Quote text" - Author Name. Each quote on a new line.',
        },
        {
          role: 'user',
          content: prompt,
        }
      ],
      max_tokens: 1000,
      temperature: 0.8,
    });

    // Parse generated quotes
    const generatedQuotes = parseGeneratedQuotes(response.response);

    // Store in database for future use
    const storedQuotes = await ctx.runMutation(api.quotes.createMany, {
      quotes: generatedQuotes.map(q => ({
        ...q,
        source: 'generated',
        categories: currentQuote.categories,
        qualityScore: 7.0, // AI-generated quotes start with moderate quality
      })),
    });

    return {
      quotes: storedQuotes,
      count: storedQuotes.length,
      style,
    };
  });
```

**Input Schema**:
```typescript
const GenerateRelatedQuotesInput = z.object({
  currentQuote: z.object({
    text: z.string(),
    author: z.string(),
    categories: z.array(z.string()),
  }),
  count: z.number().min(1).max(10).default(3),
  style: z.enum(['similar', 'contrasting', 'deeper']).default('similar'),
  userContext: z.object({
    recentThemes: z.array(z.string()).optional(),
    preferredSentiment: z.enum(['uplifting', 'contemplative', 'melancholy', 'inspiring']).optional(),
  }).optional(),
});
```

**Response Schema**:
```typescript
const GenerateRelatedQuotesResponse = z.object({
  quotes: z.array(QuoteSchema),
  count: z.number(),
  style: z.enum(['similar', 'contrasting', 'deeper']),
});
```

**Example Request**:
```typescript
const result = await generateRelatedQuotes({
  data: {
    currentQuote: {
      text: "The unexamined life is not worth living.",
      author: "Socrates",
      categories: ["philosophy", "wisdom"]
    },
    count: 3,
    style: 'deeper',
    userContext: {
      recentThemes: ["self-knowledge", "introspection"],
      preferredSentiment: "contemplative"
    }
  }
});
```

**Example Response**:
```json
{
  "quotes": [
    {
      "_id": "gen_123",
      "text": "To know yourself is the beginning of all wisdom.",
      "author": "Aristotle",
      "categories": ["philosophy", "wisdom"],
      "tags": ["self-knowledge"],
      "sentiment": "contemplative",
      "source": "generated",
      "qualityScore": 7.0,
      "createdAt": 1699876543210
    }
  ],
  "count": 3,
  "style": "deeper"
}
```

---

### 2. Generate Text Embeddings

**Purpose**: Generate vector embeddings for semantic search using Cloudflare AI.

**Server Function**:
```typescript
export const generateTextEmbedding = createServerFn({ method: 'POST' })
  .inputValidator(z.object({
    text: z.string().min(1).max(2000),
  }))
  .handler(async ({ data, context }) => {
    const { text } = data;
    const env = context.cloudflare.env;

    // Use Cloudflare AI embeddings model
    const response = await env.AI.run('@cf/baai/bge-base-en-v1.5', {
      text: [text],
    });

    return {
      embedding: response.data[0],
      dimensions: response.data[0].length,
      model: '@cf/baai/bge-base-en-v1.5',
    };
  });
```

**Input Schema**:
```typescript
const GenerateTextEmbeddingInput = z.object({
  text: z.string().min(1).max(2000),
});
```

**Response Schema**:
```typescript
const GenerateTextEmbeddingResponse = z.object({
  embedding: z.array(z.number()),
  dimensions: z.number(),
  model: z.string(),
});
```

---

### 3. Analyze Quote Sentiment

**Purpose**: Classify quote sentiment using AI.

**Server Function**:
```typescript
export const analyzeQuoteSentiment = createServerFn({ method: 'POST' })
  .inputValidator(z.object({
    text: z.string().min(1).max(1000),
  }))
  .handler(async ({ data, context }) => {
    const { text } = data;
    const env = context.cloudflare.env;

    const response = await env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
      messages: [
        {
          role: 'system',
          content: 'You are a sentiment analyzer. Classify quotes into exactly one of these categories: uplifting, contemplative, melancholy, inspiring. Respond with only the category name.',
        },
        {
          role: 'user',
          content: `Classify the sentiment of this quote: "${text}"`,
        }
      ],
      max_tokens: 10,
      temperature: 0.3,
    });

    const sentiment = response.response.trim().toLowerCase();

    // Validate sentiment
    const validSentiments = ['uplifting', 'contemplative', 'melancholy', 'inspiring'];
    const classifiedSentiment = validSentiments.includes(sentiment)
      ? sentiment
      : 'contemplative'; // Default fallback

    return {
      sentiment: classifiedSentiment as Sentiment,
      confidence: 0.85, // Placeholder - could be enhanced
      raw: response.response,
    };
  });
```

**Input Schema**:
```typescript
const AnalyzeQuoteSentimentInput = z.object({
  text: z.string().min(1).max(1000),
});
```

**Response Schema**:
```typescript
const AnalyzeQuoteSentimentResponse = z.object({
  sentiment: z.enum(['uplifting', 'contemplative', 'melancholy', 'inspiring']),
  confidence: z.number().min(0).max(1),
  raw: z.string(),
});
```

---

## Reflections

### 1. Add Reflection to Journey

**Purpose**: Save user's reflection text during a journey pause.

**Server Function**:
```typescript
export const addReflectionToJourney = createServerFn({ method: 'POST' })
  .inputValidator(z.object({
    journeyId: z.string(),
    text: z.string().min(1).max(2000),
    quoteIndex: z.number().min(0),
  }))
  .handler(async ({ data }) => {
    const { journeyId, text, quoteIndex } = data;

    const reflection = {
      quoteIndex,
      text,
      timestamp: Date.now(),
    };

    const updatedJourney = await ctx.runMutation(api.journeys.addReflection, {
      journeyId,
      reflection,
    });

    return {
      success: true,
      reflection,
      journey: updatedJourney,
    };
  });
```

**Input Schema**:
```typescript
const AddReflectionInput = z.object({
  journeyId: z.string(),
  text: z.string().min(1).max(2000),
  quoteIndex: z.number().min(0),
});
```

**Response Schema**:
```typescript
const AddReflectionResponse = z.object({
  success: z.boolean(),
  reflection: z.object({
    quoteIndex: z.number(),
    text: z.string(),
    timestamp: z.number(),
  }),
  journey: JourneySchema,
});
```

**Example Request**:
```typescript
const result = await addReflectionToJourney({
  data: {
    journeyId: 'journey_xyz',
    text: 'These quotes about self-knowledge really resonate with me. I feel like I\'m on a path of discovering who I truly am.',
    quoteIndex: 7,
  }
});
```

**Example Response**:
```json
{
  "success": true,
  "reflection": {
    "quoteIndex": 7,
    "text": "These quotes about self-knowledge really resonate with me...",
    "timestamp": 1699876543210
  },
  "journey": {
    "_id": "journey_xyz",
    "quoteIds": ["q1", "q2", "q3"],
    "reflections": [
      {
        "quoteIndex": 7,
        "text": "These quotes about self-knowledge really resonate with me...",
        "timestamp": 1699876543210
      }
    ],
    "currentIndex": 7
  }
}
```

---

### 2. Get Journey Reflections

**Purpose**: Retrieve all reflections for a journey.

**Server Function**:
```typescript
export const getJourneyReflections = createServerFn({ method: 'GET' })
  .inputValidator(z.object({
    journeyId: z.string(),
  }))
  .handler(async ({ data }) => {
    const journey = await ctx.runQuery(api.journeys.getById, {
      journeyId: data.journeyId,
    });

    if (!journey) {
      throw new Error('Journey not found');
    }

    return {
      reflections: journey.reflections,
      count: journey.reflections.length,
    };
  });
```

**Input Schema**:
```typescript
const GetJourneyReflectionsInput = z.object({
  journeyId: z.string(),
});
```

**Response Schema**:
```typescript
const GetJourneyReflectionsResponse = z.object({
  reflections: z.array(z.object({
    quoteIndex: z.number(),
    text: z.string(),
    timestamp: z.number(),
  })),
  count: z.number(),
});
```

---

## Insights

### 1. Generate Journey Insights

**Purpose**: Analyze user's journey and generate personalized insights using AI.

**Server Function**:
```typescript
export const generateJourneyInsights = createServerFn({ method: 'POST' })
  .inputValidator(z.object({
    journeyId: z.string(),
    includeReflections: z.boolean().default(true),
  }))
  .handler(async ({ data, context }) => {
    const { journeyId, includeReflections } = data;

    // Get journey data
    const journey = await ctx.runQuery(api.journeys.getById, { journeyId });

    if (!journey) {
      throw new Error('Journey not found');
    }

    // Get all quotes in the journey
    const quotes = await ctx.runQuery(api.quotes.getByIds, {
      quoteIds: journey.quoteIds,
    });

    // Build analysis prompt
    const quotesText = quotes.map((q, i) => `${i + 1}. "${q.text}" - ${q.author}`).join('\n');

    let prompt = `Analyze this journey of quotes and provide personalized insights about the user's emotional and philosophical state:\n\n${quotesText}`;

    if (includeReflections && journey.reflections.length > 0) {
      const reflectionsText = journey.reflections
        .map(r => `- "${r.text}"`)
        .join('\n');
      prompt += `\n\nUser's reflections:\n${reflectionsText}`;
    }

    prompt += '\n\nProvide a thoughtful, personalized insight (2-3 paragraphs) about:\n1. Common themes in their chosen quotes\n2. What this might reveal about their current emotional/philosophical state\n3. A gentle suggestion for continued exploration';

    // Call Cloudflare AI
    const env = context.cloudflare.env;
    const response = await env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
      messages: [
        {
          role: 'system',
          content: 'You are a wise, empathetic guide who helps people understand their inner journey through the quotes they choose. Speak warmly and personally.',
        },
        {
          role: 'user',
          content: prompt,
        }
      ],
      max_tokens: 500,
      temperature: 0.7,
    });

    const insight = {
      content: response.response,
      generatedAt: Date.now(),
      basedOnQuotes: journey.quoteIds,
    };

    // Save insight to journey
    const updatedJourney = await ctx.runMutation(api.journeys.addInsight, {
      journeyId,
      insight,
    });

    return {
      insight,
      journey: updatedJourney,
    };
  });
```

**Input Schema**:
```typescript
const GenerateJourneyInsightsInput = z.object({
  journeyId: z.string(),
  includeReflections: z.boolean().default(true),
});
```

**Response Schema**:
```typescript
const GenerateJourneyInsightsResponse = z.object({
  insight: z.object({
    content: z.string(),
    generatedAt: z.number(),
    basedOnQuotes: z.array(z.string()),
  }),
  journey: JourneySchema,
});
```

**Example Request**:
```typescript
const result = await generateJourneyInsights({
  data: {
    journeyId: 'journey_xyz',
    includeReflections: true,
  }
});
```

**Example Response**:
```json
{
  "insight": {
    "content": "Your journey through these quotes reveals a deep yearning for self-understanding and authenticity. The philosophers you've gravitated toward—Socrates, Marcus Aurelius, and Nietzsche—all emphasize the importance of examining one's own life and living according to one's true nature...\n\nWhat stands out is your reflection about being 'on a path of discovering who you truly am.' This suggests you're in a period of transformation...",
    "generatedAt": 1699876543210,
    "basedOnQuotes": ["q1", "q2", "q3", "q4", "q5"]
  },
  "journey": {
    "_id": "journey_xyz",
    "insights": [
      {
        "content": "Your journey through these quotes...",
        "generatedAt": 1699876543210,
        "basedOnQuotes": ["q1", "q2", "q3", "q4", "q5"]
      }
    ]
  }
}
```

---

### 2. Get Journey Insights

**Purpose**: Retrieve all insights for a journey.

**Server Function**:
```typescript
export const getJourneyInsights = createServerFn({ method: 'GET' })
  .inputValidator(z.object({
    journeyId: z.string(),
  }))
  .handler(async ({ data }) => {
    const journey = await ctx.runQuery(api.journeys.getById, {
      journeyId: data.journeyId,
    });

    if (!journey) {
      throw new Error('Journey not found');
    }

    return {
      insights: journey.insights,
      count: journey.insights.length,
    };
  });
```

**Input Schema**:
```typescript
const GetJourneyInsightsInput = z.object({
  journeyId: z.string(),
});
```

**Response Schema**:
```typescript
const GetJourneyInsightsResponse = z.object({
  insights: z.array(z.object({
    content: z.string(),
    generatedAt: z.number(),
    basedOnQuotes: z.array(z.string()),
  })),
  count: z.number(),
});
```

---

### 3. Share Insight

**Purpose**: Generate shareable insight with formatting.

**Server Function**:
```typescript
export const shareInsight = createServerFn({ method: 'POST' })
  .inputValidator(z.object({
    journeyId: z.string(),
    insightIndex: z.number().min(0),
    format: z.enum(['text', 'image', 'social']).default('text'),
  }))
  .handler(async ({ data }) => {
    const { journeyId, insightIndex, format } = data;

    const journey = await ctx.runQuery(api.journeys.getById, { journeyId });

    if (!journey || !journey.insights[insightIndex]) {
      throw new Error('Insight not found');
    }

    const insight = journey.insights[insightIndex];

    // Format for sharing
    let shareContent = '';
    switch (format) {
      case 'text':
        shareContent = `My QuoteJourney Insight:\n\n${insight.content}\n\n#QuoteJourney`;
        break;
      case 'social':
        // Truncate for social media
        const truncated = insight.content.substring(0, 250) + '...';
        shareContent = `${truncated}\n\nDiscover your own journey at wolf.topangasoft.workers.dev\n#QuoteJourney`;
        break;
      case 'image':
        // Return data needed to generate image
        shareContent = insight.content;
        break;
    }

    return {
      shareContent,
      format,
      shareUrl: `https://wolf.topangasoft.workers.dev/journey/${journeyId}/insights/${insightIndex}`,
    };
  });
```

**Input Schema**:
```typescript
const ShareInsightInput = z.object({
  journeyId: z.string(),
  insightIndex: z.number().min(0),
  format: z.enum(['text', 'image', 'social']).default('text'),
});
```

**Response Schema**:
```typescript
const ShareInsightResponse = z.object({
  shareContent: z.string(),
  format: z.enum(['text', 'image', 'social']),
  shareUrl: z.string().url(),
});
```

---

## Admin & Scraping

### 1. Scrape Quotes with Firecrawl

**Purpose**: Admin function to scrape quotes from web sources using Firecrawl.

**Server Function**:
```typescript
export const scrapeQuotesWithFirecrawl = createServerFn({ method: 'POST' })
  .inputValidator(z.object({
    urls: z.array(z.string().url()).min(1).max(10),
    categories: z.array(z.string()).min(1),
    adminKey: z.string(), // Simple admin authentication
  }))
  .handler(async ({ data, context }) => {
    const { urls, categories, adminKey } = data;

    // Verify admin access
    if (adminKey !== context.cloudflare.env.ADMIN_KEY) {
      throw new Error('Unauthorized: Invalid admin key');
    }

    const env = context.cloudflare.env;
    const scrapedQuotes: Quote[] = [];

    // Import Firecrawl
    const FirecrawlApp = (await import('@mendable/firecrawl-js')).default;
    const firecrawl = new FirecrawlApp({ apiKey: env.FIRECRAWL_API_KEY });

    for (const url of urls) {
      try {
        // Scrape the URL
        const result = await firecrawl.scrapeUrl(url, {
          formats: ['markdown'],
          onlyMainContent: true,
        });

        if (!result.success) {
          console.error(`Failed to scrape ${url}:`, result.error);
          continue;
        }

        // Parse quotes from markdown content
        const quotes = parseQuotesFromMarkdown(result.markdown);

        // Add metadata
        const quotesWithMetadata = quotes.map(q => ({
          ...q,
          source: url,
          categories,
          createdAt: Date.now(),
        }));

        scrapedQuotes.push(...quotesWithMetadata);

        // Rate limiting - wait between requests
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        console.error(`Error scraping ${url}:`, error);
      }
    }

    // Store quotes in Convex
    if (scrapedQuotes.length > 0) {
      await ctx.runMutation(api.quotes.createMany, {
        quotes: scrapedQuotes,
      });
    }

    return {
      success: true,
      scrapedCount: scrapedQuotes.length,
      urls: urls.length,
      quotes: scrapedQuotes,
    };
  });
```

**Input Schema**:
```typescript
const ScrapeQuotesInput = z.object({
  urls: z.array(z.string().url()).min(1).max(10),
  categories: z.array(z.string()).min(1),
  adminKey: z.string(),
});
```

**Response Schema**:
```typescript
const ScrapeQuotesResponse = z.object({
  success: z.boolean(),
  scrapedCount: z.number(),
  urls: z.number(),
  quotes: z.array(QuoteSchema),
});
```

**Example Request**:
```typescript
const result = await scrapeQuotesWithFirecrawl({
  data: {
    urls: [
      'https://www.goodreads.com/quotes/tag/philosophy',
      'https://www.brainyquote.com/topics/wisdom-quotes'
    ],
    categories: ['philosophy', 'wisdom'],
    adminKey: process.env.ADMIN_KEY,
  }
});
```

**Example Response**:
```json
{
  "success": true,
  "scrapedCount": 42,
  "urls": 2,
  "quotes": [
    {
      "_id": "scraped_1",
      "text": "The only true wisdom is in knowing you know nothing.",
      "author": "Socrates",
      "categories": ["philosophy", "wisdom"],
      "source": "https://www.goodreads.com/quotes/tag/philosophy",
      "qualityScore": 5,
      "createdAt": 1699876543210
    }
  ]
}
```

---

### 2. Batch Crawl Quote Sources

**Purpose**: Crawl multiple pages from a quote website.

**Server Function**:
```typescript
export const batchCrawlQuoteSources = createServerFn({ method: 'POST' })
  .inputValidator(z.object({
    baseUrl: z.string().url(),
    maxPages: z.number().min(1).max(100).default(10),
    categories: z.array(z.string()).min(1),
    adminKey: z.string(),
  }))
  .handler(async ({ data, context }) => {
    const { baseUrl, maxPages, categories, adminKey } = data;

    // Verify admin access
    if (adminKey !== context.cloudflare.env.ADMIN_KEY) {
      throw new Error('Unauthorized: Invalid admin key');
    }

    const env = context.cloudflare.env;
    const FirecrawlApp = (await import('@mendable/firecrawl-js')).default;
    const firecrawl = new FirecrawlApp({ apiKey: env.FIRECRAWL_API_KEY });

    // Use Firecrawl's crawl feature for multiple pages
    const crawlResult = await firecrawl.crawlUrl(baseUrl, {
      limit: maxPages,
      scrapeOptions: {
        formats: ['markdown'],
        onlyMainContent: true,
      },
    });

    if (!crawlResult.success) {
      throw new Error(`Crawl failed: ${crawlResult.error}`);
    }

    const allQuotes: Quote[] = [];

    // Process each crawled page
    for (const page of crawlResult.data) {
      if (page.markdown) {
        const quotes = parseQuotesFromMarkdown(page.markdown);
        const quotesWithMetadata = quotes.map(q => ({
          ...q,
          source: page.url || baseUrl,
          categories,
          createdAt: Date.now(),
        }));
        allQuotes.push(...quotesWithMetadata);
      }
    }

    // Store in Convex
    if (allQuotes.length > 0) {
      await ctx.runMutation(api.quotes.createMany, {
        quotes: allQuotes,
      });
    }

    return {
      success: true,
      pagesProcessed: crawlResult.data.length,
      quotesFound: allQuotes.length,
      quotes: allQuotes,
    };
  });
```

**Input Schema**:
```typescript
const BatchCrawlInput = z.object({
  baseUrl: z.string().url(),
  maxPages: z.number().min(1).max(100).default(10),
  categories: z.array(z.string()).min(1),
  adminKey: z.string(),
});
```

**Response Schema**:
```typescript
const BatchCrawlResponse = z.object({
  success: z.boolean(),
  pagesProcessed: z.number(),
  quotesFound: z.number(),
  quotes: z.array(QuoteSchema),
});
```

---

### 3. Create Quote Manually

**Purpose**: Admin function to manually add a quote.

**Server Function**:
```typescript
export const createQuoteManually = createServerFn({ method: 'POST' })
  .inputValidator(z.object({
    text: z.string().min(10).max(1000),
    author: z.string().min(2).max(200),
    categories: z.array(z.string()).min(1),
    tags: z.array(z.string()).default([]),
    sentiment: z.enum(['uplifting', 'contemplative', 'melancholy', 'inspiring']).optional(),
    source: z.string().url().or(z.literal('manual')),
    qualityScore: z.number().min(0).max(10).default(5),
    adminKey: z.string(),
  }))
  .handler(async ({ data, context }) => {
    const { adminKey, ...quoteData } = data;

    // Verify admin access
    if (adminKey !== context.cloudflare.env.ADMIN_KEY) {
      throw new Error('Unauthorized: Invalid admin key');
    }

    // Auto-detect sentiment if not provided
    let sentiment = quoteData.sentiment;
    if (!sentiment) {
      const sentimentResult = await analyzeQuoteSentiment({
        data: { text: quoteData.text }
      });
      sentiment = sentimentResult.sentiment;
    }

    // Generate embedding
    const embeddingResult = await generateTextEmbedding({
      data: { text: quoteData.text }
    });

    // Create quote
    const quote = await ctx.runMutation(api.quotes.create, {
      ...quoteData,
      sentiment,
      embedding: embeddingResult.embedding,
      createdAt: Date.now(),
    });

    return {
      success: true,
      quote,
    };
  });
```

**Input Schema**:
```typescript
const CreateQuoteManuallyInput = z.object({
  text: z.string().min(10).max(1000),
  author: z.string().min(2).max(200),
  categories: z.array(z.string()).min(1),
  tags: z.array(z.string()).default([]),
  sentiment: z.enum(['uplifting', 'contemplative', 'melancholy', 'inspiring']).optional(),
  source: z.string().url().or(z.literal('manual')),
  qualityScore: z.number().min(0).max(10).default(5),
  adminKey: z.string(),
});
```

**Response Schema**:
```typescript
const CreateQuoteManuallyResponse = z.object({
  success: z.boolean(),
  quote: QuoteSchema,
});
```

---

### 4. Update Quote Quality Score

**Purpose**: Admin function to adjust quality scores.

**Server Function**:
```typescript
export const updateQuoteQualityScore = createServerFn({ method: 'POST' })
  .inputValidator(z.object({
    quoteId: z.string(),
    qualityScore: z.number().min(0).max(10),
    adminKey: z.string(),
  }))
  .handler(async ({ data, context }) => {
    const { quoteId, qualityScore, adminKey } = data;

    // Verify admin access
    if (adminKey !== context.cloudflare.env.ADMIN_KEY) {
      throw new Error('Unauthorized: Invalid admin key');
    }

    const updatedQuote = await ctx.runMutation(api.quotes.updateQualityScore, {
      quoteId,
      qualityScore,
    });

    return {
      success: true,
      quote: updatedQuote,
    };
  });
```

**Input Schema**:
```typescript
const UpdateQuoteQualityScoreInput = z.object({
  quoteId: z.string(),
  qualityScore: z.number().min(0).max(10),
  adminKey: z.string(),
});
```

**Response Schema**:
```typescript
const UpdateQuoteQualityScoreResponse = z.object({
  success: z.boolean(),
  quote: QuoteSchema,
});
```

---

## Error Handling

### Error Types

All server functions implement consistent error handling:

```typescript
// Custom error class
export class APIError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public details?: any
  ) {
    super(message);
    this.name = 'APIError';
  }
}

// Common error codes
export const ErrorCodes = {
  // Client errors (4xx)
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  UNAUTHORIZED: 'UNAUTHORIZED',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  INVALID_INPUT: 'INVALID_INPUT',

  // Server errors (5xx)
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  AI_SERVICE_ERROR: 'AI_SERVICE_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
};
```

### Error Response Format

```typescript
{
  "error": "Quote not found",
  "code": "NOT_FOUND",
  "details": {
    "quoteId": "invalid_id_123"
  },
  "timestamp": 1699876543210
}
```

### Error Handler Middleware

```typescript
// Wrap all server functions with error handler
export function withErrorHandling<T>(
  handler: (args: any) => Promise<T>
) {
  return async (args: any): Promise<T> => {
    try {
      return await handler(args);
    } catch (error) {
      // Log to Sentry
      Sentry.captureException(error);

      // Format error response
      if (error instanceof APIError) {
        throw error;
      }

      // Handle Zod validation errors
      if (error instanceof z.ZodError) {
        throw new APIError(
          'Validation failed',
          ErrorCodes.VALIDATION_ERROR,
          400,
          error.errors
        );
      }

      // Handle Convex errors
      if (error.message.includes('Convex')) {
        throw new APIError(
          'Database operation failed',
          ErrorCodes.DATABASE_ERROR,
          500,
          { originalError: error.message }
        );
      }

      // Generic error
      throw new APIError(
        'An unexpected error occurred',
        ErrorCodes.INTERNAL_ERROR,
        500,
        { originalError: error.message }
      );
    }
  };
}
```

### Usage Example

```typescript
export const getQuoteById = createServerFn({ method: 'GET' })
  .inputValidator(GetQuoteByIdInput)
  .handler(withErrorHandling(async ({ data }) => {
    const quote = await ctx.runQuery(api.quotes.getById, {
      quoteId: data.quoteId,
    });

    if (!quote) {
      throw new APIError(
        'Quote not found',
        ErrorCodes.NOT_FOUND,
        404,
        { quoteId: data.quoteId }
      );
    }

    return quote;
  }));
```

---

## Rate Limiting

### Implementation Strategy

Use Cloudflare's rate limiting features:

```typescript
// Rate limiter configuration
const RATE_LIMITS = {
  // Per IP address
  perIP: {
    // Regular endpoints
    standard: {
      requests: 100,
      window: 60, // seconds
    },
    // AI endpoints (more expensive)
    ai: {
      requests: 10,
      window: 60,
    },
    // Admin endpoints
    admin: {
      requests: 20,
      window: 60,
    },
  },
  // Per user (if authenticated)
  perUser: {
    standard: {
      requests: 200,
      window: 60,
    },
    ai: {
      requests: 20,
      window: 60,
    },
  },
};

// Rate limiter middleware
export async function checkRateLimit(
  context: any,
  category: 'standard' | 'ai' | 'admin'
): Promise<void> {
  const env = context.cloudflare.env;
  const ip = context.request.headers.get('CF-Connecting-IP');

  const limit = RATE_LIMITS.perIP[category];
  const key = `rate_limit:${category}:${ip}`;

  // Use Cloudflare KV for rate limiting
  const current = await env.RATE_LIMIT_KV.get(key);
  const count = current ? parseInt(current) : 0;

  if (count >= limit.requests) {
    throw new APIError(
      'Rate limit exceeded',
      ErrorCodes.RATE_LIMIT_EXCEEDED,
      429,
      {
        limit: limit.requests,
        window: limit.window,
        resetAt: Date.now() + (limit.window * 1000),
      }
    );
  }

  // Increment counter
  await env.RATE_LIMIT_KV.put(
    key,
    (count + 1).toString(),
    { expirationTtl: limit.window }
  );
}
```

### Rate Limit Headers

All responses include rate limit headers:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1699876603
```

### Rate-Limited Endpoints

| Endpoint Category | Limit | Window |
|-------------------|-------|--------|
| Quote queries | 100 req/min | 60s |
| Journey operations | 100 req/min | 60s |
| AI generation | 10 req/min | 60s |
| AI insights | 10 req/min | 60s |
| Admin scraping | 20 req/min | 60s |
| Search | 50 req/min | 60s |

---

## Authentication

### Current State: Anonymous Sessions

For the hackathon MVP, we use anonymous sessions with optional user IDs:

```typescript
// Session ID stored in localStorage/cookies
const sessionId = crypto.randomUUID();

// Optional user ID (future authentication)
const userId = undefined; // or user's ID if authenticated
```

### Future: Auth Integration

When adding authentication (post-hackathon):

```typescript
// Auth schema
const AuthContextSchema = z.object({
  userId: z.string(),
  sessionId: z.string(),
  email: z.string().email().optional(),
  isAuthenticated: z.boolean(),
});

// Protected server function example
export const protectedFunction = createServerFn({ method: 'POST' })
  .inputValidator(SomeSchema)
  .handler(async ({ data, context }) => {
    // Check authentication
    const auth = await getAuthContext(context);

    if (!auth.isAuthenticated) {
      throw new APIError(
        'Authentication required',
        ErrorCodes.UNAUTHORIZED,
        401
      );
    }

    // Proceed with authenticated user
    // ...
  });
```

### Admin Authentication

Admin endpoints use a simple API key:

```typescript
// Environment variable
ADMIN_KEY=your_secure_admin_key_here

// Validation
if (adminKey !== context.cloudflare.env.ADMIN_KEY) {
  throw new APIError(
    'Unauthorized: Invalid admin key',
    ErrorCodes.UNAUTHORIZED,
    401
  );
}
```

**Security Notes**:
- Admin key should be rotated regularly
- Use HTTPS only
- Log all admin actions
- Consider IP whitelisting for admin endpoints

---

## Utility Functions

### Quote Parser (for Firecrawl)

```typescript
/**
 * Parse quotes from Markdown content scraped by Firecrawl
 */
export function parseQuotesFromMarkdown(markdown: string): Partial<Quote>[] {
  const quotes: Partial<Quote>[] = [];

  // Common quote formats:
  // "Quote text" - Author
  // "Quote text" — Author
  // > Quote text - Author

  const patterns = [
    /"([^"]+)"\s*[-—]\s*([^"\n]+)/g,
    />\s*([^-\n]+)\s*[-—]\s*([^"\n]+)/g,
  ];

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(markdown)) !== null) {
      const text = match[1].trim();
      const author = match[2].trim();

      // Validate quote
      if (text.length >= 10 && text.length <= 1000 && author.length >= 2) {
        quotes.push({
          text,
          author,
          tags: [],
        });
      }
    }
  }

  return quotes;
}
```

### AI Response Parser

```typescript
/**
 * Parse generated quotes from AI response
 */
export function parseGeneratedQuotes(aiResponse: string): Partial<Quote>[] {
  const quotes: Partial<Quote>[] = [];

  // Expected format: "Quote text" - Author Name
  const lines = aiResponse.split('\n').filter(line => line.trim());

  for (const line of lines) {
    const match = line.match(/"([^"]+)"\s*[-—]\s*([^"\n]+)/);
    if (match) {
      quotes.push({
        text: match[1].trim(),
        author: match[2].trim(),
        tags: [],
      });
    }
  }

  return quotes;
}
```

### Similarity Search Helper

```typescript
/**
 * Calculate cosine similarity between two embeddings
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Vectors must have same length');
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Find most similar quotes using embeddings
 */
export async function findSimilarQuotes(
  targetEmbedding: number[],
  allQuotes: Quote[],
  limit: number = 5
): Promise<Quote[]> {
  const similarities = allQuotes
    .filter(q => q.embedding && q.embedding.length > 0)
    .map(quote => ({
      quote,
      similarity: cosineSimilarity(targetEmbedding, quote.embedding!),
    }))
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit);

  return similarities.map(s => s.quote);
}
```

---

## Testing Examples

### Unit Test Example

```typescript
import { describe, it, expect, vi } from 'vitest';
import { getRandomQuotes } from './quote-functions';

describe('getRandomQuotes', () => {
  it('should return requested number of quotes', async () => {
    const result = await getRandomQuotes({
      data: { count: 10 }
    });

    expect(result.quotes).toHaveLength(10);
    expect(result.total).toBe(10);
  });

  it('should filter by categories', async () => {
    const result = await getRandomQuotes({
      data: {
        count: 5,
        categories: ['philosophy', 'wisdom']
      }
    });

    result.quotes.forEach(quote => {
      expect(
        quote.categories.some(cat =>
          ['philosophy', 'wisdom'].includes(cat)
        )
      ).toBe(true);
    });
  });

  it('should exclude specified IDs', async () => {
    const excludeIds = ['quote_1', 'quote_2'];

    const result = await getRandomQuotes({
      data: {
        count: 10,
        excludeIds
      }
    });

    result.quotes.forEach(quote => {
      expect(excludeIds).not.toContain(quote._id);
    });
  });
});
```

### Integration Test Example

```typescript
describe('Journey Flow Integration', () => {
  it('should create journey and add quotes', async () => {
    // Create journey
    const journey = await createJourneySession({
      data: {
        userId: 'test_user',
        initialQuoteId: 'quote_1'
      }
    });

    expect(journey.journeyId).toBeDefined();
    expect(journey.journey.quoteIds).toHaveLength(1);

    // Add quotes
    for (let i = 2; i <= 5; i++) {
      await addQuoteToJourney({
        data: {
          journeyId: journey.journeyId,
          quoteId: `quote_${i}`
        }
      });
    }

    // Verify journey
    const updatedJourney = await getJourneyById({
      data: {
        journeyId: journey.journeyId,
        includeQuotes: true
      }
    });

    expect(updatedJourney.journey.quoteIds).toHaveLength(5);
    expect(updatedJourney.quotes).toHaveLength(5);
    expect(updatedJourney.stats.totalQuotes).toBe(5);
  });
});
```

---

## Performance Considerations

### Caching Strategy

```typescript
// Cache frequently accessed quotes
const CACHE_TTL = {
  randomQuotes: 60, // 1 minute
  relatedQuotes: 300, // 5 minutes
  journeyData: 30, // 30 seconds
  insights: 3600, // 1 hour
};

// Use Cloudflare KV for caching
export async function getCachedOrFetch<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number,
  env: any
): Promise<T> {
  // Try cache first
  const cached = await env.CACHE_KV.get(key, { type: 'json' });

  if (cached) {
    return cached as T;
  }

  // Fetch and cache
  const data = await fetcher();
  await env.CACHE_KV.put(key, JSON.stringify(data), {
    expirationTtl: ttl
  });

  return data;
}
```

### Batch Operations

```typescript
// Batch quote fetches
export async function getQuotesByIdsBatch(
  quoteIds: string[]
): Promise<Quote[]> {
  // Fetch all quotes in single query instead of N queries
  return await ctx.runQuery(api.quotes.getByIds, { quoteIds });
}

// Batch embedding generation
export async function generateEmbeddingsBatch(
  texts: string[]
): Promise<number[][]> {
  const env = context.cloudflare.env;

  // Cloudflare AI supports batch embeddings
  const response = await env.AI.run('@cf/baai/bge-base-en-v1.5', {
    text: texts,
  });

  return response.data;
}
```

---

## Monitoring & Observability

### Sentry Integration

```typescript
import * as Sentry from '@sentry/cloudflare';

// Initialize Sentry
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});

// Trace server functions
export const tracedServerFn = <T>(
  name: string,
  handler: (args: any) => Promise<T>
) => {
  return async (args: any): Promise<T> => {
    const transaction = Sentry.startTransaction({
      name,
      op: 'server.function',
    });

    try {
      const result = await handler(args);
      transaction.setStatus('ok');
      return result;
    } catch (error) {
      transaction.setStatus('internal_error');
      Sentry.captureException(error);
      throw error;
    } finally {
      transaction.finish();
    }
  };
};
```

### Performance Metrics

```typescript
// Track API performance
export const performanceMetrics = {
  async trackDuration(
    operation: string,
    fn: () => Promise<any>
  ): Promise<any> {
    const start = Date.now();

    try {
      const result = await fn();
      const duration = Date.now() - start;

      // Log to analytics
      console.log(`[Perf] ${operation}: ${duration}ms`);

      // Send to monitoring service
      await logMetric({
        operation,
        duration,
        success: true,
        timestamp: Date.now(),
      });

      return result;
    } catch (error) {
      const duration = Date.now() - start;

      await logMetric({
        operation,
        duration,
        success: false,
        error: error.message,
        timestamp: Date.now(),
      });

      throw error;
    }
  },
};
```

---

## Version History

- **v1.0.0** (2025-11-12) - Initial API specification
  - Core quote management
  - Journey tracking
  - AI integration (Cloudflare AI)
  - Firecrawl scraping
  - Insights generation
  - Error handling & rate limiting

---

## Additional Resources

- [TanStack Start Documentation](https://tanstack.com/start)
- [Convex Documentation](https://docs.convex.dev)
- [Cloudflare AI Documentation](https://developers.cloudflare.com/workers-ai)
- [Firecrawl Documentation](https://docs.firecrawl.dev)
- [Zod Documentation](https://zod.dev)

---

**Maintained by**: QuoteJourney Team
**Contact**: [Project Repository](https://github.com/your-repo/wolf)
**Production URL**: https://wolf.topangasoft.workers.dev
