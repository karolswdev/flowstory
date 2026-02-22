/**
 * HttpFlowCanvas - Main canvas for HTTP flow visualization
 * Based on SPEC-030
 */

import { useMemo, useState } from 'react';
import { StepOverlay } from '../shared';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Panel,
  type Node,
  type Edge,
} from '@xyflow/react';
import type { HttpFlowStory, Exchange, Participant } from '../../schemas/http-flow';
import { METHOD_COLORS, getStatusColor } from '../../schemas/http-flow';
import { ParticipantNode } from './ParticipantNode';
import { RequestNode } from './RequestNode';
import { ResponseNode } from './ResponseNode';
import { getSmartHandles, type NodeRect } from '../nodes/NodeHandles';
import { NODE_DIMENSIONS } from '../nodes/dimensions';
import { useAutoFocus } from '../../hooks/useCameraController';
import './http-nodes.css';
import '@xyflow/react/dist/style.css';

// Layout constants — generous spacing for readability
const LAYOUT = {
  PADDING: 100,
  PARTICIPANT_SPACING: 620,
  PARTICIPANT_Y: 40,
  EXCHANGE_START_Y: 220,
  EXCHANGE_SPACING: 440,
  REQUEST_OFFSET_X: 30,
  RESPONSE_OFFSET_X: 30,
};

// Node types registry
const nodeTypes = {
  participant: ParticipantNode,
  request: RequestNode,
  response: ResponseNode,
};

interface HttpFlowCanvasProps {
  story: HttpFlowStory;
  currentStepIndex?: number;
  className?: string;
}

