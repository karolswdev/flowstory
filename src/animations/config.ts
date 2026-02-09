/**
 * Animation Configuration
 * 
 * Central configuration for all animation timings and easing curves.
 * Based on SPEC-021: Directional Animation System
 */

/** Animation timing constants (in milliseconds) */
export const ANIMATION_TIMING = {
  // Node entry
  nodeEntryDuration: 300,
  staggerDelay: 80,
  delayChildren: 100,
  
  // State transitions
  stateTransitionDuration: 200,
  completeTransitionDuration: 400,
  
  // Edges
  edgeDrawDuration: 400,
  edgeDrawDelay: 50, // Delay after nodes visible
  
  // Particles
  particleDuration: 600,
  particleDelay: 100, // After edge draws
  
  // Glow
  glowPulseDuration: 2000,
  
  // Dim
  dimTransitionDuration: 300,
  
  // Total step transition (approximate)
  totalStepTransition: 1600,
} as const;

/** Easing curves */
export const EASING = {
  // Smooth deceleration (ease-out-cubic)
  easeOutCubic: [0.4, 0, 0.2, 1] as const,
  
  // Natural spring
  spring: {
    type: 'spring' as const,
    stiffness: 400,
    damping: 30,
    mass: 1,
  },
  
  // Bouncy spring for emphasis
  bouncy: {
    type: 'spring' as const,
    stiffness: 500,
    damping: 25,
    mass: 0.8,
  },
} as const;

/** Size and offset constants */
export const ANIMATION_SIZES = {
  // Entry offset (enter from left)
  nodeEntryOffset: -40,
  
  // Scale values
  hiddenScale: 0.95,
  activeScale: 1,
  completedScale: 1,
  fadedScale: 0.98,
  
  // Glow size
  glowSize: 8,
  
  // Particle size
  particleRadius: 6,
} as const;

/** Opacity values for states */
export const ANIMATION_OPACITY = {
  hidden: 0,
  entering: 1,
  active: 1,
  complete: 0.7,
  faded: 0.4,
  inactiveDim: 0.5,
} as const;

/** Saturation filter values */
export const ANIMATION_SATURATION = {
  active: 1,
  complete: 0.8,
  faded: 0.5,
} as const;

/** Check for reduced motion preference */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** Get timing based on reduced motion preference */
export function getTiming(key: keyof typeof ANIMATION_TIMING): number {
  if (prefersReducedMotion()) {
    return 10; // Near-instant transitions
  }
  return ANIMATION_TIMING[key];
}

/** Layer ordering for entry animation */
export const LAYER_ORDER = {
  orchestration: 0,
  domain: 1,
  infrastructure: 2,
} as const;

export type LayerName = keyof typeof LAYER_ORDER;
