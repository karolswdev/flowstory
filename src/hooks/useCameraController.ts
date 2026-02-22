/**
 * Camera Controller Hook
 *
 * Provides smooth camera control for FlowStory canvases:
 * - Focus on specific nodes with smooth pan/zoom
 * - Spring-overshoot easing: accelerate → overshoot → settle back
 * - Auto-follow mode for step transitions
 * - Configurable easing and duration
 */

import { useCallback, useRef, useEffect } from 'react';
import { useReactFlow, useStore } from '@xyflow/react';

interface FocusOptions {
  /** Padding around focus area in pixels */
  padding?: number;
  /** Animation duration in ms */
  duration?: number;
  /** Maximum zoom level (default 1.5) */
  maxZoom?: number;
  /** Minimum zoom level (default 0.5) */
  minZoom?: number;
}

interface CameraController {
  /**
   * Focus on specific nodes with smooth spring-overshoot animation
   */
  focusNodes: (nodeIds: string[], options?: FocusOptions) => Promise<void>;

  /**
   * Fit all nodes in view
   */
  fitAll: (padding?: number) => Promise<void>;

  /**
   * Pan to specific coordinates
   */
  panTo: (x: number, y: number, duration?: number) => Promise<void>;

  /**
   * Zoom to specific level
   */
  zoomTo: (level: number, duration?: number) => Promise<void>;

  /**
   * Get current viewport
   */
  getViewport: () => { x: number; y: number; zoom: number };

  /**
   * Enable auto-follow mode (follows active nodes)
   */
  enableAutoFollow: () => void;

  /**
   * Disable auto-follow mode
   */
  disableAutoFollow: () => void;

  /**
   * Whether auto-follow is enabled
   */
  isAutoFollowEnabled: boolean;
}

const DEFAULT_OPTIONS: FocusOptions = {
  padding: 80,
  duration: 1100,
  maxZoom: 1.5,
  minZoom: 0.5,
};

/**
 * Spring-overshoot easing function.
 * Accelerates smoothly, overshoots the target by ~10%, then eases back to settle.
 * Creates a natural, cinematic camera movement feel.
 *
 * Based on a damped spring model:
 *   f(t) = 1 - e^(-6t) * cos(3πt)
 *
 * At t=0: f=0 (start)
 * At t≈0.55: f≈1.08 (overshoot peak)
 * At t=1: f=1 (settled)
 */
function springOvershoot(t: number): number {
  if (t >= 1) return 1;
  if (t <= 0) return 0;
  return 1 - Math.exp(-6 * t) * Math.cos(3 * Math.PI * t);
}

/**
 * Hook for camera control in React Flow
 */
