/**
 * Cloud Cost Map Schema
 * 
 * Visualizes cloud spending by category, resource, and team:
 * - Cost categories (Compute, Storage, Network, etc.)
 * - Individual resources with trends
 * - Budget vs actual tracking
 * 
 * Based on: docs/planning/0007-CLOUD-COST-PLANNING-ANIMATIONS.md
 */

import { z } from 'zod';

// ============================================
// Cost Categories
// ============================================

export const CostCategory = z.enum([
  'compute',     // VMs, Kubernetes, Functions
  'storage',     // Block, Object, Archive
  'database',    // RDS, Cosmos, etc.
  'network',     // Egress, CDN, Load Balancers
  'security',    // WAF, DDoS, Secrets
  'monitoring',  // Logs, Metrics, APM
  'ai-ml',       // AI/ML services
  'other',       // Everything else
]);

export type CostCategory = z.infer<typeof CostCategory>;

// ============================================
// Trend Direction
// ============================================

export const TrendDirection = z.enum(['up', 'down', 'stable']);
export type TrendDirection = z.infer<typeof TrendDirection>;

// ============================================
// Cloud Provider
// ============================================

export const CloudProvider = z.enum(['aws', 'azure', 'gcp', 'other']);
export type CloudProvider = z.infer<typeof CloudProvider>;

// ============================================
// Category Schema
// ============================================

export const CategorySchema = z.object({
  id: z.string(),
  name: z.string(),
  category: CostCategory,
  /** Monthly spend */
  spend: z.number(),
  /** Monthly budget */
  budget: z.number().optional(),
  /** Previous period spend */
  previousSpend: z.number().optional(),
  /** Color override */
  color: z.string().optional(),
});

export type Category = z.infer<typeof CategorySchema>;

// ============================================
// Resource Schema
// ============================================

export const ResourceSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: z.string(),
  provider: CloudProvider.optional(),
  /** Service type (e.g., "EC2", "S3") */
  service: z.string().optional(),
  /** Monthly spend */
  spend: z.number(),
  /** Cost trend */
  trend: TrendDirection.default('stable'),
  /** Trend percentage */
  trendPct: z.number().default(0),
  /** Owner team */
  team: z.string().optional(),
  /** Environment */
  environment: z.enum(['production', 'staging', 'development', 'shared']).optional(),
  /** Notes */
  notes: z.string().optional(),
  /** Is this an optimization opportunity? */
  optimize: z.boolean().default(false),
});

export type Resource = z.infer<typeof ResourceSchema>;

// ============================================
// Team Cost Summary
// ============================================

export const TeamCostSchema = z.object({
  id: z.string(),
  name: z.string(),
  spend: z.number(),
  budget: z.number().optional(),
  resources: z.array(z.string()).optional(),
});

export type TeamCost = z.infer<typeof TeamCostSchema>;

// ============================================
// Step Definition
// ============================================

export const CloudCostStepSchema = z.object({
  order: z.number().optional(),
  title: z.string(),
  description: z.string(),
  /** Focus on category */
  focusCategory: z.string().optional(),
  /** Highlight resources */
  highlightResources: z.array(z.string()).optional(),
  /** Show optimization opportunities */
  showOptimizations: z.boolean().default(false),
  /** Show by team */
  showByTeam: z.boolean().default(false),
  /** Filter by trend */
  filterTrend: TrendDirection.optional(),
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

export type CloudCostStep = z.infer<typeof CloudCostStepSchema>;

// ============================================
// Full Story Schema
// ============================================

export const CloudCostStorySchema = z.object({
  title: z.string(),
  version: z.number().default(2),
  type: z.literal('cloud-cost'),
  
  /** Organization name */
  organization: z.string().optional(),
  
  /** Billing period */
  period: z.string().optional(),
  
  /** Total monthly budget */
  totalBudget: z.number().optional(),
  
  /** Total monthly spend */
  totalSpend: z.number(),
  
  /** Primary cloud provider */
  provider: CloudProvider.optional(),
  
  /** Cost categories */
  categories: z.array(CategorySchema),
  
  /** Individual resources */
  resources: z.array(ResourceSchema),
  
  /** Team cost summaries */
  teams: z.array(TeamCostSchema).optional(),
  
  /** Steps */
  steps: z.array(CloudCostStepSchema),
});

export type CloudCostStory = z.infer<typeof CloudCostStorySchema>;

// ============================================
// Visual Constants
// ============================================

export const CATEGORY_COLORS: Record<CostCategory, string> = {
  compute: '#2196F3',
  storage: '#4CAF50',
  database: '#9C27B0',
  network: '#FF9800',
  security: '#F44336',
  monitoring: '#00BCD4',
  'ai-ml': '#E91E63',
  other: '#9E9E9E',
};

export const TREND_COLORS: Record<TrendDirection, string> = {
  up: '#F44336',
  down: '#4CAF50',
  stable: '#9E9E9E',
};

export const TREND_ICONS: Record<TrendDirection, string> = {
  up: '↑',
  down: '↓',
  stable: '→',
};

export const PROVIDER_ICONS: Record<CloudProvider, string> = {
  aws: '☁️',
  azure: '☁️',
  gcp: '☁️',
  other: '☁️',
};

// ============================================
// Validation Helpers
// ============================================

export function validateCloudCostStory(data: unknown): CloudCostStory {
  return CloudCostStorySchema.parse(data);
}

export function isCloudCostStory(data: unknown): data is CloudCostStory {
  return CloudCostStorySchema.safeParse(data).success;
}

/** Format currency */
export function formatCurrency(amount: number): string {
  if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
  if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
  return `$${amount.toFixed(0)}`;
}

/** Get budget utilization percentage */
export function getBudgetUtilization(spend: number, budget: number): number {
  return (spend / budget) * 100;
}

/** Get resources by category */
export function getResourcesByCategory(story: CloudCostStory, categoryId: string): Resource[] {
  return story.resources.filter(r => r.category === categoryId);
}

/** Get optimization opportunities */
export function getOptimizations(story: CloudCostStory): Resource[] {
  return story.resources.filter(r => r.optimize);
}
