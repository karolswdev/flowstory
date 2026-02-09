import { useMemo, useCallback, useEffect, useRef } from 'react';
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
      effects: node.effects, // Pass effects configuration
    },
    hidden: !isVisible,
  };
}

/** Convert story edge to React Flow edge format */
function toReactFlowEdge(
  edge: StoryEdge,
  activeEdgeIds: Set<string>,
  completedEdgeIds: Set<string>
): Edge {
  const isActive = activeEdgeIds.has(edge.id);
  const isComplete = completedEdgeIds.has(edge.id);
  const isVisible = isActive || isComplete;

  return {
    id: edge.id,
    source: edge.source,
    target: edge.target,
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
}: {
  story: UserStory;
  nodes: Node[];
  edges: Edge[];
  activeNodeIds: Set<string>;
  showMinimap: boolean;
  showControls: boolean;
  showBackground: boolean;
}) {
  const reactFlowInstance = useRef<ReactFlowInstance | null>(null);

  const onInit = useCallback((instance: ReactFlowInstance) => {
    reactFlowInstance.current = instance;
    // Initial fit with padding
    setTimeout(() => {
      instance.fitView({ padding: 0.3, duration: 300 });
    }, 100);
  }, []);

  return (
    <>
      <AutoFocus activeNodeIds={activeNodeIds} story={story} />
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onInit={onInit}
        fitView
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
}: StoryCanvasProps) {
  const { story, activeNodeIds, activeEdgeIds, completedNodeIds, completedEdgeIds, isLoaded, error } = useStory();

  // Convert story data to React Flow format
  const nodes = useMemo(() => {
    if (!story) return [];
    return story.nodes.map(node =>
      toReactFlowNode(node, story, activeNodeIds, completedNodeIds)
    );
  }, [story, activeNodeIds, completedNodeIds]);

  const edges = useMemo(() => {
    if (!story) return [];
    return story.edges.map(edge =>
      toReactFlowEdge(edge, activeEdgeIds, completedEdgeIds)
    );
  }, [story, activeEdgeIds, completedEdgeIds]);

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
    <div className={`story-canvas ${className}`} data-testid="story-canvas">
      {showNavigation && <NavigationControls />}
      <div className="story-canvas-flow">
        <CanvasContent
          story={story}
          nodes={nodes}
          edges={edges}
          activeNodeIds={activeNodeIds}
          showMinimap={showMinimap}
          showControls={showControls}
          showBackground={showBackground}
        />
      </div>
    </div>
  );
}

export default StoryCanvas;
