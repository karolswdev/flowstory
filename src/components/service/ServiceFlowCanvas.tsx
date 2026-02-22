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
  MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { ServiceNode, type ServiceNodeData } from './ServiceNode';
import { QueueNode, type QueueNodeData } from './QueueNode';
import type {
  ServiceFlowStory,
  ServiceDef,
  QueueDef,
  CallDef,
  ServiceFlowStep,
  CallType,
} from '../../schemas/service-flow';
import {
  SERVICE_FLOW_LAYOUT,
  CALL_TYPE_COLORS,
  SERVICE_TYPE_COLORS,
} from '../../schemas/service-flow';
import { getSmartHandles, type NodeRect } from '../nodes/NodeHandles';
import { NODE_DIMENSIONS } from '../nodes/dimensions';
import { useAutoFocus } from '../../hooks/useCameraController';

import './service-nodes.css';

// ============================================================================
// Node Types Registry
// ============================================================================

const nodeTypes = {
  service: ServiceNode,
  queue: QueueNode,
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
 * Compute topological depth for each node based on call graph.
 * Sources (no incoming calls) get depth 0. Each hop adds 1.
 * This creates a left-to-right layout following data flow.
 */
function computeNodeDepths(
  participantIds: string[],
  calls: CallDef[]
): Map<string, number> {
  const depths = new Map<string, number>();
  const incoming = new Map<string, Set<string>>();

  // Initialize
  for (const id of participantIds) {
    depths.set(id, 0);
    incoming.set(id, new Set());
  }

  // Build incoming edges
  for (const call of calls) {
    incoming.get(call.to)?.add(call.from);
  }

  // BFS from sources
  const queue: string[] = [];
  for (const id of participantIds) {
    if (incoming.get(id)!.size === 0) {
      queue.push(id);
    }
  }

  const visited = new Set<string>();
  while (queue.length > 0) {
    const current = queue.shift()!;
    if (visited.has(current)) continue;
    visited.add(current);

    const currentDepth = depths.get(current) || 0;
    for (const call of calls) {
      if (call.from === current) {
        const targetDepth = depths.get(call.to) || 0;
        depths.set(call.to, Math.max(targetDepth, currentDepth + 1));
        if (!visited.has(call.to)) {
          queue.push(call.to);
        }
      }
    }
  }

  // Assign unvisited nodes (disconnected) to depth 0
  for (const id of participantIds) {
    if (!visited.has(id)) depths.set(id, 0);
  }

  return depths;
}

function buildSequenceLayout(
  story: ServiceFlowStory,
  activeCallIds: Set<string>,
  completedCallIds: Set<string>,
  revealedCallIds: Set<string>
): LayoutResult {
  const { services, queues = [], calls, steps } = story;
  const { LANE_WIDTH, LANE_SPACING, NODE_HEIGHT, QUEUE_HEIGHT, PADDING } = SERVICE_FLOW_LAYOUT;

  // Progressive reveal: determine which participants are involved in revealed calls
  const revealedParticipantIds = new Set<string>();
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

  const allIds = participants.map(p => p.id);

  // Compute graph-based depths for left-to-right positioning
  const depths = computeNodeDepths(allIds, calls);

  // Group participants by depth column
  const columns = new Map<number, typeof participants>();
  for (const p of participants) {
    const d = depths.get(p.id) || 0;
    if (!columns.has(d)) columns.set(d, []);
    columns.get(d)!.push(p);
  }

  // Position: each depth column gets an X, items within column spread vertically
  const COL_WIDTH = LANE_WIDTH + LANE_SPACING;
  const ROW_HEIGHT = NODE_HEIGHT + 80;

  const positions = new Map<string, { x: number; y: number }>();
  const sortedDepths = [...columns.keys()].sort((a, b) => a - b);

  for (const depth of sortedDepths) {
    const col = columns.get(depth)!;
    const x = PADDING + depth * COL_WIDTH;
    const colHeight = col.length * ROW_HEIGHT;
    const startY = PADDING + Math.max(0, (4 * ROW_HEIGHT - colHeight) / 2); // Center vertically

    col.forEach((p, i) => {
      positions.set(p.id, { x, y: startY + i * ROW_HEIGHT });
    });
  }

  // Create nodes — only show revealed participants
  const nodes: Node[] = participants
    .filter(p => revealedCallIds.size === 0 || revealedParticipantIds.has(p.id))
    .map((p) => {
    const pos = positions.get(p.id) || { x: 0, y: 0 };
    const isActive = calls.some(
      c => activeCallIds.has(c.id) && (c.from === p.id || c.to === p.id)
    );
    const isComplete = calls.some(
      c => completedCallIds.has(c.id) && (c.from === p.id || c.to === p.id)
    );

    if (p.kind === 'service') {
      return {
        id: p.id,
        type: 'service',
        position: pos,
        data: {
          ...p,
          isActive,
          isComplete,
        } as ServiceNodeData,
      };
    } else {
      return {
        id: p.id,
        type: 'queue',
        position: pos,
        data: {
          ...p,
          isActive,
          isComplete,
        } as QueueNodeData,
      };
    }
  });

  // Build node rect lookup for smart handle selection
  const nodeRects = new Map<string, NodeRect>();
  for (const node of nodes) {
    const dim = node.type === 'queue' ? NODE_DIMENSIONS.queue : NODE_DIMENSIONS.service;
    nodeRects.set(node.id, {
      x: node.position.x,
      y: node.position.y,
      width: dim.width,
      height: dim.height,
    });
  }

  // Create edges from calls — only revealed calls
  const edges: Edge[] = calls.filter(c => revealedCallIds.has(c.id)).map((call, i) => {
    const isActive = activeCallIds.has(call.id);
    const isComplete = completedCallIds.has(call.id);
    const color = CALL_TYPE_COLORS[call.type as CallType] || '#666';

    const label = buildEdgeLabel(call);
    const animated = isActive;
    const strokeWidth = isActive ? 3 : isComplete ? 2 : 1;

    // Smart handle selection
    const sourceRect = nodeRects.get(call.from);
    const targetRect = nodeRects.get(call.to);
    const [sourceHandle, targetHandle] = sourceRect && targetRect
      ? getSmartHandles(sourceRect, targetRect)
      : ['source-bottom', 'target-top'];

    return {
      id: call.id,
      source: call.from,
      target: call.to,
      sourceHandle,
      targetHandle,
      label,
      labelStyle: { fill: 'var(--color-text, #333)', fontSize: 11, fontWeight: 500 },
      labelBgStyle: { fill: 'var(--color-bg-elevated, #fff)', fillOpacity: 1, rx: 4, ry: 4, filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.15))' },
      labelBgPadding: [6, 4] as [number, number],
      zIndex: 1000,
      animated,
      style: {
        stroke: color,
        strokeWidth,
        strokeDasharray: call.type === 'async' || call.type === 'publish' || call.type === 'subscribe'
          ? '5,5'
          : undefined,
        opacity: isActive ? 1 : isComplete ? 0.8 : 0.4,
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color,
      },
      data: {
        callType: call.type,
        isActive,
        isComplete,
      },
    };
  });

  return { nodes, edges };
}

