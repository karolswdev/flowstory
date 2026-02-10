import { useMemo } from 'react';
import { STAGGER, DURATION, EASING } from './presets';
import { useReducedMotion } from './useReducedMotion';

export interface StaggerConfig {
  /** Stagger delay between items (seconds) */
  stagger?: number;
  /** Base delay before first item (seconds) */
  baseDelay?: number;
  /** Duration per item (seconds) */
  duration?: number;
  /** Easing curve */
  ease?: number[];
}

export interface StaggeredTransition {
  duration: number;
  delay: number;
  ease: number[];
}

/**
 * Hook for orchestrating staggered child animations
 * 
 * @param count - Number of children to animate
 * @param config - Stagger configuration
 * @returns Array of transition configs + helper functions
 * 
 * @example
 * const { getTransition, getDelay } = useStaggeredChildren(items.length);
 * 
 * {items.map((item, i) => (
 *   <motion.div
 *     key={item.id}
 *     initial={{ opacity: 0, y: 10 }}
 *     animate={{ opacity: 1, y: 0 }}
 *     transition={getTransition(i)}
 *   />
 * ))}
 */
export function useStaggeredChildren(
  count: number,
  config: StaggerConfig = {}
) {
  const prefersReducedMotion = useReducedMotion();
  
  const {
    stagger = STAGGER.normal,
    baseDelay = 0,
    duration = DURATION.standard,
    ease = EASING.default as number[],
  } = config;

  const transitions = useMemo(() => {
    if (prefersReducedMotion) {
      // No stagger, instant transitions
      return Array.from({ length: count }, () => ({
        duration: 0,
        delay: 0,
        ease,
      }));
    }

    return Array.from({ length: count }, (_, index) => ({
      duration,
      delay: baseDelay + index * stagger,
      ease,
    }));
  }, [count, stagger, baseDelay, duration, ease, prefersReducedMotion]);

  const getTransition = (index: number): StaggeredTransition => {
    return transitions[index] || transitions[0] || { duration: 0, delay: 0, ease };
  };

  const getDelay = (index: number): number => {
    if (prefersReducedMotion) return 0;
    return baseDelay + index * stagger;
  };

  const totalDuration = prefersReducedMotion 
    ? 0 
    : baseDelay + (count - 1) * stagger + duration;

  return {
    /** Array of all transition configs */
    transitions,
    /** Get transition config for specific index */
    getTransition,
    /** Get just the delay for specific index */
    getDelay,
    /** Total animation duration (first item start to last item end) */
    totalDuration,
    /** Whether animations are disabled */
    isReduced: prefersReducedMotion,
  };
}

/**
 * Preset stagger configurations
 */
export const STAGGER_PRESETS = {
  /** Fast, tight stagger for lists */
  list: { stagger: STAGGER.tight, duration: DURATION.standard },
  /** Normal card grid stagger */
  cards: { stagger: STAGGER.normal, duration: DURATION.standard },
  /** Slower, more dramatic stagger */
  hero: { stagger: STAGGER.relaxed, duration: DURATION.emphasis },
  /** Very wide spacing for major sections */
  sections: { stagger: STAGGER.wide, duration: DURATION.complex },
} as const;

export default useStaggeredChildren;
