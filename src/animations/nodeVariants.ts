/**
 * Node Animation Variants
 * 
 * Framer Motion variants for node state transitions.
 * Consolidates all node animation logic into a single source of truth.
 * Based on SPEC-021: Directional Animation System
 */

import type { Variants, Transition } from 'motion/react';
import {
  ANIMATION_TIMING,
  ANIMATION_SIZES,
  ANIMATION_OPACITY,
  ANIMATION_SATURATION,
  EASING,
  prefersReducedMotion,
} from './config';

// ============================================================================
// Transitions
// ============================================================================

/** Smooth spring transition for natural movement */
const smoothSpring: Transition = {
  type: 'spring',
  stiffness: 400,
  damping: 30,
  mass: 1,
};

/** Bouncy spring for dramatic entrances */
const bouncySpring: Transition = {
  type: 'spring',
  stiffness: 500,
  damping: 25,
  mass: 0.8,
};

// ============================================================================
// Types
// ============================================================================

/**
 * Node animation states
 */
export type NodeAnimationState =
  | 'hidden'    // Not yet visible
  | 'entering'  // Animating into view (from left)
  | 'active'    // Currently highlighted
  | 'inactive'  // Not active but visible
  | 'complete'  // Previously active, still visible
  | 'faded';    // Old history, low emphasis

// ============================================================================
// State Helpers
// ============================================================================

/**
 * Get animation state based on node props (simple version for components)
 */
export function getNodeAnimationState(isActive?: boolean, isComplete?: boolean): string {
  if (isActive) return 'active';
  if (isComplete) return 'complete';
  return 'inactive';
}

/**
 * Get variant for state node based on variant type
 */
export function getStateVariant(variant?: string, isActive?: boolean): string {
  if (!isActive) return 'inactive';
  if (variant === 'success') return 'success';
  if (variant === 'error') return 'error';
  if (variant === 'warning') return 'warning';
  return 'active';
}

/**
 * Determine node animation state based on story progress (advanced version)
 */
export function getNodeAnimationStateAdvanced(
  nodeId: string,
  activeNodeIds: string[],
  completedNodeIds: Set<string>,
  nodeHistory: Map<string, number>,
  currentStepIndex: number
): NodeAnimationState {
  // Active this step
  if (activeNodeIds.includes(nodeId)) {
    // If this is the first time we see it, it's entering
    // Otherwise it's just active
    return nodeHistory.has(nodeId) ? 'active' : 'entering';
  }
  
  // Previously seen
  if (completedNodeIds.has(nodeId)) {
    const lastActive = nodeHistory.get(nodeId) ?? 0;
    const stepsSince = currentStepIndex - lastActive;
    return stepsSince > 3 ? 'faded' : 'complete';
  }
  
  return 'hidden';
}

// ============================================================================
// Core Node Variants
// ============================================================================

/**
 * Animation variants for node state transitions
 * Includes blur and rotate for dramatic effect
 */
export const nodeVariants: Variants = {
  /** Initial/hidden state - start from nothing */
  hidden: {
    opacity: ANIMATION_OPACITY.hidden,
    scale: ANIMATION_SIZES.hiddenScale,
    rotate: -10,
    filter: 'blur(10px)',
  },
  /** Inactive but visible (completed in earlier step) */
  inactive: {
    opacity: 0.5,
    scale: 0.95,
    rotate: 0,
    filter: 'blur(0px)',
    transition: {
      duration: 0.4,
      ease: EASING.easeOutCubic,
    },
  },
  /** Entering from left with slide animation */
  entering: {
    opacity: ANIMATION_OPACITY.entering,
    x: 0,
    scale: ANIMATION_SIZES.activeScale,
    rotate: 0,
    filter: 'blur(0px)',
    transition: {
      duration: ANIMATION_TIMING.nodeEntryDuration / 1000,
      ease: EASING.easeOutCubic,
    },
  },
  /** Active in current step - the star of the show */
  active: {
    opacity: ANIMATION_OPACITY.active,
    scale: ANIMATION_SIZES.activeScale,
    rotate: 0,
    filter: 'blur(0px)',
    transition: bouncySpring,
  },
  /** Completed (was active, now done) */
  complete: {
    opacity: ANIMATION_OPACITY.complete,
    scale: ANIMATION_SIZES.completedScale,
    rotate: 0,
    filter: `blur(0px) saturate(${ANIMATION_SATURATION.complete})`,
    transition: {
      duration: ANIMATION_TIMING.stateTransitionDuration / 1000,
      ease: EASING.easeOutCubic,
    },
  },
  /** Faded - old history, low emphasis */
  faded: {
    opacity: ANIMATION_OPACITY.faded,
    scale: ANIMATION_SIZES.fadedScale,
    rotate: 0,
    filter: `blur(0px) saturate(${ANIMATION_SATURATION.faded})`,
    transition: {
      duration: ANIMATION_TIMING.completeTransitionDuration / 1000,
    },
  },
};

