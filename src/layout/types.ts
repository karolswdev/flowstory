/**
 * FlowStory Layout System - Types
 */

// =============================================================================
// Camera Types
// =============================================================================

export interface Camera {
  /** World position of viewport center */
  center: [number, number];
  /** Zoom level (1.0 = 100%) */
  zoom: number;
  /** Optional bounds for panning limits */
  bounds?: CameraBounds;
}

export interface CameraBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

export interface CameraTransition {
  /** Target camera state */
  camera: Camera;
  /** Transition duration in ms */
  duration: number;
  /** Easing function */
  easing: EasingType;
}

export type EasingType = 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out';

// =============================================================================
// Layout Configuration
// =============================================================================

export interface LayoutConfig {
  /** Edge routing algorithm */
  edgeRouting: 'orthogonal' | 'spline' | 'straight';
  /** Minimum distance from edges to nodes */
  edgePadding: number;
  /** Enable overlap detection */
  overlapDetection: boolean;
  /** Strategy when overlap detected */
  overlapStrategy: 'nudge' | 'repel' | 'reflow' | 'error';
  /** Minimum gap between nodes */
  overlapPadding: number;
}

export const DEFAULT_LAYOUT_CONFIG: LayoutConfig = {
  edgeRouting: 'orthogonal',
  edgePadding: 20,
  overlapDetection: true,
  overlapStrategy: 'nudge',
  overlapPadding: 10,
};

export const DEFAULT_CAMERA: Camera = {
  center: [0, 0],
  zoom: 1.0,
};

// =============================================================================
// Bounding Box
// =============================================================================

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

// =============================================================================
// Node with Layout Info
// =============================================================================

export interface LayoutNode {
  id: string;
  /** Position relative to camera center */
  position: [number, number];
  /** Size of the node */
  size: { width: number; height: number };
  /** Allow this node to overlap others */
  allowOverlap: boolean;
}

// =============================================================================
// Edge with Routing Info
// =============================================================================

export interface LayoutEdge {
  id: string;
  source: string;
  target: string;
  /** Routed path points (after edge routing) */
  path?: [number, number][];
}

// =============================================================================
// Viewport
// =============================================================================

export interface Viewport {
  width: number;
  height: number;
}

// =============================================================================
// Overlap Detection Result
// =============================================================================

export interface OverlapResult {
  /** Pairs of overlapping node IDs */
  overlaps: [string, string][];
  /** Suggested adjustments to fix overlaps */
  adjustments: Map<string, [number, number]>;
}