export function HttpFlowCanvas({
  story,
  currentStepIndex = 0,
  className = '',
}: HttpFlowCanvasProps) {
  const [showHeaders, setShowHeaders] = useState(false);
  const [showBody, setShowBody] = useState(true);

  // Get current step
  const currentStep = story.steps[currentStepIndex];
  const activeExchangeIds = new Set(currentStep?.activeExchanges || []);

  // Progressive reveal: collect all exchange IDs mentioned in steps 0..currentStepIndex
  const revealedExchangeIds = useMemo(() => {
    const revealed = new Set<string>();
    for (let i = 0; i <= currentStepIndex; i++) {
      const step = story.steps[i];
      if (step?.activeExchanges) {
        for (const id of step.activeExchanges) {
          revealed.add(id);
        }
      }
    }
    return revealed;
  }, [story.steps, currentStepIndex]);

  // Determine which participants are involved in revealed exchanges
  const revealedParticipantIds = useMemo(() => {
    const ids = new Set<string>();
    for (const exchange of story.exchanges) {
      if (revealedExchangeIds.has(exchange.id)) {
        ids.add(exchange.request.from);
        ids.add(exchange.request.to);
      }
    }
    return ids;
  }, [story.exchanges, revealedExchangeIds]);

  // Build participant position map
  const participantPositions = useMemo(() => {
    const positions = new Map<string, { x: number; y: number }>();
    story.participants.forEach((p, index) => {
      positions.set(p.id, {
        x: LAYOUT.PADDING + index * LAYOUT.PARTICIPANT_SPACING,
        y: LAYOUT.PARTICIPANT_Y,
      });
    });
    return positions;
  }, [story.participants]);

  // Build nodes — only revealed exchanges and their participants
  const nodes = useMemo(() => {
    const result: Node[] = [];

    // Participant nodes — only show if involved in a revealed exchange
    story.participants.forEach((participant) => {
      if (!revealedParticipantIds.has(participant.id)) {
        return; // Hide unrevealed participants (including empty first step)
      }
      const pos = participantPositions.get(participant.id)!;
      const isInvolved = activeExchangeIds.size > 0 && story.exchanges.some(
        ex => activeExchangeIds.has(ex.id) && (ex.request.from === participant.id || ex.request.to === participant.id)
      );
      result.push({
        id: `participant-${participant.id}`,
        type: 'participant',
        position: pos,
        data: {
          participant,
          isActive: isInvolved,
        },
      });
    });

    // Exchange nodes — only show revealed exchanges
    story.exchanges.forEach((exchange, exchangeIndex) => {
      if (!revealedExchangeIds.has(exchange.id)) {
        return; // Hide unrevealed exchanges
      }

      const fromPos = participantPositions.get(exchange.request.from);
      const toPos = participantPositions.get(exchange.request.to);

      if (!fromPos || !toPos) return;

      const y = LAYOUT.EXCHANGE_START_Y + exchangeIndex * LAYOUT.EXCHANGE_SPACING;
      const isActive = activeExchangeIds.has(exchange.id);
      const isComplete = revealedExchangeIds.has(exchange.id) && !isActive;

      // Request node (positioned near sender)
      result.push({
        id: `request-${exchange.id}`,
        type: 'request',
        position: {
          x: Math.min(fromPos.x, toPos.x) + LAYOUT.REQUEST_OFFSET_X,
          y,
        },
        data: {
          request: exchange.request,
          isActive,
          isComplete,
        },
      });

      // Response node (positioned near receiver, slightly below)
      result.push({
        id: `response-${exchange.id}`,
        type: 'response',
        position: {
          x: Math.max(fromPos.x, toPos.x) + LAYOUT.RESPONSE_OFFSET_X,
          y: y + 10,
        },
        data: {
          response: exchange.response,
          timing: exchange.timing,
          isActive,
          isComplete,
        },
      });
    });

    return result;
  }, [story, participantPositions, activeExchangeIds, revealedExchangeIds, revealedParticipantIds, currentStepIndex]);

  // Build node rect lookup for smart handle selection
  const nodeRects = useMemo(() => {
    const rects = new Map<string, NodeRect>();
    for (const node of nodes) {
      const dim = node.type === 'participant'
        ? NODE_DIMENSIONS.participant
        : node.type === 'request'
          ? NODE_DIMENSIONS.request
          : NODE_DIMENSIONS.response;
      rects.set(node.id, {
        x: node.position.x,
        y: node.position.y,
        width: dim.width,
        height: dim.height,
      });
    }
    return rects;
  }, [nodes]);

  // Build edges — only for revealed exchanges
  const edges = useMemo(() => {
    const result: Edge[] = [];

    story.exchanges.forEach((exchange) => {
      if (!revealedExchangeIds.has(exchange.id)) return; // Hide unrevealed
      const isActive = activeExchangeIds.has(exchange.id);
      const methodColor = METHOD_COLORS[exchange.request.method];
      const statusColor = getStatusColor(exchange.response.status);

      const reqSourceId = `participant-${exchange.request.from}`;
      const reqTargetId = `request-${exchange.id}`;
      const resSourceId = `response-${exchange.id}`;
      const resTargetId = `participant-${exchange.request.from}`;

      const reqSourceRect = nodeRects.get(reqSourceId);
      const reqTargetRect = nodeRects.get(reqTargetId);
      const [reqSH, reqTH] = reqSourceRect && reqTargetRect
        ? getSmartHandles(reqSourceRect, reqTargetRect)
        : ['source-bottom', 'target-top'];

      const resSourceRect = nodeRects.get(resSourceId);
      const resTargetRect = nodeRects.get(resTargetId);
      const [resSH, resTH] = resSourceRect && resTargetRect
        ? getSmartHandles(resSourceRect, resTargetRect)
        : ['source-left', 'target-bottom'];

      // Request edge (from participant to request node)
      result.push({
        id: `edge-req-${exchange.id}`,
        source: reqSourceId,
        target: reqTargetId,
        sourceHandle: reqSH,
        targetHandle: reqTH,
        type: 'default',
        animated: isActive,
        style: {
          stroke: methodColor.text,
          strokeWidth: isActive ? 3 : 2,
        },
        label: `${exchange.request.method} ${exchange.request.path}`,
        labelStyle: {
          fontSize: 11,
          fill: methodColor.text,
          fontWeight: 600,
        },
        labelBgStyle: { fill: '#fff', fillOpacity: 1, rx: 4, ry: 4, filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.15))' },
        labelBgPadding: [6, 4] as [number, number],
        zIndex: 1000,
      });

      // Response edge (from response node to requesting participant)
      result.push({
        id: `edge-res-${exchange.id}`,
        source: resSourceId,
        target: resTargetId,
        sourceHandle: resSH,
        targetHandle: resTH,
        type: 'default',
        animated: isActive,
        style: {
          stroke: statusColor.text,
          strokeWidth: isActive ? 3 : 2,
          strokeDasharray: '6 4',
        },
        label: `${exchange.response.status}`,
        labelStyle: {
          fontSize: 11,
          fill: statusColor.text,
          fontWeight: 600,
        },
        labelBgStyle: { fill: '#fff', fillOpacity: 1, rx: 4, ry: 4, filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.15))' },
        labelBgPadding: [6, 4] as [number, number],
        zIndex: 1000,
      });
    });

    return result;
  }, [story.exchanges, activeExchangeIds, revealedExchangeIds, nodeRects]);

  // Compute node IDs of currently active exchanges for camera focus
  const activeNodeIds = useMemo(() => {
    const ids: string[] = [];
    for (const exchange of story.exchanges) {
      if (activeExchangeIds.has(exchange.id)) {
        ids.push(`participant-${exchange.request.from}`);
        ids.push(`participant-${exchange.request.to}`);
        ids.push(`request-${exchange.id}`);
        ids.push(`response-${exchange.id}`);
      }
    }
    return ids;
  }, [story.exchanges, activeExchangeIds]);

  return (
    <div
      className={`http-flow-canvas ${className}`}
      data-testid="http-flow-canvas"
      style={{ width: '100%', height: '100%' }}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        minZoom={0.3}
        maxZoom={2}
      >
        <Background color="#E0E0E0" gap={20} />
        <Controls />
        <MiniMap
          nodeColor={(node) => {
            if (node.type === 'participant') return '#2196F3';
            if (node.type === 'request') return '#4CAF50';
            if (node.type === 'response') return '#FF9800';
            return '#9E9E9E';
          }}
        />

        {/* Camera auto-focus on active exchange nodes */}
        <HttpFlowCameraController activeNodeIds={activeNodeIds} />

        {/* Story info panel */}
        <Panel position="top-left">
          <div className="story-info-panel">
            <h3>{story.title}</h3>
            {story.description && <p>{story.description}</p>}
          </div>
        </Panel>

      </ReactFlow>

      {currentStep && (
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
 * Must be a child of <ReactFlow> to access useReactFlow().
 */
function HttpFlowCameraController({ activeNodeIds }: { activeNodeIds: string[] }) {
  useAutoFocus(activeNodeIds, {
    padding: 100,
    duration: 600,
    maxZoom: 1.3,
    minZoom: 0.4,
  });
  return null;
}

export default HttpFlowCanvas;
