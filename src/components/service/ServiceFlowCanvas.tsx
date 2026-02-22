import { useMemo, useCallback } from 'react';
import { StepOverlay } from '../shared';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  ConnectionMode,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import Dagre from '@dagrejs/dagre';

import { ServiceNode, type ServiceNodeData } from './ServiceNode';
import { QueueNode, type QueueNodeData } from './QueueNode';
import { DatabaseNode } from './DatabaseNode';
import { EventBusNode } from './EventBusNode';
import { GatewayNode } from './GatewayNode';
import { ExternalNode } from './ExternalNode';
import { WorkerNode } from './WorkerNode';
import { WorkflowNode } from './WorkflowNode';
import { CacheNode } from './CacheNode';
import { ServiceCallEdge, type ServiceCallEdgeData } from './ServiceCallEdge';
import { ZoneNode, type ZoneNodeData } from './ZoneNode';
import type {
  ServiceFlowStory,
  CallDef,
  CallType,
} from '../../schemas/service-flow';
import {
  CALL_TYPE_COLORS,
  SERVICE_TYPE_COLORS,
  ZONE_COLORS,
  ZONE_PADDING,
} from '../../schemas/service-flow';
import { getSmartHandles, type NodeRect } from '../nodes/NodeHandles';
import { NODE_DIMENSIONS } from '../nodes/dimensions';
import { useAutoFocus } from '../../hooks/useCameraController';

import './service-nodes.css';

// ============================================================================
// Node Types Registry
// ============================================================================

const edgeTypes = {
  'service-call': ServiceCallEdge,
};

const nodeTypes = {
  service: ServiceNode,
  queue: QueueNode,
  database: DatabaseNode,
  'event-bus': EventBusNode,
  gateway: GatewayNode,
  external: ExternalNode,
  worker: WorkerNode,
  'event-processor': WorkerNode,
  workflow: WorkflowNode,
  cache: CacheNode,
  zone: ZoneNode,
};

// ============================================================================
// Props
// ============================================================================

interface ServiceFlowCanvasProps {
  story: ServiceFlowStory;
  currentStepIndex: number;
  onStepChange?: (step: number) => void;
  showPayloads?: boolean;
  showDurations?: boolean;
}

// ============================================================================
// Layout Helpers
// ============================================================================

interface LayoutResult {
  nodes: Node[];
  edges: Edge[];
}

/**
 * Map service type to ReactFlow node type for distinct shapes.
 * Types with dedicated shape components get their own key;
 * 'api' (and any unknown) falls back to the generic 'service' rectangle.
 */
const SHAPE_NODE_TYPES = new Set(['database', 'event-bus', 'gateway', 'external', 'worker', 'event-processor', 'workflow', 'cache']);

function getServiceNodeType(serviceType: string): string {
  return SHAPE_NODE_TYPES.has(serviceType) ? serviceType : 'service';
}

function getParticipantDimensions(p: { kind: string; type: string }): { width: number; height: number } {
  if (p.kind === 'queue') return NODE_DIMENSIONS.queue;
  const key = getServiceNodeType(p.type);
  return NODE_DIMENSIONS[key as keyof typeof NODE_DIMENSIONS] || NODE_DIMENSIONS.service;
}

/**
 * Detect bidirectional edges (A->B + B->A) for curvature offset.
 */
function detectBidirectional(calls: CallDef[]): Set<string> {
  const pairs = new Set<string>();
  const edgeSet = new Set<string>();

  for (const c of calls) {
    const key = `${c.from}->${c.to}`;
    const reverse = `${c.to}->${c.from}`;
    edgeSet.add(key);
    if (edgeSet.has(reverse)) {
      pairs.add(key);
      pairs.add(reverse);
    }
  }
  return pairs;
}

