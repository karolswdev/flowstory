import { z } from 'zod';

// ============================================================================
// Type Definitions
// ============================================================================

export const SERVICE_TYPES = ['api', 'worker', 'gateway', 'database', 'cache', 'external'] as const;
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

export const LAYOUTS = ['sequence', 'topology', 'trace'] as const;
export type ServiceFlowLayout = typeof LAYOUTS[number];

// ============================================================================
// Color Configurations
// ============================================================================

export const SERVICE_TYPE_ICONS: Record<ServiceType, string> = {
  api: '⚙️',
  worker: '👷',
  gateway: '🚪',
  database: '🗄️',
  cache: '⚡',
  external: '🌐',
};

export const SERVICE_TYPE_COLORS: Record<ServiceType, string> = {
  api: '#3B82F6',
  worker: '#A855F7',
  gateway: '#F59E0B',
  database: '#78716C',
  cache: '#06B6D4',
  external: '#64748B',
};

export const STATUS_COLORS: Record<HealthStatus, string> = {
  healthy: '#22C55E',
  degraded: '#F59E0B',
  down: '#EF4444',
};

export const QUEUE_TYPE_ICONS: Record<QueueType, string> = {
  queue: '📥',
  topic: '📬',
  stream: '📜',
};

export const CALL_TYPE_COLORS: Record<CallType, string> = {
  sync: '#3B82F6',
  async: '#A855F7',
  publish: '#F59E0B',
  subscribe: '#14B8A6',
};

// ============================================================================
// Zod Schemas
// ============================================================================

const ServiceTypeSchema = z.enum(SERVICE_TYPES);
const HealthStatusSchema = z.enum(HEALTH_STATUSES);
const QueueTypeSchema = z.enum(QUEUE_TYPES);
const BrokerTypeSchema = z.enum(BROKER_TYPES);
const ProtocolSchema = z.enum(PROTOCOLS);
const LayoutSchema = z.enum(LAYOUTS);

export const ServiceDefSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: ServiceTypeSchema,
  technology: z.string().optional(),
  status: HealthStatusSchema.optional(),
  instances: z.number().int().positive().optional(),
  version: z.string().optional(),
});

export const QueueDefSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: QueueTypeSchema,
  broker: BrokerTypeSchema.optional(),
  depth: z.number().int().optional(),
  consumers: z.number().int().optional(),
});

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
  response: z.unknown().optional(),
});

export const AsyncCallSchema = z.object({
  id: z.string(),
  type: z.literal('async'),
  from: z.string(),
  to: z.string(),
  messageType: z.string(),
  payload: z.unknown().optional(),
  correlationId: z.string().optional(),
});

export const PublishCallSchema = z.object({
  id: z.string(),
  type: z.literal('publish'),
  from: z.string(),
  to: z.string(),
  messageType: z.string(),
  payload: z.unknown().optional(),
});

export const SubscribeCallSchema = z.object({
  id: z.string(),
  type: z.literal('subscribe'),
  from: z.string(),
  to: z.string(),
  messageType: z.string(),
  action: z.string().optional(),
});

export const CallDefSchema = z.discriminatedUnion('type', [
  SyncCallSchema,
  AsyncCallSchema,
  PublishCallSchema,
  SubscribeCallSchema,
]);

export const ServiceFlowStepSchema = z.object({
  id: z.string(),
  title: z.string(),
  narrative: z.string(),
  activeCalls: z.array(z.string()),
  duration: z.number().optional(),
  narration: z.object({
    speaker: z.string(),
    message: z.string(),
  }).optional(),
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
  steps: z.array(ServiceFlowStepSchema),
});

// ============================================================================
// TypeScript Types (inferred from Zod)
// ============================================================================

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
// Validation Helper
// ============================================================================

export function validateServiceFlowStory(data: unknown): ServiceFlowStory {
  return ServiceFlowStorySchema.parse(data);
}

export function isValidServiceFlowStory(data: unknown): data is ServiceFlowStory {
  return ServiceFlowStorySchema.safeParse(data).success;
}

// ============================================================================
// Layout Constants
// ============================================================================

export const SERVICE_FLOW_LAYOUT = {
  LANE_WIDTH: 220,
  LANE_SPACING: 120,
  CALL_SPACING: 80,
  NODE_HEIGHT: 80,
  QUEUE_HEIGHT: 60,
  HEADER_HEIGHT: 50,
  PADDING: 80,
} as const;
