/**
 * FlowStory Effects System
 * 
 * Attachable animations for nodes and edges with configurable parameters.
 * 
 * @example
 * ```tsx
 * import { useEffectsSystem, useNodeEffects } from './effects';
 * 
 * function App() {
 *   const { registry, scheduler, dispatcher } = useEffectsSystem();
 *   
 *   return (
 *     <MyNode 
 *       effects={[
 *         { type: 'pulse', trigger: 'on-reveal' },
 *         { type: 'emoji-explosion', trigger: 'on-click', params: { emojis: ['🎉'] } }
 *       ]}
 *       {...{ registry, scheduler, dispatcher }}
 *     />
 *   );
 * }
 * ```
 */

// Core types
export type {
  EffectCategory,
  EffectLayer,
  TriggerType,
  TriggerConfig,
  TriggerEvent,
  EasingType,
  BaseEffectParams,
  PulseParams,
  GlowParams,
  ShakeParams,
  EmojiExplosionParams,
  ParticlesParams,
  ConfettiParams,
  RipplesParams,
  BounceParams,
  BreatheParams,
  EffectState,
  EffectInstance,
  EffectConfig,
  EffectDefinition,
  EffectController,
  EffectContext,
  ViewportTransform,
  EffectPlugin,
  CSSEffectPlugin,
  CanvasEffectPlugin,
  Particle,
  ParticleSystem,
  PerformanceBudget,
  PerformanceStats,
} from './types';

// Schemas
export {
  TriggerTypeSchema,
  TriggerConfigSchema,
  EffectConfigSchema,
  NodeEffectsSchema,
  StepEffectSchema,
} from './types';

// Core classes
export { EffectRegistry, effectRegistry } from './registry';
export { EffectScheduler } from './scheduler';
export { TriggerDispatcher } from './dispatcher';

// Built-in plugins
export {
  pulseEffect,
  glowEffect,
  shakeEffect,
  emojiExplosionEffect,
  particlesEffect,
  builtinEffects,
  effectsByCategory,
  effectsByLayer,
} from './plugins';

// React hooks
export {
  useNodeEffects,
  useEffectsSystem,
  usePrefersReducedMotion,
  type UseNodeEffectsOptions,
  type UseNodeEffectsResult,
  type UseEffectsSystemOptions,
  type UseEffectsSystemResult,
} from './hooks';
