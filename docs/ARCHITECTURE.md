# QuoteJourney - Technical Architecture

**Version:** 1.0
**Last Updated:** 2025-11-12
**Status:** Design Phase

## Table of Contents

1. [System Overview](#system-overview)
2. [Architecture Diagram](#architecture-diagram)
3. [TanStack Start Architecture](#tanstack-start-architecture)
4. [Server Function Design](#server-function-design)
5. [Route Structure & Data Flow](#route-structure--data-flow)
6. [Client/Server Execution Boundaries](#clientserver-execution-boundaries)
7. [State Management Strategy](#state-management-strategy)
8. [Caching & Performance Optimization](#caching--performance-optimization)
9. [Error Handling & Resilience](#error-handling--resilience)
10. [Data Layer (Convex)](#data-layer-convex)
11. [AI Integration (Cloudflare)](#ai-integration-cloudflare)
12. [Deployment Architecture](#deployment-architecture)

---

## System Overview

QuoteJourney is a full-stack, real-time quote exploration application built on modern web technologies. The architecture is designed for:

- **Progressive Enhancement**: Works without JavaScript, enhanced with it
- **Edge-First Execution**: SSR on Cloudflare Workers for minimal latency
- **Real-time Sync**: Convex provides live data updates across devices
- **AI-Powered Personalization**: Cloudflare AI analyzes user patterns
- **Exceptional Performance**: Route prefetching, edge caching, optimistic updates

### Core Architectural Principles

1. **Server-First Data Fetching**: All data operations happen on the server through type-safe server functions
2. **Progressive Enhancement**: Base experience works without JS, enhanced experience adds animations/sound
3. **Real-time by Default**: Convex subscriptions keep UI synchronized
4. **Type Safety**: End-to-end type safety with TypeScript and Zod
5. **Edge Optimization**: Deploy to Cloudflare Workers for global low latency

---

## Architecture Diagram

### High-Level System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                          CLIENT LAYER                                │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │  TanStack Router (Client-side routing)                         │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐      │ │
│  │  │  Landing │  │ Journey  │  │ History  │  │ Insights │      │ │
│  │  │   Page   │  │   Mode   │  │   View   │  │   View   │      │ │
│  │  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘      │ │
│  └───────┼─────────────┼─────────────┼─────────────┼─────────────┘ │
│          │             │             │             │                │
│  ┌───────▼─────────────▼─────────────▼─────────────▼─────────────┐ │
│  │              React Component Tree                              │ │
│  │  • Server-rendered HTML (SSR)                                  │ │
│  │  • Client-hydrated interactions                                │ │
│  │  • Real-time Convex subscriptions                              │ │
│  └───────┬─────────────────────────────────────────────────────────┘ │
└──────────┼───────────────────────────────────────────────────────────┘
           │
           │ HTTPS (Server Functions + Convex Client)
           │
┌──────────▼───────────────────────────────────────────────────────────┐
│                    CLOUDFLARE WORKERS EDGE                            │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │              TanStack Start SSR Runtime                        │  │
│  │  ┌──────────────────────────────────────────────────────────┐ │  │
│  │  │  Server Functions (Type-safe API Layer)                   │ │  │
│  │  │  • generateRelatedQuotes()                                │ │  │
│  │  │  • analyzeJourney()                                       │ │  │
│  │  │  • scrapeQuotes()                                         │ │  │
│  │  │  • getInitialQuotes()                                     │ │  │
│  │  └─────┬─────────────────────────┬────────────────────┬──────┘ │  │
│  └────────┼─────────────────────────┼────────────────────┼────────┘  │
│           │                         │                    │            │
│     ┌─────▼──────┐          ┌──────▼───────┐     ┌─────▼──────┐    │
│     │ Cloudflare │          │   Firecrawl  │     │   Sentry   │    │
│     │     AI     │          │     API      │     │   Errors   │    │
│     │  Workers   │          └──────────────┘     └────────────┘    │
│     └────────────┘                                                   │
└──────────────────────────────────────────────────────────────────────┘
           │
           │ Convex Client SDK
           │
┌──────────▼───────────────────────────────────────────────────────────┐
│                        CONVEX BACKEND                                 │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │  Real-time Database & Backend Logic                            │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │  │
│  │  │    Quotes    │  │   Journeys   │  │    Users     │        │  │
│  │  │    Table     │  │    Table     │  │   Profiles   │        │  │
│  │  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘        │  │
│  └─────────┼──────────────────┼──────────────────┼────────────────┘  │
│  ┌─────────▼──────────────────▼──────────────────▼────────────────┐  │
│  │  Convex Functions (Queries, Mutations, Actions)                │  │
│  │  • getRandomQuotes                                              │  │
│  │  • saveJourneyStep (mutation)                                   │  │
│  │  • addReflection (mutation)                                     │  │
│  │  • subscribeToJourney (live query)                              │  │
│  └─────────────────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────────────────┘
```

### Request Flow Diagram

```
User Action (Click Quote)
    │
    ├─→ [1] React Event Handler
    │       │
    │       ├─→ [2] Optimistic UI Update (instant feedback)
    │       │       • Update local state
    │       │       • Play sound effect
    │       │       • Trigger animation
    │       │
    │       └─→ [3] Call Server Function
    │               • generateRelatedQuotes.call(context)
    │
    ├─→ [4] TanStack Start Routes Request to Edge
    │       │
    │       └─→ [5] Cloudflare Worker Executes Server Function
    │               │
    │               ├─→ [6] Validate Input (Zod Schema)
    │               │
    │               ├─→ [7] Call Cloudflare AI
    │               │   • Generate related quotes
    │               │   • Use embeddings for similarity
    │               │
    │               ├─→ [8] Store in Convex
    │               │   • saveJourneyStep mutation
    │               │   • Real-time sync triggered
    │               │
    │               └─→ [9] Return Response
    │
    └─→ [10] Convex Real-time Subscription Updates UI
            • Push new quotes to client
            • Update journey history
            • Sync across all devices
```

---

## TanStack Start Architecture

### Core Patterns We're Using

TanStack Start provides a modern full-stack framework with powerful features. We leverage:

1. **File-based Routing**: Routes map to files in `app/routes/`
2. **Server Functions**: Type-safe RPC between client and server
3. **Route Loaders**: Pre-fetch data for instant navigation
4. **Progressive Enhancement**: Works without JS, enhanced with it
5. **Streaming SSR**: Stream HTML as it's generated
6. **Client-Only Components**: Browser-only features (audio, canvas)

### File Structure

```
app/
├── routes/
│   ├── __root.tsx              # Root layout, providers
│   ├── index.tsx               # Landing page (quote smorgasbord)
│   ├── journey/
│   │   ├── index.tsx           # Main journey experience
│   │   ├── history.tsx         # Journey timeline view
│   │   └── insights.tsx        # Personal insights page
│   └── admin/
│       └── quotes.tsx          # Admin quote management
├── components/
│   ├── QuoteCard.tsx           # Reusable quote display
│   ├── JourneyFlow.tsx         # Main journey interaction
│   ├── AudioSystem.client.tsx  # Client-only audio
│   └── ReflectionPrompt.tsx    # Reflection moment UI
├── server/
│   ├── functions/
│   │   ├── quotes.ts           # Quote-related server functions
│   │   ├── journey.ts          # Journey server functions
│   │   ├── ai.ts               # AI integration functions
│   │   └── scraper.ts          # Firecrawl functions
│   └── lib/
│       ├── cloudflare-ai.ts    # Cloudflare AI client
│       ├── firecrawl.ts        # Firecrawl client
│       └── convex.ts           # Convex client setup
├── convex/
│   ├── schema.ts               # Convex table schemas
│   ├── quotes.ts               # Quote queries/mutations
│   ├── journeys.ts             # Journey queries/mutations
│   └── users.ts                # User profile functions
└── lib/
    ├── hooks/
    │   ├── useJourney.ts       # Journey state hook
    │   ├── useAudio.ts         # Audio system hook
    │   └── useConvex.ts        # Convex subscription hook
    └── types/
        ├── quote.ts            # Quote types
        └── journey.ts          # Journey types
```

### Progressive Enhancement Strategy

```tsx
// Example: Journey page works without JS

// 1. Server renders initial state
export const Route = createFileRoute('/journey')({
  loader: async ({ context }) => {
    // This runs on the server
    const quotes = await getInitialQuotes()
    return { quotes }
  },
  component: JourneyPage
})

function JourneyPage() {
  const { quotes } = Route.useLoaderData()

  // 2. Without JS: quotes display as static list
  // 3. With JS: Enhanced with animations, real-time updates
  return (
    <div>
      {/* Static content works without JS */}
      <h1>Your Quote Journey</h1>

      {/* Enhanced with JS */}
      <ClientOnly fallback={<StaticQuoteList quotes={quotes} />}>
        <AnimatedJourney quotes={quotes} />
      </ClientOnly>
    </div>
  )
}
```

### Route Loading Strategy

We use route loaders to prefetch data for instant navigation:

```tsx
// Journey route with prefetching
export const Route = createFileRoute('/journey')({
  loader: async ({ context }) => {
    // Parallel data fetching
    const [initialQuotes, userProfile, recentJourneys] = await Promise.all([
      // Get starter quotes
      context.convex.query(api.quotes.getRandomQuotes, { count: 5 }),

      // Get user preferences (if authenticated)
      context.userId
        ? context.convex.query(api.users.getProfile, { userId: context.userId })
        : null,

      // Get recent journeys for context
      context.sessionId
        ? context.convex.query(api.journeys.getRecent, { sessionId: context.sessionId })
        : []
    ])

    return {
      initialQuotes,
      userProfile,
      recentJourneys
    }
  },

  // Prefetch related routes
  async beforeLoad({ context }) {
    // Prefetch journey history
    context.router.preloadRoute({ to: '/journey/history' })
  }
})
```

---

## Server Function Design

### Architecture Overview

Server functions provide type-safe RPC between client and server. All run on Cloudflare Workers at the edge.

```
┌─────────────────────────────────────────────────────────────┐
│                    Server Function Layer                     │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Input Validation (Zod)                                │ │
│  │  • Parse and validate request                          │ │
│  │  • Type-safe input                                     │ │
│  └────────────────┬───────────────────────────────────────┘ │
│                   │                                          │
│  ┌────────────────▼───────────────────────────────────────┐ │
│  │  Business Logic                                        │ │
│  │  • Orchestrate external services                      │ │
│  │  • Transform data                                      │ │
│  │  • Error handling                                      │ │
│  └────────────────┬───────────────────────────────────────┘ │
│                   │                                          │
│  ┌────────────────▼───────────────────────────────────────┐ │
│  │  External Integrations                                 │ │
│  │  • Cloudflare AI (quote generation)                   │ │
│  │  • Convex (data persistence)                          │ │
│  │  • Firecrawl (scraping)                               │ │
│  │  • Sentry (error tracking)                            │ │
│  └────────────────┬───────────────────────────────────────┘ │
│                   │                                          │
│  ┌────────────────▼───────────────────────────────────────┐ │
│  │  Response Formatting                                   │ │
│  │  • Serialize response                                  │ │
│  │  • Return type-safe data                              │ │
│  └────────────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────────┘
```

### Server Function Organization

```typescript
// app/server/functions/quotes.ts

import { createServerFn } from '@tanstack/start'
import { z } from 'zod'
import { ConvexClient } from '../lib/convex'
import { CloudflareAI } from '../lib/cloudflare-ai'

// ============================================
// 1. GENERATE RELATED QUOTES
// ============================================

const GenerateRelatedQuotesSchema = z.object({
  currentQuoteId: z.string(),
  journeyContext: z.array(z.string()).optional(),
  userPreferences: z.object({
    categories: z.array(z.string()).optional(),
    sentiment: z.enum(['uplifting', 'contemplative', 'melancholy', 'inspiring']).optional()
  }).optional(),
  count: z.number().min(1).max(10).default(5)
})

export const generateRelatedQuotes = createServerFn({ method: 'POST' })
  .validator((data: unknown) => GenerateRelatedQuotesSchema.parse(data))
  .handler(async ({ data, context }) => {
    try {
      // 1. Get current quote from Convex
      const currentQuote = await context.convex.query(
        api.quotes.getById,
        { id: data.currentQuoteId }
      )

      if (!currentQuote) {
        throw new Error('Quote not found')
      }

      // 2. Generate related quotes using Cloudflare AI
      const ai = new CloudflareAI(context.env)
      const relatedQuotes = await ai.generateRelatedQuotes({
        baseQuote: currentQuote,
        context: data.journeyContext,
        preferences: data.userPreferences,
        count: data.count
      })

      // 3. Store generated quotes in Convex
      const storedQuotes = await Promise.all(
        relatedQuotes.map(quote =>
          context.convex.mutation(api.quotes.create, quote)
        )
      )

      // 4. Return quote IDs for client
      return {
        success: true,
        quotes: storedQuotes
      }

    } catch (error) {
      // 5. Error handling with Sentry
      context.sentry.captureException(error)

      // 6. Graceful fallback: get random similar quotes from DB
      const fallbackQuotes = await context.convex.query(
        api.quotes.getSimilar,
        {
          quoteId: data.currentQuoteId,
          count: data.count
        }
      )

      return {
        success: true,
        quotes: fallbackQuotes,
        fallback: true
      }
    }
  })

// ============================================
// 2. ANALYZE JOURNEY
// ============================================

const AnalyzeJourneySchema = z.object({
  journeyId: z.string(),
  includeReflections: z.boolean().default(true)
})

export const analyzeJourney = createServerFn({ method: 'POST' })
  .validator((data: unknown) => AnalyzeJourneySchema.parse(data))
  .handler(async ({ data, context }) => {
    // 1. Get journey data from Convex
    const journey = await context.convex.query(
      api.journeys.getById,
      { id: data.journeyId }
    )

    if (!journey) {
      throw new Error('Journey not found')
    }

    // 2. Get all quotes in journey
    const quotes = await context.convex.query(
      api.quotes.getByIds,
      { ids: journey.quoteIds }
    )

    // 3. Analyze with Cloudflare AI
    const ai = new CloudflareAI(context.env)
    const insight = await ai.analyzeJourneyPattern({
      quotes: quotes.map(q => q.text),
      reflections: data.includeReflections ? journey.reflections : [],
      journeyDepth: journey.quoteIds.length
    })

    // 4. Store insight in Convex
    await context.convex.mutation(api.journeys.addInsight, {
      journeyId: data.journeyId,
      insight: {
        content: insight,
        generatedAt: Date.now(),
        basedOnQuotes: journey.quoteIds
      }
    })

    return {
      success: true,
      insight
    }
  })

// ============================================
// 3. SCRAPE QUOTES (Admin)
// ============================================

const ScrapeQuotesSchema = z.object({
  urls: z.array(z.string().url()),
  categories: z.array(z.string()),
  batchSize: z.number().default(10)
})

export const scrapeQuotes = createServerFn({ method: 'POST' })
  .validator((data: unknown) => ScrapeQuotesSchema.parse(data))
  .handler(async ({ data, context }) => {
    // 1. Check admin permissions
    if (!context.user?.isAdmin) {
      throw new Error('Unauthorized')
    }

    const firecrawl = new FirecrawlClient(context.env.FIRECRAWL_API_KEY)
    const results = []

    // 2. Scrape URLs in batches
    for (const url of data.urls) {
      try {
        const scraped = await firecrawl.scrapeUrl(url, {
          formats: ['markdown'],
          onlyMainContent: true
        })

        // 3. Parse quotes from content
        const quotes = parseQuotesFromMarkdown(scraped.markdown)

        // 4. Store in Convex with categories
        const stored = await context.convex.mutation(
          api.quotes.createBatch,
          {
            quotes: quotes.map(q => ({
              ...q,
              categories: data.categories,
              source: url
            }))
          }
        )

        results.push({
          url,
          quotesFound: quotes.length,
          stored: stored.length
        })

      } catch (error) {
        context.sentry.captureException(error, {
          tags: { url }
        })
        results.push({
          url,
          error: error.message
        })
      }
    }

    return {
      success: true,
      results
    }
  })
```

### Server Function Best Practices

1. **Always Validate Input**: Use Zod schemas for type safety
2. **Error Handling**: Try-catch with Sentry reporting
3. **Graceful Fallbacks**: Never fail completely, provide fallback data
4. **Parallel Operations**: Use Promise.all for independent operations
5. **Rate Limiting**: Implement rate limiting for AI/external services
6. **Caching**: Cache expensive operations (AI responses)

### Context Object

The context object provides access to platform services:

```typescript
interface ServerFunctionContext {
  // Convex client for database operations
  convex: ConvexClient

  // Environment variables (secrets)
  env: {
    CLOUDFLARE_ACCOUNT_ID: string
    CLOUDFLARE_AI_TOKEN: string
    FIRECRAWL_API_KEY: string
    SENTRY_DSN: string
    CONVEX_URL: string
  }

  // User session (if authenticated)
  user?: {
    id: string
    isAdmin: boolean
  }

  // Session ID (for anonymous users)
  sessionId: string

  // Sentry client for error tracking
  sentry: SentryClient

  // Request metadata
  request: {
    headers: Headers
    ip: string
    userAgent: string
  }
}
```

---

## Route Structure & Data Flow

### Route Hierarchy

```
/ (root)
│
├─ index (Landing Page)
│  └─ Loader: getRandomQuotes(20)
│     • Server-renders quote smorgasbord
│     • Prefetches /journey route
│
├─ journey (Journey Experience)
│  ├─ Loader: getInitialJourneyData()
│  │  • Get starting quotes
│  │  • Load user profile
│  │  • Resume previous journey
│  │
│  ├─ /history (Journey Timeline)
│  │  └─ Loader: getJourneyHistory()
│  │
│  └─ /insights (Personal Insights)
│     └─ Loader: getAllInsights()
│
└─ admin
   └─ quotes (Admin Panel)
      └─ Loader: getAllQuotesForAdmin()
         • Protected route (admin only)
```

### Data Flow: Landing → Journey

```
┌──────────────────────────────────────────────────────────────┐
│  LANDING PAGE (/index)                                        │
│                                                                │
│  [Server Render]                                              │
│  1. Loader fetches 20 random quotes from Convex              │
│  2. HTML rendered with quote grid                            │
│  3. Prefetch /journey route in background                    │
│                                                                │
│  [Client Hydration]                                           │
│  4. React hydrates component                                 │
│  5. Animations start (staggered entrance)                    │
│  6. Audio system initializes (client-only)                   │
│                                                                │
│  [User Click]                                                 │
│  7. User clicks quote → navigate to /journey?start={quoteId} │
└──────────────────────────────────────────────────────────────┘
        │
        │ Client-side navigation (prefetched)
        ▼
┌──────────────────────────────────────────────────────────────┐
│  JOURNEY PAGE (/journey)                                      │
│                                                                │
│  [Instant Navigation - Already Prefetched]                    │
│  1. Loader already ran in background                         │
│  2. Data ready instantly                                     │
│                                                                │
│  [Server Render/Client Render]                               │
│  3. Display selected quote as "current"                      │
│  4. Call generateRelatedQuotes() server function             │
│  5. Show 5 related options below                             │
│                                                                │
│  [Real-time Updates]                                          │
│  6. Subscribe to journey in Convex                           │
│  7. Journey updates sync across devices                      │
│                                                                │
│  [User Interaction Loop]                                      │
│  8. User clicks option → becomes new current                 │
│  9. Save to journey (Convex mutation)                        │
│  10. Generate new options                                     │
│  11. Repeat...                                                │
│                                                                │
│  [Reflection Trigger]                                         │
│  12. After 7-10 quotes → show reflection prompt              │
│  13. Save reflection to Convex                                │
│                                                                │
│  [Insight Generation]                                         │
│  14. After 2-3 reflections → analyze with AI                 │
│  15. Display personalized insight                             │
└──────────────────────────────────────────────────────────────┘
```

### Component Data Flow

```tsx
// Journey page component hierarchy

<JourneyPage>                          // Route component
  │
  ├─ <JourneyProvider>                 // Context: journey state
  │   │
  │   ├─ <CurrentQuote>                // Display active quote
  │   │   │
  │   │   └─ <QuoteCard>               // Reusable quote display
  │   │       ├─ Text content
  │   │       ├─ Author
  │   │       └─ Animations
  │   │
  │   ├─ <RelatedOptions>              // 5 related quotes
  │   │   │
  │   │   └─ <QuoteCard>[] × 5         // Clickable options
  │   │       └─ onClick → selectQuote()
  │   │
  │   ├─ <ProgressIndicator>           // Journey depth
  │   │   ├─ Counter: "15 quotes"
  │   │   └─ Breadcrumb trail
  │   │
  │   └─ <ReflectionPrompt>            // Shows every 7-10 quotes
  │       ├─ Prompt text
  │       ├─ Text area
  │       └─ onSubmit → saveReflection()
  │
  ├─ <AudioSystem>                     // Client-only
  │   └─ Sound effects on interactions
  │
  └─ <ConvexProvider>                  // Real-time subscriptions
      └─ useQuery(api.journeys.subscribe)
```

### State Flow in Journey

```typescript
// Journey state machine

type JourneyState = {
  // Current state
  currentQuote: Quote
  relatedOptions: Quote[]

  // History
  journeyId: string
  quoteHistory: Quote[]

  // User input
  reflections: Reflection[]
  insights: Insight[]

  // UI state
  isGenerating: boolean
  showReflectionPrompt: boolean
  showInsight: boolean
}

// State transitions
const transitions = {
  // User selects a quote
  SELECT_QUOTE: (state, quote) => ({
    ...state,
    currentQuote: quote,
    quoteHistory: [...state.quoteHistory, quote],
    isGenerating: true,
    // Trigger: generate new options
  }),

  // Related quotes generated
  OPTIONS_GENERATED: (state, options) => ({
    ...state,
    relatedOptions: options,
    isGenerating: false,
    // Check if should show reflection
    showReflectionPrompt: state.quoteHistory.length % 7 === 0
  }),

  // User submits reflection
  SUBMIT_REFLECTION: (state, reflection) => ({
    ...state,
    reflections: [...state.reflections, reflection],
    showReflectionPrompt: false,
    // Check if should generate insight
    // (after 2-3 reflections)
  }),

  // AI insight generated
  INSIGHT_GENERATED: (state, insight) => ({
    ...state,
    insights: [...state.insights, insight],
    showInsight: true
  })
}
```

---

## Client/Server Execution Boundaries

### Execution Model

TanStack Start uses a hybrid execution model:

```
┌───────────────────────────────────────────────────────────────┐
│                     EXECUTION TIMELINE                         │
├───────────────────────────────────────────────────────────────┤
│                                                                │
│  [1] SERVER (Cloudflare Worker)                               │
│      • Run route loader                                       │
│      • Fetch data from Convex                                 │
│      • Render React to HTML                                   │
│      • Send HTML to browser                                   │
│      ▼                                                         │
│                                                                │
│  [2] BROWSER (Initial Load)                                   │
│      • Receive HTML                                           │
│      • Display static content                                 │
│      • Download JavaScript                                    │
│      ▼                                                         │
│                                                                │
│  [3] BROWSER (Hydration)                                      │
│      • React hydrates HTML                                    │
│      • Attach event listeners                                 │
│      • Initialize client-only components                      │
│      • Start Convex subscriptions                             │
│      ▼                                                         │
│                                                                │
│  [4] BROWSER (Interactive)                                    │
│      • User interactions                                      │
│      • Call server functions (RPC)                            │
│      • Real-time updates from Convex                          │
│      • Client-side animations/sounds                          │
│      ▼                                                         │
│                                                                │
│  [5] SERVER (Server Functions)                                │
│      • Validate input                                         │
│      • Call AI/external services                              │
│      • Update Convex                                          │
│      • Return response                                        │
│                                                                │
└───────────────────────────────────────────────────────────────┘
```

### What Runs Where

#### Server-Only Code

```typescript
// app/server/functions/ai.ts
// ✅ Runs ONLY on server (Cloudflare Worker)

import { CloudflareAI } from '@cloudflare/ai'

export const generateQuote = createServerFn({ method: 'POST' })
  .handler(async ({ context }) => {
    // ✅ Access to secrets
    const ai = new CloudflareAI({
      accountId: context.env.CLOUDFLARE_ACCOUNT_ID,
      apiToken: context.env.CLOUDFLARE_AI_TOKEN
    })

    // ✅ Call AI API
    const response = await ai.run(
      '@cf/meta/llama-3.1-8b-instruct',
      { prompt: '...' }
    )

    // ✅ Store in Convex
    await context.convex.mutation(api.quotes.create, response)

    return response
  })

// ❌ NEVER put secrets in client code
// ❌ NEVER call external APIs directly from client
```

#### Client-Only Code

```typescript
// app/components/AudioSystem.client.tsx
// ✅ Runs ONLY in browser

'use client'

import { Howl } from 'howler'
import { useEffect } from 'react'

export function AudioSystem() {
  useEffect(() => {
    // ✅ Browser APIs available
    const sound = new Howl({
      src: ['/sounds/select.mp3']
    })

    // ✅ Access to window, document
    document.addEventListener('click', () => {
      sound.play()
    })

    return () => {
      sound.unload()
    }
  }, [])

  return null
}

// Usage in SSR-safe way:
<ClientOnly fallback={null}>
  <AudioSystem />
</ClientOnly>
```

#### Shared Code (Isomorphic)

```typescript
// app/components/QuoteCard.tsx
// ✅ Runs on BOTH server and client

export function QuoteCard({ quote }: { quote: Quote }) {
  // ✅ Safe: React rendering works everywhere
  return (
    <div className="quote-card">
      <p>{quote.text}</p>
      <span>{quote.author}</span>
    </div>
  )
}

// Server: Renders to HTML
// Client: Hydrates and makes interactive
```

### Boundary Best Practices

#### 1. Progressive Enhancement Pattern

```typescript
// Base component works on server
function QuoteCard({ quote }: { quote: Quote }) {
  return (
    <div className="quote-card">
      {/* ✅ Static content */}
      <p>{quote.text}</p>

      {/* ✅ Enhanced with JS */}
      <ClientOnly fallback={<StaticInteractions />}>
        <AnimatedInteractions quote={quote} />
      </ClientOnly>
    </div>
  )
}
```

#### 2. Server Function Calls

```typescript
// Client component
function JourneyFlow() {
  const selectQuote = async (quoteId: string) => {
    // ✅ Call server function from client
    const result = await generateRelatedQuotes.call({
      currentQuoteId: quoteId
    })

    // Update UI with result
    setRelatedOptions(result.quotes)
  }

  return (
    <button onClick={() => selectQuote(quote.id)}>
      Select Quote
    </button>
  )
}
```

#### 3. Environment Variables

```typescript
// ✅ Server-side (safe)
export const serverFunction = createServerFn()
  .handler(({ context }) => {
    const apiKey = context.env.CLOUDFLARE_AI_TOKEN
    // Use apiKey safely
  })

// ❌ Client-side (NEVER)
function ClientComponent() {
  const apiKey = process.env.CLOUDFLARE_AI_TOKEN // ❌ Undefined
  // Never expose secrets to client
}
```

---

## State Management Strategy

### State Architecture

We use a layered state management approach:

```
┌─────────────────────────────────────────────────────────────┐
│                    STATE LAYERS                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  [1] SERVER STATE (Source of Truth)                         │
│      • Convex Database                                      │
│      • Real-time subscriptions                              │
│      • Persistent across sessions                           │
│      ▼                                                       │
│                                                              │
│  [2] CLIENT CACHE (TanStack Query)                          │
│      • Query results cached                                 │
│      • Automatic invalidation                               │
│      • Optimistic updates                                   │
│      ▼                                                       │
│                                                              │
│  [3] COMPONENT STATE (React)                                │
│      • Local UI state                                       │
│      • Form inputs                                          │
│      • Animations/transitions                               │
│      ▼                                                       │
│                                                              │
│  [4] URL STATE (Router)                                     │
│      • Current route                                        │
│      • Query parameters                                     │
│      • Shareable state                                      │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Layer 1: Server State (Convex)

```typescript
// convex/journeys.ts

import { v } from 'convex/values'
import { query, mutation } from './_generated/server'

// ============================================
// QUERIES (Read Data)
// ============================================

// Subscribe to journey updates
export const subscribe = query({
  args: { journeyId: v.id('journeys') },
  handler: async (ctx, args) => {
    const journey = await ctx.db.get(args.journeyId)

    if (!journey) return null

    // Get all quotes in journey
    const quotes = await Promise.all(
      journey.quoteIds.map(id => ctx.db.get(id))
    )

    return {
      ...journey,
      quotes
    }
  }
})

// ============================================
// MUTATIONS (Write Data)
// ============================================

// Add quote to journey
export const addQuote = mutation({
  args: {
    journeyId: v.id('journeys'),
    quoteId: v.id('quotes')
  },
  handler: async (ctx, args) => {
    const journey = await ctx.db.get(args.journeyId)

    if (!journey) {
      throw new Error('Journey not found')
    }

    // Update journey with new quote
    await ctx.db.patch(args.journeyId, {
      quoteIds: [...journey.quoteIds, args.quoteId],
      currentIndex: journey.currentIndex + 1,
      lastActiveAt: Date.now()
    })

    return { success: true }
  }
})
```

### Layer 2: Client Cache (React Hooks + Convex)

```typescript
// app/lib/hooks/useJourney.ts

import { useQuery, useMutation } from 'convex/react'
import { api } from '../../../convex/_generated/api'

export function useJourney(journeyId: string) {
  // Subscribe to journey updates (real-time)
  const journey = useQuery(
    api.journeys.subscribe,
    { journeyId }
  )

  // Mutation to add quote
  const addQuoteMutation = useMutation(api.journeys.addQuote)

  // Optimistic update wrapper
  const addQuote = async (quoteId: string) => {
    // 1. Optimistic update (instant UI feedback)
    // This is handled by Convex automatically

    // 2. Call mutation
    await addQuoteMutation({
      journeyId,
      quoteId
    })

    // 3. Real-time subscription auto-updates UI
  }

  return {
    journey,
    addQuote,
    isLoading: journey === undefined
  }
}
```

### Layer 3: Component State (React)

```typescript
// app/components/JourneyFlow.tsx

export function JourneyFlow({ journeyId }: { journeyId: string }) {
  // Server state (from Convex)
  const { journey, addQuote } = useJourney(journeyId)

  // Local UI state
  const [selectedQuoteId, setSelectedQuoteId] = useState<string | null>(null)
  const [isAnimating, setIsAnimating] = useState(false)
  const [showReflection, setShowReflection] = useState(false)

  // Derived state
  const currentQuote = journey?.quotes[journey.currentIndex]
  const shouldShowReflection = journey?.quoteIds.length % 7 === 0

  // Event handlers
  const handleSelectQuote = async (quoteId: string) => {
    // Update local state immediately
    setSelectedQuoteId(quoteId)
    setIsAnimating(true)

    // Play sound (client-only)
    audio.play('select')

    // Update server state
    await addQuote(quoteId)

    // Generate new options (server function)
    const result = await generateRelatedQuotes.call({
      currentQuoteId: quoteId,
      journeyContext: journey.quoteIds
    })

    // Animation complete
    setIsAnimating(false)

    // Check for reflection prompt
    if (shouldShowReflection) {
      setShowReflection(true)
    }
  }

  return (
    <div>
      {/* Current quote */}
      <CurrentQuote quote={currentQuote} />

      {/* Related options */}
      <RelatedOptions
        options={relatedOptions}
        onSelect={handleSelectQuote}
        disabled={isAnimating}
      />

      {/* Reflection prompt */}
      {showReflection && (
        <ReflectionPrompt
          onSubmit={() => setShowReflection(false)}
        />
      )}
    </div>
  )
}
```

### Layer 4: URL State (Router)

```typescript
// Use URL for shareable state

// Navigate to journey with specific quote
router.navigate({
  to: '/journey',
  search: {
    start: quoteId,
    ref: 'landing'
  }
})

// Read from URL
const { start, ref } = Route.useSearch()

// This makes journey shareable:
// https://wolf.topangasoft.workers.dev/journey?start=abc123
```

### State Synchronization

```
User Action (Click Quote)
    │
    ├─→ [1] Update Local State (instant)
    │       • setSelectedQuote(quote)
    │       • setIsAnimating(true)
    │
    ├─→ [2] Call Server Function
    │       • generateRelatedQuotes.call()
    │       • Runs on edge
    │
    ├─→ [3] Convex Mutation
    │       • addQuote mutation
    │       • Updates database
    │       ▼
    │       Real-time Subscription Fires
    │       ▼
    ├─→ [4] UI Auto-Updates
    │       • useQuery returns new data
    │       • React re-renders
    │       • Synced across devices
    │
    └─→ [5] Animation Complete
            • setIsAnimating(false)
```

---

## Caching & Performance Optimization

### Caching Strategy

```
┌─────────────────────────────────────────────────────────────┐
│                   CACHING LAYERS                             │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  [1] EDGE CACHE (Cloudflare CDN)                            │
│      • Static assets (JS, CSS, images, sounds)             │
│      • Cache-Control: public, max-age=31536000             │
│      • Immutable assets with content hashing               │
│      ▼                                                       │
│                                                              │
│  [2] WORKER CACHE (Cloudflare KV)                           │
│      • AI response cache (expensive operations)            │
│      • Quote embeddings                                     │
│      • TTL: 1 hour - 24 hours                               │
│      ▼                                                       │
│                                                              │
│  [3] CONVEX CACHE (Built-in)                                │
│      • Query results automatically cached                   │
│      • Invalidates on mutations                             │
│      • Optimistic updates                                   │
│      ▼                                                       │
│                                                              │
│  [4] BROWSER CACHE                                           │
│      • Service Worker (if implemented)                      │
│      • LocalStorage for preferences                         │
│      • IndexedDB for offline quotes                         │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Implementation

#### 1. Static Asset Caching

```typescript
// app/entry-server.tsx

export default function handleRequest(request: Request) {
  const url = new URL(request.url)

  // Static assets: aggressive caching
  if (url.pathname.startsWith('/assets/')) {
    return new Response(/* asset */, {
      headers: {
        'Cache-Control': 'public, max-age=31536000, immutable',
        'CDN-Cache-Control': 'public, max-age=31536000'
      }
    })
  }

  // HTML: no cache (always fresh)
  if (url.pathname.endsWith('.html') || !url.pathname.includes('.')) {
    return new Response(/* HTML */, {
      headers: {
        'Cache-Control': 'no-cache, must-revalidate',
        'CDN-Cache-Control': 'public, max-age=60' // 1 min edge cache
      }
    })
  }
}
```

#### 2. AI Response Caching

```typescript
// app/server/lib/ai-cache.ts

import { createServerFn } from '@tanstack/start'

// Cache AI responses to avoid redundant calls
export async function getCachedAIResponse<T>(
  key: string,
  generator: () => Promise<T>,
  ttl: number = 3600 // 1 hour default
): Promise<T> {
  // Try cache first (Cloudflare KV)
  const cached = await KV.get(key, 'json')
  if (cached) {
    return cached as T
  }

  // Generate if not cached
  const result = await generator()

  // Store in cache
  await KV.put(key, JSON.stringify(result), {
    expirationTtl: ttl
  })

  return result
}

// Usage in server function
export const generateRelatedQuotes = createServerFn()
  .handler(async ({ data }) => {
    const cacheKey = `quotes:${data.currentQuoteId}:${JSON.stringify(data.preferences)}`

    return getCachedAIResponse(cacheKey, async () => {
      // Expensive AI call
      return await ai.generateQuotes(data)
    }, 3600) // Cache for 1 hour
  })
```

#### 3. Route Prefetching

```typescript
// app/routes/index.tsx (Landing Page)

export const Route = createFileRoute('/')({
  component: LandingPage,

  // Prefetch journey route
  async beforeLoad({ context }) {
    // Start prefetching journey data
    context.router.preloadRoute({ to: '/journey' })

    // Prefetch common quotes
    context.convex.query(api.quotes.getPopular, { limit: 10 })
  }
})

function LandingPage() {
  return (
    <div>
      {quotes.map(quote => (
        <Link
          to="/journey"
          search={{ start: quote.id }}
          preload="intent" // Prefetch on hover
        >
          <QuoteCard quote={quote} />
        </Link>
      ))}
    </div>
  )
}
```

#### 4. Convex Optimistic Updates

```typescript
// Instant UI feedback while mutation runs

export function useOptimisticJourney(journeyId: string) {
  const journey = useQuery(api.journeys.subscribe, { journeyId })
  const addQuote = useMutation(api.journeys.addQuote)

  const optimisticAddQuote = useCallback(async (quote: Quote) => {
    // Optimistic update pattern
    const optimisticValue = {
      ...journey,
      quotes: [...journey.quotes, quote],
      quoteIds: [...journey.quoteIds, quote._id]
    }

    // Update UI immediately
    // Convex handles rollback if mutation fails
    await addQuote({
      journeyId,
      quoteId: quote._id
    })
  }, [journey, addQuote, journeyId])

  return {
    journey,
    addQuote: optimisticAddQuote
  }
}
```

### Performance Optimizations

#### 1. Code Splitting

```typescript
// Split large components
const AudioSystem = lazy(() => import('./AudioSystem.client'))
const InsightGenerator = lazy(() => import('./InsightGenerator'))

// Use in component
<Suspense fallback={<Spinner />}>
  <AudioSystem />
</Suspense>
```

#### 2. Image Optimization

```typescript
// Use Cloudflare Images if needed
<img
  src={`https://imagedelivery.net/${accountId}/${imageId}/public`}
  srcSet={`
    https://imagedelivery.net/${accountId}/${imageId}/small 480w,
    https://imagedelivery.net/${accountId}/${imageId}/medium 1024w,
    https://imagedelivery.net/${accountId}/${imageId}/large 1920w
  `}
  loading="lazy"
  decoding="async"
/>
```

#### 3. Animation Performance

```css
/* Use GPU-accelerated properties only */
.quote-card {
  /* ✅ GPU accelerated */
  transform: translateY(0);
  opacity: 1;
  will-change: transform, opacity;

  /* ❌ Avoid layout-triggering properties */
  /* margin, padding, width, height */
}

.quote-card:hover {
  /* ✅ Smooth 60fps animation */
  transform: translateY(-8px) scale(1.02);
}
```

#### 4. Debouncing/Throttling

```typescript
// Debounce reflection input
const debouncedSaveReflection = useMemo(
  () => debounce((text: string) => {
    saveReflectionDraft.call({ text })
  }, 500),
  []
)

// Throttle scroll events
const throttledUpdateProgress = useMemo(
  () => throttle((progress: number) => {
    updateJourneyProgress.call({ progress })
  }, 100),
  []
)
```

---

## Error Handling & Resilience

### Error Handling Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                  ERROR HANDLING LAYERS                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  [1] VALIDATION ERRORS (Input)                              │
│      • Zod schema validation                                │
│      • Return user-friendly messages                        │
│      • HTTP 400 Bad Request                                 │
│      ▼                                                       │
│                                                              │
│  [2] BUSINESS LOGIC ERRORS (Expected)                       │
│      • Quote not found                                      │
│      • Journey limit reached                                │
│      • Return specific error codes                          │
│      ▼                                                       │
│                                                              │
│  [3] EXTERNAL SERVICE ERRORS (Transient)                    │
│      • AI API timeout                                       │
│      • Convex connection issue                              │
│      • Retry with exponential backoff                       │
│      • Fallback to cached/default data                      │
│      ▼                                                       │
│                                                              │
│  [4] UNEXPECTED ERRORS (Bugs)                               │
│      • Uncaught exceptions                                  │
│      • Log to Sentry                                        │
│      • Return generic error message                         │
│      • Graceful degradation                                 │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Error Handling Implementation

#### 1. Server Function Error Handling

```typescript
// app/server/functions/quotes.ts

import * as Sentry from '@sentry/node'

export const generateRelatedQuotes = createServerFn({ method: 'POST' })
  .validator((data: unknown) => {
    try {
      return GenerateRelatedQuotesSchema.parse(data)
    } catch (error) {
      // Validation error
      throw new ValidationError('Invalid input', {
        errors: error.errors
      })
    }
  })
  .handler(async ({ data, context }) => {
    try {
      // Main logic
      const quotes = await generateQuotesWithAI(data)
      return { success: true, quotes }

    } catch (error) {
      // Categorize error
      if (error instanceof ValidationError) {
        // User input error - don't log to Sentry
        return {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: error.message,
            details: error.details
          }
        }
      }

      if (error instanceof AIServiceError) {
        // External service error
        Sentry.captureException(error, {
          tags: {
            service: 'cloudflare-ai',
            operation: 'generateQuotes'
          },
          level: 'warning'
        })

        // Fallback: get similar quotes from database
        const fallbackQuotes = await context.convex.query(
          api.quotes.getSimilar,
          { quoteId: data.currentQuoteId, count: 5 }
        )

        return {
          success: true,
          quotes: fallbackQuotes,
          fallback: true,
          error: {
            code: 'AI_SERVICE_UNAVAILABLE',
            message: 'Using cached quotes'
          }
        }
      }

      // Unexpected error
      Sentry.captureException(error, {
        tags: {
          function: 'generateRelatedQuotes',
          userId: context.userId,
          sessionId: context.sessionId
        },
        level: 'error'
      })

      return {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred. Please try again.'
        }
      }
    }
  })
```

#### 2. Retry Logic with Exponential Backoff

```typescript
// app/server/lib/retry.ts

export async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  options: {
    maxRetries?: number
    initialDelay?: number
    maxDelay?: number
    shouldRetry?: (error: unknown) => boolean
  } = {}
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    shouldRetry = () => true
  } = options

  let lastError: unknown

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error

      // Don't retry if not retryable
      if (!shouldRetry(error)) {
        throw error
      }

      // Don't retry on last attempt
      if (attempt === maxRetries) {
        throw error
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(
        initialDelay * Math.pow(2, attempt),
        maxDelay
      )

      // Add jitter to prevent thundering herd
      const jitter = Math.random() * 0.3 * delay
      await new Promise(resolve => setTimeout(resolve, delay + jitter))
    }
  }

  throw lastError
}

// Usage
export async function callCloudflareAI(prompt: string) {
  return retryWithBackoff(
    () => ai.run(model, { prompt }),
    {
      maxRetries: 3,
      shouldRetry: (error) => {
        // Only retry on transient errors
        return error.code === 'TIMEOUT' ||
               error.code === 'SERVICE_UNAVAILABLE'
      }
    }
  )
}
```

#### 3. Circuit Breaker Pattern

```typescript
// app/server/lib/circuit-breaker.ts

class CircuitBreaker {
  private failures = 0
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED'
  private lastFailureTime = 0

  constructor(
    private threshold: number = 5,
    private timeout: number = 60000 // 1 minute
  ) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      // Check if should try again
      if (Date.now() - this.lastFailureTime > this.timeout) {
        this.state = 'HALF_OPEN'
      } else {
        throw new Error('Circuit breaker is OPEN')
      }
    }

    try {
      const result = await operation()

      // Success: reset failures
      if (this.state === 'HALF_OPEN') {
        this.state = 'CLOSED'
      }
      this.failures = 0

      return result
    } catch (error) {
      this.failures++
      this.lastFailureTime = Date.now()

      // Open circuit if threshold reached
      if (this.failures >= this.threshold) {
        this.state = 'OPEN'
      }

      throw error
    }
  }
}

// Usage
const aiCircuitBreaker = new CircuitBreaker()

export async function generateQuotesWithAI(data: any) {
  return aiCircuitBreaker.execute(() =>
    callCloudflareAI(data)
  )
}
```

#### 4. Client-Side Error Boundaries

```typescript
// app/components/ErrorBoundary.tsx

import { Component, ReactNode } from 'react'
import * as Sentry from '@sentry/react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: any) {
    // Log to Sentry
    Sentry.captureException(error, {
      contexts: {
        react: errorInfo
      }
    })
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="error-boundary">
          <h2>Something went wrong</h2>
          <p>We've been notified and are working on a fix.</p>
          <button onClick={() => window.location.reload()}>
            Reload Page
          </button>
        </div>
      )
    }

    return this.props.children
  }
}

// Usage
<ErrorBoundary fallback={<JourneyErrorFallback />}>
  <JourneyFlow />
</ErrorBoundary>
```

#### 5. Graceful Degradation

```typescript
// Progressive feature degradation

export function JourneyFlow() {
  // Try to use AI-generated quotes
  const [useAI, setUseAI] = useState(true)

  const getRelatedQuotes = async (quoteId: string) => {
    if (useAI) {
      try {
        // Try AI first
        return await generateRelatedQuotes.call({ currentQuoteId: quoteId })
      } catch (error) {
        // AI failed, fall back to database
        console.warn('AI unavailable, using database fallback')
        setUseAI(false)
      }
    }

    // Fallback: get similar quotes from database
    return await getSimilarQuotes.call({ quoteId, count: 5 })
  }

  return (
    <div>
      {/* Show indicator if using fallback */}
      {!useAI && (
        <Banner type="info">
          AI features temporarily unavailable. Using cached quotes.
        </Banner>
      )}

      <JourneyContent />
    </div>
  )
}
```

#### 6. Sentry Integration

```typescript
// app/entry-server.tsx

import * as Sentry from '@sentry/cloudflare'

export function onServerInit() {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV,
    tracesSampleRate: 1.0,

    // Filter out validation errors (user errors)
    beforeSend(event, hint) {
      if (hint.originalException?.name === 'ValidationError') {
        return null // Don't send to Sentry
      }
      return event
    }
  })
}

