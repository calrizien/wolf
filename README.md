# QuoteJourney ✨

> An immersive, AI-powered journey through wisdom and inspiration

[![Hackathon](https://img.shields.io/badge/Hackathon-TanStack%20%2B%20Convex-blueviolet)](https://tanstack.com)
[![Live Demo](https://img.shields.io/badge/Demo-Live-success)](https://wolf.topangasoft.workers.dev)
[![Built with](https://img.shields.io/badge/Built%20with-TanStack%20Start-orange)](https://tanstack.com/start)
[![Powered by](https://img.shields.io/badge/Powered%20by-Convex-blue)](https://convex.dev)

## 🌟 Overview

QuoteJourney transforms quote browsing into an infinite, AI-powered exploration. Click any quote to discover 3 semantically related quotes, creating a personalized journey through wisdom. Built for the TanStack Start + Convex Hackathon.

**🚀 Live Demo**: [wolf.topangasoft.workers.dev](https://wolf.topangasoft.workers.dev)

### Key Highlights

- 🤖 **AI-Powered Discovery** - Semantic search finds quotes by meaning using Cloudflare AI
- ✨ **Beautiful Animations** - Smooth, GPU-accelerated micro-interactions
- 🎯 **Infinite Journeys** - Explore endlessly with AI recommendations
- 💡 **Smart Insights** - Llama 3 generates personalized wisdom
- 🌓 **Dark Mode** - Fully supported throughout
- 📱 **Responsive** - Perfect on any device

## 🎥 Quick Demo

1. **Browse** - See curated quotes with animated cards
2. **Click** - Start your journey with any quote
3. **Discover** - AI finds 3 related quotes by meaning
4. **Continue** - Keep exploring infinitely
5. **Enjoy** - AI insights and smooth animations throughout

## Tech Stack

This project uses all the required hackathon technologies:

- **TanStack Start** - React SSR framework with file-based routing
- **Convex** - Real-time serverless database and backend
- **Cloudflare Workers + AI** - Deployment platform and AI features
- **Firecrawl** - Quote scraping from web sources
- **Tailwind CSS 4** - Modern styling with animations
- **Sentry** - Error tracking (planned for future)

## Features

### Phase 1 ✅
- Beautiful landing page with animated quote grid
- Browse quotes by category
- Journey flow: click a quote → see 3 related options → repeat
- Real-time view and like tracking
- Fully responsive design
- Dark mode support

### Phase 2 ✅
- **AI-powered semantic search** - Find quotes by meaning, not just keywords
- **Cloudflare AI embeddings** - Vector embeddings using @cf/baai/bge-base-en-v1.5
- **AI-generated insights** - Personalized wisdom using Llama 3
- **Smart recommendations** - Cosine similarity matching for related quotes
- **Favorites system** - Save and organize favorite quotes
- **Fallback support** - Gracefully degrades to category-based search

### Phase 3 (Current) ✅
- **Advanced animations** - Smooth fade-ins, scales, and staggered reveals
- **Loading states** - Beautiful skeleton screens prevent layout shift
- **Error boundaries** - Graceful error handling throughout the app
- **Micro-interactions** - Hover effects, button states, animated indicators
- **Performance optimized** - All animations use GPU-accelerated transforms
- **Toast notifications** - Reusable toast system for user feedback
- **Professional polish** - Attention to detail in every interaction

### Phase 4 (Current) ✅
- **Production Deployment** - Live on Cloudflare Workers
- **Comprehensive Documentation** - Deployment guides, API docs, contributing guide
- **Hackathon Submission** - Complete submission package
- **Error Boundaries** - Robust error handling throughout

## 🚀 Quick Start

### For Hackathon Judges & Reviewers

**Already deployed!** Just visit: [wolf.topangasoft.workers.dev](https://wolf.topangasoft.workers.dev)

No setup required - experience the full app immediately!

### For Developers

#### Prerequisites

- Node.js 18+
- npm or pnpm
- Convex account (free at https://convex.dev)
- Cloudflare account (free tier - for AI features)

#### 5-Minute Setup

1. Clone and install:
```bash
git clone <repository-url>
cd wolf
npm install
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

**Required for Phase 2 AI Features:**

```bash
# In Convex dashboard or via CLI
npx convex env set CLOUDFLARE_ACCOUNT_ID your_account_id
npx convex env set CLOUDFLARE_API_TOKEN your_api_token
```

Get your Cloudflare credentials at https://dash.cloudflare.com

**Optional for scraping additional quotes:**

```bash
npx convex env set FIRECRAWL_API_KEY your_api_key_here
```

Get your Firecrawl API key at https://firecrawl.dev

### Convex environments

- Production builds read from `.env.production`, which now pins `VITE_CONVEX_URL=https://keen-bullfrog-361.convex.cloud` (the seeded prod deployment).
- For local tweaks, copy `.env.production` to `.env.development.local` or `.env.local` and change `VITE_CONVEX_URL` to a different Convex deployment.
- Keep `CONVEX_DEPLOYMENT` inside your local-only env file so `npx convex dev` still points at your preferred dev deployment while the UI hits prod data by default.

See [docs/SETUP.md](docs/SETUP.md) for detailed setup instructions.

## Project Structure

```
wolf/
├── convex/                 # Convex backend
│   ├── schema.ts          # Database schema
│   ├── quotes.ts          # Quote queries/mutations
│   ├── journeys.ts        # Journey tracking
│   ├── favorites.ts       # Favorites & user profiles
│   ├── ai.ts              # Cloudflare AI integration
│   └── scraping.ts        # Web scraping with Firecrawl
├── src/
│   ├── routes/            # TanStack Start routes
│   │   ├── index.tsx      # Landing page
│   │   └── journey/
│   │       └── $quoteId.tsx # Journey detail with AI
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
- **embedding[]** - Vector embeddings for semantic search
- **aiInsight** - AI-generated insights
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
- `favorites.isFavorited` - Check if quote is favorited
- `favorites.getFavorites` - Get user's favorite quotes

### Mutations
- `quotes.create` - Add new quote
- `quotes.updateAIData` - Update embeddings and insights
- `quotes.incrementViews` - Track views
- `quotes.toggleLike` - Like/unlike quote
- `journeys.create` - Start new journey
- `favorites.toggleFavorite` - Add/remove from favorites

### Actions (AI-Powered)
- `ai.generateQuoteEmbedding` - Generate embedding for one quote
- `ai.generateAllEmbeddings` - Process all quotes with AI
- `ai.findSimilarQuotes` - Semantic similarity search
- `ai.getPersonalizedRecommendations` - User-based recommendations
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

## 📚 Documentation

- **[HACKATHON.md](HACKATHON.md)** - Complete hackathon submission details
- **[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)** - Cloudflare Workers deployment guide
- **[docs/SETUP.md](docs/SETUP.md)** - Environment setup and configuration
- **[docs/DATA_MODEL.md](docs/DATA_MODEL.md)** - Database schema documentation
- **[docs/API.md](docs/API.md)** - Convex API reference
- **[CONTRIBUTING.md](CONTRIBUTING.md)** - Contribution guidelines
- **[PLAN.md](PLAN.md)** - Development roadmap and phases

## 🤝 Contributing

Contributions are welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

This project was built for the TanStack Start + Convex Hackathon (Nov 2024).

## License

MIT

## Acknowledgments

Built for the TanStack Start + Convex Hackathon. Thanks to:
- TanStack team for the amazing Start framework
- Convex team for the real-time database
- Cloudflare for Workers and AI
- Firecrawl for web scraping capabilities

---

## 🎯 Project Status

**Status**: ✅ **Complete & Production Ready**

All 4 development phases complete:
- ✅ Phase 1: Core Setup
- ✅ Phase 2: AI Integration
- ✅ Phase 3: Polish & Animations
- ✅ Phase 4: Deployment & Documentation

**Live Demo**: [wolf.topangasoft.workers.dev](https://wolf.topangasoft.workers.dev)

## 🏆 Hackathon Submission

See [HACKATHON.md](HACKATHON.md) for complete submission details including:
- Technical implementation
- Innovation highlights
- Feature showcase
- Architecture overview
- Code quality metrics

## 💡 What Makes QuoteJourney Special

### 1. Genuine AI Integration
Not just a checkbox - AI genuinely improves the experience with semantic search that understands meaning, not just keywords.

### 2. Professional Polish
Every interaction is smooth, every animation is GPU-accelerated, every edge case is handled gracefully.

### 3. Robust Architecture
Error boundaries, loading states, fallbacks - the app never breaks, always provides a great experience.

### 4. Production Ready
Deployed, tested, documented, and ready to scale. Not just a demo - a real app.
