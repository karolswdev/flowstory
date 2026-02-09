/**
 * FlowStory Effects Provider
 * 
 * React context that provides the effects system to the component tree.
 */

import React, { createContext, useContext, useMemo, useEffect, useCallback } from 'react';
import { EffectRegistry } from './registry';
import { EffectScheduler } from './scheduler';
import { TriggerDispatcher } from './dispatcher';
import { builtinEffects } from './plugins';
import type { EffectPlugin, PerformanceBudget, TriggerEvent, TriggerType } from './types';

interface EffectsContextValue {
  registry: EffectRegistry;
  scheduler: EffectScheduler;
  dispatcher: TriggerDispatcher;
  /** Trigger an effect on a target */
  trigger: (targetId: string, type: TriggerType) => void;
  /** Dispatch a trigger event */
  dispatch: (event: TriggerEvent) => void;
  /** Check if effects are enabled */
  enabled: boolean;
}

const EffectsContext = createContext<EffectsContextValue | null>(null);

export interface EffectsProviderProps {
  children: React.ReactNode;
  /** Custom performance budget */
  budget?: Partial<PerformanceBudget>;
  /** Additional effect plugins to register */
  plugins?: EffectPlugin[];
  /** Disable effects entirely */
  disabled?: boolean;
}

export function EffectsProvider({
  children,
  budget,
  plugins = [],
  disabled = false,
}: EffectsProviderProps) {
  // Create registry with built-in effects
  const registry = useMemo(() => {
    const reg = new EffectRegistry();
    
    // Register built-in effects
    for (const plugin of builtinEffects) {
      reg.register(plugin);
    }
    
    // Register custom plugins
    for (const plugin of plugins) {
      reg.register(plugin);
    }
    
    return reg;
  }, [plugins]);

  // Create scheduler
  const scheduler = useMemo(() => {
    return new EffectScheduler(registry, budget);
  }, [registry, budget]);

  // Create dispatcher
  const dispatcher = useMemo(() => {
    return new TriggerDispatcher();
  }, []);

  // Animation frame loop for scheduler
  useEffect(() => {
    if (disabled) return;

    let frameId: number;
    
    const tick = (timestamp: number) => {
      scheduler.tick(timestamp, () => ({
        targetElement: null,
        targetRect: null,
        viewport: { x: 0, y: 0, zoom: 1 },
        prefersReducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
        requestCleanup: () => {},
      }));
      frameId = requestAnimationFrame(tick);
    };
    
    frameId = requestAnimationFrame(tick);
    
    return () => {
      if (frameId) {
        cancelAnimationFrame(frameId);
      }
    };
  }, [scheduler, disabled]);

  // Convenience methods
  const trigger = useCallback((targetId: string, type: TriggerType) => {
    if (disabled) return;
    dispatcher.dispatchToTarget(targetId, { type, targetId });
  }, [dispatcher, disabled]);

  const dispatch = useCallback((event: TriggerEvent) => {
    if (disabled) return;
    dispatcher.dispatch(event);
  }, [dispatcher, disabled]);

  const value = useMemo<EffectsContextValue>(() => ({
    registry,
    scheduler,
    dispatcher,
    trigger,
    dispatch,
    enabled: !disabled,
  }), [registry, scheduler, dispatcher, trigger, dispatch, disabled]);

  return (
    <EffectsContext.Provider value={value}>
      {children}
    </EffectsContext.Provider>
  );
}

/**
 * Hook to access the effects system
 */
export function useEffects(): EffectsContextValue {
  const context = useContext(EffectsContext);
  
  if (!context) {
    // Return a no-op context if provider is not present
    return {
      registry: new EffectRegistry(),
      scheduler: new EffectScheduler(new EffectRegistry()),
      dispatcher: new TriggerDispatcher(),
      trigger: () => {},
      dispatch: () => {},
      enabled: false,
    };
  }
  
  return context;
}

/**
 * Hook to trigger effects on step changes
 */
export function useStepEffects(
  stepId: string | undefined,
  focusNodeIds: string[],
  previousFocusNodeIds: string[]
) {
  const { dispatcher, enabled } = useEffects();

  useEffect(() => {
    if (!enabled || !stepId) return;

    // Dispatch step change event
    dispatcher.dispatch({ type: 'on-step', stepId });

    // Find newly focused nodes and trigger on-focus
    const newlyFocused = focusNodeIds.filter(id => !previousFocusNodeIds.includes(id));
    for (const nodeId of newlyFocused) {
      dispatcher.dispatchFocus(nodeId);
    }

    // Find nodes that lost focus and trigger on-blur
    const lostFocus = previousFocusNodeIds.filter(id => !focusNodeIds.includes(id));
    for (const nodeId of lostFocus) {
      dispatcher.dispatchBlur(nodeId);
    }
  }, [stepId, focusNodeIds, previousFocusNodeIds, dispatcher, enabled]);
}

export { EffectsContext };
