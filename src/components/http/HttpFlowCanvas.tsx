/**
 * HttpFlowCanvas - Main canvas for HTTP flow visualization
 * Based on SPEC-030
 */

import { useMemo, useCallback, useState } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Panel,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
} from '@xyflow/react';
import { motion } from 'motion/react';
import type { HttpFlowStory, Exchange, Participant } from '../../schemas/http-flow';
import { METHOD_COLORS, getStatusColor } from '../../schemas/http-flow';
import { ParticipantNode } from './ParticipantNode';
import { RequestNode } from './RequestNode';
import { ResponseNode } from './ResponseNode';
import './http-nodes.css';
import '@xyflow/react/dist/style.css';

// Layout constants
const LAYOUT = {
  PADDING: 60,
  PARTICIPANT_SPACING: 300,
  PARTICIPANT_Y: 40,
  EXCHANGE_START_Y: 180,
  EXCHANGE_SPACING: 140,
  REQUEST_OFFSET_X: 40,
  RESPONSE_OFFSET_X: -40,
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

  // Build nodes
  const nodes = useMemo(() => {
    const result: Node[] = [];

    // Participant nodes
    story.participants.forEach((participant) => {
      const pos = participantPositions.get(participant.id)!;
      result.push({
        id: `participant-${participant.id}`,
        type: 'participant',
        position: pos,
        data: {
          participant,
          isActive: false, // Could highlight based on active exchange
        },
      });
    });

    // Exchange nodes (request + response pairs)
    story.exchanges.forEach((exchange, exchangeIndex) => {
      const fromPos = participantPositions.get(exchange.request.from);
      const toPos = participantPositions.get(exchange.request.to);
      
      if (!fromPos || !toPos) return;

      const y = LAYOUT.EXCHANGE_START_Y + exchangeIndex * LAYOUT.EXCHANGE_SPACING;
      const isActive = activeExchangeIds.has(exchange.id);
      const isComplete = !isActive && currentStepIndex > 0; // Simplified

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
  }, [story, participantPositions, activeExchangeIds, currentStepIndex]);

  // Build edges
  const edges = useMemo(() => {
    const result: Edge[] = [];

    story.exchanges.forEach((exchange) => {
      const isActive = activeExchangeIds.has(exchange.id);
      const methodColor = METHOD_COLORS[exchange.request.method];
      const statusColor = getStatusColor(exchange.response.status);

      // Request edge (from participant to request node)
      result.push({
        id: `edge-req-${exchange.id}`,
        source: `participant-${exchange.request.from}`,
        target: `request-${exchange.id}`,
        type: 'default',
        animated: isActive,
        style: {
          stroke: methodColor.text,
          strokeWidth: isActive ? 3 : 2,
        },
        label: `${exchange.request.method} ${exchange.request.path}`,
        labelStyle: {
          fontSize: 10,
          fill: methodColor.text,
        },
      });

      // Response edge (from response node to requesting participant)
      result.push({
        id: `edge-res-${exchange.id}`,
        source: `response-${exchange.id}`,
        target: `participant-${exchange.request.from}`,
        type: 'default',
        animated: isActive,
        style: {
          stroke: statusColor.text,
          strokeWidth: isActive ? 3 : 2,
          strokeDasharray: '6 4',
        },
        label: `${exchange.response.status}`,
        labelStyle: {
          fontSize: 10,
          fill: statusColor.text,
        },
      });
    });

    return result;
  }, [story.exchanges, activeExchangeIds]);

  const [nodesState, setNodes, onNodesChange] = useNodesState(nodes);
  const [edgesState, setEdges, onEdgesChange] = useEdgesState(edges);

  // Update nodes when step changes
  useMemo(() => {
    setNodes(nodes);
    setEdges(edges);
  }, [nodes, edges, setNodes, setEdges]);

  return (
    <div
      className={`http-flow-canvas ${className}`}
      data-testid="http-flow-canvas"
      style={{ width: '100%', height: '100%' }}
    >
      <ReactFlow
        nodes={nodesState}
        edges={edgesState}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
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

        {/* Story info panel */}
        <Panel position="top-left">
          <div className="story-info-panel">
            <h3>{story.title}</h3>
            {story.description && <p>{story.description}</p>}
          </div>
        </Panel>

        {/* Step info panel */}
        {currentStep && (
          <Panel position="bottom-center">
            <motion.div
              className="step-panel"
              key={currentStep.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="step-badge">
                Step {currentStepIndex + 1} / {story.steps.length}
              </div>
              <h4>{currentStep.title}</h4>
              <p>{currentStep.narrative}</p>
            </motion.div>
          </Panel>
        )}
      </ReactFlow>
    </div>
  );
}

export default HttpFlowCanvas;
