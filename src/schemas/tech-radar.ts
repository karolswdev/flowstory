/**
 * Technology Radar Schema
 * 
 * Visualizes technology landscape using the ThoughtWorks Tech Radar pattern:
 * - Concentric rings for adoption status (Adopt → Hold)
 * - Quadrants for technology categories
 * - Blips for individual technologies
 * 
 * Based on: docs/planning/0002-TECH-RADAR-PLANNING-ANIMATIONS.md
 */

import { z } from 'zod';

// ============================================
// Rings (Adoption Status)
// ============================================

export const RingId = z.enum(['adopt', 'trial', 'assess', 'hold']);
export type RingId = z.infer<typeof RingId>;

export const RingSchema = z.object({
  id: RingId,
  name: z.string(),
  description: z.string().optional(),
  color: z.string().optional(),
});

export type Ring = z.infer<typeof RingSchema>;

export const DEFAULT_RINGS: Ring[] = [
  { id: 'adopt', name: 'Adopt', description: 'Use in production', color: '#4CAF50' },
  { id: 'trial', name: 'Trial', description: 'Try in projects', color: '#8BC34A' },
  { id: 'assess', name: 'Assess', description: 'Worth exploring', color: '#FFC107' },
  { id: 'hold', name: 'Hold', description: 'Proceed with caution', color: '#FF5722' },
];

// ============================================
// Quadrants (Categories)
// ============================================

export const QuadrantSchema = z.object({
  id: z.string(),
  name: z.string(),
  /** Angle in degrees (0 = right, 90 = bottom, etc.) */
  angle: z.number().default(0),
  color: z.string().optional(),
});

export type Quadrant = z.infer<typeof QuadrantSchema>;

export const DEFAULT_QUADRANTS: Quadrant[] = [
  { id: 'languages', name: 'Languages & Runtimes', angle: 315, color: '#2196F3' },
  { id: 'frameworks', name: 'Frameworks & Libraries', angle: 45, color: '#9C27B0' },
  { id: 'data', name: 'Data & Storage', angle: 135, color: '#FF9800' },
  { id: 'platforms', name: 'Platforms & Infrastructure', angle: 225, color: '#009688' },
];

// ============================================
// Technology (Blip)
// ============================================

export const TechnologySchema = z.object({
  id: z.string(),
  name: z.string(),
  /** Which quadrant this tech belongs to */
  quadrant: z.string(),
  /** Current ring (adoption status) */
  ring: RingId,
  /** Description/notes */
  description: z.string().optional(),
  /** Is this newly added to the radar? */
  isNew: z.boolean().default(false),
  /** Ring movement: positive = moved in, negative = moved out, 0 = unchanged */
  moved: z.number().default(0),
  /** URL to more info */
  url: z.string().optional(),
  /** Tags for filtering */
  tags: z.array(z.string()).optional(),
  /** Custom color override */
  color: z.string().optional(),
});

export type Technology = z.infer<typeof TechnologySchema>;

// ============================================
// Step Definition
// ============================================

