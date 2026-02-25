import { z } from 'zod';
import type { ComponentType } from 'react';
import {
  Server,
  Hammer,
  Globe,
  Database,
  Zap,
  Cloud,
  Radio,
  GitBranch,
  Activity,
  Inbox,
  Mail,
  ScrollText,
  Monitor,
  ShieldCheck,
  Network,
  Clock,
  HardDrive,
  Cpu,
  BarChart3,
  UserCheck,
  Waves,
  // Domain-level icons
  Fingerprint,
  Box,
  Gem,
  BellRing,
  Scale,
  Eye,
  Route,
  Archive,
  Layers,
  User,
} from 'lucide-react';

// ============================================================================
// Type Definitions
// ============================================================================

export const SERVICE_TYPES = [
  // Infrastructure types (original 17)
  'api', 'worker', 'gateway', 'database', 'cache', 'external', 'event-bus', 'workflow', 'event-processor',
  'client', 'firewall', 'load-balancer', 'scheduler', 'storage', 'function', 'monitor', 'human-task', 'event-stream',
  // Domain-level types (10 new)
  'entity', 'aggregate', 'value-object', 'domain-event', 'policy',
  'read-model', 'saga', 'repository', 'bounded-context', 'actor',
] as const;
export type ServiceType = typeof SERVICE_TYPES[number];

export const HEALTH_STATUSES = ['healthy', 'degraded', 'down'] as const;
export type HealthStatus = typeof HEALTH_STATUSES[number];

export const QUEUE_TYPES = ['queue', 'topic', 'stream'] as const;
export type QueueType = typeof QUEUE_TYPES[number];

export const BROKER_TYPES = ['rabbitmq', 'kafka', 'sqs', 'servicebus', 'redis'] as const;
export type BrokerType = typeof BROKER_TYPES[number];

export const CALL_TYPES = ['sync', 'async', 'publish', 'subscribe'] as const;
export type CallType = typeof CALL_TYPES[number];

export const PROTOCOLS = ['http', 'grpc', 'graphql'] as const;
export type Protocol = typeof PROTOCOLS[number];

export const LAYOUTS = ['sequence'] as const;
export type ServiceFlowLayout = typeof LAYOUTS[number];

// ============================================================================
// Icon & Color Configurations
// ============================================================================

export type LucideIcon = ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;

export const SERVICE_TYPE_ICONS: Record<ServiceType, LucideIcon> = {
  api: Server,
  worker: Hammer,
  gateway: Globe,
  database: Database,
  cache: Zap,
  external: Cloud,
  'event-bus': Radio,
  workflow: GitBranch,
  'event-processor': Activity,
  client: Monitor,
  firewall: ShieldCheck,
  'load-balancer': Network,
  scheduler: Clock,
  storage: HardDrive,
  function: Cpu,
  monitor: BarChart3,
  'human-task': UserCheck,
  'event-stream': Waves,
  // Domain-level
  entity: Fingerprint,
  aggregate: Box,
  'value-object': Gem,
  'domain-event': BellRing,
  policy: Scale,
  'read-model': Eye,
  saga: Route,
  repository: Archive,
  'bounded-context': Layers,
  actor: User,
};

export const QUEUE_TYPE_ICONS: Record<QueueType, LucideIcon> = {
  queue: Inbox,
  topic: Mail,
  stream: ScrollText,
};

export const SERVICE_TYPE_COLORS: Record<ServiceType, string> = {
  api: '#3B82F6',
  worker: '#A855F7',
  gateway: '#F59E0B',
  database: '#78716C',
  cache: '#06B6D4',
  external: '#64748B',
  'event-bus': '#F97316',
  workflow: '#EC4899',
  'event-processor': '#8B5CF6',
  client: '#6366F1',
  firewall: '#F43F5E',
  'load-balancer': '#14B8A6',
  scheduler: '#D97706',
  storage: '#A8A29E',
  function: '#EA580C',
  monitor: '#10B981',
  'human-task': '#EC4899',
  'event-stream': '#0891B2',
  // Domain-level
  entity: '#0EA5E9',
  aggregate: '#4F46E5',
  'value-object': '#84CC16',
  'domain-event': '#F59E0B',
  policy: '#E11D48',
  'read-model': '#06B6D4',
  saga: '#7C3AED',
  repository: '#57534E',
  'bounded-context': '#059669',
  actor: '#DB2777',
};

