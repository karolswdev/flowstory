/**
 * FlowStory Effects System - Core Types
 */

import { z } from 'zod';

// =============================================================================
// Effect Categories
// =============================================================================

export type EffectCategory = 
  | 'celebration' 
  | 'attention' 
  | 'state' 
  | 'flow' 
  | 'ambient';

export type EffectLayer = 'css' | 'canvas' | 'motion' | 'svg';

// =============================================================================
// Trigger System
// =============================================================================

export type TriggerType =
  | 'on-reveal'
  | 'on-focus'
  | 'on-blur'
  | 'on-click'
  | 'on-hover'
  | 'on-hover-end'
  | 'on-step'
  | 'on-complete'
  | 'continuous'
  | 'manual';

export interface SimpleTrigger {
  type: TriggerType;
  delay?: number;
}

export interface ConditionalTrigger {
  type: 'on-data';
  condition: {
    field: string;
    equals?: unknown;
    notEquals?: unknown;
    gt?: number;
    lt?: number;
  };
  delay?: number;
}

export type TriggerConfig = SimpleTrigger | ConditionalTrigger | TriggerType;

export interface TriggerEvent {
  type: TriggerType;
  targetId?: string;
  stepId?: string;
  data?: Record<string, unknown>;
}

// =============================================================================
// Base Parameters
// =============================================================================

export type EasingType =
  | 'linear'
  | 'ease-in'
  | 'ease-out'
  | 'ease-in-out'
  | 'spring'
  | 'bounce';

export interface BaseEffectParams {
  duration?: number;
  delay?: number;
  repeat?: number | 'infinite';
  easing?: EasingType;
  reducedMotion?: 'skip' | 'fade' | 'static';
}

// =============================================================================
// Effect-Specific Parameters
// =============================================================================

export interface PulseParams extends BaseEffectParams {
  scale?: number;
  color?: string;
  intensity?: number;
}

export interface GlowParams extends BaseEffectParams {
  color?: string;
  intensity?: number;
  size?: number;
}

export interface ShakeParams extends BaseEffectParams {
  intensity?: number;
  direction?: 'horizontal' | 'vertical' | 'both';
  frequency?: number;
}

export interface EmojiExplosionParams extends BaseEffectParams {
  emojis?: string[];
  count?: number;
  spread?: number;
  distance?: number;
  gravity?: number;
  fade?: boolean;
}

export interface ParticlesParams extends BaseEffectParams {
  count?: number;
  speed?: number;
  size?: number;
  color?: string;
  glow?: boolean;
  path?: 'edge' | 'direct' | 'arc';
}

export interface ConfettiParams extends BaseEffectParams {
  colors?: string[];
  count?: number;
  spread?: number;
  direction?: 'up' | 'down' | 'both';
  shapes?: ('square' | 'circle' | 'strip')[];
}

export interface RipplesParams extends BaseEffectParams {
  count?: number;
  maxRadius?: number;
  color?: string;
  thickness?: number;
  interval?: number;
}

export interface BounceParams extends BaseEffectParams {
  height?: number;
  count?: number;
}

export interface BreatheParams extends BaseEffectParams {
  scale?: number;
  opacity?: [number, number];
}

// =============================================================================
// Effect State
// =============================================================================

export type EffectState = 
  | 'idle' 
  | 'pending' 
  | 'running' 
  | 'paused' 
  | 'complete' 
  | 'cancelled';

// =============================================================================
// Effect Instance
// =============================================================================

export interface EffectInstance<P extends BaseEffectParams = BaseEffectParams> {
  id: string;
  type: string;
  targetId: string;
  targetType: 'node' | 'edge' | 'viewport';
  params: P;
  trigger: TriggerConfig;
  state: EffectState;
  chain?: EffectConfig[];
}

// =============================================================================
// Effect Configuration (from YAML)
// =============================================================================

export interface EffectConfig {
  type: string;
  trigger?: TriggerConfig;
  params?: Record<string, unknown>;
  delay?: number;
  then?: EffectConfig[];
}

// =============================================================================
// Effect Definition
// =============================================================================

