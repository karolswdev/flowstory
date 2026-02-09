/**
 * BC Deployment Schema
 * 
 * Visualizes a Bounded Context from a DevOps perspective:
 * - Central BC node with icon and description
 * - Radiating artifacts (helm charts, deployments, configs)
 * - Step-based focus with zoom and description overlay
 */

import { z } from 'zod';

// ============================================
// Node Types
// ============================================

/** Bounded Context - the central hub */
export const BCCoreNodeSchema = z.object({
  id: z.string(),
  type: z.literal('bc-core'),
  name: z.string(),
  icon: z.string().default('📦'),
  description: z.string().optional(),
  color: z.string().optional(),
  /** Domain events this BC publishes */
  publishes: z.array(z.string()).optional(),
  /** Domain events this BC subscribes to */
  subscribes: z.array(z.string()).optional(),
});

/** Artifact types for K8s/Helm deployments */
export const ArtifactType = z.enum([
  'helm-chart',      // Base Helm chart
  'values-yaml',     // values.yaml overrides
  'deployment',      // K8s Deployment
  'service',         // K8s Service
  'configmap',       // ConfigMap
  'secret',          // Secret
  'ingress',         // Ingress
  'hpa',             // HorizontalPodAutoscaler
  'pdb',             // PodDisruptionBudget
  'serviceaccount',  // ServiceAccount
  'cronjob',         // CronJob
  'job',             // Job
  'pvc',             // PersistentVolumeClaim
  'external',        // External dependency
]);

export type ArtifactType = z.infer<typeof ArtifactType>;

/** Artifact node - K8s/Helm resource */
export const ArtifactNodeSchema = z.object({
  id: z.string(),
  type: z.literal('artifact'),
  artifactType: ArtifactType,
  name: z.string(),
  /** File path or resource name */
  path: z.string().optional(),
  description: z.string().optional(),
  /** Key configuration values to highlight */
  highlights: z.array(z.object({
    key: z.string(),
    value: z.string(),
  })).optional(),
});

/** Union of all node types */
export const BCDeploymentNodeSchema = z.discriminatedUnion('type', [
  BCCoreNodeSchema,
  ArtifactNodeSchema,
]);

export type BCDeploymentNode = z.infer<typeof BCDeploymentNodeSchema>;

// ============================================
// Edge Types
// ============================================

export const BCDeploymentEdgeType = z.enum([
  'contains',     // BC contains this artifact
  'configures',   // Artifact configures another
  'overrides',    // values.yaml overrides base chart
  'mounts',       // Mounts secret/configmap
  'depends',      // Depends on external resource
  'exposes',      // Service exposes deployment
  'scales',       // HPA scales deployment
]);

export type BCDeploymentEdgeType = z.infer<typeof BCDeploymentEdgeType>;

export const BCDeploymentEdgeSchema = z.object({
  id: z.string(),
  source: z.string(),
  target: z.string(),
  type: BCDeploymentEdgeType.default('contains'),
  label: z.string().optional(),
});

export type BCDeploymentEdge = z.infer<typeof BCDeploymentEdgeSchema>;

// ============================================
// Step Definition
// ============================================

export const BCDeploymentStepSchema = z.object({
  order: z.number(),
  title: z.string(),
  description: z.string(),
  /** Nodes to highlight/focus */
  focusNodes: z.array(z.string()),
  /** Edges to show */
  activeEdges: z.array(z.string()).optional(),
  /** Zoom level for this step (1 = normal, 1.5 = zoom in) */
  zoomLevel: z.number().default(1),
  /** Duration in ms for auto-advance */
  duration: z.number().default(5000),
});

export type BCDeploymentStep = z.infer<typeof BCDeploymentStepSchema>;

// ============================================
// Full Story Schema
// ============================================

export const BCDeploymentStorySchema = z.object({
  title: z.string(),
  version: z.literal(2).default(2),
  type: z.literal('bc-deployment'),
  
  /** The central bounded context */
  bc: BCCoreNodeSchema,
  
  /** Artifacts that make up this BC's deployment */
  artifacts: z.array(ArtifactNodeSchema),
  
  /** Connections between BC and artifacts */
  edges: z.array(BCDeploymentEdgeSchema),
  
  /** Step-by-step walkthrough */
  steps: z.array(BCDeploymentStepSchema),
});

export type BCDeploymentStory = z.infer<typeof BCDeploymentStorySchema>;

// ============================================
// Artifact Icons & Colors
// ============================================

export const ARTIFACT_ICONS: Record<ArtifactType, string> = {
  'helm-chart': '⎈',
  'values-yaml': '📝',
  'deployment': '🚀',
  'service': '🔌',
  'configmap': '⚙️',
  'secret': '🔐',
  'ingress': '🚪',
  'hpa': '📈',
  'pdb': '🛡️',
  'serviceaccount': '👤',
  'cronjob': '⏰',
  'job': '📋',
  'pvc': '💾',
  'external': '🌐',
};

export const ARTIFACT_COLORS: Record<ArtifactType, string> = {
  'helm-chart': '#0F1689',     // Helm blue
  'values-yaml': '#326CE5',    // K8s blue
  'deployment': '#4CAF50',     // Green
  'service': '#2196F3',        // Blue
  'configmap': '#FF9800',      // Orange
  'secret': '#9C27B0',         // Purple
  'ingress': '#00BCD4',        // Cyan
  'hpa': '#8BC34A',            // Light green
  'pdb': '#795548',            // Brown
  'serviceaccount': '#607D8B', // Blue grey
  'cronjob': '#FFC107',        // Amber
  'job': '#CDDC39',            // Lime
  'pvc': '#3F51B5',            // Indigo
  'external': '#9E9E9E',       // Grey
};

// ============================================
// Edge Styles
// ============================================

export const EDGE_STYLES: Record<BCDeploymentEdgeType, { stroke: string; dash?: string }> = {
  'contains': { stroke: '#78909C' },
  'configures': { stroke: '#FF9800', dash: '5,5' },
  'overrides': { stroke: '#4CAF50', dash: '8,4' },
  'mounts': { stroke: '#9C27B0', dash: '3,3' },
  'depends': { stroke: '#F44336', dash: '6,3' },
  'exposes': { stroke: '#2196F3' },
  'scales': { stroke: '#8BC34A', dash: '4,4' },
};

// ============================================
// Layout Constants
// ============================================

export const BC_DEPLOYMENT_LAYOUT = {
  /** Radius of first artifact ring from center */
  innerRadius: 180,
  /** Radius of second artifact ring */
  outerRadius: 320,
  /** Size of BC core node */
  coreSize: 120,
  /** Size of artifact nodes */
  artifactSize: 80,
  /** Animation stagger delay (ms) */
  staggerDelay: 100,
  /** Zoom transition duration (ms) */
  zoomDuration: 600,
};

// ============================================
// Validation Helper
// ============================================

export function validateBCDeploymentStory(data: unknown): BCDeploymentStory {
  return BCDeploymentStorySchema.parse(data);
}

export function isBCDeploymentStory(data: unknown): data is BCDeploymentStory {
  return BCDeploymentStorySchema.safeParse(data).success;
}