export function useCameraController(): CameraController {
  const { fitBounds, setViewport, getViewport, getNodes, fitView } = useReactFlow();
  const autoFollowRef = useRef(false);
  const animFrameRef = useRef<number>(0);

  // Get container dimensions from store for viewport calculations
  const containerWidth = useStore((state) => state.width);
  const containerHeight = useStore((state) => state.height);

  /**
   * Calculate bounding box for a set of nodes
   */
  const getNodesBounds = useCallback((nodeIds: string[]) => {
    const nodes = getNodes().filter(n => nodeIds.includes(n.id));

    if (nodes.length === 0) {
      return null;
    }

    const bounds = nodes.reduce(
      (acc, node) => {
        const width = node.measured?.width ?? node.width ?? 150;
        const height = node.measured?.height ?? node.height ?? 100;

        return {
          minX: Math.min(acc.minX, node.position.x),
          minY: Math.min(acc.minY, node.position.y),
          maxX: Math.max(acc.maxX, node.position.x + width),
          maxY: Math.max(acc.maxY, node.position.y + height),
        };
      },
      { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity }
    );

    return {
      x: bounds.minX,
      y: bounds.minY,
      width: bounds.maxX - bounds.minX,
      height: bounds.maxY - bounds.minY,
    };
  }, [getNodes]);

  /**
   * Animate viewport from current to target using spring-overshoot easing.
   */
  const animateViewport = useCallback((
    targetX: number,
    targetY: number,
    targetZoom: number,
    duration: number,
  ): Promise<void> => {
    // Cancel any in-flight animation
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
    }

    const current = getViewport();
    const startX = current.x;
    const startY = current.y;
    const startZoom = current.zoom;
    const startTime = performance.now();

    return new Promise(resolve => {
      const tick = (now: number) => {
        const elapsed = now - startTime;
        const t = Math.min(elapsed / duration, 1);
        const eased = springOvershoot(t);

        setViewport({
          x: startX + (targetX - startX) * eased,
          y: startY + (targetY - startY) * eased,
          zoom: startZoom + (targetZoom - startZoom) * eased,
        });

        if (t < 1) {
          animFrameRef.current = requestAnimationFrame(tick);
        } else {
          animFrameRef.current = 0;
          resolve();
        }
      };

      animFrameRef.current = requestAnimationFrame(tick);
    });
  }, [getViewport, setViewport]);

  /**
   * Focus on specific nodes with spring-overshoot camera animation.
   */
  const focusNodes = useCallback(async (
    nodeIds: string[],
    options: FocusOptions = {}
  ): Promise<void> => {
    const opts = { ...DEFAULT_OPTIONS, ...options };

    if (nodeIds.length === 0) {
      fitView({ padding: 0.2, duration: opts.duration });
      return;
    }

    const bounds = getNodesBounds(nodeIds);

    if (!bounds) {
      return;
    }

    // Compute target viewport from bounding box
    const pad = opts.padding!;
    const bx = bounds.x - pad;
    const by = bounds.y - pad;
    const bw = bounds.width + pad * 2;
    const bh = bounds.height + pad * 2;

    // Determine zoom to fit the padded bounds in the container
    const cw = containerWidth || 1440;
    const ch = containerHeight || 900;
    let zoom = Math.min(cw / bw, ch / bh);
    zoom = Math.max(opts.minZoom!, Math.min(opts.maxZoom!, zoom));

    // Compute the viewport x/y that centers the bounds
    // React Flow viewport: screen = world * zoom + offset
    // To center bounds: offset = containerSize/2 - (boundsCenter * zoom)
    const centerX = bx + bw / 2;
    const centerY = by + bh / 2;
    const targetX = cw / 2 - centerX * zoom;
    const targetY = ch / 2 - centerY * zoom;

    await animateViewport(targetX, targetY, zoom, opts.duration!);
  }, [getNodesBounds, fitView, animateViewport, containerWidth, containerHeight]);

  /**
   * Fit all nodes in view
   */
  const fitAll = useCallback(async (padding = 0.2): Promise<void> => {
    fitView({ padding, duration: DEFAULT_OPTIONS.duration });
    return new Promise(resolve =>
      setTimeout(resolve, DEFAULT_OPTIONS.duration)
    );
  }, [fitView]);

  /**
   * Pan to coordinates with spring-overshoot
   */
  const panTo = useCallback(async (
    x: number,
    y: number,
    duration = DEFAULT_OPTIONS.duration
  ): Promise<void> => {
    const current = getViewport();
    await animateViewport(x, y, current.zoom, duration!);
  }, [getViewport, animateViewport]);

  /**
   * Zoom to level with spring-overshoot
   */
  const zoomTo = useCallback(async (
    level: number,
    duration = DEFAULT_OPTIONS.duration
  ): Promise<void> => {
    const current = getViewport();
    await animateViewport(current.x, current.y, level, duration!);
  }, [getViewport, animateViewport]);

  /**
   * Enable auto-follow
   */
  const enableAutoFollow = useCallback(() => {
    autoFollowRef.current = true;
  }, []);

  /**
   * Disable auto-follow
   */
  const disableAutoFollow = useCallback(() => {
    autoFollowRef.current = false;
  }, []);

  return {
    focusNodes,
    fitAll,
    panTo,
    zoomTo,
    getViewport,
    enableAutoFollow,
    disableAutoFollow,
    isAutoFollowEnabled: autoFollowRef.current,
  };
}

/**
 * Hook that auto-focuses on active nodes when they change
 */
export function useAutoFocus(
  activeNodeIds: string[],
  options?: FocusOptions & { enabled?: boolean }
) {
  const camera = useCameraController();
  const prevActiveRef = useRef<string[]>([]);

  useEffect(() => {
    if (options?.enabled === false) return;

    // Check if active nodes changed
    const prevSet = new Set(prevActiveRef.current);
    const currSet = new Set(activeNodeIds);

    const changed =
      prevSet.size !== currSet.size ||
      activeNodeIds.some(id => !prevSet.has(id));

    if (changed && activeNodeIds.length > 0) {
      camera.focusNodes(activeNodeIds, options);
    }

    prevActiveRef.current = activeNodeIds;
  }, [activeNodeIds, camera, options]);

  return camera;
}

export default useCameraController;
