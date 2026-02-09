/**
 * BC Deployment Renderer
 * 
 * Visualizes a Bounded Context from a DevOps perspective:
 * - Central BC node with icon and event indicators
 * - Radiating artifacts (helm charts, deployments, configs)
 * - Step-based focus with zoom and description overlay
 */

export { BCDeploymentCanvas } from './BCDeploymentCanvas';
export { BCCoreNode } from './BCCoreNode';
export { ArtifactNode } from './ArtifactNode';

// Re-export schema types
export type { 
  BCDeploymentStory, 
  BCDeploymentNode, 
  BCDeploymentEdge,
  BCDeploymentStep,
  ArtifactType,
} from '../../schemas/bc-deployment';

export { 
  validateBCDeploymentStory,
  isBCDeploymentStory,
  ARTIFACT_ICONS,
  ARTIFACT_COLORS,
  EDGE_STYLES,
  BC_DEPLOYMENT_LAYOUT,
} from '../../schemas/bc-deployment';
