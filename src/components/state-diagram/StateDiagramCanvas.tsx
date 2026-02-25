import { useMemo, useState, useCallback, useEffect } from 'react';
import { StepOverlay, EdgeReadinessGate } from '../shared';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  type Node,
  type Edge,
  ConnectionMode,
  MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import Dagre from '@dagrejs/dagre';

import { StateNormalNode } from './StateNormalNode';
import { StateInitialNode } from './StateInitialNode';
import { StateTerminalNode } from './StateTerminalNode';
import { StateChoiceNode } from './StateChoiceNode';
import { StatePhaseNode } from './StatePhaseNode';
import { TransitionEdge } from './TransitionEdge';
import type {
  StateDiagramStory,
  StateDef,
  TransitionDef,
  PhaseDef,
  StateType,
} from '../../schemas/state-diagram';
import {
  STATE_DIAGRAM_LAYOUT,
  STATE_VARIANT_COLORS,
  PHASE_COLORS,
} from '../../schemas/state-diagram';
import { useAutoFocus } from '../../hooks/useCameraController';
import { getBestHandles } from '../nodes/NodeHandles';

import './state-diagram.css';

// ============================================================================
// Node & Edge Type Registries
// ============================================================================

const nodeTypes = {
  'state-normal': StateNormalNode,
  'state-initial': StateInitialNode,
  'state-terminal': StateTerminalNode,
  'state-choice': StateChoiceNode,
  'state-phase': StatePhaseNode,
};

const edgeTypes = {
  transition: TransitionEdge,
};

// ============================================================================
// Props
// ============================================================================

interface StateDiagramCanvasProps {
  story: StateDiagramStory;
  currentStepIndex: number;
  onStepChange?: (step: number) => void;
  hideOverlay?: boolean;
}

// ============================================================================
// Layout: Dagre auto-layout
// ============================================================================

function getNodeTypeKey(type: StateType): string {
  switch (type) {
    case 'initial': return 'state-initial';
    case 'terminal': return 'state-terminal';
    case 'choice': return 'state-choice';
    default: return 'state-normal';
  }
}

function getNodeDimensions(type: StateType) {
  const { NODE_WIDTH, NODE_HEIGHT, INITIAL_SIZE, TERMINAL_SIZE, CHOICE_SIZE } = STATE_DIAGRAM_LAYOUT;
  switch (type) {
    case 'initial': return { width: INITIAL_SIZE + 80, height: INITIAL_SIZE };
    case 'terminal': return { width: TERMINAL_SIZE + 80, height: TERMINAL_SIZE };
    case 'choice': return { width: CHOICE_SIZE, height: CHOICE_SIZE + 20 };
    default: return { width: NODE_WIDTH, height: NODE_HEIGHT };
  }
}

interface LayoutResult {
  nodes: Node[];
  edges: Edge[];
}

/**
 * Detect bidirectional edges (A->B + B->A) for curvature offset.
 */
function detectBidirectional(transitions: TransitionDef[]): Set<string> {
  const pairs = new Set<string>();
  const edgeSet = new Set<string>();

  for (const t of transitions) {
    const key = `${t.source}->${t.target}`;
    const reverse = `${t.target}->${t.source}`;
    edgeSet.add(key);
    if (edgeSet.has(reverse)) {
      pairs.add(key);
      pairs.add(reverse);
    }
  }
  return pairs;
}

/**
 * Build the full dagre-laid-out graph for rendering.
 */