// Automatic error tracking
export async function handleRequest(request: Request) {
  return Sentry.withScope(async (scope) => {
    scope.setTag('request_id', request.headers.get('cf-ray'))

    try {
      return await renderToResponse(request)
    } catch (error) {
      Sentry.captureException(error)

      return new Response('Internal Server Error', {
        status: 500
      })
    }
  })
}
```

### Resilience Patterns Summary

| Pattern | Use Case | Implementation |
|---------|----------|----------------|
| **Retry** | Transient failures | Exponential backoff for AI/API calls |
| **Circuit Breaker** | Cascading failures | Stop calling failing service temporarily |
| **Fallback** | Service unavailable | Use cached/default data |
| **Timeout** | Hanging requests | Abort after max duration |
| **Error Boundary** | React crashes | Catch and display error UI |
| **Graceful Degradation** | Feature failures | App works with reduced functionality |
| **Monitoring** | All errors | Sentry tracks and alerts |

---

## Data Layer (Convex)

### Convex Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     CONVEX BACKEND                           │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  [DATABASE TABLES]                                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │    quotes    │  │   journeys   │  │    users     │     │
│  ├──────────────┤  ├──────────────┤  ├──────────────┤     │
│  │ text         │  │ sessionId    │  │ userId       │     │
│  │ author       │  │ quoteIds[]   │  │ preferences  │     │
│  │ categories[] │  │ reflections[]│  │ journeyCount │     │
│  │ tags[]       │  │ insights[]   │  │ totalQuotes  │     │
│  │ sentiment    │  │ currentIndex │  │ createdAt    │     │
│  │ embedding[]  │  │ startedAt    │  │              │     │
│  │ source       │  │ lastActiveAt │  │              │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                              │
│  [FUNCTIONS]                                                 │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Queries (Read)                                       │  │
│  │  • getRandomQuotes()                                  │  │
│  │  • getSimilar()                                       │  │
│  │  • subscribeToJourney()                               │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │  Mutations (Write)                                    │  │
│  │  • saveJourneyStep()                                  │  │
│  │  • addReflection()                                    │  │
│  │  • saveInsight()                                      │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │  Actions (External Calls)                             │  │
│  │  • scrapeQuotesWithFirecrawl()                        │  │
│  │  • generateEmbeddings()                               │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  [REAL-TIME SUBSCRIPTIONS]                                   │
│  • Client subscribes to queries                             │
│  • Auto-updates on data changes                             │
│  • Synced across all devices                                │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Schema Definition

```typescript
// convex/schema.ts

