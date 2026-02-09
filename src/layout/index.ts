/**
 * FlowStory Layout System
 * 
 * Camera-centric coordinate system with overlap detection and edge routing.
 */

// Types
export type {
  Camera,
  CameraBounds,
  CameraTransition,
  EasingType,
  LayoutConfig,
  BoundingBox,
  LayoutNode,
  LayoutEdge,
  Viewport,
  OverlapResult,
} from './types';

export { DEFAULT_CAMERA, DEFAULT_LAYOUT_CONFIG } from './types';

// Camera functions
export {
  worldToScreen,
  screenToWorld,
  clampToBounds,
  applyEasing,
  lerp,
  interpolateCamera,
  fitNodesToView,
  getVisibleBounds,
  isInView,
} from './camera';

// Overlap detection
export {
  getNodeBoundingBox,
  expandBoundingBox,
  boxesOverlap,
  getOverlapAmount,
  findOverlaps,
  calculateNudgeAdjustments,
  detectAndResolveOverlaps,
  applyAdjustments,
} from './overlap';

// Layout engine
export {
  LayoutEngine,
  createLayoutEngine,
  type LayoutInput,
  type LayoutOutput,
} from './layoutEngine';

// Edge routing
export {
  routeEdges,
  simplifyPath,
} from './edgeRouter';

// React hooks
export {
  useLayout,
  useViewportSize,
  type UseLayoutOptions,
  type UseLayoutResult,
} from './useLayout';

// Story integration
export {
  useStoryLayout,
  type UseStoryLayoutOptions,
  type UseStoryLayoutResult,
} from './useStoryLayout';
