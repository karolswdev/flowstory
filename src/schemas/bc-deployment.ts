/**
 * BC Deployment Schema v2
 * 
 * Visualizes a Bounded Context from a DevOps perspective:
 * - Central BC node with icon, events, and metrics
 * - Radiating artifacts with child node support
 * - Configurable layout (radial, hierarchical, layered)
 * - Step-based focus with zoom, expansion, and narration
 * 
 * Based on: docs/bc-deployment-spec.md
 */

import { z } from 'zod';

// ============================================
// Layout & Theme Configuration
// ============================================

export const LayoutMode = z.enum(['radial', 'hierarchical', 'layered']);
export type LayoutMode = z.infer<typeof LayoutMode>;

export const ChildLayout = z.enum(['nested', 'expanded', 'clustered']);
export type ChildLayout = z.infer<typeof ChildLayout>;

export const ThemePalette = z.enum(['default', 'kubernetes', 'azure', 'aws']);
export type ThemePalette = z.infer<typeof ThemePalette>;

export const LayoutConfigSchema = z.object({
  mode: LayoutMode.default('radial'),
  centerSize: z.number().default(120),
  ringSpacing: z.number().default(140),
  childLayout: ChildLayout.default('nested'),
}).optional();

export const ThemeConfigSchema = z.object({
  palette: ThemePalette.default('default'),
  darkMode: z.enum(['auto', 'light', 'dark']).default('auto'),
}).optional();

// ============================================
// Artifact Types (22 total)
// ============================================

/** Kubernetes artifacts (14 types) */
export const KubernetesArtifactType = z.enum([
  'helm-chart',      // Helm chart package
  'values-yaml',     // Values override file
  'deployment',      // K8s Deployment
  'statefulset',     // K8s StatefulSet
  'service',         // K8s Service
  'ingress',         // K8s Ingress
  'configmap',       // K8s ConfigMap
  'secret',          // K8s Secret
  'hpa',             // HorizontalPodAutoscaler
  'pdb',             // PodDisruptionBudget
  'serviceaccount',  // ServiceAccount
  'cronjob',         // CronJob
  'job',             // Job
  'pvc',             // PersistentVolumeClaim
]);

/** Infrastructure artifacts (4 types) */
export const InfrastructureArtifactType = z.enum([
  'dockerfile',      // Container definition
  'terraform',       // IaC module
  'database',        // Database resource
  'cache',           // Cache layer (Redis, etc.)
]);

/** Integration artifacts (4 types) */
export const IntegrationArtifactType = z.enum([
  'queue',           // Message queue
  'external',        // External dependency
  'pipeline',        // CI/CD pipeline
  'monitoring',      // Observability config
]);

/** All artifact types combined */
export const ArtifactType = z.enum([
  // Kubernetes
  'helm-chart', 'values-yaml', 'deployment', 'statefulset', 'service',
  'ingress', 'configmap', 'secret', 'hpa', 'pdb', 'serviceaccount',
  'cronjob', 'job', 'pvc',
  // Infrastructure
  'dockerfile', 'terraform', 'database', 'cache',
  // Integration
  'queue', 'external', 'pipeline', 'monitoring',
]);

export type ArtifactType = z.infer<typeof ArtifactType>;

// ============================================
// Node Types
// ============================================

/** Events configuration for BC */
export const BCEventsSchema = z.object({
  publishes: z.array(z.string()).optional(),
  subscribes: z.array(z.string()).optional(),
});

/** Optional operational metrics */
export const BCMetricsSchema = z.object({
  replicas: z.number().optional(),
  cpu: z.string().optional(),
  memory: z.string().optional(),
});

/** Bounded Context - the central hub */
export const BCCoreNodeSchema = z.object({
  id: z.string(),
  type: z.literal('bc-core').default('bc-core'),
  name: z.string(),
  icon: z.string().default('📦'),
  description: z.string().optional(),
  color: z.string().optional(),
  /** Domain events (new structured format) */
  events: BCEventsSchema.optional(),
  /** Legacy flat format (backwards compat) */
  publishes: z.array(z.string()).optional(),
  subscribes: z.array(z.string()).optional(),
  /** Operational metrics */
  metrics: BCMetricsSchema.optional(),
});

