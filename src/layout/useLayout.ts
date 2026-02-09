/**
 * FlowStory Layout System - React Hooks
 */

import { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import type { Camera, LayoutConfig, LayoutNode, LayoutEdge, Viewport } from './types';
import { DEFAULT_CAMERA, DEFAULT_LAYOUT_CONFIG } from './types';
import { interpolateCamera, EasingType } from './camera';
import { LayoutEngine } from './layoutEngine';

/**
 * Hook to manage the layout engine
 */
export interface UseLayoutOptions {
  initialCamera?: Camera;
  config?: Partial<LayoutConfig>;
}

export interface UseLayoutResult {
  /** Current camera state */
  camera: Camera;
  /** Set camera directly */
  setCamera: (camera: Camera) => void;
  /** Animate camera to new state */
  animateTo: (camera: Camera, duration?: number, easing?: EasingType) => void;
  /** Process layout for nodes/edges */
  processLayout: (nodes: LayoutNode[], edges: LayoutEdge[]) => {
    screenNodes: Map<string, [number, number]>;
    adjustedNodes: LayoutNode[];
    overlaps: [string, string][];
  };
  /** Fit camera to show all nodes */
  fitToNodes: (nodes: LayoutNode[], padding?: number) => void;
  /** Update viewport size */
  setViewport: (viewport: Viewport) => void;
}

export function useLayout(options: UseLayoutOptions = {}): UseLayoutResult {
  const [camera, setCameraState] = useState<Camera>(
    options.initialCamera || DEFAULT_CAMERA
  );
  const [viewport, setViewportState] = useState<Viewport>({ width: 800, height: 600 });
  
  const animationRef = useRef<number | null>(null);
  const engineRef = useRef<LayoutEngine | null>(null);
  
  // Create/update engine
  useEffect(() => {
    engineRef.current = new LayoutEngine(viewport, options.config);
    engineRef.current.setCamera(camera);
  }, [viewport, options.config]);
  
  // Update engine camera when state changes
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.setCamera(camera);
    }
  }, [camera]);
  
  const setCamera = useCallback((newCamera: Camera) => {
    // Cancel any ongoing animation
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    setCameraState(newCamera);
  }, []);
  
  const animateTo = useCallback((
    targetCamera: Camera,
    duration: number = 500,
    easing: EasingType = 'ease-out'
  ) => {
    // Cancel any ongoing animation
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    
    const startCamera = camera;
    const startTime = performance.now();
    
    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(1, elapsed / duration);
      
      const interpolated = interpolateCamera(startCamera, targetCamera, progress, easing);
      setCameraState(interpolated);
      
      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        animationRef.current = null;
      }
    };
    
    animationRef.current = requestAnimationFrame(animate);
  }, [camera]);
  
  const processLayout = useCallback((
    nodes: LayoutNode[],
    edges: LayoutEdge[]
  ) => {
    if (!engineRef.current) {
      return {
        screenNodes: new Map(),
        adjustedNodes: nodes,
        overlaps: [],
      };
    }
    
    const result = engineRef.current.processLayout({ nodes, edges });
    
    return {
      screenNodes: result.screenNodes,
      adjustedNodes: result.nodes,
      overlaps: result.overlapResult.overlaps,
    };
  }, []);
  
  const fitToNodes = useCallback((nodes: LayoutNode[], padding: number = 50) => {
    if (!engineRef.current) return;
    
    const newCamera = engineRef.current.fitToNodes(nodes, padding);
    animateTo(newCamera, 300, 'ease-out');
  }, [animateTo]);
  
  const setViewport = useCallback((newViewport: Viewport) => {
    setViewportState(newViewport);
    if (engineRef.current) {
      engineRef.current.setViewport(newViewport);
    }
  }, []);
  
  // Cleanup animation on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);
  
  return {
    camera,
    setCamera,
    animateTo,
    processLayout,
    fitToNodes,
    setViewport,
  };
}

/**
 * Hook to track viewport size from a container ref
 */
export function useViewportSize(
  containerRef: React.RefObject<HTMLElement>
): Viewport {
  const [viewport, setViewport] = useState<Viewport>({ width: 800, height: 600 });
  
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    const updateSize = () => {
      setViewport({
        width: container.clientWidth,
        height: container.clientHeight,
      });
    };
    
    updateSize();
    
    const observer = new ResizeObserver(updateSize);
    observer.observe(container);
    
    return () => observer.disconnect();
  }, [containerRef]);
  
  return viewport;
}
