#!/bin/bash
# QuoteJourney Deployment Script for Cloudflare Workers

echo "🚀 Deploying QuoteJourney to Cloudflare Workers..."
echo ""

# Step 1: Build the application
echo "📦 Building application..."
npm run build

if [ $? -ne 0 ]; then
  echo "❌ Build failed. Please fix errors and try again."
  exit 1
fi

echo "✅ Build complete!"
echo ""

# Step 2: Deploy instructions
echo "📋 Next steps to deploy to Cloudflare Workers:"
echo ""
echo "1. Install Wrangler (if not already installed):"
echo "   npm install -g wrangler"
echo ""
echo "2. Login to Cloudflare:"
echo "   wrangler login"
echo ""
echo "3. Deploy to Cloudflare Workers:"
echo "   wrangler deploy"
echo ""
echo "   OR if you have an existing worker:"
echo "   wrangler publish"
echo ""
echo "💡 Your app will be deployed to: https://wolf.topangasoft.workers.dev"
echo ""
echo "Note: You may need to configure wrangler.toml if not already set up."
echo "See docs/DEPLOYMENT.md for detailed instructions."
