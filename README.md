# QuoteJourney

An immersive, meditative quote exploration app built for the TanStack Start + Convex Hackathon.

![QuoteJourney](https://img.shields.io/badge/Hackathon-TanStack%20%2B%20Convex-blueviolet)
![Deadline](https://img.shields.io/badge/Deadline-Nov%2017%2C%202024-red)

## Overview

QuoteJourney is an infinite AI-powered journey through inspiring quotes. Users can explore wisdom from great thinkers, discover related quotes, and build personalized collections. The app features rich animations, smooth transitions, and a beautiful, responsive design.

**Live Demo**: https://wolf.topangasoft.workers.dev

## Tech Stack

This project uses all the required hackathon technologies:

- **TanStack Start** - React SSR framework with file-based routing
- **Convex** - Real-time serverless database and backend
- **Cloudflare Workers + AI** - Deployment platform and AI features (coming in Phase 2)
- **Firecrawl** - Quote scraping from web sources
- **Tailwind CSS 4** - Modern styling with animations
- **Sentry** - Error tracking (coming in Phase 4)

## Features

### Phase 1 (Current) ✅
- Beautiful landing page with animated quote grid
- Browse quotes by category
- Journey flow: click a quote → see 3 related options → repeat
- Real-time view and like tracking
- Fully responsive design
- Dark mode support

### Phase 2 (Coming Soon)
- AI-powered semantic search
- Personalized recommendations
- Smart quote embeddings

### Phase 3 (Coming Soon)
- Advanced animations and transitions
- Sound effects
- Micro-interactions
- Performance optimizations

### Phase 4 (Coming Soon)
- Production deployment
- Error tracking with Sentry
- Analytics
- Demo video

## Getting Started

### Prerequisites

- Node.js 18+
- npm or pnpm
- Convex account (free at https://convex.dev)
- Firecrawl API key (optional, for scraping)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd wolf
```

2. Install dependencies:
```bash
npm install
```

3. Set up Convex:
```bash
npx convex dev
```

This will:
- Prompt you to log in or create a Convex account
- Create a new Convex project
- Deploy your schema and functions

4. Seed the database with quotes:

Open the Convex dashboard (https://dashboard.convex.dev), go to Functions, and run:
```javascript
scraping.seedDatabase()
```

This will add 50+ inspiring quotes across different categories.

5. Start the development server:
```bash
npm run dev
```

6. Open http://localhost:3000

### Environment Variables

If you want to use Firecrawl for scraping additional quotes:

```bash
# In Convex dashboard or via CLI
npx convex env set FIRECRAWL_API_KEY your_api_key_here
```

Get your Firecrawl API key at https://firecrawl.dev

## Project Structure

```
wolf/
├── convex/                 # Convex backend
│   ├── schema.ts          # Database schema
│   ├── quotes.ts          # Quote queries/mutations
│   ├── journeys.ts        # Journey tracking
│   └── scraping.ts        # Web scraping with Firecrawl
├── src/
│   ├── routes/            # TanStack Start routes
│   │   ├── index.tsx      # Landing page
│   │   └── journey/
│   │       └── $quoteId.tsx # Journey detail page
│   └── styles/
│       └── app.css        # Tailwind styles
├── docs/                  # Documentation
│   ├── DATA_MODEL.md      # Database schema docs
│   ├── API.md             # API reference
│   └── SETUP.md           # Setup guide
└── PLAN.md                # Master plan & roadmap
```

## Database Schema

### quotes
- text, author, source, category
- tags[], views, likes
- Indexed by category and author

### journeys
- userId, quotes[], timestamps
- Tracks user journey sessions

### userProfiles
- userId, favoriteQuotes[], preferences
- Personalization data

See [docs/DATA_MODEL.md](docs/DATA_MODEL.md) for full schema details.

## API

### Queries
- `quotes.list` - List quotes with filtering
- `quotes.getById` - Get single quote
- `quotes.getRandomThree` - Get 3 related quotes
- `journeys.getCurrent` - Get active journey

### Mutations
- `quotes.create` - Add new quote
- `quotes.incrementViews` - Track views
- `quotes.toggleLike` - Like/unlike quote
- `journeys.create` - Start new journey

### Actions
- `scraping.seedDatabase` - Seed with curated quotes
- `scraping.scrapeQuotes` - Scrape from URL with Firecrawl

See [docs/API.md](docs/API.md) for full API reference.

## Development

### Run Convex in development mode:
```bash
npm run dev:convex
```

### Run web server:
```bash
npm run dev:web
```

### Run both concurrently:
```bash
npm run dev
```

### Format code:
```bash
npm run format
```

### Lint:
```bash
npm run lint
```

## Deployment

This project is deployed to Cloudflare Workers.

```bash
npm run build
# Deploy to Cloudflare Workers
```

## Contributing

This is a hackathon project with a tight deadline (Nov 17, 2024). Focus is on rapid iteration and feature completion.

## License

MIT

## Acknowledgments

Built for the TanStack Start + Convex Hackathon. Thanks to:
- TanStack team for the amazing Start framework
- Convex team for the real-time database
- Cloudflare for Workers and AI
- Firecrawl for web scraping capabilities

---

**Status**: Phase 1 Complete ✅ | Next: AI Integration (Phase 2)