export const TechRadarStepSchema = z.object({
  order: z.number().optional(),
  title: z.string(),
  description: z.string(),
  /** Focus on a specific ring */
  focusRing: RingId.nullable().optional(),
  /** Focus on a specific quadrant */
  focusQuadrant: z.string().nullable().optional(),
  /** Highlight specific technologies */
  highlightTech: z.array(z.string()).optional(),
  /** Show only new technologies */
  showNew: z.boolean().default(false),
  /** Show only moved technologies */
  showMoved: z.boolean().default(false),
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

export type TechRadarStep = z.infer<typeof TechRadarStepSchema>;

// ============================================
// Full Story Schema
// ============================================

export const TechRadarStorySchema = z.object({
  title: z.string(),
  version: z.number().default(2),
  type: z.literal('tech-radar'),
  
  /** Organization/team name */
  organization: z.string().optional(),
  
  /** Last updated date */
  date: z.string().optional(),
  
  /** Custom quadrant definitions (optional, uses defaults) */
  quadrants: z.array(QuadrantSchema).optional(),
  
  /** Custom ring definitions (optional, uses defaults) */
  rings: z.array(RingSchema).optional(),
  
  /** Technologies on the radar */
  technologies: z.array(TechnologySchema),
  
  /** Step-by-step walkthrough */
  steps: z.array(TechRadarStepSchema),
});

export type TechRadarStory = z.infer<typeof TechRadarStorySchema>;

// ============================================
// Layout Constants
// ============================================

export const TECH_RADAR_LAYOUT = {
  /** Total radar radius */
  radius: 400,
  /** Ring widths (as fraction of radius) */
  ringWidths: {
    adopt: 0.25,
    trial: 0.25,
    assess: 0.25,
    hold: 0.25,
  },
  /** Blip size */
  blipSize: 24,
  /** New blip indicator size */
  newIndicatorSize: 8,
  /** Quadrant label distance from center */
  labelDistance: 0.9,
  /** Animation duration (ms) */
  animationDuration: 600,
  /** Stagger delay per blip (ms) */
  staggerDelay: 50,
};

// ============================================
// Ring Colors & Styles
// ============================================

export const RING_COLORS: Record<RingId, string> = {
  adopt: '#4CAF50',
  trial: '#8BC34A',
  assess: '#FFC107',
  hold: '#FF5722',
};

export const RING_RADII: Record<RingId, { inner: number; outer: number }> = {
  adopt: { inner: 0, outer: 0.25 },
  trial: { inner: 0.25, outer: 0.5 },
  assess: { inner: 0.5, outer: 0.75 },
  hold: { inner: 0.75, outer: 1 },
};

// ============================================
// Movement Indicators
// ============================================

export const MOVEMENT_ICONS = {
  up: '▲',    // Moved to inner ring
  down: '▼',  // Moved to outer ring
  new: '★',   // New on radar
};

// ============================================
// Validation Helpers
// ============================================

export function validateTechRadarStory(data: unknown): TechRadarStory {
  return TechRadarStorySchema.parse(data);
}

export function isTechRadarStory(data: unknown): data is TechRadarStory {
  return TechRadarStorySchema.safeParse(data).success;
}

/** Get technologies in a specific quadrant */
export function getTechByQuadrant(story: TechRadarStory, quadrantId: string): Technology[] {
  return story.technologies.filter(t => t.quadrant === quadrantId);
}

/** Get technologies in a specific ring */
export function getTechByRing(story: TechRadarStory, ringId: RingId): Technology[] {
  return story.technologies.filter(t => t.ring === ringId);
}

/** Get new technologies */
export function getNewTech(story: TechRadarStory): Technology[] {
  return story.technologies.filter(t => t.isNew);
}

/** Get moved technologies */
export function getMovedTech(story: TechRadarStory): Technology[] {
  return story.technologies.filter(t => t.moved !== 0);
}

/** Calculate blip position within radar */
export function calculateBlipPosition(
  tech: Technology,
  quadrantIndex: number,
  ringId: RingId,
  indexInSegment: number,
  totalInSegment: number,
  radius: number
): { x: number; y: number } {
  const ringRadii = RING_RADII[ringId];
  const ringMidRadius = (ringRadii.inner + ringRadii.outer) / 2 * radius;
  
  // Quadrant angle (90 degrees each)
  const quadrantStart = quadrantIndex * 90 - 45; // Center the quadrant
  const angleSpread = 80; // Degrees to spread blips within quadrant
  const angleStep = angleSpread / (totalInSegment + 1);
  const angle = (quadrantStart + angleStep * (indexInSegment + 1)) * (Math.PI / 180);
  
  // Add some jitter to avoid overlaps
  const jitter = (Math.random() - 0.5) * 20;
  
  return {
    x: Math.cos(angle) * (ringMidRadius + jitter),
    y: Math.sin(angle) * (ringMidRadius + jitter),
  };
}
