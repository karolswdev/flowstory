/**
 * Architectural Layout Engine
 * 
 * Computes predictable, non-overlapping positions for all nodes at story load.
 * Uses Dagre for horizontal ordering within BCs, fixed Y bands for layers.
 * 
 * @module utils/layout/architecturalLayout
 */

import dagre from '@dagrejs/dagre';
import type { 
  UserStory, 
  StoryNode, 
  StoryEdge, 
  BoundedContextDef,
  Layer 
} from '../../types/story';

// ============================================================================
// Configuration
// ============================================================================

export const LAYOUT_CONFIG = {
  // Node dimensions
  nodeWidth: 140,
  nodeHeight: 50,
  
  // Spacing
  minNodeGapX: 60,
  minNodeGapY: 40,
  bcColumnWidth: 320,
  bcMargin: 40,
  bcGap: 60,
  bcPadding: 30,
  
  // Layer Y positions (fixed bands)
  layerY: {
    orchestration: 80,
    domain: 260,
    infrastructure: 440,
  } as Record<Layer, number>,
  
  // Canvas
  canvasPadding: 60,
};

// ============================================================================
// Types
// ============================================================================

export interface Position {
  x: number;
  y: number;
}

export interface BCRegion {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
}

export interface LayoutResult {
  nodePositions: Map<string, Position>;
  bcRegions: BCRegion[];
  canvasBounds: { width: number; height: number };
}

// ============================================================================
// BC Ordering
// ============================================================================

/**
 * Determine BC order based on edge flow (left-to-right)
 */
function determineBCOrder(
  bcs: BoundedContextDef[],
  nodes: StoryNode[],
  edges: StoryEdge[]
): string[] {
  const nodeToBC = new Map<string, string>();
  nodes.forEach(n => {
    if (n.boundedContext) {
      nodeToBC.set(n.id, n.boundedContext);
    }
  });

  // Build dependency graph: which BCs depend on which
  const bcIds = new Set(bcs.map(bc => bc.id));
  const inDegree = new Map<string, number>();
  const outEdges = new Map<string, Set<string>>();
  
  bcIds.forEach(id => {
    inDegree.set(id, 0);
    outEdges.set(id, new Set());
  });

  edges.forEach(e => {
    const sourceBC = nodeToBC.get(e.source);
    const targetBC = nodeToBC.get(e.target);
    
    if (sourceBC && targetBC && sourceBC !== targetBC && 
        bcIds.has(sourceBC) && bcIds.has(targetBC)) {
      if (!outEdges.get(sourceBC)?.has(targetBC)) {
        outEdges.get(sourceBC)?.add(targetBC);
        inDegree.set(targetBC, (inDegree.get(targetBC) ?? 0) + 1);
      }
    }
  });

  // Topological sort (Kahn's algorithm)
  const queue: string[] = [];
  const result: string[] = [];
  
  inDegree.forEach((degree, id) => {
    if (degree === 0) queue.push(id);
  });

  while (queue.length > 0) {
    const current = queue.shift()!;
    result.push(current);
    
    outEdges.get(current)?.forEach(target => {
      const newDegree = (inDegree.get(target) ?? 1) - 1;
      inDegree.set(target, newDegree);
      if (newDegree === 0) queue.push(target);
    });
  }

  // Add any BCs not in the graph (no edges)
  bcs.forEach(bc => {
    if (!result.includes(bc.id)) {
      result.push(bc.id);
    }
  });

  return result;
}

// ============================================================================
// Node Layout Within BC
// ============================================================================

/**
 * Layout nodes within a single BC using Dagre
 */
function layoutNodesInBC(
  bcNodes: StoryNode[],
  bcEdges: StoryEdge[],
  columnIndex: number
): Map<string, Position> {
  if (bcNodes.length === 0) {
    return new Map();
  }

  const g = new dagre.graphlib.Graph();
  g.setGraph({
    rankdir: 'TB',  // Top to bottom within BC
    nodesep: LAYOUT_CONFIG.minNodeGapX,
    ranksep: LAYOUT_CONFIG.minNodeGapY,
    marginx: 20,
    marginy: 20,
  });
  g.setDefaultEdgeLabel(() => ({}));

  // Add nodes
  bcNodes.forEach(n => {
    g.setNode(n.id, {
      width: LAYOUT_CONFIG.nodeWidth,
      height: LAYOUT_CONFIG.nodeHeight,
    });
  });

  // Add edges (only within this BC)
  const bcNodeIds = new Set(bcNodes.map(n => n.id));
  bcEdges.forEach(e => {
    if (bcNodeIds.has(e.source) && bcNodeIds.has(e.target)) {
      g.setEdge(e.source, e.target);
    }
  });

  dagre.layout(g);

  // Extract positions and offset by column
  const columnX = columnIndex * LAYOUT_CONFIG.bcColumnWidth + LAYOUT_CONFIG.bcMargin;
  const positions = new Map<string, Position>();

  bcNodes.forEach(n => {
    const nodeLayout = g.node(n.id);
    if (nodeLayout) {
      positions.set(n.id, {
        x: columnX + nodeLayout.x - LAYOUT_CONFIG.nodeWidth / 2,
        y: LAYOUT_CONFIG.layerY[n.layer ?? 'domain'] + (nodeLayout.y ?? 0),
      });
    }
  });

  return positions;
}

