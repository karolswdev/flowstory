/**
 * Dependency Graph Schema
 * 
 * Visualizes service dependencies with health status:
 * - Services, databases, caches, queues
 * - Health indicators (uptime %)
 * - Dependency criticality
 * - Cascade failure analysis
 * 
 * Based on: docs/planning/0006-DEPENDENCY-GRAPH-PLANNING-ANIMATIONS.md
 */

import { z } from 'zod';

// ============================================
// Node Types
// ============================================

export const ServiceType = z.enum([
  'service',     // Microservice
  'database',    // Database
  'cache',       // Cache (Redis, etc.)
  'queue',       // Message queue
  'external',    // External API
  'gateway',     // API Gateway
  'cdn',         // CDN
  'storage',     // Object storage
]);

export type ServiceType = z.infer<typeof ServiceType>;

// ============================================
// Health Status
// ============================================

export const HealthStatus = z.enum(['healthy', 'degraded', 'critical', 'unknown']);
export type HealthStatus = z.infer<typeof HealthStatus>;

export function getHealthStatus(uptime: number | undefined): HealthStatus {
  if (uptime === undefined) return 'unknown';
  if (uptime >= 99.5) return 'healthy';
  if (uptime >= 98) return 'degraded';
  return 'critical';
}

// ============================================
// Service Node
// ============================================

export const ServiceNodeSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: ServiceType,
  /** Uptime percentage (0-100) */
  health: z.number().min(0).max(100).optional(),
  /** Average latency in ms */
  latency: z.number().optional(),
  /** Requests per second */
  rps: z.number().optional(),
  /** Error rate percentage */
  errorRate: z.number().optional(),
  /** Team that owns this */
  owner: z.string().optional(),
  /** Technology stack */
  tech: z.string().optional(),
  /** Description */
  description: z.string().optional(),
  /** Is this an entry point? */
  entryPoint: z.boolean().default(false),
  /** Custom icon */
  icon: z.string().optional(),
});

export type ServiceNode = z.infer<typeof ServiceNodeSchema>;

// ============================================
// Dependency Types
// ============================================

export const DependencyType = z.enum([
  'sync',        // Synchronous call
  'async',       // Async/event-driven
  'data',        // Data dependency
  'cache',       // Cache lookup
  'queue',       // Queue publish/consume
]);

export type DependencyType = z.infer<typeof DependencyType>;

export const Criticality = z.enum(['low', 'medium', 'high', 'critical']);
export type Criticality = z.infer<typeof Criticality>;

// ============================================
// Dependency Edge
// ============================================

export const DependencySchema = z.object({
  id: z.string().optional(),
  from: z.string(),
  to: z.string(),
  type: DependencyType.default('sync'),
  criticality: Criticality.default('medium'),
  /** Protocol/method */
  protocol: z.string().optional(),
  /** Average latency on this path */
  latency: z.number().optional(),
  /** Calls per second */
  cps: z.number().optional(),
  /** Is this a fallback path? */
  fallback: z.boolean().default(false),
  /** Label */
  label: z.string().optional(),
});

export type Dependency = z.infer<typeof DependencySchema>;

// ============================================
// Step Definition
// ============================================

export const DependencyGraphStepSchema = z.object({
  order: z.number().optional(),
  title: z.string(),
  description: z.string(),
  /** Focus on a specific service */
  focusNode: z.string().optional(),
  /** Highlight multiple services */
  highlightNodes: z.array(z.string()).optional(),
  /** Show downstream dependencies */
  showDownstream: z.boolean().default(false),
  /** Show upstream dependencies */
  showUpstream: z.boolean().default(false),
  /** Simulate failure cascade */
  simulateFailure: z.string().optional(),
  /** Filter by criticality */
  filterCriticality: Criticality.optional(),
  /** Show only unhealthy services */
  showUnhealthy: z.boolean().default(false),
  /** Zoom level */
  zoomLevel: z.number().default(1),
  /** Duration */
  duration: z.number().default(5000),
  /** Narration */
  narration: z.object({
    speaker: z.string().optional(),
    message: z.string(),
  }).optional(),
});

export type DependencyGraphStep = z.infer<typeof DependencyGraphStepSchema>;

// ============================================
// Full Story Schema
// ============================================

export const DependencyGraphStorySchema = z.object({
  title: z.string(),
  version: z.number().default(2),
  type: z.literal('dependency-graph'),
  
  /** System name */
  system: z.string().optional(),
  
  /** Services */
  services: z.array(ServiceNodeSchema),
  
  /** Dependencies */
  dependencies: z.array(DependencySchema),
  
  /** Steps */
  steps: z.array(DependencyGraphStepSchema),
});

export type DependencyGraphStory = z.infer<typeof DependencyGraphStorySchema>;

// ============================================
// Visual Constants
// ============================================

export const HEALTH_COLORS: Record<HealthStatus, string> = {
  healthy: '#4CAF50',
  degraded: '#FFC107',
  critical: '#F44336',
  unknown: '#9E9E9E',
};

export const HEALTH_ICONS: Record<HealthStatus, string> = {
  healthy: '🟢',
  degraded: '🟡',
  critical: '🔴',
  unknown: '⚫',
};

export const SERVICE_TYPE_ICONS: Record<ServiceType, string> = {
  service: '⚙️',
  database: '🗃️',
  cache: '⚡',
  queue: '📬',
  external: '🌐',
  gateway: '🚪',
  cdn: '🌍',
  storage: '📦',
};

export const CRITICALITY_COLORS: Record<Criticality, string> = {
  low: '#81C784',
  medium: '#64B5F6',
  high: '#FFB74D',
  critical: '#E57373',
};

// ============================================
// Layout Constants
// ============================================

export const DEPENDENCY_GRAPH_LAYOUT = {
  nodeWidth: 160,
  nodeHeight: 100,
  nodeGap: 60,
  levelGap: 120,
};

// ============================================
// Validation Helpers
// ============================================

export function validateDependencyGraphStory(data: unknown): DependencyGraphStory {
  return DependencyGraphStorySchema.parse(data);
}

export function isDependencyGraphStory(data: unknown): data is DependencyGraphStory {
  return DependencyGraphStorySchema.safeParse(data).success;
}

/** Get downstream services (services that this depends on) */
export function getDownstream(story: DependencyGraphStory, serviceId: string): string[] {
  return story.dependencies
    .filter(d => d.from === serviceId)
    .map(d => d.to);
}

/** Get upstream services (services that depend on this) */
export function getUpstream(story: DependencyGraphStory, serviceId: string): string[] {
  return story.dependencies
    .filter(d => d.to === serviceId)
    .map(d => d.from);
}

/** Get all services in failure cascade (transitive downstream) */
export function getFailureCascade(story: DependencyGraphStory, serviceId: string): Set<string> {
  const cascade = new Set<string>();
  const queue = [serviceId];
  
  while (queue.length > 0) {
    const current = queue.shift()!;
    if (cascade.has(current)) continue;
    cascade.add(current);
    
    // Add upstream (services that depend on this failing service)
    getUpstream(story, current).forEach(id => {
      if (!cascade.has(id)) queue.push(id);
    });
  }
  
  return cascade;
}
