/**
 * Edge Projectile Effect Plugin
 *
 * Provides canvas-based projectile effects for edges:
 * - emoji-fan: Emojis that fan out from source along the edge
 * - label-yeet: A text label that travels with physics
 * - particle-stream: Colored dots that stream along the edge
 *
 * This plugin is registered in the effect system but the primary rendering
 * is handled by EdgeEffectLayer.tsx (SVG-based, co-located with edge components).
 * This file provides the plugin definition for the registry.
 */

import type { EffectPlugin, EffectDefinition, EffectController, EffectContext } from '../types';

// ============================================================================
// Plugin Definition
// ============================================================================

export interface EdgeProjectileParams {
  type: 'emoji-fan' | 'label-yeet' | 'particle-stream';
  emojis?: string[];
  label?: string;
  count?: number;
  spread?: number;
  direction?: 'along-edge' | 'from-source' | 'from-target' | 'radial';
  speed?: number;
  jitter?: number;
  gravity?: number;
  fade?: boolean;
  scale?: [number, number];
  stagger?: number;
  duration?: number;
}

const edgeProjectileDefinition: EffectDefinition<EdgeProjectileParams> = {
  type: 'edge-projectile',
  category: 'flow',
  layer: 'svg',
  defaults: {
    type: 'particle-stream',
    count: 5,
    spread: 30,
    direction: 'along-edge',
    speed: 150,
    jitter: 0.2,
    gravity: 0,
    fade: true,
    scale: [1, 0.5],
    stagger: 100,
    duration: 1500,
  },
  reducedMotionFallback: 'static',
  performanceCost: 3,
};

// ============================================================================
// Plugin Implementation
// ============================================================================

/**
 * Edge projectile plugin.
 * NOTE: The actual rendering is handled by EdgeEffectLayer.tsx in the service
 * component tree. This plugin exists for registry/discovery purposes and
 * provides the definition metadata.
 */
export const edgeProjectileEffect: EffectPlugin<EdgeProjectileParams> & {
  definition: EffectDefinition<EdgeProjectileParams>;
} = {
  definition: edgeProjectileDefinition,

  create(_params: EdgeProjectileParams, _context: EffectContext): EffectController {
    // Rendering is handled by EdgeEffectLayer.tsx — this is a no-op controller
    let state: 'idle' | 'running' | 'complete' = 'idle';
    const listeners: Array<(s: string) => void> = [];

    return {
      start() {
        state = 'running';
        listeners.forEach(fn => fn(state));
      },
      pause() { /* no-op */ },
      resume() { /* no-op */ },
      stop() {
        state = 'complete';
        listeners.forEach(fn => fn(state));
      },
      getProgress() { return state === 'complete' ? 1 : 0; },
      getState() { return state; },
      onStateChange(fn: (s: string) => void) {
        listeners.push(fn);
      },
    };
  },
};
