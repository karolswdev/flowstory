/**
 * Camera Controller Hook
 * 
 * Provides smooth camera control for FlowStory canvases:
 * - Focus on specific nodes with smooth pan/zoom
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
   * Focus on specific nodes with smooth animation
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
  duration: 600,
  maxZoom: 1.5,
  minZoom: 0.5,
};

/**
 * Hook for camera control in React Flow
 */
export function useCameraController(): CameraController {
  const { fitBounds, setViewport, getViewport, getNodes, fitView } = useReactFlow();
  const autoFollowRef = useRef(false);
  
  // Get node positions from store
  const nodeInternals = useStore((state) => state.nodeLookup);

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
   * Focus on specific nodes
   */
  const focusNodes = useCallback(async (
    nodeIds: string[], 
    options: FocusOptions = {}
  ): Promise<void> => {
    const opts = { ...DEFAULT_OPTIONS, ...options };
    
    if (nodeIds.length === 0) {
      // Fit all if no nodes specified
      fitView({ padding: 0.2, duration: opts.duration });
      return;
    }

    const bounds = getNodesBounds(nodeIds);
    
    if (!bounds) {
      console.warn('CameraController: No nodes found for focus', nodeIds);
      return;
    }

    // Add padding
    const paddedBounds = {
      x: bounds.x - opts.padding!,
      y: bounds.y - opts.padding!,
      width: bounds.width + opts.padding! * 2,
      height: bounds.height + opts.padding! * 2,
    };

    // Fit to bounds with animation
    fitBounds(paddedBounds, {
      padding: 0.1,
      duration: opts.duration,
      maxZoom: opts.maxZoom,
      minZoom: opts.minZoom,
    });

    // Return promise that resolves after animation
    return new Promise(resolve => setTimeout(resolve, opts.duration));
  }, [getNodesBounds, fitBounds, fitView]);

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
   * Pan to coordinates
   */
  const panTo = useCallback(async (
    x: number, 
    y: number, 
    duration = DEFAULT_OPTIONS.duration
  ): Promise<void> => {
    const currentViewport = getViewport();
    
    // Animate viewport change
    const startTime = Date.now();
    const startX = currentViewport.x;
    const startY = currentViewport.y;
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration!, 1);
      
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      
      setViewport({
        x: startX + (x - startX) * eased,
        y: startY + (y - startY) * eased,
        zoom: currentViewport.zoom,
      });
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    animate();
    return new Promise(resolve => setTimeout(resolve, duration));
  }, [getViewport, setViewport]);

  /**
   * Zoom to level
   */
  const zoomTo = useCallback(async (
    level: number, 
    duration = DEFAULT_OPTIONS.duration
  ): Promise<void> => {
    const currentViewport = getViewport();
    const startZoom = currentViewport.zoom;
    const startTime = Date.now();
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration!, 1);
      
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      
      setViewport({
        x: currentViewport.x,
        y: currentViewport.y,
        zoom: startZoom + (level - startZoom) * eased,
      });
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    animate();
    return new Promise(resolve => setTimeout(resolve, duration));
  }, [getViewport, setViewport]);

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
