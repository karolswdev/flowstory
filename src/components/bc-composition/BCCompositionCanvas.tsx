/**
 * BC Composition Canvas
 *
 * Progressive reveal visualization:
 * 1. Start with ONLY the core node
 * 2. Each step reveals additional elements one-by-one
 * 3. Revealed nodes stay visible (cumulative)
 * 4. Elements can expand to show nested children
 */

import { useCallback, useMemo, useState, useEffect, useRef } from 'react';
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
import { motion } from 'motion/react';
import { StepOverlay, EdgeReadinessGate } from '../shared';
import type {
  BCCompositionStory,
  Step as CompositionStep,
  RevealEffect,
} from '../../schemas/bc-composition';
import { DEFAULT_TYPE_COLORS, DEFAULT_EFFECTS } from '../../schemas/bc-composition';
import { NodeHandles, getSmartHandles, type NodeRect } from '../nodes/NodeHandles';
import { NODE_DIMENSIONS } from '../nodes/dimensions';
import { useAutoFocus } from '../../hooks/useCameraController';
import './bc-composition.css';

interface BCCompositionCanvasProps {
  story: BCCompositionStory;
  currentStepIndex: number;
  onStepChange?: (step: number) => void;
  hideOverlay?: boolean;
}

// Node type components (will create separately)
const nodeTypes = {
  'core': CoreNode,
  'element': ElementNode,
  'child': ChildNode,
};

/**
 * Core Node Component - The central concept
 */
function CoreNode({ data, selected }: { data: any; selected: boolean }) {
  const isActive = data.isActive;
  const isRevealed = data.isRevealed;

  if (!isRevealed) return null;

  return (
    <motion.div
      className={`bc-core-node ${isActive ? 'node-active' : ''}`}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      style={{
        borderColor: data.color || '#4CAF50',
        background: `${data.color || '#4CAF50'}15`,
      }}
    >
      {data.icon && <span className="core-icon">{data.icon}</span>}
      <span className="core-name">{data.name}</span>
      {data.description && (
        <span className="core-description">{data.description}</span>
      )}
      <NodeHandles />
    </motion.div>
  );
}

/**
 * Element Node Component - Constituent parts
 */
function ElementNode({ data, selected }: { data: any; selected: boolean }) {
  const isActive = data.isActive;
  const isRevealed = data.isRevealed;
  const isNew = data.isNew; // Just revealed this step

  if (!isRevealed) return null;

  const effect = data.effect?.type || 'fade';
  const duration = (data.effect?.duration || 400) / 1000;

  // Animation variants based on effect type
  const variants = {
    hidden: getHiddenState(effect, data.effect?.direction),
    visible: {
      scale: 1,
      opacity: 1,
      x: 0,
      y: 0,
      filter: 'blur(0px)',
    },
  };

  const color = data.color || DEFAULT_TYPE_COLORS[data.type] || DEFAULT_TYPE_COLORS.default;

  return (
    <motion.div
      className={`bc-element-node ${isActive ? 'node-active' : ''} ${isNew ? 'node-new' : ''}`}
      initial="hidden"
      animate="visible"
      variants={variants}
      transition={{
        duration,
        delay: data.effect?.delay ? data.effect.delay / 1000 : 0,
        type: effect === 'grow' ? 'spring' : 'tween',
      }}
      style={{ borderLeftColor: color }}
    >
      <div className="element-header">
        {data.icon && <span className="element-icon">{data.icon}</span>}
        <span className="element-name">{data.name}</span>
      </div>
      <span className="element-type" style={{ color }}>{data.type}</span>
      {data.description && (
        <span className="element-description">{data.description}</span>
      )}
      {data.hasChildren && (
        <button
          className="expand-button"
          onClick={(e) => {
            e.stopPropagation();
            data.onToggleExpand?.();
          }}
        >
          {data.isExpanded ? '−' : '+'}
        </button>
      )}
      <NodeHandles />
    </motion.div>
  );
}

/**
 * Child Node Component - Nested elements
 */
function ChildNode({ data }: { data: any }) {
  if (!data.isRevealed) return null;

  return (
    <motion.div
      className="bc-child-node"
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {data.icon && <span className="child-icon">{data.icon}</span>}
      <span className="child-name">{data.name}</span>
      <span className="child-type">{data.type}</span>
      <NodeHandles />
    </motion.div>
  );
}

/**
 * Get initial hidden state based on effect type
 */
function getHiddenState(effect: RevealEffect, direction?: string) {
  switch (effect) {
    case 'grow':
      return { scale: 0, opacity: 0 };
    case 'slide':
      const offset = 50;
      switch (direction) {
        case 'up': return { y: offset, opacity: 0 };
        case 'down': return { y: -offset, opacity: 0 };
        case 'left': return { x: offset, opacity: 0 };
        case 'right': return { x: -offset, opacity: 0 };
        default: return { y: offset, opacity: 0 };
      }
    case 'pulse':
      return { scale: 0.8, opacity: 0 };
    case 'glow':
      return { opacity: 0, filter: 'blur(10px)' };
    case 'none':
      return { opacity: 1 };
    case 'fade':
    default:
      return { opacity: 0 };
  }
}

