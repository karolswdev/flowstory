/**
 * FlowStory Layout System - Story Layout Hook
 * 
 * Integrates the layout system with story data for use in StoryCanvas.
 */

import { useMemo, useCallback, useState, useEffect, useRef } from 'react';
import type { Node, Edge } from '@xyflow/react';
import type { UserStory, StoryNode, StoryEdge, StoryStep } from '../types/story';
import type { Camera, LayoutNode, LayoutEdge, Viewport, LayoutConfig } from './types';
import { DEFAULT_CAMERA, DEFAULT_LAYOUT_CONFIG } from './types';
import { worldToScreen, interpolateCamera, fitNodesToView } from './camera';
import { detectAndResolveOverlaps, applyAdjustments } from './overlap';

// Default node sizes by type
const NODE_SIZES: Record<string, { width: number; height: number }> = {
  actor: { width: 80, height: 80 },
  action: { width: 140, height: 50 },
  system: { width: 160, height: 60 },
  decision: { width: 100, height: 100 },
  event: { width: 150, height: 50 },
  state: { width: 120, height: 40 },
  start: { width: 40, height: 40 },
  end: { width: 40, height: 40 },
  default: { width: 120, height: 50 },
};

export interface UseStoryLayoutOptions {
  /** Story data */
  story: UserStory | null;
  /** Current step */
  currentStep: StoryStep | null;
  /** Active node IDs */
  activeNodeIds: Set<string>;
  /** Completed node IDs */
  completedNodeIds: Set<string>;
  /** Active edge IDs */
  activeEdgeIds: Set<string>;
  /** Completed edge IDs */
  completedEdgeIds: Set<string>;
  /** Viewport dimensions */
  viewport: Viewport;
  /** Layout configuration override */
  config?: Partial<LayoutConfig>;
  /** Enable the new layout system (false = legacy behavior) */
  enabled?: boolean;
}

export interface UseStoryLayoutResult {
  /** React Flow nodes with screen positions */
  nodes: Node[];
  /** React Flow edges */
  edges: Edge[];
  /** Current camera state */
  camera: Camera;
  /** Detected overlaps */
  overlaps: [string, string][];
  /** Set camera */
  setCamera: (camera: Camera) => void;
  /** Fit view to show all visible nodes */
  fitView: () => void;
}

/**
 * Hook to process story data through the layout system
 */
