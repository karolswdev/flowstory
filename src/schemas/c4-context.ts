/**
 * C4 Context Diagram Schema
 * 
 * Visualizes system context using the C4 model (Level 1):
 * - Central system being described
 * - People/actors who use it
 * - External system dependencies
 * - Relationships between all elements
 * 
 * Based on: docs/planning/0004-C4-CONTEXT-PLANNING-ANIMATIONS.md
 * Reference: https://c4model.com/
 */

import { z } from 'zod';

// ============================================
// Relationship Types
// ============================================

export const C4RelationshipType = z.enum([
  'uses',      // User interacts with system
  'sends',     // Sends data/events to
  'reads',     // Reads data from
  'manages',   // Administrative control
  'calls',     // Makes API calls to
  'stores',    // Stores data in
  'notifies',  // Sends notifications to
]);

export type C4RelationshipType = z.infer<typeof C4RelationshipType>;

// ============================================
// Person (User/Actor)
// ============================================

export const C4PersonSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  icon: z.string().default('👤'),
  /** Is this an external user (customer) or internal (employee)? */
  external: z.boolean().default(false),
  /** Role or type for grouping */
  role: z.string().optional(),
});

export type C4Person = z.infer<typeof C4PersonSchema>;

// ============================================
// System (The system being described)
// ============================================

export const C4SystemSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  icon: z.string().default('🏢'),
  color: z.string().default('#2196F3'),
  /** Key capabilities/features */
  capabilities: z.array(z.string()).optional(),
  /** Technology stack summary */
  technology: z.string().optional(),
});

export type C4System = z.infer<typeof C4SystemSchema>;

// ============================================
// External System
// ============================================

export const C4ExternalSystemSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  icon: z.string().default('🔗'),
  /** Vendor/provider name */
  vendor: z.string().optional(),
  /** Is this a critical dependency? */
  critical: z.boolean().default(false),
  /** Type of system */
  type: z.enum(['saas', 'api', 'database', 'legacy', 'partner', 'infrastructure']).optional(),
});

export type C4ExternalSystem = z.infer<typeof C4ExternalSystemSchema>;

// ============================================
// Relationship
// ============================================

export const C4RelationshipSchema = z.object({
  id: z.string().optional(),
  from: z.string(),
  to: z.string(),
  type: C4RelationshipType.default('uses'),
  description: z.string().optional(),
  /** Technology/protocol used */
  technology: z.string().optional(),
  /** Is this synchronous or async? */
  sync: z.boolean().default(true),
  /** Is this a critical path? */
  critical: z.boolean().default(false),
});

export type C4Relationship = z.infer<typeof C4RelationshipSchema>;

// ============================================
// Step Definition
// ============================================

export const C4ContextStepSchema = z.object({
  order: z.number().optional(),
  title: z.string(),
  description: z.string(),
  /** Focus on specific node */
  focusNode: z.string().optional(),
  /** Highlight multiple nodes */
  highlightNodes: z.array(z.string()).optional(),
  /** Show specific relationships */
  showRelationships: z.array(z.string()).optional(),
  /** Filter by relationship type */
  filterRelationType: C4RelationshipType.optional(),
  /** Show only critical paths */
  showCriticalPath: z.boolean().default(false),
  /** Zoom level */
  zoomLevel: z.number().default(1),
  /** Duration for auto-advance */
  duration: z.number().default(5000),
  /** Narration */
  narration: z.object({
    speaker: z.string().optional(),
    message: z.string(),
  }).optional(),
});

export type C4ContextStep = z.infer<typeof C4ContextStepSchema>;

// ============================================
// Full Story Schema
// ============================================

export const C4ContextStorySchema = z.object({
  title: z.string(),
  version: z.number().default(2),
  type: z.literal('c4-context'),
  
  /** Organization context */
  organization: z.string().optional(),
  
  /** The main system being described */
  system: C4SystemSchema,
  
  /** People/actors */
  people: z.array(C4PersonSchema).optional(),
  
  /** External systems */
  externalSystems: z.array(C4ExternalSystemSchema).optional(),
  
  /** Relationships */
  relationships: z.array(C4RelationshipSchema),
  
  /** Step-by-step walkthrough */
  steps: z.array(C4ContextStepSchema),
});

export type C4ContextStory = z.infer<typeof C4ContextStorySchema>;

// ============================================
// Visual Constants
// ============================================

export const C4_COLORS = {
  system: '#2196F3',
  person: '#08427B',
  personExternal: '#999999',
  externalSystem: '#999999',
  relationship: '#707070',
  criticalPath: '#F44336',
};

export const C4_ICONS = {
  person: '👤',
  system: '🏢',
  externalSaas: '☁️',
  externalApi: '🔌',
  externalDatabase: '🗃️',
  externalLegacy: '🏛️',
  externalPartner: '🤝',
  externalInfra: '🏗️',
};

export const RELATIONSHIP_STYLES: Record<C4RelationshipType, { dash?: string; label: string }> = {
  uses: { label: 'Uses' },
  sends: { dash: '5,5', label: 'Sends data to' },
  reads: { dash: '3,3', label: 'Reads from' },
  manages: { label: 'Manages' },
  calls: { dash: '8,4', label: 'Makes API calls to' },
  stores: { dash: '5,5', label: 'Stores data in' },
  notifies: { dash: '3,3', label: 'Notifies' },
};

// ============================================
// Layout Constants
// ============================================

export const C4_CONTEXT_LAYOUT = {
  /** System node size */
  systemWidth: 280,
  systemHeight: 180,
  /** Person node size */
  personWidth: 160,
  personHeight: 120,
  /** External system size */
  externalWidth: 180,
  externalHeight: 120,
  /** Spacing between nodes */
  nodeSpacing: 100,
  /** Animation duration */
  animationDuration: 500,
};

// ============================================
// Validation Helpers
// ============================================

export function validateC4ContextStory(data: unknown): C4ContextStory {
  return C4ContextStorySchema.parse(data);
}

export function isC4ContextStory(data: unknown): data is C4ContextStory {
  return C4ContextStorySchema.safeParse(data).success;
}

/** Get all relationships for a node */
export function getNodeRelationships(story: C4ContextStory, nodeId: string): C4Relationship[] {
  return story.relationships.filter(r => r.from === nodeId || r.to === nodeId);
}

/** Get inbound relationships to a node */
export function getInboundRelationships(story: C4ContextStory, nodeId: string): C4Relationship[] {
  return story.relationships.filter(r => r.to === nodeId);
}

/** Get outbound relationships from a node */
export function getOutboundRelationships(story: C4ContextStory, nodeId: string): C4Relationship[] {
  return story.relationships.filter(r => r.from === nodeId);
}

/** Get critical path relationships */
export function getCriticalRelationships(story: C4ContextStory): C4Relationship[] {
  return story.relationships.filter(r => r.critical);
}
