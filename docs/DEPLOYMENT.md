# QuoteJourney - Deployment Guide

## Deployment to Cloudflare Workers

QuoteJourney is deployed at: **https://wolf.topangasoft.workers.dev**

### Prerequisites

- Cloudflare account (free tier works great!)
- Wrangler CLI installed (`npm install -g wrangler`)
- Convex account with deployed backend
- Node.js 18+ and npm

### Step 1: Build the Application

```bash
# Install dependencies
npm install

# Build for production
npm run build
```

This creates an optimized production build in the `.output` directory.

### Step 2: Configure Wrangler

Create `wrangler.toml` in your project root (if not already exists):

```toml
name = "quotejourney"
compatibility_date = "2024-11-13"
main = ".output/server/index.mjs"

[site]
bucket = ".output/public"
```

### Step 3: Deploy to Cloudflare

```bash
# Login to Cloudflare
wrangler login

# Deploy
wrangler deploy
```

Your app will be live at: `https://quotejourney.YOUR_SUBDOMAIN.workers.dev`

### Step 4: Configure Environment Variables

Set up required environment variables in Cloudflare Workers dashboard:

1. Go to your Worker → Settings → Variables
2. Add environment variables:
   - (Note: Convex and Cloudflare AI credentials are set in Convex, not Workers)

### Step 5: Connect to Convex

Ensure your Convex deployment is production-ready:

```bash
# Deploy to production
npx convex deploy

# Set production environment variables
npx convex env set CLOUDFLARE_ACCOUNT_ID your_account_id --prod
npx convex env set CLOUDFLARE_API_TOKEN your_api_token --prod
```

## Post-Deployment Checklist

- [ ] Test the live deployment
- [ ] Verify all routes work correctly
- [ ] Test AI-powered semantic search
- [ ] Check error boundaries
- [ ] Verify loading states
- [ ] Test on mobile devices
- [ ] Check dark mode
- [ ] Verify quote navigation
- [ ] Test 404 page

## Performance Optimizations

QuoteJourney is optimized for Cloudflare Workers:

- **Edge caching** - Static assets cached globally
- **Lazy loading** - Components loaded on demand
- **Optimized bundles** - Tree-shaking and code splitting
- **GPU-accelerated animations** - Smooth 60fps performance
- **Serverless backend** - Convex handles all database operations

## Monitoring

### Cloudflare Analytics

View deployment analytics in Cloudflare dashboard:
- Request volume
- Response times
- Error rates
- Geographic distribution

### Convex Dashboard

Monitor backend performance:
- Function execution times
- Database query performance
- Real-time logs
- AI action metrics

## Troubleshooting

### Build Errors

```bash
# Clear cache and rebuild
rm -rf .output node_modules
npm install
npm run build
```

### Deployment Fails

```bash
# Check Wrangler version
wrangler --version

# Update Wrangler
npm install -g wrangler@latest

# Re-deploy
wrangler deploy --verbose
```

### Runtime Errors

Check Cloudflare Workers logs:
```bash
wrangler tail
```

## Rolling Back

If you need to rollback a deployment:

```bash
# List deployments
wrangler deployments list

# Rollback to previous version
wrangler rollback --message "Rolling back to previous version"
```

## Custom Domain (Optional)

To use a custom domain:

1. Add your domain in Cloudflare
2. Go to Workers → your-worker → Triggers
3. Add custom domain
4. Update DNS records

## Security Best Practices

- ✅ All API keys stored in Convex (not in client)
- ✅ HTTPS enforced by Cloudflare
- ✅ No sensitive data in client-side code
- ✅ Error boundaries prevent information leakage
- ✅ Sanitized error messages in production

## Cost Optimization

Cloudflare Workers free tier includes:
- 100,000 requests/day
- 10ms CPU time per request
- Plenty for a hackathon demo!

Convex free tier includes:
- 1M function calls/month
- 1GB database storage
- Perfect for QuoteJourney

## Support

For deployment issues:
- Cloudflare Workers Docs: https://developers.cloudflare.com/workers
- Convex Docs: https://docs.convex.dev
- TanStack Start Docs: https://tanstack.com/start

---

**Next Steps**: After deployment, submit to the hackathon! 🎉