function buildEdgeLabel(call: CallDef): string {
  switch (call.type) {
    case 'sync':
      const method = call.method || '';
      const path = call.path || '';
      const duration = call.duration ? ` (${call.duration}ms)` : '';
      return `${method} ${path}${duration}`.trim();
    case 'async':
      return call.messageType;
    case 'publish':
      return `pub: ${call.messageType}`;
    case 'subscribe':
      return `sub: ${call.action || call.messageType}`;
    default:
      return '';
  }
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
  // Compute active/completed/revealed calls based on current step
  const { activeCallIds, completedCallIds, revealedCallIds } = useMemo(() => {
    const active = new Set<string>();
    const completed = new Set<string>();
    const revealed = new Set<string>();

    story.steps.forEach((step, i) => {
      if (i <= currentStepIndex) {
        step.activeCalls.forEach(id => revealed.add(id));
      }
      if (i < currentStepIndex) {
        step.activeCalls.forEach(id => completed.add(id));
      } else if (i === currentStepIndex) {
        step.activeCalls.forEach(id => active.add(id));
      }
    });

    return { activeCallIds: active, completedCallIds: completed, revealedCallIds: revealed };
  }, [story.steps, currentStepIndex]);

  // Build layout with progressive reveal
  const { nodes, edges } = useMemo(() => {
    return buildSequenceLayout(story, activeCallIds, completedCallIds, revealedCallIds);
  }, [story, activeCallIds, completedCallIds, revealedCallIds]);

  // Compute active node IDs for camera focus
  const activeNodeIds = useMemo(() => {
    const ids: string[] = [];
    for (const call of story.calls) {
      if (activeCallIds.has(call.id)) {
        ids.push(call.from);
        ids.push(call.to);
      }
    }
    return [...new Set(ids)];
  }, [story.calls, activeCallIds]);

  const onNodeClick = useCallback((_event: React.MouseEvent, _node: Node) => {}, []);

  return (
    <div className="service-flow-canvas" data-testid="service-flow-canvas">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
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
        <ServiceFlowCameraController activeNodeIds={activeNodeIds} />
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
