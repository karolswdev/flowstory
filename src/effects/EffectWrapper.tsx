/**
 * Effect Wrapper Component
 * 
 * Wraps a node to apply effects from YAML configuration.
 * Handles effect lifecycle based on triggers.
 */

import React, { useRef, useEffect, useMemo, useCallback, useState } from 'react';
import { useEffects } from './EffectsProvider';
import type { EffectConfig, EffectInstance, EffectContext, EffectState, TriggerType } from './types';

interface EffectWrapperProps {
  /** Node ID for targeting */
  nodeId: string;
  /** Effects configuration from YAML */
  effects?: EffectConfig[];
  /** Child node content */
  children: React.ReactNode;
  /** Additional class name */
  className?: string;
  /** Is this node currently active/focused */
  isActive?: boolean;
  /** Is this node revealed/visible */
  isRevealed?: boolean;
}

// Counter for unique effect instance IDs
let instanceCounter = 0;
const generateInstanceId = () => `effect-${++instanceCounter}`;

export function EffectWrapper({
  nodeId,
  effects = [],
  children,
  className = '',
  isActive = false,
  isRevealed = false,
}: EffectWrapperProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const { registry, scheduler, dispatcher, enabled } = useEffects();
  const [effectStates, setEffectStates] = useState<Map<string, EffectState>>(new Map());
  
  // Track previous states for change detection
  const prevActiveRef = useRef(isActive);
  const prevRevealedRef = useRef(isRevealed);
  
  // Create effect instances from config
  const instances = useMemo<EffectInstance[]>(() => {
    if (!enabled || effects.length === 0) return [];
    
    return effects.map(config => {
      const params = registry.has(config.type)
        ? registry.resolveParams(config.type, config.params ?? {})
        : { ...config.params };
      
      return {
        id: generateInstanceId(),
        type: config.type,
        targetId: nodeId,
        targetType: 'node' as const,
        params,
        trigger: config.trigger ?? 'on-reveal',
        state: 'idle' as const,
        chain: config.then,
      };
    });
  }, [effects, nodeId, registry, enabled]);

  // Context provider for effects
  const getContext = useCallback((): EffectContext => {
    const prefersReducedMotion = typeof window !== 'undefined'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false;
    
    return {
      targetElement: wrapperRef.current,
      targetRect: wrapperRef.current?.getBoundingClientRect() ?? null,
      viewport: { x: 0, y: 0, zoom: 1 },
      prefersReducedMotion,
      requestCleanup: () => {},
    };
  }, []);

  // Subscribe to triggers and schedule effects
  useEffect(() => {
    if (!enabled || instances.length === 0) return;

    const unsubscribes: (() => void)[] = [];

    for (const instance of instances) {
      // Subscribe to trigger events
      const unsubTrigger = dispatcher.subscribe(instance, () => {
        scheduler.schedule(instance, getContext);
      });
      unsubscribes.push(unsubTrigger);

      // Track state changes
      const unsubState = scheduler.onStateChange(instance.id, (state) => {
        setEffectStates(prev => new Map(prev).set(instance.id, state));
      });
      unsubscribes.push(unsubState);

      // Handle continuous effects - start immediately
      const triggerType = typeof instance.trigger === 'string' 
        ? instance.trigger 
        : instance.trigger.type;
      
      if (triggerType === 'continuous') {
        scheduler.schedule(instance, getContext);
      }
    }

    return () => {
      for (const unsub of unsubscribes) {
        unsub();
      }
    };
  }, [instances, dispatcher, scheduler, getContext, enabled]);

  // Handle reveal trigger
  useEffect(() => {
    if (!enabled || !isRevealed || prevRevealedRef.current) return;
    
    prevRevealedRef.current = isRevealed;
    
    // Trigger on-reveal for all instances with that trigger
    for (const instance of instances) {
      const triggerType = typeof instance.trigger === 'string' 
        ? instance.trigger 
        : instance.trigger.type;
      
      if (triggerType === 'on-reveal') {
        dispatcher.dispatchReveal(nodeId);
        break; // Only need to dispatch once
      }
    }
  }, [isRevealed, instances, dispatcher, nodeId, enabled]);

  // Handle focus/blur triggers
  useEffect(() => {
    if (!enabled) return;
    
    if (isActive && !prevActiveRef.current) {
      // Just became active - trigger on-focus
      dispatcher.dispatchFocus(nodeId);
    } else if (!isActive && prevActiveRef.current) {
      // Just lost focus - trigger on-blur
      dispatcher.dispatchBlur(nodeId);
    }
    
    prevActiveRef.current = isActive;
  }, [isActive, dispatcher, nodeId, enabled]);

  // Handle click trigger
  const handleClick = useCallback(() => {
    if (!enabled) return;
    dispatcher.dispatchClick(nodeId);
  }, [dispatcher, nodeId, enabled]);

  // Handle hover triggers
  const handleMouseEnter = useCallback(() => {
    if (!enabled) return;
    dispatcher.dispatchHover(nodeId);
  }, [dispatcher, nodeId, enabled]);

  const handleMouseLeave = useCallback(() => {
    if (!enabled) return;
    dispatcher.dispatchHoverEnd(nodeId);
  }, [dispatcher, nodeId, enabled]);

  // Determine if any effect is running
  const hasRunningEffect = useMemo(() => {
    for (const [, state] of effectStates) {
      if (state === 'running') return true;
    }
    return false;
  }, [effectStates]);

  return (
    <div
      ref={wrapperRef}
      className={`effect-wrapper ${className} ${hasRunningEffect ? 'effect-running' : ''}`}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      data-node-id={nodeId}
      data-has-effects={effects.length > 0}
    >
      {children}
    </div>
  );
}

export default EffectWrapper;
