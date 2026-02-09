import { useMemo, useCallback, useEffect, useRef, useState } from 'react';
import { 
  ReactFlow, 
  Background, 
  Controls, 
  MiniMap, 
  useReactFlow,
  type Node, 
  type Edge,
  type ReactFlowInstance,
} from '@xyflow/react';
import { nodeTypes } from './nodes';
import { edgeTypes, EdgeMarkers } from './edges';
import { useStory, useStoryNavigation } from '../context/StoryContext';
import type { UserStory, StoryNode, StoryEdge } from '../types/story';
import { useStoryLayout } from '../layout';
import '@xyflow/react/dist/style.css';
import './nodes/nodes.css';
import './edges/edges.css';
import './StoryCanvas.css';

/** Props for StoryCanvas */
export interface StoryCanvasProps {
  /** Optional class name */
  className?: string;
  /** Show minimap */
  showMinimap?: boolean;
  /** Show controls */
  showControls?: boolean;
  /** Show background grid */
  showBackground?: boolean;
  /** Show navigation controls */
  showNavigation?: boolean;
  /** Use new camera-centric layout system */
  useNewLayout?: boolean;
}

/** Convert story node to React Flow node format */
function toReactFlowNode(
  node: StoryNode,
  story: UserStory,
  activeNodeIds: Set<string>,
  completedNodeIds: Set<string>
): Node {
  const actor = node.actorId ? story.actors.find(a => a.id === node.actorId) : null;
  const isActive = activeNodeIds.has(node.id);
  const isComplete = completedNodeIds.has(node.id);
  const isVisible = isActive || isComplete;

  return {
    id: node.id,
    type: node.type,
    position: node.position,
    data: {
      label: node.label,
      description: node.description,
      isActive,
      isComplete,
      actorId: node.actorId,
      avatar: actor?.avatar,
      color: actor?.color,
      variant: node.data?.variant,
      size: node.size,
      effects: node.effects,
    },
    hidden: !isVisible,
  };
}

/** Calculate best edge handles based on node positions */
function getBestEdgeHandles(
  sourcePos: { x: number; y: number },
  targetPos: { x: number; y: number }
): { sourceHandle: string; targetHandle: string } {
  const dx = targetPos.x - sourcePos.x;
  const dy = targetPos.y - sourcePos.y;
  const absDx = Math.abs(dx);
  const absDy = Math.abs(dy);
  
  if (absDy > absDx) {
    // Vertical connection preferred
    if (dy > 0) {
      return { sourceHandle: 'source-bottom', targetHandle: 'target-top' };
    } else {
      return { sourceHandle: 'source-top', targetHandle: 'target-bottom' };
    }
  } else {
    // Horizontal connection preferred
    if (dx > 0) {
      return { sourceHandle: 'source-right', targetHandle: 'target-left' };
    } else {
      return { sourceHandle: 'source-left', targetHandle: 'target-right' };
    }
  }
}

/** Convert story edge to React Flow edge format */
function toReactFlowEdge(
  edge: StoryEdge,
  activeEdgeIds: Set<string>,
  completedEdgeIds: Set<string>,
  nodePositions: Map<string, { x: number; y: number }>
): Edge {
  const isActive = activeEdgeIds.has(edge.id);
  const isComplete = completedEdgeIds.has(edge.id);
  const isVisible = isActive || isComplete;

  // Check for explicit anchors first
  let sourceHandle: string | undefined;
  let targetHandle: string | undefined;
  
  const srcAnchor = (edge as any).sourceAnchor;
  const tgtAnchor = (edge as any).targetAnchor;
  
  if (srcAnchor && srcAnchor !== 'auto') {
    sourceHandle = `source-${srcAnchor}`;
  }
  if (tgtAnchor && tgtAnchor !== 'auto') {
    targetHandle = `target-${tgtAnchor}`;
  }
  
  // Auto-calculate if not explicitly set
  if (!sourceHandle || !targetHandle) {
    const sourcePos = nodePositions.get(edge.source);
    const targetPos = nodePositions.get(edge.target);
    if (sourcePos && targetPos) {
      const auto = getBestEdgeHandles(sourcePos, targetPos);
      if (!sourceHandle) sourceHandle = auto.sourceHandle;
      if (!targetHandle) targetHandle = auto.targetHandle;
    }
  }

  return {
    id: edge.id,
    source: edge.source,
    target: edge.target,
    sourceHandle,
    targetHandle,
    type: edge.type,
    data: {
      label: edge.label,
      isActive,
    },
    hidden: !isVisible,
    animated: edge.animated,
  };
}

