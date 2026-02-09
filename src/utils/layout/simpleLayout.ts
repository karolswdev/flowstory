/**
 * Simple Layout Engine
 * 
 * Assigns grid-based positions to nodes that don't have positions.
 * Adaptive: uses compact horizontal flow for small stories,
 * layered grid for larger stories.
 * 
 * @module utils/layout/simpleLayout
 */

import type { StoryNode } from '../../types/story';

export interface Position {
  x: number;
  y: number;
}

const GRID_CONFIG = {
  startX: 150,
  startY: 120,
  nodeWidth: 200,
  nodeHeight: 70,
  gapX: 80,
  gapY: 100,
  nodesPerRow: 5,  // More nodes per row for compact layout
};

/**
 * Assign grid positions to nodes that don't have positions.
 * Uses adaptive layout based on story size.
 */
export function assignSimplePositions(nodes: StoryNode[]): StoryNode[] {
  const needsLayout = nodes.filter(n => !n.position || (n.position.x === 0 && n.position.y === 0));
  const hasLayout = nodes.filter(n => n.position && (n.position.x !== 0 || n.position.y !== 0));
  
  // For small stories, use simple horizontal flow
  if (needsLayout.length <= 12) {
    return [...hasLayout, ...layoutHorizontalFlow(needsLayout)];
  }
  
  // For larger stories, use layered grid
  return [...hasLayout, ...layoutLayeredGrid(needsLayout)];
}

/**
 * Compact horizontal flow layout for small stories.
 * Places nodes in a left-to-right, top-to-bottom flow.
 */
function layoutHorizontalFlow(nodes: StoryNode[]): StoryNode[] {
  const result: StoryNode[] = [];
  let x = GRID_CONFIG.startX;
  let y = GRID_CONFIG.startY;
  let colCount = 0;
  
  // Sort by type priority (aggregates/services first, then handlers, then events, then external)
  const typePriority: Record<string, number> = {
    'aggregate': 1, 'entity': 1, 'state': 1,
    'service': 2, 'system': 2, 'conductor': 2,
    'handler': 3, 'action': 3, 'orchestrator-step': 3,
    'event': 4,
    'bus': 5, 'infrastructure': 5, 'external': 5,
  };
  
  const sorted = [...nodes].sort((a, b) => {
    const aPri = typePriority[a.type] || 10;
    const bPri = typePriority[b.type] || 10;
    return aPri - bPri;
  });
  
  for (const node of sorted) {
    result.push({
      ...node,
      position: { x, y },
    });
    
    colCount++;
    if (colCount >= GRID_CONFIG.nodesPerRow) {
      colCount = 0;
      x = GRID_CONFIG.startX;
      y += GRID_CONFIG.nodeHeight + GRID_CONFIG.gapY;
    } else {
      x += GRID_CONFIG.nodeWidth + GRID_CONFIG.gapX;
    }
  }
  
  return result;
}

/**
 * Layered grid layout for larger stories.
 * Groups by layer (orchestration → domain → infrastructure).
 */
function layoutLayeredGrid(nodes: StoryNode[]): StoryNode[] {
  const layers = new Map<string, StoryNode[]>();
  
  for (const node of nodes) {
    const layer = node.layer || 'domain';
    if (!layers.has(layer)) {
      layers.set(layer, []);
    }
    layers.get(layer)!.push(node);
  }
  
  const layerOrder = ['orchestration', 'domain', 'infrastructure', 'default'];
  const sortedLayers = [...layers.entries()].sort((a, b) => {
    const aIdx = layerOrder.indexOf(a[0]);
    const bIdx = layerOrder.indexOf(b[0]);
    return (aIdx === -1 ? 999 : aIdx) - (bIdx === -1 ? 999 : bIdx);
  });
  
  const result: StoryNode[] = [];
  let layerY = GRID_CONFIG.startY;
  
  for (const [, layerNodes] of sortedLayers) {
    let x = GRID_CONFIG.startX;
    let colCount = 0;
    
    for (const node of layerNodes) {
      result.push({
        ...node,
        position: { x, y: layerY },
      });
      
      colCount++;
      if (colCount >= GRID_CONFIG.nodesPerRow) {
        colCount = 0;
        x = GRID_CONFIG.startX;
        layerY += GRID_CONFIG.nodeHeight + GRID_CONFIG.gapY;
      } else {
        x += GRID_CONFIG.nodeWidth + GRID_CONFIG.gapX;
      }
    }
    
    // Move to next layer with gap
    layerY = Math.max(layerY, rowStartY) + GRID_CONFIG.nodeHeight + GRID_CONFIG.gapY + 40;
  }
  
  return result;
}
