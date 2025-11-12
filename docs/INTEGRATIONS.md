# QuoteJourney - Sponsor Integrations Guide

This document provides detailed integration plans, code examples, and configurations for all hackathon sponsor technologies used in QuoteJourney.

---

## Table of Contents

1. [Cloudflare AI](#1-cloudflare-ai)
2. [Firecrawl](#2-firecrawl)
3. [Sentry](#3-sentry)
4. [CodeRabbit](#4-coderabbit)
5. [Cloudflare Workers Deployment](#5-cloudflare-workers-deployment)
6. [Autumn (Optional)](#6-autumn-optional)

---

## 1. Cloudflare AI

### Overview
Cloudflare AI provides edge-hosted AI models for quote generation, semantic similarity, and personality insights without managing GPU infrastructure.

### Models Selected

#### Primary Model: `@cf/meta/llama-3.1-8b-instruct`
**Use Case**: Quote generation and personality analysis
- **Strengths**: Fast inference, good reasoning, instruction following
- **Token Limit**: 8192 tokens
- **Temperature**: 0.7-0.9 for creative quote generation

#### Embedding Model: `@cf/baai/bge-base-en-v1.5`
**Use Case**: Text embeddings for semantic quote similarity
- **Dimensions**: 768
- **Max Tokens**: 512
- **Purpose**: Find related quotes based on meaning, not keywords

### Setup Configuration

```typescript
// src/lib/cloudflare-ai.ts
import { Ai } from '@cloudflare/ai'

export interface CloudflareAIConfig {
  accountId: string
  apiToken: string
}

export class CloudflareAIClient {
  private ai: Ai

  constructor(binding: any) {
    this.ai = new Ai(binding)
  }

  /**
   * Generate embeddings for quote text
   * Used for semantic similarity search
   */
  async generateEmbedding(text: string): Promise<number[]> {
    const response = await this.ai.run(
      '@cf/baai/bge-base-en-v1.5',
      {
        text: [text]
      }
    )
    return response.data[0]
  }

  /**
   * Generate related quotes based on current quote
   */
  async generateRelatedQuotes(
    currentQuote: string,
    author: string,
    context: {
      previousQuotes?: string[]
      userReflections?: string[]
      preferredThemes?: string[]
    }
  ): Promise<GeneratedQuote[]> {
    const prompt = this.buildQuoteGenerationPrompt(
      currentQuote,
      author,
      context
    )

    const response = await this.ai.run(
      '@cf/meta/llama-3.1-8b-instruct',
      {
        prompt,
        max_tokens: 1024,
        temperature: 0.8,
        top_p: 0.9,
      }
    )

    return this.parseQuoteResponse(response.response)
  }

  /**
   * Analyze user's journey for personality insights
   */
  async analyzeJourneyPattern(
    quotes: Array<{ text: string; author: string }>,
    reflections: Array<{ text: string; timestamp: number }>,
    journeyDepth: number
  ): Promise<PersonalityInsight> {
    const prompt = this.buildInsightPrompt(quotes, reflections, journeyDepth)

    const response = await this.ai.run(
      '@cf/meta/llama-3.1-8b-instruct',
      {
        prompt,
        max_tokens: 512,
        temperature: 0.7,
        top_p: 0.85,
      }
    )

    return this.parseInsightResponse(response.response)
  }

  private buildQuoteGenerationPrompt(
    currentQuote: string,
    author: string,
    context: any
  ): string {
    const previousContext = context.previousQuotes
      ? `\nPrevious quotes in journey:\n${context.previousQuotes.slice(-3).join('\n')}`
      : ''

    const reflectionContext = context.userReflections
      ? `\nUser reflections:\n${context.userReflections.slice(-2).join('\n')}`
      : ''

    const themeContext = context.preferredThemes
      ? `\nPreferred themes: ${context.preferredThemes.join(', ')}`
      : ''

    return `You are a wise curator of meaningful quotes. A user is on a meditative journey through quotes.

Current quote they selected:
"${currentQuote}" - ${author}
${previousContext}
${reflectionContext}
${themeContext}

Generate 4 related quotes that:
1. Share thematic resonance with the current quote
2. Offer new perspectives or complementary viewpoints
3. Maintain the emotional tone or thoughtfully shift it
4. Are authentic-sounding and inspirational
5. Include varied, credible authors (mix of famous and lesser-known)

Format each quote as:
QUOTE: [quote text]
AUTHOR: [author name]
THEME: [primary theme]
---

Generate the quotes now:`
  }

  private buildInsightPrompt(
    quotes: Array<{ text: string; author: string }>,
    reflections: Array<{ text: string }>,
    journeyDepth: number
  ): string {
    const quoteSummary = quotes
      .slice(-7)
      .map((q, i) => `${i + 1}. "${q.text}" - ${q.author}`)
      .join('\n')

    const reflectionSummary = reflections.length > 0
      ? `\n\nUser reflections:\n${reflections.map(r => `- ${r.text}`).join('\n')}`
      : ''

    return `You are an empathetic guide analyzing someone's journey through meaningful quotes.

The user has explored ${journeyDepth} quotes. Here are their recent selections:
${quoteSummary}
${reflectionSummary}

Provide a thoughtful, personal insight (2-3 sentences) about:
1. The emotional or philosophical themes emerging in their journey
2. What their choices reveal about their current state of mind or values
3. A gentle direction or question to deepen their exploration

Tone: Warm, non-judgmental, thought-provoking
Length: 40-60 words

Insight:`
  }

  private parseQuoteResponse(response: string): GeneratedQuote[] {
    const quotes: GeneratedQuote[] = []
    const sections = response.split('---').filter(s => s.trim())

    for (const section of sections) {
      const quoteMatch = section.match(/QUOTE:\s*(.+)/i)
      const authorMatch = section.match(/AUTHOR:\s*(.+)/i)
      const themeMatch = section.match(/THEME:\s*(.+)/i)

      if (quoteMatch && authorMatch) {
        quotes.push({
          text: quoteMatch[1].trim().replace(/^["']|["']$/g, ''),
          author: authorMatch[1].trim(),
          theme: themeMatch?.[1].trim() || 'wisdom',
          source: 'ai-generated',
          aiGenerated: true,
        })
      }
    }

    return quotes.slice(0, 4) // Ensure max 4 quotes
  }

  private parseInsightResponse(response: string): PersonalityInsight {
    const cleanedResponse = response.trim()

    return {
      content: cleanedResponse,
      generatedAt: Date.now(),
      model: 'llama-3.1-8b',
    }
  }
}

export interface GeneratedQuote {
  text: string
  author: string
  theme: string
  source: string
  aiGenerated: boolean
}

export interface PersonalityInsight {
  content: string
  generatedAt: number
  model: string
}
```

### TanStack Start Server Function Integration

```typescript
// app/routes/api/generate-quotes.ts
import { createServerFn } from '@tanstack/start'
import { z } from 'zod'
import { CloudflareAIClient } from '~/lib/cloudflare-ai'

const QuoteContextSchema = z.object({
  currentQuote: z.string(),
  currentAuthor: z.string(),
  previousQuotes: z.array(z.string()).optional(),
  userReflections: z.array(z.string()).optional(),
  preferredThemes: z.array(z.string()).optional(),
})

export const generateRelatedQuotes = createServerFn({ method: 'POST' })
  .validator(QuoteContextSchema)
  .handler(async ({ data, context }) => {
    // Access Cloudflare AI binding from context
    const aiClient = new CloudflareAIClient(context.cloudflare.env.AI)

    try {
      const quotes = await aiClient.generateRelatedQuotes(
        data.currentQuote,
        data.currentAuthor,
        {
          previousQuotes: data.previousQuotes,
          userReflections: data.userReflections,
          preferredThemes: data.preferredThemes,
        }
      )

      return {
        success: true,
        quotes,
        cached: false,
      }
    } catch (error) {
      console.error('Quote generation failed:', error)

      // Fallback: Return pre-curated related quotes from database
      return {
        success: false,
        quotes: await getFallbackQuotes(data.currentQuote),
        cached: true,
        error: 'AI generation failed, using cached quotes',
      }
    }
  })
```

### Journey Analysis Server Function

```typescript
// app/routes/api/analyze-journey.ts
import { createServerFn } from '@tanstack/start'
import { z } from 'zod'
import { CloudflareAIClient } from '~/lib/cloudflare-ai'

const JourneyAnalysisSchema = z.object({
  quotes: z.array(
    z.object({
      text: z.string(),
      author: z.string(),
    })
  ),
  reflections: z.array(
    z.object({
      text: z.string(),
      timestamp: z.number(),
    })
  ),
  journeyDepth: z.number(),
})

export const analyzeJourney = createServerFn({ method: 'POST' })
  .validator(JourneyAnalysisSchema)
  .handler(async ({ data, context }) => {
    const aiClient = new CloudflareAIClient(context.cloudflare.env.AI)

    try {
      const insight = await aiClient.analyzeJourneyPattern(
        data.quotes,
        data.reflections,
        data.journeyDepth
      )

      return {
        success: true,
        insight,
      }
    } catch (error) {
      console.error('Journey analysis failed:', error)

      return {
        success: false,
        insight: {
          content: 'Your journey shows a deep exploration of meaningful ideas. Continue following what resonates with you.',
          generatedAt: Date.now(),
          model: 'fallback',
        },
      }
    }
  })
```

### Rate Limiting Strategy

```typescript
// src/lib/rate-limiter.ts
import { Redis } from '@upstash/redis'

export class AIRateLimiter {
  private redis: Redis

  constructor(redisUrl: string, redisToken: string) {
    this.redis = new Redis({
      url: redisUrl,
      token: redisToken,
    })
  }

  async checkLimit(
    userId: string,
    endpoint: 'quote-generation' | 'journey-analysis'
  ): Promise<{ allowed: boolean; remaining: number }> {
    const limits = {
      'quote-generation': { max: 100, window: 3600 }, // 100/hour
      'journey-analysis': { max: 20, window: 3600 },   // 20/hour
    }

    const limit = limits[endpoint]
    const key = `ratelimit:${endpoint}:${userId}`

    const current = await this.redis.incr(key)

    if (current === 1) {
      await this.redis.expire(key, limit.window)
    }

    return {
      allowed: current <= limit.max,
      remaining: Math.max(0, limit.max - current),
    }
  }
}
```

### Caching Strategy

```typescript
// src/lib/ai-cache.ts
import { kv } from '@vercel/kv'

export class AIResponseCache {
  /**
   * Cache generated quotes to reduce AI calls
   * Key: hash of current quote + context
   */
  async cacheQuotes(
    cacheKey: string,
    quotes: any[],
    ttl: number = 3600
  ): Promise<void> {
    await kv.set(`quotes:${cacheKey}`, JSON.stringify(quotes), {
      ex: ttl,
    })
  }

  async getCachedQuotes(cacheKey: string): Promise<any[] | null> {
    const cached = await kv.get(`quotes:${cacheKey}`)
    return cached ? JSON.parse(cached as string) : null
  }

  /**
   * Generate cache key from context
   */
  generateCacheKey(currentQuote: string, context: any): string {
    const hashInput = JSON.stringify({
      quote: currentQuote,
      themes: context.preferredThemes?.sort().join(',') || '',
    })

    return hashString(hashInput)
  }
}

function hashString(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash
  }
  return hash.toString(36)
}
```

### Environment Variables

```bash
# .env.local
CLOUDFLARE_ACCOUNT_ID=your_account_id
CLOUDFLARE_AI_TOKEN=your_ai_token

# For rate limiting (optional)
UPSTASH_REDIS_URL=your_redis_url
UPSTASH_REDIS_TOKEN=your_redis_token
```

### Testing AI Responses

```typescript
// tests/ai-integration.test.ts
import { describe, it, expect } from 'vitest'
import { CloudflareAIClient } from '~/lib/cloudflare-ai'

describe('Cloudflare AI Integration', () => {
  it('generates contextual quotes', async () => {
    const client = new CloudflareAIClient(mockBinding)

    const quotes = await client.generateRelatedQuotes(
      'The only way to do great work is to love what you do.',
      'Steve Jobs',
      {
        preferredThemes: ['motivation', 'passion'],
      }
    )

    expect(quotes).toHaveLength(4)
    expect(quotes[0]).toHaveProperty('text')
    expect(quotes[0]).toHaveProperty('author')
    expect(quotes[0]).toHaveProperty('theme')
  })

  it('handles API failures gracefully', async () => {
    const client = new CloudflareAIClient(failingMockBinding)

    await expect(
      client.generateRelatedQuotes('test', 'author', {})
    ).rejects.toThrow()
  })
})
```

---

## 2. Firecrawl

### Overview
Firecrawl is used to scrape high-quality quotes from various online sources to build and maintain the quote database.

### Target Sources

1. **Goodreads Quotes** (https://www.goodreads.com/quotes)
   - Categories: life, love, wisdom, inspiration, philosophy
   - Structure: Quote text, author, tags, likes count

2. **BrainyQuote** (https://www.brainyquote.com)
   - Categories: motivational, life, love, success, wisdom
   - Structure: Quote text, author, category

3. **Wikiquote** (https://en.wikiquote.org)
   - Historical and philosophical quotes
   - Properly attributed and verified

4. **Poetry Foundation** (https://www.poetryfoundation.org)
   - Poetic excerpts and short meaningful passages

### Scraping Configuration

```typescript
// src/lib/firecrawl-client.ts
import FirecrawlApp from '@mendable/firecrawl-js'

export interface ScrapeConfig {
  url: string
  category: string
  maxPages?: number
  selectors?: {
    quoteText: string
    author: string
    tags?: string
  }
}

export class FirecrawlQuoteScraper {
  private firecrawl: FirecrawlApp

  constructor(apiKey: string) {
    this.firecrawl = new FirecrawlApp({ apiKey })
  }

  /**
   * Scrape quotes from a single URL
   */
  async scrapeQuotePage(config: ScrapeConfig): Promise<ScrapedQuote[]> {
    try {
      const scrapeResult = await this.firecrawl.scrapeUrl(config.url, {
        formats: ['markdown', 'html'],
        onlyMainContent: true,
        waitFor: 2000, // Wait for dynamic content
        headers: {
          'User-Agent': 'QuoteJourney/1.0 (Educational Hackathon Project)',
        },
      })

      if (!scrapeResult.success) {
        throw new Error(`Scrape failed: ${scrapeResult.error}`)
      }

      // Parse quotes from markdown content
      const quotes = this.parseQuotesFromMarkdown(
        scrapeResult.markdown!,
        config
      )

      return quotes
    } catch (error) {
      console.error(`Failed to scrape ${config.url}:`, error)
      throw error
    }
  }

  /**
   * Crawl multiple pages from a website
   */
  async crawlQuoteWebsite(
    baseUrl: string,
    config: {
      maxPages: number
      category: string
      urlPattern?: RegExp
    }
  ): Promise<ScrapedQuote[]> {
    const allQuotes: ScrapedQuote[] = []

    try {
      const crawlResult = await this.firecrawl.crawlUrl(baseUrl, {
        limit: config.maxPages,
        scrapeOptions: {
          formats: ['markdown'],
          onlyMainContent: true,
        },
      })

      if (!crawlResult.success) {
        throw new Error('Crawl failed')
      }

      for (const page of crawlResult.data || []) {
        if (config.urlPattern && !config.urlPattern.test(page.url || '')) {
          continue
        }

        const quotes = this.parseQuotesFromMarkdown(page.markdown!, {
          url: page.url!,
          category: config.category,
        })

        allQuotes.push(...quotes)
      }

      return this.deduplicateQuotes(allQuotes)
    } catch (error) {
      console.error(`Failed to crawl ${baseUrl}:`, error)
      throw error
    }
  }

  /**
   * Parse quotes from markdown content
   */
  private parseQuotesFromMarkdown(
    markdown: string,
    config: Partial<ScrapeConfig>
  ): ScrapedQuote[] {
    const quotes: ScrapedQuote[] = []

    // Pattern 1: Markdown blockquotes with attribution
    // > "Quote text"
    // > — Author Name
    const blockquotePattern = />\s*[""](.+?)[""][\s\n]*>\s*[—–-]\s*(.+?)$/gm
    let match

    while ((match = blockquotePattern.exec(markdown)) !== null) {
      quotes.push({
        text: match[1].trim(),
        author: match[2].trim(),
        category: config.category || 'general',
        source: config.url || 'unknown',
        scrapedAt: Date.now(),
      })
    }

    // Pattern 2: Quote followed by author on next line
    // "Quote text"
    // — Author Name
    const standalonePattern = /[""](.+?)[""][\s\n]+[—–-]\s*(.+?)(?:\n|$)/gm

    while ((match = standalonePattern.exec(markdown)) !== null) {
      const quote = {
        text: match[1].trim(),
        author: match[2].trim(),
        category: config.category || 'general',
        source: config.url || 'unknown',
        scrapedAt: Date.now(),
      }

      // Avoid duplicates from multiple patterns
      if (!quotes.some(q => q.text === quote.text)) {
        quotes.push(quote)
      }
    }

    // Pattern 3: HTML-style quotes (from HTML format)
    // <quote>text</quote> <author>name</author>
    const htmlPattern = /<(?:quote|q)>(.+?)<\/(?:quote|q)>\s*<author>(.+?)<\/author>/gi

    while ((match = htmlPattern.exec(markdown)) !== null) {
      const quote = {
        text: match[1].trim(),
        author: match[2].trim(),
        category: config.category || 'general',
        source: config.url || 'unknown',
        scrapedAt: Date.now(),
      }

      if (!quotes.some(q => q.text === quote.text)) {
        quotes.push(quote)
      }
    }

    return this.filterValidQuotes(quotes)
  }

  /**
   * Filter out invalid or low-quality quotes
   */
  private filterValidQuotes(quotes: ScrapedQuote[]): ScrapedQuote[] {
    return quotes.filter(quote => {
      // Must have both text and author
      if (!quote.text || !quote.author) return false

      // Quote should be meaningful length
      if (quote.text.length < 20 || quote.text.length > 500) return false

      // Author shouldn't be too long (probably parsing error)
      if (quote.author.length > 50) return false

      // Exclude common garbage
      const excludePatterns = [
        /^more quotes/i,
        /^click here/i,
        /^share this/i,
        /^advertisement/i,
      ]

      return !excludePatterns.some(pattern => pattern.test(quote.text))
    })
  }

  /**
   * Remove duplicate quotes
   */
  private deduplicateQuotes(quotes: ScrapedQuote[]): ScrapedQuote[] {
    const seen = new Set<string>()
    const unique: ScrapedQuote[] = []

    for (const quote of quotes) {
      const key = `${quote.text.toLowerCase()}:${quote.author.toLowerCase()}`

      if (!seen.has(key)) {
        seen.add(key)
        unique.push(quote)
      }
    }

    return unique
  }
}

export interface ScrapedQuote {
  text: string
  author: string
  category: string
  source: string
  scrapedAt: number
  tags?: string[]
}
```

### Data Extraction Patterns

```typescript
// src/lib/quote-extractors.ts

/**
 * Source-specific extractors for better accuracy
 */

export const sourceExtractors = {
  goodreads: {
    urlPattern: /goodreads\.com/,
    async extract(firecrawl: FirecrawlApp, url: string) {
      const result = await firecrawl.scrapeUrl(url, {
        formats: ['html'],
        onlyMainContent: true,
      })

      // Goodreads specific selectors
      const quotes = []
      // ... parse Goodreads HTML structure
      return quotes
    },
  },

  brainyquote: {
    urlPattern: /brainyquote\.com/,
    async extract(firecrawl: FirecrawlApp, url: string) {
      const result = await firecrawl.scrapeUrl(url, {
        formats: ['markdown'],
        onlyMainContent: true,
      })

      // BrainyQuote has clean markdown structure
      return this.parseMarkdown(result.markdown)
    },
  },

  wikiquote: {
    urlPattern: /wikiquote\.org/,
    async extract(firecrawl: FirecrawlApp, url: string) {
      const result = await firecrawl.scrapeUrl(url, {
        formats: ['markdown'],
        onlyMainContent: true,
      })

      // Wikiquote has structured sections
      return this.parseWikiquoteMarkdown(result.markdown)
    },
  },
}
```

### Server Function Integration

```typescript
// app/routes/api/admin/scrape-quotes.ts
import { createServerFn } from '@tanstack/start'
import { z } from 'zod'
import { FirecrawlQuoteScraper } from '~/lib/firecrawl-client'
import { api } from '~/convex/_generated/api'

const ScrapeRequestSchema = z.object({
  urls: z.array(z.string().url()),
  category: z.string(),
  maxPagesPerUrl: z.number().optional().default(1),
  adminKey: z.string(), // Basic auth for admin endpoints
})

export const scrapeAndStoreQuotes = createServerFn({ method: 'POST' })
  .validator(ScrapeRequestSchema)
  .handler(async ({ data, context }) => {
    // Verify admin access
    if (data.adminKey !== process.env.ADMIN_API_KEY) {
      throw new Error('Unauthorized')
    }

    const scraper = new FirecrawlQuoteScraper(
      process.env.FIRECRAWL_API_KEY!
    )

    const results = {
      total: 0,
      successful: 0,
      failed: 0,
      quotes: [] as any[],
    }

    for (const url of data.urls) {
      try {
        const quotes = await scraper.scrapeQuotePage({
          url,
          category: data.category,
          maxPages: data.maxPagesPerUrl,
        })

        // Store in Convex
        for (const quote of quotes) {
          await context.convex.mutation(api.quotes.create, {
            text: quote.text,
            author: quote.author,
            categories: [quote.category],
            tags: quote.tags || [],
            source: quote.source,
            qualityScore: 0.5, // Default, will be refined
          })
        }

        results.quotes.push(...quotes)
        results.successful += quotes.length
        results.total += quotes.length
      } catch (error) {
        console.error(`Failed to scrape ${url}:`, error)
        results.failed++
      }

      // Rate limiting: wait between requests
      await new Promise(resolve => setTimeout(resolve, 2000))
    }

    return results
  })
```

### Initial Seeding Strategy

```typescript
// scripts/seed-quotes.ts
import { FirecrawlQuoteScraper } from '../src/lib/firecrawl-client'
import { ConvexHttpClient } from 'convex/browser'
import { api } from '../convex/_generated/api'

const SEED_SOURCES = [
  {
    url: 'https://www.goodreads.com/quotes/tag/life',
    category: 'life',
    maxPages: 5,
  },
  {
    url: 'https://www.goodreads.com/quotes/tag/inspiration',
    category: 'inspiration',
    maxPages: 5,
  },
  {
    url: 'https://www.goodreads.com/quotes/tag/wisdom',
    category: 'wisdom',
    maxPages: 5,
  },
  {
    url: 'https://www.goodreads.com/quotes/tag/love',
    category: 'love',
    maxPages: 3,
  },
  {
    url: 'https://www.goodreads.com/quotes/tag/philosophy',
    category: 'philosophy',
    maxPages: 5,
  },
  {
    url: 'https://www.brainyquote.com/topics/motivational-quotes',
    category: 'motivation',
    maxPages: 3,
  },
]

async function seedDatabase() {
  const scraper = new FirecrawlQuoteScraper(process.env.FIRECRAWL_API_KEY!)
  const convex = new ConvexHttpClient(process.env.CONVEX_URL!)

  console.log('Starting quote database seeding...')

  let totalQuotes = 0

  for (const source of SEED_SOURCES) {
    console.log(`Scraping ${source.url}...`)

    try {
      const quotes = await scraper.crawlQuoteWebsite(source.url, {
        maxPages: source.maxPages,
        category: source.category,
      })

      console.log(`Found ${quotes.length} quotes from ${source.url}`)

      // Batch insert to Convex
      for (const quote of quotes) {
        await convex.mutation(api.quotes.create, {
          text: quote.text,
          author: quote.author,
          categories: [quote.category],
          tags: [],
          source: quote.source,
          sentiment: inferSentiment(quote.text, quote.category),
          qualityScore: 0.7,
        })

        totalQuotes++
      }

      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 5000))
    } catch (error) {
      console.error(`Failed to seed from ${source.url}:`, error)
    }
  }

  console.log(`Seeding complete! Added ${totalQuotes} quotes.`)
}

function inferSentiment(
  text: string,
  category: string
): 'uplifting' | 'contemplative' | 'melancholy' | 'inspiring' {
  const upliftingWords = ['joy', 'happiness', 'success', 'achieve', 'wonderful']
  const contemplativeWords = ['think', 'ponder', 'consider', 'reflect', 'wonder']
  const melancholyWords = ['sadness', 'pain', 'loss', 'sorrow', 'difficult']

  const lowerText = text.toLowerCase()

  if (category === 'motivation') return 'inspiring'
  if (upliftingWords.some(w => lowerText.includes(w))) return 'uplifting'
  if (melancholyWords.some(w => lowerText.includes(w))) return 'melancholy'
  if (contemplativeWords.some(w => lowerText.includes(w))) return 'contemplative'

  return 'inspiring' // default
}

// Run the seed script
seedDatabase().catch(console.error)
```

### Environment Variables

```bash
# .env.local
FIRECRAWL_API_KEY=your_firecrawl_api_key
ADMIN_API_KEY=your_admin_key_for_scraping
```

### Rate Limiting & Best Practices

```typescript
// src/lib/scrape-scheduler.ts

/**
 * Schedule regular scraping jobs to keep database fresh
 */
export class ScrapeScheduler {
  private queue: ScrapeJob[] = []
  private processing = false

  async addJob(job: ScrapeJob) {
    this.queue.push(job)

    if (!this.processing) {
      this.processQueue()
    }
  }

  private async processQueue() {
    this.processing = true

    while (this.queue.length > 0) {
      const job = this.queue.shift()!

      try {
        await this.executeJob(job)

        // Respect rate limits: 2 seconds between requests
        await new Promise(resolve => setTimeout(resolve, 2000))
      } catch (error) {
        console.error('Job failed:', error)

        // Exponential backoff for retries
        if (job.retries < 3) {
          job.retries++
          this.queue.push(job)
          await new Promise(resolve =>
            setTimeout(resolve, 1000 * Math.pow(2, job.retries))
          )
        }
      }
    }

    this.processing = false
  }

  private async executeJob(job: ScrapeJob) {
    // Implementation
  }
}

interface ScrapeJob {
  url: string
  category: string
  retries: number
}
```

---

## 3. Sentry

### Overview
Sentry provides comprehensive error tracking, performance monitoring, and user feedback for QuoteJourney.

### Setup Configuration

```typescript
// src/lib/sentry-config.ts
import * as Sentry from '@sentry/react'
import { BrowserTracing } from '@sentry/tracing'

export function initSentry() {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV,

    // Performance Monitoring
    integrations: [
      new BrowserTracing({
        tracePropagationTargets: [
          'localhost',
          'wolf.topangasoft.workers.dev',
          /^\//,
        ],
        routingInstrumentation: Sentry.reactRouterV6Instrumentation(
          React.useEffect,
          useLocation,
          useNavigationType,
          createRoutesFromChildren,
          matchRoutes
        ),
      }),
      new Sentry.Replay({
        maskAllText: false,
        blockAllMedia: false,
      }),
    ],

    // Performance monitoring sample rates
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.2 : 1.0,

    // Session replay sample rates
    replaysSessionSampleRate: 0.1, // 10% of sessions
    replaysOnErrorSampleRate: 1.0, // 100% of sessions with errors

    // Release tracking
    release: process.env.VERCEL_GIT_COMMIT_SHA || 'development',

    // Ignore common non-critical errors
    ignoreErrors: [
      'ResizeObserver loop limit exceeded',
      'Non-Error promise rejection captured',
      'cancelled', // React Query cancellations
    ],

    beforeSend(event, hint) {
      // Filter out local development errors
      if (event.request?.url?.includes('localhost')) {
        return null
      }

      // Sanitize sensitive data
      if (event.request?.headers) {
        delete event.request.headers['Authorization']
        delete event.request.headers['Cookie']
      }

      return event
    },
  })
}
```

### Error Boundary Integration

```typescript
// src/components/ErrorBoundary.tsx
import * as Sentry from '@sentry/react'
import { Component, ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  eventId?: string
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log to Sentry with context
    Sentry.withScope(scope => {
      scope.setContext('errorBoundary', {
        componentStack: errorInfo.componentStack,
      })

      const eventId = Sentry.captureException(error)
      this.setState({ eventId })
    })
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="error-container">
            <h2>Something went wrong</h2>
            <p>We've been notified and are working on a fix.</p>
            <button
              onClick={() => {
                if (this.state.eventId) {
                  Sentry.showReportDialog({
                    eventId: this.state.eventId,
                    title: 'It looks like we're having issues.',
                    subtitle: 'Our team has been notified.',
                    subtitle2: 'If you'd like to help, tell us what happened below.',
                  })
                }
              }}
            >
              Report feedback
            </button>
            <button onClick={() => window.location.reload()}>
              Reload page
            </button>
          </div>
        )
      )
    }

    return this.props.children
  }
}

// Wrap with Sentry's error boundary
export const SentryErrorBoundary = Sentry.withErrorBoundary(ErrorBoundary, {
  fallback: <div>An error occurred</div>,
  showDialog: true,
})
```

### Performance Monitoring

```typescript
// src/lib/sentry-performance.ts
import * as Sentry from '@sentry/react'

/**
 * Track quote generation performance
 */
export function trackQuoteGeneration(quoteId: string) {
  const transaction = Sentry.startTransaction({
    name: 'Quote Generation',
    op: 'quote.generate',
    tags: {
      quoteId,
    },
  })

  return {
    setStatus: (status: 'success' | 'error') => {
      transaction.setStatus(status)
    },
    addData: (key: string, value: any) => {
      transaction.setData(key, value)
    },
    finish: () => {
      transaction.finish()
    },
  }
}

/**
 * Track journey interactions
 */
export function trackJourneyStep(stepNumber: number, quoteId: string) {
  Sentry.addBreadcrumb({
    category: 'journey',
    message: `Journey step ${stepNumber}`,
    level: 'info',
    data: {
      stepNumber,
      quoteId,
      timestamp: Date.now(),
    },
  })
}

/**
 * Track AI operations with timing
 */
export async function trackAIOperation<T>(
  operation: string,
  fn: () => Promise<T>
): Promise<T> {
  const span = Sentry.getCurrentHub().getScope()?.getSpan()
  const childSpan = span?.startChild({
    op: 'ai',
    description: operation,
  })

  try {
    const result = await fn()
    childSpan?.setStatus('ok')
    return result
  } catch (error) {
    childSpan?.setStatus('internal_error')
    Sentry.captureException(error, {
      tags: {
        operation,
        type: 'ai-operation',
      },
    })
    throw error
  } finally {
    childSpan?.finish()
  }
}

/**
 * Track page transitions
 */
export function trackPageTransition(from: string, to: string) {
  const transaction = Sentry.startTransaction({
    name: `Route Change: ${from} → ${to}`,
    op: 'navigation',
    tags: {
      from,
      to,
    },
  })

  setTimeout(() => transaction.finish(), 100)
}
```

### Custom Event Tracking

```typescript
// src/lib/sentry-events.ts
import * as Sentry from '@sentry/react'

/**
 * Track user interactions for product insights
 */
export const sentryEvents = {
  quoteViewed: (quoteId: string, author: string, category: string) => {
    Sentry.addBreadcrumb({
      category: 'user-action',
      message: 'Quote viewed',
      data: { quoteId, author, category },
      level: 'info',
    })
  },

  quoteSelected: (quoteId: string, journeyDepth: number) => {
    Sentry.addBreadcrumb({
      category: 'user-action',
      message: 'Quote selected',
      data: { quoteId, journeyDepth },
      level: 'info',
    })
  },

  reflectionSubmitted: (journeyId: string, reflectionLength: number) => {
    Sentry.addBreadcrumb({
      category: 'user-action',
      message: 'Reflection submitted',
      data: { journeyId, reflectionLength },
      level: 'info',
    })
  },

  insightGenerated: (journeyId: string, quotesAnalyzed: number) => {
    Sentry.addBreadcrumb({
      category: 'ai',
      message: 'Insight generated',
      data: { journeyId, quotesAnalyzed },
      level: 'info',
    })
  },

  audioToggled: (enabled: boolean) => {
    Sentry.addBreadcrumb({
      category: 'settings',
      message: 'Audio toggled',
      data: { enabled },
      level: 'info',
    })
  },
}
```

### User Feedback Integration

```typescript
// src/components/FeedbackButton.tsx
import * as Sentry from '@sentry/react'
import { useState } from 'react'

export function FeedbackButton() {
  const [isOpen, setIsOpen] = useState(false)

  const handleFeedback = () => {
    const eventId = Sentry.captureMessage('User Feedback', 'info')

    Sentry.showReportDialog({
      eventId,
      title: 'Share Your Thoughts',
      subtitle: 'Help us improve QuoteJourney',
      subtitle2: 'Your feedback helps us create better experiences.',
      labelName: 'Name (optional)',
      labelEmail: 'Email (optional)',
      labelComments: 'What would you like to share?',
      labelSubmit: 'Send Feedback',
      successMessage: 'Thank you! Your feedback has been received.',
    })
  }

  return (
    <button
      onClick={handleFeedback}
      className="feedback-button"
      aria-label="Send feedback"
    >
      💬 Feedback
    </button>
  )
}
```

### Server-Side Sentry (Cloudflare Workers)

```typescript
// src/lib/sentry-server.ts
import { Toucan } from 'toucan-js'

export function initServerSentry(
  request: Request,
  env: any,
  context: ExecutionContext
) {
  return new Toucan({
    dsn: env.SENTRY_DSN,
    environment: env.ENVIRONMENT,
    context,
    request,

    // Additional options
    tracesSampleRate: 0.2,

    beforeSend(event) {
      // Sanitize server-side sensitive data
      if (event.request?.headers) {
        delete event.request.headers['authorization']
        delete event.request.headers['cookie']
      }
      return event
    },
  })
}

// Use in server functions
export async function serverFunction(request: Request, env: any, ctx: any) {
  const sentry = initServerSentry(request, env, ctx)

  try {
    // Your server logic
    const result = await doSomething()
    return result
  } catch (error) {
    sentry.captureException(error)
    throw error
  }
}
```

### Environment Variables

```bash
# .env.local
SENTRY_DSN=your_sentry_dsn
SENTRY_AUTH_TOKEN=your_auth_token  # For source maps upload
SENTRY_ORG=your_org
SENTRY_PROJECT=your_project
```

### Build Integration (Source Maps)

```javascript
// vite.config.ts
import { sentryVitePlugin } from '@sentry/vite-plugin'

export default defineConfig({
  plugins: [
    // ... other plugins

    sentryVitePlugin({
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      authToken: process.env.SENTRY_AUTH_TOKEN,

      // Upload source maps during production builds
      include: './dist',
      ignore: ['node_modules'],
    }),
  ],

  build: {
    sourcemap: true, // Enable source maps
  },
})
```

---

## 4. CodeRabbit

### Overview
CodeRabbit provides AI-powered code reviews for every pull request, helping maintain code quality and catching issues early.

### Setup Configuration

#### 1. GitHub Repository Configuration

Create `.coderabbit.yaml` in repository root:

```yaml
# .coderabbit.yaml
language: en-US

# Review settings
reviews:
  # Enable PR reviews
  enabled: true

  # Auto-review on PR creation/update
  auto_review: true

  # Review depth
  review_level: thorough

  # Focus areas
  focus:
    - security
    - performance
    - maintainability
    - accessibility
    - best-practices

  # Ignore patterns
  ignored_files:
    - "**/*.test.ts"
    - "**/*.test.tsx"
    - "**/convex/_generated/**"
    - "dist/**"
    - "build/**"
    - "node_modules/**"

  # Auto-approve simple changes
  auto_approve:
    enabled: false

# Comment settings
comments:
  # Minimum confidence for posting comments
  min_confidence: 0.7

  # Comment style
  style: conversational

  # Group related comments
  group_similar: true

# Integration with CI/CD
ci:
  # Block merging on critical issues
  block_merge_on: critical

  # Require changes on medium+ issues
  require_changes_on: medium

# Learning preferences
learning:
  # Learn from maintainer feedback
  enabled: true

  # Project-specific patterns
  custom_rules:
    - name: "TanStack Start patterns"
      description: "Prefer createServerFn for server logic"
      pattern: "Use createServerFn({ method: 'POST' }) for mutations"

    - name: "Convex queries"
      description: "Use Convex mutations/queries correctly"
      pattern: "Mutations should modify data, queries should only read"

    - name: "Error handling"
      description: "Always track errors with Sentry"
      pattern: "Wrap async operations with Sentry.captureException"

# Notification settings
notifications:
  # Notify on review completion
  on_review_complete: true

  # Notify on critical issues
  on_critical_issues: true
```

#### 2. GitHub Actions Integration

Create `.github/workflows/coderabbit.yml`:

```yaml
name: CodeRabbit Review

on:
  pull_request:
    types: [opened, synchronize, reopened]

permissions:
  contents: read
  pull-requests: write
  issues: write

jobs:
  code-review:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        with:
          fetch-depth: 0  # Full history for better context

      - name: CodeRabbit Review
        uses: coderabbitai/coderabbit-action@v1
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}

      - name: Comment PR on failure
        if: failure()
        uses: actions/github-script@v7
        with:
          script: |
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: '⚠️ CodeRabbit review encountered an error. Please check the logs.'
            })
```

#### 3. Custom Review Rules for QuoteJourney

```yaml
# .coderabbit/rules/quote-journey-rules.yaml

rules:
  - id: server-function-validation
    name: "Server Function Input Validation"
    description: "All server functions must validate input with Zod"
    severity: high
    pattern: |
      createServerFn.*handler.*async.*{data}
    check: |
      Must include .validator() with Zod schema
    example: |
      ✅ createServerFn({ method: 'POST' })
        .validator(QuoteSchema)
        .handler(async ({ data }) => { ... })

      ❌ createServerFn({ method: 'POST' })
        .handler(async ({ data }) => { ... })

  - id: error-tracking
    name: "Error Tracking with Sentry"
    description: "All catch blocks should report to Sentry"
    severity: medium
    pattern: |
      catch\s*\(.*\)\s*{
    check: |
      Must include Sentry.captureException()
    example: |
      ✅ catch (error) {
        Sentry.captureException(error)
        throw error
      }

      ❌ catch (error) {
        console.error(error)
      }

  - id: ai-rate-limiting
    name: "AI API Rate Limiting"
    description: "All AI API calls should implement rate limiting"
    severity: high
    pattern: |
      CloudflareAIClient.*run\(
    check: |
      Should check rate limits before API call
    example: |
      ✅ const limit = await rateLimiter.checkLimit(userId, 'ai-call')
      if (!limit.allowed) throw new Error('Rate limit exceeded')

      ❌ Direct AI call without rate limit check

  - id: convex-optimistic-updates
    name: "Optimistic Updates for Convex Mutations"
    description: "User-facing mutations should use optimistic updates"
    severity: low
    pattern: |
      useMutation\(api\.
    check: |
      Consider using optimistic updates for better UX
    example: |
      Use optimisticUpdate option in useMutation hook

  - id: accessibility
    name: "Accessibility Requirements"
    description: "Interactive elements must have ARIA labels"
    severity: medium
    pattern: |
      <button|<input|<select
    check: |
      Must include aria-label or aria-labelledby
    example: |
      ✅ <button aria-label="Select quote">
      ❌ <button>
```

### CI/CD Integration

#### GitHub Actions Status Checks

```yaml
# .github/workflows/ci.yml
name: CI Pipeline

on:
  pull_request:
    branches: [main, develop]

jobs:
  # ... other jobs (tests, build, etc.)

  coderabbit-check:
    name: CodeRabbit Quality Gate
    runs-on: ubuntu-latest
    needs: [test, build]

    steps:
      - name: Check CodeRabbit Status
        uses: actions/github-script@v7
        with:
          script: |
            const { data: reviews } = await github.rest.pulls.listReviews({
              owner: context.repo.owner,
              repo: context.repo.repo,
              pull_number: context.issue.number,
            });

            const coderabbitReview = reviews.find(
              r => r.user.login === 'coderabbitai[bot]'
            );

            if (!coderabbitReview) {
              core.setFailed('CodeRabbit review not found');
              return;
            }

            if (coderabbitReview.state === 'CHANGES_REQUESTED') {
              core.setFailed('CodeRabbit requested changes');
            }
```

### Usage in Development Workflow

#### 1. Pull Request Template

Create `.github/pull_request_template.md`:

```markdown
## Description
<!-- Describe your changes -->

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Performance improvement
- [ ] Refactoring
- [ ] Documentation update

## Sponsor Integrations
<!-- Check all that apply -->
- [ ] TanStack Start (server functions, loaders)
- [ ] Convex (queries, mutations, subscriptions)
- [ ] Cloudflare AI (quote generation, insights)
- [ ] Firecrawl (quote scraping)
- [ ] Sentry (error tracking)

## Testing
<!-- Describe testing performed -->
- [ ] Manual testing completed
- [ ] Error cases handled
- [ ] Performance tested

## CodeRabbit Review
<!-- CodeRabbit will automatically review this PR -->
- [ ] Addressed CodeRabbit suggestions
- [ ] Explained disagreements with suggestions

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex logic
- [ ] No console.log statements (use proper logging)
- [ ] Sentry tracking added for errors
```

#### 2. Review Response Workflow

When CodeRabbit posts a review:

1. **Critical Issues**: Must be fixed before merge
   - Security vulnerabilities
   - Data integrity issues
   - Breaking changes

2. **High Priority**: Should be addressed
   - Performance problems
   - Missing error handling
   - Accessibility issues

3. **Medium Priority**: Consider addressing
   - Code style improvements
   - Better naming
   - Refactoring suggestions

4. **Low Priority**: Optional
   - Micro-optimizations
   - Alternative approaches
   - Nice-to-have improvements

#### 3. Feedback Loop

Reply to CodeRabbit comments:

```
Agree: "✅ Fixed in [commit hash]"
Disagree: "❌ I chose this approach because..."
Question: "❓ Can you clarify why this is problematic?"
```

CodeRabbit learns from responses and improves future reviews.

### Best Practices

1. **Enable CodeRabbit Early**: Set up before first PR
2. **Review Settings Carefully**: Adjust confidence thresholds
3. **Provide Feedback**: Help CodeRabbit learn project patterns
4. **Don't Auto-Merge**: Always review CodeRabbit suggestions
5. **Custom Rules**: Add project-specific patterns as they emerge

---

## 5. Cloudflare Workers Deployment

### Overview
Deploy QuoteJourney to Cloudflare Workers for edge computing, low latency, and built-in AI capabilities.

### Deployment Configuration

#### wrangler.toml

```toml
# wrangler.toml
name = "quote-journey"
main = "./dist/server/index.js"
compatibility_date = "2024-11-01"

# Account info
account_id = "your_account_id"

# Worker settings
workers_dev = true
route = "https://wolf.topangasoft.workers.dev/*"

# AI Binding
[ai]
binding = "AI"

# KV Namespaces (for caching)
[[kv_namespaces]]
binding = "CACHE"
id = "your_kv_namespace_id"
preview_id = "your_preview_kv_namespace_id"

# D1 Database (optional, for quote storage)
[[d1_databases]]
binding = "DB"
database_name = "quote-journey-db"
database_id = "your_d1_database_id"

# Environment Variables
[vars]
ENVIRONMENT = "production"
CONVEX_URL = "https://your-convex-deployment.convex.cloud"

# Secrets (set via wrangler secret put)
# FIRECRAWL_API_KEY
# SENTRY_DSN
# ADMIN_API_KEY

# Build configuration
[build]
command = "npm run build"

[build.upload]
format = "service-worker"
dir = "dist"
main = "./dist/server/index.js"

# Routes
[[routes]]
pattern = "wolf.topangasoft.workers.dev/*"
zone_name = "topangasoft.workers.dev"

# Custom domains (optional)
# [[routes]]
# pattern = "quotejourney.com/*"
# zone_name = "quotejourney.com"
```

#### Environment Variables Setup

```bash
# Set secrets (not stored in wrangler.toml)
wrangler secret put FIRECRAWL_API_KEY
wrangler secret put SENTRY_DSN
wrangler secret put ADMIN_API_KEY
wrangler secret put CONVEX_DEPLOYMENT_URL

# Verify secrets
wrangler secret list
```

### Build Process

#### package.json scripts

```json
{
  "scripts": {
    "dev": "tanstack-start dev",
    "build": "tanstack-start build && npm run build:worker",
    "build:worker": "node scripts/build-worker.js",
    "deploy": "npm run build && wrangler deploy",
    "deploy:preview": "npm run build && wrangler deploy --env preview",
    "preview": "wrangler dev",
    "cf-typegen": "wrangler types"
  }
}
```

#### Worker Build Script

```javascript
// scripts/build-worker.js
import { build } from 'esbuild'
import { readFileSync, writeFileSync } from 'fs'

async function buildWorker() {
  console.log('Building Cloudflare Worker...')

  // Build the worker entry point
  await build({
    entryPoints: ['src/worker/index.ts'],
    bundle: true,
    format: 'esm',
    target: 'esnext',
    platform: 'browser',
    outfile: 'dist/server/index.js',
    minify: process.env.NODE_ENV === 'production',
    sourcemap: true,
    external: ['__STATIC_CONTENT_MANIFEST'],
    define: {
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production'),
    },
  })

  console.log('Worker build complete!')
}

buildWorker().catch(console.error)
```

### Worker Entry Point

```typescript
// src/worker/index.ts
import { createRequestHandler } from '@tanstack/start/server'
import { initServerSentry } from '~/lib/sentry-server'

export interface Env {
  AI: any
  CACHE: KVNamespace
  DB: D1Database
  FIRECRAWL_API_KEY: string
  SENTRY_DSN: string
  CONVEX_URL: string
  ADMIN_API_KEY: string
}

// Main worker fetch handler
export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext
  ): Promise<Response> {
    // Initialize Sentry for error tracking
    const sentry = initServerSentry(request, env, ctx)

    try {
      // Serve static assets from KV
      if (request.url.includes('/assets/')) {
        return handleStaticAsset(request, env)
      }

      // Handle API routes
      if (request.url.includes('/api/')) {
        return handleAPIRoute(request, env, ctx)
      }

      // TanStack Start request handler for SSR
      const handler = createRequestHandler({
        build: await import('../client/ssr-build.js'),
        getLoadContext: () => ({
          cloudflare: {
            env,
            ctx,
          },
          sentry,
        }),
      })

      return handler(request)
    } catch (error) {
      sentry.captureException(error)

      return new Response('Internal Server Error', {
        status: 500,
        headers: {
          'Content-Type': 'text/plain',
        },
      })
    }
  },
}

async function handleStaticAsset(
  request: Request,
  env: Env
): Promise<Response> {
  const url = new URL(request.url)
  const cacheKey = url.pathname

  // Check KV cache
  const cached = await env.CACHE.get(cacheKey, {
    type: 'arrayBuffer',
    cacheTtl: 3600,
  })

  if (cached) {
    return new Response(cached, {
      headers: {
        'Content-Type': getContentType(cacheKey),
        'Cache-Control': 'public, max-age=3600',
      },
    })
  }

  return new Response('Not Found', { status: 404 })
}

async function handleAPIRoute(
  request: Request,
  env: Env,
  ctx: ExecutionContext
): Promise<Response> {
  const url = new URL(request.url)

  // Route to appropriate handler
  if (url.pathname.startsWith('/api/generate-quotes')) {
    return handleGenerateQuotes(request, env)
  }

  if (url.pathname.startsWith('/api/analyze-journey')) {
    return handleAnalyzeJourney(request, env)
  }

  return new Response('Not Found', { status: 404 })
}

function getContentType(path: string): string {
  if (path.endsWith('.js')) return 'application/javascript'
  if (path.endsWith('.css')) return 'text/css'
  if (path.endsWith('.html')) return 'text/html'
  if (path.endsWith('.json')) return 'application/json'
  if (path.endsWith('.png')) return 'image/png'
  if (path.endsWith('.jpg') || path.endsWith('.jpeg')) return 'image/jpeg'
  if (path.endsWith('.svg')) return 'image/svg+xml'
  if (path.endsWith('.woff2')) return 'font/woff2'
  return 'application/octet-stream'
}
```

### Caching Strategy

```typescript
// src/worker/cache-strategy.ts

export class WorkerCache {
  constructor(private kv: KVNamespace) {}

  /**
   * Cache AI-generated quotes
   */
  async cacheQuotes(key: string, quotes: any[], ttl: number = 3600) {
    await this.kv.put(
      `quotes:${key}`,
      JSON.stringify(quotes),
      {
        expirationTtl: ttl,
        metadata: {
          cached_at: Date.now(),
        },
      }
    )
  }

  async getCachedQuotes(key: string): Promise<any[] | null> {
    const value = await this.kv.get(`quotes:${key}`, 'json')
    return value as any[] | null
  }

  /**
   * Cache user journey data
   */
  async cacheJourney(sessionId: string, journey: any, ttl: number = 7200) {
    await this.kv.put(
      `journey:${sessionId}`,
      JSON.stringify(journey),
      {
        expirationTtl: ttl,
      }
    )
  }

  async getCachedJourney(sessionId: string): Promise<any | null> {
    const value = await this.kv.get(`journey:${sessionId}`, 'json')
    return value
  }

  /**
   * Cache static assets
   */
  async cacheAsset(path: string, content: ArrayBuffer, ttl: number = 86400) {
    await this.kv.put(path, content, {
      expirationTtl: ttl,
      metadata: {
        content_type: getContentType(path),
      },
    })
  }
}
```

### GitHub Actions Deployment

```yaml
# .github/workflows/deploy.yml
name: Deploy to Cloudflare Workers

on:
  push:
    branches:
      - main
  workflow_dispatch:

permissions:
  contents: read
  deployments: write

jobs:
  deploy:
    runs-on: ubuntu-latest
    name: Deploy to Cloudflare Workers

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test

      - name: Build application
        run: npm run build
        env:
          NODE_ENV: production

      - name: Deploy to Cloudflare Workers
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          command: deploy

      - name: Notify Sentry of deployment
        run: |
          curl -sL https://sentry.io/api/0/organizations/${{ secrets.SENTRY_ORG }}/releases/ \
            -X POST \
            -H "Authorization: Bearer ${{ secrets.SENTRY_AUTH_TOKEN }}" \
            -H "Content-Type: application/json" \
            -d '{
              "version": "'${{ github.sha }}'",
              "projects": ["'${{ secrets.SENTRY_PROJECT }}'"]
            }'
```

### Preview Deployments

```yaml
# .github/workflows/preview.yml
name: Preview Deployment

on:
  pull_request:
    branches:
      - main

jobs:
  preview:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      - name: Deploy preview
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          command: deploy --env preview

      - name: Comment preview URL
        uses: actions/github-script@v7
        with:
          script: |
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: `🚀 Preview deployment ready!\n\nURL: https://preview.wolf.topangasoft.workers.dev\n\nCommit: ${context.sha}`
            })
```

### Monitoring & Analytics

```typescript
// src/worker/analytics.ts

export function trackWorkerMetrics(
  request: Request,
  response: Response,
  startTime: number
) {
  const duration = Date.now() - startTime

  // Log to Cloudflare Analytics
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    method: request.method,
    url: request.url,
    status: response.status,
    duration,
    cf: {
      colo: request.cf?.colo,
      country: request.cf?.country,
    },
  }))
}
```

---

## 6. Autumn (Optional)

### Overview
Autumn provides payment infrastructure for premium features in QuoteJourney. This integration is optional but can monetize the app.

### Premium Features

1. **Premium Journey Insights**
   - Deeper AI analysis
   - Personality profile reports
   - Export journey as PDF

2. **Custom Quote Collections**
   - Create private quote collections
   - Share curated collections
   - Import quotes from personal sources

3. **Advanced Customization**
   - Custom themes and colors
   - Personal audio selections
   - Ad-free experience

4. **Analytics Dashboard**
   - Journey statistics
   - Reading patterns
   - Mood tracking over time

### Setup Configuration

```typescript
// src/lib/autumn-client.ts
import { AutumnClient } from '@autumn-js/client'

export const autumnClient = new AutumnClient({
  apiKey: process.env.AUTUMN_API_KEY!,
  environment: process.env.NODE_ENV === 'production' ? 'production' : 'sandbox',
})

export const PREMIUM_PLANS = {
  monthly: {
    id: 'premium_monthly',
    name: 'Premium Monthly',
    price: 4.99,
    interval: 'month',
    features: [
      'Unlimited AI insights',
      'Custom quote collections',
      'Advanced customization',
      'Analytics dashboard',
      'Ad-free experience',
    ],
  },
  yearly: {
    id: 'premium_yearly',
    name: 'Premium Yearly',
    price: 49.99,
    interval: 'year',
    features: [
      'All monthly features',
      '2 months free',
      'Priority support',
      'Early access to new features',
    ],
  },
} as const
```

### Payment Flow

```typescript
// app/routes/api/create-checkout.ts
import { createServerFn } from '@tanstack/start'
import { z } from 'zod'
import { autumnClient, PREMIUM_PLANS } from '~/lib/autumn-client'

const CheckoutSchema = z.object({
  plan: z.enum(['monthly', 'yearly']),
  userId: z.string(),
  email: z.string().email(),
})

export const createCheckoutSession = createServerFn({ method: 'POST' })
  .validator(CheckoutSchema)
  .handler(async ({ data }) => {
    const plan = PREMIUM_PLANS[data.plan]

    try {
      const session = await autumnClient.checkout.create({
        customer_email: data.email,
        success_url: `${process.env.APP_URL}/premium/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.APP_URL}/premium`,
        metadata: {
          user_id: data.userId,
          plan_id: plan.id,
        },
        line_items: [
          {
            price_data: {
              currency: 'usd',
              unit_amount: Math.round(plan.price * 100),
              recurring: {
                interval: plan.interval,
              },
              product_data: {
                name: plan.name,
                description: plan.features.join(', '),
              },
            },
            quantity: 1,
          },
        ],
        mode: 'subscription',
      })

      return {
        success: true,
        checkoutUrl: session.url,
      }
    } catch (error) {
      console.error('Checkout creation failed:', error)
      return {
        success: false,
        error: 'Failed to create checkout session',
      }
    }
  })
```

### Webhook Handling

```typescript
// app/routes/api/webhooks/autumn.ts
import { createServerFn } from '@tanstack/start'
import { autumnClient } from '~/lib/autumn-client'
import { api } from '~/convex/_generated/api'

export const handleAutumnWebhook = createServerFn({ method: 'POST' })
  .handler(async ({ request, context }) => {
    const signature = request.headers.get('autumn-signature')
    const body = await request.text()

    try {
      const event = autumnClient.webhooks.constructEvent(
        body,
        signature!,
        process.env.AUTUMN_WEBHOOK_SECRET!
      )

      switch (event.type) {
        case 'checkout.session.completed':
          await handleCheckoutComplete(event.data, context)
          break

        case 'subscription.created':
          await handleSubscriptionCreated(event.data, context)
          break

        case 'subscription.cancelled':
          await handleSubscriptionCancelled(event.data, context)
          break

        case 'payment.failed':
          await handlePaymentFailed(event.data, context)
          break
      }

      return new Response(JSON.stringify({ received: true }), {
        status: 200,
      })
    } catch (error) {
      console.error('Webhook handling failed:', error)
      return new Response('Webhook error', { status: 400 })
    }
  })

async function handleCheckoutComplete(data: any, context: any) {
  const userId = data.metadata.user_id
  const planId = data.metadata.plan_id

  // Update user's premium status in Convex
  await context.convex.mutation(api.users.upgradeToPremium, {
    userId,
    planId,
    subscriptionId: data.subscription,
  })
}

async function handleSubscriptionCreated(data: any, context: any) {
  // Additional subscription setup
}

async function handleSubscriptionCancelled(data: any, context: any) {
  const userId = data.metadata.user_id

  await context.convex.mutation(api.users.cancelPremium, {
    userId,
  })
}

async function handlePaymentFailed(data: any, context: any) {
  // Notify user of payment failure
  // Could use Sentry to track
}
```

### Premium Feature Gating

```typescript
// src/lib/premium-check.ts
import { useQuery } from 'convex/react'
import { api } from '~/convex/_generated/api'

export function usePremiumStatus(userId: string) {
  const profile = useQuery(api.users.getProfile, { userId })

  return {
    isPremium: profile?.premium?.active ?? false,
    plan: profile?.premium?.plan,
    expiresAt: profile?.premium?.expiresAt,
  }
}

export function usePremiumFeature(
  featureName: string,
  userId: string
): { allowed: boolean; reason?: string } {
  const { isPremium } = usePremiumStatus(userId)

  if (isPremium) {
    return { allowed: true }
  }

  return {
    allowed: false,
    reason: `This feature requires a Premium subscription`,
  }
}
```

### Premium UI Component

```typescript
// src/components/PremiumGate.tsx
import { usePremiumStatus } from '~/lib/premium-check'

interface PremiumGateProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  feature: string
}

export function PremiumGate({
  children,
  fallback,
  feature,
}: PremiumGateProps) {
  const { isPremium } = usePremiumStatus()

  if (isPremium) {
    return <>{children}</>
  }

  return (
    fallback || (
      <div className="premium-gate">
        <div className="premium-prompt">
          <h3>🌟 Premium Feature</h3>
          <p>{feature} is available with Premium</p>
          <a href="/premium" className="upgrade-button">
            Upgrade to Premium
          </a>
        </div>
      </div>
    )
  )
}
```

### Usage Example

```typescript
// In a component
<PremiumGate feature="Advanced Journey Insights">
  <AdvancedInsightsPanel />
</PremiumGate>
```

### Environment Variables

```bash
# .env.local
AUTUMN_API_KEY=your_autumn_api_key
AUTUMN_WEBHOOK_SECRET=your_webhook_secret
APP_URL=https://wolf.topangasoft.workers.dev
```

---

## Integration Testing Checklist

### Pre-Deployment Testing

- [ ] **Cloudflare AI**
  - [ ] Quote generation returns 4 valid quotes
  - [ ] Insights generation completes within 5 seconds
  - [ ] Embeddings are 768-dimensional arrays
  - [ ] Fallback works when AI fails
  - [ ] Rate limiting prevents abuse

- [ ] **Firecrawl**
  - [ ] Scrapes quotes from all target sources
  - [ ] Parsing correctly extracts quote + author
  - [ ] Duplicate detection works
  - [ ] Quality filtering removes garbage
  - [ ] Respects rate limits

- [ ] **Sentry**
  - [ ] Errors are tracked with full context
  - [ ] Performance metrics are recorded
  - [ ] Source maps work in production
  - [ ] User feedback dialog appears
  - [ ] Breadcrumbs capture user journey

- [ ] **CodeRabbit**
  - [ ] Reviews are posted on PRs
  - [ ] Custom rules are enforced
  - [ ] Can respond to CodeRabbit comments
  - [ ] CI integration blocks bad code

- [ ] **Cloudflare Workers**
  - [ ] Deploys successfully
  - [ ] Environment variables are set
  - [ ] KV caching works
  - [ ] SSR renders correctly
  - [ ] API routes respond

- [ ] **Autumn** (if implemented)
  - [ ] Checkout flow completes
  - [ ] Webhooks are received
  - [ ] Premium status updates
  - [ ] Feature gating works

---

## Troubleshooting

### Common Issues

#### Cloudflare AI

**Issue**: "Model not found"
**Solution**: Verify model name matches exactly: `@cf/meta/llama-3.1-8b-instruct`

**Issue**: Rate limit errors
**Solution**: Implement caching and rate limiting on your end

#### Firecrawl

**Issue**: Empty results from scraping
**Solution**: Check if website structure changed, update parsing patterns

**Issue**: Rate limit exceeded
**Solution**: Add delays between requests, use batch operations

#### Sentry

**Issue**: No source maps in production
**Solution**: Verify Sentry Vite plugin is configured and auth token is set

**Issue**: Too many events
**Solution**: Adjust sample rates and add ignore patterns

#### Cloudflare Workers

**Issue**: "Module not found" errors
**Solution**: Check esbuild externals configuration

**Issue**: KV namespace not found
**Solution**: Verify KV namespace IDs in wrangler.toml

---

## Performance Optimization

### Caching Strategy Summary

| Data Type | Cache Location | TTL | Invalidation |
|-----------|---------------|-----|--------------|
| AI-generated quotes | KV + Redis | 1 hour | On user feedback |
| Scraped quotes | Convex + KV | 24 hours | Manual purge |
| Journey data | Convex realtime | N/A | Real-time |
| Static assets | KV + CDN | 7 days | On deploy |
| User insights | Convex | Permanent | Never |

### Cost Optimization

1. **Cloudflare AI**: Cache aggressively, use embeddings for similarity
2. **Firecrawl**: Scrape in batches, schedule during off-peak
3. **Sentry**: Adjust sample rates, filter noise
4. **Cloudflare Workers**: Use KV caching, minimize cold starts

---

## Next Steps

1. **Complete Setup**: Follow each integration's setup instructions
2. **Test Locally**: Verify all integrations work in development
3. **Deploy Preview**: Test in production-like environment
4. **Monitor**: Watch Sentry for errors, check logs
5. **Optimize**: Adjust caching and rate limits based on usage
6. **Document**: Keep this guide updated as integrations evolve

---

*Last Updated: 2024-11-12*
*Maintained by: QuoteJourney Development Team*
