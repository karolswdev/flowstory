/**
 * Step Transition Hook
 * 
 * Orchestrates the animation sequence when transitioning between steps.
 * Based on SPEC-021: Directional Animation System
 */

import { useCallback, useMemo, useRef, useEffect } from 'react';
import { useAnimation, type AnimationControls } from 'motion/react';
import { ANIMATION_TIMING, LAYER_ORDER, type LayerName } from './config';
import {
  type NodeAnimationState,
  getNodeAnimationState,
} from './nodeVariants';
import {
  type EdgeAnimationState,
  getEdgeAnimationState,
} from './edgeVariants';

interface Position {
  x: number;
  y: number;
}

interface StoryNode {
  id: string;
  layer?: LayerName;
}

interface StoryStep {
  order: number;
  activeNodes: string[];
  activeEdges?: string[];
}

interface StepTransitionOptions {
  nodes: StoryNode[];
  positions: Map<string, Position>;
  currentStep: StoryStep | null;
  currentStepIndex: number;
}

interface NodeStateInfo {
  state: NodeAnimationState;
  entryDelay: number;
}

interface EdgeStateInfo {
  state: EdgeAnimationState;
  drawDelay: number;
}

interface StepTransitionResult {
  getNodeState: (nodeId: string) => NodeStateInfo;
  getEdgeState: (edgeId: string) => EdgeStateInfo;
  nodeHistory: Map<string, number>;
  edgeHistory: Map<string, number>;
  completedNodes: Set<string>;
  completedEdges: Set<string>;
  controls: AnimationControls;
}

/**
 * Sort nodes for entry animation
 * Order: X position (left to right), then layer (top to bottom)
 */
function sortNodesForEntry(
  nodeIds: string[],
  nodes: StoryNode[],
  positions: Map<string, Position>
): string[] {
  const nodeMap = new Map(nodes.map(n => [n.id, n]));
  
  return [...nodeIds].sort((a, b) => {
    const posA = positions.get(a);
    const posB = positions.get(b);
    const nodeA = nodeMap.get(a);
    const nodeB = nodeMap.get(b);
    
    if (!posA || !posB) return 0;
    
    // Primary: X position (left to right)
    if (posA.x !== posB.x) {
      return posA.x - posB.x;
    }
    
    // Secondary: Layer (orchestration → domain → infrastructure)
    const layerA = LAYER_ORDER[nodeA?.layer ?? 'domain'];
    const layerB = LAYER_ORDER[nodeB?.layer ?? 'domain'];
    return layerA - layerB;
  });
}

/**
 * Hook for managing step transition animations
 */