function buildDagreLayout(
  story: ServiceFlowStory,
  activeCallIds: Set<string>,
  completedCallIds: Set<string>,
  revealedCallIds: Set<string>,
  activeNodeIds: Set<string>,
  completedNodeIds: Set<string>,
  revealedNodeIds: Set<string>,
  newCallIds: Set<string>,
  newNodeIds: Set<string>,
): LayoutResult {
  const { services, queues = [], calls } = story;

  // Progressive reveal: determine which participants are visible
  const revealedParticipantIds = new Set<string>(revealedNodeIds);
  for (const call of calls) {
    if (revealedCallIds.has(call.id)) {
      revealedParticipantIds.add(call.from);
      revealedParticipantIds.add(call.to);
    }
  }

  // Build participant list
  const participants = [
    ...services.map(s => ({ ...s, kind: 'service' as const })),
    ...queues.map(q => ({ ...q, kind: 'queue' as const })),
  ];

  // Filter to revealed participants
  const visibleParticipants = participants.filter(
    p => revealedParticipantIds.size === 0 || revealedParticipantIds.has(p.id)
  );

  // ── Dagre layout ──
  const g = new Dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({
    rankdir: 'LR',
    nodesep: 80,
    ranksep: 140,
    marginx: 60,
    marginy: 60,
  });

  // Add nodes with type-aware dimensions
  for (const p of visibleParticipants) {
    const dim = getParticipantDimensions(p);
    g.setNode(p.id, { width: dim.width, height: dim.height });
  }

  // Add edges — skip self-loops (dagre doesn't handle them)
  const visibleIds = new Set(visibleParticipants.map(p => p.id));
  for (const call of calls) {
    if (call.from !== call.to && visibleIds.has(call.from) && visibleIds.has(call.to)) {
      g.setEdge(call.from, call.to);
    }
  }

  Dagre.layout(g);

  // Detect bidirectional edges for curvature offset
  const biPairs = detectBidirectional(calls);

  // Compute which participants are newly revealed this step
  const newParticipantIds = new Set<string>(newNodeIds);
  for (const call of calls) {
    if (newCallIds.has(call.id)) {
      newParticipantIds.add(call.from);
      newParticipantIds.add(call.to);
    }
  }
  // Exclude participants that were already visible from prior steps
  const previousParticipantIds = new Set<string>();
  for (const call of calls) {
    if (completedCallIds.has(call.id)) {
      previousParticipantIds.add(call.from);
      previousParticipantIds.add(call.to);
    }
  }
  for (const id of completedNodeIds) previousParticipantIds.add(id);

  // ── Build positioned nodes ──
  const nodes: Node[] = visibleParticipants.map((p) => {
    const dagreNode = g.node(p.id);
    const dim = getParticipantDimensions(p);
    const x = (dagreNode?.x ?? 0) - dim.width / 2;
    const y = (dagreNode?.y ?? 0) - dim.height / 2;

    const isActive = activeNodeIds.has(p.id) || calls.some(
      c => activeCallIds.has(c.id) && (c.from === p.id || c.to === p.id)
    );
    const isComplete = completedNodeIds.has(p.id) || calls.some(
      c => completedCallIds.has(c.id) && (c.from === p.id || c.to === p.id)
    );
    const isNew = newParticipantIds.has(p.id) && !previousParticipantIds.has(p.id);

    const nodeType = p.kind === 'queue' ? 'queue' : getServiceNodeType(p.type);
    return {
      id: p.id,
      type: nodeType,
      position: { x, y },
      data: { ...p, isActive, isComplete, isNew } as ServiceNodeData & QueueNodeData,
    };
  });

  // ── Zone bounding boxes ──
  const { zones = [] } = story;
  if (zones.length > 0) {
    // Build position+dimension map for zone bbox computation
    const memberRects = new Map<string, { x: number; y: number; w: number; h: number }>();
    for (const node of nodes) {
      const dim = NODE_DIMENSIONS[node.type as keyof typeof NODE_DIMENSIONS] || NODE_DIMENSIONS.service;
      memberRects.set(node.id, { x: node.position.x, y: node.position.y, w: dim.width, h: dim.height });
    }

    zones.forEach((zone, idx) => {
      const rects = zone.members
        .map(id => memberRects.get(id))
        .filter((r): r is { x: number; y: number; w: number; h: number } => !!r);
      if (rects.length === 0) return;

      const minX = Math.min(...rects.map(r => r.x)) - ZONE_PADDING;
      const minY = Math.min(...rects.map(r => r.y)) - ZONE_PADDING - 20;
      const maxX = Math.max(...rects.map(r => r.x + r.w)) + ZONE_PADDING;
      const maxY = Math.max(...rects.map(r => r.y + r.h)) + ZONE_PADDING;

      const color = zone.color || ZONE_COLORS[idx % ZONE_COLORS.length];

      nodes.push({
        id: `zone-${zone.id}`,
        type: 'zone',
        position: { x: minX, y: minY },
        data: {
          label: zone.label,
          color,
          width: maxX - minX,
          height: maxY - minY,
        } as ZoneNodeData,
        style: { zIndex: -1 },
        selectable: false,
        draggable: false,
      });
    });
  }

  // Build node rect lookup for smart handle selection
  const nodeRects = new Map<string, NodeRect>();
  for (const node of nodes) {
    const dim = NODE_DIMENSIONS[node.type as keyof typeof NODE_DIMENSIONS] || NODE_DIMENSIONS.service;
    nodeRects.set(node.id, {
      x: node.position.x,
      y: node.position.y,
      width: dim.width,
      height: dim.height,
    });
  }

  // ── Build edges via custom edge component ──
  // Track bidirectional index per pair
  const biIndexTracker = new Map<string, number>();

  const edges: Edge[] = calls.filter(c => revealedCallIds.has(c.id)).map((call) => {
    const isActive = activeCallIds.has(call.id);
    const isComplete = completedCallIds.has(call.id);
    const color = CALL_TYPE_COLORS[call.type as CallType] || '#666';
    const isBidirectional = biPairs.has(`${call.from}->${call.to}`);
    const isSelfLoop = call.from === call.to;

    // Assign bidirectional index (0 or 1) for curvature offset
    let bidirectionalIndex = 0;
    if (isBidirectional) {
      const pairKey = [call.from, call.to].sort().join('--');
      bidirectionalIndex = biIndexTracker.get(pairKey) ?? 0;
      biIndexTracker.set(pairKey, bidirectionalIndex + 1);
    }

    // Smart handle selection
    const sourceRect = nodeRects.get(call.from);
    const targetRect = nodeRects.get(call.to);
    const [sourceHandle, targetHandle] = sourceRect && targetRect
      ? getSmartHandles(sourceRect, targetRect)
      : ['source-right', 'target-left'];

    // Extract semantic data for label rendering
    const isNewEdge = newCallIds.has(call.id);
    const edgeData: ServiceCallEdgeData = {
      callType: call.type,
      method: call.type === 'sync' ? (call as any).method : undefined,
      path: call.type === 'sync' ? (call as any).path : undefined,
      duration: call.type === 'sync' ? (call as any).duration : undefined,
      messageType: call.type !== 'sync' ? (call as any).messageType : undefined,
      action: call.type === 'subscribe' ? (call as any).action : undefined,
      isActive,
      isComplete,
      isNew: isNewEdge,
      isBidirectional,
      bidirectionalIndex,
      isSelfLoop,
      color,
    };

    return {
      id: call.id,
      source: call.from,
      target: call.to,
      type: 'service-call',
      sourceHandle,
      targetHandle,
      zIndex: 1000,
      data: edgeData,
    };
  });

  // ── Generate reverse response edges for sync calls with `response` ──
  for (const call of calls) {
    if (call.type !== 'sync' || !revealedCallIds.has(call.id)) continue;
    const syncCall = call as any;
    if (!syncCall.response) continue;

    const isActive = activeCallIds.has(call.id);
    const isComplete = completedCallIds.has(call.id);
    const color = CALL_TYPE_COLORS[call.type as CallType] || '#666';

    // Reverse direction for response
    const sourceRect = nodeRects.get(call.to);
    const targetRect = nodeRects.get(call.from);
    const [sourceHandle, targetHandle] = sourceRect && targetRect
      ? getSmartHandles(sourceRect, targetRect)
      : ['source-left', 'target-right'];

    const responseLabel = syncCall.response.label || `${syncCall.response.status}`;

    edges.push({
      id: `${call.id}-response`,
      source: call.to,
      target: call.from,
      type: 'service-call',
      sourceHandle,
      targetHandle,
      zIndex: 999,
      data: {
        callType: 'sync',
        isActive,
        isComplete,
        isNew: newCallIds.has(call.id),
        isBidirectional: true,
        bidirectionalIndex: 1,
        isSelfLoop: false,
        isResponse: true,
        responseLabel,
        color,
      } as ServiceCallEdgeData,
    });
  }

  return { nodes, edges };
}

