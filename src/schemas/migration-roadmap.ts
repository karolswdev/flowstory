/**
 * Migration Roadmap Schema
 * 
 * Visualizes phased migrations from legacy to modern:
 * - Phases with timeline
 * - Workstreams and tasks
 * - Status tracking (planned, active, done, blocked)
 * - Dependencies between phases/tasks
 * 
 * Based on: docs/planning/0008-MIGRATION-ROADMAP-PLANNING-ANIMATIONS.md
 */

import { z } from 'zod';

// ============================================
// Status
// ============================================

export const MigrationStatus = z.enum([
  'planned',   // Not started
  'active',    // In progress
  'done',      // Complete
  'blocked',   // Blocked
  'at-risk',   // At risk
  'cancelled', // Cancelled
]);

export type MigrationStatus = z.infer<typeof MigrationStatus>;

// ============================================
// Risk Level
// ============================================

export const RiskLevel = z.enum(['low', 'medium', 'high', 'critical']);
export type RiskLevel = z.infer<typeof RiskLevel>;

// ============================================
// Task
// ============================================

export const TaskSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  status: MigrationStatus.default('planned'),
  /** Completion percentage (0-100) */
  progress: z.number().min(0).max(100).default(0),
  /** Owner */
  owner: z.string().optional(),
  /** Dependencies */
  dependsOn: z.array(z.string()).optional(),
  /** Risk level */
  risk: RiskLevel.optional(),
  /** Notes or blockers */
  notes: z.string().optional(),
});

export type Task = z.infer<typeof TaskSchema>;

// ============================================
// Workstream
// ============================================

export const WorkstreamSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  /** Which phase does this belong to */
  phase: z.string(),
  /** Tasks in this workstream */
  tasks: z.array(TaskSchema),
  /** Overall status (derived or explicit) */
  status: MigrationStatus.optional(),
  /** Owner */
  owner: z.string().optional(),
});

export type Workstream = z.infer<typeof WorkstreamSchema>;

// ============================================
// Phase
// ============================================

export const PhaseSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  /** Timeline (e.g., "Q1 2026", "Jan-Mar") */
  timeline: z.string().optional(),
  /** Start date */
  startDate: z.string().optional(),
  /** End date */
  endDate: z.string().optional(),
  /** Phase status */
  status: MigrationStatus.default('planned'),
  /** Key milestones */
  milestones: z.array(z.object({
    name: z.string(),
    date: z.string().optional(),
    done: z.boolean().default(false),
  })).optional(),
  /** Gate criteria to exit phase */
  exitCriteria: z.array(z.string()).optional(),
});

export type Phase = z.infer<typeof PhaseSchema>;

// ============================================
// Step Definition
// ============================================

export const MigrationRoadmapStepSchema = z.object({
  order: z.number().optional(),
  title: z.string(),
  description: z.string(),
  /** Focus on phase */
  focusPhase: z.string().optional(),
  /** Highlight workstreams */
  highlightWorkstreams: z.array(z.string()).optional(),
  /** Show only specific statuses */
  filterStatus: MigrationStatus.optional(),
  /** Show critical path */
  showCriticalPath: z.boolean().default(false),
  /** Show blockers */
  showBlockers: z.boolean().default(false),
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

export type MigrationRoadmapStep = z.infer<typeof MigrationRoadmapStepSchema>;

// ============================================
// Full Story Schema
// ============================================

export const MigrationRoadmapStorySchema = z.object({
  title: z.string(),
  version: z.number().default(2),
  type: z.literal('migration-roadmap'),
  
  /** Migration name */
  migration: z.string().optional(),
  
  /** Overall progress */
  overallProgress: z.number().optional(),
  
  /** Phases */
  phases: z.array(PhaseSchema),
  
  /** Workstreams */
  workstreams: z.array(WorkstreamSchema),
  
  /** Steps */
  steps: z.array(MigrationRoadmapStepSchema),
});

export type MigrationRoadmapStory = z.infer<typeof MigrationRoadmapStorySchema>;

// ============================================
// Visual Constants
// ============================================

export const STATUS_COLORS: Record<MigrationStatus, string> = {
  planned: '#9E9E9E',
  active: '#FFC107',
  done: '#4CAF50',
  blocked: '#F44336',
  'at-risk': '#FF9800',
  cancelled: '#757575',
};

export const STATUS_ICONS: Record<MigrationStatus, string> = {
  planned: '⚪',
  active: '🟡',
  done: '🟢',
  blocked: '🔴',
  'at-risk': '🟠',
  cancelled: '⚫',
};

export const RISK_COLORS: Record<RiskLevel, string> = {
  low: '#81C784',
  medium: '#FFD54F',
  high: '#FF8A65',
  critical: '#E57373',
};

// ============================================
// Validation Helpers
// ============================================

export function validateMigrationRoadmapStory(data: unknown): MigrationRoadmapStory {
  return MigrationRoadmapStorySchema.parse(data);
}

export function isMigrationRoadmapStory(data: unknown): data is MigrationRoadmapStory {
  return MigrationRoadmapStorySchema.safeParse(data).success;
}

/** Get workstreams by phase */
export function getWorkstreamsByPhase(story: MigrationRoadmapStory, phaseId: string): Workstream[] {
  return story.workstreams.filter(w => w.phase === phaseId);
}

/** Calculate phase progress from workstreams */
export function calculatePhaseProgress(story: MigrationRoadmapStory, phaseId: string): number {
  const workstreams = getWorkstreamsByPhase(story, phaseId);
  if (workstreams.length === 0) return 0;
  
  const totalTasks = workstreams.reduce((sum, ws) => sum + ws.tasks.length, 0);
  const doneTasks = workstreams.reduce((sum, ws) => 
    sum + ws.tasks.filter(t => t.status === 'done').length, 0);
  
  return totalTasks > 0 ? (doneTasks / totalTasks) * 100 : 0;
}

/** Get all blocked tasks */
export function getBlockedTasks(story: MigrationRoadmapStory): Task[] {
  return story.workstreams.flatMap(ws => 
    ws.tasks.filter(t => t.status === 'blocked')
  );
}