export type BCCoreNode = z.infer<typeof BCCoreNodeSchema>;

/** Annotations for custom key-value display */
export const AnnotationsSchema = z.record(z.string(), z.string());

/** Child artifact (nested within parent) */
export const ChildArtifactSchema = z.object({
  id: z.string(),
  type: ArtifactType,
  name: z.string(),
  description: z.string().optional(),
  annotations: AnnotationsSchema.optional(),
});

export type ChildArtifact = z.infer<typeof ChildArtifactSchema>;

/** Artifact node - deployment resource */
export const ArtifactNodeSchema = z.object({
  id: z.string(),
  type: z.literal('artifact').default('artifact'),
  artifactType: ArtifactType,
  name: z.string(),
  /** File path in repository */
  path: z.string().optional(),
  description: z.string().optional(),
  /** Ring layer (1 = closest to BC) */
  layer: z.number().default(1),
  /** Nested child artifacts */
  children: z.array(ChildArtifactSchema).optional(),
  /** Custom key-value annotations */
  annotations: AnnotationsSchema.optional(),
  /** Legacy highlights format (backwards compat) */
  highlights: z.array(z.object({
    key: z.string(),
    value: z.string(),
  })).optional(),
});

export type ArtifactNode = z.infer<typeof ArtifactNodeSchema>;

/** Union of all node types */
export const BCDeploymentNodeSchema = z.union([
  BCCoreNodeSchema,
  ArtifactNodeSchema,
]);

export type BCDeploymentNode = z.infer<typeof BCDeploymentNodeSchema>;

// ============================================
// Edge Types
// ============================================

export const BCDeploymentEdgeType = z.enum([
  'contains',     // BC/chart contains this artifact
  'configures',   // Artifact configures another
  'overrides',    // values.yaml overrides base chart
  'mounts',       // Mounts secret/configmap
  'depends',      // Depends on external resource
  'exposes',      // Service exposes deployment
  'scales',       // HPA scales deployment
  'triggers',     // Event triggers action
]);

export type BCDeploymentEdgeType = z.infer<typeof BCDeploymentEdgeType>;

export const BCDeploymentEdgeSchema = z.object({
  id: z.string().optional(), // Auto-generated if not provided
  source: z.string(),
  target: z.string(),
  type: BCDeploymentEdgeType.default('contains'),
  label: z.string().optional(),
  animated: z.boolean().default(false),
});

export type BCDeploymentEdge = z.infer<typeof BCDeploymentEdgeSchema>;

// ============================================
// Narration (Optional)
// ============================================

export const StepNarrationSchema = z.object({
  speaker: z.string().optional(),
  message: z.string(),
  position: z.enum(['left', 'right', 'center']).default('right'),
});

// ============================================
// Step Definition
// ============================================

export const BCDeploymentStepSchema = z.object({
  order: z.number().optional(), // Auto-assigned if not provided
  title: z.string(),
  description: z.string(),
  /** Nodes to highlight/focus */
  focusNodes: z.array(z.string()),
  /** Edges to show as active */
  activeEdges: z.array(z.string()).optional(),
  /** Zoom level (1 = normal, 1.5 = zoom in, 0.8 = zoom out) */
  zoomLevel: z.number().default(1),
  /** Duration in ms for auto-advance */
  duration: z.number().default(5000),
  /** Nodes to auto-expand (show children) */
  expandNodes: z.array(z.string()).optional(),
  /** File paths to highlight in annotations */
  highlightPaths: z.array(z.string()).optional(),
  /** Optional narration for this step */
  narration: StepNarrationSchema.optional(),
});

export type BCDeploymentStep = z.infer<typeof BCDeploymentStepSchema>;

// ============================================
// Full Story Schema
// ============================================

