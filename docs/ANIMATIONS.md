# QuoteJourney - Animation Specifications

## Overview

This document defines the complete animation system for QuoteJourney, creating a **meditative, smooth, and delightful** user experience. Every animation is crafted to enhance the emotional journey, using Tailwind CSS 4's advanced capabilities combined with custom keyframes and Web Animation API.

### Design Philosophy

- **Meditative**: Slow, purposeful transitions that encourage reflection
- **Smooth**: No jarring movements; everything flows naturally
- **Delightful**: Subtle surprises that reward attention
- **Performance-first**: Hardware-accelerated, optimized for 60fps
- **Accessible**: Respects user preferences for reduced motion

---

## Table of Contents

1. [Tailwind 4 Configuration](#tailwind-4-configuration)
2. [Custom Keyframe Definitions](#custom-keyframe-definitions)
3. [Animation Timing Functions](#animation-timing-functions)
4. [Hover & Click Interactions](#hover--click-interactions)
5. [Page Transitions](#page-transitions)
6. [Component-Specific Animations](#component-specific-animations)
7. [Performance Optimization](#performance-optimization)
8. [Accessibility Considerations](#accessibility-considerations)
9. [Implementation Code Snippets](#implementation-code-snippets)

---

## Tailwind 4 Configuration

### Extended Theme Configuration

```js
// tailwind.config.js
export default {
  theme: {
    extend: {
      // Custom animation durations
      transitionDuration: {
        '400': '400ms',
        '600': '600ms',
        '800': '800ms',
        '1200': '1200ms',
        '2000': '2000ms',
      },

      // Custom animation delays for staggered effects
      animationDelay: {
        '75': '75ms',
        '100': '100ms',
        '150': '150ms',
        '200': '200ms',
        '300': '300ms',
        '400': '400ms',
        '500': '500ms',
      },

      // Animation definitions
      animation: {
        // Entrance animations
        'fade-in': 'fadeIn 0.8s ease-out forwards',
        'fade-in-slow': 'fadeIn 1.2s ease-out forwards',
        'fade-in-fast': 'fadeIn 0.4s ease-out forwards',
        'slide-in-bottom': 'slideInBottom 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        'slide-in-top': 'slideInTop 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        'slide-in-left': 'slideInLeft 0.6s ease-out forwards',
        'slide-in-right': 'slideInRight 0.6s ease-out forwards',
        'scale-in': 'scaleIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        'scale-in-subtle': 'scaleInSubtle 0.8s ease-out forwards',

        // Exit animations
        'fade-out': 'fadeOut 0.5s ease-in forwards',
        'scale-out': 'scaleOut 0.5s ease-in forwards',
        'slide-out-top': 'slideOutTop 0.5s ease-in forwards',
        'slide-out-bottom': 'slideOutBottom 0.5s ease-in forwards',

        // Continuous animations
        'float': 'float 6s ease-in-out infinite',
        'float-slow': 'float 8s ease-in-out infinite',
        'breathe': 'breathe 4s ease-in-out infinite',
        'glow-pulse': 'glowPulse 2s ease-in-out infinite',
        'shimmer': 'shimmer 3s ease-in-out infinite',
        'gradient-shift': 'gradientShift 8s ease-in-out infinite',

        // Interaction animations
        'ripple': 'ripple 0.6s ease-out forwards',
        'bounce-subtle': 'bounceSubtle 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)',
        'shake-subtle': 'shakeSubtle 0.5s ease-in-out',

        // Loading animations
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 3s linear infinite',
      },

      // Keyframes
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeOut: {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
        slideInBottom: {
          '0%': {
            opacity: '0',
            transform: 'translateY(40px)',
          },
          '100%': {
            opacity: '1',
            transform: 'translateY(0)',
          },
        },
        slideInTop: {
          '0%': {
            opacity: '0',
            transform: 'translateY(-40px)',
          },
          '100%': {
            opacity: '1',
            transform: 'translateY(0)',
          },
        },
        slideInLeft: {
          '0%': {
            opacity: '0',
            transform: 'translateX(-40px)',
          },
          '100%': {
            opacity: '1',
            transform: 'translateX(0)',
          },
        },
        slideInRight: {
          '0%': {
            opacity: '0',
            transform: 'translateX(40px)',
          },
          '100%': {
            opacity: '1',
            transform: 'translateX(0)',
          },
        },
        slideOutTop: {
          '0%': {
            opacity: '1',
            transform: 'translateY(0)',
          },
          '100%': {
            opacity: '0',
            transform: 'translateY(-40px)',
          },
        },
        slideOutBottom: {
          '0%': {
            opacity: '1',
            transform: 'translateY(0)',
          },
          '100%': {
            opacity: '0',
            transform: 'translateY(40px)',
          },
        },
        scaleIn: {
          '0%': {
            opacity: '0',
            transform: 'scale(0.8)',
          },
          '100%': {
            opacity: '1',
            transform: 'scale(1)',
          },
        },
        scaleInSubtle: {
          '0%': {
            opacity: '0',
            transform: 'scale(0.95)',
          },
          '100%': {
            opacity: '1',
            transform: 'scale(1)',
          },
        },
        scaleOut: {
          '0%': {
            opacity: '1',
            transform: 'scale(1)',
          },
          '100%': {
            opacity: '0',
            transform: 'scale(0.8)',
          },
        },
        float: {
          '0%, 100%': {
            transform: 'translateY(0px)',
          },
          '50%': {
            transform: 'translateY(-10px)',
          },
        },
        breathe: {
          '0%, 100%': {
            transform: 'scale(0.98)',
          },
          '50%': {
            transform: 'scale(1)',
          },
        },
        glowPulse: {
          '0%, 100%': {
            boxShadow: '0 0 20px rgba(168, 85, 247, 0.4)',
          },
          '50%': {
            boxShadow: '0 0 40px rgba(168, 85, 247, 0.8)',
          },
        },
        shimmer: {
          '0%': {
            backgroundPosition: '-1000px 0',
          },
          '100%': {
            backgroundPosition: '1000px 0',
          },
        },
        gradientShift: {
          '0%, 100%': {
            backgroundPosition: '0% 50%',
          },
          '50%': {
            backgroundPosition: '100% 50%',
          },
        },
        ripple: {
          '0%': {
            transform: 'scale(0)',
            opacity: '1',
          },
          '100%': {
            transform: 'scale(4)',
            opacity: '0',
          },
        },
        bounceSubtle: {
          '0%, 100%': {
            transform: 'translateY(0)',
          },
          '50%': {
            transform: 'translateY(-5px)',
          },
        },
        shakeSubtle: {
          '0%, 100%': {
            transform: 'translateX(0)',
          },
          '25%': {
            transform: 'translateX(-5px)',
          },
          '75%': {
            transform: 'translateX(5px)',
          },
        },
      },

      // Custom blur values for backdrop effects
      backdropBlur: {
        'xs': '2px',
      },

      // Custom shadow colors for glow effects
      boxShadow: {
        'glow-purple': '0 0 30px rgba(168, 85, 247, 0.5)',
        'glow-purple-lg': '0 0 50px rgba(168, 85, 247, 0.6)',
        'glow-blue': '0 0 30px rgba(59, 130, 246, 0.5)',
        'glow-pink': '0 0 30px rgba(236, 72, 153, 0.5)',
        'lift': '0 20px 50px -10px rgba(0, 0, 0, 0.3)',
        'lift-lg': '0 30px 70px -10px rgba(0, 0, 0, 0.4)',
      },
    },
  },
}
```

---

## Custom Keyframe Definitions

### Advanced Keyframes (CSS)

For complex animations not covered by Tailwind, add these to your global CSS:

```css
/* app/styles/animations.css */

/* Parallax scroll effect */
@keyframes parallaxScroll {
  0% {
    transform: translateY(0) translateZ(0);
  }
  100% {
    transform: translateY(var(--parallax-distance)) translateZ(0);
  }
}

/* Particle float */
@keyframes particleFloat {
  0% {
    transform: translate(0, 0) rotate(0deg);
    opacity: 0;
  }
  10% {
    opacity: 0.8;
  }
  90% {
    opacity: 0.8;
  }
  100% {
    transform: translate(var(--float-x), var(--float-y)) rotate(360deg);
    opacity: 0;
  }
}

/* Text reveal */
@keyframes textReveal {
  0% {
    clip-path: inset(0 100% 0 0);
  }
  100% {
    clip-path: inset(0 0 0 0);
  }
}

/* Spotlight effect */
@keyframes spotlight {
  0% {
    background: radial-gradient(
      circle at center,
      rgba(255, 255, 255, 0) 0%,
      rgba(0, 0, 0, 0.9) 0%
    );
  }
  100% {
    background: radial-gradient(
      circle at center,
      rgba(255, 255, 255, 0) 40%,
      rgba(0, 0, 0, 0.9) 70%
    );
  }
}

/* Aurora background */
@keyframes aurora {
  0%, 100% {
    transform: translateX(-50%) translateY(-50%) rotate(0deg);
  }
  50% {
    transform: translateX(-50%) translateY(-50%) rotate(180deg);
  }
}

/* Wave motion */
@keyframes wave {
  0% {
    transform: translateX(0) translateY(0);
  }
  50% {
    transform: translateX(-25%) translateY(-10px);
  }
  100% {
    transform: translateX(-50%) translateY(0);
  }
}

/* Morph shape */
@keyframes morphShape {
  0%, 100% {
    border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%;
  }
  50% {
    border-radius: 30% 60% 70% 40% / 50% 60% 30% 60%;
  }
}

/* Typing cursor blink */
@keyframes cursorBlink {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0;
  }
}

/* Loading dots */
@keyframes loadingDots {
  0%, 20% {
    opacity: 0;
  }
  50% {
    opacity: 1;
  }
  100% {
    opacity: 0;
  }
}
```

---

## Animation Timing Functions

### Predefined Easing Curves

```js
// Easing functions for JavaScript animations
export const easings = {
  // Smooth and natural
  easeOut: 'cubic-bezier(0.33, 1, 0.68, 1)',
  easeIn: 'cubic-bezier(0.32, 0, 0.67, 0)',
  easeInOut: 'cubic-bezier(0.65, 0, 0.35, 1)',

  // Bouncy and playful
  bounce: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  bounceSoft: 'cubic-bezier(0.68, -0.25, 0.265, 1.25)',

  // Meditative and slow
  meditative: 'cubic-bezier(0.4, 0, 0.2, 1)',
  gentle: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',

  // Anticipation
  anticipate: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',

  // Material Design
  materialStandard: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
  materialDecelerate: 'cubic-bezier(0.0, 0.0, 0.2, 1)',
  materialAccelerate: 'cubic-bezier(0.4, 0.0, 1, 1)',
}

// Duration constants (in milliseconds)
export const durations = {
  instant: 100,
  fast: 200,
  normal: 300,
  moderate: 500,
  slow: 800,
  slower: 1200,
  meditative: 2000,
}
```

### Timing Function Reference

| Function | Use Case | Feel |
|----------|----------|------|
| `ease-out` | Entrances, reveals | Natural, settling |
| `ease-in` | Exits, removals | Gentle departure |
| `ease-in-out` | Transitions, swaps | Smooth changeover |
| `cubic-bezier(0.34, 1.56, 0.64, 1)` | Hover effects, clicks | Playful bounce |
| `cubic-bezier(0.4, 0, 0.2, 1)` | Quote transitions | Meditative flow |
| `linear` | Continuous loops | Consistent motion |

---

## Hover & Click Interactions

### Quote Card Hover States

```tsx
// Landing page quote card
<div className="
  group
  relative
  cursor-pointer
  transition-all
  duration-500
  ease-out

  /* Transform */
  hover:scale-105
  hover:-translate-y-2
  active:scale-[1.02]
  active:translate-y-0

  /* Shadow */
  shadow-lg
  hover:shadow-lift-lg
  hover:shadow-glow-purple

  /* Background glow */
  before:absolute
  before:inset-0
  before:rounded-xl
  before:bg-gradient-to-br
  before:from-purple-500/0
  before:to-pink-500/0
  before:opacity-0
  before:transition-opacity
  before:duration-500
  hover:before:opacity-20

  /* Border accent */
  ring-1
  ring-white/10
  hover:ring-purple-500/50
  hover:ring-2
">
  {/* Quote content */}
  <div className="
    relative
    z-10
    transition-transform
    duration-500
    group-hover:scale-[1.02]
  ">
    {/* Text content */}
  </div>

  {/* Shimmer effect on hover */}
  <div className="
    absolute
    inset-0
    bg-gradient-to-r
    from-transparent
    via-white/10
    to-transparent
    translate-x-[-100%]
    group-hover:translate-x-[100%]
    transition-transform
    duration-1000
    ease-out
  " />
</div>
```

### Interactive Button States

```tsx
// Primary action button
<button className="
  relative
  overflow-hidden
  px-8
  py-4
  rounded-full

  /* Base state */
  bg-gradient-to-r
  from-purple-600
  to-pink-600
  text-white
  font-medium

  /* Transform */
  transition-all
  duration-300
  hover:scale-105
  active:scale-95

  /* Shadow */
  shadow-lg
  hover:shadow-glow-purple-lg

  /* Ripple container */
  before:absolute
  before:inset-0
  before:bg-white/20
  before:rounded-full
  before:scale-0
  before:opacity-0
  active:before:scale-100
  active:before:opacity-100
  before:transition-all
  before:duration-600
">
  <span className="relative z-10">Continue Journey</span>
</button>
```

### Click Ripple Effect

```tsx
// Ripple effect component
function RippleEffect({ x, y }: { x: number; y: number }) {
  return (
    <span
      className="
        absolute
        rounded-full
        bg-white/30
        pointer-events-none
        animate-ripple
      "
      style={{
        left: x,
        top: y,
        width: 20,
        height: 20,
        transform: 'translate(-50%, -50%)',
      }}
    />
  )
}

// Usage in interactive element
function InteractiveQuote() {
  const [ripples, setRipples] = useState<Array<{ id: number; x: number; y: number }>>([])

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const ripple = { id: Date.now(), x, y }
    setRipples(prev => [...prev, ripple])

    // Remove after animation completes
    setTimeout(() => {
      setRipples(prev => prev.filter(r => r.id !== ripple.id))
    }, 600)
  }

  return (
    <div className="relative overflow-hidden" onClick={handleClick}>
      {/* Content */}
      {ripples.map(ripple => (
        <RippleEffect key={ripple.id} x={ripple.x} y={ripple.y} />
      ))}
    </div>
  )
}
```

---

## Page Transitions

### Route Transition Wrapper

```tsx
// app/components/PageTransition.tsx
import { useLocation } from '@tanstack/react-router'
import { AnimatePresence, motion } from 'framer-motion'

export function PageTransition({ children }: { children: React.ReactNode }) {
  const location = useLocation()

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{
          duration: 0.5,
          ease: [0.4, 0, 0.2, 1],
        }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}
```

### Landing to Journey Transition

```tsx
// Smooth transition from landing page to journey
function LandingToJourneyTransition({ selectedQuote }: Props) {
  return (
    <motion.div
      className="fixed inset-0 z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8 }}
    >
      {/* Expanding quote card */}
      <motion.div
        className="absolute bg-gradient-to-br from-purple-900 to-pink-900"
        layoutId={`quote-${selectedQuote.id}`}
        initial={{
          borderRadius: '12px',
        }}
        animate={{
          borderRadius: '0px',
        }}
        transition={{
          duration: 0.8,
          ease: [0.4, 0, 0.2, 1],
        }}
      >
        {/* Quote content scales and centers */}
        <motion.div
          initial={{ scale: 1 }}
          animate={{ scale: 1.5 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {selectedQuote.text}
        </motion.div>
      </motion.div>

      {/* Other cards fade out */}
      <motion.div
        initial={{ opacity: 1 }}
        animate={{ opacity: 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* Other quote cards */}
      </motion.div>
    </motion.div>
  )
}
```

### Journey State Transitions

```tsx
// Transition between journey states
export const journeyTransitions = {
  // Quote selection transition
  quoteSelect: {
    exit: {
      scale: 0.9,
      opacity: 0,
      y: -50,
      transition: {
        duration: 0.5,
        ease: [0.4, 0, 0.2, 1],
      },
    },
    enter: {
      scale: 1,
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: [0.34, 1.56, 0.64, 1],
      },
    },
  },

  // Option cards appear
  optionsAppear: {
    hidden: { opacity: 0, y: 40, scale: 0.9 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        delay: i * 0.1,
        duration: 0.6,
        ease: [0.34, 1.56, 0.64, 1],
      },
    }),
  },

  // Reflection moment
  reflectionEnter: {
    initial: { opacity: 0, scale: 0.8 },
    animate: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.8,
        ease: [0.4, 0, 0.2, 1],
      },
    },
  },
}
```

---

## Component-Specific Animations

### 1. Quote Cards on Landing Page

```tsx
// app/components/QuoteCard.tsx
interface QuoteCardProps {
  quote: Quote
  index: number
  onSelect: (quote: Quote) => void
}

export function QuoteCard({ quote, index, onSelect }: QuoteCardProps) {
  return (
    <motion.div
      className="
        group
        relative
        p-6
        rounded-xl
        bg-gradient-to-br
        from-purple-900/50
        to-pink-900/50
        backdrop-blur-sm
        border
        border-white/10
        cursor-pointer
        overflow-hidden
      "

      // Entrance animation (staggered)
      initial={{ opacity: 0, y: 40, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        delay: index * 0.1,
        duration: 0.8,
        ease: [0.34, 1.56, 0.64, 1],
      }}

      // Hover animation
      whileHover={{
        scale: 1.05,
        y: -8,
        transition: { duration: 0.3 },
      }}

      // Click animation
      whileTap={{
        scale: 1.02,
        transition: { duration: 0.1 },
      }}

      onClick={() => onSelect(quote)}

      // Layout animation for position changes
      layout
      layoutId={`quote-${quote.id}`}
    >
      {/* Floating animation */}
      <motion.div
        animate={{
          y: [0, -10, 0],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut",
          delay: index * 0.2,
        }}
      >
        {/* Quote text with breathing effect */}
        <motion.p
          className="text-lg text-white/90 font-light leading-relaxed"
          animate={{
            scale: [0.98, 1, 0.98],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          "{quote.text}"
        </motion.p>

        {/* Author */}
        <p className="mt-4 text-sm text-purple-300/70">
          — {quote.author}
        </p>
      </motion.div>

      {/* Shimmer effect on hover */}
      <motion.div
        className="
          absolute
          inset-0
          bg-gradient-to-r
          from-transparent
          via-white/10
          to-transparent
          pointer-events-none
        "
        initial={{ x: '-100%' }}
        whileHover={{
          x: '100%',
          transition: { duration: 1, ease: 'linear' },
        }}
      />

      {/* Glow effect */}
      <div className="
        absolute
        inset-0
        rounded-xl
        opacity-0
        group-hover:opacity-100
        transition-opacity
        duration-500
        bg-gradient-to-br
        from-purple-500/20
        to-pink-500/20
        blur-xl
        -z-10
      " />
    </motion.div>
  )
}
```

### 2. Journey Transitions

```tsx
// app/components/JourneyView.tsx
export function JourneyView() {
  const [currentQuote, setCurrentQuote] = useState<Quote>(initialQuote)
  const [options, setOptions] = useState<Quote[]>([])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      {/* Current quote display */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentQuote.id}
          className="max-w-3xl text-center mb-16"

          // Exit animation
          exit={{
            scale: 0.9,
            opacity: 0,
            y: -50,
            filter: 'blur(10px)',
            transition: {
              duration: 0.5,
              ease: [0.4, 0, 0.2, 1],
            },
          }}

          // Enter animation
          initial={{
            scale: 1.1,
            opacity: 0,
            y: 50,
            filter: 'blur(10px)',
          }}
          animate={{
            scale: 1,
            opacity: 1,
            y: 0,
            filter: 'blur(0px)',
            transition: {
              duration: 0.6,
              ease: [0.34, 1.56, 0.64, 1],
            },
          }}
        >
          {/* Quote text with breathing */}
          <motion.h1
            className="text-4xl md:text-5xl font-light text-white leading-relaxed"
            animate={{
              scale: [0.98, 1, 0.98],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            "{currentQuote.text}"
          </motion.h1>

          <motion.p
            className="mt-6 text-xl text-purple-300"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            — {currentQuote.author}
          </motion.p>
        </motion.div>
      </AnimatePresence>

      {/* Option cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl">
        <AnimatePresence mode="sync">
          {options.map((option, index) => (
            <motion.div
              key={option.id}
              custom={index}
              variants={journeyTransitions.optionsAppear}
              initial="hidden"
              animate="visible"
              exit={{
                opacity: 0,
                scale: 0.9,
                transition: { duration: 0.3 },
              }}

              className="
                p-6
                rounded-xl
                bg-white/5
                backdrop-blur-sm
                border
                border-white/10
                cursor-pointer
                hover:bg-white/10
                transition-colors
                duration-300
              "

              whileHover={{
                scale: 1.05,
                transition: { duration: 0.2 },
              }}

              whileTap={{ scale: 0.98 }}

              onClick={() => handleSelectOption(option)}
            >
              <p className="text-white/80 text-sm leading-relaxed">
                "{option.text}"
              </p>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}
```

### 3. Reflection Moments

```tsx
// app/components/ReflectionMoment.tsx
export function ReflectionMoment({ onSubmit }: Props) {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center"

      // Backdrop fade in
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Dimmed backdrop with blur */}
      <motion.div
        className="absolute inset-0 bg-black/70 backdrop-blur-md"
        initial={{ backdropFilter: 'blur(0px)' }}
        animate={{ backdropFilter: 'blur(8px)' }}
        transition={{ duration: 0.6 }}
      />

      {/* Spotlight effect */}
      <motion.div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(circle at center, rgba(255,255,255,0) 0%, rgba(0,0,0,0.9) 70%)',
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 0.2 }}
      />

      {/* Reflection card */}
      <motion.div
        className="
          relative
          z-10
          max-w-2xl
          mx-4
          p-8
          rounded-2xl
          bg-gradient-to-br
          from-purple-900/80
          to-pink-900/80
          backdrop-blur-xl
          border
          border-white/20
          shadow-2xl
        "

        // Scale in with bounce
        initial={{ scale: 0.8, opacity: 0, rotateX: -15 }}
        animate={{
          scale: 1,
          opacity: 1,
          rotateX: 0,
          transition: {
            duration: 0.8,
            ease: [0.34, 1.56, 0.64, 1],
            delay: 0.3,
          },
        }}

        // Gentle breathing
        animate={{
          boxShadow: [
            '0 0 40px rgba(168, 85, 247, 0.4)',
            '0 0 60px rgba(168, 85, 247, 0.6)',
            '0 0 40px rgba(168, 85, 247, 0.4)',
          ],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        {/* Chime icon with pulse */}
        <motion.div
          className="text-center mb-6"
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{
            duration: 0.6,
            delay: 0.5,
            ease: [0.34, 1.56, 0.64, 1],
          }}
        >
          <motion.div
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.8, 1, 0.8],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            🔔
          </motion.div>
        </motion.div>

        {/* Prompt text */}
        <motion.h2
          className="text-2xl text-white font-light text-center mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.5 }}
        >
          What draws you to these quotes?
        </motion.h2>

        {/* Text area */}
        <motion.textarea
          className="
            w-full
            h-32
            p-4
            rounded-xl
            bg-white/10
            border
            border-white/20
            text-white
            placeholder-white/40
            focus:outline-none
            focus:ring-2
            focus:ring-purple-500/50
            resize-none
          "
          placeholder="Share your thoughts (optional)..."
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.5 }}
        />

        {/* Submit button */}
        <motion.button
          className="
            w-full
            mt-6
            px-6
            py-3
            rounded-full
            bg-gradient-to-r
            from-purple-600
            to-pink-600
            text-white
            font-medium
          "
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1, duration: 0.5 }}

          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}

          onClick={onSubmit}
        >
          Continue Journey
        </motion.button>
      </motion.div>
    </motion.div>
  )
}
```

### 4. Insight Reveals

```tsx
// app/components/InsightReveal.tsx
export function InsightReveal({ insight }: { insight: string }) {
  const [showShare, setShowShare] = useState(false)

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Animated gradient background */}
      <motion.div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
          backgroundSize: '200% 200%',
        }}
        animate={{
          backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "linear",
        }}
      />

      {/* Floating particles */}
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 rounded-full bg-white/30"
          initial={{
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
            opacity: 0,
          }}
          animate={{
            y: [null, Math.random() * -200 - 100],
            opacity: [0, 0.8, 0],
          }}
          transition={{
            duration: 3 + Math.random() * 2,
            repeat: Infinity,
            delay: Math.random() * 2,
            ease: "easeOut",
          }}
        />
      ))}

      {/* Insight card */}
      <motion.div
        className="
          relative
          max-w-3xl
          p-10
          rounded-3xl
          bg-white/95
          backdrop-blur-xl
          shadow-2xl
        "

        // Dramatic entrance
        initial={{
          scale: 0.3,
          opacity: 0,
          rotateY: -90,
        }}
        animate={{
          scale: 1,
          opacity: 1,
          rotateY: 0,
          transition: {
            duration: 1,
            ease: [0.34, 1.56, 0.64, 1],
          },
        }}

        // Glow pulse
        style={{
          boxShadow: '0 0 80px rgba(168, 85, 247, 0.6)',
        }}
      >
        {/* Decorative elements */}
        <motion.div
          className="absolute -top-10 left-1/2 -translate-x-1/2"
          initial={{ scale: 0, rotate: -180 }}
          animate={{
            scale: 1,
            rotate: 0,
            transition: {
              duration: 0.8,
              delay: 0.5,
              ease: [0.34, 1.56, 0.64, 1],
            },
          }}
        >
          <div className="text-6xl">✨</div>
        </motion.div>

        {/* Title */}
        <motion.h2
          className="text-3xl font-light text-purple-900 text-center mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.6 }}
        >
          Your Personal Insight
        </motion.h2>

        {/* Insight text with typing reveal effect */}
        <motion.div
          className="text-lg text-gray-700 leading-relaxed"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.5 }}
        >
          <TypewriterText text={insight} delay={1.2} />
        </motion.div>

        {/* Action buttons */}
        <motion.div
          className="flex gap-4 mt-8 justify-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2, duration: 0.5 }}
        >
          <motion.button
            className="
              px-6
              py-3
              rounded-full
              bg-gradient-to-r
              from-purple-600
              to-pink-600
              text-white
              font-medium
            "
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Continue Journey
          </motion.button>

          <motion.button
            className="
              px-6
              py-3
              rounded-full
              bg-white
              text-purple-600
              font-medium
              border-2
              border-purple-600
            "
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowShare(true)}
          >
            Share Insight
          </motion.button>
        </motion.div>
      </motion.div>
    </motion.div>
  )
}

// Typewriter text component
function TypewriterText({ text, delay = 0 }: { text: string; delay?: number }) {
  const [displayText, setDisplayText] = useState('')
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (currentIndex < text.length) {
        setDisplayText(prev => prev + text[currentIndex])
        setCurrentIndex(prev => prev + 1)
      }
    }, delay * 1000 + currentIndex * 30)

    return () => clearTimeout(timeout)
  }, [currentIndex, text, delay])

  return (
    <span>
      {displayText}
      {currentIndex < text.length && (
        <motion.span
          className="inline-block w-0.5 h-5 bg-purple-600 ml-1"
          animate={{ opacity: [1, 0, 1] }}
          transition={{ duration: 0.8, repeat: Infinity }}
        />
      )}
    </span>
  )
}
```

### 5. Journey History Timeline

```tsx
// app/components/JourneyHistory.tsx
export function JourneyHistory({ journey }: { journey: Journey }) {
  return (
    <div className="max-w-4xl mx-auto p-8">
      {/* Timeline */}
      <div className="relative">
        {/* Vertical line */}
        <motion.div
          className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-purple-500 to-pink-500"
          initial={{ scaleY: 0 }}
          animate={{ scaleY: 1 }}
          transition={{ duration: 1, ease: "easeOut" }}
          style={{ transformOrigin: 'top' }}
        />

        {/* Journey steps */}
        {journey.quotes.map((quote, index) => (
          <motion.div
            key={quote.id}
            className="relative pl-20 pb-12"
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{
              delay: index * 0.1,
              duration: 0.6,
              ease: [0.34, 1.56, 0.64, 1],
            }}
          >
            {/* Timeline dot */}
            <motion.div
              className="
                absolute
                left-6
                top-2
                w-4
                h-4
                rounded-full
                bg-gradient-to-br
                from-purple-500
                to-pink-500
                shadow-lg
                shadow-purple-500/50
              "
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true }}
              transition={{
                delay: index * 0.1 + 0.2,
                type: 'spring',
                stiffness: 500,
                damping: 15,
              }}

              // Pulse animation
              animate={{
                boxShadow: [
                  '0 0 0 0 rgba(168, 85, 247, 0.7)',
                  '0 0 0 10px rgba(168, 85, 247, 0)',
                ],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: index * 0.1 + 0.5,
              }}
            />

            {/* Quote card */}
            <motion.div
              className="
                p-6
                rounded-xl
                bg-white/5
                backdrop-blur-sm
                border
                border-white/10
                hover:bg-white/10
                transition-colors
                duration-300
              "
              whileHover={{
                scale: 1.02,
                x: 5,
                transition: { duration: 0.2 },
              }}
            >
              <p className="text-white/90 leading-relaxed">
                "{quote.text}"
              </p>
              <p className="mt-2 text-sm text-purple-300/70">
                — {quote.author}
              </p>
            </motion.div>

            {/* Reflection marker */}
            {journey.reflections[index] && (
              <motion.div
                className="mt-4 ml-8"
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 + 0.4 }}
              >
                <div className="flex items-start gap-3 p-4 rounded-lg bg-purple-500/10 border border-purple-500/30">
                  <span className="text-2xl">💭</span>
                  <p className="text-white/70 text-sm italic">
                    {journey.reflections[index].text}
                  </p>
                </div>
              </motion.div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  )
}
```

---

## Performance Optimization

### Hardware Acceleration

```css
/* Force GPU acceleration for smooth animations */
.gpu-accelerated {
  transform: translateZ(0);
  will-change: transform, opacity;
  backface-visibility: hidden;
  perspective: 1000px;
}

/* Use transform instead of position for animations */
/* ❌ Bad */
.bad-animation {
  animation: moveLeft 1s;
}
@keyframes moveLeft {
  from { left: 0; }
  to { left: 100px; }
}

/* ✅ Good */
.good-animation {
  animation: slideLeft 1s;
}
@keyframes slideLeft {
  from { transform: translateX(0); }
  to { transform: translateX(100px); }
}
```

### Animation Performance Hook

```tsx
// hooks/useOptimizedAnimation.ts
import { useEffect, useState } from 'react'

export function useOptimizedAnimation() {
  const [shouldReduceMotion, setShouldReduceMotion] = useState(false)
  const [isLowPerformance, setIsLowPerformance] = useState(false)

  useEffect(() => {
    // Check user preference for reduced motion
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setShouldReduceMotion(mediaQuery.matches)

    const handleChange = () => setShouldReduceMotion(mediaQuery.matches)
    mediaQuery.addEventListener('change', handleChange)

    // Detect device performance
    const checkPerformance = async () => {
      // Check available memory (if supported)
      if ('deviceMemory' in navigator) {
        const memory = (navigator as any).deviceMemory
        if (memory < 4) {
          setIsLowPerformance(true)
        }
      }

      // Check hardware concurrency
      if (navigator.hardwareConcurrency < 4) {
        setIsLowPerformance(true)
      }
    }

    checkPerformance()

    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  return {
    shouldReduceMotion,
    isLowPerformance,
    animationDuration: (base: number) =>
      shouldReduceMotion ? 0 : isLowPerformance ? base * 0.7 : base,
    shouldAnimate: !shouldReduceMotion,
  }
}

// Usage example
function AnimatedComponent() {
  const { shouldAnimate, animationDuration } = useOptimizedAnimation()

  return (
    <motion.div
      animate={shouldAnimate ? {
        scale: [1, 1.05, 1],
      } : {}}
      transition={{
        duration: animationDuration(2),
        repeat: shouldAnimate ? Infinity : 0,
      }}
    >
      Content
    </motion.div>
  )
}
```

### Lazy Loading Animations

```tsx
// Only load heavy animation libraries when needed
import { lazy, Suspense } from 'react'

const HeavyAnimatedComponent = lazy(() => import('./HeavyAnimatedComponent'))

function ConditionalAnimation({ shouldUseComplex }: Props) {
  if (!shouldUseComplex) {
    // Simple CSS animation
    return <div className="animate-fade-in">Simple content</div>
  }

  // Complex animation with lazy loading
  return (
    <Suspense fallback={<div className="animate-pulse">Loading...</div>}>
      <HeavyAnimatedComponent />
    </Suspense>
  )
}
```

### Intersection Observer for Scroll Animations

```tsx
// hooks/useScrollAnimation.ts
import { useEffect, useRef, useState } from 'react'

export function useScrollAnimation(threshold = 0.1) {
  const ref = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          // Optionally unobserve after first view
          observer.unobserve(entry.target)
        }
      },
      {
        threshold,
        rootMargin: '50px',
      }
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current)
      }
    }
  }, [threshold])

  return { ref, isVisible }
}

// Usage
function ScrollAnimatedComponent() {
  const { ref, isVisible } = useScrollAnimation()

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      animate={isVisible ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6 }}
    >
      Content appears when scrolled into view
    </motion.div>
  )
}
```

### Request Animation Frame Throttling

```tsx
// utils/animationFrame.ts
export function throttleAnimationFrame(callback: () => void) {
  let rafId: number | null = null
  let lastTime = 0

  return () => {
    const now = Date.now()

    // Throttle to ~60fps
    if (now - lastTime < 16) return

    if (rafId) {
      cancelAnimationFrame(rafId)
    }

    rafId = requestAnimationFrame(() => {
      callback()
      lastTime = now
      rafId = null
    })
  }
}

// Usage in scroll handler
const handleScroll = throttleAnimationFrame(() => {
  // Update parallax effect
  updateParallax()
})

window.addEventListener('scroll', handleScroll)
```

---

## Accessibility Considerations

### Respecting User Preferences

```css
/* Reduce motion for users who prefer it */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }

  /* Maintain opacity changes for visibility */
  * {
    animation-name: none !important;
    transition-property: opacity !important;
  }
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .animated-gradient {
    background: solid-color !important;
  }

  .subtle-shadow {
    box-shadow: none !important;
    border: 2px solid currentColor !important;
  }
}
```

### Focus Management

```tsx
// Ensure focus is maintained during animations
function AnimatedModal({ isOpen, onClose }: Props) {
  const modalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen && modalRef.current) {
      // Save previous focus
      const previousFocus = document.activeElement as HTMLElement

      // Focus modal after animation
      setTimeout(() => {
        modalRef.current?.focus()
      }, 300)

      // Restore focus on close
      return () => {
        previousFocus?.focus()
      }
    }
  }, [isOpen])

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={modalRef}
          tabIndex={-1}
          role="dialog"
          aria-modal="true"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
        >
          {/* Modal content */}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
```

### Screen Reader Announcements

```tsx
// Announce state changes to screen readers
function AnimatedNotification({ message }: Props) {
  return (
    <motion.div
      role="alert"
      aria-live="polite"
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 100 }}

      // Add aria-label for context
      aria-label={`Notification: ${message}`}
    >
      {message}
    </motion.div>
  )
}
```

### Skip Animation Option

```tsx
// Allow users to skip long animations
function SkippableAnimation({ children, onSkip }: Props) {
  const [isSkipped, setIsSkipped] = useState(false)

  return (
    <div>
      {!isSkipped && (
        <button
          className="absolute top-4 right-4 z-50 text-white/70 hover:text-white"
          onClick={() => {
            setIsSkipped(true)
            onSkip?.()
          }}
          aria-label="Skip animation"
        >
          Skip →
        </button>
      )}

      {isSkipped ? (
        <div>{children}</div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 2 }}
        >
          {children}
        </motion.div>
      )}
    </div>
  )
}
```

---

## Implementation Code Snippets

### Global Animation Context

```tsx
// contexts/AnimationContext.tsx
import { createContext, useContext, useState } from 'react'

interface AnimationSettings {
  enabled: boolean
  intensity: 'low' | 'medium' | 'high'
  soundEnabled: boolean
}

const AnimationContext = createContext<{
  settings: AnimationSettings
  updateSettings: (settings: Partial<AnimationSettings>) => void
} | null>(null)

export function AnimationProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AnimationSettings>({
    enabled: true,
    intensity: 'high',
    soundEnabled: true,
  })

  const updateSettings = (newSettings: Partial<AnimationSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }))
  }

  return (
    <AnimationContext.Provider value={{ settings, updateSettings }}>
      {children}
    </AnimationContext.Provider>
  )
}

export function useAnimation() {
  const context = useContext(AnimationContext)
  if (!context) {
    throw new Error('useAnimation must be used within AnimationProvider')
  }
  return context
}
```

### Settings Panel

```tsx
// components/AnimationSettings.tsx
export function AnimationSettings() {
  const { settings, updateSettings } = useAnimation()

  return (
    <motion.div
      className="p-6 rounded-xl bg-white/10 backdrop-blur-sm"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <h3 className="text-xl text-white mb-4">Animation Settings</h3>

      {/* Enable/Disable */}
      <label className="flex items-center gap-3 mb-4">
        <input
          type="checkbox"
          checked={settings.enabled}
          onChange={e => updateSettings({ enabled: e.target.checked })}
          className="w-5 h-5"
        />
        <span className="text-white">Enable Animations</span>
      </label>

      {/* Intensity */}
      <div className="mb-4">
        <label className="text-white block mb-2">Animation Intensity</label>
        <select
          value={settings.intensity}
          onChange={e => updateSettings({
            intensity: e.target.value as 'low' | 'medium' | 'high'
          })}
          className="w-full p-2 rounded bg-white/10 text-white"
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
      </div>

      {/* Sound */}
      <label className="flex items-center gap-3">
        <input
          type="checkbox"
          checked={settings.soundEnabled}
          onChange={e => updateSettings({ soundEnabled: e.target.checked })}
          className="w-5 h-5"
        />
        <span className="text-white">Enable Sound Effects</span>
      </label>
    </motion.div>
  )
}
```

### Parallax Background

```tsx
// components/ParallaxBackground.tsx
export function ParallaxBackground() {
  const [scrollY, setScrollY] = useState(0)

  useEffect(() => {
    const handleScroll = throttleAnimationFrame(() => {
      setScrollY(window.scrollY)
    })

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {/* Layer 1 - Slowest */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-purple-900/50 to-pink-900/50"
        style={{
          y: scrollY * 0.1,
        }}
      />

      {/* Layer 2 - Medium speed */}
      <motion.div
        className="absolute inset-0"
        style={{
          y: scrollY * 0.3,
        }}
      >
        {[...Array(10)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 rounded-full bg-white/20"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
          />
        ))}
      </motion.div>

      {/* Layer 3 - Fastest */}
      <motion.div
        className="absolute inset-0 bg-gradient-radial from-transparent to-black/50"
        style={{
          y: scrollY * 0.5,
        }}
      />
    </div>
  )
}
```

### Particle System

```tsx
// components/ParticleSystem.tsx
interface Particle {
  id: number
  x: number
  y: number
  size: number
  duration: number
  delay: number
}

export function ParticleSystem({ count = 30 }: { count?: number }) {
  const particles = useMemo<Particle[]>(() => {
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 4 + 1,
      duration: Math.random() * 3 + 2,
      delay: Math.random() * 2,
    }))
  }, [count])

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map(particle => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full bg-white/30 blur-sm"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: particle.size,
            height: particle.size,
          }}
          animate={{
            y: [0, -100, -200],
            opacity: [0, 0.8, 0],
            scale: [1, 1.2, 0.8],
          }}
          transition={{
            duration: particle.duration,
            repeat: Infinity,
            delay: particle.delay,
            ease: "easeOut",
          }}
        />
      ))}
    </div>
  )
}
```

### Sound-Synced Animation

```tsx
// components/SoundSyncedAnimation.tsx
import { useAudio } from '@/contexts/AudioContext'

export function SoundSyncedAnimation({ children }: { children: React.ReactNode }) {
  const { sounds } = useAudio()
  const [intensity, setIntensity] = useState(1)

  const handleClick = () => {
    // Play sound
    sounds.select.play()

    // Sync animation with sound
    setIntensity(1.5)
    setTimeout(() => setIntensity(1), 300)
  }

  return (
    <motion.div
      onClick={handleClick}
      animate={{
        scale: intensity,
      }}
      transition={{
        type: 'spring',
        stiffness: 500,
        damping: 15,
      }}
    >
      {children}
    </motion.div>
  )
}
```

---

## Best Practices Summary

### Do's ✅

- **Use CSS transforms** (translate, scale, rotate) instead of position properties
- **Leverage GPU acceleration** with `transform: translateZ(0)`
- **Respect `prefers-reduced-motion`** for accessibility
- **Throttle scroll/resize handlers** with `requestAnimationFrame`
- **Use `will-change` sparingly** and only when needed
- **Lazy load heavy animation libraries**
- **Test on low-end devices** to ensure smooth performance
- **Provide skip buttons** for long animations
- **Maintain focus management** during animated transitions
- **Use consistent easing** for cohesive feel

### Don'ts ❌

- **Don't animate `width`/`height`** - use `scale` instead
- **Don't animate `left`/`top`** - use `transform: translate` instead
- **Don't use `animate()` for everything** - CSS is often better for simple effects
- **Don't forget to clean up** - remove event listeners and cancel animations
- **Don't block user interaction** - keep animations interruptible
- **Don't overuse `will-change`** - it can hurt performance
- **Don't ignore battery/performance mode** - reduce animations when needed
- **Don't animate during critical user flows** - prioritize usability

---

## Resources & References

### Tools & Libraries

- [Framer Motion](https://www.framer.com/motion/) - React animation library
- [Tailwind CSS 4](https://tailwindcss.com) - Utility-first CSS with animation support
- [cubic-bezier.com](https://cubic-bezier.com) - Easing function generator
- [Animista](https://animista.net) - CSS animation library and generator
- [Lottie](https://airbnb.io/lottie/) - Vector animation library

### Performance

- [Web.dev: Animations Guide](https://web.dev/animations-guide/)
- [MDN: CSS Triggers](https://csstriggers.com) - What CSS properties trigger layouts/paints
- [Chrome DevTools: Performance](https://developer.chrome.com/docs/devtools/performance/)

### Accessibility

- [WCAG 2.4.2: Animation from Interactions](https://www.w3.org/WAI/WCAG21/Understanding/pause-stop-hide.html)
- [A11y: Accessible Animations](https://www.a11yproject.com/posts/understanding-vestibular-disorders/)

---

*Last Updated: 2024-11-12*
*Version: 1.0*
