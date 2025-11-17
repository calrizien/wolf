import { convexQuery } from '@convex-dev/react-query'
import { useSuspenseQuery } from '@tanstack/react-query'
import { Link, createFileRoute } from '@tanstack/react-router'
import { useAction, useMutation } from 'convex/react'
import { useEffect, useState } from 'react'
import { api } from '../../../convex/_generated/api'
import { LoadingJourneyPage, LoadingSpinner } from '../../components/LoadingSpinner'
import type { Doc, Id } from '../../../convex/_generated/dataModel'

type QuoteDoc = Doc<'quotes'>

export const Route = createFileRoute('/journey/$quoteId')({
  component: JourneyPage,
  pendingComponent: LoadingJourneyPage,
})

function JourneyPage() {
  const { quoteId } = Route.useParams()
  const quoteDocId = quoteId as Id<'quotes'>
  const [relatedQuotes, setRelatedQuotes] = useState<Array<QuoteDoc>>([])
  const [isLoadingAI, setIsLoadingAI] = useState(true)

  // Fetch the current quote
  const { data: currentQuote } = useSuspenseQuery(
    convexQuery(api.quotes.getById, { id: quoteDocId })
  )

  // Fetch 3 related quotes from the same category (fallback)
  const { data: fallbackQuotes = [] } = useSuspenseQuery(
    convexQuery(api.quotes.getRandomThree, {
      category: currentQuote?.category,
    })
  )

  // Increment view count
  const incrementViews = useMutation(api.quotes.incrementViews)

  // AI-powered similar quotes
  const findSimilar = useAction(api.ai.findSimilarQuotes)

  useEffect(() => {
    if (!currentQuote) return

    incrementViews({ id: quoteDocId })
  }, [currentQuote, quoteDocId, incrementViews])

  // Try to load AI-powered recommendations, fallback to category-based
  useEffect(() => {
    const loadRecommendations = async () => {
      if (!currentQuote) return

      try {
        setIsLoadingAI(true)
        // Try AI-powered semantic search
        const similar = (await findSimilar({ quoteId: quoteDocId, limit: 3 })) as
          | Array<QuoteDoc>
          | undefined
        const normalizedSimilar = similar ?? []
        if (normalizedSimilar.length > 0) {
          setRelatedQuotes(normalizedSimilar)
        } else {
          // Fallback to category-based
          setRelatedQuotes(fallbackQuotes)
        }
      } catch (error) {
        console.log('AI recommendations unavailable, using category-based')
        setRelatedQuotes(fallbackQuotes)
      } finally {
        setIsLoadingAI(false)
      }
    }

    loadRecommendations()
  }, [currentQuote, quoteDocId, fallbackQuotes, findSimilar])

  if (!currentQuote) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-indigo-950 dark:to-purple-950">
        <div className="text-center animate-fade-in-scale">
          <div className="text-6xl mb-4">🔍</div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Quote not found
          </h2>
          <Link
            to="/"
            className="inline-block px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-semibold hover:scale-105 transition-transform"
          >
            Return home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-indigo-950 dark:to-purple-950">
      {/* Navigation */}
      <nav className="container mx-auto px-4 py-6 animate-fade-in">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-smooth group"
        >
          <span className="transform group-hover:-translate-x-1 transition-transform">←</span>
          <span>Back to all quotes</span>
        </Link>
      </nav>

      {/* Main Quote Display */}
      <section className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Current Quote Card */}
          <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-2xl p-12 shadow-2xl mb-16 border border-gray-200 dark:border-gray-700 animate-fade-in-scale">
            {/* Category Badge */}
            <div className="mb-6">
              <span className="inline-block px-4 py-2 text-sm font-semibold rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white">
                {currentQuote.category}
              </span>
            </div>

            {/* Quote Text */}
            <blockquote className="mb-8">
              <p className="text-3xl md:text-4xl text-gray-900 dark:text-gray-100 leading-relaxed font-serif">
                "{currentQuote.text}"
              </p>
            </blockquote>

            {/* Author */}
            <footer className="flex items-center justify-between">
              <cite className="not-italic text-xl font-semibold text-gray-700 dark:text-gray-300">
                — {currentQuote.author}
                {currentQuote.source && (
                  <span className="text-base font-normal text-gray-500 dark:text-gray-400 ml-2">
                    ({currentQuote.source})
                  </span>
                )}
              </cite>
              <div className="flex gap-4 text-gray-500 dark:text-gray-400">
                <span className="flex items-center gap-1">
                  <span>👁</span> {currentQuote.views}
                </span>
                <span className="flex items-center gap-1">
                  <span>❤️</span> {currentQuote.likes}
                </span>
              </div>
            </footer>

            {/* AI Insight */}
            {currentQuote.aiInsight && (
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-start gap-3 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 p-4 rounded-lg">
                  <div className="text-2xl">✨</div>
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-indigo-900 dark:text-indigo-300 mb-1">
                      AI Insight
                    </h3>
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                      {currentQuote.aiInsight}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Tags */}
            {currentQuote.tags.length > 0 && (
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <div className="flex flex-wrap gap-2">
                  {currentQuote.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1 text-xs rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Journey Continues - Next Options */}
          <div className="text-center mb-8 animate-fade-in-up">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Continue Your Journey
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Choose a quote that resonates with you
            </p>
            {isLoadingAI ? (
              <div className="mt-4">
                <LoadingSpinner size="sm" />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Finding related quotes...
                </p>
              </div>
            ) : currentQuote.embedding ? (
              <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 rounded-full text-xs text-indigo-700 dark:text-indigo-300 animate-fade-in">
                <span>🤖</span> AI-powered recommendations
              </div>
            ) : null}
          </div>

          {/* Related Quotes Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {relatedQuotes
              .filter((q) => q._id !== currentQuote._id)
              .slice(0, 3)
              .map((quote, index) => (
                <Link
                  key={quote._id}
                  to="/journey/$quoteId"
                  params={{ quoteId: quote._id }}
                  className="group"
                >
                  <article
                    className="h-full bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl p-6 shadow-lg hover:shadow-2xl transition-smooth hover:scale-105 hover:-translate-y-1 border border-gray-100 dark:border-gray-700 flex flex-col animate-card-entrance"
                    style={{
                      animationDelay: `${index * 0.15}s`,
                    }}
                  >
                    {/* Category Badge */}
                    <div className="mb-3">
                      <span className="inline-block px-2 py-1 text-xs font-semibold rounded-full bg-gradient-to-r from-indigo-400 to-purple-400 text-white">
                        {quote.category}
                      </span>
                    </div>

                    {/* Quote Text */}
                    <blockquote className="flex-1 mb-3">
                      <p className="text-base text-gray-800 dark:text-gray-100 leading-relaxed line-clamp-4">
                        "{quote.text}"
                      </p>
                    </blockquote>

                    {/* Author */}
                    <footer className="text-sm">
                      <cite className="not-italic font-semibold text-gray-900 dark:text-gray-200">
                        — {quote.author}
                      </cite>
                    </footer>

                    {/* Hover Indicator */}
                    <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                      <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium inline-flex items-center gap-1">
                        <span>Choose this path</span>
                        <span className="transform group-hover:translate-x-1 transition-transform">→</span>
                      </p>
                    </div>
                  </article>
                </Link>
              ))}
          </div>
        </div>
      </section>
    </main>
  )
}
