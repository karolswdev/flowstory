/**
 * BC Deployment Layout Engine
 * 
 * Provides three layout modes for visualizing bounded context deployments:
 * - Radial: Artifacts orbit around the central BC (default)
 * - Hierarchical: Tree structure with BC at top
 * - Layered: Horizontal layers by artifact layer property
 */

import type { 
  BCDeploymentStory, 
  ArtifactNode as ArtifactNodeType,
  LayoutMode,
  ChildLayout,
  BC_DEPLOYMENT_LAYOUT 
} from '../../schemas/bc-deployment';

export interface PositionedNode {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  parentId?: string;
  children?: PositionedNode[];
}

interface LayoutConfig {
  mode: LayoutMode;
  centerSize: number;
  ringSpacing: number;
  childLayout: ChildLayout;
}

// Default layout constants
const DEFAULTS = {
  coreSize: 120,
  artifactSize: 80,
  childSize: 50,
  horizontalSpacing: 160,
  verticalSpacing: 120,
  innerRadius: 180,
  outerRadius: 320,
  tertiaryRadius: 460,
  childOrbitRadius: 60,
  childAngleSpread: 120, // degrees
};

/**
 * Calculate radial positions for items around a center point
 */
function calculateRadialPositions(
  count: number,
  radius: number,
  centerX: number = 0,
  centerY: number = 0,
  startAngle: number = -90,
  spread: number = 360
): Array<{ x: number; y: number }> {
  if (count === 0) return [];
  if (count === 1) {
    const angle = startAngle * (Math.PI / 180);
    return [{
      x: centerX + Math.cos(angle) * radius,
      y: centerY + Math.sin(angle) * radius,
    }];
  }

  const positions: Array<{ x: number; y: number }> = [];
  const angleStep = spread / count;

  for (let i = 0; i < count; i++) {
    const angle = (startAngle + i * angleStep) * (Math.PI / 180);
    positions.push({
      x: centerX + Math.cos(angle) * radius,
      y: centerY + Math.sin(angle) * radius,
    });
  }

  return positions;
}

/**
 * Group artifacts by their layer property
 */
function groupByLayer(artifacts: ArtifactNodeType[]): Map<number, ArtifactNodeType[]> {
  const groups = new Map<number, ArtifactNodeType[]>();
  
  for (const artifact of artifacts) {
    const layer = artifact.layer || 1;
    if (!groups.has(layer)) {
      groups.set(layer, []);
    }
    groups.get(layer)!.push(artifact);
  }

  return groups;
}

/**
 * Radial Layout
 * 
 * Positions artifacts in concentric rings around the BC core:
 * - Layer 1 artifacts on inner ring
 * - Layer 2 artifacts on outer ring
 * - Layer 3+ artifacts on tertiary ring
 * - Children positioned in small orbit around parent
 */
export function calculateRadialLayout(
  story: BCDeploymentStory,
  config: Partial<LayoutConfig> = {}
): Map<string, PositionedNode> {
  const positions = new Map<string, PositionedNode>();
  const centerSize = config.centerSize || DEFAULTS.coreSize;
  const ringSpacing = config.ringSpacing || 140;
  const childLayout = config.childLayout || 'nested';

  // BC Core at center
  positions.set(story.bc.id, {
    id: story.bc.id,
    x: -centerSize / 2,
    y: -centerSize / 2,
    width: centerSize,
    height: centerSize,
  });

  // Group artifacts by layer
  const layerGroups = groupByLayer(story.artifacts);
  const layers = Array.from(layerGroups.keys()).sort((a, b) => a - b);

  // Position each layer
  for (const layer of layers) {
    const artifacts = layerGroups.get(layer)!;
    const radius = DEFAULTS.innerRadius + (layer - 1) * ringSpacing;
    const radialPositions = calculateRadialPositions(artifacts.length, radius);

    artifacts.forEach((artifact, index) => {
      const pos = radialPositions[index];
      const width = DEFAULTS.artifactSize;
      const height = DEFAULTS.artifactSize;

      const positionedNode: PositionedNode = {
        id: artifact.id,
        x: pos.x - width / 2,
        y: pos.y - height / 2,
        width,
        height,
      };

      // Handle children based on childLayout mode
      if (artifact.children && artifact.children.length > 0) {
        if (childLayout === 'expanded' || childLayout === 'nested') {
          // Children orbit around parent
          const childPositions = calculateRadialPositions(
            artifact.children.length,
            DEFAULTS.childOrbitRadius,
            pos.x,
            pos.y,
            -90 - DEFAULTS.childAngleSpread / 2,
            DEFAULTS.childAngleSpread
          );

          positionedNode.children = artifact.children.map((child, childIndex) => ({
            id: child.id,
            x: childPositions[childIndex].x - DEFAULTS.childSize / 2,
            y: childPositions[childIndex].y - DEFAULTS.childSize / 2,
            width: DEFAULTS.childSize,
            height: DEFAULTS.childSize,
            parentId: artifact.id,
          }));
        }
      }

      positions.set(artifact.id, positionedNode);
    });
  }

  return positions;
}