import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'

export default defineSchema({
  // Quotes table
  quotes: defineTable({
    text: v.string(),
    author: v.string(),
    categories: v.array(v.string()),
    tags: v.array(v.string()),
    sentiment: v.union(
      v.literal('uplifting'),
      v.literal('contemplative'),
      v.literal('melancholy'),
      v.literal('inspiring')
    ),
    source: v.string(),
    embedding: v.optional(v.array(v.float64())),
    qualityScore: v.float64(),
    createdAt: v.number()
  })
    .index('by_category', ['categories'])
    .index('by_sentiment', ['sentiment'])
    .index('by_quality', ['qualityScore'])
    .vectorIndex('by_embedding', {
      vectorField: 'embedding',
      dimensions: 384,
      filterFields: ['categories', 'sentiment']
    }),

  // Journeys table
  journeys: defineTable({
    userId: v.optional(v.string()),
    sessionId: v.string(),
    quoteIds: v.array(v.id('quotes')),
    currentIndex: v.number(),
    reflections: v.array(v.object({
      quoteIndex: v.number(),
      text: v.string(),
      timestamp: v.number()
    })),
    insights: v.array(v.object({
      content: v.string(),
      generatedAt: v.number(),
      basedOnQuotes: v.array(v.id('quotes'))
    })),
    startedAt: v.number(),
    lastActiveAt: v.number()
  })
    .index('by_session', ['sessionId'])
    .index('by_user', ['userId'])
    .index('by_last_active', ['lastActiveAt']),

  // User profiles table
  userProfiles: defineTable({
    userId: v.string(),
    preferences: v.object({
      categories: v.array(v.string()),
      soundEnabled: v.boolean(),
      animationIntensity: v.union(
        v.literal('low'),
        v.literal('medium'),
        v.literal('high')
      )
    }),
    journeyCount: v.number(),
    totalQuotesExplored: v.number(),
    createdAt: v.number()
  })
    .index('by_user_id', ['userId'])
})
```

### Query Examples

```typescript
// convex/quotes.ts