/**
 * Dramatic entrance animation for first appearance
 */
export const entranceVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0,
    y: 50,
    rotate: -15,
    filter: 'blur(20px)',
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    rotate: 0,
    filter: 'blur(0px)',
    transition: {
      ...bouncySpring,
      opacity: { duration: 0.3 },
      filter: { duration: 0.4 },
    },
  },
  exit: {
    opacity: 0,
    scale: 0.8,
    filter: 'blur(10px)',
    transition: { duration: 0.2 },
  },
};

/**
 * Reduced motion variants - minimal movement
 */
export const reducedMotionVariants: Variants = {
  hidden: { opacity: 0 },
  entering: { opacity: 1, transition: { duration: 0.01 } },
  active: { opacity: 1 },
  inactive: { opacity: 0.5 },
  complete: { opacity: 0.7 },
  faded: { opacity: 0.4 },
};

/**
 * Get appropriate variants based on motion preference
 */
export function getNodeVariants(): Variants {
  return prefersReducedMotion() ? reducedMotionVariants : nodeVariants;
}

// ============================================================================
// Glow Effects
// ============================================================================

/**
 * Pulsing glow animation for active nodes
 */
export const pulseVariants: Variants = {
  active: {
    boxShadow: [
      '0 0 0 0 rgba(33, 150, 243, 0), 0 4px 20px rgba(33, 150, 243, 0.2)',
      `0 0 0 ${ANIMATION_SIZES.glowSize + 4}px rgba(33, 150, 243, 0.15), 0 4px 30px rgba(33, 150, 243, 0.4)`,
      '0 0 0 0 rgba(33, 150, 243, 0), 0 4px 20px rgba(33, 150, 243, 0.2)',
    ],
    transition: {
      duration: ANIMATION_TIMING.glowPulseDuration / 1000,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
  inactive: {
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
    transition: { duration: 0.3 },
  },
  complete: {
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
    transition: { duration: 0.3 },
  },
};

/**
 * Active glow animation (alias for pulseVariants for backwards compat)
 */
export const activeGlowVariants = pulseVariants;

// ============================================================================
// Stagger Containers
// ============================================================================

/**
 * Container variants for staggered children
 */
export const staggerContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: ANIMATION_TIMING.staggerDelay / 1000,
      delayChildren: ANIMATION_TIMING.delayChildren / 1000,
    },
  },
};

/** Alias for backwards compat */
export const staggerContainer = staggerContainerVariants;

/**
 * Stagger item animation
 */
export const staggerItem: Variants = {
  hidden: { 
    opacity: 0, 
    y: 20,
    scale: 0.9,
  },
  visible: { 
    opacity: 1, 
    y: 0,
    scale: 1,
    transition: smoothSpring,
  },
};

// ============================================================================
// Node-Type Specific Animations
// ============================================================================

/**
 * Floating animation for actor nodes
 */
export const floatVariants: Variants = {
  active: {
    y: [0, -6, 0],
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
  inactive: {
    y: 0,
  },
};

/**
 * Spin animation for system nodes
 */
export const spinVariants: Variants = {
  active: {
    rotate: [0, 360],
    transition: {
      duration: 4,
      repeat: Infinity,
      ease: 'linear',
    },
  },
  inactive: {
    rotate: 0,
  },
};

/**
 * Lightning flash animation for event nodes
 */
export const flashVariants: Variants = {
  active: {
    opacity: [1, 0.6, 1],
    scale: [1, 1.05, 1],
    transition: {
      duration: 0.8,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
  inactive: {
    opacity: 1,
    scale: 1,
  },
};

/**
 * Decision diamond rotation
 */
export const decisionVariants: Variants = {
  active: {
    rotateY: [0, 10, 0, -10, 0],
    transition: {
      duration: 2.5,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
  inactive: {
    rotateY: 0,
  },
};

/**
 * State celebration variants
 */
export const celebrateVariants: Variants = {
  success: {
    scale: [1, 1.1, 1],
    rotate: [0, 3, -3, 0],
    transition: {
      duration: 0.6,
      ease: 'easeOut',
    },
  },
  error: {
    x: [0, -5, 5, -5, 5, 0],
    transition: {
      duration: 0.4,
      ease: 'easeInOut',
    },
  },
  warning: {
    scale: [1, 1.02, 1],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};
