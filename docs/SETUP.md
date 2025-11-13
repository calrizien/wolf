# QuoteJourney Setup Guide

## Environment Variables

### Convex Environment Variables

Set up environment variables in your Convex deployment:

```bash
# Set Firecrawl API key (for web scraping)
npx convex env set FIRECRAWL_API_KEY your_api_key_here

# Set Cloudflare AI credentials (for embeddings & insights)
npx convex env set CLOUDFLARE_ACCOUNT_ID your_account_id
npx convex env set CLOUDFLARE_API_TOKEN your_api_token
```

Or configure via the Convex Dashboard at https://dashboard.convex.dev

### Local Development

Create a `.env.local` file (already created) and add:
```
FIRECRAWL_API_KEY=your_api_key_here
CLOUDFLARE_ACCOUNT_ID=your_account_id
CLOUDFLARE_API_TOKEN=your_api_token
```

## Getting API Keys

### Firecrawl (Optional - for scraping additional quotes)
1. Visit https://firecrawl.dev
2. Sign up for an account
3. Get your API key from the dashboard
4. Add to Convex environment variables

### Cloudflare AI (Required for Phase 2 features)
1. Log in to Cloudflare Dashboard: https://dash.cloudflare.com
2. Go to "Workers & Pages" → "AI"
3. Copy your Account ID from the right sidebar
4. Create an API Token:
   - Go to "My Profile" → "API Tokens"
   - Click "Create Token"
   - Use "Edit Cloudflare Workers" template
   - Add "Account.Cloudflare AI" permission
   - Copy the token
5. Add both to Convex environment variables

**Note**: Without Cloudflare AI credentials, the app will:
- Use mock embeddings for development
- Generate simple default insights
- Fall back to category-based recommendations

## Running the Project

1. Install dependencies:
```bash
npm install
```

2. Set up Convex (if not already done):
```bash
npx convex dev
```

3. Seed the database with quotes:
Open Convex dashboard, go to Functions, and run:
```javascript
scraping.seedDatabase()
```
This will add 50+ curated quotes across multiple categories.

4. (Optional) Generate AI embeddings and insights:
After seeding, run this to generate embeddings for all quotes:
```javascript
ai.generateAllEmbeddings()
```
**Note**: This requires Cloudflare AI credentials. Processing 50 quotes takes ~2-3 minutes.
Without this step, quotes will use category-based recommendations instead of semantic search.

5. Start the development server:
```bash
npm run dev
```

6. Open http://localhost:3000

## Deployment

This project is deployed to Cloudflare Workers at:
https://wolf.topangasoft.workers.dev

Deploy commands:
```bash
npm run build
# Deploy to Cloudflare Workers
```
