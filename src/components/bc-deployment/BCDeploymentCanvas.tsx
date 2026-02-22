import { useCallback, useMemo, useState, useEffect } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
} from '@xyflow/react';
import { StepOverlay } from '../shared';
import { BCCoreNode } from './BCCoreNode';
import { ArtifactNode } from './ArtifactNode';
import { ChildArtifactNode } from './ChildArtifactNode';
import type { BCDeploymentStory, BCDeploymentStep } from '../../schemas/bc-deployment';
import { ARTIFACT_COLORS, EDGE_STYLES, BC_DEPLOYMENT_LAYOUT } from '../../schemas/bc-deployment';
import {
  calculateBCDeploymentLayout,
  flattenPositions,
  type PositionedNode
} from '../../utils/layout/bcDeploymentLayout';
import { getSmartHandles, type NodeRect } from '../nodes/NodeHandles';
import { NODE_DIMENSIONS } from '../nodes/dimensions';
import { useAutoFocus } from '../../hooks/useCameraController';
import './bc-deployment.css';

interface BCDeploymentCanvasProps {
  story: BCDeploymentStory;
  currentStepIndex: number;
  onStepChange?: (step: number) => void;
}

const nodeTypes = {
  'bc-core': BCCoreNode,
  'artifact': ArtifactNode,
  'child-artifact': ChildArtifactNode,
};

/**
 * BCDeploymentCanvas - Main canvas for BC deployment visualization
 * 
 * Features:
 * - Three layout modes: radial (default), hierarchical, layered
 * - Expandable artifact nodes with child artifacts
 * - Step-based focus and zoom
 * - Animated transitions
 */