/** Navigation controls component */
function NavigationControls() {
  const { currentStepIndex, totalSteps, nextStep, prevStep, canGoNext, canGoPrev } = useStoryNavigation();

  return (
    <div className="story-navigation" data-testid="story-navigation">
      <button
        onClick={prevStep}
        disabled={!canGoPrev}
        className="nav-button"
        data-testid="prev-step-button"
        aria-label="Previous step"
      >
        ← Prev
      </button>
      <span className="step-indicator" data-testid="step-indicator">
        Step {currentStepIndex + 1} / {totalSteps}
      </span>
      <button
        onClick={nextStep}
        disabled={!canGoNext}
        className="nav-button"
        data-testid="next-step-button"
        aria-label="Next step"
      >
        Next →
      </button>
    </div>
  );
}

/** Auto-focus component that centers camera on active nodes */
function AutoFocus({ activeNodeIds, story }: { activeNodeIds: Set<string>; story: UserStory }) {
  const { fitView, setCenter } = useReactFlow();
  const prevActiveRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (activeNodeIds.size === 0) return;

    // Find newly activated nodes (not in previous set)
    const newlyActive = [...activeNodeIds].filter(id => !prevActiveRef.current.has(id));
    prevActiveRef.current = new Set(activeNodeIds);

    if (newlyActive.length > 0) {
      // Get positions of newly active nodes
      const activeNodes = story.nodes.filter(n => newlyActive.includes(n.id));
      
      if (activeNodes.length > 0) {
        // Calculate center of newly active nodes
        const sumX = activeNodes.reduce((sum, n) => sum + n.position.x, 0);
        const sumY = activeNodes.reduce((sum, n) => sum + n.position.y, 0);
        const centerX = sumX / activeNodes.length + 75; // offset for node width
        const centerY = sumY / activeNodes.length + 40; // offset for node height

        // Smooth pan to center on new nodes
        setCenter(centerX, centerY, { duration: 600, zoom: 1 });
      }
    } else {
      // If no new nodes, fit all visible nodes
      setTimeout(() => {
        fitView({ 
          padding: 0.3, 
          duration: 500,
          nodes: [...activeNodeIds].map(id => ({ id })),
        });
      }, 100);
    }
  }, [activeNodeIds, story, fitView, setCenter]);

  return null;
}

/** Main canvas content (needs to be inside ReactFlow provider) */
function CanvasContent({
  story,
  nodes,
  edges,
  activeNodeIds,
  showMinimap,
  showControls,
  showBackground,
  useNewLayout,
}: {
  story: UserStory;
  nodes: Node[];
  edges: Edge[];
  activeNodeIds: Set<string>;
  showMinimap: boolean;
  showControls: boolean;
  showBackground: boolean;
  useNewLayout: boolean;
}) {
  const reactFlowInstance = useRef<ReactFlowInstance | null>(null);

  const onInit = useCallback((instance: ReactFlowInstance) => {
    reactFlowInstance.current = instance;
    // Only auto-fit in legacy mode - new layout handles camera
    if (!useNewLayout) {
      setTimeout(() => {
        instance.fitView({ padding: 0.3, duration: 300 });
      }, 100);
    }
  }, [useNewLayout]);

  return (
    <>
      {/* Only use AutoFocus in legacy mode - new layout has its own camera control */}
      {!useNewLayout && <AutoFocus activeNodeIds={activeNodeIds} story={story} />}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onInit={onInit}
        fitView={!useNewLayout}
        fitViewOptions={{ padding: 0.3 }}
        proOptions={{ hideAttribution: true }}
        minZoom={0.3}
        maxZoom={2}
        defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
      >
        <EdgeMarkers />
        {showBackground && <Background gap={20} size={1} />}
        {showControls && <Controls showInteractive={false} />}
        {showMinimap && (
          <MiniMap 
            nodeColor={(node) => {
              if (node.data?.isActive) return 'var(--color-brand-primary)';
              if (node.data?.isComplete) return 'var(--color-status-success)';
              return 'var(--color-surface-tertiary)';
            }}
            maskColor="rgba(0,0,0,0.1)"
          />
        )}
      </ReactFlow>
    </>
  );
}

