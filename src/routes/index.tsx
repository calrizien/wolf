import { createFileRoute } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { convexQuery } from '@convex-dev/react-query'
import { api } from '../../convex/_generated/api'
import { useVirtualizer } from '@tanstack/react-virtual'
import { useRef, useState, useEffect, useCallback, useMemo } from 'react'
import { useAction } from 'convex/react'

// Tunable constants - adjust these to fine-tune the experience
const QUOTE_DENSITY = 0.7 // 0.0-1.0, percentage of quotes to show
const Z_SCROLL_SPEED = 5 // multiplier for scroll to z-axis movement
const Z_SPACING = 800 // space between quotes on z-axis
const Z_VISIBLE_RANGE = 3000 // how far ahead/behind to render quotes
const Z_HORIZON = 2000 // distance at which quotes start to appear
const DRIFT_SPEED = 30 // seconds for full screen drift
const HOVER_SCALE = 1.2
const SELECTED_SCALE = 2.5
const SELECTION_DISPLAY_TIME = 30000 // ms
const AUTO_SELECT_DELAY = 20000 // ms

export const Route = createFileRoute('/')({
  component: Home,
})

type Quote = {
  _id: string
  text: string
  author: string
  category: string
  views: number
  likes: number
}

// Generate consistent random position for a quote based on its ID
function getQuotePosition(quoteId: string): { x: number; y: number } {
  // Simple hash function for consistent positioning
  let hash = 0
  for (let i = 0; i < quoteId.length; i++) {
    hash = ((hash << 5) - hash) + quoteId.charCodeAt(i)
    hash = hash & hash // Convert to 32bit integer
  }
  
  // Generate x, y between 10% and 90% of viewport
  const x = 10 + (Math.abs(hash) % 80)
  const y = 10 + ((Math.abs(hash * 7) % 80))
  
  return { x, y }
}

