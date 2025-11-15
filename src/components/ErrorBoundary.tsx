import React from 'react'
import { Link } from '@tanstack/react-router'

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-indigo-950 dark:to-purple-950 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-2xl p-8 shadow-2xl border border-gray-200 dark:border-gray-700 text-center animate-fade-in-scale">
            <div className="text-6xl mb-4">😕</div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Something went wrong
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              We encountered an unexpected error. Don't worry, your journey is
              safe.
            </p>

            {this.state.error && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg text-left">
                <p className="text-sm font-mono text-red-800 dark:text-red-300">
                  {this.state.error.message}
                </p>
              </div>
            )}

            <div className="flex gap-4 justify-center">
              <button
                onClick={() => this.setState({ hasError: false, error: null })}
                className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-semibold hover:scale-105 transition-transform"
              >
                Try Again
              </button>
              <Link
                to="/"
                className="px-6 py-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg font-semibold border-2 border-gray-200 dark:border-gray-600 hover:scale-105 transition-transform"
              >
                Go Home
              </Link>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export function ErrorFallback({ error, resetError }: { error: Error; resetError: () => void }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-indigo-950 dark:to-purple-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-2xl p-8 shadow-2xl border border-gray-200 dark:border-gray-700 text-center animate-fade-in-scale">
        <div className="text-6xl mb-4">💫</div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Oops! Lost in the journey
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Let's get you back on track.
        </p>

        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg text-left">
          <p className="text-sm font-mono text-gray-700 dark:text-gray-300">
            {error.message}
          </p>
        </div>

        <div className="flex gap-4 justify-center">
          <button
            onClick={resetError}
            className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-semibold hover:scale-105 transition-transform"
          >
            Continue Journey
          </button>
          <Link
            to="/"
            className="px-6 py-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg font-semibold border-2 border-gray-200 dark:border-gray-600 hover:scale-105 transition-transform"
          >
            Start Fresh
          </Link>
        </div>
      </div>
    </div>
  )
}
