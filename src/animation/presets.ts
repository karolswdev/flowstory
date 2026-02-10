/**
 * FlowStory Animation Presets
 * 
 * Shared timing, easing, and motion configuration.
 * All Canvas components should use these for consistency.
 */

// ============================================
// Duration Tokens (seconds)
// ============================================

export const DURATION = {
  /** Micro interactions: hover, focus */
  micro: 0.1,
  /** Standard element transitions */
  standard: 0.25,
  /** Emphasis animations */
  emphasis: 0.4,
  /** Complex orchestrated sequences */
  complex: 0.6,
} as const;

// ============================================
// Stagger Delays (seconds)
// ============================================

export const STAGGER = {
  /** Tight grouping (cards, list items) */
  tight: 0.03,
  /** Normal spacing */
  normal: 0.05,
  /** Relaxed spacing (hero elements) */
  relaxed: 0.08,
  /** Wide spacing (major sections) */
  wide: 0.12,
} as const;

// ============================================
// Easing Curves
// ============================================

export const EASING = {
  /** Standard ease-out for most animations */
  default: [0.4, 0, 0.2, 1],
  /** Ease-in for exits */
  exit: [0.4, 0, 1, 1],
  /** Ease-in-out for bidirectional */
  inOut: [0.4, 0, 0.2, 1],
  /** Bounce for playful emphasis */
  bounce: [0.68, -0.55, 0.265, 1.55],
} as const;

// ============================================
// Spring Configs (for Motion)
// ============================================

export const SPRING = {
  /** Snappy response */
  snappy: { stiffness: 400, damping: 30 },
  /** Standard spring */
  default: { stiffness: 300, damping: 30 },
  /** Gentle spring */
  gentle: { stiffness: 200, damping: 25 },
  /** Bouncy spring */
  bouncy: { stiffness: 400, damping: 20 },
} as const;

// ============================================
// Motion Variants
// ============================================

/**
 * Fade up - most common entry animation
 */
export const fadeUp = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
};

/**
 * Fade in - simple opacity
 */
export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

/**
 * Scale in - emphasis entry
 */
export const scaleIn = {
  initial: { opacity: 0, scale: 0.9 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
};

/**
 * Slide in from left
 */
export const slideInLeft = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
};

/**
 * Slide in from right
 */
export const slideInRight = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 20 },
};

/**
 * Pop in - for notifications, badges
 */
export const popIn = {
  initial: { opacity: 0, scale: 0.8 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.8 },
};

// ============================================
// Transition Presets
// ============================================

export const TRANSITION = {
  /** Default transition */
  default: {
    duration: DURATION.standard,
    ease: EASING.default,
  },
  /** Fast micro-interaction */
  micro: {
    duration: DURATION.micro,
    ease: EASING.default,
  },
  /** Emphasis with spring */
  spring: {
    type: 'spring' as const,
    ...SPRING.default,
  },
  /** Staggered children */
  stagger: (index: number, stagger = STAGGER.normal) => ({
    duration: DURATION.standard,
    delay: index * stagger,
    ease: EASING.default,
  }),
} as const;

// ============================================
// Helper Functions
// ============================================

/**
 * Generate stagger delays for a list of items
 */
export function getStaggerDelays(
  count: number,
  stagger = STAGGER.normal,
  baseDelay = 0
): number[] {
  return Array.from({ length: count }, (_, i) => baseDelay + i * stagger);
}

/**
 * Check if user prefers reduced motion
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Get duration respecting reduced motion preference
 */
export function getAnimationDuration(duration: number): number {
  return prefersReducedMotion() ? 0 : duration;
}

/**
 * Get transition config respecting reduced motion
 */
export function getTransition(config: typeof TRANSITION.default = TRANSITION.default) {
  if (prefersReducedMotion()) {
    return { duration: 0 };
  }
  return config;
}

/**
 * Motion variants that respect reduced motion
 * Returns static state when reduced motion is preferred
 */
export const accessibleVariants = {
  fadeUp: prefersReducedMotion() 
    ? { initial: fadeUp.animate, animate: fadeUp.animate, exit: fadeUp.animate }
    : fadeUp,
  fadeIn: prefersReducedMotion()
    ? { initial: fadeIn.animate, animate: fadeIn.animate, exit: fadeIn.animate }
    : fadeIn,
  scaleIn: prefersReducedMotion()
    ? { initial: scaleIn.animate, animate: scaleIn.animate, exit: scaleIn.animate }
    : scaleIn,
};