export interface EffectDefinition<P extends BaseEffectParams = BaseEffectParams> {
  type: string;
  category: EffectCategory;
  layer: EffectLayer;
  defaults: P;
  reducedMotionFallback: 'skip' | 'fade' | 'static';
  performanceCost: number;
}

// =============================================================================
// Effect Controller
// =============================================================================

export interface EffectController {
  start(): void;
  pause(): void;
  resume(): void;
  stop(): void;
  getProgress(): number;
  getState(): EffectState;
  onStateChange(callback: (state: EffectState) => void): () => void;
}

// =============================================================================
// Effect Context
// =============================================================================

export interface EffectContext {
  targetElement: HTMLElement | null;
  targetRect: DOMRect | null;
  canvasContext?: CanvasRenderingContext2D;
  viewport: ViewportTransform;
  prefersReducedMotion: boolean;
  requestCleanup: () => void;
}

export interface ViewportTransform {
  x: number;
  y: number;
  zoom: number;
}

// =============================================================================
// Effect Plugin Interface
// =============================================================================

export interface EffectPlugin<P extends BaseEffectParams = BaseEffectParams> {
  definition: EffectDefinition<P>;
  createController(
    instance: EffectInstance<P>,
    context: EffectContext
  ): EffectController;
}

// =============================================================================
// CSS Effect Plugin
// =============================================================================

export interface CSSEffectPlugin<P extends BaseEffectParams = BaseEffectParams> 
  extends EffectPlugin<P> {
  getKeyframes(params: P): Record<string, React.CSSProperties>;
  getAnimationProps(params: P): React.CSSProperties;
}

// =============================================================================
// Canvas Effect Plugin
// =============================================================================

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  rotation?: number;
  emoji?: string;
  opacity?: number;
}

export interface ParticleSystem {
  particles: Particle[];
  originX: number;
  originY: number;
  isComplete: boolean;
}

export interface CanvasEffectPlugin<P extends BaseEffectParams = BaseEffectParams>
  extends EffectPlugin<P> {
  init(context: EffectContext, params: P): ParticleSystem;
  update(system: ParticleSystem, deltaTime: number, params: P): void;
  render(system: ParticleSystem, ctx: CanvasRenderingContext2D): void;
}

// =============================================================================
// Performance
// =============================================================================

export interface PerformanceBudget {
  maxConcurrentEffects: number;
  maxParticles: number;
  targetFrameTime: number;
  maxFrameCost: number;
}

export interface PerformanceStats {
  fps: number;
  avgFrameTime: number;
  activeEffects: number;
  particleCount: number;
  droppedFrames: number;
}

// =============================================================================
// Zod Schemas for YAML Parsing
// =============================================================================

export const TriggerTypeSchema = z.enum([
  'on-reveal', 'on-focus', 'on-blur', 'on-click', 'on-hover',
  'on-hover-end', 'on-step', 'on-complete', 'continuous', 'manual'
]);

export const TriggerConfigSchema = z.union([
  TriggerTypeSchema,
  z.object({
    type: TriggerTypeSchema,
    delay: z.number().optional(),
  }),
  z.object({
    type: z.literal('on-data'),
    condition: z.object({
      field: z.string(),
      equals: z.unknown().optional(),
      notEquals: z.unknown().optional(),
      gt: z.number().optional(),
      lt: z.number().optional(),
    }),
    delay: z.number().optional(),
  }),
]);

export const EffectConfigSchema: z.ZodType<EffectConfig> = z.object({
  type: z.string(),
  trigger: TriggerConfigSchema.optional(),
  params: z.record(z.unknown()).optional(),
  delay: z.number().optional(),
  then: z.lazy(() => z.array(EffectConfigSchema)).optional(),
});

export const NodeEffectsSchema = z.array(EffectConfigSchema).optional();

export const StepEffectSchema = z.object({
  target: z.union([
    z.string(), 
    z.array(z.string()), 
    z.literal('all-nodes'), 
    z.literal('all-edges')
  ]),
  type: z.string(),
  trigger: z.enum(['on-step', 'immediate']).default('on-step'),
  params: z.record(z.unknown()).optional(),
});