// ============================================================================
// BC Region Computation
// ============================================================================

/**
 * Compute bounding box for a BC's nodes
 */
function computeBCRegion(
  bc: BoundedContextDef,
  nodePositions: Map<string, Position>,
  nodes: StoryNode[]
): BCRegion | null {
  const bcNodes = nodes.filter(n => n.boundedContext === bc.id);
  
  if (bcNodes.length === 0) {
    return null;
  }

  const positions = bcNodes
    .map(n => nodePositions.get(n.id))
    .filter((p): p is Position => p !== undefined);

  if (positions.length === 0) {
    return null;
  }

  const xs = positions.map(p => p.x);
  const ys = positions.map(p => p.y);

  const minX = Math.min(...xs) - LAYOUT_CONFIG.bcPadding;
  const maxX = Math.max(...xs) + LAYOUT_CONFIG.nodeWidth + LAYOUT_CONFIG.bcPadding;
  const minY = Math.min(...ys) - LAYOUT_CONFIG.bcPadding;
  const maxY = Math.max(...ys) + LAYOUT_CONFIG.nodeHeight + LAYOUT_CONFIG.bcPadding;

  return {
    id: bc.id,
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
    color: bc.color ?? '#9E9E9E',
  };
}

// ============================================================================
// External Nodes (no BC)
// ============================================================================

/**
 * Layout nodes without a BC (external actors, etc.)
 */
function layoutExternalNodes(
  nodes: StoryNode[]
): Map<string, Position> {
  const externalNodes = nodes.filter(n => !n.boundedContext || n.boundedContext === 'external');
  const positions = new Map<string, Position>();

  // Place external nodes on the left edge
  let y = LAYOUT_CONFIG.canvasPadding;
  
  externalNodes.forEach(n => {
    // Check if already positioned (manual position in YAML)
    if (n.position) {
      positions.set(n.id, { x: n.position.x, y: n.position.y });
    } else {
      positions.set(n.id, {
        x: LAYOUT_CONFIG.canvasPadding,
        y: y,
      });
      y += LAYOUT_CONFIG.nodeHeight + LAYOUT_CONFIG.minNodeGapY;
    }
  });

  return positions;
}

// ============================================================================
// Main Layout Function
// ============================================================================

/**
 * Compute full layout for an architectural story
 */
export function computeArchitecturalLayout(story: UserStory): LayoutResult {
  const { nodes, edges, boundedContexts = [] } = story;

  // Step 1: Determine BC order (left to right)
  const bcOrder = determineBCOrder(boundedContexts, nodes, edges);

  // Step 2: Layout nodes within each BC
  const allPositions = new Map<string, Position>();

  bcOrder.forEach((bcId, columnIndex) => {
    const bcNodes = nodes.filter(n => n.boundedContext === bcId);
    const bcPositions = layoutNodesInBC(bcNodes, edges, columnIndex);
    bcPositions.forEach((pos, nodeId) => allPositions.set(nodeId, pos));
  });

  // Step 3: Layout external nodes
  const externalPositions = layoutExternalNodes(nodes);
  externalPositions.forEach((pos, nodeId) => allPositions.set(nodeId, pos));

  // Step 4: Handle nodes with manual positions
  nodes.forEach(n => {
    if (n.position && !allPositions.has(n.id)) {
      allPositions.set(n.id, { x: n.position.x, y: n.position.y });
    }
  });

  // Step 5: Compute BC regions
  const bcRegions = boundedContexts
    .map(bc => computeBCRegion(bc, allPositions, nodes))
    .filter((r): r is BCRegion => r !== null);

  // Step 6: Compute canvas bounds
  const allX = [...allPositions.values()].map(p => p.x + LAYOUT_CONFIG.nodeWidth);
  const allY = [...allPositions.values()].map(p => p.y + LAYOUT_CONFIG.nodeHeight);
  
  const canvasBounds = {
    width: Math.max(...allX, 800) + LAYOUT_CONFIG.canvasPadding,
    height: Math.max(...allY, 600) + LAYOUT_CONFIG.canvasPadding,
  };

  return {
    nodePositions: allPositions,
    bcRegions,
    canvasBounds,
  };
}

/**
 * Apply computed layout to nodes
 */
export function applyLayout(
  nodes: StoryNode[],
  layout: LayoutResult
): StoryNode[] {
  return nodes.map(n => {
    const position = layout.nodePositions.get(n.id);
    if (position) {
      return { ...n, position };
    }
    return n;
  });
}
