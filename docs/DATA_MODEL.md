# QuoteJourney Data Model

## Convex Schema Tables

### quotes
Stores all quotes in the system.

```typescript
{
  text: string,              // The quote text
  author: string,            // Author name
  source?: string,           // Optional source (book, speech, etc.)
  category: string,          // Category (wisdom, motivation, love, etc.)
  tags: string[],            // Array of tags for better filtering
  scrapedFrom?: string,      // URL if scraped from web
  likes: number,             // Like count (default: 0)
  views: number,             // View count (default: 0)
  _creationTime: number      // Auto-generated timestamp
}
```

### journeys
Tracks user journey sessions through quotes.

```typescript
{
  userId?: string,           // Optional user ID (null for anonymous)
  quotes: string[],          // Array of quote IDs in order visited
  startedAt: number,         // Timestamp when journey started
  lastActiveAt: number,      // Last interaction timestamp
  isActive: boolean,         // Whether journey is still ongoing
  totalDuration?: number,    // Total time spent (when completed)
  _creationTime: number      // Auto-generated timestamp
}
```

### userProfiles
Stores user preferences and personalization data.

```typescript
{
  userId: string,            // Unique user ID from auth
  name?: string,             // Optional display name
  favoriteQuotes: string[],  // Array of favorited quote IDs
  categories: string[],      // Preferred categories
  totalJourneys: number,     // Count of journeys completed
  joinedAt: number,          // When user first used the app
  _creationTime: number      // Auto-generated timestamp
}
```

## Indexes

For optimal query performance:
- `quotes.by_category` - Index on category
- `quotes.by_author` - Index on author
- `journeys.by_userId` - Index on userId
- `userProfiles.by_userId` - Index on userId
