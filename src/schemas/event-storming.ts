/**
 * Event Storming Schema
 * 
 * Visualizes domain events using Event Storming patterns:
 * - Domain Events (orange)
 * - Commands (blue)
 * - Actors (yellow)
 * - Aggregates (yellow container)
 * - Policies (lilac)
 * - Read Models (green)
 * - External Systems (pink)
 * - Hotspots (red/pink)
 * 
 * Based on: docs/planning/0005-EVENT-STORMING-PLANNING-ANIMATIONS.md
 * Reference: https://www.eventstorming.com/
 */

import { z } from 'zod';

// ============================================
// Sticky Note Types
// ============================================

export const StickyNoteType = z.enum([
  'domain-event',    // Orange - something that happened
  'command',         // Blue - intention to change
  'actor',           // Yellow (small) - person/role
  'aggregate',       // Yellow (large) - entity cluster
  'policy',          // Lilac - reactive logic
  'read-model',      // Green - query/projection
  'external-system', // Pink - external integration
  'hotspot',         // Red/Pink - problem or question
]);

export type StickyNoteType = z.infer<typeof StickyNoteType>;

// ============================================
// Actor
// ============================================

export const ActorSchema = z.object({
  id: z.string(),
  name: z.string(),
  icon: z.string().default('👤'),
  description: z.string().optional(),
  /** Is this an external actor? */
  external: z.boolean().default(false),
});

export type Actor = z.infer<typeof ActorSchema>;

// ============================================
// Domain Event
// ============================================

export const DomainEventSchema = z.object({
  id: z.string(),
  /** Past tense verb phrase (e.g., "OrderPlaced") */
  name: z.string(),
  description: z.string().optional(),
  /** Which aggregate does this belong to? */
  aggregate: z.string().optional(),
  /** What command triggered this event? */
  triggeredBy: z.string().optional(),
  /** Event payload fields */
  data: z.array(z.string()).optional(),
  /** Position in timeline (optional) */
  order: z.number().optional(),
});

export type DomainEvent = z.infer<typeof DomainEventSchema>;

// ============================================
// Command
// ============================================

export const CommandSchema = z.object({
  id: z.string(),
  /** Imperative verb phrase (e.g., "PlaceOrder") */
  name: z.string(),
  description: z.string().optional(),
  /** Who issues this command? */
  actor: z.string().optional(),
  /** Which aggregate handles this? */
  aggregate: z.string().optional(),
  /** What events can this produce? */
  produces: z.array(z.string()).optional(),
});

export type Command = z.infer<typeof CommandSchema>;

// ============================================
// Aggregate
// ============================================

export const AggregateSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  /** Events that belong to this aggregate */
  events: z.array(z.string()).optional(),
  /** Commands handled by this aggregate */
  commands: z.array(z.string()).optional(),
  /** Position hint */
  position: z.object({
    x: z.number(),
    y: z.number(),
  }).optional(),
});

export type Aggregate = z.infer<typeof AggregateSchema>;

// ============================================
// Policy
// ============================================

export const PolicySchema = z.object({
  id: z.string(),
  /** "When X, then Y" format */
  name: z.string(),
  description: z.string().optional(),
  /** Event that triggers this policy */
  trigger: z.string(),
  /** Command or action that results */
  action: z.string().optional(),
});

export type Policy = z.infer<typeof PolicySchema>;

// ============================================
// Read Model
// ============================================

export const ReadModelSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  /** Events that update this read model */
  updatedBy: z.array(z.string()).optional(),
  /** Who consumes this read model? */
  consumedBy: z.array(z.string()).optional(),
});

export type ReadModel = z.infer<typeof ReadModelSchema>;

// ============================================
// External System
// ============================================

export const ExternalSystemSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  /** Events received from this system */
  produces: z.array(z.string()).optional(),
  /** Commands sent to this system */
  consumes: z.array(z.string()).optional(),
});

export type ExternalSystem = z.infer<typeof ExternalSystemSchema>;

// ============================================
// Hotspot
// ============================================

