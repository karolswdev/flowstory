import { useMemo, useCallback } from 'react';
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
  currentStep: number;
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

function buildSequenceLayout(
  story: ServiceFlowStory,
  activeCallIds: Set<string>,
  completedCallIds: Set<string>
): LayoutResult {
  const { services, queues = [], calls, steps } = story;
  const { LANE_WIDTH, LANE_SPACING, CALL_SPACING, HEADER_HEIGHT, PADDING } = SERVICE_FLOW_LAYOUT;

  // Build participant order: services first, then queues
  const participants = [
    ...services.map(s => ({ ...s, kind: 'service' as const })),
    ...queues.map(q => ({ ...q, kind: 'queue' as const })),
  ];

  // Create lane positions
  const lanePositions = new Map<string, number>();
  participants.forEach((p, i) => {
    lanePositions.set(p.id, PADDING + i * (LANE_WIDTH + LANE_SPACING));
  });

  // Create nodes
  const nodes: Node[] = participants.map((p, i) => {
    const x = lanePositions.get(p.id)!;
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
        position: { x, y: HEADER_HEIGHT },
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
        position: { x, y: HEADER_HEIGHT + 100 },
        data: {
          ...p,
          isActive,
          isComplete,
        } as QueueNodeData,
      };
    }
  });

  // Create edges from calls
  const edges: Edge[] = calls.map((call, i) => {
    const isActive = activeCallIds.has(call.id);
    const isComplete = completedCallIds.has(call.id);
    const color = CALL_TYPE_COLORS[call.type as CallType] || '#666';

    const label = buildEdgeLabel(call);
    const animated = isActive;
    const strokeWidth = isActive ? 3 : isComplete ? 2 : 1;

    return {
      id: call.id,
      source: call.from,
      target: call.to,
      label,
      labelStyle: { fill: '#333', fontSize: 11 },
      labelBgStyle: { fill: '#fff', fillOpacity: 0.9 },
      labelBgPadding: [4, 2] as [number, number],
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
  currentStep,
  onStepChange,
  showPayloads = false,
  showDurations = true,
}: ServiceFlowCanvasProps) {
  // Compute active/completed calls based on current step
  const { activeCallIds, completedCallIds } = useMemo(() => {
    const active = new Set<string>();
    const completed = new Set<string>();

    story.steps.forEach((step, i) => {
      if (i < currentStep) {
        step.activeCalls.forEach(id => completed.add(id));
      } else if (i === currentStep) {
        step.activeCalls.forEach(id => active.add(id));
      }
    });

    return { activeCallIds: active, completedCallIds: completed };
  }, [story.steps, currentStep]);

  // Build layout
  const { nodes, edges } = useMemo(() => {
    return buildSequenceLayout(story, activeCallIds, completedCallIds);
  }, [story, activeCallIds, completedCallIds]);

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    console.log('Service clicked:', node.id);
  }, []);

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
        <Background color="#e0e0e0" gap={20} />
        <Controls showInteractive={false} />
        <MiniMap 
          nodeColor={(node) => {
            if (node.type === 'queue') return '#9C27B0';
            const data = node.data as ServiceNodeData;
            return SERVICE_TYPE_COLORS[data.type] || '#2196F3';
          }}
          maskColor="rgba(0, 0, 0, 0.1)"
        />
      </ReactFlow>

      {/* Step info overlay */}
      <div className="service-flow-step-info">
        <div className="step-badge">Step {currentStep + 1} / {story.steps.length}</div>
        <div className="step-title">{story.steps[currentStep]?.title}</div>
        <div className="step-narrative">{story.steps[currentStep]?.narrative}</div>
      </div>
    </div>
  );
}

export default ServiceFlowCanvas;
