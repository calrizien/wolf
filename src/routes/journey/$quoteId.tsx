import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { convexQuery } from '@convex-dev/react-query'
import { api } from '../../../convex/_generated/api'
import { useMutation } from 'convex/react'
import { useEffect } from 'react'

export const Route = createFileRoute('/journey/$quoteId')({
  component: JourneyPage,
})

function JourneyPage() {
  const { quoteId } = Route.useParams()
  const navigate = useNavigate()

  // Fetch the current quote
  const { data: currentQuote } = useSuspenseQuery(
    convexQuery(api.quotes.getById, { id: quoteId as any })
  )

  // Fetch 3 related quotes from the same category
  const { data: relatedQuotes } = useSuspenseQuery(
    convexQuery(api.quotes.getRandomThree, {
      category: currentQuote?.category,
    })
  )

  // Increment view count
  const incrementViews = useMutation(api.quotes.incrementViews)

  useEffect(() => {
    if (currentQuote) {
      incrementViews({ id: quoteId as any })
    }
  }, [currentQuote, quoteId, incrementViews])

  if (!currentQuote) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Quote not found
          </h2>
          <Link
            to="/"
            className="text-indigo-600 dark:text-indigo-400 hover:underline"
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
      <nav className="container mx-auto px-4 py-6">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          <span>←</span> Back to all quotes
        </Link>
      </nav>

      {/* Main Quote Display */}
      <section className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Current Quote Card */}
          <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-2xl p-12 shadow-2xl mb-16 border border-gray-200 dark:border-gray-700">
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

            {/* Tags */}
            {currentQuote.tags && currentQuote.tags.length > 0 && (
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
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Continue Your Journey
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Choose a quote that resonates with you
            </p>
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
                    className="h-full bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 border border-gray-100 dark:border-gray-700 flex flex-col"
                    style={{
                      animationDelay: `${index * 0.1}s`,
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
                    <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 opacity-0 group-hover:opacity-100 transition-opacity">
                      <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                        Choose this path →
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
