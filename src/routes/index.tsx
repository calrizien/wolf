import { Link, createFileRoute } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { convexQuery } from '@convex-dev/react-query'
import { api } from '../../convex/_generated/api'
import { Suspense } from 'react'
import { LoadingQuoteCard } from '../components/LoadingSpinner'

export const Route = createFileRoute('/')({
  component: Home,
})

function Home() {
  // Fetch quotes from Convex
  const { data: quotes } = useSuspenseQuery(
    convexQuery(api.quotes.list, { limit: 20 })
  )

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-indigo-950 dark:to-purple-950">
      {/* Header */}
      <header className="container mx-auto px-4 py-8 animate-fade-in-up">
        <div className="text-center space-y-4">
          <h1 className="text-6xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            QuoteJourney
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto animate-fade-in">
            Embark on an infinite journey through wisdom, one quote at a time
          </p>
        </div>
      </header>

      {/* Quote Grid */}
      <section className="container mx-auto px-4 py-12">
        <Suspense
          fallback={
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <LoadingQuoteCard key={i} />
              ))}
            </div>
          }
        >
          {quotes.length === 0 ? (
            <div className="text-center py-20 animate-fade-in-up">
              <div className="space-y-6">
                <div className="text-6xl animate-bounce">📚</div>
                <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-300">
                  No quotes yet
                </h2>
                <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                  Run the setup script to seed the database with inspiring quotes.
                </p>
                <div className="bg-gray-800 dark:bg-gray-900 text-green-400 p-4 rounded-lg max-w-lg mx-auto font-mono text-sm text-left transition-smooth hover:scale-105">
                  <p className="mb-2"># In Convex dashboard, run:</p>
                  <p className="text-white">scraping.seedDatabase()</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {quotes.map((quote, index) => (
                <QuoteCard
                  key={quote._id}
                  quote={quote}
                  index={index}
                />
              ))}
            </div>
          )}
        </Suspense>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16 text-center animate-fade-in-up">
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-8 max-w-2xl mx-auto shadow-xl transition-smooth hover:shadow-2xl">
          <h2 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">
            Start Your Journey
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Click any quote above to begin your personalized exploration through wisdom
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <button className="group px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-semibold transition-all hover:scale-105 hover:shadow-lg active:scale-95">
              <span className="inline-flex items-center gap-2">
                <span>🎲</span>
                Random Quote
              </span>
            </button>
            <button className="group px-6 py-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg font-semibold border-2 border-gray-200 dark:border-gray-600 transition-all hover:scale-105 hover:border-indigo-400 dark:hover:border-indigo-500 active:scale-95">
              <span className="inline-flex items-center gap-2">
                <span>📁</span>
                Browse Categories
              </span>
            </button>
          </div>
        </div>
      </section>
    </main>
  )
}

function QuoteCard({
  quote,
  index,
}: {
  quote: any
  index: number
}) {
  return (
    <Link
      to="/journey/$quoteId"
      params={{ quoteId: quote._id }}
      className="group"
    >
      <article
        className="h-full bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl p-6 shadow-lg hover:shadow-2xl transition-smooth hover:scale-105 hover:-translate-y-1 border border-gray-100 dark:border-gray-700 flex flex-col animate-card-entrance"
        style={{
          animationDelay: `${index * 0.05}s`,
        }}
      >
        {/* Category Badge */}
        <div className="mb-4">
          <span className="inline-block px-3 py-1 text-xs font-semibold rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white">
            {quote.category}
          </span>
        </div>

        {/* Quote Text */}
        <blockquote className="flex-1 mb-4">
          <p className="text-lg text-gray-800 dark:text-gray-100 leading-relaxed">
            "{quote.text}"
          </p>
        </blockquote>

        {/* Author */}
        <footer className="flex items-center justify-between text-sm">
          <cite className="not-italic font-semibold text-gray-900 dark:text-gray-200">
            — {quote.author}
          </cite>
          <div className="flex gap-3 text-gray-500 dark:text-gray-400">
            <span className="flex items-center gap-1">
              <span>👁</span> {quote.views}
            </span>
            <span className="flex items-center gap-1">
              <span>❤️</span> {quote.likes}
            </span>
          </div>
        </footer>

        {/* Hover Indicator */}
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
          <p className="text-sm text-indigo-600 dark:text-indigo-400 font-medium inline-flex items-center gap-2">
            <span>Click to start journey</span>
            <span className="transform group-hover:translate-x-1 transition-transform">→</span>
          </p>
        </div>
      </article>
    </Link>
  )
}