import { query } from './_generated/server'
import { v } from 'convex/values'

// Get random quotes for landing page
export const getRandomQuotes = query({
  args: { count: v.number() },
  handler: async (ctx, args) => {
    const quotes = await ctx.db
      .query('quotes')
      .filter(q => q.gte(q.field('qualityScore'), 0.7))
      .collect()

    // Shuffle and take count
    return shuffleArray(quotes).slice(0, args.count)
  }
})

// Get similar quotes using vector search
export const getSimilar = query({
  args: {
    quoteId: v.id('quotes'),
    count: v.number()
  },
  handler: async (ctx, args) => {
    const quote = await ctx.db.get(args.quoteId)

    if (!quote?.embedding) {
      // Fallback: get random quotes from same category
      return ctx.db
        .query('quotes')
        .filter(q =>
          q.and(
            q.neq(q.field('_id'), args.quoteId),
            q.eq(q.field('categories')[0], quote.categories[0])
          )
        )
        .take(args.count)
    }

    // Vector similarity search
    return await ctx.db
      .vectorSearch('quotes', 'by_embedding', {
        vector: quote.embedding,
        limit: args.count + 1,
        filter: q => q.neq(q.field('_id'), args.quoteId)
      })
  }
})

// Subscribe to journey (real-time)
export const subscribeToJourney = query({
  args: { journeyId: v.id('journeys') },
  handler: async (ctx, args) => {
    const journey = await ctx.db.get(args.journeyId)

    if (!journey) return null

    // Get all quotes in journey
    const quotes = await Promise.all(
      journey.quoteIds.map(id => ctx.db.get(id))
    )

    return {
      ...journey,
      quotes: quotes.filter(q => q !== null)
    }
  }
})
```

### Mutation Examples

```typescript
// convex/journeys.ts

