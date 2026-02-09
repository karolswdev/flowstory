import type { Variants, Transition } from 'motion/react';

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

/** Animation variants for node state transitions */
export const nodeVariants: Variants = {
  /** Initial/hidden state - start from nothing */
  hidden: {
    opacity: 0,
    scale: 0,
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
      ease: [0.4, 0, 0.2, 1],
    },
  },
  /** Active in current step - the star of the show */
  active: {
    opacity: 1,
    scale: 1,
    rotate: 0,
    filter: 'blur(0px)',
    transition: bouncySpring,
  },
  /** Completed (was active, now done) */
  complete: {
    opacity: 0.65,
    scale: 0.98,
    rotate: 0,
    filter: 'blur(0px)',
    transition: {
      duration: 0.5,
      ease: [0.4, 0, 0.2, 1],
    },
  },
};

/** Dramatic entrance animation for first appearance */
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

/** Pulsing glow animation for active nodes */
export const pulseVariants: Variants = {
  active: {
    boxShadow: [
      '0 0 0 0 rgba(33, 150, 243, 0), 0 4px 20px rgba(33, 150, 243, 0.2)',
      '0 0 0 12px rgba(33, 150, 243, 0.15), 0 4px 30px rgba(33, 150, 243, 0.4)',
      '0 0 0 0 rgba(33, 150, 243, 0), 0 4px 20px rgba(33, 150, 243, 0.2)',
    ],
    transition: {
      duration: 2,
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

/** Floating animation for actor nodes */
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

/** Icon spin animation for system nodes */
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

/** Lightning flash for event nodes */
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

/** Decision diamond rotation */
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

/** Success celebration for state nodes */
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

/** Stagger children animation for container elements */
export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

/** Stagger item animation */
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

/** Get animation state based on node props */
export function getNodeAnimationState(isActive?: boolean, isComplete?: boolean): string {
  if (isActive) return 'active';
  if (isComplete) return 'complete';
  return 'inactive';
}

/** Get variant for state node based on variant type */
export function getStateVariant(variant?: string, isActive?: boolean): string {
  if (!isActive) return 'inactive';
  if (variant === 'success') return 'success';
  if (variant === 'error') return 'error';
  if (variant === 'warning') return 'warning';
  return 'active';
}
