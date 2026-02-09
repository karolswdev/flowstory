/**
 * FlowStory Layout System - Overlap Detection
 * 
 * Detects and resolves overlapping nodes using AABB collision detection.
 */

import type { BoundingBox, LayoutNode, OverlapResult } from './types';

/**
 * Get bounding box for a node
 */
export function getNodeBoundingBox(node: LayoutNode): BoundingBox {
  const [x, y] = node.position;
  const { width, height } = node.size;
  
  return {
    x: x - width / 2,
    y: y - height / 2,
    width,
    height,
  };
}

/**
 * Expand bounding box by padding
 */
export function expandBoundingBox(box: BoundingBox, padding: number): BoundingBox {
  return {
    x: box.x - padding,
    y: box.y - padding,
    width: box.width + padding * 2,
    height: box.height + padding * 2,
  };
}

/**
 * Check if two bounding boxes overlap (AABB)
 */
export function boxesOverlap(a: BoundingBox, b: BoundingBox): boolean {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

/**
 * Calculate overlap amount between two boxes
 */
export function getOverlapAmount(a: BoundingBox, b: BoundingBox): { x: number; y: number } {
  const overlapX = Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x);
  const overlapY = Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y);
  
  return {
    x: Math.max(0, overlapX),
    y: Math.max(0, overlapY),
  };
}

/**
 * Find all overlapping node pairs
 */
export function findOverlaps(
  nodes: LayoutNode[],
  padding: number = 0
): [string, string][] {
  const overlaps: [string, string][] = [];
  
  for (let i = 0; i < nodes.length; i++) {
    const nodeA = nodes[i];
    if (nodeA.allowOverlap) continue;
    
    const boxA = expandBoundingBox(getNodeBoundingBox(nodeA), padding);
    
    for (let j = i + 1; j < nodes.length; j++) {
      const nodeB = nodes[j];
      if (nodeB.allowOverlap) continue;
      
      const boxB = expandBoundingBox(getNodeBoundingBox(nodeB), padding);
      
      if (boxesOverlap(boxA, boxB)) {
        overlaps.push([nodeA.id, nodeB.id]);
      }
    }
  }
  
  return overlaps;
}

/**
 * Calculate nudge adjustments to resolve overlaps
 * 
 * Moves nodes minimally to eliminate overlaps.
 */
export function calculateNudgeAdjustments(
  nodes: LayoutNode[],
  padding: number = 10
): Map<string, [number, number]> {
  const adjustments = new Map<string, [number, number]>();
  const nodeMap = new Map(nodes.map(n => [n.id, n]));
  
  // Initialize adjustments to zero
  for (const node of nodes) {
    adjustments.set(node.id, [0, 0]);
  }
  
  // Iterate to resolve overlaps (max 10 iterations)
  for (let iteration = 0; iteration < 10; iteration++) {
    let hasOverlap = false;
    
    for (let i = 0; i < nodes.length; i++) {
      const nodeA = nodes[i];
      if (nodeA.allowOverlap) continue;
      
      const adjA = adjustments.get(nodeA.id)!;
      const posA: [number, number] = [
        nodeA.position[0] + adjA[0],
        nodeA.position[1] + adjA[1],
      ];
      const boxA = expandBoundingBox({
        x: posA[0] - nodeA.size.width / 2,
        y: posA[1] - nodeA.size.height / 2,
        width: nodeA.size.width,
        height: nodeA.size.height,
      }, padding / 2);
      
      for (let j = i + 1; j < nodes.length; j++) {
        const nodeB = nodes[j];
        if (nodeB.allowOverlap) continue;
        
        const adjB = adjustments.get(nodeB.id)!;
        const posB: [number, number] = [
          nodeB.position[0] + adjB[0],
          nodeB.position[1] + adjB[1],
        ];
        const boxB = expandBoundingBox({
          x: posB[0] - nodeB.size.width / 2,
          y: posB[1] - nodeB.size.height / 2,
          width: nodeB.size.width,
          height: nodeB.size.height,
        }, padding / 2);
        
        if (boxesOverlap(boxA, boxB)) {
          hasOverlap = true;
          
          // Calculate push direction
          const dx = posB[0] - posA[0];
          const dy = posB[1] - posA[1];
          
          // Normalize and scale by overlap amount
          const overlap = getOverlapAmount(boxA, boxB);
          const pushX = overlap.x > 0 ? (dx >= 0 ? 1 : -1) * (overlap.x / 2 + 1) : 0;
          const pushY = overlap.y > 0 ? (dy >= 0 ? 1 : -1) * (overlap.y / 2 + 1) : 0;
          
          // Push nodes apart equally
          adjustments.set(nodeA.id, [adjA[0] - pushX, adjA[1] - pushY]);
          adjustments.set(nodeB.id, [adjB[0] + pushX, adjB[1] + pushY]);
        }
      }
    }
    
    if (!hasOverlap) break;
  }
  
  // Remove zero adjustments
  for (const [id, [dx, dy]] of adjustments) {
    if (dx === 0 && dy === 0) {
      adjustments.delete(id);
    }
  }
  
  return adjustments;
}

/**
 * Detect overlaps and calculate adjustments
 */
export function detectAndResolveOverlaps(
  nodes: LayoutNode[],
  strategy: 'nudge' | 'repel' | 'reflow' | 'error',
  padding: number = 10
): OverlapResult {
  const overlaps = findOverlaps(nodes, padding);
  
  if (overlaps.length === 0) {
    return { overlaps: [], adjustments: new Map() };
  }
  
  let adjustments: Map<string, [number, number]>;
  
  switch (strategy) {
    case 'nudge':
      adjustments = calculateNudgeAdjustments(nodes, padding);
      break;
      
    case 'repel':
      // For now, use nudge. Could implement force-directed later.
      adjustments = calculateNudgeAdjustments(nodes, padding);
      break;
      
    case 'reflow':
      // Would need full layout engine - just use nudge for now
      adjustments = calculateNudgeAdjustments(nodes, padding);
      break;
      
    case 'error':
      // Don't adjust, just report
      adjustments = new Map();
      break;
      
    default:
      adjustments = new Map();
  }
  
  return { overlaps, adjustments };
}

/**
 * Apply adjustments to node positions
 */
export function applyAdjustments(
  nodes: LayoutNode[],
  adjustments: Map<string, [number, number]>
): LayoutNode[] {
  return nodes.map(node => {
    const adjustment = adjustments.get(node.id);
    if (!adjustment) return node;
    
    return {
      ...node,
      position: [
        node.position[0] + adjustment[0],
        node.position[1] + adjustment[1],
      ] as [number, number],
    };
  });
}