export const STATUS_COLORS: Record<HealthStatus, string> = {
  healthy: '#22C55E',
  degraded: '#F59E0B',
  down: '#EF4444',
};

export const CALL_TYPE_COLORS: Record<CallType, string> = {
  sync: '#3B82F6',
  async: '#A855F7',
  publish: '#F59E0B',
  subscribe: '#14B8A6',
};

// ============================================================================
// Coupling & Failure Cascade
// ============================================================================

export const COUPLING_LEVELS = ['tight', 'loose', 'eventual'] as const;
export type CouplingLevel = typeof COUPLING_LEVELS[number];

export const COUPLING_COLORS: Record<CouplingLevel, string> = {
  tight: '#EF4444',
  loose: '#3B82F6',
  eventual: '#94A3B8',
};

export const ZONE_COLORS = [
  'rgba(59, 130, 246, 0.06)',   // Blue
  'rgba(168, 85, 247, 0.06)',   // Purple
  'rgba(34, 197, 94, 0.06)',    // Green
  'rgba(249, 115, 22, 0.06)',   // Orange
  'rgba(236, 72, 153, 0.06)',   // Pink
  'rgba(6, 182, 212, 0.06)',    // Cyan
] as const;

export const ZONE_PADDING = 60;
export const ZONE_LABEL_HEIGHT = 32;
export const MIN_ZONE_MEMBER_GAP = 30;

// ============================================================================
// Zod Schemas
// ============================================================================

const ServiceTypeSchema = z.enum(SERVICE_TYPES);
const HealthStatusSchema = z.enum(HEALTH_STATUSES);
const QueueTypeSchema = z.enum(QUEUE_TYPES);
const BrokerTypeSchema = z.enum(BROKER_TYPES);
const ProtocolSchema = z.enum(PROTOCOLS);
const LayoutSchema = z.enum(LAYOUTS);

export const EventDefSchema = z.object({
  key: z.string(),
  value: z.string(),
  color: z.string().optional(),
  emoji: z.string().optional(),
});
export type EventDef = z.infer<typeof EventDefSchema>;

export const ServiceDefSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: ServiceTypeSchema,
  technology: z.string().optional(),
  status: HealthStatusSchema.optional(),
  instances: z.number().int().positive().optional(),
  version: z.string().optional(),
  tags: z.record(z.string(), z.string()).optional(),
  substates: z.array(z.string()).optional(),
  initialSubstate: z.string().optional(),
  events: z.array(EventDefSchema).optional(),
});

export const QueueDefSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: QueueTypeSchema,
  broker: BrokerTypeSchema.optional(),
  depth: z.number().int().optional(),
  consumers: z.number().int().optional(),
  tags: z.record(z.string(), z.string()).optional(),
});

export const ResponseSchema = z.object({
  status: z.union([z.number(), z.string()]),
  label: z.string().optional(),
});

// ============================================================================
// Edge Effect Schema — Projectile effects on calls
// ============================================================================

export const EFFECT_TYPES = ['emoji-fan', 'label-yeet', 'particle-stream'] as const;
export type EffectType = typeof EFFECT_TYPES[number];

export const EFFECT_DIRECTIONS = ['along-edge', 'from-source', 'from-target', 'radial'] as const;
export type EffectDirection = typeof EFFECT_DIRECTIONS[number];

export const CallEffectSchema = z.object({
  type: z.enum(EFFECT_TYPES),
  emojis: z.array(z.string()).optional(),
  label: z.string().optional(),
  count: z.number().min(1).max(50).default(5),
  spread: z.number().min(0).max(180).default(30),
  direction: z.enum(EFFECT_DIRECTIONS).default('along-edge'),
  speed: z.number().default(150),
  jitter: z.number().min(0).max(1).default(0.2),
  gravity: z.number().default(0),
  fade: z.boolean().default(true),
  scale: z.tuple([z.number(), z.number()]).default([1, 0.5]),
  stagger: z.number().default(100),
  duration: z.number().default(1500),
}).partial().required({ type: true });

export type CallEffect = z.infer<typeof CallEffectSchema>;

export const StepCallEffectSchema = CallEffectSchema.extend({
  target: z.string(),
});

export type StepCallEffect = z.infer<typeof StepCallEffectSchema>;

// ============================================================================
// Stream Config Schema — Continuous particle flow on edges
// ============================================================================

