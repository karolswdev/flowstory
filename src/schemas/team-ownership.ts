/**
 * Team Ownership Schema
 * 
 * Visualizes organizational ownership of software components:
 * - Team boundaries with member counts
 * - Services grouped by owning team
 * - Cross-team handoffs and dependencies
 * - Ownership gaps (unowned components)
 * 
 * Based on: docs/planning/0001-TEAM-OWNERSHIP-PLANNING-ANIMATIONS.md
 */

import { z } from 'zod';

// ============================================
// Service Types
// ============================================

export const ServiceType = z.enum([
  'api',           // REST/GraphQL API
  'worker',        // Background processor
  'webapp',        // Frontend application
  'mobile',        // Mobile app
  'monolith',      // Legacy monolith
  'database',      // Database
  'queue',         // Message queue
  'cache',         // Cache layer
  'gateway',       // API Gateway
  'library',       // Shared library
  'infrastructure',// Infra component
  'external',      // External service
]);

export type ServiceType = z.infer<typeof ServiceType>;

export const Criticality = z.enum(['low', 'medium', 'high', 'critical']);
export type Criticality = z.infer<typeof Criticality>;

// ============================================
// Team Definition
// ============================================

export const TeamSchema = z.object({
  id: z.string(),
  name: z.string(),
  /** Team color for visual grouping */
  color: z.string().default('#2196F3'),
  /** Team icon/emoji */
  icon: z.string().default('👥'),
  /** Team lead name */
  lead: z.string().optional(),
  /** Number of engineers */
  headcount: z.number().optional(),
  /** Slack channel or contact */
  slack: z.string().optional(),
  /** Team description/mission */
  description: z.string().optional(),
  /** Services owned by this team (by ID) */
  services: z.array(z.string()).optional(),
  /** Position hint for layout */
  position: z.object({
    x: z.number(),
    y: z.number(),
  }).optional(),
});

export type Team = z.infer<typeof TeamSchema>;

// ============================================
// Service Definition
// ============================================

export const ServiceSchema = z.object({
  id: z.string(),
  name: z.string(),
  /** Owning team ID (null = ownership gap!) */
  team: z.string().nullable(),
  type: ServiceType,
  /** Business criticality */
  criticality: Criticality.default('medium'),
  /** Service description */
  description: z.string().optional(),
  /** Tech stack tags */
  tech: z.array(z.string()).optional(),
  /** Repository URL */
  repo: z.string().optional(),
  /** Documentation URL */
  docs: z.string().optional(),
  /** Is this a shared/contested service? */
  shared: z.boolean().default(false),
  /** Teams that contribute (for shared services) */
  contributors: z.array(z.string()).optional(),
});

export type Service = z.infer<typeof ServiceSchema>;

// ============================================
// Handoff Definition
// ============================================

export const HandoffSchema = z.object({
  id: z.string().optional(),
  /** Source team ID */
  from: z.string(),
  /** Target team ID */
  to: z.string(),
  /** Via which services (source -> target) */
  via: z.string().optional(),
  /** Interaction frequency */
  frequency: z.string().optional(),
  /** Handoff description */
  description: z.string().optional(),
  /** Is this a pain point? */
  friction: z.boolean().default(false),
});

export type Handoff = z.infer<typeof HandoffSchema>;

// ============================================
// Dependency (Service-to-Service)
// ============================================

export const DependencySchema = z.object({
  id: z.string().optional(),
  source: z.string(),
  target: z.string(),
  type: z.enum(['sync', 'async', 'data', 'shared-lib']).default('sync'),
  label: z.string().optional(),
  /** Is this a critical path? */
  critical: z.boolean().default(false),
});

export type Dependency = z.infer<typeof DependencySchema>;

// ============================================
// Step Definition
// ============================================

