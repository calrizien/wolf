# QuoteJourney - Component Specifications

**Last Updated**: 2024-11-12
**Project**: QuoteJourney - TanStack Start + Convex Hackathon
**Based On**: PLAN.md

---

## Table of Contents

1. [Component Hierarchy](#component-hierarchy)
2. [Core Components](#core-components)
3. [Layout Components](#layout-components)
4. [Feature Components](#feature-components)
5. [Utility Components](#utility-components)
6. [Shared Types](#shared-types)
7. [Animation Specifications](#animation-specifications)
8. [Accessibility Guidelines](#accessibility-guidelines)

---

## Component Hierarchy

```
App (TanStack Router Root)
├── AudioSystem (Client-Only)
│   └── AudioContext.Provider
│
├── Routes
│   ├── / (Landing)
│   │   ├── QuoteGrid
│   │   │   └── QuoteCard (x12-20)
│   │   └── SettingsPanel
│   │
│   ├── /journey (Journey Mode)
│   │   ├── JourneyView
│   │   │   ├── QuoteDisplay (Current)
│   │   │   ├── QuoteOptions
│   │   │   │   └── QuoteCard (x3-5)
│   │   │   ├── ProgressIndicator
│   │   │   └── BreadcrumbTrail
│   │   ├── ReflectionPrompt (Conditional)
│   │   ├── InsightCard (Conditional)
│   │   └── SettingsPanel
│   │
│   ├── /journey/history (History)
│   │   └── JourneyTimeline
│   │       ├── TimelineNode (per quote)
│   │       ├── ReflectionMarker
│   │       └── InsightMarker
│   │
│   └── /journey/insights (Insights)
│       └── InsightGallery
│           └── InsightCard (per insight)
│
└── Global Components
    ├── ParallaxBackground
    ├── LoadingSpinner
    └── ErrorBoundary
```

---

## Core Components

### 1. QuoteCard

**Purpose**: Display a single quote with author, supporting hover effects, selection, and animations.

#### Props Interface

```typescript
interface QuoteCardProps {
  quote: Quote;
  variant?: 'grid' | 'option' | 'current' | 'timeline';
  index?: number; // For staggered animations
  selected?: boolean;
  onClick?: () => void;
  className?: string;
  'aria-label'?: string;
}

interface Quote {
  _id: Id<"quotes">;
  text: string;
  author: string;
  categories: string[];
  tags: string[];
  sentiment: 'uplifting' | 'contemplative' | 'melancholy' | 'inspiring';
  source: string;
  qualityScore: number;
}
```

#### State Management

```typescript
function QuoteCard({ quote, variant = 'grid', index = 0, onClick }: QuoteCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isRevealing, setIsRevealing] = useState(false);
  const { playSound } = useAudio();
  const cardRef = useRef<HTMLDivElement>(null);

  const handleClick = () => {
    playSound('select');
    setIsRevealing(true);
    setTimeout(() => onClick?.(), 300);
  };

  // Ripple effect on click
  const handleRipple = (e: React.MouseEvent) => {
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Trigger ripple animation at (x, y)
    createRipple(x, y);
  };
}
```

#### Styling (Tailwind Classes)

```typescript
// Base classes by variant
const variantClasses = {
  grid: `
    group relative
    bg-gradient-to-br from-slate-800 to-slate-900
    border border-slate-700/50
    rounded-2xl p-6
    overflow-hidden
    cursor-pointer
    transition-all duration-500 ease-out
    hover:scale-105
    hover:shadow-2xl hover:shadow-purple-500/30
    hover:-translate-y-2
    hover:border-purple-500/50
  `,
  option: `
    group relative
    bg-gradient-to-br from-slate-800/80 to-slate-900/80
    backdrop-blur-sm
    border border-slate-600/40
    rounded-xl p-5
    cursor-pointer
    transition-all duration-300
    hover:scale-102
    hover:border-indigo-400/60
    hover:shadow-lg hover:shadow-indigo-500/20
  `,
  current: `
    relative
    bg-gradient-to-br from-purple-900/20 to-indigo-900/20
    border-2 border-purple-500/30
    rounded-3xl p-8 md:p-12
    shadow-2xl shadow-purple-500/20
  `,
  timeline: `
    bg-slate-800/60
    border border-slate-600/30
    rounded-lg p-4
    hover:border-slate-500/50
    transition-all duration-200
  `
};

// Animation classes
const animationClasses = `
  animate-fade-in
  animate-delay-[${index * 100}ms]
  ${isHovered ? 'animate-glow-pulse' : ''}
  ${isRevealing ? 'animate-scale-out animate-fade-out' : ''}
`;
```

#### Implementation Sketch

```tsx
export function QuoteCard({
  quote,
  variant = 'grid',
  index = 0,
  selected = false,
  onClick,
  className
}: QuoteCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isRevealing, setIsRevealing] = useState(false);
  const { playSound } = useAudio();
  const cardRef = useRef<HTMLDivElement>(null);

  const handleClick = () => {
    if (!onClick) return;
    playSound('select');
    setIsRevealing(true);
    setTimeout(onClick, 300);
  };

  return (
    <motion.div
      ref={cardRef}
      className={cn(
        variantClasses[variant],
        animationClasses,
        className
      )}
      style={{
        '--delay': `${index * 100}ms`
      } as React.CSSProperties}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role="button"
      tabIndex={0}
      aria-label={`Quote by ${quote.author}: ${quote.text.substring(0, 50)}...`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      {/* Background glow effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      {/* Quote text */}
      <blockquote className="relative z-10">
        <p className={cn(
          "font-serif italic text-slate-100 leading-relaxed",
          variant === 'current' ? "text-2xl md:text-3xl" : "text-base md:text-lg"
        )}>
          "{quote.text}"
        </p>

        <footer className="mt-4 flex items-center justify-between">
          <cite className="not-italic text-sm md:text-base font-medium text-slate-300">
            — {quote.author}
          </cite>

          {/* Sentiment indicator */}
          <SentimentBadge sentiment={quote.sentiment} />
        </footer>
      </blockquote>

      {/* Categories (grid variant only) */}
      {variant === 'grid' && (
        <div className="mt-4 flex flex-wrap gap-2">
          {quote.categories.slice(0, 2).map(cat => (
            <span
              key={cat}
              className="px-2 py-1 text-xs rounded-full bg-slate-700/50 text-slate-300"
            >
              {cat}
            </span>
          ))}
        </div>
      )}

      {/* Selection indicator */}
      {selected && (
        <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center">
          <CheckIcon className="w-4 h-4 text-white" />
        </div>
      )}

      {/* Floating particles (on hover) */}
      {isHovered && variant === 'grid' && (
        <FloatingParticles count={5} />
      )}
    </motion.div>
  );
}
```

#### Accessibility Features

- **Keyboard Navigation**: Full support for Enter/Space key selection
- **ARIA Labels**: Descriptive labels with quote preview
- **Focus Indicators**: Clear visual focus states
- **Screen Reader**: Proper semantic HTML with `<blockquote>` and `<cite>`
- **Reduced Motion**: Respects `prefers-reduced-motion` media query

#### Responsive Design

- **Mobile (< 640px)**: Single column, larger text, simplified animations
- **Tablet (640px - 1024px)**: 2-3 column grid, medium spacing
- **Desktop (> 1024px)**: 3-4 column grid, full animations

---

### 2. QuoteGrid (Landing Page)

**Purpose**: Masonry-style grid displaying initial quote selection with staggered entrance animations.

#### Props Interface

```typescript
interface QuoteGridProps {
  quotes: Quote[];
  onQuoteSelect: (quote: Quote) => void;
  className?: string;
}
```

#### State Management

```typescript
function QuoteGrid({ quotes, onQuoteSelect }: QuoteGridProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [visibleQuotes, setVisibleQuotes] = useState<Quote[]>([]);

  // Staggered reveal effect
  useEffect(() => {
    quotes.forEach((quote, index) => {
      setTimeout(() => {
        setVisibleQuotes(prev => [...prev, quote]);
      }, index * 100);
    });

    setIsLoading(false);
  }, [quotes]);
}
```

#### Styling

```typescript
const gridClasses = `
  grid
  grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4
  gap-6 md:gap-8
  auto-rows-max
  p-6 md:p-12
`;
```

#### Implementation Sketch

```tsx
export function QuoteGrid({ quotes, onQuoteSelect, className }: QuoteGridProps) {
  const [visibleQuotes, setVisibleQuotes] = useState<Quote[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    // Staggered reveal
    quotes.forEach((quote, index) => {
      setTimeout(() => {
        setVisibleQuotes(prev => [...prev, quote]);
      }, index * 100);
    });
  }, [quotes]);

  const handleQuoteClick = (quote: Quote) => {
    onQuoteSelect(quote);
    navigate({ to: '/journey', search: { quoteId: quote._id } });
  };

  return (
    <section
      className={cn(gridClasses, className)}
      role="region"
      aria-label="Quote Collection"
    >
      {visibleQuotes.map((quote, index) => (
        <QuoteCard
          key={quote._id}
          quote={quote}
          variant="grid"
          index={index}
          onClick={() => handleQuoteClick(quote)}
        />
      ))}
    </section>
  );
}
```

#### Animation Details

- **Initial Load**: Fade in with scale (0.95 → 1.0)
- **Stagger Delay**: 100ms between each card
- **Hover**: Scale up (1.0 → 1.05), lift up (-8px), glow effect
- **Exit**: Scale down + fade out when selected

#### Accessibility

- **Landmark**: `<section>` with `aria-label`
- **Grid Announcement**: Screen reader announces grid structure
- **Focus Management**: Tab order follows visual layout

#### Responsive Behavior

```css
/* Mobile: 1 column, full width cards */
@media (max-width: 640px) {
  grid-template-columns: 1fr;
  gap: 1.5rem;
  padding: 1.5rem;
}

/* Tablet: 2-3 columns, balanced layout */
@media (min-width: 640px) and (max-width: 1024px) {
  grid-template-columns: repeat(2, 1fr);
  gap: 2rem;
}

/* Desktop: 3-4 columns, masonry effect */
@media (min-width: 1024px) {
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 2rem;
}
```

---

### 3. JourneyView

**Purpose**: Main journey experience - displays current quote and next options.

#### Props Interface

```typescript
interface JourneyViewProps {
  initialQuoteId?: string;
  journeyId?: string;
}

interface JourneyState {
  currentQuote: Quote | null;
  options: Quote[];
  path: Id<"quotes">[];
  depth: number;
  journeyId: string;
  showReflection: boolean;
  showInsight: boolean;
  reflection?: Reflection;
  insight?: Insight;
}
```

#### State Management

```typescript
function JourneyView({ initialQuoteId, journeyId }: JourneyViewProps) {
  // Journey state from Convex (real-time)
  const journey = useQuery(api.journeys.get, { journeyId });
  const saveStep = useMutation(api.journeys.saveStep);
  const requestOptions = useServerFn(generateRelatedQuotes);

  const [state, setState] = useState<JourneyState>({
    currentQuote: null,
    options: [],
    path: [],
    depth: 0,
    journeyId: journeyId || generateSessionId(),
    showReflection: false,
    showInsight: false
  });

  // Load initial quote and options
  useEffect(() => {
    if (initialQuoteId) {
      loadQuoteAndOptions(initialQuoteId);
    }
  }, [initialQuoteId]);

  // Check for reflection trigger (every 7-10 quotes)
  useEffect(() => {
    if (state.depth > 0 && state.depth % 7 === 0) {
      setState(s => ({ ...s, showReflection: true }));
    }
  }, [state.depth]);

  const handleQuoteSelection = async (quote: Quote) => {
    // Play transition sound
    playSound('transition');

    // Save to journey
    await saveStep({
      journeyId: state.journeyId,
      quoteId: quote._id
    });

    // Update state with new quote and fetch new options
    const newOptions = await requestOptions({
      currentQuote: quote,
      context: state.path
    });

    setState(s => ({
      ...s,
      currentQuote: quote,
      options: newOptions,
      path: [...s.path, quote._id],
      depth: s.depth + 1
    }));
  };
}
```

#### Styling

```typescript
const containerClasses = `
  min-h-screen
  bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950
  relative overflow-hidden
`;

const contentClasses = `
  container mx-auto
  px-6 py-12 md:py-20
  flex flex-col items-center justify-center
  min-h-screen
`;
```

#### Implementation Sketch

```tsx
export function JourneyView({ initialQuoteId, journeyId }: JourneyViewProps) {
  const { playSound } = useAudio();
  const navigate = useNavigate();

  // Real-time journey data from Convex
  const journey = useQuery(api.journeys.get, { journeyId });
  const saveStep = useMutation(api.journeys.saveStep);

  const [state, setState] = useState<JourneyState>({
    currentQuote: null,
    options: [],
    path: [],
    depth: 0,
    journeyId: journeyId || generateSessionId(),
    showReflection: false,
    showInsight: false
  });

  // Server function for generating related quotes
  const generateOptions = useServerFn(generateRelatedQuotes);

  useEffect(() => {
    if (initialQuoteId) {
      initializeJourney(initialQuoteId);
    }
  }, [initialQuoteId]);

  const initializeJourney = async (quoteId: string) => {
    const quote = await fetchQuote(quoteId);
    const options = await generateOptions({
      currentQuote: quote,
      context: []
    });

    setState(s => ({
      ...s,
      currentQuote: quote,
      options,
      path: [quoteId]
    }));
  };

  const handleQuoteSelection = async (quote: Quote) => {
    playSound('transition');

    // Save step to Convex
    await saveStep({
      journeyId: state.journeyId,
      quoteId: quote._id
    });

    // Fetch new options based on selection
    const newOptions = await generateOptions({
      currentQuote: quote,
      context: state.path
    });

    setState(s => ({
      ...s,
      currentQuote: quote,
      options: newOptions,
      path: [...s.path, quote._id],
      depth: s.depth + 1,
      showReflection: (s.depth + 1) % 7 === 0
    }));
  };

  const handleReflectionComplete = (reflection: Reflection) => {
    setState(s => ({
      ...s,
      reflection,
      showReflection: false,
      showInsight: s.depth >= 14 // Show insight after 2 reflections
    }));
  };

  if (state.showReflection) {
    return (
      <ReflectionPrompt
        journeyId={state.journeyId}
        quoteCount={state.depth}
        onComplete={handleReflectionComplete}
        onSkip={() => setState(s => ({ ...s, showReflection: false }))}
      />
    );
  }

  if (state.showInsight) {
    return (
      <InsightCard
        journeyId={state.journeyId}
        quotes={state.path}
        reflections={[state.reflection].filter(Boolean)}
        onContinue={() => setState(s => ({ ...s, showInsight: false }))}
      />
    );
  }

  return (
    <div className={containerClasses}>
      <ParallaxBackground />

      <div className={contentClasses}>
        {/* Current Quote Display */}
        {state.currentQuote && (
          <motion.div
            key={state.currentQuote._id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="w-full max-w-4xl mb-12"
          >
            <QuoteCard
              quote={state.currentQuote}
              variant="current"
            />
          </motion.div>
        )}

        {/* Progress Indicator */}
        <ProgressIndicator depth={state.depth} />

        {/* Quote Options */}
        <QuoteOptions
          options={state.options}
          onSelect={handleQuoteSelection}
        />

        {/* Breadcrumb Trail */}
        <BreadcrumbTrail
          path={state.path}
          onNavigate={(index) => {
            // Navigate to specific point in journey
            const quoteId = state.path[index];
            initializeJourney(quoteId);
          }}
        />
      </div>

      {/* Settings Panel */}
      <SettingsPanel className="fixed top-4 right-4" />
    </div>
  );
}
```

#### Animation Details

- **Quote Transition**: Current fades out (0.3s), new fades in (0.6s) with scale
- **Options Appear**: Slide up from bottom with stagger (0.1s between each)
- **Breadcrumb Update**: New dot animates in with pulse effect

#### Accessibility

- **Skip Links**: "Skip to quote options" link
- **Live Region**: Announces new quote for screen readers
- **Keyboard Shortcuts**: Arrow keys for option navigation, Enter to select
- **Focus Management**: Focus moves to first option after transition

#### Responsive Layout

```tsx
// Mobile: Vertical stack, simplified breadcrumb
<div className="flex flex-col space-y-8">
  <QuoteCard variant="current" />
  <ProgressIndicator compact />
  <QuoteOptions layout="vertical" />
</div>

// Desktop: Centered layout with decorative elements
<div className="grid grid-cols-12 gap-8">
  <div className="col-span-2" /> {/* Spacer */}
  <div className="col-span-8">
    <QuoteCard variant="current" />
    <QuoteOptions layout="horizontal" />
  </div>
  <div className="col-span-2">
    <ProgressIndicator />
  </div>
</div>
```

---

### 4. QuoteOptions

**Purpose**: Display 3-5 related quote choices with smooth animations.

#### Props Interface

```typescript
interface QuoteOptionsProps {
  options: Quote[];
  onSelect: (quote: Quote) => void;
  layout?: 'horizontal' | 'vertical' | 'grid';
  className?: string;
}
```

#### State Management

```typescript
function QuoteOptions({ options, onSelect, layout = 'horizontal' }: QuoteOptionsProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [focusedIndex, setFocusedIndex] = useState(0);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowLeft':
        setFocusedIndex(i => Math.max(0, i - 1));
        break;
      case 'ArrowRight':
        setFocusedIndex(i => Math.min(options.length - 1, i + 1));
        break;
      case 'Enter':
        onSelect(options[focusedIndex]);
        break;
    }
  };
}
```

#### Styling

```typescript
const layoutClasses = {
  horizontal: `
    flex flex-row gap-4 md:gap-6
    overflow-x-auto scrollbar-hide
    pb-4
  `,
  vertical: `
    flex flex-col gap-4
  `,
  grid: `
    grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3
    gap-4 md:gap-6
  `
};
```

#### Implementation Sketch

```tsx
export function QuoteOptions({
  options,
  onSelect,
  layout = 'horizontal',
  className
}: QuoteOptionsProps) {
  const [focusedIndex, setFocusedIndex] = useState(0);
  const optionRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    // Focus first option when options change
    optionRefs.current[0]?.focus();
  }, [options]);

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    let nextIndex = index;

    switch (e.key) {
      case 'ArrowLeft':
      case 'ArrowUp':
        e.preventDefault();
        nextIndex = Math.max(0, index - 1);
        break;
      case 'ArrowRight':
      case 'ArrowDown':
        e.preventDefault();
        nextIndex = Math.min(options.length - 1, index + 1);
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        onSelect(options[index]);
        return;
    }

    setFocusedIndex(nextIndex);
    optionRefs.current[nextIndex]?.focus();
  };

  return (
    <div
      className={cn(layoutClasses[layout], className)}
      role="listbox"
      aria-label="Choose next quote"
    >
      <AnimatePresence mode="popLayout">
        {options.map((quote, index) => (
          <motion.div
            key={quote._id}
            ref={el => optionRefs.current[index] = el}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{
              duration: 0.4,
              delay: index * 0.1,
              ease: 'easeOut'
            }}
            role="option"
            aria-selected={focusedIndex === index}
            tabIndex={0}
            onKeyDown={(e) => handleKeyDown(e, index)}
          >
            <QuoteCard
              quote={quote}
              variant="option"
              onClick={() => onSelect(quote)}
              selected={focusedIndex === index}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
```

#### Animation Details

- **Entrance**: Slide up + fade in, staggered 100ms per option
- **Hover**: Slight scale (1.02) and border glow
- **Selection**: Scale down briefly, then trigger transition

#### Accessibility

- **Listbox Pattern**: ARIA listbox role with option roles
- **Keyboard Navigation**: Full arrow key support
- **Visual Focus**: Clear focus ring on keyboard navigation
- **Announcements**: Screen reader announces option count and current focus

---

### 5. ReflectionPrompt

**Purpose**: Pause journey to collect user reflection after every 7-10 quotes.

#### Props Interface

```typescript
interface ReflectionPromptProps {
  journeyId: string;
  quoteCount: number;
  onComplete: (reflection: Reflection) => void;
  onSkip: () => void;
}

interface Reflection {
  text: string;
  timestamp: number;
  quoteIndex: number;
}
```

#### State Management

```typescript
function ReflectionPrompt({ journeyId, quoteCount, onComplete, onSkip }: ReflectionPromptProps) {
  const [text, setText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { playSound } = useAudio();
  const saveReflection = useMutation(api.journeys.addReflection);

  const handleSubmit = async () => {
    if (!text.trim()) return;

    setIsSubmitting(true);
    playSound('reflection');

    const reflection: Reflection = {
      text: text.trim(),
      timestamp: Date.now(),
      quoteIndex: quoteCount
    };

    await saveReflection({
      journeyId,
      reflection
    });

    onComplete(reflection);
  };
}
```

#### Styling

```typescript
const overlayClasses = `
  fixed inset-0 z-50
  flex items-center justify-center
  backdrop-blur-md bg-black/60
  animate-fade-in
`;

const promptClasses = `
  bg-gradient-to-br from-slate-800 to-slate-900
  border-2 border-purple-500/30
  rounded-3xl
  p-8 md:p-12
  max-w-2xl w-full mx-4
  shadow-2xl shadow-purple-500/20
  animate-scale-in
`;
```

#### Implementation Sketch

```tsx
export function ReflectionPrompt({
  journeyId,
  quoteCount,
  onComplete,
  onSkip
}: ReflectionPromptProps) {
  const [text, setText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { playSound } = useAudio();
  const saveReflection = useMutation(api.journeys.addReflection);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    playSound('reflection');
    textareaRef.current?.focus();
  }, []);

  const handleSubmit = async () => {
    if (!text.trim()) return;

    setIsSubmitting(true);

    const reflection: Reflection = {
      text: text.trim(),
      timestamp: Date.now(),
      quoteIndex: quoteCount
    };

    await saveReflection({
      journeyId,
      reflection
    });

    onComplete(reflection);
  };

  return (
    <motion.div
      className={overlayClasses}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      role="dialog"
      aria-labelledby="reflection-title"
      aria-modal="true"
    >
      <motion.div
        className={promptClasses}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        {/* Decorative icon */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-full bg-purple-500/20 flex items-center justify-center">
            <SparklesIcon className="w-8 h-8 text-purple-400 animate-glow-pulse" />
          </div>
        </div>

        {/* Title */}
        <h2
          id="reflection-title"
          className="text-3xl font-bold text-center text-slate-100 mb-4"
        >
          Moment of Reflection
        </h2>

        {/* Subtitle */}
        <p className="text-center text-slate-300 mb-8">
          You've explored {quoteCount} quotes. What draws you to these words?
        </p>

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Share your thoughts... (optional)"
          className="
            w-full h-32
            bg-slate-900/50
            border border-slate-700
            rounded-xl
            p-4
            text-slate-100
            placeholder-slate-500
            focus:outline-none
            focus:ring-2 focus:ring-purple-500/50
            focus:border-purple-500/50
            resize-none
            transition-all duration-200
          "
          aria-label="Reflection text"
        />

        {/* Character count */}
        <p className="text-right text-sm text-slate-500 mt-2">
          {text.length} characters
        </p>

        {/* Actions */}
        <div className="flex gap-4 mt-8">
          <button
            onClick={onSkip}
            className="
              flex-1
              px-6 py-3
              bg-slate-700/50
              hover:bg-slate-700
              text-slate-300
              rounded-xl
              transition-all duration-200
              hover:scale-105
            "
          >
            Skip
          </button>

          <button
            onClick={handleSubmit}
            disabled={!text.trim() || isSubmitting}
            className="
              flex-1
              px-6 py-3
              bg-gradient-to-r from-purple-600 to-indigo-600
              hover:from-purple-500 hover:to-indigo-500
              disabled:from-slate-600 disabled:to-slate-600
              text-white
              rounded-xl
              font-medium
              transition-all duration-200
              hover:scale-105
              hover:shadow-lg hover:shadow-purple-500/30
              disabled:opacity-50 disabled:cursor-not-allowed
            "
          >
            {isSubmitting ? 'Saving...' : 'Continue Journey'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
```

#### Animation Details

- **Overlay**: Fade in backdrop blur (0.3s)
- **Prompt**: Scale in (0.9 → 1.0) with 0.2s delay
- **Icon**: Continuous glow pulse
- **Exit**: Fade out + scale down

#### Accessibility

- **Dialog Role**: ARIA dialog with modal behavior
- **Focus Trap**: Focus locked within dialog
- **ESC Key**: Close on escape (skip)
- **Auto-focus**: Textarea receives focus on mount
- **Screen Reader**: Announces dialog purpose

---

### 6. InsightCard

**Purpose**: Display AI-generated personal insight based on journey and reflections.

#### Props Interface

```typescript
interface InsightCardProps {
  journeyId: string;
  quotes: Id<"quotes">[];
  reflections: Reflection[];
  onContinue: () => void;
  onExplore?: (theme: string) => void;
  onShare?: () => void;
}

interface Insight {
  content: string;
  generatedAt: number;
  basedOnQuotes: Id<"quotes">[];
  themes: string[];
  emotionalArc: string;
}
```

#### State Management

```typescript
function InsightCard({
  journeyId,
  quotes,
  reflections,
  onContinue
}: InsightCardProps) {
  const [insight, setInsight] = useState<Insight | null>(null);
  const [isGenerating, setIsGenerating] = useState(true);
  const { playSound } = useAudio();
  const generateInsight = useServerFn(analyzeJourneyPattern);

  useEffect(() => {
    loadInsight();
  }, []);

  const loadInsight = async () => {
    setIsGenerating(true);

    const result = await generateInsight({
      journeyId,
      quotes,
      reflections
    });

    setInsight(result);
    setIsGenerating(false);
    playSound('insight');
  };
}
```

#### Styling

```typescript
const cardClasses = `
  bg-gradient-to-br from-indigo-900/30 via-purple-900/30 to-pink-900/30
  border-2 border-purple-500/40
  rounded-3xl
  p-8 md:p-12
  max-w-3xl
  shadow-2xl shadow-purple-500/30
  backdrop-blur-sm
`;
```

#### Implementation Sketch

```tsx
export function InsightCard({
  journeyId,
  quotes,
  reflections,
  onContinue,
  onExplore,
  onShare
}: InsightCardProps) {
  const [insight, setInsight] = useState<Insight | null>(null);
  const [isGenerating, setIsGenerating] = useState(true);
  const { playSound } = useAudio();
  const generateInsight = useServerFn(analyzeJourneyPattern);

  useEffect(() => {
    loadInsight();
  }, []);

  const loadInsight = async () => {
    try {
      const result = await generateInsight({
        journeyId,
        quotes,
        reflections
      });

      setInsight(result);
      playSound('insight');
    } catch (error) {
      console.error('Failed to generate insight:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  if (isGenerating) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <LoadingSpinner size="large" />
        <p className="mt-4 text-slate-300 text-lg animate-pulse">
          Analyzing your journey...
        </p>
      </div>
    );
  }

  if (!insight) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p className="text-slate-300">Unable to generate insight. Please try again.</p>
        <button onClick={onContinue} className="mt-4 btn-primary">
          Continue Journey
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <motion.div
        className={cardClasses}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <LightBulbIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-100">
              Your Personal Insight
            </h2>
            <p className="text-sm text-slate-400">
              Based on {quotes.length} quotes and {reflections.length} reflections
            </p>
          </div>
        </div>

        {/* Insight Content */}
        <div className="prose prose-invert prose-lg max-w-none">
          <p className="text-slate-200 leading-relaxed">
            {insight.content}
          </p>
        </div>

        {/* Themes */}
        {insight.themes && insight.themes.length > 0 && (
          <div className="mt-6">
            <h3 className="text-sm font-semibold text-slate-300 mb-3">
              Recurring Themes
            </h3>
            <div className="flex flex-wrap gap-2">
              {insight.themes.map(theme => (
                <button
                  key={theme}
                  onClick={() => onExplore?.(theme)}
                  className="
                    px-4 py-2
                    bg-purple-500/20
                    hover:bg-purple-500/30
                    border border-purple-500/30
                    rounded-full
                    text-sm text-purple-200
                    transition-all duration-200
                    hover:scale-105
                  "
                >
                  {theme}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Emotional Arc */}
        {insight.emotionalArc && (
          <div className="mt-6 p-4 bg-slate-800/50 rounded-xl">
            <h3 className="text-sm font-semibold text-slate-300 mb-2">
              Emotional Journey
            </h3>
            <p className="text-slate-400 text-sm">
              {insight.emotionalArc}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 mt-8">
          <button
            onClick={onContinue}
            className="
              flex-1
              px-6 py-3
              bg-gradient-to-r from-purple-600 to-indigo-600
              hover:from-purple-500 hover:to-indigo-500
              text-white
              rounded-xl
              font-medium
              transition-all duration-200
              hover:scale-105
              hover:shadow-lg hover:shadow-purple-500/30
            "
          >
            Continue Journey
          </button>

          {onShare && (
            <button
              onClick={onShare}
              className="
                px-6 py-3
                bg-slate-700/50
                hover:bg-slate-700
                text-slate-300
                rounded-xl
                transition-all duration-200
                hover:scale-105
                flex items-center justify-center gap-2
              "
            >
              <ShareIcon className="w-5 h-5" />
              Share Insight
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
```

#### Animation Details

- **Loading**: Pulsing spinner with text
- **Reveal**: Fade in + slide up (0.6s)
- **Content**: Text animates in with typewriter effect (optional)
- **Themes**: Pop in sequentially when revealed

#### Accessibility

- **Heading Hierarchy**: Proper h2/h3 structure
- **Loading State**: Announces loading to screen readers
- **Error Handling**: Clear error messages
- **Focus Management**: Focus on first action button when revealed

---

### 7. JourneyTimeline

**Purpose**: Visualize complete journey history with quotes, reflections, and insights.

#### Props Interface

```typescript
interface JourneyTimelineProps {
  journeyId: string;
  onQuoteClick?: (quoteId: Id<"quotes">, index: number) => void;
}

interface TimelineNode {
  type: 'quote' | 'reflection' | 'insight';
  data: Quote | Reflection | Insight;
  index: number;
  timestamp: number;
}
```

#### State Management

```typescript
function JourneyTimeline({ journeyId }: JourneyTimelineProps) {
  const journey = useQuery(api.journeys.get, { journeyId });
  const [expandedNodes, setExpandedNodes] = useState<Set<number>>(new Set());
  const [timeline, setTimeline] = useState<TimelineNode[]>([]);

  useEffect(() => {
    if (journey) {
      // Build timeline from journey data
      const nodes = buildTimelineNodes(journey);
      setTimeline(nodes);
    }
  }, [journey]);

  const toggleNode = (index: number) => {
    setExpandedNodes(prev => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };
}
```

#### Styling

```typescript
const timelineClasses = `
  relative
  max-w-4xl mx-auto
  py-12 px-6
`;

const timelineLineClasses = `
  absolute left-8 top-0 bottom-0
  w-0.5
  bg-gradient-to-b from-purple-500 via-indigo-500 to-pink-500
`;
```

#### Implementation Sketch

```tsx
export function JourneyTimeline({
  journeyId,
  onQuoteClick
}: JourneyTimelineProps) {
  const journey = useQuery(api.journeys.getHistory, { journeyId });
  const [expandedNodes, setExpandedNodes] = useState<Set<number>>(new Set());

  if (!journey) {
    return <LoadingSpinner />;
  }

  const timeline = buildTimeline(journey);

  return (
    <div className={timelineClasses}>
      {/* Timeline line */}
      <div className={timelineLineClasses} aria-hidden="true" />

      {/* Timeline nodes */}
      <div className="relative space-y-8">
        {timeline.map((node, index) => (
          <TimelineNode
            key={`${node.type}-${index}`}
            node={node}
            index={index}
            isExpanded={expandedNodes.has(index)}
            onToggle={() => toggleNode(index)}
            onClick={() => {
              if (node.type === 'quote') {
                onQuoteClick?.(node.data._id, index);
              }
            }}
          />
        ))}
      </div>

      {/* Export/Share actions */}
      <div className="mt-12 flex justify-center gap-4">
        <button className="btn-secondary">
          Export Journey
        </button>
        <button className="btn-primary">
          Share Timeline
        </button>
      </div>
    </div>
  );
}

// Timeline Node Component
interface TimelineNodeProps {
  node: TimelineNode;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
  onClick: () => void;
}

function TimelineNode({
  node,
  index,
  isExpanded,
  onToggle,
  onClick
}: TimelineNodeProps) {
  const iconConfig = {
    quote: { Icon: ChatBubbleIcon, color: 'purple' },
    reflection: { Icon: SparklesIcon, color: 'indigo' },
    insight: { Icon: LightBulbIcon, color: 'pink' }
  };

  const { Icon, color } = iconConfig[node.type];

  return (
    <motion.div
      className="relative flex gap-6"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      {/* Icon */}
      <div
        className={cn(
          "relative z-10 flex-shrink-0",
          "w-16 h-16 rounded-full",
          "flex items-center justify-center",
          `bg-${color}-500/20`,
          `border-2 border-${color}-500`
        )}
      >
        <Icon className={`w-8 h-8 text-${color}-400`} />
      </div>

      {/* Content */}
      <div className="flex-1 pb-8">
        <div
          className={cn(
            "bg-slate-800/60 border border-slate-700/50",
            "rounded-xl p-6",
            "cursor-pointer transition-all duration-200",
            "hover:border-slate-600",
            isExpanded && "shadow-lg"
          )}
          onClick={node.type === 'quote' ? onClick : onToggle}
        >
          {/* Header */}
          <div className="flex justify-between items-start mb-2">
            <span className="text-sm text-slate-400">
              Step {index + 1} • {formatTimestamp(node.timestamp)}
            </span>

            {node.type !== 'quote' && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggle();
                }}
                className="text-slate-400 hover:text-slate-300"
                aria-label={isExpanded ? 'Collapse' : 'Expand'}
              >
                {isExpanded ? <ChevronUpIcon /> : <ChevronDownIcon />}
              </button>
            )}
          </div>

          {/* Content based on type */}
          {node.type === 'quote' && (
            <blockquote className="text-slate-200">
              <p className="italic">"{(node.data as Quote).text}"</p>
              <cite className="block mt-2 text-sm text-slate-400">
                — {(node.data as Quote).author}
              </cite>
            </blockquote>
          )}

          {node.type === 'reflection' && (
            <div>
              <h4 className="text-sm font-semibold text-slate-300 mb-2">
                Your Reflection
              </h4>
              {isExpanded && (
                <p className="text-slate-400">
                  {(node.data as Reflection).text}
                </p>
              )}
            </div>
          )}

          {node.type === 'insight' && (
            <div>
              <h4 className="text-sm font-semibold text-slate-300 mb-2">
                Personal Insight
              </h4>
              {isExpanded && (
                <p className="text-slate-400">
                  {(node.data as Insight).content}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
```

#### Animation Details

- **Initial Load**: Nodes fade in sequentially (50ms stagger)
- **Scroll**: Parallax effect on timeline line
- **Expand/Collapse**: Smooth height transition
- **Hover**: Subtle lift and glow

#### Accessibility

- **List Semantics**: Use proper list markup
- **Navigation**: Keyboard support for expanding nodes
- **Timestamps**: Human-readable dates with ISO format for screen readers
- **Current Location**: Highlight current position in journey

---

### 8. AudioSystem

**Purpose**: Manage all sound effects and ambient audio throughout the app.

#### Props Interface

```typescript
interface AudioSystemProps {
  children: ReactNode;
}

interface AudioContextValue {
  playSound: (sound: SoundEffect) => void;
  toggleSound: () => void;
  toggleAmbient: () => void;
  setVolume: (volume: number) => void;
  isSoundEnabled: boolean;
  isAmbientEnabled: boolean;
  volume: number;
}

type SoundEffect = 'select' | 'transition' | 'reflection' | 'insight';
```

#### State Management

```typescript
function AudioSystem({ children }: AudioSystemProps) {
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);
  const [isAmbientEnabled, setIsAmbientEnabled] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const sounds = useRef<Record<SoundEffect, Howl>>(null);
  const ambient = useRef<Howl>(null);

  useEffect(() => {
    // Initialize Howler.js sounds
    sounds.current = {
      select: new Howl({
        src: ['/sounds/select.mp3'],
        volume: volume * 0.3
      }),
      transition: new Howl({
        src: ['/sounds/transition.mp3'],
        volume: volume * 0.2
      }),
      reflection: new Howl({
        src: ['/sounds/reflection.mp3'],
        volume: volume * 0.4
      }),
      insight: new Howl({
        src: ['/sounds/insight.mp3'],
        volume: volume * 0.4
      })
    };

    ambient.current = new Howl({
      src: ['/sounds/ambient.mp3'],
      volume: volume * 0.1,
      loop: true
    });

    return () => {
      // Cleanup: unload all sounds
      Object.values(sounds.current).forEach(sound => sound.unload());
      ambient.current?.unload();
    };
  }, []);

  const playSound = useCallback((sound: SoundEffect) => {
    if (isSoundEnabled && sounds.current) {
      sounds.current[sound].play();
    }
  }, [isSoundEnabled]);
}
```

#### Implementation Sketch

```tsx
import { Howl } from 'howler';

const AudioContext = createContext<AudioContextValue | null>(null);

export function AudioSystem({ children }: AudioSystemProps) {
  const [isSoundEnabled, setIsSoundEnabled] = useState(() => {
    if (typeof window === 'undefined') return true;
    return localStorage.getItem('soundEnabled') !== 'false';
  });

  const [isAmbientEnabled, setIsAmbientEnabled] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('ambientEnabled') === 'true';
  });

  const [volume, setVolume] = useState(() => {
    if (typeof window === 'undefined') return 0.5;
    return parseFloat(localStorage.getItem('volume') || '0.5');
  });

  const soundsRef = useRef<Record<SoundEffect, Howl>>();
  const ambientRef = useRef<Howl>();

  useEffect(() => {
    // Initialize sounds
    soundsRef.current = {
      select: new Howl({
        src: ['/sounds/select.mp3'],
        volume: volume * 0.3,
        preload: true
      }),
      transition: new Howl({
        src: ['/sounds/transition.mp3'],
        volume: volume * 0.2,
        preload: true
      }),
      reflection: new Howl({
        src: ['/sounds/reflection.mp3'],
        volume: volume * 0.4,
        preload: true
      }),
      insight: new Howl({
        src: ['/sounds/insight.mp3'],
        volume: volume * 0.4,
        preload: true
      })
    };

    ambientRef.current = new Howl({
      src: ['/sounds/ambient.mp3'],
      volume: volume * 0.1,
      loop: true,
      preload: true
    });

    return () => {
      // Cleanup
      Object.values(soundsRef.current || {}).forEach(sound => sound.unload());
      ambientRef.current?.unload();
    };
  }, []);

  // Update volumes when volume changes
  useEffect(() => {
    if (soundsRef.current) {
      soundsRef.current.select.volume(volume * 0.3);
      soundsRef.current.transition.volume(volume * 0.2);
      soundsRef.current.reflection.volume(volume * 0.4);
      soundsRef.current.insight.volume(volume * 0.4);
    }
    if (ambientRef.current) {
      ambientRef.current.volume(volume * 0.1);
    }

    localStorage.setItem('volume', volume.toString());
  }, [volume]);

  // Handle ambient toggle
  useEffect(() => {
    if (isAmbientEnabled) {
      ambientRef.current?.play();
    } else {
      ambientRef.current?.pause();
    }

    localStorage.setItem('ambientEnabled', isAmbientEnabled.toString());
  }, [isAmbientEnabled]);

  // Save sound preference
  useEffect(() => {
    localStorage.setItem('soundEnabled', isSoundEnabled.toString());
  }, [isSoundEnabled]);

  const playSound = useCallback((sound: SoundEffect) => {
    if (isSoundEnabled && soundsRef.current) {
      soundsRef.current[sound].play();
    }
  }, [isSoundEnabled]);

  const toggleSound = useCallback(() => {
    setIsSoundEnabled(prev => !prev);
  }, []);

  const toggleAmbient = useCallback(() => {
    setIsAmbientEnabled(prev => !prev);
  }, []);

  const value: AudioContextValue = {
    playSound,
    toggleSound,
    toggleAmbient,
    setVolume,
    isSoundEnabled,
    isAmbientEnabled,
    volume
  };

  return (
    <AudioContext.Provider value={value}>
      {children}
    </AudioContext.Provider>
  );
}

// Hook for consuming audio context
export function useAudio() {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error('useAudio must be used within AudioSystem');
  }
  return context;
}
```

#### Client-Only Wrapper

```tsx
// In app root (TanStack Start)
import { ClientOnly } from '@tanstack/start';

export default function App() {
  return (
    <ClientOnly fallback={null}>
      <AudioSystem>
        {/* App content */}
      </AudioSystem>
    </ClientOnly>
  );
}
```

#### Accessibility

- **Respects System Preferences**: Checks `prefers-reduced-motion`
- **Persistent Settings**: Saves preferences to localStorage
- **Easy Toggle**: Settings panel for quick disable
- **No Auto-play**: Ambient music starts paused

---

### 9. SettingsPanel

**Purpose**: Floating panel for sound, animation, and preference controls.

#### Props Interface

```typescript
interface SettingsPanelProps {
  className?: string;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

interface Settings {
  soundEnabled: boolean;
  ambientEnabled: boolean;
  volume: number;
  animationIntensity: 'low' | 'medium' | 'high';
  theme: 'dark' | 'light' | 'auto';
}
```

#### State Management

```typescript
function SettingsPanel({ position = 'top-right' }: SettingsPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { isSoundEnabled, isAmbientEnabled, volume, toggleSound, toggleAmbient, setVolume } = useAudio();
  const [animationIntensity, setAnimationIntensity] = useState<Settings['animationIntensity']>('high');

  const panelRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useClickOutside(panelRef, () => setIsOpen(false));

  // Close on ESC
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);
}
```

#### Styling

```typescript
const positionClasses = {
  'top-right': 'top-4 right-4',
  'top-left': 'top-4 left-4',
  'bottom-right': 'bottom-4 right-4',
  'bottom-left': 'bottom-4 left-4'
};

const panelClasses = `
  bg-slate-800/95
  backdrop-blur-lg
  border border-slate-700/50
  rounded-xl
  shadow-2xl
  p-6
  w-80
`;
```

#### Implementation Sketch

```tsx
export function SettingsPanel({
  className,
  position = 'top-right'
}: SettingsPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const {
    isSoundEnabled,
    isAmbientEnabled,
    volume,
    toggleSound,
    toggleAmbient,
    setVolume
  } = useAudio();

  const panelRef = useRef<HTMLDivElement>(null);

  useClickOutside(panelRef, () => setIsOpen(false));

  return (
    <div
      ref={panelRef}
      className={cn('fixed z-50', positionClasses[position], className)}
    >
      {/* Toggle button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="
          w-12 h-12
          bg-slate-800/90
          hover:bg-slate-700
          border border-slate-700/50
          rounded-full
          flex items-center justify-center
          transition-all duration-200
          hover:scale-110
          shadow-lg
        "
        aria-label="Settings"
        aria-expanded={isOpen}
      >
        <Cog6ToothIcon className="w-6 h-6 text-slate-300" />
      </button>

      {/* Settings panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className={cn(panelClasses, 'mt-4')}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            role="dialog"
            aria-label="Settings panel"
          >
            <h3 className="text-lg font-semibold text-slate-100 mb-4">
              Settings
            </h3>

            {/* Sound effects toggle */}
            <div className="space-y-4">
              <ToggleSetting
                label="Sound Effects"
                checked={isSoundEnabled}
                onChange={toggleSound}
                icon={<SpeakerWaveIcon className="w-5 h-5" />}
              />

              {/* Ambient music toggle */}
              <ToggleSetting
                label="Ambient Music"
                checked={isAmbientEnabled}
                onChange={toggleAmbient}
                icon={<MusicalNoteIcon className="w-5 h-5" />}
                disabled={!isSoundEnabled}
              />

              {/* Volume slider */}
              {isSoundEnabled && (
                <div className="pt-2">
                  <label className="block text-sm text-slate-300 mb-2">
                    Volume
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={volume}
                    onChange={(e) => setVolume(parseFloat(e.target.value))}
                    className="w-full accent-purple-500"
                    aria-label="Volume"
                  />
                  <div className="flex justify-between text-xs text-slate-500 mt-1">
                    <span>0%</span>
                    <span>{Math.round(volume * 100)}%</span>
                    <span>100%</span>
                  </div>
                </div>
              )}

              {/* Divider */}
              <div className="border-t border-slate-700/50 my-4" />

              {/* Animation intensity */}
              <div>
                <label className="block text-sm text-slate-300 mb-3">
                  Animation Intensity
                </label>
                <div className="flex gap-2">
                  {(['low', 'medium', 'high'] as const).map(intensity => (
                    <button
                      key={intensity}
                      onClick={() => setAnimationIntensity(intensity)}
                      className={cn(
                        "flex-1 px-3 py-2 rounded-lg text-sm capitalize transition-all",
                        animationIntensity === intensity
                          ? "bg-purple-500 text-white"
                          : "bg-slate-700/50 text-slate-400 hover:bg-slate-700"
                      )}
                    >
                      {intensity}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Toggle setting component
interface ToggleSettingProps {
  label: string;
  checked: boolean;
  onChange: () => void;
  icon?: ReactNode;
  disabled?: boolean;
}

function ToggleSetting({
  label,
  checked,
  onChange,
  icon,
  disabled = false
}: ToggleSettingProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        {icon && (
          <span className={cn(
            "text-slate-400",
            disabled && "opacity-50"
          )}>
            {icon}
          </span>
        )}
        <span className={cn(
          "text-sm text-slate-300",
          disabled && "opacity-50"
        )}>
          {label}
        </span>
      </div>

      <button
        onClick={onChange}
        disabled={disabled}
        className={cn(
          "relative w-11 h-6 rounded-full transition-colors",
          checked ? "bg-purple-500" : "bg-slate-600",
          disabled && "opacity-50 cursor-not-allowed"
        )}
        role="switch"
        aria-checked={checked}
        aria-label={label}
      >
        <span
          className={cn(
            "absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white",
            "transition-transform duration-200",
            checked && "translate-x-5"
          )}
        />
      </button>
    </div>
  );
}
```

#### Animation Details

- **Panel Open**: Slide down + fade in (0.2s)
- **Panel Close**: Slide up + fade out (0.2s)
- **Toggle Switch**: Smooth slide (0.2s)
- **Button Hover**: Scale up (1.1)

#### Accessibility

- **Keyboard Navigation**: Tab through all controls
- **Switch Role**: Proper ARIA switch role
- **Focus Trap**: Focus stays within panel when open
- **ESC to Close**: Keyboard shortcut to close

---

## Utility Components

### ProgressIndicator

```tsx
interface ProgressIndicatorProps {
  depth: number;
  compact?: boolean;
}

export function ProgressIndicator({ depth, compact = false }: ProgressIndicatorProps) {
  return (
    <div className="flex items-center gap-3 text-slate-400">
      <div className="flex items-center gap-2">
        <span className="text-2xl font-bold text-purple-400">{depth}</span>
        <span className="text-sm">quotes explored</span>
      </div>

      {!compact && (
        <div className="flex-1 h-1 bg-slate-800 rounded-full overflow-hidden max-w-xs">
          <motion.div
            className="h-full bg-gradient-to-r from-purple-500 to-indigo-500"
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(100, (depth / 30) * 100)}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      )}
    </div>
  );
}
```

### BreadcrumbTrail

```tsx
interface BreadcrumbTrailProps {
  path: Id<"quotes">[];
  onNavigate: (index: number) => void;
}

export function BreadcrumbTrail({ path, onNavigate }: BreadcrumbTrailProps) {
  return (
    <nav
      className="flex items-center gap-2 overflow-x-auto scrollbar-hide py-4"
      aria-label="Journey breadcrumb"
    >
      {path.map((quoteId, index) => (
        <Fragment key={quoteId}>
          <button
            onClick={() => onNavigate(index)}
            className={cn(
              "w-3 h-3 rounded-full transition-all",
              index === path.length - 1
                ? "bg-purple-500 scale-125"
                : "bg-slate-600 hover:bg-slate-500 hover:scale-110"
            )}
            aria-label={`Jump to quote ${index + 1}`}
          />
          {index < path.length - 1 && (
            <div className="w-4 h-0.5 bg-slate-700" />
          )}
        </Fragment>
      ))}
    </nav>
  );
}
```

### ParallaxBackground

```tsx
export function ParallaxBackground() {
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 20;
      const y = (e.clientY / window.innerHeight - 0.5) * 20;
      setOffset({ x, y });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-indigo-900/20 to-pink-900/20"
        animate={{
          x: offset.x,
          y: offset.y
        }}
        transition={{ type: 'spring', stiffness: 50, damping: 20 }}
      />

      {/* Floating orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-float-delayed" />
    </div>
  );
}
```

### LoadingSpinner

```tsx
interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

export function LoadingSpinner({ size = 'medium', className }: LoadingSpinnerProps) {
  const sizeClasses = {
    small: 'w-6 h-6',
    medium: 'w-10 h-10',
    large: 'w-16 h-16'
  };

  return (
    <div
      className={cn(
        sizeClasses[size],
        'border-4 border-slate-700 border-t-purple-500',
        'rounded-full animate-spin',
        className
      )}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
}
```

### FloatingParticles

```tsx
interface FloatingParticlesProps {
  count: number;
}

export function FloatingParticles({ count }: FloatingParticlesProps) {
  const particles = Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    delay: Math.random() * 2
  }));

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map(particle => (
        <motion.div
          key={particle.id}
          className="absolute w-1 h-1 bg-purple-400/40 rounded-full"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`
          }}
          animate={{
            y: [0, -20, 0],
            opacity: [0, 1, 0]
          }}
          transition={{
            duration: 3,
            delay: particle.delay,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
        />
      ))}
    </div>
  );
}
```

---

## Shared Types

```typescript
// convex/schema.ts types
import { Id } from './_generated/dataModel';

export interface Quote {
  _id: Id<"quotes">;
  text: string;
  author: string;
  categories: string[];
  tags: string[];
  sentiment: 'uplifting' | 'contemplative' | 'melancholy' | 'inspiring';
  source: string;
  embedding?: number[];
  qualityScore: number;
  createdAt: number;
}

export interface Journey {
  _id: Id<"journeys">;
  userId?: string;
  sessionId: string;
  quoteIds: Id<"quotes">[];
  currentIndex: number;
  reflections: Reflection[];
  insights: Insight[];
  startedAt: number;
  lastActiveAt: number;
}

export interface Reflection {
  quoteIndex: number;
  text: string;
  timestamp: number;
}

export interface Insight {
  content: string;
  generatedAt: number;
  basedOnQuotes: Id<"quotes">[];
  themes?: string[];
  emotionalArc?: string;
}

export interface UserProfile {
  _id: Id<"userProfiles">;
  userId: string;
  preferences: {
    categories: string[];
    soundEnabled: boolean;
    ambientEnabled: boolean;
    animationIntensity: 'low' | 'medium' | 'high';
  };
  journeyCount: number;
  totalQuotesExplored: number;
}

// Component prop types
export type Variant = 'grid' | 'option' | 'current' | 'timeline';
export type LayoutMode = 'horizontal' | 'vertical' | 'grid';
export type AnimationIntensity = 'low' | 'medium' | 'high';
export type Position = 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
```

---

## Animation Specifications

### Tailwind Config Extensions

```typescript
// tailwind.config.ts
export default {
  theme: {
    extend: {
      animation: {
        'fade-in': 'fadeIn 0.8s ease-out',
        'fade-out': 'fadeOut 0.3s ease-in',
        'scale-in': 'scaleIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
        'scale-out': 'scaleOut 0.3s ease-in',
        'slide-in-bottom': 'slideInBottom 0.7s ease-out',
        'slide-in-top': 'slideInTop 0.5s ease-out',
        'glow-pulse': 'glowPulse 2s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'float-delayed': 'float 6s ease-in-out infinite 3s',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        fadeOut: {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' }
        },
        scaleIn: {
          '0%': { transform: 'scale(0.9)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' }
        },
        scaleOut: {
          '0%': { transform: 'scale(1)', opacity: '1' },
          '100%': { transform: 'scale(0.9)', opacity: '0' }
        },
        slideInBottom: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' }
        },
        slideInTop: {
          '0%': { transform: 'translateY(-20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' }
        },
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(168, 85, 247, 0.4)' },
          '50%': { boxShadow: '0 0 40px rgba(168, 85, 247, 0.6)' }
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' }
        }
      }
    }
  }
};
```

### Framer Motion Variants

```typescript
// src/lib/animations.ts