// ============================================================================
// Component
// ============================================================================

export function ServiceFlowCanvas({
  story,
  currentStepIndex,
  onStepChange,
  showPayloads = false,
  showDurations = true,
}: ServiceFlowCanvasProps) {
  // Compute 6-set step state + newCallIds for entry effects
  const {
    activeCallIds,
    completedCallIds,
    revealedCallIds,
    activeNodeIds: activeNodeSet,
    completedNodeIds,
    revealedNodeIds,
    newCallIds,
    newNodeIds,
  } = useMemo(() => {
    const activeC = new Set<string>();
    const completedC = new Set<string>();
    const revealedC = new Set<string>();
    const activeN = new Set<string>();
    const completedN = new Set<string>();
    const revealedN = new Set<string>();
    const previouslyRevealedC = new Set<string>();
    const previouslyRevealedN = new Set<string>();

    story.steps.forEach((step, i) => {
      if (i <= currentStepIndex) {
        step.activeCalls.forEach(id => revealedC.add(id));
        step.revealCalls.forEach(id => revealedC.add(id));
        step.revealNodes.forEach(id => revealedN.add(id));
      }
      if (i < currentStepIndex) {
        step.activeCalls.forEach(id => { completedC.add(id); previouslyRevealedC.add(id); });
        step.revealCalls.forEach(id => { completedC.add(id); previouslyRevealedC.add(id); });
        step.revealNodes.forEach(id => { completedN.add(id); previouslyRevealedN.add(id); });
      } else if (i === currentStepIndex) {
        step.activeCalls.forEach(id => activeC.add(id));
        step.revealNodes.forEach(id => activeN.add(id));
      }
    });

    // New = revealed in current step but not in any previous step
    const newC = new Set<string>();
    for (const id of revealedC) {
      if (!previouslyRevealedC.has(id)) newC.add(id);
    }
    const newN = new Set<string>();
    for (const id of revealedN) {
      if (!previouslyRevealedN.has(id)) newN.add(id);
    }

    return {
      activeCallIds: activeC,
      completedCallIds: completedC,
      revealedCallIds: revealedC,
      activeNodeIds: activeN,
      completedNodeIds: completedN,
      revealedNodeIds: revealedN,
      newCallIds: newC,
      newNodeIds: newN,
    };
  }, [story.steps, currentStepIndex]);

  // Build layout with progressive reveal
  const { nodes, edges } = useMemo(() => {
    return buildDagreLayout(
      story, activeCallIds, completedCallIds, revealedCallIds,
      activeNodeSet, completedNodeIds, revealedNodeIds,
      newCallIds, newNodeIds,
    );
  }, [story, activeCallIds, completedCallIds, revealedCallIds, activeNodeSet, completedNodeIds, revealedNodeIds, newCallIds, newNodeIds]);

  // Camera focus: prefer explicit focusNodes, fall back to call participants
  const currentStep = story.steps[currentStepIndex];
  const focusNodeIds = useMemo(() => {
    if (currentStep?.focusNodes?.length) {
      return currentStep.focusNodes;
    }
    // Fall back to deriving from active calls
    const ids: string[] = [];
    for (const call of story.calls) {
      if (activeCallIds.has(call.id)) {
        ids.push(call.from);
        ids.push(call.to);
      }
    }
    return [...new Set(ids)];
  }, [currentStep, story.calls, activeCallIds]);

  const onNodeClick = useCallback((_event: React.MouseEvent, _node: Node) => {}, []);

  return (
    <div className="service-flow-canvas" data-testid="service-flow-canvas">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodeClick={onNodeClick}
        connectionMode={ConnectionMode.Loose}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.3}
        maxZoom={2}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={true}
      >
        <Background color="var(--edge-default, #e0e0e0)" gap={20} />
        <Controls showInteractive={false} />
        <ServiceFlowCameraController activeNodeIds={focusNodeIds} />
        <MiniMap 
          nodeColor={(node) => {
            if (node.type === 'queue') return '#A855F7';
            const data = node.data as ServiceNodeData;
            return SERVICE_TYPE_COLORS[data.type] || '#3B82F6';
          }}
          maskColor="rgba(0, 0, 0, 0.1)"
        />
      </ReactFlow>

      <StepOverlay
        stepIndex={currentStepIndex}
        totalSteps={story.steps.length}
        title={story.steps[currentStepIndex]?.title}
        narrative={story.steps[currentStepIndex]?.narrative}
        narration={story.steps[currentStepIndex]?.narration}
        onStepChange={onStepChange}
        showDots
      />
    </div>
  );
}

/**
 * Inner component for camera auto-focus.
 * Must be a child of <ReactFlow> to access useReactFlow().
 */
function ServiceFlowCameraController({ activeNodeIds }: { activeNodeIds: string[] }) {
  useAutoFocus(activeNodeIds, {
    padding: 100,
    duration: 600,
    maxZoom: 1.3,
    minZoom: 0.4,
  });
  return null;
}

export default ServiceFlowCanvas;