export const TeamOwnershipStepSchema = z.object({
  order: z.number().optional(),
  title: z.string(),
  description: z.string(),
  /** Team to focus/highlight */
  focusTeam: z.string().optional(),
  /** Teams to highlight (multiple) */
  focusTeams: z.array(z.string()).optional(),
  /** Services to highlight */
  focusServices: z.array(z.string()).optional(),
  /** Show services within focused team */
  showServices: z.boolean().default(true),
  /** Highlight handoffs between teams */
  showHandoffs: z.array(z.string()).optional(),
  /** Highlight dependencies */
  showDependencies: z.array(z.string()).optional(),
  /** Highlight ownership gaps */
  showGaps: z.boolean().default(false),
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

export type TeamOwnershipStep = z.infer<typeof TeamOwnershipStepSchema>;

// ============================================
// Full Story Schema
// ============================================

export const TeamOwnershipStorySchema = z.object({
  title: z.string(),
  version: z.number().default(2),
  type: z.literal('team-ownership'),
  
  /** Organization/company name */
  organization: z.string().optional(),
  
  /** All teams */
  teams: z.array(TeamSchema),
  
  /** All services */
  services: z.array(ServiceSchema),
  
  /** Cross-team handoffs */
  handoffs: z.array(HandoffSchema).optional(),
  
  /** Service dependencies */
  dependencies: z.array(DependencySchema).optional(),
  
  /** Step-by-step walkthrough */
  steps: z.array(TeamOwnershipStepSchema),
});

export type TeamOwnershipStory = z.infer<typeof TeamOwnershipStorySchema>;

// ============================================
// Visual Constants
// ============================================

export const SERVICE_TYPE_ICONS: Record<ServiceType, string> = {
  'api': '🔌',
  'worker': '⚙️',
  'webapp': '🌐',
  'mobile': '📱',
  'monolith': '🏛️',
  'database': '🗃️',
  'queue': '📬',
  'cache': '⚡',
  'gateway': '🚪',
  'library': '📚',
  'infrastructure': '🏗️',
  'external': '🔗',
};

export const SERVICE_TYPE_COLORS: Record<ServiceType, string> = {
  'api': '#4CAF50',
  'worker': '#FF9800',
  'webapp': '#2196F3',
  'mobile': '#9C27B0',
  'monolith': '#795548',
  'database': '#3F51B5',
  'queue': '#00BCD4',
  'cache': '#F44336',
  'gateway': '#009688',
  'library': '#607D8B',
  'infrastructure': '#455A64',
  'external': '#9E9E9E',
};

export const CRITICALITY_COLORS: Record<Criticality, string> = {
  'low': '#8BC34A',
  'medium': '#FFC107',
  'high': '#FF9800',
  'critical': '#F44336',
};

// ============================================
// Layout Constants
// ============================================

export const TEAM_OWNERSHIP_LAYOUT = {
  /** Minimum team container width */
  minTeamWidth: 200,
  /** Minimum team container height */
  minTeamHeight: 150,
  /** Padding inside team container */
  teamPadding: 20,
  /** Header height (name, badge) */
  headerHeight: 40,
  /** Service node size */
  serviceSize: 60,
  /** Gap between services */
  serviceGap: 15,
  /** Gap between teams */
  teamGap: 80,
};

// ============================================
// Validation Helpers
// ============================================

export function validateTeamOwnershipStory(data: unknown): TeamOwnershipStory {
  return TeamOwnershipStorySchema.parse(data);
}

export function isTeamOwnershipStory(data: unknown): data is TeamOwnershipStory {
  return TeamOwnershipStorySchema.safeParse(data).success;
}

/** Find services with no team (ownership gaps) */
export function findOwnershipGaps(story: TeamOwnershipStory): Service[] {
  return story.services.filter(s => s.team === null);
}

/** Find services owned by a team */
export function getTeamServices(story: TeamOwnershipStory, teamId: string): Service[] {
  return story.services.filter(s => s.team === teamId);
}

/** Find handoffs involving a team */
export function getTeamHandoffs(story: TeamOwnershipStory, teamId: string): Handoff[] {
  return (story.handoffs || []).filter(h => h.from === teamId || h.to === teamId);
}