function Home() {
  // Fetch all quotes from Convex (using large limit)
  const { data: allQuotes } = useSuspenseQuery(
    convexQuery(api.quotes.list, { limit: 1000 })
  )

  // Filter quotes based on density
  const visibleQuotes = useMemo(() => {
    const count = Math.floor(allQuotes.length * QUOTE_DENSITY)
    return allQuotes.slice(0, count)
  }, [allQuotes])

  // State management
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null)
  const [relatedQuotes, setRelatedQuotes] = useState<Quote[]>([])
  const [showTitle, setShowTitle] = useState(true)
  const [hasInteracted, setHasInteracted] = useState(false)
  const [audioEnabled, setAudioEnabled] = useState(false)
  const [isScrollingDisabled, setIsScrollingDisabled] = useState(false)
  const [floatingAwayQuoteId, setFloatingAwayQuoteId] = useState<string | null>(null)
  const autoSelectTimerRef = useRef<NodeJS.Timeout | null>(null)
  const floatAwayTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Audio refs
  const spaMusicRef = useRef<HTMLAudioElement>(null)
  const clickSoundRef = useRef<HTMLAudioElement>(null)
  const whooshSoundRef = useRef<HTMLAudioElement>(null)

  // AI action for finding similar quotes
  const findSimilar = useAction(api.ai.findSimilarQuotes)

  // Scroll container ref for virtualizer
  const scrollElementRef = useRef<HTMLDivElement>(null)

  // TanStack Virtual setup
  const virtualizer = useVirtualizer({
    count: visibleQuotes.length,
    getScrollElement: () => scrollElementRef.current,
    estimateSize: () => Z_SPACING,
    overscan: 5,
  })

  // Calculate camera z-position from scroll
  const scrollOffset = virtualizer.scrollOffset || 0
  const cameraZ = scrollOffset * Z_SCROLL_SPEED

  // Initialize audio on mount
  useEffect(() => {
    const tryEnableAudio = async () => {
      if (spaMusicRef.current) {
        try {
          await spaMusicRef.current.play()
          setAudioEnabled(true)
        } catch (error) {
          // Autoplay blocked - user will need to interact
          setAudioEnabled(false)
        }
      }
    }
    tryEnableAudio()
  }, [])

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (autoSelectTimerRef.current) {
        clearTimeout(autoSelectTimerRef.current)
      }
      if (floatAwayTimerRef.current) {
        clearTimeout(floatAwayTimerRef.current)
      }
    }
  }, [])

  // Handle first interaction to fade title
  useEffect(() => {
    if (hasInteracted && showTitle) {
      const timer = setTimeout(() => {
        setShowTitle(false)
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [hasInteracted, showTitle])

  // Play sound effects
  const playClickSound = useCallback(() => {
    if (clickSoundRef.current && audioEnabled) {
      clickSoundRef.current.currentTime = 0
      clickSoundRef.current.play().catch(() => {})
    }
  }, [audioEnabled])

  const playWhooshSound = useCallback(() => {
    if (whooshSoundRef.current && audioEnabled) {
      whooshSoundRef.current.currentTime = 0
      whooshSoundRef.current.play().catch(() => {})
    }
  }, [audioEnabled])

  // Handle quote selection
  const handleQuoteSelect = useCallback(async (quote: Quote) => {
    if (selectedQuote) return // Already have a selected quote

    setHasInteracted(true)
    playClickSound()
    playWhooshSound()

    setSelectedQuote(quote)
    setIsScrollingDisabled(true)

    // Load related quotes
    let loadedRelated: Quote[] = []
    try {
      const similar = await findSimilar({ quoteId: quote._id as any, limit: 5 })
      loadedRelated = similar || []
      setRelatedQuotes(loadedRelated)
    } catch (error) {
      console.log('Could not load related quotes')
      setRelatedQuotes([])
    }

    // Clear any existing timers
    if (autoSelectTimerRef.current) {
      clearTimeout(autoSelectTimerRef.current)
    }
    if (floatAwayTimerRef.current) {
      clearTimeout(floatAwayTimerRef.current)
    }

    // After 30 seconds, float away
    floatAwayTimerRef.current = setTimeout(() => {
      playWhooshSound()
      setFloatingAwayQuoteId(quote._id)
      
      // After animation completes, clear selection
      setTimeout(() => {
        setSelectedQuote(null)
        setFloatingAwayQuoteId(null)
        setIsScrollingDisabled(false)
        
        // After 20 more seconds, auto-select a related quote
        if (loadedRelated.length > 0) {
          autoSelectTimerRef.current = setTimeout(() => {
            const randomRelated = loadedRelated[Math.floor(Math.random() * loadedRelated.length)]
            if (randomRelated) {
              handleQuoteSelect(randomRelated)
            }
          }, AUTO_SELECT_DELAY)
        }
      }, 2000) // Match floatAway animation duration
    }, SELECTION_DISPLAY_TIME)
  }, [selectedQuote, findSimilar, playClickSound, playWhooshSound])

  // Handle scroll to enable audio and fade title
  const handleScroll = useCallback(() => {
    if (!hasInteracted) {
      setHasInteracted(true)
      // Try to enable audio on first scroll
      if (spaMusicRef.current && !audioEnabled) {
        spaMusicRef.current.play()
          .then(() => setAudioEnabled(true))
          .catch(() => {})
      }
    }
  }, [hasInteracted, audioEnabled])

  // FloatingQuote component
  function FloatingQuote({ 
    quote, 
    index, 
    cameraZ,
    selectedQuote,
    floatingAwayQuoteId,
    isScrollingDisabled,
    onSelect
  }: { 
    quote: Quote
    index: number
    cameraZ: number
    selectedQuote: Quote | null
    floatingAwayQuoteId: string | null
    isScrollingDisabled: boolean
    onSelect: (quote: Quote) => void
  }) {
    const quoteZ = index * Z_SPACING
    const relativeZ = quoteZ - cameraZ

    // Only render if within visible range
    if (relativeZ < -500 || relativeZ > Z_HORIZON) {
      return null
    }

    const { x, y } = getQuotePosition(quote._id)
    const isSelected = selectedQuote?._id === quote._id
    const isFloatingAway = floatingAwayQuoteId === quote._id
    const [isHovered, setIsHovered] = useState(false)

    // Calculate scale based on z-distance
    const baseScale = Math.max(0.3, 1 + (relativeZ / 1000))
    const hoverScale = baseScale * HOVER_SCALE
    const scale = isSelected ? SELECTED_SCALE : (isHovered ? hoverScale : baseScale)

    // Calculate opacity with fog effect
    const baseOpacity = Math.max(0.2, Math.min(1, 1 - Math.abs(relativeZ) / Z_HORIZON))
    const opacity = isSelected ? 1 : (isHovered ? Math.min(1, baseOpacity * 1.3) : baseOpacity)

    // Calculate blur for depth
    const blur = isSelected ? 0 : Math.abs(relativeZ) / 500

    const handleClick = () => {
      if (!isSelected && !selectedQuote) {
        onSelect(quote)
      }
    }

    // Calculate transform based on state
    let transformX = '-50%' // offset from left position
    let transformY = '-50%' // offset from top position
    let transformZ = relativeZ
    let transformScale = scale
    let finalLeft = `${x}%`
    let finalTop = `${y}%`
    
    if (isSelected && !isFloatingAway) {
      // Whoosh to center - position absolutely at center
      finalLeft = '50%'
      finalTop = '50%'
      transformX = '0px'
      transformY = '0px'
      transformZ = 200
      transformScale = SELECTED_SCALE
    } else if (isFloatingAway) {
      // Float away - move up and back
      finalLeft = '50%'
      finalTop = '50%'
      transformX = '0px'
      transformY = '-500px' // Move up 500px
      transformZ = -500
      transformScale = 0.5
    }
    // else: Normal floating position uses -50% to center on x,y

    return (
      <div
        className={`floating-quote absolute cursor-pointer ${
          isSelected && !isFloatingAway ? 'z-50' : ''
        } ${selectedQuote && !isSelected ? 'opacity-30 blur-md' : ''}`}
        style={{
          left: finalLeft,
          top: finalTop,
          transform: `translate3d(${transformX}, ${transformY}, ${transformZ}px) scale(${transformScale})`,
          opacity: isFloatingAway ? 0 : opacity,
          filter: isFloatingAway ? 'blur(10px)' : `blur(${blur}px)`,
          pointerEvents: (isScrollingDisabled && !isSelected) || isFloatingAway ? 'none' : 'auto',
          transition: isSelected || isFloatingAway ? 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)' : 'all 0.3s ease',
        }}
        onMouseEnter={() => {
          if (!isSelected && !selectedQuote) {
            setIsHovered(true)
          }
        }}
        onMouseLeave={() => {
          if (!isSelected && !selectedQuote) {
            setIsHovered(false)
          }
        }}
        onClick={handleClick}
      >
        <div
          className="animate-cloud-float text-white font-serif text-lg md:text-xl lg:text-2xl text-center whitespace-normal max-w-md px-4"
          style={{
            textShadow: '0 2px 10px rgba(0, 0, 0, 0.5), 0 0 20px rgba(99, 102, 241, 0.3)',
          }}
        >
          "{quote.text}"
          <div className="text-sm mt-2 opacity-80">— {quote.author}</div>
        </div>
      </div>
    )
  }

  // Render related quotes in background when selected
  const renderRelatedQuotes = useCallback(() => {
    if (!selectedQuote || relatedQuotes.length === 0) return null

    return relatedQuotes.map((quote, idx) => {
      const { x, y } = getQuotePosition(quote._id)
      const z = -300 - (idx * 100) // Position behind selected quote

      return (
        <div
          key={quote._id}
          className="floating-quote absolute opacity-20 blur-sm pointer-events-none"
          style={{
            left: `${x}%`,
            top: `${y}%`,
            transform: `translate3d(-50%, -50%, ${z}px) scale(0.5)`,
          }}
        >
          <div className="text-white font-serif text-sm text-center max-w-xs px-4">
            "{quote.text}"
          </div>
        </div>
      )
    })
  }, [selectedQuote, relatedQuotes])

  return (
    <main className="quote-universe" style={{ height: '100vh', width: '100vw' }}>
      {/* Hidden audio elements */}
      <audio ref={spaMusicRef} src="/spa-music.mp3" loop />
      <audio ref={clickSoundRef} src="/click.mp3" />
      <audio ref={whooshSoundRef} src="/whoosh.mp3" />

      {/* Scroll container for virtualizer */}
      <div
        ref={scrollElementRef}
        className="absolute inset-0 overflow-auto"
        style={{
          scrollBehavior: 'smooth',
          pointerEvents: isScrollingDisabled ? 'none' : 'auto',
        }}
        onScroll={handleScroll}
      >
        {/* Virtual spacer to enable scrolling */}
        <div style={{ height: `${visibleQuotes.length * Z_SPACING}px` }} />

        {/* Quote Journey Title */}
        {showTitle && (
          <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
            <h1 className="animate-fade-title text-6xl md:text-8xl font-bold bg-gradient-to-r from-white via-indigo-200 to-purple-200 bg-clip-text text-transparent">
              QuoteJourney
            </h1>
          </div>
        )}

        {/* 3D Container for quotes */}
        <div className="quote-universe relative" style={{ height: '100vh', width: '100vw', transformStyle: 'preserve-3d' }}>
          {/* Render floating quotes */}
          {virtualizer.getVirtualItems().map((virtualItem) => {
            const quote = visibleQuotes[virtualItem.index]
            if (!quote) return null
            return (
              <FloatingQuote 
                key={quote._id} 
                quote={quote} 
                index={virtualItem.index}
                cameraZ={cameraZ}
                selectedQuote={selectedQuote}
                floatingAwayQuoteId={floatingAwayQuoteId}
                isScrollingDisabled={isScrollingDisabled}
                onSelect={handleQuoteSelect}
              />
            )
          })}

          {/* Render related quotes in background when selected */}
          {renderRelatedQuotes()}
        </div>
      </div>

      {/* Empty state */}
      {visibleQuotes.length === 0 && (
        <div className="fixed inset-0 flex items-center justify-center text-white">
          <div className="text-center">
            <div className="text-6xl mb-4">📚</div>
            <h2 className="text-2xl font-semibold mb-4">No quotes yet</h2>
            <p className="text-gray-300 max-w-md mx-auto">
              Run the setup script to seed the database with inspiring quotes.
            </p>
            <div className="bg-gray-800 text-green-400 p-4 rounded-lg max-w-lg mx-auto font-mono text-sm text-left mt-6">
              <p className="mb-2"># In Convex dashboard, run:</p>
              <p className="text-white">scraping.seedDatabase()</p>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
