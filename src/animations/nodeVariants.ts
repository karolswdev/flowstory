/**
 * Node Animation Variants
 * 
 * Framer Motion variants for node state transitions.
 * Based on SPEC-021: Directional Animation System
 */

import type { Variants } from 'motion/react';
import {
  ANIMATION_TIMING,
  ANIMATION_SIZES,
  ANIMATION_OPACITY,
  ANIMATION_SATURATION,
  EASING,
  prefersReducedMotion,
} from './config';

/**
 * Node animation states
 */
export type NodeAnimationState =
  | 'hidden'    // Not yet visible
  | 'entering'  // Animating into view (from left)
  | 'active'    // Currently highlighted
  | 'complete'  // Previously active, still visible
  | 'faded';    // Old history, low emphasis

/**
 * Determine node animation state based on story progress
 */
export function getNodeAnimationState(
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

/**
 * Core node animation variants
 * 
 * Nodes enter from the left with a slide+fade animation.
 */
export const nodeVariants: Variants = {
  hidden: {
    opacity: ANIMATION_OPACITY.hidden,
    x: ANIMATION_SIZES.nodeEntryOffset,
    scale: ANIMATION_SIZES.hiddenScale,
  },
  
  entering: {
    opacity: ANIMATION_OPACITY.entering,
    x: 0,
    scale: ANIMATION_SIZES.activeScale,
    transition: {
      duration: ANIMATION_TIMING.nodeEntryDuration / 1000,
      ease: EASING.easeOutCubic,
    },
  },
  
  active: {
    opacity: ANIMATION_OPACITY.active,
    x: 0,
    scale: ANIMATION_SIZES.activeScale,
    transition: {
      duration: ANIMATION_TIMING.stateTransitionDuration / 1000,
    },
  },
  
  complete: {
    opacity: ANIMATION_OPACITY.complete,
    x: 0,
    scale: ANIMATION_SIZES.completedScale,
    filter: `saturate(${ANIMATION_SATURATION.complete})`,
    transition: {
      duration: ANIMATION_TIMING.stateTransitionDuration / 1000,
    },
  },
  
  faded: {
    opacity: ANIMATION_OPACITY.faded,
    x: 0,
    scale: ANIMATION_SIZES.fadedScale,
    filter: `saturate(${ANIMATION_SATURATION.faded})`,
    transition: {
      duration: ANIMATION_TIMING.completeTransitionDuration / 1000,
    },
  },
};

/**
 * Reduced motion variants - minimal movement
 */
export const reducedMotionVariants: Variants = {
  hidden: { opacity: 0 },
  entering: { opacity: 1, transition: { duration: 0.01 } },
  active: { opacity: 1 },
  complete: { opacity: 0.7 },
  faded: { opacity: 0.4 },
};

/**
 * Get appropriate variants based on motion preference
 */
export function getNodeVariants(): Variants {
  return prefersReducedMotion() ? reducedMotionVariants : nodeVariants;
}

/**
 * Active glow animation for highlighted nodes
 */
export const activeGlowVariants: Variants = {
  inactive: {
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
  },
  
  active: {
    boxShadow: [
      '0 0 0 0 rgba(33, 150, 243, 0)',
      `0 0 0 ${ANIMATION_SIZES.glowSize}px rgba(33, 150, 243, 0.25)`,
      '0 0 0 0 rgba(33, 150, 243, 0)',
    ],
    transition: {
      duration: ANIMATION_TIMING.glowPulseDuration / 1000,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
  
  complete: {
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
    transition: { duration: 0.3 },
  },
};

/**
 * Container variants for staggered children
 */
export const staggerContainerVariants: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: ANIMATION_TIMING.staggerDelay / 1000,
      delayChildren: ANIMATION_TIMING.delayChildren / 1000,
    },
  },
};

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
 * Flash animation for event nodes
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
 * Decision diamond variants
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
