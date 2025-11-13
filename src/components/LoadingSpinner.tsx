export function LoadingSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
  }

  return (
    <div className="flex items-center justify-center">
      <div
        className={`${sizeClasses[size]} border-indigo-600 border-t-transparent rounded-full animate-spin`}
      />
    </div>
  )
}

export function LoadingQuoteCard() {
  return (
    <div className="h-full bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
      {/* Category Badge Skeleton */}
      <div className="mb-4">
        <div className="skeleton h-6 w-20" />
      </div>

      {/* Quote Text Skeleton */}
      <div className="space-y-3 mb-4">
        <div className="skeleton h-4 w-full" />
        <div className="skeleton h-4 w-full" />
        <div className="skeleton h-4 w-3/4" />
      </div>

      {/* Author Skeleton */}
      <div className="skeleton h-4 w-32" />
    </div>
  )
}

export function LoadingJourneyPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-indigo-950 dark:to-purple-950">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Main Quote Skeleton */}
          <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-2xl p-12 shadow-2xl mb-16 border border-gray-200 dark:border-gray-700">
            <div className="skeleton h-8 w-24 mb-6" />
            <div className="space-y-4 mb-8">
              <div className="skeleton h-10 w-full" />
              <div className="skeleton h-10 w-full" />
              <div className="skeleton h-10 w-4/5" />
            </div>
            <div className="skeleton h-6 w-48" />
          </div>

          {/* Related Quotes Skeleton */}
          <div className="text-center mb-8">
            <div className="skeleton h-8 w-64 mx-auto mb-2" />
            <div className="skeleton h-5 w-48 mx-auto" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <LoadingQuoteCard key={i} />
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}
