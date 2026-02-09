/**
 * Architectural Story Schema - Zod Validation
 * 
 * Runtime validation schemas for v2 (architectural) stories.
 * Per SPEC-004: specs/architectural-schema.md
 */

import { z } from 'zod';

// ============================================================================
// Base Schemas
// ============================================================================

export const PositionSchema = z.object({
  x: z.number(),
  y: z.number(),
});

// ============================================================================
// Architectural Extensions
// ============================================================================

export const BoundedContextDefSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  shortName: z.string().optional(),
  color: z.string().optional(),
  icon: z.string().optional(),
});

export const OrchestrationStepSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  targetBC: z.string().min(1),
  compensation: z.string().optional(),
});

export const OrchestrationDefSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  type: z.enum(['conductor', 'saga', 'choreography']),
  steps: z.array(OrchestrationStepSchema),
});

export const InfrastructureElementSchema = z.object({
  id: z.string().min(1),
  type: z.enum(['bus', 'topic', 'queue', 'database', 'cache', 'external']),
  name: z.string().min(1),
  parentId: z.string().optional(),
});

export const LayerSchema = z.enum(['orchestration', 'domain', 'infrastructure']);
export const ZoomLevelSchema = z.enum(['executive', 'manager', 'engineer']);

// ============================================================================
// Actor Schema
// ============================================================================

export const ActorSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  type: z.enum(['user', 'system', 'external', 'orchestrator', 'service']),
  avatar: z.string().optional(),
  color: z.string().optional(),
  boundedContext: z.string().optional(),
});

// ============================================================================
// Node Schema
// ============================================================================

export const NodeTypeSchema = z.enum([
  // v1 types
  'actor', 'action', 'decision', 'system', 'event', 'state', 'start', 'end', 'integration',
  // v2 types
  'orchestrator-step', 'infrastructure', 'aggregate', 'service', 'external',
]);

export const StoryNodeSchema = z.object({
  id: z.string().min(1),
  type: NodeTypeSchema,
  actorId: z.string().optional(),
  actor: z.string().optional(), // deprecated, still accepted
  label: z.string().min(1),
  description: z.string().optional(),
  position: PositionSchema,
  data: z.record(z.unknown()).optional(),
  // Architectural extensions
  boundedContext: z.string().optional(),
  layer: LayerSchema.optional(),
  zoomLevel: ZoomLevelSchema.optional(),
  orchestrationStepId: z.string().optional(),
  infrastructureId: z.string().optional(),
});

// ============================================================================
// Edge Schema
// ============================================================================

export const EdgeTypeSchema = z.enum([
  // v1 types
  'flow', 'event', 'error', 'async',
  // v2 types
  'command', 'query', 'compensation',
]);

export const StoryEdgeSchema = z.object({
  id: z.string().min(1),
  source: z.string().min(1),
  target: z.string().min(1),
  type: EdgeTypeSchema,
  label: z.string().optional(),
  animated: z.boolean().optional(),
  // Architectural extensions
  crossBC: z.boolean().optional(),
  eventType: z.enum(['domain', 'integration', 'infrastructure']).optional(),
  routeVia: z.string().optional(),
  zoomLevel: ZoomLevelSchema.optional(),
});

// ============================================================================
// Step Schema
// ============================================================================

export const StepEventSchema = z.object({
  type: z.string().min(1),
  from: z.string().min(1),
  to: z.string().min(1),
  payload: z.record(z.unknown()).optional(),
});

export const StepCommandSchema = z.object({
  type: z.string().min(1),
  from: z.string().min(1),
  to: z.string().min(1),
  payload: z.record(z.unknown()).optional(),
});

export const StoryStepSchema = z.object({
  id: z.string().min(1),
  order: z.number().optional(),
  title: z.string().optional(),
  nodeIds: z.array(z.string()).optional(),
  activeNodes: z.array(z.string()).optional(), // deprecated, still accepted
  edgeIds: z.array(z.string()).optional(),
  activeEdges: z.array(z.string()).optional(), // deprecated, still accepted
  narrative: z.string().min(1),
  duration: z.number().optional(),
  // Architectural extensions
  activeBCs: z.array(z.string()).optional(),
  orchestrationStep: z.string().optional(),
  events: z.array(StepEventSchema).optional(),
  commands: z.array(StepCommandSchema).optional(),
});

// ============================================================================
// Complete Story Schema
// ============================================================================

export const UserStorySchema = z.object({
  // Core fields
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  context: z.string().optional(),
  boundedContext: z.string().optional(), // deprecated
  version: z.string().optional(),
  
  // Architectural extensions
  schemaVersion: z.string().optional(),
  renderer: z.string().optional(),
  boundedContexts: z.array(BoundedContextDefSchema).optional(),
  orchestration: OrchestrationDefSchema.optional(),
  infrastructure: z.array(InfrastructureElementSchema).optional(),
  
  // Collections
  actors: z.array(ActorSchema),
  nodes: z.array(StoryNodeSchema),
  edges: z.array(StoryEdgeSchema),
  steps: z.array(StoryStepSchema),
});

// Type exports from schemas
export type BoundedContextDefZ = z.infer<typeof BoundedContextDefSchema>;
export type OrchestrationDefZ = z.infer<typeof OrchestrationDefSchema>;
export type InfrastructureElementZ = z.infer<typeof InfrastructureElementSchema>;
export type StoryNodeZ = z.infer<typeof StoryNodeSchema>;
export type StoryEdgeZ = z.infer<typeof StoryEdgeSchema>;
export type StoryStepZ = z.infer<typeof StoryStepSchema>;
export type UserStoryZ = z.infer<typeof UserStorySchema>;

// ============================================================================
// Validation Helpers
// ============================================================================

/**
 * Validate a story against the Zod schema
 */
export function validateWithZod(story: unknown): { 
  success: boolean; 
  data?: UserStoryZ; 
  errors?: z.ZodError 
} {
  const result = UserStorySchema.safeParse(story);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, errors: result.error };
}

/**
 * Check if a story uses the v2 (architectural) schema
 */
export function isArchitecturalSchema(story: unknown): boolean {
  if (!story || typeof story !== 'object') return false;
  const s = story as Record<string, unknown>;
  return (
    s.schemaVersion === '2.0' ||
    s.renderer === 'architectural' ||
    !!s.boundedContexts ||
    !!s.orchestration ||
    !!s.infrastructure
  );
}