/** Main story canvas component */
export function StoryCanvas({
  className = '',
  showMinimap = true,
  showControls = true,
  showBackground = true,
  showNavigation = true,
  useNewLayout = false,
}: StoryCanvasProps) {
  const { story, activeNodeIds, activeEdgeIds, completedNodeIds, completedEdgeIds, isLoaded, error, currentStep } = useStory();
  const containerRef = useRef<HTMLDivElement>(null);
  const [viewport, setViewport] = useState({ width: 800, height: 600 });

  // Track container size for layout system
  useEffect(() => {
    if (!containerRef.current) return;
    const updateSize = () => {
      if (containerRef.current) {
        setViewport({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };
    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // New layout system
  const layoutResult = useStoryLayout({
    story,
    currentStep: currentStep || null,
    activeNodeIds,
    completedNodeIds,
    activeEdgeIds,
    completedEdgeIds,
    viewport,
    enabled: useNewLayout,
  });

  // Convert story data to React Flow format (legacy mode)
  const legacyNodes = useMemo(() => {
    if (!story || useNewLayout) return [];
    return story.nodes.map(node =>
      toReactFlowNode(node, story, activeNodeIds, completedNodeIds)
    );
  }, [story, activeNodeIds, completedNodeIds, useNewLayout]);

  const legacyEdges = useMemo(() => {
    if (!story || useNewLayout) return [];
    
    // Build position map for smart handle selection
    const nodePositions = new Map<string, { x: number; y: number }>();
    for (const node of story.nodes) {
      nodePositions.set(node.id, node.position);
    }
    
    return story.edges.map(edge =>
      toReactFlowEdge(edge, activeEdgeIds, completedEdgeIds, nodePositions)
    );
  }, [story, activeEdgeIds, completedEdgeIds, useNewLayout]);

  // Use layout system results or legacy conversion
  const nodes = useNewLayout ? layoutResult.nodes : legacyNodes;
  const edges = useNewLayout ? layoutResult.edges : legacyEdges;

  if (error) {
    return (
      <div className={`story-canvas story-canvas-error ${className}`} data-testid="story-canvas-error">
        <p>Error: {error}</p>
      </div>
    );
  }

  if (!isLoaded || !story) {
    return (
      <div className={`story-canvas story-canvas-empty ${className}`} data-testid="story-canvas-empty">
        <p>No story loaded</p>
      </div>
    );
  }

  return (
    <div className={`story-canvas ${className}`} data-testid="story-canvas" ref={containerRef}>
      {showNavigation && <NavigationControls />}
      {useNewLayout && layoutResult.overlaps.length > 0 && (
        <div className="layout-overlap-warning" style={{
          position: 'absolute',
          top: 8,
          right: 8,
          background: 'var(--color-status-warning)',
          color: 'white',
          padding: '4px 8px',
          borderRadius: 4,
          fontSize: 12,
          zIndex: 10,
        }}>
          ⚠️ {layoutResult.overlaps.length} overlap(s) adjusted
        </div>
      )}
      <div className="story-canvas-flow">
        <CanvasContent
          story={story}
          nodes={nodes}
          edges={edges}
          activeNodeIds={activeNodeIds}
          showMinimap={showMinimap}
          showControls={showControls}
          showBackground={showBackground}
          useNewLayout={useNewLayout}
        />
      </div>
    </div>
  );
}

export default StoryCanvas;