import { mutation } from './_generated/server'
import { v } from 'convex/values'

// Create new journey
export const create = mutation({
  args: {
    sessionId: v.string(),
    userId: v.optional(v.string()),
    initialQuoteId: v.id('quotes')
  },
  handler: async (ctx, args) => {
    const journeyId = await ctx.db.insert('journeys', {
      sessionId: args.sessionId,
      userId: args.userId,
      quoteIds: [args.initialQuoteId],
      currentIndex: 0,
      reflections: [],
      insights: [],
      startedAt: Date.now(),
      lastActiveAt: Date.now()
    })

    return journeyId
  }
})

// Add quote to journey
export const addQuote = mutation({
  args: {
    journeyId: v.id('journeys'),
    quoteId: v.id('quotes')
  },
  handler: async (ctx, args) => {
    const journey = await ctx.db.get(args.journeyId)

    if (!journey) {
      throw new Error('Journey not found')
    }

    await ctx.db.patch(args.journeyId, {
      quoteIds: [...journey.quoteIds, args.quoteId],
      currentIndex: journey.currentIndex + 1,
      lastActiveAt: Date.now()
    })
  }
})

// Add reflection
export const addReflection = mutation({
  args: {
    journeyId: v.id('journeys'),
    text: v.string()
  },
  handler: async (ctx, args) => {
    const journey = await ctx.db.get(args.journeyId)

    if (!journey) {
      throw new Error('Journey not found')
    }

    await ctx.db.patch(args.journeyId, {
      reflections: [
        ...journey.reflections,
        {
          quoteIndex: journey.currentIndex,
          text: args.text,
          timestamp: Date.now()
        }
      ]
    })
  }
})
```

---

## AI Integration (Cloudflare)

### Cloudflare AI Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   CLOUDFLARE AI WORKERS                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  [TEXT GENERATION]                                           │
│  Model: @cf/meta/llama-3.1-8b-instruct                       │
│  • Generate related quotes                                   │
│  • Analyze journey patterns                                  │
│  • Create personalized insights                              │
│                                                              │
│  [TEXT EMBEDDINGS]                                           │
│  Model: @cf/baai/bge-base-en-v1.5                            │
│  • Convert quotes to vectors                                 │
│  • Semantic similarity search                                │
│  • Clustering similar quotes                                 │
│                                                              │
│  [SENTIMENT ANALYSIS]                                        │
│  Model: @cf/huggingface/distilbert-sst-2-int8               │
│  • Classify quote sentiment                                  │
│  • Track emotional journey                                   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### AI Client Implementation

```typescript
// app/server/lib/cloudflare-ai.ts