export const StreamConfigSchema = z.object({
  /** Emoji content for particles (omit for colored dots) */
  particles: z.array(z.string()).optional(),
  /** Number of particles visible at once (default: 6) */
  density: z.number().min(1).max(30).default(6),
  /** Seconds per full traversal (default: 2.5) */
  speed: z.number().min(0.5).max(10).default(2.5),
  /** Width of the stream band in px (default: 16) */
  width: z.number().min(4).max(60).default(16),
  /** Band + dot color (defaults to call type color) */
  color: z.string().optional(),
  /** Particles fade in/out at endpoints (default: true) */
  fade: z.boolean().default(true),
  /** Stream band opacity (default: 0.08) */
  bandOpacity: z.number().min(0).max(0.5).default(0.08),
});

export type StreamConfig = z.infer<typeof StreamConfigSchema>;

export const SyncCallSchema = z.object({
  id: z.string(),
  type: z.literal('sync'),
  from: z.string(),
  to: z.string(),
  method: z.string().optional(),
  path: z.string().optional(),
  protocol: ProtocolSchema.optional(),
  duration: z.number().optional(),
  status: z.union([z.number(), z.enum(['ok', 'error'])]).optional(),
  payload: z.unknown().optional(),
  response: ResponseSchema.optional(),
  effect: CallEffectSchema.optional(),
  coupling: z.enum(COUPLING_LEVELS).optional(),
  critical: z.boolean().optional(),
  fallback: z.string().optional(),
  travelingLabel: z.boolean().optional(),
  stream: z.union([z.boolean(), StreamConfigSchema]).optional(),
});

export const AsyncCallSchema = z.object({
  id: z.string(),
  type: z.literal('async'),
  from: z.string(),
  to: z.string(),
  messageType: z.string(),
  payload: z.unknown().optional(),
  correlationId: z.string().optional(),
  effect: CallEffectSchema.optional(),
  coupling: z.enum(COUPLING_LEVELS).optional(),
  critical: z.boolean().optional(),
  fallback: z.string().optional(),
  travelingLabel: z.boolean().optional(),
  stream: z.union([z.boolean(), StreamConfigSchema]).optional(),
});

export const PublishCallSchema = z.object({
  id: z.string(),
  type: z.literal('publish'),
  from: z.string(),
  to: z.string(),
  messageType: z.string(),
  payload: z.unknown().optional(),
  effect: CallEffectSchema.optional(),
  coupling: z.enum(COUPLING_LEVELS).optional(),
  critical: z.boolean().optional(),
  fallback: z.string().optional(),
  travelingLabel: z.boolean().optional(),
  stream: z.union([z.boolean(), StreamConfigSchema]).optional(),
});

export const SubscribeCallSchema = z.object({
  id: z.string(),
  type: z.literal('subscribe'),
  from: z.string(),
  to: z.string(),
  messageType: z.string(),
  action: z.string().optional(),
  effect: CallEffectSchema.optional(),
  coupling: z.enum(COUPLING_LEVELS).optional(),
  critical: z.boolean().optional(),
  fallback: z.string().optional(),
  travelingLabel: z.boolean().optional(),
  stream: z.union([z.boolean(), StreamConfigSchema]).optional(),
});

export const CallDefSchema = z.discriminatedUnion('type', [
  SyncCallSchema,
  AsyncCallSchema,
  PublishCallSchema,
  SubscribeCallSchema,
]);

export const ZoneDefSchema = z.object({
  id: z.string(),
  label: z.string(),
  members: z.array(z.string()),
  color: z.string().optional(),
});

// ============================================================================
// Scene (Layout Group) Schema
// ============================================================================

export const SCENE_DIRECTIONS = ['LR', 'TB', 'RL', 'BT'] as const;
export type SceneDirection = typeof SCENE_DIRECTIONS[number];

export const SceneDefSchema = z.object({
  id: z.string(),
  direction: z.enum(SCENE_DIRECTIONS).default('LR'),
  members: z.array(z.string()),
  nodesep: z.number().optional(),
  ranksep: z.number().optional(),
});

export type SceneDef = z.infer<typeof SceneDefSchema>;

// ============================================================================
// Camera Override Schema
// ============================================================================

export const EASING_FUNCTIONS = ['spring-overshoot', 'linear', 'ease-in', 'ease-out', 'ease-in-out'] as const;
export type EasingFunction = typeof EASING_FUNCTIONS[number];

