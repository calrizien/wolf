import { action } from "./_generated/server";
import { api } from "./_generated/api";
import { v } from "convex/values";

// Scrape quotes from web sources using Firecrawl
export const scrapeQuotes = action({
  args: {
    url: v.string(),
    category: v.optional(v.string()),
  },
  handler: async (_ctx, args) => {
    try {
      const firecrawlApiKey = process.env.FIRECRAWL_API_KEY;

      if (!firecrawlApiKey) {
        console.error("FIRECRAWL_API_KEY not set in environment variables");
        return { success: 0, failed: 1, error: "API key not configured" };
      }

      // Call Firecrawl API to scrape the page
      const response = await fetch("https://api.firecrawl.dev/v1/scrape", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${firecrawlApiKey}`,
        },
        body: JSON.stringify({
          url: args.url,
          formats: ["markdown"],
        }),
      });

      if (!response.ok) {
        console.error("Firecrawl API error:", await response.text());
        return { success: 0, failed: 1, error: "Firecrawl API error" };
      }

      const data = await response.json();
      console.log("Scraped data:", data);

      // TODO: Parse the markdown content to extract quotes
      // For now, return success
      return { success: 1, failed: 0 };
    } catch (error) {
      console.error("Error scraping quotes:", error);
      return { success: 0, failed: 1, error: String(error) };
    }
  },
});

// Seed database with initial curated quotes
export const seedDatabase = action({
  args: {},
  handler: async (ctx) => {
    // Curated collection of inspiring quotes across different categories
    const seedQuotes = [
      // Wisdom
      { text: "The only true wisdom is in knowing you know nothing.", author: "Socrates", category: "wisdom", tags: ["philosophy", "knowledge", "humility"] },
      { text: "The unexamined life is not worth living.", author: "Socrates", category: "wisdom", tags: ["philosophy", "reflection", "purpose"] },
      { text: "I think, therefore I am.", author: "René Descartes", category: "wisdom", tags: ["philosophy", "existence", "consciousness"] },
      { text: "Know thyself.", author: "Ancient Greek Aphorism", category: "wisdom", tags: ["self-awareness", "philosophy", "growth"] },
      { text: "The journey of a thousand miles begins with one step.", author: "Lao Tzu", category: "wisdom", tags: ["journey", "beginning", "action"] },

      // Motivation
      { text: "The only way to do great work is to love what you do.", author: "Steve Jobs", category: "motivation", tags: ["passion", "work", "excellence"] },
      { text: "Your time is limited, don't waste it living someone else's life.", author: "Steve Jobs", category: "motivation", tags: ["authenticity", "time", "purpose"] },
      { text: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt", category: "motivation", tags: ["dreams", "future", "belief"] },
      { text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill", category: "motivation", tags: ["perseverance", "courage", "success"] },
      { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt", category: "motivation", tags: ["belief", "confidence", "achievement"] },
      { text: "The only impossible journey is the one you never begin.", author: "Tony Robbins", category: "motivation", tags: ["beginning", "action", "possibility"] },

      // Creativity
      { text: "Creativity is intelligence having fun.", author: "Albert Einstein", category: "creativity", tags: ["intelligence", "fun", "innovation"] },
      { text: "The worst enemy to creativity is self-doubt.", author: "Sylvia Plath", category: "creativity", tags: ["doubt", "confidence", "art"] },
      { text: "Creativity takes courage.", author: "Henri Matisse", category: "creativity", tags: ["courage", "art", "expression"] },
      { text: "Every artist was first an amateur.", author: "Ralph Waldo Emerson", category: "creativity", tags: ["beginning", "art", "growth"] },
      { text: "The desire to create is one of the deepest yearnings of the human soul.", author: "Dieter F. Uchtdorf", category: "creativity", tags: ["soul", "expression", "human nature"] },

      // Love & Connection
      { text: "Love is composed of a single soul inhabiting two bodies.", author: "Aristotle", category: "love", tags: ["connection", "soul", "relationships"] },
      { text: "Where there is love there is life.", author: "Mahatma Gandhi", category: "love", tags: ["life", "compassion", "connection"] },
      { text: "The best and most beautiful things in the world cannot be seen or even touched - they must be felt with the heart.", author: "Helen Keller", category: "love", tags: ["beauty", "heart", "feeling"] },
      { text: "To love and be loved is to feel the sun from both sides.", author: "David Viscott", category: "love", tags: ["mutual", "warmth", "connection"] },
      { text: "Love recognizes no barriers.", author: "Maya Angelou", category: "love", tags: ["boundaries", "universal", "acceptance"] },

      // Courage
      { text: "Courage is not the absence of fear, but rather the assessment that something else is more important than fear.", author: "Franklin D. Roosevelt", category: "courage", tags: ["fear", "bravery", "values"] },
      { text: "You gain strength, courage, and confidence by every experience in which you really stop to look fear in the face.", author: "Eleanor Roosevelt", category: "courage", tags: ["growth", "experience", "strength"] },
      { text: "It takes courage to grow up and become who you really are.", author: "E.E. Cummings", category: "courage", tags: ["authenticity", "growth", "identity"] },
      { text: "Courage is grace under pressure.", author: "Ernest Hemingway", category: "courage", tags: ["grace", "pressure", "composure"] },

      // Mindfulness
      { text: "The present moment is the only time over which we have dominion.", author: "Thích Nhất Hạnh", category: "mindfulness", tags: ["present", "awareness", "control"] },
      { text: "Wherever you are, be all there.", author: "Jim Elliot", category: "mindfulness", tags: ["presence", "focus", "awareness"] },
      { text: "The mind is everything. What you think you become.", author: "Buddha", category: "mindfulness", tags: ["mind", "thoughts", "transformation"] },
      { text: "Peace comes from within. Do not seek it without.", author: "Buddha", category: "mindfulness", tags: ["peace", "inner", "wisdom"] },
      { text: "In the midst of movement and chaos, keep stillness inside of you.", author: "Deepak Chopra", category: "mindfulness", tags: ["stillness", "chaos", "balance"] },

      // Growth
      { text: "What lies behind us and what lies before us are tiny matters compared to what lies within us.", author: "Ralph Waldo Emerson", category: "growth", tags: ["inner strength", "potential", "self"] },
      { text: "Life is 10% what happens to you and 90% how you react to it.", author: "Charles R. Swindoll", category: "growth", tags: ["attitude", "response", "choice"] },
      { text: "The only person you are destined to become is the person you decide to be.", author: "Ralph Waldo Emerson", category: "growth", tags: ["destiny", "choice", "self-determination"] },
      { text: "Change your thoughts and you change your world.", author: "Norman Vincent Peale", category: "growth", tags: ["mindset", "transformation", "power"] },
      { text: "Growth is painful. Change is painful. But nothing is as painful as staying stuck somewhere you don't belong.", author: "Mandy Hale", category: "growth", tags: ["change", "pain", "progress"] },

      // Nature & Wonder
      { text: "In every walk with nature, one receives far more than he seeks.", author: "John Muir", category: "nature", tags: ["wonder", "outdoors", "gifts"] },
      { text: "Look deep into nature, and then you will understand everything better.", author: "Albert Einstein", category: "nature", tags: ["understanding", "wisdom", "observation"] },
      { text: "The Earth has music for those who listen.", author: "William Shakespeare", category: "nature", tags: ["beauty", "listening", "wonder"] },
      { text: "Nature does not hurry, yet everything is accomplished.", author: "Lao Tzu", category: "nature", tags: ["patience", "time", "natural flow"] },

      // Happiness
      { text: "Happiness is not something ready made. It comes from your own actions.", author: "Dalai Lama", category: "happiness", tags: ["action", "choice", "creation"] },
      { text: "The purpose of our lives is to be happy.", author: "Dalai Lama", category: "happiness", tags: ["purpose", "joy", "meaning"] },
      { text: "Happiness is when what you think, what you say, and what you do are in harmony.", author: "Mahatma Gandhi", category: "happiness", tags: ["harmony", "alignment", "integrity"] },
      { text: "For every minute you are angry you lose sixty seconds of happiness.", author: "Ralph Waldo Emerson", category: "happiness", tags: ["anger", "time", "choice"] },

      // Persistence
      { text: "It does not matter how slowly you go as long as you do not stop.", author: "Confucius", category: "persistence", tags: ["progress", "consistency", "perseverance"] },
      { text: "Fall seven times, stand up eight.", author: "Japanese Proverb", category: "persistence", tags: ["resilience", "failure", "courage"] },
      { text: "Success is stumbling from failure to failure with no loss of enthusiasm.", author: "Winston Churchill", category: "persistence", tags: ["failure", "enthusiasm", "resilience"] },
      { text: "Our greatest weakness lies in giving up. The most certain way to succeed is always to try just one more time.", author: "Thomas Edison", category: "persistence", tags: ["giving up", "success", "trying"] },

      // Truth & Honesty
      { text: "The truth will set you free, but first it will piss you off.", author: "Gloria Steinem", category: "truth", tags: ["freedom", "honesty", "discomfort"] },
      { text: "Three things cannot be long hidden: the sun, the moon, and the truth.", author: "Buddha", category: "truth", tags: ["revelation", "inevitability", "nature"] },
      { text: "If you tell the truth, you don't have to remember anything.", author: "Mark Twain", category: "truth", tags: ["honesty", "simplicity", "integrity"] },

      // Time
      { text: "Time you enjoy wasting is not wasted time.", author: "Marthe Troly-Curtin", category: "time", tags: ["enjoyment", "leisure", "perspective"] },
      { text: "The two most powerful warriors are patience and time.", author: "Leo Tolstoy", category: "time", tags: ["patience", "power", "warriors"] },
      { text: "Time flies over us, but leaves its shadow behind.", author: "Nathaniel Hawthorne", category: "time", tags: ["memory", "impact", "passing"] },
    ];

    let addedCount = 0;

    for (const quote of seedQuotes) {
      try {
        await ctx.runMutation(api.quotes.create, {
          text: quote.text,
          author: quote.author,
          category: quote.category,
          tags: quote.tags,
        });
        addedCount++;
      } catch (error) {
        console.error("Error adding quote:", error);
      }
    }

    return { quotesAdded: addedCount };
  },
});
