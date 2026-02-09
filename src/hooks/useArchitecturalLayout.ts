/**
 * Hook for computing and caching architectural layout
 * 
 * Computes layout ONCE when story loads, caches positions for entire playback.
 * 
 * @module hooks/useArchitecturalLayout
 */

import { useMemo } from 'react';
import { computeArchitecturalLayout, type LayoutResult } from '../utils/layout';
import type { UserStory } from '../types/story';

/**
 * Compute and cache architectural layout for a story
 * 
 * @param story - The story to layout
 * @returns Layout result with node positions and BC regions
 */
export function useArchitecturalLayout(story: UserStory | null): LayoutResult | null {
  return useMemo(() => {
    if (!story) return null;
    
    // Only compute layout for architectural stories
    if (story.schemaVersion !== '2.0' && story.renderer !== 'architectural') {
      return null;
    }
    
    try {
      return computeArchitecturalLayout(story);
    } catch (error) {
      console.error('Failed to compute architectural layout:', error);
      return null;
    }
  }, [story?.id]); // Only recompute when story ID changes
}

export default useArchitecturalLayout;
