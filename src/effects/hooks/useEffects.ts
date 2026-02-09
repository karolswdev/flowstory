/**
 * FlowStory Effects - React Hooks
 */

import { useEffect, useRef, useCallback, useMemo, useState } from 'react';
import type {
  EffectConfig,
  EffectInstance,
  EffectContext,
  EffectState,
  TriggerType,
  BaseEffectParams,
  ViewportTransform,
} from '../types';
import { EffectRegistry } from '../registry';
import { EffectScheduler } from '../scheduler';
import { TriggerDispatcher } from '../dispatcher';

// Generate unique IDs
let effectIdCounter = 0;
const generateId = () => `effect-${++effectIdCounter}`;

/**
 * Hook to use the effects system on a node
 */
export interface UseNodeEffectsOptions {
  nodeId: string;
  effects: EffectConfig[];
  registry: EffectRegistry;
  scheduler: EffectScheduler;
  dispatcher: TriggerDispatcher;
  viewport?: ViewportTransform;
}

export interface UseNodeEffectsResult {
  /** Ref to attach to the node element */
  ref: React.RefObject<HTMLDivElement>;
  /** Manually trigger an effect type */
  trigger: (type: TriggerType) => void;
  /** Pause all effects on this node */
  pause: () => void;
  /** Resume all effects on this node */
  resume: () => void;
  /** Current effect states */
  states: Map<string, EffectState>;
}

export function useNodeEffects({
  nodeId,
  effects,
  registry,
  scheduler,
  dispatcher,
  viewport = { x: 0, y: 0, zoom: 1 },
}: UseNodeEffectsOptions): UseNodeEffectsResult {
  const ref = useRef<HTMLDivElement>(null);
  const instancesRef = useRef<EffectInstance[]>([]);
  const unsubscribesRef = useRef<(() => void)[]>([]);
  const [states, setStates] = useState<Map<string, EffectState>>(new Map());

  // Check reduced motion preference
  const prefersReducedMotion = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  // Create context provider
  const getContext = useCallback((): EffectContext => {
    return {
      targetElement: ref.current,
      targetRect: ref.current?.getBoundingClientRect() ?? null,
      viewport,
      prefersReducedMotion,
      requestCleanup: () => {},
    };
  }, [viewport, prefersReducedMotion]);

  // Create effect instances from configs
  useEffect(() => {
    // Clean up previous instances
    for (const unsub of unsubscribesRef.current) {
      unsub();
    }
    unsubscribesRef.current = [];
    instancesRef.current = [];

    // Create new instances
    for (const config of effects) {
      if (!registry.has(config.type)) {
        console.warn(`Unknown effect type: ${config.type}`);
        continue;
      }

      const params = registry.resolveParams(config.type, config.params ?? {});
      
      const instance: EffectInstance = {
        id: generateId(),
        type: config.type,
        targetId: nodeId,
        targetType: 'node',
        params,
        trigger: config.trigger ?? 'on-reveal',
        state: 'idle',
        chain: config.then,
      };

      instancesRef.current.push(instance);

      // Subscribe to trigger events
      const unsub = dispatcher.subscribe(instance, () => {
        // Schedule the effect when triggered
        scheduler.schedule(instance, getContext);
      });
      unsubscribesRef.current.push(unsub);

      // Track state changes
      const stateUnsub = scheduler.onStateChange(instance.id, (state) => {
        setStates(prev => new Map(prev).set(instance.id, state));
        
        // Handle chained effects
        if (state === 'complete' && instance.chain) {
          for (const chainedConfig of instance.chain) {
            const chainedParams = registry.resolveParams(
              chainedConfig.type, 
              chainedConfig.params ?? {}
            );
            const chainedInstance: EffectInstance = {
              id: generateId(),
              type: chainedConfig.type,
              targetId: nodeId,
              targetType: 'node',
              params: chainedParams,
              trigger: 'manual',
              state: 'idle',
              chain: chainedConfig.then,
            };
            scheduler.schedule(chainedInstance, getContext);
          }
        }
      });
      unsubscribesRef.current.push(stateUnsub);
    }

    return () => {
      for (const unsub of unsubscribesRef.current) {
        unsub();
      }
    };
  }, [nodeId, effects, registry, scheduler, dispatcher, getContext]);

  // Trigger function
  const trigger = useCallback((type: TriggerType) => {
    dispatcher.dispatchToTarget(nodeId, { type, targetId: nodeId });
  }, [dispatcher, nodeId]);

  // Pause all effects
  const pause = useCallback(() => {
    for (const instance of instancesRef.current) {
      scheduler.pause(instance.id);
    }
  }, [scheduler]);

  // Resume all effects
  const resume = useCallback(() => {
    for (const instance of instancesRef.current) {
      scheduler.resume(instance.id);
    }
  }, [scheduler]);

  return { ref, trigger, pause, resume, states };
}

/**
 * Hook to create and manage the effects system
 */
export interface UseEffectsSystemOptions {
  budget?: {
    maxConcurrentEffects?: number;
    maxParticles?: number;
    targetFrameTime?: number;
    maxFrameCost?: number;
  };
}

export interface UseEffectsSystemResult {
  registry: EffectRegistry;
  scheduler: EffectScheduler;
  dispatcher: TriggerDispatcher;
  /** Register a custom effect plugin */
  registerEffect: (plugin: import('../types').EffectPlugin) => void;
  /** Dispatch a trigger event */
  dispatch: (event: import('../types').TriggerEvent) => void;
}

export function useEffectsSystem(
  options: UseEffectsSystemOptions = {}
): UseEffectsSystemResult {
  const registry = useMemo(() => {
    const reg = new EffectRegistry();
    // Register built-in effects
    const { builtinEffects } = require('../plugins');
    for (const plugin of builtinEffects) {
      reg.register(plugin);
    }
    return reg;
  }, []);

  const scheduler = useMemo(() => {
    return new EffectScheduler(registry, options.budget);
  }, [registry, options.budget]);

  const dispatcher = useMemo(() => {
    return new TriggerDispatcher();
  }, []);

  // Animation frame loop for scheduler
  useEffect(() => {
    let frameId: number;
    const tick = (timestamp: number) => {
      scheduler.tick(timestamp, () => ({
        targetElement: null,
        targetRect: null,
        viewport: { x: 0, y: 0, zoom: 1 },
        prefersReducedMotion: false,
        requestCleanup: () => {},
      }));
      frameId = requestAnimationFrame(tick);
    };
    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [scheduler]);

  const registerEffect = useCallback((plugin: import('../types').EffectPlugin) => {
    registry.register(plugin);
  }, [registry]);

  const dispatch = useCallback((event: import('../types').TriggerEvent) => {
    dispatcher.dispatch(event);
  }, [dispatcher]);

  return { registry, scheduler, dispatcher, registerEffect, dispatch };
}

/**
 * Hook to detect reduced motion preference
 */
export function usePrefersReducedMotion(): boolean {
  const [prefersReduced, setPrefersReduced] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handler = (e: MediaQueryListEvent) => setPrefersReduced(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  return prefersReduced;
}