function buildLayout(
  story: StateDiagramStory,
  activeStateIds: Set<string>,
  completedStateIds: Set<string>,
  revealedStateIds: Set<string>,
  activeTransitionIds: Set<string>,
  completedTransitionIds: Set<string>,
  revealedTransitionIds: Set<string>,
): LayoutResult {
  const { states, transitions, phases = [], direction = 'TB' } = story;
  const { NODE_SPACING, RANK_SPACING, PHASE_PADDING } = STATE_DIAGRAM_LAYOUT;

  // ── Dagre layout ──
  const g = new Dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({
    rankdir: direction,
    nodesep: NODE_SPACING,
    ranksep: RANK_SPACING,
    marginx: 60,
    marginy: 60,
  });

  // Add state nodes
  const stateMap = new Map<string, StateDef>();
  for (const state of states) {
    stateMap.set(state.id, state);
    const dim = getNodeDimensions(state.type);
    g.setNode(state.id, { width: dim.width, height: dim.height });
  }

  // Add transition edges (skip self-loops for layout — dagre doesn't handle them)
  for (const t of transitions) {
    if (t.source !== t.target) {
      g.setEdge(t.source, t.target);
    }
  }

  Dagre.layout(g);

  // ── Build positioned nodes ──
  const positionedNodes: Node[] = [];
  const nodePositions = new Map<string, { x: number; y: number }>();

  for (const state of states) {
    const dagreNode = g.node(state.id);
    if (!dagreNode) continue;

    const dim = getNodeDimensions(state.type);
    const x = dagreNode.x - dim.width / 2;
    const y = dagreNode.y - dim.height / 2;
    nodePositions.set(state.id, { x, y });

    const isActive = activeStateIds.has(state.id);
    const isComplete = completedStateIds.has(state.id);
    const isRevealed = revealedStateIds.size === 0 || revealedStateIds.has(state.id);

    positionedNodes.push({
      id: state.id,
      type: getNodeTypeKey(state.type),
      position: { x, y },
      data: {
        label: state.label,
        variant: state.variant || 'default',
        description: state.description,
        isActive,
        isComplete,
        isRevealed,
      },
    });
  }

  // ── Phase bounding boxes ──
  if (phases.length > 0) {
    const phaseStates = new Map<string, { id: string; x: number; y: number; w: number; h: number }[]>();

    for (const state of states) {
      if (!state.phase) continue;
      const pos = nodePositions.get(state.id);
      if (!pos) continue;
      const dim = getNodeDimensions(state.type);
      if (!phaseStates.has(state.phase)) phaseStates.set(state.phase, []);
      phaseStates.get(state.phase)!.push({ id: state.id, x: pos.x, y: pos.y, w: dim.width, h: dim.height });
    }

    phases.forEach((phase, idx) => {
      const members = phaseStates.get(phase.id);
      if (!members || members.length === 0) return;

      const minX = Math.min(...members.map(m => m.x)) - PHASE_PADDING;
      const minY = Math.min(...members.map(m => m.y)) - PHASE_PADDING - 20; // extra for label
      const maxX = Math.max(...members.map(m => m.x + m.w)) + PHASE_PADDING;
      const maxY = Math.max(...members.map(m => m.y + m.h)) + PHASE_PADDING;

      const color = phase.color || PHASE_COLORS[idx % PHASE_COLORS.length];

      positionedNodes.push({
        id: `phase-${phase.id}`,
        type: 'state-phase',
        position: { x: minX, y: minY },
        data: {
          label: phase.label,
          color,
          width: maxX - minX,
          height: maxY - minY,
        },
        style: { zIndex: -1 },
        selectable: false,
        draggable: false,
      });
    });
  }

  // ── Build edges ──
  const bidirectionalPairs = detectBidirectional(transitions);
  const bidirectionalCounters = new Map<string, number>();

  const edges: Edge[] = transitions.map((t) => {
    const isActive = activeTransitionIds.has(t.id);
    const isComplete = completedTransitionIds.has(t.id);
    const isRevealed = revealedTransitionIds.size === 0 || revealedTransitionIds.has(t.id);
    const isSelfLoop = t.source === t.target;
    const pairKey = `${t.source}->${t.target}`;
    const isBidirectional = bidirectionalPairs.has(pairKey);

    let bidirectionalIndex = 0;
    if (isBidirectional) {
      const count = bidirectionalCounters.get(pairKey) || 0;
      bidirectionalIndex = count;
      bidirectionalCounters.set(pairKey, count + 1);
    }

    // Determine if this is an error transition (targets a danger/error state)
    const targetState = stateMap.get(t.target);
    const isError = targetState?.variant === 'danger' || targetState?.variant === 'error';

    // Smart handle selection
    const sourcePos = nodePositions.get(t.source);
    const targetPos = nodePositions.get(t.target);
    const [sourceHandle, targetHandle] = sourcePos && targetPos && !isSelfLoop
      ? getBestHandles(sourcePos, targetPos)
      : ['source-right', 'target-top'];

    return {
      id: t.id,
      source: t.source,
      target: t.target,
      type: 'transition',
      sourceHandle: isSelfLoop ? 'source-right' : sourceHandle,
      targetHandle: isSelfLoop ? 'target-top' : targetHandle,
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: isActive ? '#2196F3' : isError ? '#F44336' : '#B0BEC5',
        width: 16,
        height: 16,
      },
      data: {
        trigger: t.trigger,
        guard: t.guard,
        action: t.action,
        isActive,
        isComplete,
        isRevealed,
        isSelfLoop,
        isBidirectional,
        bidirectionalIndex,
        isError,
      },
    };
  });

  return { nodes: positionedNodes, edges };
}