export const BCDeploymentStorySchema = z.object({
  title: z.string(),
  version: z.number().default(2),
  type: z.literal('bc-deployment'),
  
  /** Layout configuration */
  layout: LayoutConfigSchema,
  
  /** Theme configuration */
  theme: ThemeConfigSchema,
  
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
// Artifact Icons (22 types)
// ============================================

export const ARTIFACT_ICONS: Record<ArtifactType, string> = {
  // Kubernetes
  'helm-chart': '📦',
  'values-yaml': '⚙️',
  'deployment': '🚀',
  'statefulset': '🗄️',
  'service': '🔌',
  'ingress': '🌐',
  'configmap': '📋',
  'secret': '🔐',
  'hpa': '📈',
  'pdb': '🛡️',
  'serviceaccount': '👤',
  'cronjob': '⏰',
  'job': '▶️',
  'pvc': '💾',
  // Infrastructure
  'dockerfile': '🐳',
  'terraform': '🏗️',
  'database': '🗃️',
  'cache': '⚡',
  // Integration
  'queue': '📬',
  'external': '🔗',
  'pipeline': '🔄',
  'monitoring': '📊',
};

// ============================================
// Artifact Colors (22 types)
// ============================================

export const ARTIFACT_COLORS: Record<ArtifactType, string> = {
  // Kubernetes
  'helm-chart': '#0F1689',     // Helm blue
  'values-yaml': '#326CE5',    // K8s blue
  'deployment': '#4CAF50',     // Green
  'statefulset': '#2E7D32',    // Dark green
  'service': '#2196F3',        // Blue
  'ingress': '#00BCD4',        // Cyan
  'configmap': '#FF9800',      // Orange
  'secret': '#9C27B0',         // Purple
  'hpa': '#8BC34A',            // Light green
  'pdb': '#795548',            // Brown
  'serviceaccount': '#607D8B', // Blue grey
  'cronjob': '#FFC107',        // Amber
  'job': '#CDDC39',            // Lime
  'pvc': '#3F51B5',            // Indigo
  // Infrastructure
  'dockerfile': '#2496ED',     // Docker blue
  'terraform': '#7B42BC',      // Terraform purple
  'database': '#336791',       // PostgreSQL blue
  'cache': '#DC382D',          // Redis red
  // Integration
  'queue': '#FF6600',          // RabbitMQ orange
  'external': '#9E9E9E',       // Grey
  'pipeline': '#2088FF',       // GitHub Actions blue
  'monitoring': '#E6522C',     // Grafana orange
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
  'triggers': { stroke: '#E91E63', dash: '4,2' },
};

// ============================================
// Layout Constants
// ============================================

export const BC_DEPLOYMENT_LAYOUT = {
  /** Radius of first artifact ring from center */
  innerRadius: 180,
  /** Radius of second artifact ring */
  outerRadius: 320,
  /** Radius of third artifact ring */
  tertiaryRadius: 460,
  /** Size of BC core node */
  coreSize: 120,
  /** Size of artifact nodes */
  artifactSize: 80,
  /** Size of child artifact nodes */
  childSize: 60,
  /** Animation stagger delay (ms) */
  staggerDelay: 100,
  /** Zoom transition duration (ms) */
  zoomDuration: 600,
  /** Child expand animation duration (ms) */
  expandDuration: 400,
};

// ============================================
// Validation Helpers
// ============================================

export function validateBCDeploymentStory(data: unknown): BCDeploymentStory {
  return BCDeploymentStorySchema.parse(data);
}

export function isBCDeploymentStory(data: unknown): data is BCDeploymentStory {
  return BCDeploymentStorySchema.safeParse(data).success;
}

/** Get artifact category */
export function getArtifactCategory(type: ArtifactType): 'kubernetes' | 'infrastructure' | 'integration' {
  if (KubernetesArtifactType.safeParse(type).success) return 'kubernetes';
  if (InfrastructureArtifactType.safeParse(type).success) return 'infrastructure';
  return 'integration';
}

/** Generate edge ID from source/target */
export function generateEdgeId(source: string, target: string): string {
  return `${source}->${target}`;
}
