/**
 * BC Composition Schema v1
 * 
 * Visualizes the composition of a Bounded Context or any central concept:
 * - Central node (the "what")
 * - Radiating elements (the "constituted parts")
 * - Progressive reveal: start with center, reveal outward one-by-one
 * - Nested hierarchies: elements can have their own children
 * - Custom effects per element
 * 
 * NOT locked to DevOps - can visualize any composition:
 * - Domain model constituents
 * - Service dependencies
 * - Infrastructure topology
 * - Team structures
 * - Anything that has a center and radiating parts
 */

import { z } from 'zod';

// ============================================
// Effects Library
// ============================================

/** Available reveal effects */
export const RevealEffect = z.enum([
  'fade',        // Simple fade in
  'grow',        // Scale from 0 to 1
  'slide',       // Slide in from direction
  'pulse',       // Fade in with pulse
  'radiate',     // Ripple effect from center
  'cascade',     // Sequential child reveal
  'glow',        // Appear with glow
  'none',        // Instant appear
]);
export type RevealEffect = z.infer<typeof RevealEffect>;

/** Effect configuration */
export const EffectConfig = z.object({
  type: RevealEffect.default('fade'),
  duration: z.number().default(500),      // ms
  delay: z.number().default(0),           // ms after step starts
  direction: z.enum(['up', 'down', 'left', 'right']).optional(),
});
export type EffectConfig = z.infer<typeof EffectConfig>;

// ============================================
// Layout Configuration
// ============================================

export const LayoutMode = z.enum(['radial', 'hierarchical', 'layered', 'force']);
export type LayoutMode = z.infer<typeof LayoutMode>;

export const LayoutConfig = z.object({
  mode: LayoutMode.default('radial'),
  centerSize: z.number().default(140),
  spacing: z.number().default(180),       // Gap between levels
  childSpacing: z.number().default(60),   // Gap between children
}).optional();
export type LayoutConfig = z.infer<typeof LayoutConfig>;

// ============================================
// Core Node (Center)
// ============================================

export const CoreNodeSchema = z.object({
  id: z.string(),
  name: z.string(),
  icon: z.string().optional(),            // Emoji or icon name
  description: z.string().optional(),
  color: z.string().default('#4CAF50'),
  
  // Optional metadata displayed on node
  metadata: z.record(z.string()).optional(),
});
export type CoreNode = z.infer<typeof CoreNodeSchema>;

// ============================================
// Element (Generic Constituent)
// ============================================

export const ElementSchema = z.object({
  id: z.string(),
  
  // Display
  name: z.string(),
  type: z.string(),                       // FREE TEXT - not enum locked
  icon: z.string().optional(),            // Emoji or icon name
  description: z.string().optional(),
  color: z.string().optional(),           // Override default type color
  
  // Position & hierarchy
  layer: z.number().default(1),           // Distance from center (1 = closest)
  parentId: z.string().optional(),        // For nested hierarchies
  
  // Content
  annotations: z.record(z.string()).optional(),  // Key-value metadata
  
  // Children (nested elements)
  children: z.array(z.object({
    id: z.string(),
    name: z.string(),
    type: z.string(),
    icon: z.string().optional(),
    annotations: z.record(z.string()).optional(),
  })).optional(),
  
  // Reveal configuration
  effect: EffectConfig.optional(),
});
export type Element = z.infer<typeof ElementSchema>;

// ============================================
// Edge Types
// ============================================

export const EdgeType = z.enum([
  'depends',      // Hard dependency
  'uses',         // Soft usage
  'contains',     // Parent-child
  'configures',   // Configuration relationship
  'publishes',    // Event publishing
  'subscribes',   // Event subscription
  'custom',       // Custom label
]);
export type EdgeType = z.infer<typeof EdgeType>;

export const EdgeSchema = z.object({
  id: z.string(),
  source: z.string(),
  target: z.string(),
  type: EdgeType.default('depends'),
  label: z.string().optional(),           // Override default label
  style: z.enum(['solid', 'dashed', 'dotted']).optional(),
});
export type Edge = z.infer<typeof EdgeSchema>;

// ============================================
// Step (Controls Progressive Reveal)
// ============================================

export const StepSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  
  // Progressive reveal - which NEW nodes to show this step
  reveal: z.array(z.string()).optional(), // Node IDs to reveal
  
  // Focus (for camera/highlight) - subset of visible nodes
  focus: z.array(z.string()).optional(),
  
  // Auto-expand children of these nodes
  expand: z.array(z.string()).optional(),
  
  // Narration
  narration: z.object({
    speaker: z.string().optional(),
    message: z.string(),
    position: z.enum(['top', 'bottom', 'left', 'right']).optional(),
  }).optional(),
  
  // Camera
  zoomLevel: z.number().optional(),       // 0.5 = zoom out, 2 = zoom in
});
export type Step = z.infer<typeof StepSchema>;

// ============================================
// Full Story Schema
// ============================================

export const BCCompositionStorySchema = z.object({
  title: z.string(),
  version: z.number().default(1),
  type: z.literal('bc-composition'),
  
  // Configuration
  layout: LayoutConfig,
  
  // Central node
  core: CoreNodeSchema,
  
  // Surrounding elements
  elements: z.array(ElementSchema),
  
  // Relationships
  edges: z.array(EdgeSchema).optional(),
  
  // Step-by-step reveal sequence
  steps: z.array(StepSchema),
});

export type BCCompositionStory = z.infer<typeof BCCompositionStorySchema>;

// ============================================
// Default Type Colors (extensible)
// ============================================

export const DEFAULT_TYPE_COLORS: Record<string, string> = {
  // DevOps types (for backwards compat)
  'helm-chart': '#0D7EE8',
  'deployment': '#326CE5',
  'service': '#009688',
  'secret': '#9C27B0',
  'configmap': '#FF9800',
  'database': '#3F51B5',
  'queue': '#E91E63',
  'ingress': '#00BCD4',
  
  // Domain types
  'aggregate': '#4CAF50',
  'entity': '#8BC34A',
  'value-object': '#CDDC39',
  'repository': '#795548',
  'domain-service': '#2196F3',
  'event': '#FF5722',
  'command': '#9C27B0',
  
  // Infrastructure
  'api': '#00BCD4',
  'cache': '#FF5722',
  'storage': '#607D8B',
  
  // Default
  'default': '#78909C',
};

// ============================================
// Default Effect Configurations
// ============================================

export const DEFAULT_EFFECTS: Record<RevealEffect, Partial<EffectConfig>> = {
  fade: { duration: 400 },
  grow: { duration: 500 },
  slide: { duration: 400, direction: 'up' },
  pulse: { duration: 600 },
  radiate: { duration: 800 },
  cascade: { duration: 300 },
  glow: { duration: 500 },
  none: { duration: 0 },
};