import { Ai } from '@cloudflare/ai'

export class CloudflareAI {
  private ai: Ai

  constructor(env: { CLOUDFLARE_ACCOUNT_ID: string; CLOUDFLARE_AI_TOKEN: string }) {
    this.ai = new Ai({
      accountId: env.CLOUDFLARE_ACCOUNT_ID,
      apiToken: env.CLOUDFLARE_AI_TOKEN
    })
  }

  // Generate related quotes
  async generateRelatedQuotes(params: {
    baseQuote: Quote
    context?: string[]
    preferences?: UserPreferences
    count: number
  }): Promise<Quote[]> {
    const prompt = this.buildQuoteGenerationPrompt(params)

    const response = await this.ai.run(
      '@cf/meta/llama-3.1-8b-instruct',
      {
        prompt,
        max_tokens: 1024,
        temperature: 0.8
      }
    )

    return this.parseQuotesFromResponse(response)
  }

  // Analyze journey for insights
  async analyzeJourneyPattern(params: {
    quotes: string[]
    reflections: string[]
    journeyDepth: number
  }): Promise<string> {
    const prompt = `
You are an empathetic AI that analyzes quote journeys.

Journey (${params.journeyDepth} quotes):
${params.quotes.map((q, i) => `${i + 1}. "${q}"`).join('\n')}

User reflections:
${params.reflections.map((r, i) => `${i + 1}. ${r}`).join('\n')}

Analyze this journey and provide a personalized insight (2-3 sentences) about:
- The emotional themes the user is exploring
- What these choices might reveal about their current mindset
- A thoughtful observation or question to deepen their reflection

Keep it warm, personal, and insightful.
`

    const response = await this.ai.run(
      '@cf/meta/llama-3.1-8b-instruct',
      {
        prompt,
        max_tokens: 256,
        temperature: 0.7
      }
    )

    return response.response
  }

