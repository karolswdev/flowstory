import { useState, useEffect } from 'react';

/**
 * React hook to detect user's reduced motion preference
 * 
 * @returns boolean - true if user prefers reduced motion
 * 
 * @example
 * const prefersReducedMotion = useReducedMotion();
 * 
 * <motion.div
 *   animate={{ opacity: 1, y: prefersReducedMotion ? 0 : 20 }}
 *   transition={{ duration: prefersReducedMotion ? 0 : 0.3 }}
 * />
 */
export function useReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() => {
    // SSR-safe initial value
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    
    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    // Listen for changes (user might toggle setting while app is open)
    mediaQuery.addEventListener('change', handleChange);
    
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  return prefersReducedMotion;
}

export default useReducedMotion;