/**
 * Inner component for camera auto-focus.
 * Must be a child of <ReactFlow> to access useReactFlow().
 */
function BCCompositionCameraController({ activeNodeIds }: { activeNodeIds: string[] }) {
  useAutoFocus(activeNodeIds, {
    padding: 100,
    duration: 600,
    maxZoom: 1.3,
    minZoom: 0.3,
  });
  return null;
}

/**
 * Main Canvas Component
 */
export function BCCompositionCanvas({
  story,
  currentStepIndex,
  onStepChange,
  hideOverlay = false,
}: BCCompositionCanvasProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [edgesReady, setEdgesReady] = useState(false);
  const onEdgesReady = useCallback(() => setEdgesReady(true), []);
  useEffect(() => { setEdgesReady(false); }, [story.id]);

  // Track which nodes have been revealed (cumulative across steps)
  const [revealedNodes, setRevealedNodes] = useState<Set<string>>(new Set());
  const prevStepRef = useRef<number>(-1);

  const currentStep = story.steps[currentStepIndex] as CompositionStep | undefined;

  // Memoize focus nodes for highlighting
  const focusNodeIds = useMemo(
    () => new Set(currentStep?.focus || []),
    [currentStep?.focus]
  );

  // Stable array of focus node IDs for camera controller
  const focusNodeIdsArray = useMemo(
    () => currentStep?.focus || [],
    [currentStep?.focus]
  );

  // Calculate which nodes should be revealed up to current step
  useEffect(() => {
    // Always reveal core node
    const revealed = new Set<string>([story.core.id]);

    // Cumulative reveal from step 0 to currentStepIndex
    for (let i = 0; i <= currentStepIndex; i++) {
      const step = story.steps[i];
      if (step?.reveal) {
        step.reveal.forEach(id => revealed.add(id));
      }
    }

    setRevealedNodes(revealed);
    prevStepRef.current = currentStepIndex;
  }, [currentStepIndex, story.steps, story.core.id]);

  // Identify newly revealed nodes (for "isNew" effect)
  const newlyRevealedNodes = useMemo(() => {
    if (!currentStep?.reveal) return new Set<string>();
    return new Set(currentStep.reveal);
  }, [currentStep?.reveal]);

  // Auto-expand nodes specified in current step
  useEffect(() => {
    if (currentStep?.expand) {
      setExpandedNodes(prev => {
        const next = new Set(prev);
        currentStep.expand?.forEach(id => next.add(id));
        return next;
      });
    }
  }, [currentStep?.expand]);

  // Toggle expand for an element
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

  // Calculate radial positions with smart angle allocation
  const positions = useMemo(() => {
    const map = new Map<string, { x: number; y: number }>();
    const centerX = 600;
    const centerY = 500;
    const spacing = (story.layout?.spacing || 180) * 1.4;

    // Core node at center
    map.set(story.core.id, { x: centerX, y: centerY });

    // Group elements by layer
    const layers = new Map<number, typeof story.elements>();
    story.elements.forEach(el => {
      const layer = el.layer || 1;
      if (!layers.has(layer)) layers.set(layer, []);
      layers.get(layer)!.push(el);
    });

    // Position each layer in a ring with weighted angle allocation
    layers.forEach((elements, layer) => {
      const radius = layer * spacing;
      const startAngle = -Math.PI / 2; // Start from top

      // Smart angle allocation: elements with children get 1.5x angular space
      const weights = elements.map(el =>
        el.children && el.children.length > 0 ? 1.5 : 1.0
      );
      const totalWeight = weights.reduce((sum, w) => sum + w, 0);

      // Build cumulative angle offsets from weights
      let cumulativeAngle = startAngle;

      elements.forEach((el, i) => {
        // This element's share of the full circle
        const anglePortion = (weights[i] / totalWeight) * (2 * Math.PI);
        // Place element at the midpoint of its angular share
        const angle = cumulativeAngle + anglePortion / 2;
        cumulativeAngle += anglePortion;

        map.set(el.id, {
          x: centerX + radius * Math.cos(angle) - 90,  // Offset for node width
          y: centerY + radius * Math.sin(angle) - 50,   // Offset for node height
        });

        // Position children below parent, centered under parent
        if (el.children) {
          const childCount = el.children.length;
          const totalChildWidth = (childCount - 1) * 160;
          const childStartOffset = -totalChildWidth / 2;

          el.children.forEach((child, ci) => {
            map.set(child.id, {
              x: centerX + radius * Math.cos(angle) - 50 + childStartOffset + ci * 160,
              y: centerY + radius * Math.sin(angle) + 60,
            });
          });
        }
      });
    });

    return map;
  }, [story.core.id, story.elements, story.layout?.spacing]);

  // Build nodes - only include revealed ones
  useEffect(() => {
    const resultNodes: Node[] = [];

    // Core node (always revealed after step 0)
    const corePos = positions.get(story.core.id);
    if (corePos && revealedNodes.has(story.core.id)) {
      resultNodes.push({
        id: story.core.id,
        type: 'core',
        position: corePos,
        data: {
          ...story.core,
          isActive: focusNodeIds.has(story.core.id),
          isRevealed: true,
        },
      });
    }

    // Element nodes - only if revealed
    story.elements.forEach(element => {
      if (!revealedNodes.has(element.id)) return;

      const pos = positions.get(element.id);
      if (!pos) return;

      const isExpanded = expandedNodes.has(element.id);

      resultNodes.push({
        id: element.id,
        type: 'element',
        position: pos,
        data: {
          ...element,
          isActive: focusNodeIds.has(element.id),
          isRevealed: true,
          isNew: newlyRevealedNodes.has(element.id),
          isExpanded,
          hasChildren: element.children && element.children.length > 0,
          onToggleExpand: () => toggleExpand(element.id),
        },
      });

      // Child nodes (if expanded)
      if (isExpanded && element.children) {
        element.children.forEach(child => {
          const childPos = positions.get(child.id);
          if (!childPos) return;

          resultNodes.push({
            id: child.id,
            type: 'child',
            position: childPos,
            data: {
              ...child,
              parentId: element.id,
              isRevealed: true,
            },
          });
        });
      }
    });

    setNodes(resultNodes);
  }, [
    story,
    positions,
    revealedNodes,
    newlyRevealedNodes,
    focusNodeIds,
    expandedNodes,
    toggleExpand,
    setNodes,
  ]);

  // Build node rect lookup for smart handles
  const nodeRects = useMemo(() => {
    const rects = new Map<string, NodeRect>();
    for (const [id, pos] of positions) {
      let dim;
      if (id === story.core.id) {
        dim = NODE_DIMENSIONS.compositionCore;
      } else if (story.elements.some(e => e.id === id)) {
        dim = NODE_DIMENSIONS.compositionElement;
      } else {
        dim = NODE_DIMENSIONS.compositionChild;
      }
      rects.set(id, { x: pos.x, y: pos.y, width: dim.width, height: dim.height });
    }
    return rects;
  }, [positions, story.core.id, story.elements]);

  // Build edges - only between revealed nodes
  useEffect(() => {
    if (!story.edges) {
      setEdges([]);
      return;
    }

    const resultEdges: Edge[] = story.edges
      .filter(edge =>
        revealedNodes.has(edge.source) && revealedNodes.has(edge.target)
      )
      .map(edge => {
        const sourceRect = nodeRects.get(edge.source);
        const targetRect = nodeRects.get(edge.target);
        const [sourceHandle, targetHandle] = sourceRect && targetRect
          ? getSmartHandles(sourceRect, targetRect)
          : ['source-right', 'target-left'];

        return {
          id: edge.id,
          source: edge.source,
          target: edge.target,
          sourceHandle,
          targetHandle,
          label: edge.label,
          style: {
            stroke: '#94a3b8',
            strokeWidth: 2,
            strokeDasharray: edge.style === 'dashed' ? '5,5' :
                            edge.style === 'dotted' ? '2,2' : undefined,
          },
          animated: newlyRevealedNodes.has(edge.target),
        };
      });

    setEdges(resultEdges);
  }, [story.edges, revealedNodes, newlyRevealedNodes, nodeRects, setEdges]);

  return (
    <div className="bc-composition-canvas" style={{ width: '100%', height: '100%', minHeight: '600px' }}>
      <ReactFlow
        nodes={nodes}
        edges={edgesReady ? edges : []}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        minZoom={0.3}
        maxZoom={2}
        attributionPosition="bottom-left"
      >
        <Background color="#e2e8f0" gap={20} />
        <Controls position="bottom-left" />
        <EdgeReadinessGate onReady={onEdgesReady} />
        <MiniMap
          nodeColor={(node) => {
            if (node.type === 'core') return story.core.color || '#4CAF50';
            if (node.type === 'child') return '#B0BEC5';
            const element = story.elements.find(e => e.id === node.id);
            return element?.color || DEFAULT_TYPE_COLORS[element?.type || 'default'] || '#78909C';
          }}
          maskColor="rgba(0, 0, 0, 0.1)"
          style={{ width: 120, height: 80 }}
        />
        <BCCompositionCameraController activeNodeIds={focusNodeIdsArray} />
      </ReactFlow>

      {!hideOverlay && currentStep && (
        <StepOverlay
          stepIndex={currentStepIndex}
          totalSteps={story.steps.length}
          title={currentStep.title}
          description={currentStep.description}
          narration={currentStep.narration}
          showDots
        />
      )}
    </div>
  );
}

export default BCCompositionCanvas;
