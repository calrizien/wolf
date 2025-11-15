import { action } from "./_generated/server";
import { api } from "./_generated/api";
import { v } from "convex/values";

// Cloudflare AI API configuration
const CF_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const CF_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;

// Generate text embedding using Cloudflare AI
async function generateEmbedding(text: string): Promise<number[]> {
  if (!CF_ACCOUNT_ID || !CF_API_TOKEN) {
    console.warn("Cloudflare AI credentials not configured, using mock embedding");
    // Return mock embedding for development
    return Array(768).fill(0).map(() => Math.random());
  }

  try {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/ai/run/@cf/baai/bge-base-en-v1.5`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${CF_API_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: [text] }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error("Cloudflare AI error:", error);
      throw new Error(`Cloudflare AI error: ${response.status}`);
    }

    const result = await response.json();
    return result.result.data[0] || [];
  } catch (error) {
    console.error("Error generating embedding:", error);
    // Fallback to mock embedding
    return Array(768).fill(0).map(() => Math.random());
  }
}

// Generate AI insight for a quote using Cloudflare AI
async function generateInsight(quote: string, author: string): Promise<string> {
  if (!CF_ACCOUNT_ID || !CF_API_TOKEN) {
    console.warn("Cloudflare AI credentials not configured, using default insight");
    return "This quote invites reflection on life's deeper meanings.";
  }

  try {
    const prompt = `You are a wise philosopher and life coach. Provide a brief (2-3 sentences) insightful reflection on this quote by ${author}: "${quote}". Focus on how someone can apply this wisdom to their life today.`;

    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/ai/run/@cf/meta/llama-3-8b-instruct`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${CF_API_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [
            {
              role: "system",
              content: "You are a wise philosopher providing brief, actionable insights about quotes.",
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          max_tokens: 150,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error("Cloudflare AI error:", error);
      throw new Error(`Cloudflare AI error: ${response.status}`);
    }

    const result = await response.json();
    return result.result.response || "Reflect deeply on these words.";
  } catch (error) {
    console.error("Error generating insight:", error);
    return "This quote offers wisdom worth contemplating in your daily life.";
  }
}

// Calculate cosine similarity between two embeddings
function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Generate embeddings for a single quote
export const generateQuoteEmbedding = action({
  args: {
    quoteId: v.id("quotes"),
  },
  handler: async (ctx, args) => {
    // Get the quote
    const quote = await ctx.runQuery((api as any).quotes.getById, { id: args.quoteId });
    if (!quote) {
      throw new Error("Quote not found");
    }

    // Generate embedding from quote text + author
    const textToEmbed = `${quote.text} - ${quote.author}`;
    const embedding = await generateEmbedding(textToEmbed);

    // Generate AI insight
    const insight = await generateInsight(quote.text, quote.author);

    // Update the quote with embedding and insight
    await ctx.runMutation((api as any).quotes.updateAIData, {
      quoteId: args.quoteId,
      embedding,
      aiInsight: insight,
    });

    return { success: true, embeddingSize: embedding.length };
  },
});

// Generate embeddings for all quotes
export const generateAllEmbeddings = action({
  args: {},
  handler: async (ctx) => {
    // Get all quotes
    const quotes = await ctx.runQuery((api as any).quotes.list, { limit: 1000 });

    let processed = 0;
    let failed = 0;

    for (const quote of quotes) {
      try {
        await ctx.runAction((api as any).ai.generateQuoteEmbedding, {
          quoteId: quote._id,
        });
        processed++;
        console.log(`Processed ${processed}/${quotes.length}: ${quote.author}`);
      } catch (error) {
        console.error(`Failed to process quote ${quote._id}:`, error);
        failed++;
      }
    }

    return {
      total: quotes.length,
      processed,
      failed,
    };
  },
});

// Find similar quotes using semantic search
export const findSimilarQuotes = action({
  args: {
    quoteId: v.id("quotes"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 3;

    // Get the source quote with its embedding
    const sourceQuote = await ctx.runQuery((api as any).quotes.getById, {
      id: args.quoteId,
    });

    if (!sourceQuote || !sourceQuote.embedding) {
      // Fallback to category-based search if no embedding
      return await ctx.runQuery((api as any).quotes.getRandomThree, {
        category: sourceQuote?.category,
      });
    }

    // Get all quotes with embeddings
    const allQuotes = await ctx.runQuery((api as any).quotes.list, { limit: 1000 });

    // Calculate similarities
    const similarities = allQuotes
      .filter((q: any) => q._id !== sourceQuote._id && q.embedding)
      .map((quote: any) => ({
        quote,
        similarity: cosineSimilarity(sourceQuote.embedding!, quote.embedding!),
      }))
      .sort((a: any, b: any) => b.similarity - a.similarity)
      .slice(0, limit);

    return similarities.map((s: any) => s.quote);
  },
});

// Get personalized recommendations based on journey history
export const getPersonalizedRecommendations = action({
  args: {
    userId: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 5;

    if (!args.userId) {
      // Return popular quotes for anonymous users
      const quotes = await ctx.runQuery((api as any).quotes.list, { limit });
      return quotes.sort((a: any, b: any) => b.views + b.likes - (a.views + a.likes)).slice(0, limit);
    }

    // Get user's journey history
    const journey = await ctx.runQuery((api as any).journeys.getCurrent, {
      userId: args.userId,
    });

    if (!journey || journey.quotes.length === 0) {
      // No history, return popular quotes
      const quotes = await ctx.runQuery((api as any).quotes.list, { limit });
      return quotes.sort((a: any, b: any) => b.views + b.likes - (a.views + a.likes)).slice(0, limit);
    }

    // Get embeddings of quotes user has seen
    const seenQuoteIds = journey.quotes;
    const allQuotes = await ctx.runQuery((api as any).quotes.list, { limit: 1000 });

    // Calculate average embedding of user's journey
    const seenQuotes = allQuotes.filter((q: any) =>
      seenQuoteIds.includes(q._id) && q.embedding
    );

    if (seenQuotes.length === 0) {
      return await ctx.runQuery((api as any).quotes.getRandomThree, {});
    }

    // Average the embeddings
    const avgEmbedding = seenQuotes[0].embedding!.map((_: any, i: any) => {
      const sum = seenQuotes.reduce(
        (acc: any, q: any) => acc + (q.embedding![i] || 0),
        0
      );
      return sum / seenQuotes.length;
    });

    // Find quotes similar to the average
    const unseenQuotes = allQuotes.filter(
      (q: any) => !seenQuoteIds.includes(q._id) && q.embedding
    );

    const recommendations = unseenQuotes
      .map((quote: any) => ({
        quote,
        similarity: cosineSimilarity(avgEmbedding, quote.embedding!),
      }))
      .sort((a: any, b: any) => b.similarity - a.similarity)
      .slice(0, limit);

    return recommendations.map((r: any) => r.quote);
  },
});