export const CameraOverrideSchema = z.object({
  /** Target zoom level */
  zoom: z.number().min(0.1).max(5).optional(),
  /** Animation duration in ms */
  duration: z.number().min(100).max(10000).optional(),
  /** Easing function (default: spring-overshoot) */
  easing: z.enum(EASING_FUNCTIONS).optional(),
  /** Explicit focus node IDs (overrides auto-focus) */
  focusNodes: z.array(z.string()).optional(),
  /** Zoom out to show all nodes */
  fitAll: z.boolean().optional(),
  /** Manual pan offset [x, y] after focus */
  pan: z.tuple([z.number(), z.number()]).optional(),
  /** Padding around focus area in px */
  padding: z.number().optional(),
});

export type CameraOverride = z.infer<typeof CameraOverrideSchema>;

export const ServiceFlowStepSchema = z.object({
  id: z.string(),
  title: z.string(),
  narrative: z.string().optional(),
  activeCalls: z.array(z.string()),
  focusNodes: z.array(z.string()).optional().default([]),
  revealNodes: z.array(z.string()).optional().default([]),
  revealCalls: z.array(z.string()).optional().default([]),
  duration: z.number().optional(),
  narration: z.object({
    speaker: z.string(),
    message: z.string(),
  }).optional(),
  substates: z.record(z.string(), z.string().nullable()).optional(),
  effects: z.array(StepCallEffectSchema).optional(),
  camera: CameraOverrideSchema.optional(),
  simulateFailure: z.string().optional(),
});

