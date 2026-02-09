import type { Variants } from 'motion/react';

/** Animation variants for edge state transitions */
export const edgeVariants: Variants = {
  hidden: {
    opacity: 0,
    pathLength: 0,
  },
  inactive: {
    opacity: 0.5,
    pathLength: 1,
    transition: {
      duration: 0.3,
      ease: 'easeOut',
    },
  },
  active: {
    opacity: 1,
    pathLength: 1,
    transition: {
      duration: 0.5,
      ease: 'easeOut',
    },
  },
};

/** Path tracing animation for edges */
export const pathTracingVariants: Variants = {
  hidden: {
    pathLength: 0,
    opacity: 0,
  },
  visible: {
    pathLength: 1,
    opacity: 1,
    transition: {
      pathLength: {
        duration: 0.8,
        ease: 'easeInOut',
      },
      opacity: {
        duration: 0.2,
      },
    },
  },
};

/** Get animation state for edges */
export function getEdgeAnimationState(isActive?: boolean): string {
  return isActive ? 'active' : 'inactive';
}
