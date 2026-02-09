/**
 * Edge Animation Variants
 * 
 * Framer Motion variants for edge animations.
 * Based on SPEC-021: Directional Animation System
 */

import type { Variants } from 'motion/react';
import {
  ANIMATION_TIMING,
  ANIMATION_OPACITY,
  prefersReducedMotion,
} from './config';

/**
 * Edge animation states
 */
export type EdgeAnimationState =
  | 'hidden'    // Not yet visible
  | 'drawing'   // Stroke animating in
  | 'active'    // Highlighted, maybe with particle
  | 'complete'  // Previously active
  | 'faded';    // Old history

/**
 * Determine edge animation state
 */
export function getEdgeAnimationState(
  edgeId: string,
  activeEdgeIds: string[],
  completedEdgeIds: Set<string>,
  edgeHistory: Map<string, number>,
  currentStepIndex: number
): EdgeAnimationState {
  if (activeEdgeIds.includes(edgeId)) {
    return edgeHistory.has(edgeId) ? 'active' : 'drawing';
  }
  
  if (completedEdgeIds.has(edgeId)) {
    const lastActive = edgeHistory.get(edgeId) ?? 0;
    const stepsSince = currentStepIndex - lastActive;
    return stepsSince > 3 ? 'faded' : 'complete';
  }
  
  return 'hidden';
}

/**
 * Edge stroke animation variants
 */
export const edgeVariants: Variants = {
  hidden: {
    opacity: 0,
    pathLength: 0,
  },
  
  drawing: {
    opacity: 1,
    pathLength: 1,
    transition: {
      pathLength: {
        duration: ANIMATION_TIMING.edgeDrawDuration / 1000,
        ease: 'easeOut',
      },
      opacity: {
        duration: 0.1,
      },
    },
  },
  
  active: {
    opacity: 1,
    pathLength: 1,
    transition: {
      duration: ANIMATION_TIMING.stateTransitionDuration / 1000,
    },
  },
  
  complete: {
    opacity: ANIMATION_OPACITY.complete,
    pathLength: 1,
    transition: {
      duration: ANIMATION_TIMING.stateTransitionDuration / 1000,
    },
  },
  
  faded: {
    opacity: ANIMATION_OPACITY.faded,
    pathLength: 1,
    transition: {
      duration: ANIMATION_TIMING.completeTransitionDuration / 1000,
    },
  },
};

/**
 * Reduced motion edge variants
 */
export const reducedMotionEdgeVariants: Variants = {
  hidden: { opacity: 0 },
  drawing: { opacity: 1, transition: { duration: 0.01 } },
  active: { opacity: 1 },
  complete: { opacity: 0.7 },
  faded: { opacity: 0.4 },
};

/**
 * Get appropriate edge variants
 */
export function getEdgeVariants(): Variants {
  return prefersReducedMotion() ? reducedMotionEdgeVariants : edgeVariants;
}

/**
 * Event particle animation variants
 */
export const particleVariants: Variants = {
  hidden: {
    opacity: 0,
    offsetDistance: '0%',
  },
  
  traveling: {
    opacity: 1,
    offsetDistance: '100%',
    transition: {
      duration: ANIMATION_TIMING.particleDuration / 1000,
      ease: 'easeInOut',
    },
  },
  
  arrived: {
    opacity: 0,
    offsetDistance: '100%',
    transition: {
      opacity: { duration: 0.1 },
    },
  },
};

/**
 * Edge pulse animation for active event edges
 */
export const edgePulseVariants: Variants = {
  inactive: {
    strokeWidth: 2,
    strokeOpacity: 0.6,
  },
  
  active: {
    strokeWidth: [2, 3, 2],
    strokeOpacity: [0.6, 1, 0.6],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

/**
 * CSS keyframes for edge draw (used with stroke-dasharray)
 */
export const EDGE_DRAW_KEYFRAMES = `
@keyframes draw-edge {
  from {
    stroke-dashoffset: var(--edge-length);
  }
  to {
    stroke-dashoffset: 0;
  }
}

@keyframes edge-trace {
  0% {
    stroke-dashoffset: var(--edge-length);
    opacity: 0;
  }
  10% {
    opacity: 1;
  }
  100% {
    stroke-dashoffset: 0;
    opacity: 1;
  }
}
`;

/**
 * Calculate edge delay based on when source node finishes entering
 */
export function calculateEdgeDelay(
  nodeEntryDelay: number,
  nodeIndex: number
): number {
  const nodeFinishTime = 
    ANIMATION_TIMING.delayChildren + 
    (nodeIndex * ANIMATION_TIMING.staggerDelay) + 
    ANIMATION_TIMING.nodeEntryDuration;
  
  return nodeFinishTime + ANIMATION_TIMING.edgeDrawDelay;
}
