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
import type { BCDeploymentStory, BCDeploymentStep } from '../../schemas/bc-deployment';
import { ARTIFACT_COLORS, EDGE_STYLES, BC_DEPLOYMENT_LAYOUT } from '../../schemas/bc-deployment';
import './bc-deployment.css';

interface BCDeploymentCanvasProps {
  story: BCDeploymentStory;
  currentStepIndex: number;
  onStepChange?: (step: number) => void;
}

const nodeTypes = {
  'bc-core': BCCoreNode,
  'artifact': ArtifactNode,
};

/**
 * Calculate radial positions for artifacts around the BC core
 */
function calculateRadialLayout(
  artifactCount: number,
  radius: number,
  startAngle: number = -90
): Array<{ x: number; y: number }> {
  const positions: Array<{ x: number; y: number }> = [];
  const angleStep = 360 / artifactCount;

  for (let i = 0; i < artifactCount; i++) {
    const angle = (startAngle + i * angleStep) * (Math.PI / 180);
    positions.push({
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
    });
  }

  return positions;
}

/**
 * BCDeploymentCanvas - Main canvas for BC deployment visualization
 */
export function BCDeploymentCanvas({ 
  story, 
  currentStepIndex,
  onStepChange 
}: BCDeploymentCanvasProps) {
  const { fitBounds, getNodes } = useReactFlow();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const currentStep = story.steps[currentStepIndex] as BCDeploymentStep | undefined;
  const focusNodeIds = new Set(currentStep?.focusNodes || []);
  const activeEdgeIds = new Set(currentStep?.activeEdges || []);

  // Build nodes from story data
  useEffect(() => {
    const { innerRadius, outerRadius, coreSize, artifactSize, staggerDelay } = BC_DEPLOYMENT_LAYOUT;
    const artifactPositions = calculateRadialLayout(
      story.artifacts.length,
      story.artifacts.length <= 6 ? innerRadius : outerRadius
    );

    const bcNode: Node = {
      id: story.bc.id,
      type: 'bc-core',
      position: { x: 0, y: 0 },
      data: {
        bc: story.bc,
        isActive: focusNodeIds.has(story.bc.id),
        isComplete: currentStepIndex > 0 && !focusNodeIds.has(story.bc.id),
      },
    };

    const artifactNodes: Node[] = story.artifacts.map((artifact, index) => ({
      id: artifact.id,
      type: 'artifact',
      position: {
        x: artifactPositions[index].x - artifactSize / 2,
        y: artifactPositions[index].y - artifactSize / 2,
      },
      data: {
        ...artifact,
        isActive: focusNodeIds.has(artifact.id),
        isComplete: currentStepIndex > 0 && !focusNodeIds.has(artifact.id),
        enterDelay: index * staggerDelay,
      },
    }));

    setNodes([bcNode, ...artifactNodes]);
  }, [story, currentStepIndex, focusNodeIds, setNodes]);

  // Build edges from story data
  useEffect(() => {
    const storyEdges: Edge[] = story.edges.map((edge) => {
      const edgeStyle = EDGE_STYLES[edge.type];
      const isActive = activeEdgeIds.has(edge.id);

      return {
        id: edge.id,
        source: edge.source,
        target: edge.target,
        type: 'default',
        animated: isActive,
        label: edge.label,
        className: `bc-deployment-edge ${isActive ? 'edge-active' : ''}`,
        style: {
          stroke: edgeStyle.stroke,
          strokeDasharray: edgeStyle.dash || 'none',
          strokeWidth: isActive ? 3 : 2,
        },
        labelStyle: {
          fontSize: 10,
          fontWeight: 600,
        },
        labelBgStyle: {
          fill: 'white',
          stroke: edgeStyle.stroke,
          strokeWidth: 1,
        },
      };
    });

    setEdges(storyEdges);
  }, [story.edges, activeEdgeIds, setEdges]);

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

      const padding = currentStep.zoomLevel > 1 ? 100 : 150;
      
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
            const artifact = story.artifacts.find(a => a.id === node.id);
            return artifact ? ARTIFACT_COLORS[artifact.artifactType] : '#78909C';
          }}
          maskColor="rgba(0, 0, 0, 0.1)"
          style={{ width: 120, height: 80 }}
        />
      </ReactFlow>

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