  // Generate embeddings for semantic search
  async generateEmbedding(text: string): Promise<number[]> {
    const response = await this.ai.run(
      '@cf/baai/bge-base-en-v1.5',
      { text }
    )

    return response.data[0]
  }

  // Classify sentiment
  async classifySentiment(text: string): Promise<'uplifting' | 'contemplative' | 'melancholy' | 'inspiring'> {
    const response = await this.ai.run(
      '@cf/huggingface/distilbert-sst-2-int8',
      { text }
    )

    // Map to our sentiment types
    const score = response.score
    if (score > 0.7) return 'uplifting'
    if (score > 0.4) return 'inspiring'
    if (score > 0.2) return 'contemplative'
    return 'melancholy'
  }

  private buildQuoteGenerationPrompt(params: any): string {
    return `
Generate ${params.count} related quotes based on this quote:
"${params.baseQuote.text}" - ${params.baseQuote.author}

${params.context ? `Context: User has explored these themes: ${params.context.join(', ')}` : ''}
${params.preferences?.categories ? `Preferred categories: ${params.preferences.categories.join(', ')}` : ''}

Requirements:
- Each quote should relate thematically but offer a different perspective
- Include diverse authors and time periods
- Format: "Quote text" - Author Name
- Maintain high quality and resonance

Generate ${params.count} quotes:
`
  }

