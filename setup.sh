#!/bin/bash
# QuoteJourney Setup Script

echo "🚀 Setting up QuoteJourney..."

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Set up Convex
echo "🔧 Setting up Convex..."
npx convex dev --once

echo ""
echo "⚙️  Next steps:"
echo "1. Run 'npx convex dev' to start Convex backend"
echo "2. In Convex dashboard, run 'scraping.seedDatabase()' to add quotes"
echo "3. Run 'npm run dev' to start the app"
echo "4. Open http://localhost:3000"
echo ""
echo "🎉 Setup complete! Happy hacking!"