/**
 * Hierarchical Layout
 * 
 * Positions artifacts in a tree structure:
 * - BC at the top
 * - Layer 1 artifacts as first row
 * - Layer 2+ as subsequent rows
 * - Children indented under parents
 */
export function calculateHierarchicalLayout(
  story: BCDeploymentStory,
  config: Partial<LayoutConfig> = {}
): Map<string, PositionedNode> {
  const positions = new Map<string, PositionedNode>();
  const centerSize = config.centerSize || DEFAULTS.coreSize;
  const childLayout = config.childLayout || 'nested';

  // BC Core at top center
  positions.set(story.bc.id, {
    id: story.bc.id,
    x: -centerSize / 2,
    y: 0,
    width: centerSize,
    height: centerSize,
  });

  // Group artifacts by layer
  const layerGroups = groupByLayer(story.artifacts);
  const layers = Array.from(layerGroups.keys()).sort((a, b) => a - b);

  let currentY = centerSize + DEFAULTS.verticalSpacing;

  for (const layer of layers) {
    const artifacts = layerGroups.get(layer)!;
    const totalWidth = artifacts.length * DEFAULTS.artifactSize + 
                       (artifacts.length - 1) * DEFAULTS.horizontalSpacing;
    let startX = -totalWidth / 2;

    artifacts.forEach((artifact, index) => {
      const x = startX + index * (DEFAULTS.artifactSize + DEFAULTS.horizontalSpacing);
      const positionedNode: PositionedNode = {
        id: artifact.id,
        x,
        y: currentY,
        width: DEFAULTS.artifactSize,
        height: DEFAULTS.artifactSize,
      };

      // Handle children
      if (artifact.children && artifact.children.length > 0 && 
          (childLayout === 'expanded' || childLayout === 'nested')) {
        const childY = currentY + DEFAULTS.artifactSize + 40;
        const childWidth = artifact.children.length * DEFAULTS.childSize +
                          (artifact.children.length - 1) * 20;
        const childStartX = x + (DEFAULTS.artifactSize - childWidth) / 2;

        positionedNode.children = artifact.children.map((child, childIndex) => ({
          id: child.id,
          x: childStartX + childIndex * (DEFAULTS.childSize + 20),
          y: childY,
          width: DEFAULTS.childSize,
          height: DEFAULTS.childSize,
          parentId: artifact.id,
        }));
      }

      positions.set(artifact.id, positionedNode);
    });

    // Check if any artifacts in this layer have children
    const hasChildren = artifacts.some(a => a.children && a.children.length > 0);
    const childRowHeight = hasChildren ? DEFAULTS.childSize + 40 : 0;
    
    currentY += DEFAULTS.artifactSize + DEFAULTS.verticalSpacing + childRowHeight;
  }

  return positions;
}

/**
 * Layered Layout
 * 
 * Positions artifacts in horizontal layers (left to right):
 * - BC on the left
 * - Layer 1 in first column
 * - Layer 2 in second column
 * - Children stacked vertically under parents
 */