  private parseQuotesFromResponse(response: any): Quote[] {
    // Parse AI response and extract quotes
    // Implementation depends on response format
    return []
  }
}
```

### AI Caching Strategy

```typescript
// Cache AI responses to reduce costs

export async function generateRelatedQuotesWithCache(
  quoteId: string,
  preferences: UserPreferences
) {
  const cacheKey = `ai:related:${quoteId}:${JSON.stringify(preferences)}`

  // Check cache first
  const cached = await KV.get(cacheKey, 'json')
  if (cached) {
    return cached
  }

  // Generate with AI
  const ai = new CloudflareAI(env)
  const quotes = await ai.generateRelatedQuotes({...})

  // Cache for 1 hour
  await KV.put(cacheKey, JSON.stringify(quotes), {
    expirationTtl: 3600
  })

  return quotes
}
```

---

## Deployment Architecture

### Cloudflare Workers Deployment

```
┌─────────────────────────────────────────────────────────────┐
│                   CLOUDFLARE GLOBAL NETWORK                  │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  [CDN Edge Locations] (275+ cities worldwide)                │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Static Assets (Cached)                                │ │
│  │  • JavaScript bundles                                  │ │
│  │  • CSS files                                           │ │
│  │  • Images, sounds                                      │ │
│  │  • Cache-Control: immutable                            │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  [Worker Runtime] (On-demand execution)                      │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  TanStack Start SSR                                    │ │
│  │  • Server-side rendering                               │ │
│  │  • API routes (server functions)                       │ │
│  │  • <1ms cold start                                     │ │
│  │  • Scales automatically                                │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  [KV Storage] (Low-latency key-value)                        │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  • AI response cache                                   │ │
│  │  • Session data                                        │ │
│  │  • Rate limiting                                       │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  [AI Workers] (Inference at edge)                            │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  • LLM inference                                       │ │
│  │  • Embeddings generation                               │ │
│  │  • Sentiment analysis                                  │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
└─────────────────────────────────────────────────────────────┘
        │
        │ API Calls
        ▼
┌─────────────────────────────────────────────────────────────┐
│                   EXTERNAL SERVICES                          │
├─────────────────────────────────────────────────────────────┤
│  • Convex (Real-time database)                              │
│  • Firecrawl (Quote scraping)                               │
│  • Sentry (Error tracking)                                  │
└─────────────────────────────────────────────────────────────┘
```

### CI/CD Pipeline

```
┌─────────────────────────────────────────────────────────────┐
│                     DEPLOYMENT FLOW                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  [1] Developer Push to main                                  │
│      ▼                                                       │
│  [2] GitHub Actions Triggered                                │
│      ├─ Run tests                                            │
│      ├─ Run type checking                                    │
│      ├─ Build project                                        │
│      └─ Generate source maps                                 │
│      ▼                                                       │
│  [3] Deploy to Cloudflare Workers                            │
│      ├─ Upload static assets to CDN                          │
│      ├─ Deploy worker code                                   │
│      └─ Update KV namespaces                                 │
│      ▼                                                       │
│  [4] Post-Deploy                                             │
│      ├─ Upload source maps to Sentry                         │
│      ├─ Run smoke tests                                      │
│      └─ Notify team                                          │
│      ▼                                                       │
│  [5] Live at wolf.topangasoft.workers.dev                    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Environment Configuration

```bash
# .env.production

# Convex
CONVEX_URL=https://your-convex-deployment.convex.cloud
CONVEX_DEPLOY_KEY=prod_...

# Cloudflare
CLOUDFLARE_ACCOUNT_ID=...
CLOUDFLARE_AI_TOKEN=...

# Firecrawl
FIRECRAWL_API_KEY=...

# Sentry
SENTRY_DSN=...
SENTRY_AUTH_TOKEN=...

# App
NODE_ENV=production
APP_URL=https://wolf.topangasoft.workers.dev
```

---

## Summary

QuoteJourney is architected as a modern, edge-first application leveraging:

- **TanStack Start**: Full-stack React framework with server functions, SSR, and progressive enhancement
- **Convex**: Real-time database with live subscriptions and optimistic updates
- **Cloudflare Workers**: Edge deployment for <50ms global latency
- **Cloudflare AI**: On-demand AI inference at the edge
- **Type Safety**: End-to-end TypeScript with Zod validation
- **Resilience**: Circuit breakers, retries, fallbacks, and error tracking
- **Performance**: Multi-layer caching, prefetching, and optimization

The architecture prioritizes:
1. **User Experience**: Fast, smooth, meditative interactions
2. **Reliability**: Graceful degradation and comprehensive error handling
3. **Scalability**: Edge-first deployment scales automatically
4. **Developer Experience**: Type-safe, well-organized codebase

This design maximizes the hackathon sponsors' technologies while delivering an exceptional user experience.

---

*This architecture document will evolve as implementation progresses.*