export const ServiceFlowStorySchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  renderer: z.literal('service-flow'),
  schemaVersion: z.literal('2.0'),
  layout: LayoutSchema.optional().default('sequence'),
  services: z.array(ServiceDefSchema),
  queues: z.array(QueueDefSchema).optional().default([]),
  calls: z.array(CallDefSchema),
  zones: z.array(ZoneDefSchema).optional().default([]),
  scenes: z.array(SceneDefSchema).optional().default([]),
  steps: z.array(ServiceFlowStepSchema),
}).superRefine((data, ctx) => {
  if (!data.scenes || data.scenes.length === 0) return;

  const participantIds = new Set([
    ...data.services.map(s => s.id),
    ...data.queues.map(q => q.id),
  ]);

  // Validate: no node in multiple scenes
  const seen = new Map<string, string>();
  for (const scene of data.scenes) {
    for (const memberId of scene.members) {
      const prev = seen.get(memberId);
      if (prev) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Node "${memberId}" appears in both scene "${prev}" and scene "${scene.id}"`,
          path: ['scenes'],
        });
      } else {
        seen.set(memberId, scene.id);
      }

      // Validate: member must reference existing service/queue
      if (!participantIds.has(memberId)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Scene "${scene.id}" references unknown node "${memberId}"`,
          path: ['scenes'],
        });
      }
    }
  }

  // Validate: zone members must not span multiple scenes
  for (const zone of data.zones) {
    const zoneScenes = new Set<string>();
    for (const memberId of zone.members) {
      const sceneId = seen.get(memberId);
      if (sceneId) zoneScenes.add(sceneId);
      else zoneScenes.add('__default__');
    }
    if (zoneScenes.size > 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Zone "${zone.id}" members span multiple scenes: ${[...zoneScenes].join(', ')}`,
        path: ['zones'],
      });
    }
  }
});

// ============================================================================
// TypeScript Types (inferred from Zod)
// ============================================================================

export type ZoneDef = z.infer<typeof ZoneDefSchema>;
export type ServiceDef = z.infer<typeof ServiceDefSchema>;
export type QueueDef = z.infer<typeof QueueDefSchema>;
export type SyncCall = z.infer<typeof SyncCallSchema>;
export type AsyncCall = z.infer<typeof AsyncCallSchema>;
export type PublishCall = z.infer<typeof PublishCallSchema>;
export type SubscribeCall = z.infer<typeof SubscribeCallSchema>;
export type CallDef = z.infer<typeof CallDefSchema>;
export type ServiceFlowStep = z.infer<typeof ServiceFlowStepSchema>;
export type ServiceFlowStory = z.infer<typeof ServiceFlowStorySchema>;

// ============================================================================
// Sub-State Color Mapping
// ============================================================================

/** Semantic color map for sub-state badge keywords (prefix-matched). */
export const SUBSTATE_COLOR_MAP: Array<{ keywords: string[]; color: string }> = [
  { keywords: ['idle', 'inactive', 'off', 'none'], color: '#9CA3AF' },
  { keywords: ['pending', 'queued', 'waiting', 'paused'], color: '#F59E0B' },
  { keywords: ['running', 'active', 'processing', 'assigned'], color: '#3B82F6' },
  { keywords: ['reading', 'fetching', 'querying'], color: '#06B6D4' },
  { keywords: ['writing', 'inserting', 'updating', 'committing'], color: '#A855F7' },
  { keywords: ['completed', 'done', 'approved', 'success', 'committed'], color: '#22C55E' },
  { keywords: ['failed', 'error', 'rejected', 'down'], color: '#EF4444' },
  { keywords: ['escalated', 'warning', 'degraded', 'compensating'], color: '#F97316' },
  { keywords: ['locked', 'blocked', 'throttled'], color: '#F43F5E' },
];

/** Get the semantic color for a sub-state name. Prefix-matched. */
export function getSubstateColor(substateName: string, fallbackColor: string): string {
  const lower = substateName.toLowerCase();
  for (const entry of SUBSTATE_COLOR_MAP) {
    if (entry.keywords.some(kw => lower.startsWith(kw))) {
      return entry.color;
    }
  }
  return fallbackColor;
}

/**
 * Resolve sub-states by walking steps 0..currentStepIndex.
 * Sub-states are sticky: they persist until explicitly changed or cleared (null).
 * Returns a Map<serviceId, substateValue | null>.
 */
export function resolveSubstates(
  steps: ServiceFlowStep[],
  currentStepIndex: number,
  services: ServiceDef[],
): Map<string, string | null> {
  const resolved = new Map<string, string | null>();

  // Initialize from service definitions
  for (const svc of services) {
    if (svc.initialSubstate) {
      resolved.set(svc.id, svc.initialSubstate);
    }
  }

  // Walk steps and apply substates
  for (let i = 0; i <= currentStepIndex; i++) {
    const step = steps[i];
    if (step?.substates) {
      for (const [serviceId, value] of Object.entries(step.substates)) {
        resolved.set(serviceId, value);
      }
    }
  }

  // Remove null entries (cleared substates)
  for (const [key, value] of resolved) {
    if (value === null) resolved.delete(key);
  }

  return resolved;
}

// ============================================================================
// Failure Cascade — BFS upstream through critical calls
// ============================================================================

export interface FailureCascadeResult {
  /** Service IDs affected by the failure (including the failed service itself) */
  affectedServices: Set<string>;
  /** Call IDs where fallback is now active */
  activeFallbacks: Set<string>;
  /** Call IDs that are in a failed state (critical path to failed service) */
  failedCalls: Set<string>;
}

/**
 * BFS upstream through calls marked `critical: true` starting from a failed service.
 * Returns affected services, active fallbacks, and failed call IDs.
 */
export function getServiceFlowCascade(
  calls: CallDef[],
  failedServiceId: string,
): FailureCascadeResult {
  const affectedServices = new Set<string>([failedServiceId]);
  const activeFallbacks = new Set<string>();
  const failedCalls = new Set<string>();

  // Build adjacency: for each service, which calls target it?
  const incomingCritical = new Map<string, CallDef[]>();
  for (const call of calls) {
    if ((call as any).critical) {
      const existing = incomingCritical.get(call.to) ?? [];
      existing.push(call);
      incomingCritical.set(call.to, existing);
    }
  }

  // BFS upstream from failed service
  const queue = [failedServiceId];
  while (queue.length > 0) {
    const current = queue.shift()!;
    const incoming = incomingCritical.get(current) ?? [];
    for (const call of incoming) {
      failedCalls.add(call.id);
      if (!affectedServices.has(call.from)) {
        affectedServices.add(call.from);
        queue.push(call.from);
      }
      // If this call has a fallback, mark it active
      if ((call as any).fallback) {
        activeFallbacks.add(call.id);
      }
    }
  }

  return { affectedServices, activeFallbacks, failedCalls };
}

// ============================================================================
// Validation Helper
// ============================================================================

export function validateServiceFlowStory(data: unknown): ServiceFlowStory {
  return ServiceFlowStorySchema.parse(data);
}

export function isValidServiceFlowStory(data: unknown): data is ServiceFlowStory {
  return ServiceFlowStorySchema.safeParse(data).success;
}

