/**
 * FlowStory Layout Engine
 * 
 * Orchestrates camera transforms, overlap detection, and edge routing.
 */

import type {
  Camera,
  LayoutConfig,
  LayoutNode,
  LayoutEdge,
  Viewport,
  OverlapResult,
} from './types';
import { DEFAULT_CAMERA, DEFAULT_LAYOUT_CONFIG } from './types';
import { worldToScreen, screenToWorld, fitNodesToView } from './camera';
import { detectAndResolveOverlaps, applyAdjustments } from './overlap';

export interface LayoutInput {
  /** Nodes with world positions */
  nodes: LayoutNode[];
  /** Edges to route */
  edges: LayoutEdge[];
  /** Camera configuration */
  camera?: Camera;
  /** Layout configuration */
  config?: Partial<LayoutConfig>;
}

export interface LayoutOutput {
  /** Nodes with adjusted positions (after overlap resolution) */
  nodes: LayoutNode[];
  /** Nodes in screen coordinates */
  screenNodes: Map<string, [number, number]>;
  /** Edges with routed paths */
  edges: LayoutEdge[];
  /** Camera used */
  camera: Camera;
  /** Any overlaps detected */
  overlapResult: OverlapResult;
}

/**
 * Main layout engine
 */
export class LayoutEngine {
  private config: LayoutConfig;
  private camera: Camera;
  private viewport: Viewport;
  
  constructor(viewport: Viewport, config?: Partial<LayoutConfig>) {
    this.viewport = viewport;
    this.config = { ...DEFAULT_LAYOUT_CONFIG, ...config };
    this.camera = DEFAULT_CAMERA;
  }
  
  /**
   * Set viewport size
   */
  setViewport(viewport: Viewport): void {
    this.viewport = viewport;
  }
  
  /**
   * Set camera
   */
  setCamera(camera: Camera): void {
    this.camera = camera;
  }
  
  /**
   * Get current camera
   */
  getCamera(): Camera {
    return this.camera;
  }
  
  /**
   * Update layout configuration
   */
  setConfig(config: Partial<LayoutConfig>): void {
    this.config = { ...this.config, ...config };
  }
  
  /**
   * Process layout - detect overlaps, route edges, convert to screen coords
   */
  processLayout(input: LayoutInput): LayoutOutput {
    const camera = input.camera || this.camera;
    const config = { ...this.config, ...input.config };
    
    let nodes = [...input.nodes];
    let overlapResult: OverlapResult = { overlaps: [], adjustments: new Map() };
    
    // Step 1: Detect and resolve overlaps
    if (config.overlapDetection) {
      overlapResult = detectAndResolveOverlaps(
        nodes,
        config.overlapStrategy,
        config.overlapPadding
      );
      
      if (overlapResult.adjustments.size > 0) {
        nodes = applyAdjustments(nodes, overlapResult.adjustments);
      }
    }
    
    // Step 2: Convert node positions to screen coordinates
    const screenNodes = new Map<string, [number, number]>();
    for (const node of nodes) {
      const screenPos = worldToScreen(node.position, camera, this.viewport);
      screenNodes.set(node.id, screenPos);
    }
    
    // Step 3: Route edges (basic straight lines for now, ELK.js in Phase 2)
    const edges = input.edges.map(edge => {
      const sourcePos = screenNodes.get(edge.source);
      const targetPos = screenNodes.get(edge.target);
      
      if (sourcePos && targetPos) {
        return {
          ...edge,
          path: [sourcePos, targetPos],
        };
      }
      
      return edge;
    });
    
    return {
      nodes,
      screenNodes,
      edges,
      camera,
      overlapResult,
    };
  }
  
  /**
   * Fit camera to show all nodes
   */
  fitToNodes(nodes: LayoutNode[], padding: number = 50): Camera {
    const positions = nodes.map(n => n.position);
    const sizes = nodes.map(n => n.size);
    
    return fitNodesToView(positions, sizes, this.viewport, padding);
  }
  
  /**
   * Convert a single world position to screen
   */
  worldToScreen(worldPos: [number, number]): [number, number] {
    return worldToScreen(worldPos, this.camera, this.viewport);
  }
  
  /**
   * Convert a single screen position to world
   */
  screenToWorld(screenPos: [number, number]): [number, number] {
    return screenToWorld(screenPos, this.camera, this.viewport);
  }
}

/**
 * Create a layout engine instance
 */
export function createLayoutEngine(
  viewport: Viewport,
  config?: Partial<LayoutConfig>
): LayoutEngine {
  return new LayoutEngine(viewport, config);
}