export function useStepTransition(options: StepTransitionOptions): StepTransitionResult {
  const { nodes, positions, currentStep, currentStepIndex } = options;
  
  const controls = useAnimation();
  
  // Track node/edge history (when each was last active)
  const nodeHistoryRef = useRef<Map<string, number>>(new Map());
  const edgeHistoryRef = useRef<Map<string, number>>(new Map());
  
  // Track completed items
  const completedNodesRef = useRef<Set<string>>(new Set());
  const completedEdgesRef = useRef<Set<string>>(new Set());
  
  // Calculate sorted entry order for current step
  const sortedActiveNodes = useMemo(() => {
    if (!currentStep?.activeNodes) return [];
    return sortNodesForEntry(currentStep.activeNodes, nodes, positions);
  }, [currentStep?.activeNodes, nodes, positions]);
  
  // Calculate entry delays for each node
  const nodeEntryDelays = useMemo(() => {
    const delays = new Map<string, number>();
    sortedActiveNodes.forEach((nodeId, index) => {
      delays.set(
        nodeId,
        ANIMATION_TIMING.delayChildren + (index * ANIMATION_TIMING.staggerDelay)
      );
    });
    return delays;
  }, [sortedActiveNodes]);
  
  // Update history when step changes
  useEffect(() => {
    if (!currentStep) return;
    
    // Mark current active nodes in history
    currentStep.activeNodes.forEach(nodeId => {
      nodeHistoryRef.current.set(nodeId, currentStepIndex);
      completedNodesRef.current.add(nodeId);
    });
    
    // Mark current active edges in history
    currentStep.activeEdges?.forEach(edgeId => {
      edgeHistoryRef.current.set(edgeId, currentStepIndex);
      completedEdgesRef.current.add(edgeId);
    });
  }, [currentStep, currentStepIndex]);
  
  // Get node state with entry delay
  const getNodeState = useCallback((nodeId: string): NodeStateInfo => {
    const state = getNodeAnimationState(
      nodeId,
      currentStep?.activeNodes ?? [],
      completedNodesRef.current,
      nodeHistoryRef.current,
      currentStepIndex
    );
    
    const entryDelay = nodeEntryDelays.get(nodeId) ?? 0;
    
    return { state, entryDelay };
  }, [currentStep?.activeNodes, currentStepIndex, nodeEntryDelays]);
  
  // Calculate edge delays based on when their source nodes finish entering
  const edgeDrawDelays = useMemo(() => {
    const delays = new Map<string, number>();
    const activeEdges = currentStep?.activeEdges ?? [];
    
    // All edges start after all nodes have entered
    const lastNodeDelay = sortedActiveNodes.length > 0
      ? ANIMATION_TIMING.delayChildren + 
        ((sortedActiveNodes.length - 1) * ANIMATION_TIMING.staggerDelay) +
        ANIMATION_TIMING.nodeEntryDuration
      : 0;
    
    activeEdges.forEach((edgeId, index) => {
      delays.set(
        edgeId,
        lastNodeDelay + ANIMATION_TIMING.edgeDrawDelay + (index * 50)
      );
    });
    
    return delays;
  }, [currentStep?.activeEdges, sortedActiveNodes]);
  
  // Get edge state with draw delay
  const getEdgeState = useCallback((edgeId: string): EdgeStateInfo => {
    const state = getEdgeAnimationState(
      edgeId,
      currentStep?.activeEdges ?? [],
      completedEdgesRef.current,
      edgeHistoryRef.current,
      currentStepIndex
    );
    
    const drawDelay = edgeDrawDelays.get(edgeId) ?? 0;
    
    return { state, drawDelay };
  }, [currentStep?.activeEdges, currentStepIndex, edgeDrawDelays]);
  
  return {
    getNodeState,
    getEdgeState,
    nodeHistory: nodeHistoryRef.current,
    edgeHistory: edgeHistoryRef.current,
    completedNodes: completedNodesRef.current,
    completedEdges: completedEdgesRef.current,
    controls,
  };
}

/**
 * Helper to delay execution
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Animate a complete step transition sequence
 */
export async function animateStepTransition(
  controls: AnimationControls,
  options: {
    prevActiveNodes: string[];
    nextActiveNodes: string[];
    nextActiveEdges: string[];
    sortedNodes: string[];
  }
): Promise<void> {
  const { prevActiveNodes, nextActiveNodes, sortedNodes } = options;
  
  // Phase 1: Mark previous nodes as complete (200ms)
  if (prevActiveNodes.length > 0) {
    await controls.start('complete');
    await delay(200);
  }
  
  // Phase 2: Enter new nodes (staggered)
  for (const nodeId of sortedNodes) {
    if (nextActiveNodes.includes(nodeId)) {
      controls.start(nodeId);
      await delay(ANIMATION_TIMING.staggerDelay);
    }
  }
  
  // Wait for last node to finish entering
  await delay(ANIMATION_TIMING.nodeEntryDuration - ANIMATION_TIMING.staggerDelay);
  
  // Phase 3: Draw edges
  await delay(ANIMATION_TIMING.edgeDrawDelay);
  await controls.start('edges');
  
  // Phase 4: Start glow/active animations
  await delay(ANIMATION_TIMING.edgeDrawDuration);
  await controls.start('active');
}
