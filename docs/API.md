# QuoteJourney API Reference

## Convex Server Functions

### Queries

#### `quotes.list`
List quotes with optional filtering.

```typescript
Args: {
  limit?: number,        // Max quotes to return (default: 20)
  category?: string,     // Filter by category
  author?: string        // Filter by author
}
Returns: Quote[]
```

#### `quotes.getById`
Get a single quote by ID.

```typescript
Args: {
  id: string            // Quote ID
}
Returns: Quote | null
```

#### `quotes.getRandomThree`
Get 3 random quotes, optionally related to a given quote.

```typescript
Args: {
  relatedTo?: string,   // Optional quote ID to find related quotes
  category?: string     // Optional category filter
}
Returns: Quote[]
```

#### `journeys.getCurrent`
Get the current active journey for a user.

```typescript
Args: {
  userId?: string       // Optional user ID
}
Returns: Journey | null
```

### Mutations

#### `quotes.create`
Create a new quote.

```typescript
Args: {
  text: string,
  author: string,
  source?: string,
  category: string,
  tags: string[],
  scrapedFrom?: string
}
Returns: string (quote ID)
```

#### `quotes.incrementViews`
Increment view count for a quote.

```typescript
Args: {
  id: string            // Quote ID
}
Returns: void
```

#### `quotes.toggleLike`
Toggle like status for a quote.

```typescript
Args: {
  id: string,           // Quote ID
  userId?: string       // Optional user ID
}
Returns: void
```

#### `journeys.create`
Start a new journey.

```typescript
Args: {
  userId?: string,      // Optional user ID
  startQuoteId: string  // First quote in journey
}
Returns: string (journey ID)
```

#### `journeys.addQuote`
Add a quote to an existing journey.

```typescript
Args: {
  journeyId: string,    // Journey ID
  quoteId: string       // Quote to add
}
Returns: void
```

### Actions

#### `scraping.scrapeQuotes`
Scrape quotes from various sources using Firecrawl.

```typescript
Args: {
  sources: string[],    // Array of URLs to scrape
  category?: string     // Category to assign
}
Returns: {
  success: number,      // Count of successfully scraped quotes
  failed: number        // Count of failed scrapes
}
```

#### `scraping.seedDatabase`
Seed database with initial quote collection.

```typescript
Args: {}
Returns: {
  quotesAdded: number   // Total quotes added
}
```

## REST API (Future)

To be implemented for external integrations.
