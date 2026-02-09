/**
 * ADR Timeline Schema
 * 
 * Visualizes Architecture Decision Records as an interactive timeline:
 * - ADR cards with status badges
 * - Timeline progression
 * - Relationship tracking (supersedes, relates to)
 * - Category/domain grouping
 * 
 * Based on: docs/planning/0003-ADR-TIMELINE-PLANNING-ANIMATIONS.md
 */

import { z } from 'zod';

// ============================================
// ADR Status
// ============================================

export const ADRStatus = z.enum([
  'draft',       // Being written
  'proposed',    // Under review
  'decided',     // Accepted and active
  'deprecated',  // Valid but outdated
  'superseded',  // Replaced by another ADR
  'rejected',    // Not accepted
]);

export type ADRStatus = z.infer<typeof ADRStatus>;

// ============================================
// Category
// ============================================

export const CategorySchema = z.object({
  id: z.string(),
  name: z.string(),
  color: z.string().default('#2196F3'),
  description: z.string().optional(),
});

export type Category = z.infer<typeof CategorySchema>;

// ============================================
// ADR Definition
// ============================================

export const ADRSchema = z.object({
  id: z.string(),
  /** ADR number (e.g., 1, 2, 3) */
  number: z.number(),
  title: z.string(),
  status: ADRStatus,
  /** Decision date (ISO format) */
  date: z.string(),
  /** Category/domain */
  category: z.string(),
  /** Context/problem statement */
  context: z.string().optional(),
  /** The decision made */
  decision: z.string().optional(),
  /** Consequences of the decision */
  consequences: z.array(z.string()).optional(),
  /** ADR ID this supersedes */
  supersedes: z.string().nullable().optional(),
  /** ADR ID that supersedes this */
  supersededBy: z.string().nullable().optional(),
  /** Related ADR IDs */
  relatedTo: z.array(z.string()).optional(),
  /** Decision makers */
  deciders: z.array(z.string()).optional(),
  /** Tags for filtering */
  tags: z.array(z.string()).optional(),
  /** Link to full ADR document */
  url: z.string().optional(),
});

export type ADR = z.infer<typeof ADRSchema>;

// ============================================
// Milestone (Timeline marker)
// ============================================

export const MilestoneSchema = z.object({
  id: z.string(),
  date: z.string(),
  label: z.string(),
  description: z.string().optional(),
});

export type Milestone = z.infer<typeof MilestoneSchema>;

// ============================================
// Step Definition
// ============================================

export const ADRTimelineStepSchema = z.object({
  order: z.number().optional(),
  title: z.string(),
  description: z.string(),
  /** Focus on a specific date range */
  focusDate: z.string().nullable().optional(),
  /** End of date range */
  focusDateEnd: z.string().optional(),
  /** Highlight specific ADRs */
  highlightADRs: z.array(z.string()).optional(),
  /** Filter by category */
  filterCategory: z.string().optional(),
  /** Filter by status */
  filterStatus: ADRStatus.optional(),
  /** Show relationships */
  showRelationships: z.boolean().default(false),
  /** Expand a specific ADR */
  expandADR: z.string().optional(),
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

export type ADRTimelineStep = z.infer<typeof ADRTimelineStepSchema>;

// ============================================
// Full Story Schema
// ============================================

export const ADRTimelineStorySchema = z.object({
  title: z.string(),
  version: z.number().default(2),
  type: z.literal('adr-timeline'),
  
  /** Organization/team name */
  organization: z.string().optional(),
  
  /** Categories/domains */
  categories: z.array(CategorySchema).optional(),
  
  /** ADRs */
  adrs: z.array(ADRSchema),
  
  /** Milestones */
  milestones: z.array(MilestoneSchema).optional(),
  
  /** Step-by-step walkthrough */
  steps: z.array(ADRTimelineStepSchema),
});

export type ADRTimelineStory = z.infer<typeof ADRTimelineStorySchema>;

// ============================================
// Status Styling
// ============================================

export const STATUS_STYLES: Record<ADRStatus, { color: string; icon: string; label: string }> = {
  draft: { color: '#9E9E9E', icon: '◯', label: 'Draft' },
  proposed: { color: '#2196F3', icon: '○', label: 'Proposed' },
  decided: { color: '#4CAF50', icon: '✓', label: 'Decided' },
  deprecated: { color: '#FF9800', icon: '⚠', label: 'Deprecated' },
  superseded: { color: '#F44336', icon: '✗', label: 'Superseded' },
  rejected: { color: '#F44336', icon: '✗', label: 'Rejected' },
};

// ============================================
// Layout Constants
// ============================================

export const ADR_TIMELINE_LAYOUT = {
  /** Width of ADR card */
  cardWidth: 220,
  /** Height of ADR card (collapsed) */
  cardHeight: 100,
  /** Height of ADR card (expanded) */
  cardHeightExpanded: 200,
  /** Timeline height */
  timelineHeight: 60,
  /** Gap between cards */
  cardGap: 30,
  /** Swimlane height per category */
  laneHeight: 150,
  /** Animation duration (ms) */
  animationDuration: 400,
};

// ============================================
// Default Categories
// ============================================

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'architecture', name: 'Architecture', color: '#2196F3' },
  { id: 'data', name: 'Data', color: '#4CAF50' },
  { id: 'security', name: 'Security', color: '#F44336' },
  { id: 'infrastructure', name: 'Infrastructure', color: '#9C27B0' },
  { id: 'process', name: 'Process', color: '#FF9800' },
];

// ============================================
// Validation Helpers
// ============================================

export function validateADRTimelineStory(data: unknown): ADRTimelineStory {
  return ADRTimelineStorySchema.parse(data);
}

export function isADRTimelineStory(data: unknown): data is ADRTimelineStory {
  return ADRTimelineStorySchema.safeParse(data).success;
}

/** Get ADRs by category */
export function getADRsByCategory(story: ADRTimelineStory, categoryId: string): ADR[] {
  return story.adrs.filter(adr => adr.category === categoryId);
}

/** Get ADRs by status */
export function getADRsByStatus(story: ADRTimelineStory, status: ADRStatus): ADR[] {
  return story.adrs.filter(adr => adr.status === status);
}

/** Get ADRs in date range */
export function getADRsInRange(story: ADRTimelineStory, start: string, end: string): ADR[] {
  return story.adrs.filter(adr => adr.date >= start && adr.date <= end);
}

/** Get related ADRs */
export function getRelatedADRs(story: ADRTimelineStory, adrId: string): ADR[] {
  const adr = story.adrs.find(a => a.id === adrId);
  if (!adr) return [];
  
  const related = new Set<string>();
  
  // Add supersedes/supersededBy
  if (adr.supersedes) related.add(adr.supersedes);
  if (adr.supersededBy) related.add(adr.supersededBy);
  
  // Add relatedTo
  adr.relatedTo?.forEach(id => related.add(id));
  
  // Find ADRs that reference this one
  story.adrs.forEach(other => {
    if (other.relatedTo?.includes(adrId)) related.add(other.id);
    if (other.supersedes === adrId) related.add(other.id);
    if (other.supersededBy === adrId) related.add(other.id);
  });
  
  related.delete(adrId);
  return story.adrs.filter(a => related.has(a.id));
}

/** Sort ADRs by date */
export function sortADRsByDate(adrs: ADR[]): ADR[] {
  return [...adrs].sort((a, b) => a.date.localeCompare(b.date));
}
