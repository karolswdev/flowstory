/**
 * FlowStory Layout System - Edge Router
 * 
 * Uses ELK.js for orthogonal edge routing that avoids nodes.
 */

import ELK, { ElkNode, ElkExtendedEdge } from 'elkjs/lib/elk.bundled.js';
import type { LayoutNode, LayoutEdge, LayoutConfig } from './types';

const elk = new ELK();

/**
 * ELK layout options for orthogonal routing
 */
const ORTHOGONAL_OPTIONS = {
  'elk.algorithm': 'layered',
  'elk.edgeRouting': 'ORTHOGONAL',
  'elk.layered.crossingMinimization.strategy': 'LAYER_SWEEP',
  'elk.layered.nodePlacement.strategy': 'NETWORK_SIMPLEX',
  'elk.spacing.nodeNode': '50',
  'elk.spacing.edgeNode': '30',
  'elk.layered.spacing.edgeEdgeBetweenLayers': '20',
};

const SPLINE_OPTIONS = {
  'elk.algorithm': 'layered',
  'elk.edgeRouting': 'SPLINES',
  'elk.spacing.nodeNode': '50',
};

const STRAIGHT_OPTIONS = {
  'elk.algorithm': 'layered',
  'elk.edgeRouting': 'POLYLINE',
  'elk.spacing.nodeNode': '50',
};

/**
 * Convert layout nodes to ELK format
 */
function toElkNodes(nodes: LayoutNode[]): ElkNode[] {
  return nodes.map(node => ({
    id: node.id,
    x: node.position[0] - node.size.width / 2,
    y: node.position[1] - node.size.height / 2,
    width: node.size.width,
    height: node.size.height,
  }));
}

/**
 * Convert layout edges to ELK format
 */
function toElkEdges(edges: LayoutEdge[]): ElkExtendedEdge[] {
  return edges.map(edge => ({
    id: edge.id,
    sources: [edge.source],
    targets: [edge.target],
  }));
}

/**
 * Extract routed path from ELK edge
 */
function extractPath(
  elkEdge: ElkExtendedEdge,
  elkNodes: Map<string, ElkNode>
): [number, number][] {
  const path: [number, number][] = [];
  
  // Get source node center
  const sourceNode = elkNodes.get(elkEdge.sources[0]);
  if (sourceNode && sourceNode.x !== undefined && sourceNode.y !== undefined) {
    path.push([
      sourceNode.x + (sourceNode.width || 0) / 2,
      sourceNode.y + (sourceNode.height || 0) / 2,
    ]);
  }
  
  // Add bend points from ELK sections
  if (elkEdge.sections) {
    for (const section of elkEdge.sections) {
      if (section.startPoint) {
        path.push([section.startPoint.x, section.startPoint.y]);
      }
      if (section.bendPoints) {
        for (const bend of section.bendPoints) {
          path.push([bend.x, bend.y]);
        }
      }
      if (section.endPoint) {
        path.push([section.endPoint.x, section.endPoint.y]);
      }
    }
  }
  
  // Get target node center
  const targetNode = elkNodes.get(elkEdge.targets[0]);
  if (targetNode && targetNode.x !== undefined && targetNode.y !== undefined) {
    path.push([
      targetNode.x + (targetNode.width || 0) / 2,
      targetNode.y + (targetNode.height || 0) / 2,
    ]);
  }
  
  return path;
}

/**
 * Route edges using ELK.js
 * 
 * @param nodes - Layout nodes (used as obstacles)
 * @param edges - Edges to route
 * @param config - Layout configuration
 * @returns Edges with routed paths
 */
export async function routeEdges(
  nodes: LayoutNode[],
  edges: LayoutEdge[],
  config: Partial<LayoutConfig> = {}
): Promise<LayoutEdge[]> {
  if (edges.length === 0) return edges;
  
  // Select options based on routing type
  let options: Record<string, string>;
  switch (config.edgeRouting) {
    case 'orthogonal':
      options = { ...ORTHOGONAL_OPTIONS };
      break;
    case 'spline':
      options = { ...SPLINE_OPTIONS };
      break;
    case 'straight':
      options = { ...STRAIGHT_OPTIONS };
      break;
    default:
      options = { ...ORTHOGONAL_OPTIONS };
  }
  
  // Apply edge padding if specified
  if (config.edgePadding) {
    options['elk.spacing.edgeNode'] = String(config.edgePadding);
  }
  
  // Build ELK graph
  const graph = {
    id: 'root',
    layoutOptions: options,
    children: toElkNodes(nodes),
    edges: toElkEdges(edges),
  };
  
  try {
    // Run ELK layout
    const result = await elk.layout(graph);
    
    // Build node map for path extraction
    const elkNodeMap = new Map<string, ElkNode>();
    if (result.children) {
      for (const node of result.children) {
        elkNodeMap.set(node.id, node);
      }
    }
    
    // Extract routed paths
    const routedEdges = edges.map(edge => {
      const elkEdge = result.edges?.find(e => e.id === edge.id);
      
      if (elkEdge) {
        return {
          ...edge,
          path: extractPath(elkEdge, elkNodeMap),
        };
      }
      
      return edge;
    });
    
    return routedEdges;
  } catch (error) {
    console.warn('Edge routing failed, using straight lines:', error);
    
    // Fallback to straight lines
    return edges.map(edge => {
      const sourceNode = nodes.find(n => n.id === edge.source);
      const targetNode = nodes.find(n => n.id === edge.target);
      
      if (sourceNode && targetNode) {
        return {
          ...edge,
          path: [sourceNode.position, targetNode.position],
        };
      }
      
      return edge;
    });
  }
}

/**
 * Simplify a path by removing redundant points
 */
export function simplifyPath(
  path: [number, number][],
  tolerance: number = 1
): [number, number][] {
  if (path.length <= 2) return path;
  
  const result: [number, number][] = [path[0]];
  
  for (let i = 1; i < path.length - 1; i++) {
    const prev = result[result.length - 1];
    const curr = path[i];
    const next = path[i + 1];
    
    // Check if current point is on the line between prev and next
    const dx1 = curr[0] - prev[0];
    const dy1 = curr[1] - prev[1];
    const dx2 = next[0] - curr[0];
    const dy2 = next[1] - curr[1];
    
    // Cross product to check collinearity
    const cross = Math.abs(dx1 * dy2 - dy1 * dx2);
    
    if (cross > tolerance) {
      result.push(curr);
    }
  }
  
  result.push(path[path.length - 1]);
  
  return result;
}
