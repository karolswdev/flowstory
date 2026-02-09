import { useCallback, useMemo, useState, useEffect } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  useReactFlow,
  type Node,
  type Edge,
} from '@xyflow/react';
import { motion, AnimatePresence } from 'motion/react';
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
  console.log('[BCDeploymentCanvas] Rendering, story:', story?.title);
  
  const { fitBounds, getNodes } = useReactFlow();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  
  console.log('[BCDeploymentCanvas] Hooks initialized, nodes count:', nodes.length);

  const currentStep = story.steps[currentStepIndex] as BCDeploymentStep | undefined;
  const focusNodeIds = new Set(currentStep?.focusNodes || []);
  const activeEdgeIds = new Set(currentStep?.activeEdges || []);
  
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

  // Build edges from story data
  useEffect(() => {
    const storyEdges: Edge[] = story.edges.map((edge) => {
      const edgeId = edge.id || `${edge.source}->${edge.target}`;
      const edgeStyle = EDGE_STYLES[edge.type];
      const isActive = activeEdgeIds.has(edgeId);

      return {
        id: edgeId,
        source: edge.source,
        target: edge.target,
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
          storyEdges.push({
            id: `${parentId}->child-${child.id}`,
            source: parentId,
            target: child.id,
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
  }, [story.edges, story.artifacts, activeEdgeIds, expandedNodes, setEdges]);

  // Focus camera on active nodes
  useEffect(() => {
    if (!currentStep?.focusNodes?.length) return;

    // Small delay to let nodes render
    const timer = setTimeout(() => {
      const allNodes = getNodes();
      const focusNodes = allNodes.filter(n => focusNodeIds.has(n.id));
      
      if (focusNodes.length === 0) {
        // If no focus nodes, fit all
        fitBounds(
          { x: -300, y: -300, width: 600, height: 600 },
          { padding: 0.2, duration: 600 }
        );
        return;
      }

      // Calculate bounds of focus nodes
      const bounds = focusNodes.reduce(
        (acc, node) => ({
          minX: Math.min(acc.minX, node.position.x),
          minY: Math.min(acc.minY, node.position.y),
          maxX: Math.max(acc.maxX, node.position.x + 150),
          maxY: Math.max(acc.maxY, node.position.y + 100),
        }),
        { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity }
      );

      // Adjust padding based on zoom level
      const zoomLevel = currentStep.zoomLevel || 1;
      const padding = zoomLevel > 1 ? 80 : 120;
      
      fitBounds(
        {
          x: bounds.minX - padding,
          y: bounds.minY - padding,
          width: bounds.maxX - bounds.minX + padding * 2,
          height: bounds.maxY - bounds.minY + padding * 2,
        },
        { padding: 0.1, duration: 600 }
      );
    }, 100);

    return () => clearTimeout(timer);
  }, [currentStep, focusNodeIds, fitBounds, getNodes]);

  // Layout mode indicator
  const layoutMode = story.layout?.mode || 'radial';

  return (
    <div className="bc-deployment-canvas" style={{ width: '100%', height: '100%' }}>
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

      {/* Step Description Overlay */}
      <AnimatePresence mode="wait">
        {currentStep && (
          <motion.div
            key={currentStepIndex}
            className="bc-step-overlay"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            style={{ '--bc-color': story.bc.color || '#4CAF50' } as React.CSSProperties}
          >
            <h3 className="bc-step-title">{currentStep.title}</h3>
            <p className="bc-step-description">{currentStep.description}</p>
            
            {/* Narration bubble (if present) */}
            {currentStep.narration && (
              <div className={`bc-narration ${currentStep.narration.position || 'right'}`}>
                {currentStep.narration.speaker && (
                  <span className="narration-speaker">{currentStep.narration.speaker}:</span>
                )}
                <span className="narration-message">{currentStep.narration.message}</span>
              </div>
            )}
            
            <div className="bc-step-progress">
              {story.steps.map((_, i) => (
                <button
                  key={i}
                  className={`bc-step-dot ${i === currentStepIndex ? 'active' : i < currentStepIndex ? 'complete' : ''}`}
                  onClick={() => onStepChange?.(i)}
                  aria-label={`Go to step ${i + 1}`}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default BCDeploymentCanvas;