export function useStoryLayout({
  story,
  currentStep,
  activeNodeIds,
  completedNodeIds,
  activeEdgeIds,
  completedEdgeIds,
  viewport,
  config = {},
  enabled = true,
}: UseStoryLayoutOptions): UseStoryLayoutResult {
  // Camera state
  const [camera, setCamera] = useState<Camera>(() => {
    // Check if story has camera config
    const storyCamera = (story as any)?.camera;
    if (storyCamera) {
      return {
        center: storyCamera.center || [0, 0],
        zoom: storyCamera.zoom || 1,
        bounds: storyCamera.bounds,
      };
    }
    return DEFAULT_CAMERA;
  });

  // Layout config
  const layoutConfig = useMemo(() => ({
    ...DEFAULT_LAYOUT_CONFIG,
    ...config,
  }), [config]);

  // Convert story nodes to layout nodes
  const layoutNodes = useMemo((): LayoutNode[] => {
    if (!story) return [];

    return story.nodes.map(node => {
      const size = NODE_SIZES[node.type] || NODE_SIZES.default;
      const allowOverlap = (node.data as any)?.allowOverlap ?? false;

      return {
        id: node.id,
        position: [node.position.x, node.position.y] as [number, number],
        size,
        allowOverlap,
      };
    });
  }, [story]);

  // Process overlaps
  const { adjustedNodes, overlaps } = useMemo(() => {
    if (!enabled || !layoutConfig.overlapDetection) {
      return { adjustedNodes: layoutNodes, overlaps: [] };
    }

    const result = detectAndResolveOverlaps(
      layoutNodes,
      layoutConfig.overlapStrategy,
      layoutConfig.overlapPadding
    );

    const adjusted = result.adjustments.size > 0
      ? applyAdjustments(layoutNodes, result.adjustments)
      : layoutNodes;

    return { adjustedNodes: adjusted, overlaps: result.overlaps };
  }, [layoutNodes, layoutConfig, enabled]);

  // Convert to React Flow nodes
  const nodes = useMemo((): Node[] => {
    if (!story) return [];

    const nodeMap = new Map(adjustedNodes.map(n => [n.id, n]));

    return story.nodes.map(storyNode => {
      const layoutNode = nodeMap.get(storyNode.id);
      const actor = storyNode.actorId 
        ? story.actors.find(a => a.id === storyNode.actorId) 
        : null;

      const isActive = activeNodeIds.has(storyNode.id);
      const isComplete = completedNodeIds.has(storyNode.id);
      const isVisible = isActive || isComplete;

      // Get position - use layout-adjusted position if available
      let position = storyNode.position;
      if (enabled && layoutNode) {
        if (viewport.width > 0 && viewport.height > 0) {
          // Convert world to screen coordinates
          const screenPos = worldToScreen(layoutNode.position, camera, viewport);
          position = { x: screenPos[0], y: screenPos[1] };
        } else {
          // Fallback to layout position
          position = { x: layoutNode.position[0], y: layoutNode.position[1] };
        }
      }

      return {
        id: storyNode.id,
        type: storyNode.type,
        position,
        data: {
          label: storyNode.label,
          description: storyNode.description,
          isActive,
          isComplete,
          actorId: storyNode.actorId,
          avatar: actor?.avatar,
          color: actor?.color,
          variant: storyNode.data?.variant,
          effects: storyNode.effects,
        },
        hidden: !isVisible,
      };
    });
  }, [story, adjustedNodes, activeNodeIds, completedNodeIds, camera, viewport, enabled]);

  // Convert to React Flow edges with smart handle selection
  const edges = useMemo((): Edge[] => {
    if (!story) return [];

    // Build position map for handle calculation
    const positionMap = new Map<string, { x: number; y: number }>();
    for (const node of adjustedNodes) {
      positionMap.set(node.id, { x: node.position[0], y: node.position[1] });
    }

    return story.edges.map(storyEdge => {
      const isActive = activeEdgeIds.has(storyEdge.id);
      const isComplete = completedEdgeIds.has(storyEdge.id);
      const isVisible = isActive || isComplete;

      // Calculate handles - use explicit anchors if provided, otherwise auto-calculate
      const sourcePos = positionMap.get(storyEdge.source);
      const targetPos = positionMap.get(storyEdge.target);
      
      let sourceHandle: string | undefined;
      let targetHandle: string | undefined;
      
      // Check for explicit anchors first
      const srcAnchor = (storyEdge as any).sourceAnchor;
      const tgtAnchor = (storyEdge as any).targetAnchor;
      
      if (srcAnchor && srcAnchor !== 'auto') {
        sourceHandle = `source-${srcAnchor}`;
      }
      if (tgtAnchor && tgtAnchor !== 'auto') {
        targetHandle = `target-${tgtAnchor}`;
      }
      
      // Auto-calculate if not explicitly set
      if ((!sourceHandle || !targetHandle) && sourcePos && targetPos) {
        const dx = targetPos.x - sourcePos.x;
        const dy = targetPos.y - sourcePos.y;
        const absDx = Math.abs(dx);
        const absDy = Math.abs(dy);
        
        if (absDy > absDx) {
          // Vertical connection preferred
          if (dy > 0) {
            if (!sourceHandle) sourceHandle = 'source-bottom';
            if (!targetHandle) targetHandle = 'target-top';
          } else {
            if (!sourceHandle) sourceHandle = 'source-top';
            if (!targetHandle) targetHandle = 'target-bottom';
          }
        } else {
          // Horizontal connection preferred
          if (dx > 0) {
            if (!sourceHandle) sourceHandle = 'source-right';
            if (!targetHandle) targetHandle = 'target-left';
          } else {
            if (!sourceHandle) sourceHandle = 'source-left';
            if (!targetHandle) targetHandle = 'target-right';
          }
        }
      }

      return {
        id: storyEdge.id,
        source: storyEdge.source,
        target: storyEdge.target,
        sourceHandle,
        targetHandle,
        type: storyEdge.type,
        data: {
          label: storyEdge.label,
          isActive,
        },
        hidden: !isVisible,
        animated: storyEdge.animated,
      };
    });
  }, [story, adjustedNodes, activeEdgeIds, completedEdgeIds]);

  // Fit view to visible nodes
  const fitView = useCallback(() => {
    const visibleNodes = adjustedNodes.filter(n => 
      activeNodeIds.has(n.id) || completedNodeIds.has(n.id)
    );

    if (visibleNodes.length === 0) return;

    const positions = visibleNodes.map(n => n.position);
    const sizes = visibleNodes.map(n => n.size);

    const newCamera = fitNodesToView(positions, sizes, viewport, 50);
    setCamera(newCamera);
  }, [adjustedNodes, activeNodeIds, completedNodeIds, viewport]);

  // Update camera when step changes (if step has camera override)
  useEffect(() => {
    if (!enabled || !currentStep) return;

    const stepCamera = (currentStep as any)?.camera;
    if (stepCamera) {
      const targetCamera: Camera = {
        center: stepCamera.center || camera.center,
        zoom: stepCamera.zoom ?? camera.zoom,
        bounds: stepCamera.bounds || camera.bounds,
      };

      // Animate to new camera position
      const duration = stepCamera.transition || 300;
      const startCamera = camera;
      const startTime = performance.now();

      const animate = () => {
        const elapsed = performance.now() - startTime;
        const progress = Math.min(1, elapsed / duration);

        if (progress < 1) {
          const interpolated = interpolateCamera(startCamera, targetCamera, progress, 'ease-out');
          setCamera(interpolated);
          requestAnimationFrame(animate);
        } else {
          setCamera(targetCamera);
        }
      };

      requestAnimationFrame(animate);
    }
  }, [currentStep, enabled]);

  return {
    nodes,
    edges,
    camera,
    overlaps,
    setCamera,
    fitView,
  };
}