export const HotspotSchema = z.object({
  id: z.string(),
  /** The concern or question */
  note: z.string(),
  /** Type of hotspot */
  type: z.enum(['question', 'problem', 'opportunity', 'risk']).default('question'),
  /** Near which element? */
  near: z.string().optional(),
  /** Who raised this? */
  raisedBy: z.string().optional(),
});

export type Hotspot = z.infer<typeof HotspotSchema>;

// ============================================
// Step Definition
// ============================================

export const EventStormingStepSchema = z.object({
  order: z.number().optional(),
  title: z.string(),
  description: z.string(),
  /** Focus on an aggregate */
  focusAggregate: z.string().optional(),
  /** Highlight specific events */
  highlightEvents: z.array(z.string()).optional(),
  /** Highlight commands */
  highlightCommands: z.array(z.string()).optional(),
  /** Show events in sequence */
  showEventSequence: z.boolean().default(false),
  /** Show policies */
  showPolicies: z.boolean().default(false),
  /** Show hotspots */
  showHotspots: z.boolean().default(false),
  /** Filter by actor */
  filterActor: z.string().optional(),
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

export type EventStormingStep = z.infer<typeof EventStormingStepSchema>;

// ============================================
// Full Story Schema
// ============================================

export const EventStormingStorySchema = z.object({
  title: z.string(),
  version: z.number().default(2),
  type: z.literal('event-storming'),
  
  /** Domain being modeled */
  domain: z.string().optional(),
  
  /** Actors */
  actors: z.array(ActorSchema).optional(),
  
  /** Aggregates */
  aggregates: z.array(AggregateSchema).optional(),
  
  /** Domain Events */
  events: z.array(DomainEventSchema),
  
  /** Commands */
  commands: z.array(CommandSchema).optional(),
  
  /** Policies */
  policies: z.array(PolicySchema).optional(),
  
  /** Read Models */
  readModels: z.array(ReadModelSchema).optional(),
  
  /** External Systems */
  externalSystems: z.array(ExternalSystemSchema).optional(),
  
  /** Hotspots */
  hotspots: z.array(HotspotSchema).optional(),
  
  /** Steps */
  steps: z.array(EventStormingStepSchema),
});

export type EventStormingStory = z.infer<typeof EventStormingStorySchema>;

// ============================================
// Event Storming Colors (Standard)
// ============================================

export const ES_COLORS = {
  domainEvent: '#FF9800',    // Orange
  command: '#2196F3',        // Blue
  actor: '#FFEB3B',          // Yellow
  aggregate: '#FFC107',      // Amber/Yellow
  policy: '#CE93D8',         // Lilac
  readModel: '#81C784',      // Green
  externalSystem: '#F48FB1', // Pink
  hotspot: '#EF5350',        // Red
  timeline: '#9E9E9E',       // Grey
};

export const ES_ICONS = {
  domainEvent: '⚡',
  command: '📝',
  actor: '👤',
  aggregate: '📦',
  policy: '📋',
  readModel: '👁️',
  externalSystem: '🔗',
  hotspot: '❓',
};

// ============================================
// Layout Constants
// ============================================

export const ES_LAYOUT = {
  /** Sticky note width */
  noteWidth: 140,
  /** Sticky note height */
  noteHeight: 80,
  /** Aggregate container padding */
  aggregatePadding: 20,
  /** Gap between notes */
  noteGap: 20,
  /** Timeline row height */
  rowHeight: 150,
};

// ============================================
// Validation Helpers
// ============================================

export function validateEventStormingStory(data: unknown): EventStormingStory {
  return EventStormingStorySchema.parse(data);
}

export function isEventStormingStory(data: unknown): data is EventStormingStory {
  return EventStormingStorySchema.safeParse(data).success;
}

/** Get events by aggregate */
export function getEventsByAggregate(story: EventStormingStory, aggregateId: string): DomainEvent[] {
  return story.events.filter(e => e.aggregate === aggregateId);
}

/** Get command-event chain */
export function getCommandEventChain(story: EventStormingStory, commandId: string): DomainEvent[] {
  return story.events.filter(e => e.triggeredBy === commandId);
}

/** Get policies triggered by event */
export function getPoliciesForEvent(story: EventStormingStory, eventId: string): Policy[] {
  return (story.policies || []).filter(p => p.trigger === eventId);
}
