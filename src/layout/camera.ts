/**
 * FlowStory Layout System - Camera Transforms
 * 
 * Handles conversion between world coordinates (relative to camera center)
 * and screen coordinates (pixels on viewport).
 */

import type { Camera, CameraBounds, Viewport, EasingType } from './types';

/**
 * Convert world position to screen position
 * 
 * World positions are relative to camera center.
 * Screen positions are pixels from top-left of viewport.
 */
export function worldToScreen(
  worldPos: [number, number],
  camera: Camera,
  viewport: Viewport
): [number, number] {
  const [wx, wy] = worldPos;
  const [cx, cy] = camera.center;
  
  // Translate relative to camera, then scale by zoom
  const screenX = (wx - cx) * camera.zoom + viewport.width / 2;
  const screenY = (wy - cy) * camera.zoom + viewport.height / 2;
  
  return [screenX, screenY];
}

/**
 * Convert screen position to world position
 */
export function screenToWorld(
  screenPos: [number, number],
  camera: Camera,
  viewport: Viewport
): [number, number] {
  const [sx, sy] = screenPos;
  const [cx, cy] = camera.center;
  
  const worldX = (sx - viewport.width / 2) / camera.zoom + cx;
  const worldY = (sy - viewport.height / 2) / camera.zoom + cy;
  
  return [worldX, worldY];
}

/**
 * Clamp camera center to bounds
 */
export function clampToBounds(
  camera: Camera,
  bounds: CameraBounds
): Camera {
  const [cx, cy] = camera.center;
  
  return {
    ...camera,
    center: [
      Math.max(bounds.minX, Math.min(bounds.maxX, cx)),
      Math.max(bounds.minY, Math.min(bounds.maxY, cy)),
    ],
  };
}

/**
 * Apply easing function to progress value
 */
export function applyEasing(t: number, easing: EasingType): number {
  switch (easing) {
    case 'linear':
      return t;
    case 'ease-in':
      return t * t;
    case 'ease-out':
      return 1 - (1 - t) * (1 - t);
    case 'ease-in-out':
      return t < 0.5
        ? 2 * t * t
        : 1 - Math.pow(-2 * t + 2, 2) / 2;
    default:
      return t;
  }
}

/**
 * Linear interpolation
 */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * Interpolate between two camera states
 */
export function interpolateCamera(
  from: Camera,
  to: Camera,
  progress: number,
  easing: EasingType = 'ease-out'
): Camera {
  const t = applyEasing(Math.max(0, Math.min(1, progress)), easing);
  
  return {
    center: [
      lerp(from.center[0], to.center[0], t),
      lerp(from.center[1], to.center[1], t),
    ],
    zoom: lerp(from.zoom, to.zoom, t),
    bounds: to.bounds, // Use target bounds
  };
}

/**
 * Calculate camera to fit all nodes in view
 */
export function fitNodesToView(
  nodePositions: [number, number][],
  nodeSizes: { width: number; height: number }[],
  viewport: Viewport,
  padding: number = 50
): Camera {
  if (nodePositions.length === 0) {
    return { center: [0, 0], zoom: 1 };
  }
  
  // Find bounding box of all nodes
  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;
  
  for (let i = 0; i < nodePositions.length; i++) {
    const [x, y] = nodePositions[i];
    const { width, height } = nodeSizes[i] || { width: 100, height: 50 };
    
    minX = Math.min(minX, x - width / 2);
    maxX = Math.max(maxX, x + width / 2);
    minY = Math.min(minY, y - height / 2);
    maxY = Math.max(maxY, y + height / 2);
  }
  
  // Calculate center
  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;
  
  // Calculate zoom to fit
  const contentWidth = maxX - minX + padding * 2;
  const contentHeight = maxY - minY + padding * 2;
  
  const zoomX = viewport.width / contentWidth;
  const zoomY = viewport.height / contentHeight;
  const zoom = Math.min(zoomX, zoomY, 1); // Don't zoom in past 100%
  
  return {
    center: [centerX, centerY],
    zoom,
  };
}

/**
 * Get visible bounds in world coordinates
 */
export function getVisibleBounds(
  camera: Camera,
  viewport: Viewport
): { minX: number; maxX: number; minY: number; maxY: number } {
  const halfWidth = (viewport.width / 2) / camera.zoom;
  const halfHeight = (viewport.height / 2) / camera.zoom;
  
  return {
    minX: camera.center[0] - halfWidth,
    maxX: camera.center[0] + halfWidth,
    minY: camera.center[1] - halfHeight,
    maxY: camera.center[1] + halfHeight,
  };
}

/**
 * Check if a world position is visible in the viewport
 */
export function isInView(
  worldPos: [number, number],
  camera: Camera,
  viewport: Viewport,
  margin: number = 0
): boolean {
  const bounds = getVisibleBounds(camera, viewport);
  const [x, y] = worldPos;
  
  return (
    x >= bounds.minX - margin &&
    x <= bounds.maxX + margin &&
    y >= bounds.minY - margin &&
    y <= bounds.maxY + margin
  );
}