export function BCDeploymentCanvas({ 
  story, 
  currentStepIndex,
  onStepChange 
}: BCDeploymentCanvasProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  const currentStep = story.steps[currentStepIndex] as BCDeploymentStep | undefined;
  
  // Memoize Sets to prevent infinite render loops
  const focusNodeIds = useMemo(
    () => new Set(currentStep?.focusNodes || []),
    [currentStep?.focusNodes]
  );
  const activeEdgeIds = useMemo(
    () => new Set(currentStep?.activeEdges || []),
    [currentStep?.activeEdges]
  );
  
  // Auto-expand nodes specified in step
  useEffect(() => {
    if (currentStep?.expandNodes) {
      setExpandedNodes(prev => {
        const next = new Set(prev);
        currentStep.expandNodes?.forEach(id => next.add(id));
        return next;
      });
    }
  }, [currentStep?.expandNodes]);

  // Toggle expand state for an artifact
  const toggleExpand = useCallback((nodeId: string) => {
    setExpandedNodes(prev => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  }, []);

  // Calculate layout positions
  const positions = useMemo(() => {
    return calculateBCDeploymentLayout(story, {
      mode: story.layout?.mode,
      centerSize: story.layout?.centerSize,
      ringSpacing: story.layout?.ringSpacing,
      childLayout: story.layout?.childLayout,
    });
  }, [story]);

  // Build nodes from story data and layout
  useEffect(() => {
    const { staggerDelay } = BC_DEPLOYMENT_LAYOUT;
    const resultNodes: Node[] = [];

    // BC Core node
    const bcPosition = positions.get(story.bc.id);
    if (bcPosition) {
      resultNodes.push({
        id: story.bc.id,
        type: 'bc-core',
        position: { x: bcPosition.x, y: bcPosition.y },
        data: {
          bc: story.bc,
          isActive: focusNodeIds.has(story.bc.id),
          isComplete: currentStepIndex > 0 && !focusNodeIds.has(story.bc.id),
        },
      });
    }

    // Artifact nodes
    story.artifacts.forEach((artifact, index) => {
      const position = positions.get(artifact.id);
      if (!position) return;

      const isExpanded = expandedNodes.has(artifact.id);

      resultNodes.push({
        id: artifact.id,
        type: 'artifact',
        position: { x: position.x, y: position.y },
        data: {
          ...artifact,
          isActive: focusNodeIds.has(artifact.id),
          isComplete: currentStepIndex > 0 && !focusNodeIds.has(artifact.id),
          enterDelay: index * staggerDelay,
          isExpanded,
          onToggleExpand: () => toggleExpand(artifact.id),
        },
      });

      // Child nodes (only when expanded)
      if (isExpanded && position.children) {
        position.children.forEach((childPos, childIndex) => {
          const childData = artifact.children?.find(c => c.id === childPos.id);
          if (!childData) return;

          resultNodes.push({
            id: childPos.id,
            type: 'child-artifact',
            position: { x: childPos.x, y: childPos.y },
            parentId: artifact.id, // React Flow parent grouping
            data: {
              ...childData,
              isActive: focusNodeIds.has(childPos.id),
              isComplete: currentStepIndex > 0 && !focusNodeIds.has(childPos.id),
              enterDelay: (index * staggerDelay) + (childIndex + 1) * 50,
              parentId: artifact.id,
            },
          });
        });
      }
    });

    setNodes(resultNodes);
  }, [story, positions, currentStepIndex, focusNodeIds, expandedNodes, toggleExpand, setNodes]);

  // Build node rect lookup for smart handles
  const nodeRects = useMemo(() => {
    const rects = new Map<string, NodeRect>();
    // BC core
    const bcPos = positions.get(story.bc.id);
    if (bcPos) {
      rects.set(story.bc.id, { x: bcPos.x, y: bcPos.y, ...NODE_DIMENSIONS.bcCore });
    }
    // Artifacts
    story.artifacts.forEach(artifact => {
      const pos = positions.get(artifact.id);
      if (pos) {
        rects.set(artifact.id, { x: pos.x, y: pos.y, ...NODE_DIMENSIONS.artifact });
      }
      // Children
      if (pos && (pos as any).children) {
        for (const childPos of (pos as any).children) {
          rects.set(childPos.id, { x: childPos.x + pos.x, y: childPos.y + pos.y, ...NODE_DIMENSIONS.childArtifact });
        }
      }
    });
    return rects;
  }, [positions, story.bc.id, story.artifacts]);

  // Build edges from story data
  useEffect(() => {
    const storyEdges: Edge[] = story.edges.map((edge) => {
      const edgeId = edge.id || `${edge.source}->${edge.target}`;
      const edgeStyle = EDGE_STYLES[edge.type];
      const isActive = activeEdgeIds.has(edgeId);

      const sourceRect = nodeRects.get(edge.source);
      const targetRect = nodeRects.get(edge.target);
      const [sourceHandle, targetHandle] = sourceRect && targetRect
        ? getSmartHandles(sourceRect, targetRect)
        : ['source-right', 'target-left'];

      return {
        id: edgeId,
        source: edge.source,
        target: edge.target,
        sourceHandle,
        targetHandle,
        type: 'default',
        animated: isActive || edge.animated,
        label: edge.label,
        className: `bc-deployment-edge ${isActive ? 'edge-active' : ''}`,
        style: {
          stroke: edgeStyle.stroke,
          strokeDasharray: edgeStyle.dash || 'none',
          strokeWidth: isActive ? 3 : 2,
        },
        labelStyle: {
          fontSize: 11,
          fontWeight: 600,
        },
        labelBgStyle: {
          fill: 'white',
          stroke: edgeStyle.stroke,
          strokeWidth: 1,
        },
      };
    });

    // Add edges for expanded children (parent -> child)
    expandedNodes.forEach(parentId => {
      const parent = story.artifacts.find(a => a.id === parentId);
      if (parent?.children) {
        parent.children.forEach(child => {
          const sourceRect = nodeRects.get(parentId);
          const targetRect = nodeRects.get(child.id);
          const [sourceHandle, targetHandle] = sourceRect && targetRect
            ? getSmartHandles(sourceRect, targetRect)
            : ['source-bottom', 'target-top'];

          storyEdges.push({
            id: `${parentId}->child-${child.id}`,
            source: parentId,
            target: child.id,
            sourceHandle,
            targetHandle,
            type: 'default',
            className: 'bc-deployment-edge child-edge',
            style: {
              stroke: '#B0BEC5',
              strokeDasharray: '4,4',
              strokeWidth: 1.5,
            },
          });
        });
      }
    });

    setEdges(storyEdges);
  }, [story.edges, story.artifacts, activeEdgeIds, expandedNodes, nodeRects, setEdges]);

  // Active node IDs for camera auto-focus
  const activeNodeIds = useMemo(
    () => [...focusNodeIds],
    [focusNodeIds],
  );

  // Layout mode indicator
  const layoutMode = story.layout?.mode || 'radial';

  return (
    <div className="bc-deployment-canvas" style={{ width: '100%', height: '100%', minHeight: '600px' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        minZoom={0.3}
        maxZoom={2}
        attributionPosition="bottom-left"
      >
        <Background color="#ccc" gap={20} />
        <Controls position="bottom-left" />
        <BCDeploymentCameraController activeNodeIds={activeNodeIds} />
        <MiniMap 
          nodeColor={(node) => {
            if (node.type === 'bc-core') return story.bc.color || '#4CAF50';
            if (node.type === 'child-artifact') return '#B0BEC5';
            const artifact = story.artifacts.find(a => a.id === node.id);
            return artifact ? ARTIFACT_COLORS[artifact.artifactType] : '#78909C';
          }}
          maskColor="rgba(0, 0, 0, 0.1)"
          style={{ width: 120, height: 80 }}
        />
      </ReactFlow>

      {/* Layout mode badge */}
      <div className="bc-layout-badge">
        {layoutMode === 'radial' && '⭕'}
        {layoutMode === 'hierarchical' && '🌲'}
        {layoutMode === 'layered' && '📊'}
        <span>{layoutMode}</span>
      </div>

      {currentStep && (
        <StepOverlay
          stepIndex={currentStepIndex}
          totalSteps={story.steps.length}
          title={currentStep.title}
          description={currentStep.description}
          narration={currentStep.narration}
          accentColor={story.bc.color || '#22c55e'}
          onStepChange={onStepChange}
          showDots
        />
      )}
    </div>
  );
}

/**
 * Inner component for camera auto-focus.
 * Must be a child of <ReactFlow> to access useReactFlow().
 */
function BCDeploymentCameraController({ activeNodeIds }: { activeNodeIds: string[] }) {
  useAutoFocus(activeNodeIds, {
    padding: 120,
    duration: 600,
    maxZoom: 1.3,
    minZoom: 0.3,
  });
  return null;
}

export default BCDeploymentCanvas;