export function calculateLayeredLayout(
  story: BCDeploymentStory,
  config: Partial<LayoutConfig> = {}
): Map<string, PositionedNode> {
  const positions = new Map<string, PositionedNode>();
  const centerSize = config.centerSize || DEFAULTS.coreSize;
  const childLayout = config.childLayout || 'nested';

  // Group artifacts by layer
  const layerGroups = groupByLayer(story.artifacts);
  const layers = Array.from(layerGroups.keys()).sort((a, b) => a - b);

  // Calculate max items per layer for vertical centering
  const maxItemsPerLayer = Math.max(
    ...layers.map(l => layerGroups.get(l)!.length)
  );
  const totalHeight = maxItemsPerLayer * DEFAULTS.artifactSize + 
                     (maxItemsPerLayer - 1) * (DEFAULTS.verticalSpacing / 2);

  // BC on the left, vertically centered
  positions.set(story.bc.id, {
    id: story.bc.id,
    x: 0,
    y: -centerSize / 2,
    width: centerSize,
    height: centerSize,
  });

  let currentX = centerSize + DEFAULTS.horizontalSpacing;

  for (const layer of layers) {
    const artifacts = layerGroups.get(layer)!;
    const layerHeight = artifacts.length * DEFAULTS.artifactSize + 
                       (artifacts.length - 1) * (DEFAULTS.verticalSpacing / 2);
    let startY = -layerHeight / 2;

    let maxChildWidth = 0;

    artifacts.forEach((artifact, index) => {
      const y = startY + index * (DEFAULTS.artifactSize + DEFAULTS.verticalSpacing / 2);
      const positionedNode: PositionedNode = {
        id: artifact.id,
        x: currentX,
        y,
        width: DEFAULTS.artifactSize,
        height: DEFAULTS.artifactSize,
      };

      // Handle children (stacked to the right of parent)
      if (artifact.children && artifact.children.length > 0 && 
          (childLayout === 'expanded' || childLayout === 'nested')) {
        const childX = currentX + DEFAULTS.artifactSize + 30;
        const childHeight = artifact.children.length * DEFAULTS.childSize +
                           (artifact.children.length - 1) * 10;
        const childStartY = y + (DEFAULTS.artifactSize - childHeight) / 2;

        positionedNode.children = artifact.children.map((child, childIndex) => ({
          id: child.id,
          x: childX,
          y: childStartY + childIndex * (DEFAULTS.childSize + 10),
          width: DEFAULTS.childSize,
          height: DEFAULTS.childSize,
          parentId: artifact.id,
        }));

        maxChildWidth = Math.max(maxChildWidth, DEFAULTS.childSize + 30);
      }

      positions.set(artifact.id, positionedNode);
    });

    currentX += DEFAULTS.artifactSize + DEFAULTS.horizontalSpacing + maxChildWidth;
  }

  return positions;
}

/**
 * Main layout function - dispatches to appropriate layout algorithm
 */
export function calculateBCDeploymentLayout(
  story: BCDeploymentStory,
  config?: Partial<LayoutConfig>
): Map<string, PositionedNode> {
  const mode = config?.mode || story.layout?.mode || 'radial';
  const layoutConfig: Partial<LayoutConfig> = {
    centerSize: config?.centerSize || story.layout?.centerSize || DEFAULTS.coreSize,
    ringSpacing: config?.ringSpacing || story.layout?.ringSpacing || 140,
    childLayout: config?.childLayout || story.layout?.childLayout || 'nested',
    mode,
  };

  switch (mode) {
    case 'hierarchical':
      return calculateHierarchicalLayout(story, layoutConfig);
    case 'layered':
      return calculateLayeredLayout(story, layoutConfig);
    case 'radial':
    default:
      return calculateRadialLayout(story, layoutConfig);
  }
}

/**
 * Get flat list of all nodes including children
 */
export function flattenPositions(
  positions: Map<string, PositionedNode>
): PositionedNode[] {
  const result: PositionedNode[] = [];
  
  for (const node of positions.values()) {
    result.push(node);
    if (node.children) {
      result.push(...node.children);
    }
  }
  
  return result;
}

/**
 * Calculate bounds of all positioned nodes
 */
export function calculateBounds(positions: Map<string, PositionedNode>): {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
} {
  const flat = flattenPositions(positions);
  
  if (flat.length === 0) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0 };
  }

  const minX = Math.min(...flat.map(n => n.x));
  const minY = Math.min(...flat.map(n => n.y));
  const maxX = Math.max(...flat.map(n => n.x + n.width));
  const maxY = Math.max(...flat.map(n => n.y + n.height));

  return {
    minX,
    minY,
    maxX,
    maxY,
    width: maxX - minX,
    height: maxY - minY,
  };
}