// ============================================================================
// Component
// ============================================================================

export function StateDiagramCanvas({
  story,
  currentStepIndex,
  hideOverlay = false,
}: StateDiagramCanvasProps) {
  // Compute active/completed/revealed sets
  const {
    activeStateIds,
    completedStateIds,
    revealedStateIds,
    activeTransitionIds,
    completedTransitionIds,
    revealedTransitionIds,
  } = useMemo(() => {
    const activeS = new Set<string>();
    const completedS = new Set<string>();
    const revealedS = new Set<string>();
    const activeT = new Set<string>();
    const completedT = new Set<string>();
    const revealedT = new Set<string>();

    story.steps.forEach((step, i) => {
      if (i <= currentStepIndex) {
        step.activeStates.forEach(id => revealedS.add(id));
        step.activeTransitions.forEach(id => revealedT.add(id));
      }
      if (i < currentStepIndex) {
        step.activeStates.forEach(id => completedS.add(id));
        step.activeTransitions.forEach(id => completedT.add(id));
      } else if (i === currentStepIndex) {
        step.activeStates.forEach(id => activeS.add(id));
        step.activeTransitions.forEach(id => activeT.add(id));
      }
    });

    return {
      activeStateIds: activeS,
      completedStateIds: completedS,
      revealedStateIds: revealedS,
      activeTransitionIds: activeT,
      completedTransitionIds: completedT,
      revealedTransitionIds: revealedT,
    };
  }, [story.steps, currentStepIndex]);

  // Build layout
  const { nodes, edges } = useMemo(
    () => buildLayout(
      story,
      activeStateIds,
      completedStateIds,
      revealedStateIds,
      activeTransitionIds,
      completedTransitionIds,
      revealedTransitionIds,
    ),
    [story, activeStateIds, completedStateIds, revealedStateIds, activeTransitionIds, completedTransitionIds, revealedTransitionIds],
  );

  // Active node IDs for camera auto-focus
  const activeNodeIds = useMemo(
    () => [...activeStateIds],
    [activeStateIds],
  );

  const [edgesReady, setEdgesReady] = useState(false);
  const onEdgesReady = useCallback(() => setEdgesReady(true), []);
  useEffect(() => { setEdgesReady(false); }, [story.id]);

  const currentStep = story.steps[currentStepIndex];

  return (
    <div className="state-diagram-canvas" data-testid="state-diagram-canvas">
      <ReactFlow
        nodes={nodes}
        edges={edgesReady ? edges : []}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        connectionMode={ConnectionMode.Loose}
        fitView
        fitViewOptions={{ padding: 0.25 }}
        minZoom={0.15}
        maxZoom={2}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={true}
      >
        <Background color="#e0e0e0" gap={20} />
        <Controls showInteractive={false} />
        <EdgeReadinessGate onReady={onEdgesReady} />
        <StateDiagramCameraController activeNodeIds={activeNodeIds} />
        <MiniMap
          nodeColor={(node) => {
            if (node.type === 'state-phase') return 'transparent';
            const v = (node.data as any)?.variant;
            if (v && v !== 'default') {
              return STATE_VARIANT_COLORS[v as keyof typeof STATE_VARIANT_COLORS] || '#607D8B';
            }
            if (node.type === 'state-initial' || node.type === 'state-terminal') return '#333';
            if (node.type === 'state-choice') return '#FF9800';
            return '#607D8B';
          }}
          maskColor="rgba(0, 0, 0, 0.1)"
        />
        {/* Custom arrow marker */}
        <svg style={{ position: 'absolute', width: 0, height: 0 }}>
          <defs>
            <marker
              id="state-arrow"
              viewBox="0 0 10 10"
              refX="10"
              refY="5"
              markerWidth="8"
              markerHeight="8"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#B0BEC5" />
            </marker>
          </defs>
        </svg>
      </ReactFlow>

      {!hideOverlay && currentStep && (
        <StepOverlay
          stepIndex={currentStepIndex}
          totalSteps={story.steps.length}
          title={currentStep.title}
          narrative={currentStep.narrative}
        />
      )}
    </div>
  );
}

/**
 * Inner component for camera auto-focus.
 * Must be child of <ReactFlow> to access useReactFlow().
 */
function StateDiagramCameraController({ activeNodeIds }: { activeNodeIds: string[] }) {
  useAutoFocus(activeNodeIds, {
    padding: 120,
    duration: 700,
    maxZoom: 1.3,
    minZoom: 0.3,
  });
  return null;
}

export default StateDiagramCanvas;
