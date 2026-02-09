import { useState, useCallback, useEffect, useRef } from 'react';
import type { AnimationPhase } from '../components/edges/AnimatedEventEdge';

/**
 * Timing constants for animation phases (in ms)
 */
export const ANIMATION_TIMING = {
  emit: 150,
  transit: 500,
  receive: 150,
  complete: 100,
  total: 900, // emit + transit + receive + complete
} as const;

/**
 * Event animation state
 */
interface EventAnimation {
  edgeId: string;
  phase: AnimationPhase;
  eventColor: string;
  startTime: number;
}

/**
 * Animation controller state
 */
interface AnimationControllerState {
  activeAnimations: Map<string, EventAnimation>;
}

/**
 * Animation controller return type
 */
interface AnimationController {
  /** Current active animations keyed by edge ID */
  activeAnimations: Map<string, EventAnimation>;
  
  /** Trigger an event animation on an edge */
  triggerEvent: (edgeId: string, eventColor?: string) => void;
  
  /** Trigger animations on multiple edges in sequence */
  triggerSequence: (edgeIds: string[], eventColor?: string, delayBetween?: number) => void;
  
  /** Cancel all active animations */
  cancelAll: () => void;
  
  /** Get animation phase for a specific edge */
  getPhase: (edgeId: string) => AnimationPhase;
  
  /** Check if any animations are active */
  isAnimating: boolean;
}

/**
 * Hook for managing event edge animations
 * 
 * @example
 * ```tsx
 * const { triggerEvent, getPhase, activeAnimations } = useAnimationController();
 * 
 * // Trigger animation when step changes
 * useEffect(() => {
 *   step.activeEdges?.forEach(edgeId => {
 *     triggerEvent(edgeId);
 *   });
 * }, [step]);
 * 
 * // Get phase for edge data
 * const edgeData = {
 *   ...originalData,
 *   animationPhase: getPhase(edge.id),
 * };
 * ```
 */
export function useAnimationController(): AnimationController {
  const [state, setState] = useState<AnimationControllerState>({
    activeAnimations: new Map(),
  });
  
  const timeoutsRef = useRef<Map<string, number[]>>(new Map());

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      timeoutsRef.current.forEach(timeouts => {
        timeouts.forEach(clearTimeout);
      });
    };
  }, []);

  const setPhase = useCallback((edgeId: string, phase: AnimationPhase) => {
    setState(prev => {
      const next = new Map(prev.activeAnimations);
      const anim = next.get(edgeId);
      if (anim) {
        next.set(edgeId, { ...anim, phase });
      }
      return { activeAnimations: next };
    });
  }, []);

  const clearAnimation = useCallback((edgeId: string) => {
    setState(prev => {
      const next = new Map(prev.activeAnimations);
      next.delete(edgeId);
      return { activeAnimations: next };
    });
    
    // Clear any pending timeouts for this edge
    const timeouts = timeoutsRef.current.get(edgeId);
    if (timeouts) {
      timeouts.forEach(clearTimeout);
      timeoutsRef.current.delete(edgeId);
    }
  }, []);

  const triggerEvent = useCallback((edgeId: string, eventColor: string = '#22c55e') => {
    // Clear any existing animation on this edge
    clearAnimation(edgeId);

    const animation: EventAnimation = {
      edgeId,
      phase: 'emitting',
      eventColor,
      startTime: Date.now(),
    };

    setState(prev => {
      const next = new Map(prev.activeAnimations);
      next.set(edgeId, animation);
      return { activeAnimations: next };
    });

    // Schedule phase transitions
    const timeouts: number[] = [];
    
    timeouts.push(
      window.setTimeout(() => setPhase(edgeId, 'transit'), ANIMATION_TIMING.emit)
    );
    
    timeouts.push(
      window.setTimeout(
        () => setPhase(edgeId, 'receiving'),
        ANIMATION_TIMING.emit + ANIMATION_TIMING.transit
      )
    );
    
    timeouts.push(
      window.setTimeout(
        () => setPhase(edgeId, 'complete'),
        ANIMATION_TIMING.emit + ANIMATION_TIMING.transit + ANIMATION_TIMING.receive
      )
    );
    
    timeouts.push(
      window.setTimeout(
        () => clearAnimation(edgeId),
        ANIMATION_TIMING.total
      )
    );

    timeoutsRef.current.set(edgeId, timeouts);
  }, [clearAnimation, setPhase]);

  const triggerSequence = useCallback((
    edgeIds: string[],
    eventColor: string = '#22c55e',
    delayBetween: number = 200
  ) => {
    edgeIds.forEach((edgeId, index) => {
      setTimeout(() => {
        triggerEvent(edgeId, eventColor);
      }, index * delayBetween);
    });
  }, [triggerEvent]);

  const cancelAll = useCallback(() => {
    // Clear all timeouts
    timeoutsRef.current.forEach(timeouts => {
      timeouts.forEach(clearTimeout);
    });
    timeoutsRef.current.clear();
    
    // Clear state
    setState({ activeAnimations: new Map() });
  }, []);

  const getPhase = useCallback((edgeId: string): AnimationPhase => {
    return state.activeAnimations.get(edgeId)?.phase ?? 'idle';
  }, [state.activeAnimations]);

  const isAnimating = state.activeAnimations.size > 0;

  return {
    activeAnimations: state.activeAnimations,
    triggerEvent,
    triggerSequence,
    cancelAll,
    getPhase,
    isAnimating,
  };
}

export default useAnimationController;
