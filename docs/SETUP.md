# QuoteJourney Setup Guide

## Environment Variables

### Convex Environment Variables

Set up environment variables in your Convex deployment:

```bash
# Set Firecrawl API key
npx convex env set FIRECRAWL_API_KEY your_api_key_here
```

Or configure via the Convex Dashboard at https://dashboard.convex.dev

### Local Development

Create a `.env.local` file (already created) and add:
```
FIRECRAWL_API_KEY=your_api_key_here
```

## Getting API Keys

### Firecrawl
1. Visit https://firecrawl.dev
2. Sign up for an account
3. Get your API key from the dashboard
4. Add to Convex environment variables

## Running the Project

1. Install dependencies:
```bash
npm install
```

2. Set up Convex (if not already done):
```bash
npx convex dev
```

3. Seed the database:
Open Convex dashboard, go to Functions, and run:
```
scraping.seedDatabase()
```

4. Start the development server:
```bash
npm run dev
```

5. Open http://localhost:3000

## Deployment

This project is deployed to Cloudflare Workers at:
https://wolf.topangasoft.workers.dev

Deploy commands:
```bash
npm run build
# Deploy to Cloudflare Workers
```