export const fadeInVariant = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.6 } }
};

export const scaleInVariant = {
  hidden: { scale: 0.9, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: {
      duration: 0.6,
      ease: [0.34, 1.56, 0.64, 1]
    }
  }
};

export const slideInBottomVariant = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { duration: 0.5, ease: 'easeOut' }
  }
};

export const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

export const cardHoverVariant = {
  rest: { scale: 1, y: 0 },
  hover: {
    scale: 1.05,
    y: -8,
    transition: {
      duration: 0.3,
      ease: 'easeOut'
    }
  }
};
```

### Reduced Motion Support

```typescript
// src/hooks/useReducedMotion.ts
import { useEffect, useState } from 'react';

export function useReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = () => {
      setPrefersReducedMotion(mediaQuery.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return prefersReducedMotion;
}

// Usage in components
const shouldAnimate = !useReducedMotion();
```

---

## Accessibility Guidelines

### Keyboard Navigation

All interactive components must support:

- **Tab**: Navigate between elements
- **Shift + Tab**: Navigate backwards
- **Enter**: Activate buttons/links
- **Space**: Activate buttons, toggle switches
- **Arrow Keys**: Navigate lists/options
- **Escape**: Close modals/panels

### ARIA Patterns

```typescript
// Button
<button
  aria-label="Descriptive label"
  aria-pressed={isActive}
>

// Toggle Switch
<button
  role="switch"
  aria-checked={isEnabled}
  aria-label="Toggle feature"
>

// Dialog
<div
  role="dialog"
  aria-labelledby="dialog-title"
  aria-describedby="dialog-description"
  aria-modal="true"
>

// Listbox
<div role="listbox" aria-label="Options">
  <div role="option" aria-selected={isSelected}>
</div>

// Live Region
<div
  role="status"
  aria-live="polite"
  aria-atomic="true"
>
```

### Focus Management

```typescript
// Custom hook for focus trap
export function useFocusTrap(ref: RefObject<HTMLElement>, isActive: boolean) {
  useEffect(() => {
    if (!isActive) return;

    const element = ref.current;
    if (!element) return;

    const focusableElements = element.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    element.addEventListener('keydown', handleTab);
    firstElement?.focus();

    return () => element.removeEventListener('keydown', handleTab);
  }, [ref, isActive]);
}
```

### Screen Reader Announcements

```typescript
// Live region for journey updates
export function LiveAnnouncer() {
  const [announcement, setAnnouncement] = useState('');

  const announce = (message: string) => {
    setAnnouncement('');
    setTimeout(() => setAnnouncement(message), 100);
  };

  return (
    <div
      className="sr-only"
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      {announcement}
    </div>
  );
}

// Usage
const { announce } = useAnnouncer();
announce(`New quote by ${author} selected`);
```

---

## Responsive Design Considerations

### Breakpoints

```typescript
// Tailwind breakpoints
const breakpoints = {
  sm: '640px',   // Mobile landscape, small tablets
  md: '768px',   // Tablets
  lg: '1024px',  // Desktop
  xl: '1280px',  // Large desktop
  '2xl': '1536px' // Extra large desktop
};
```

### Mobile-First Patterns

```tsx
// Mobile: Stack vertically
<div className="flex flex-col space-y-4">

// Tablet+: Horizontal layout
<div className="flex flex-col md:flex-row md:space-x-4 md:space-y-0">

// Desktop: Grid layout
<div className="
  grid
  grid-cols-1
  md:grid-cols-2
  lg:grid-cols-3
  xl:grid-cols-4
  gap-4
">
```

### Touch Targets

```typescript
// Minimum 44x44px touch targets (WCAG AAA)
const touchTargetClasses = `
  min-h-[44px]
  min-w-[44px]
  flex items-center justify-center
`;

// Larger padding on mobile
<button className="
  px-4 py-2
  md:px-6 md:py-3
  touch-target
">
```

### Typography Scale

```typescript
// Responsive text sizing
const headingClasses = `
  text-2xl sm:text-3xl md:text-4xl lg:text-5xl
  font-bold
  leading-tight
`;

const bodyClasses = `
  text-base sm:text-lg
  leading-relaxed
`;

const captionClasses = `
  text-sm md:text-base
  text-slate-400
`;
```

### Container Queries (Future)

```css
/* When container query support improves */
@container (min-width: 400px) {
  .quote-card {
    grid-template-columns: auto 1fr;
  }
}
```

---

## Implementation Priority

### Phase 1: Core Components (Days 1-2)
1. QuoteCard (all variants)
2. QuoteGrid
3. JourneyView (basic)
4. QuoteOptions

### Phase 2: Enhanced Experience (Days 3-4)
5. ReflectionPrompt
6. InsightCard
7. AudioSystem
8. SettingsPanel

### Phase 3: Advanced Features (Days 5-6)
9. JourneyTimeline
10. ParallaxBackground
11. Animation polish
12. Responsive refinement

### Phase 4: Accessibility & Polish (Days 7+)
- Full keyboard navigation
- Screen reader optimization
- Performance optimization
- Cross-browser testing

---

## Testing Considerations

### Component Testing

```typescript
// Example: QuoteCard.test.tsx
describe('QuoteCard', () => {
  it('renders quote text and author', () => {
    const quote = mockQuote();
    render(<QuoteCard quote={quote} />);

    expect(screen.getByText(quote.text)).toBeInTheDocument();
    expect(screen.getByText(`— ${quote.author}`)).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const handleClick = vi.fn();
    render(<QuoteCard quote={mockQuote()} onClick={handleClick} />);

    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledOnce();
  });

  it('supports keyboard activation', () => {
    const handleClick = vi.fn();
    render(<QuoteCard quote={mockQuote()} onClick={handleClick} />);

    const card = screen.getByRole('button');
    fireEvent.keyDown(card, { key: 'Enter' });
    expect(handleClick).toHaveBeenCalled();
  });
});
```

### Accessibility Testing

```typescript
// Use jest-axe for automated a11y testing
import { axe } from 'jest-axe';

it('has no accessibility violations', async () => {
  const { container } = render(<QuoteCard quote={mockQuote()} />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

---

## Performance Optimization

### Code Splitting

```typescript
// Lazy load heavy components
const JourneyTimeline = lazy(() => import('./components/JourneyTimeline'));
const InsightCard = lazy(() => import('./components/InsightCard'));

// Use with Suspense
<Suspense fallback={<LoadingSpinner />}>
  <JourneyTimeline journeyId={id} />
</Suspense>
```

### Memoization

```typescript
// Expensive quote filtering
const filteredQuotes = useMemo(() => {
  return quotes.filter(q => q.categories.includes(category));
}, [quotes, category]);

// Callback stability
const handleClick = useCallback((quote: Quote) => {
  playSound('select');
  onSelect(quote);
}, [playSound, onSelect]);
```

### Virtual Scrolling

```typescript
// For long lists (timeline with 100+ quotes)
import { useVirtualizer } from '@tanstack/react-virtual';

const virtualizer = useVirtualizer({
  count: quotes.length,
  getScrollElement: () => scrollRef.current,
  estimateSize: () => 100,
  overscan: 5
});
```

---

**Document Status**: Complete and ready for implementation
**Next Steps**: Begin Phase 1 component development
**Questions**: Contact team for clarifications on specific component behaviors
