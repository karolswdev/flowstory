import { useMemo, useCallback, useState, useEffect } from 'react';
import { StepOverlay, EdgeReadinessGate } from '../shared';
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
import { ClientNode } from './ClientNode';
import { FirewallNode } from './FirewallNode';
import { LoadBalancerNode } from './LoadBalancerNode';
import { SchedulerNode } from './SchedulerNode';
import { StorageNode } from './StorageNode';
import { FunctionNode } from './FunctionNode';
import { MonitorNode } from './MonitorNode';
import { HumanTaskNode } from './HumanTaskNode';
import { EventStreamNode } from './EventStreamNode';
import { EventProcessorNode } from './EventProcessorNode';
import { EntityNode } from './EntityNode';
import { AggregateNode } from './AggregateNode';
import { ValueObjectNode } from './ValueObjectNode';
import { DomainEventNode } from './DomainEventNode';
import { PolicyNode } from './PolicyNode';
import { ReadModelNode } from './ReadModelNode';
import { SagaNode } from './SagaNode';
import { RepositoryNode } from './RepositoryNode';
import { BoundedContextNode } from './BoundedContextNode';
import { ActorNode } from './ActorNode';
import { ServiceCallEdge, type ServiceCallEdgeData } from './ServiceCallEdge';
import { ZoneNode, type ZoneNodeData } from './ZoneNode';
import type {
  ServiceFlowStory,
  CallDef,
  CallType,
  CallEffect,
  CouplingLevel,
  FailureCascadeResult,
  SceneDef,
  SceneDirection,
} from '../../schemas/service-flow';
import {
  CALL_TYPE_COLORS,
  SERVICE_TYPE_COLORS,
  ZONE_COLORS,
  ZONE_PADDING,
  ZONE_LABEL_HEIGHT,
  MIN_ZONE_MEMBER_GAP,
  resolveSubstates,
  getServiceFlowCascade,
} from '../../schemas/service-flow';
import { getSmartHandles, type NodeRect } from '../nodes/NodeHandles';
import { NODE_DIMENSIONS, measureServiceNodeWidth, measureShapeNodeWidth, measureQueueNodeWidth } from '../nodes/dimensions';
import { useAutoFocus } from '../../hooks/useCameraController';
import { EffectsProvider } from '../../effects';

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
  'event-processor': EventProcessorNode,
  workflow: WorkflowNode,
  cache: CacheNode,
  client: ClientNode,
  firewall: FirewallNode,
  'load-balancer': LoadBalancerNode,
  scheduler: SchedulerNode,
  storage: StorageNode,
  function: FunctionNode,
  monitor: MonitorNode,
  'human-task': HumanTaskNode,
  'event-stream': EventStreamNode,
  // Domain-level types
  entity: EntityNode,
  aggregate: AggregateNode,
  'value-object': ValueObjectNode,
  'domain-event': DomainEventNode,
  policy: PolicyNode,
  'read-model': ReadModelNode,
  saga: SagaNode,
  repository: RepositoryNode,
  'bounded-context': BoundedContextNode,
  actor: ActorNode,
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
  hideOverlay?: boolean;
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
const SHAPE_NODE_TYPES = new Set([
  'database', 'event-bus', 'gateway', 'external', 'worker', 'event-processor', 'workflow', 'cache',
  'client', 'firewall', 'load-balancer', 'scheduler', 'storage', 'function', 'monitor', 'human-task', 'event-stream',
  'entity', 'aggregate', 'value-object', 'domain-event', 'policy',
  'read-model', 'saga', 'repository', 'bounded-context', 'actor',
]);

function getServiceNodeType(serviceType: string): string {
  return SHAPE_NODE_TYPES.has(serviceType) ? serviceType : 'service';
}

/** Estimate extra height added by tag pills. */
function getTagsHeight(tags?: Record<string, string>, compact = false): number {
  if (!tags) return 0;
  const count = Object.keys(tags).length;
  if (count === 0) return 0;
  const pillWidth = compact ? 52 : 64; // avg pill width estimate
  const containerWidth = compact ? 140 : 176; // usable width inside margins
  const pillsPerRow = Math.max(1, Math.floor(containerWidth / pillWidth));
  const rows = Math.ceil(Math.min(count, 4) / pillsPerRow); // maxVisible=4
  const rowHeight = compact ? 18 : 22;
  const margin = compact ? 10 : 14; // top+bottom margin from CSS
  return rows * rowHeight + margin;
}

function getParticipantDimensions(p: { kind: string; type: string; name: string; technology?: string; broker?: string; tags?: Record<string, string> }): { width: number; height: number } {
  if (p.kind === 'queue') {
    const base = NODE_DIMENSIONS.queue;
    const width = measureQueueNodeWidth(p.name, p.type, (p as any).broker);
    return { width, height: base.height + getTagsHeight(p.tags, true) };
  }
  // event-stream uses fixed wide dimensions (pipe shape)
  if (p.type === 'event-stream') {
    const base = NODE_DIMENSIONS['event-stream'];
    return { width: base.width, height: base.height + getTagsHeight(p.tags) };
  }
  // event-processor uses wider base dimensions for conveyor strip
  if (p.type === 'event-processor') {
    const base = NODE_DIMENSIONS['event-processor'];
    return { width: base.width, height: base.height + getTagsHeight(p.tags) };
  }

  const key = getServiceNodeType(p.type);
  const isShape = SHAPE_NODE_TYPES.has(p.type);
  const base = NODE_DIMENSIONS[key as keyof typeof NODE_DIMENSIONS] || NODE_DIMENSIONS.service;

  if (isShape) {
    const measuredW = measureShapeNodeWidth(p.name, p.technology);
    // Shapes scale proportionally — height follows aspect ratio
    const widthRatio = measuredW / base.width;
    const height = Math.round(base.height * Math.max(1, widthRatio * 0.8));
    return { width: measuredW, height: height + getTagsHeight(p.tags) };
  }

  // ServiceNode (rectangle)
  const width = measureServiceNodeWidth(p.name, p.type, p.technology);
  return { width, height: base.height + getTagsHeight(p.tags) };
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

// ============================================================================
// Multi-Scene Layout Pipeline
// ============================================================================

interface ScenePartition {
  sceneId: string;
  direction: SceneDirection;
  memberIds: string[];
  nodesep?: number;
  ranksep?: number;
}

/**
 * Partition participants into scene groups.
 * Nodes not assigned to any scene go into '__default__' (LR).
 */
function partitionIntoScenes(
  scenes: SceneDef[],
  allParticipantIds: Set<string>,
): ScenePartition[] {
  const assigned = new Set<string>();
  const partitions: ScenePartition[] = [];

  for (const scene of scenes) {
    const members = scene.members.filter(id => allParticipantIds.has(id));
    if (members.length > 0) {
      partitions.push({
        sceneId: scene.id,
        direction: scene.direction ?? 'LR',
        memberIds: members,
        nodesep: scene.nodesep,
        ranksep: scene.ranksep,
      });
      members.forEach(id => assigned.add(id));
    }
  }

  // Unassigned nodes → default LR scene
  const unassigned = [...allParticipantIds].filter(id => !assigned.has(id));
  if (unassigned.length > 0) {
    partitions.push({
      sceneId: '__default__',
      direction: 'LR',
      memberIds: unassigned,
    });
  }

  return partitions;
}

interface Participant {
  id: string;
  kind: string;
  type: string;
  name: string;
  technology?: string;
  broker?: string;
  tags?: Record<string, string>;
}

/**
 * Run Dagre for a single scene partition. Returns center positions (not top-left).
 */
function layoutScene(
  partition: ScenePartition,
  participantMap: Map<string, Participant>,
  calls: CallDef[],
  zones: { id: string; members: string[] }[],
  defaultRanksep: number,
): Map<string, { x: number; y: number }> {
  const memberSet = new Set(partition.memberIds);

  const g = new Dagre.graphlib.Graph({ compound: true });
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({
    rankdir: partition.direction,
    nodesep: partition.nodesep ?? 60,
    ranksep: partition.ranksep ?? defaultRanksep,
    marginx: 40,
    marginy: 40,
  });

  // Add nodes
  for (const id of partition.memberIds) {
    const p = participantMap.get(id);
    if (!p) continue;
    const dim = getParticipantDimensions(p);
    g.setNode(id, { width: dim.width, height: dim.height });
  }

  // Add intra-scene edges (skip self-loops, skip cross-scene)
  for (const call of calls) {
    if (call.from !== call.to && memberSet.has(call.from) && memberSet.has(call.to)) {
      g.setEdge(call.from, call.to);
    }
  }

  // Register zones as compound parents (only for members in this scene)
  for (const zone of zones) {
    const sceneMembers = zone.members.filter(id => memberSet.has(id));
    if (sceneMembers.length > 0) {
      g.setNode(`zone-${zone.id}`, {});
      for (const memberId of sceneMembers) {
        g.setParent(memberId, `zone-${zone.id}`);
      }
    }
  }

  Dagre.layout(g);

  const posMap = new Map<string, { x: number; y: number }>();
  for (const id of partition.memberIds) {
    const dn = g.node(id);
    if (dn) posMap.set(id, { x: dn.x, y: dn.y });
  }
  return posMap;
}

/**
 * Compute the bounding box of a set of positions (center coords).
 */
function sceneBBox(
  posMap: Map<string, { x: number; y: number }>,
  participantMap: Map<string, Participant>,
): { minX: number; minY: number; maxX: number; maxY: number; width: number; height: number } {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const [id, pos] of posMap) {
    const p = participantMap.get(id);
    const dim = p ? getParticipantDimensions(p) : { width: 192, height: 56 };
    minX = Math.min(minX, pos.x - dim.width / 2);
    minY = Math.min(minY, pos.y - dim.height / 2);
    maxX = Math.max(maxX, pos.x + dim.width / 2);
    maxY = Math.max(maxY, pos.y + dim.height / 2);
  }
  return { minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY };
}

/**
 * Multi-scene layout: partition → per-scene Dagre → macro Dagre → merge.
 * When no scenes are defined, falls back to single LR graph (identical to old behavior).
 *
 * For stable positions during progressive reveal, we layout ALL declared scene
 * members (not just visible ones), then filter to visible in the posMap output.
 */
function buildSceneLayout(
  scenes: SceneDef[],
  allParticipants: Participant[],
  visibleParticipants: Participant[],
  visibleIds: Set<string>,
  calls: CallDef[],
  zones: { id: string; members: string[] }[],
  defaultRanksep: number,
): Map<string, { x: number; y: number }> {
  const participantMap = new Map<string, Participant>();
  for (const p of allParticipants) participantMap.set(p.id, p);

  // No scenes → single Dagre (backward compat)
  if (!scenes || scenes.length === 0) {
    const singlePartition: ScenePartition = {
      sceneId: '__default__',
      direction: 'LR',
      memberIds: visibleParticipants.map(p => p.id),
    };

    const g = new Dagre.graphlib.Graph({ compound: true });
    g.setDefaultEdgeLabel(() => ({}));
    g.setGraph({
      rankdir: 'LR',
      nodesep: 60,
      ranksep: defaultRanksep,
      marginx: 40,
      marginy: 40,
    });

    for (const p of visibleParticipants) {
      const dim = getParticipantDimensions(p);
      g.setNode(p.id, { width: dim.width, height: dim.height });
    }

    for (const call of calls) {
      if (call.from !== call.to && visibleIds.has(call.from) && visibleIds.has(call.to)) {
        g.setEdge(call.from, call.to);
      }
    }

    for (const zone of zones) {
      const visibleMembers = zone.members.filter(id => visibleIds.has(id));
      if (visibleMembers.length > 0) {
        g.setNode(`zone-${zone.id}`, {});
        for (const memberId of visibleMembers) {
          g.setParent(memberId, `zone-${zone.id}`);
        }
      }
    }

    Dagre.layout(g);

    const posMap = new Map<string, { x: number; y: number }>();
    for (const id of visibleIds) {
      const dn = g.node(id);
      if (dn) posMap.set(id, { x: dn.x, y: dn.y });
    }
    return posMap;
  }

  // ── Step 1: Partition ALL declared members into scenes ──
  const allParticipantIds = new Set(allParticipants.map(p => p.id));
  const partitions = partitionIntoScenes(scenes, allParticipantIds);

  // ── Step 2: Run Dagre per scene (using ALL members for stable layout) ──
  const scenePositions = new Map<string, Map<string, { x: number; y: number }>>();
  const sceneBBoxes = new Map<string, { minX: number; minY: number; maxX: number; maxY: number; width: number; height: number }>();

  for (const partition of partitions) {
    const scenePos = layoutScene(partition, participantMap, calls, zones, defaultRanksep);
    scenePositions.set(partition.sceneId, scenePos);

    if (scenePos.size > 0) {
      sceneBBoxes.set(partition.sceneId, sceneBBox(scenePos, participantMap));
    }
  }

  // ── Step 3: Macro layout — position scenes relative to each other ──
  // Each scene becomes a meta-node in a macro Dagre graph
  const macro = new Dagre.graphlib.Graph();
  macro.setDefaultEdgeLabel(() => ({}));
  macro.setGraph({
    rankdir: 'TB', // scenes stack top-to-bottom by default
    nodesep: 80,
    ranksep: 80,
    marginx: 0,
    marginy: 0,
  });

  // Build scene membership lookup
  const nodeToScene = new Map<string, string>();
  for (const partition of partitions) {
    for (const id of partition.memberIds) {
      nodeToScene.set(id, partition.sceneId);
    }
  }

  for (const partition of partitions) {
    const bbox = sceneBBoxes.get(partition.sceneId);
    if (bbox) {
      macro.setNode(partition.sceneId, { width: bbox.width, height: bbox.height });
    }
  }

  // Cross-scene edges → macro edges
  const macroEdgeSet = new Set<string>();
  for (const call of calls) {
    if (call.from === call.to) continue;
    const fromScene = nodeToScene.get(call.from);
    const toScene = nodeToScene.get(call.to);
    if (fromScene && toScene && fromScene !== toScene) {
      const key = `${fromScene}->${toScene}`;
      if (!macroEdgeSet.has(key)) {
        macroEdgeSet.add(key);
        macro.setEdge(fromScene, toScene);
      }
    }
  }

  Dagre.layout(macro);

  // ── Step 4: Merge — offset scene-local coords by macro position ──
  const globalPosMap = new Map<string, { x: number; y: number }>();

  for (const partition of partitions) {
    const scenePos = scenePositions.get(partition.sceneId);
    const bbox = sceneBBoxes.get(partition.sceneId);
    const macroNode = macro.node(partition.sceneId);
    if (!scenePos || !bbox || !macroNode) continue;

    // Macro gives us the center of the meta-node; scene bbox gives us the scene's own center
    const sceneCenterX = bbox.minX + bbox.width / 2;
    const sceneCenterY = bbox.minY + bbox.height / 2;
    const offsetX = macroNode.x - sceneCenterX;
    const offsetY = macroNode.y - sceneCenterY;

    for (const [id, pos] of scenePos) {
      // Only include visible nodes in the final posMap
      if (visibleIds.has(id)) {
        globalPosMap.set(id, { x: pos.x + offsetX, y: pos.y + offsetY });
      }
    }
  }

  return globalPosMap;
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
  resolvedSubstateMap: Map<string, string | null>,
  stepEffectsMap: Map<string, CallEffect>,
  failureCascade: FailureCascadeResult | null,
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

  // ── Dynamic ranksep based on longest label ──
  // Estimate label pixel width: ~6.5px per char at 11px font + 28px padding/badge
  const maxLabelWidth = calls.reduce((max, c) => {
    const sync = c as any;
    let chars = 0;
    if (c.type === 'sync') chars = (sync.method?.length || 0) + (sync.path?.length || 0) + 6;
    else if (c.type === 'publish') chars = 4 + (sync.messageType?.length || 0);
    else if (c.type === 'subscribe') chars = 4 + (sync.action?.length || sync.messageType?.length || 0);
    else chars = sync.messageType?.length || 0;
    return Math.max(max, chars);
  }, 0);
  const estimatedLabelPx = maxLabelWidth * 6.5 + 28;
  const defaultRanksep = Math.max(200, Math.round(estimatedLabelPx + 60));

  const visibleIds = new Set(visibleParticipants.map(p => p.id));
  const { zones = [], scenes = [] } = story;

  // ── Multi-Scene Layout Pipeline ──
  const posMap = buildSceneLayout(
    scenes,
    participants,
    visibleParticipants,
    visibleIds,
    calls,
    zones,
    defaultRanksep,
  );

  for (const zone of zones) {
    const members = zone.members.filter(id => posMap.has(id));
    if (members.length < 2) continue;

    for (let i = 0; i < members.length; i++) {
      for (let j = i + 1; j < members.length; j++) {
        const aId = members[i], bId = members[j];
        const a = posMap.get(aId)!, b = posMap.get(bId)!;
        const dimA = getParticipantDimensions(
          visibleParticipants.find(p => p.id === aId)!,
        );
        const dimB = getParticipantDimensions(
          visibleParticipants.find(p => p.id === bId)!,
        );

        // Check vertical gap (edge-to-edge)
        const aTop = a.y - dimA.height / 2;
        const aBot = a.y + dimA.height / 2;
        const bTop = b.y - dimB.height / 2;
        const bBot = b.y + dimB.height / 2;

        // Horizontal overlap check — only nudge Y if nodes share horizontal space
        const aLeft = a.x - dimA.width / 2;
        const aRight = a.x + dimA.width / 2;
        const bLeft = b.x - dimB.width / 2;
        const bRight = b.x + dimB.width / 2;
        const hOverlap = aLeft < bRight && bLeft < aRight;

        if (hOverlap) {
          const gapY = Math.max(0, Math.max(bTop - aBot, aTop - bBot));
          if (gapY < MIN_ZONE_MEMBER_GAP) {
            const nudge = (MIN_ZONE_MEMBER_GAP - gapY) / 2;
            if (a.y < b.y) { a.y -= nudge; b.y += nudge; }
            else { b.y -= nudge; a.y += nudge; }
          }
        }

        // Vertical overlap check — only nudge X if nodes share vertical space
        const vOverlap = aTop < bBot && bTop < aBot;
        if (vOverlap) {
          const gapX = Math.max(0, Math.max(bLeft - aRight, aLeft - bRight));
          if (gapX < MIN_ZONE_MEMBER_GAP) {
            const nudge = (MIN_ZONE_MEMBER_GAP - gapX) / 2;
            if (a.x < b.x) { a.x -= nudge; b.x += nudge; }
            else { b.x -= nudge; a.x += nudge; }
          }
        }
      }
    }
  }

  // Detect bidirectional edges for curvature offset
  const biPairs = detectBidirectional(calls);

  // Also mark forward calls that have a synthetic response edge as bidirectional
  for (const call of calls) {
    if (call.type === 'sync' && (call as any).response) {
      biPairs.add(`${call.from}->${call.to}`);
      biPairs.add(`${call.to}->${call.from}`);
    }
  }

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

  // ── Compute incoming events for event-processor conveyor belt ──
  const incomingEventsMap = new Map<string, { messageType: string; callType: string }[]>();
  for (const call of calls) {
    if (!activeCallIds.has(call.id)) continue;
    const mt = (call as any).messageType as string | undefined;
    if (!mt) continue;
    const existing = incomingEventsMap.get(call.to) ?? [];
    existing.push({ messageType: mt, callType: call.type });
    incomingEventsMap.set(call.to, existing);
  }

  // ── Build positioned nodes ──
  const nodes: Node[] = visibleParticipants.map((p) => {
    const pos = posMap.get(p.id);
    const dim = getParticipantDimensions(p);
    const x = (pos?.x ?? 0) - dim.width / 2;
    const y = (pos?.y ?? 0) - dim.height / 2;

    const isActive = activeNodeIds.has(p.id) || calls.some(
      c => activeCallIds.has(c.id) && (c.from === p.id || c.to === p.id)
    );
    const isComplete = completedNodeIds.has(p.id) || calls.some(
      c => completedCallIds.has(c.id) && (c.from === p.id || c.to === p.id)
    );
    const isNew = newParticipantIds.has(p.id) && !previousParticipantIds.has(p.id);

    const nodeType = p.kind === 'queue' ? 'queue' : getServiceNodeType(p.type);
    const substate = resolvedSubstateMap.get(p.id) ?? undefined;
    const isFailedNode = failureCascade?.affectedServices.has(p.id) ?? false;
    return {
      id: p.id,
      type: nodeType,
      position: { x, y },
      style: { width: dim.width, height: dim.height },
      data: { ...p, isActive, isComplete, isNew, substate, isFailed: isFailedNode, incomingEvents: incomingEventsMap.get(p.id) ?? [] } as ServiceNodeData & QueueNodeData & { substate?: string; isFailed?: boolean; incomingEvents?: { messageType: string; callType: string }[] },
    };
  });

  // Build per-participant dimension lookup (tag-aware)
  const participantDimMap = new Map<string, { width: number; height: number }>();
  for (const p of visibleParticipants) {
    participantDimMap.set(p.id, getParticipantDimensions(p));
  }

  // ── Zone bounding boxes ──
  if (zones.length > 0) {
    // Build position+dimension map for zone bbox computation
    const memberRects = new Map<string, { x: number; y: number; w: number; h: number }>();
    for (const node of nodes) {
      const dim = participantDimMap.get(node.id) || NODE_DIMENSIONS.service;
      memberRects.set(node.id, { x: node.position.x, y: node.position.y, w: dim.width, h: dim.height });
    }

    zones.forEach((zone, idx) => {
      const rects = zone.members
        .map(id => memberRects.get(id))
        .filter((r): r is { x: number; y: number; w: number; h: number } => !!r);
      if (rects.length === 0) return;

      const minX = Math.min(...rects.map(r => r.x)) - ZONE_PADDING;
      const minY = Math.min(...rects.map(r => r.y)) - ZONE_PADDING - ZONE_LABEL_HEIGHT;
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

  // Build node rect lookup for smart handle selection (tag-aware dimensions)
  const nodeRects = new Map<string, NodeRect>();
  for (const node of nodes) {
    const dim = participantDimMap.get(node.id) || NODE_DIMENSIONS[node.type as keyof typeof NODE_DIMENSIONS] || NODE_DIMENSIONS.service;
    nodeRects.set(node.id, {
      x: node.position.x,
      y: node.position.y,
      width: dim.width,
      height: dim.height,
    });
  }

  // ── Compute per-source edge indices for label staggering ──
  const revealedCalls = calls.filter(c => revealedCallIds.has(c.id));
  const sourceEdgeCounts = new Map<string, number>();
  for (const call of revealedCalls) {
    sourceEdgeCounts.set(call.from, (sourceEdgeCounts.get(call.from) ?? 0) + 1);
  }
  const sourceEdgeIndexTracker = new Map<string, number>();

  // ── Compute self-loop index per node (for staggering multiple self-loops) ──
  const selfLoopIndexTracker = new Map<string, number>();

  // ── Build edges via custom edge component ──
  // Track bidirectional index per pair
  const biIndexTracker = new Map<string, number>();

  const edges: Edge[] = revealedCalls.map((call) => {
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

    // Smart handle selection — self-loops force right-side handles
    const sourceRect = nodeRects.get(call.from);
    const targetRect = nodeRects.get(call.to);
    const [sourceHandle, targetHandle] = isSelfLoop
      ? ['source-right', 'target-right']
      : sourceRect && targetRect
        ? getSmartHandles(sourceRect, targetRect)
        : ['source-right', 'target-left'];

    // Extract semantic data for label rendering
    const isNewEdge = newCallIds.has(call.id);
    const srcEdgeIdx = sourceEdgeIndexTracker.get(call.from) ?? 0;
    sourceEdgeIndexTracker.set(call.from, srcEdgeIdx + 1);

    // Self-loop: pass node dimensions + stagger index
    let nodeWidth: number | undefined;
    let nodeHeight: number | undefined;
    let selfLoopIndex: number | undefined;
    if (isSelfLoop) {
      const dims = participantDimMap.get(call.from);
      nodeWidth = dims?.width;
      nodeHeight = dims?.height;
      selfLoopIndex = selfLoopIndexTracker.get(call.from) ?? 0;
      selfLoopIndexTracker.set(call.from, selfLoopIndex + 1);
    }

    // Resolve effect: step-level override > call-level default
    const callEffect = (call as any).effect as CallEffect | undefined;
    const stepEffect = stepEffectsMap.get(call.id);
    const resolvedEffect = stepEffect ?? callEffect ?? undefined;

    // Coupling and failure cascade data
    const callCoupling = (call as any).coupling as CouplingLevel | undefined;
    const callCritical = (call as any).critical as boolean | undefined;
    const isFailedEdge = failureCascade?.failedCalls.has(call.id) ?? false;
    const isFallbackEdge = failureCascade?.activeFallbacks.has(call.id) ?? false;

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
      sourceEdgeIndex: srcEdgeIdx,
      sourceEdgeCount: sourceEdgeCounts.get(call.from) ?? 1,
      nodeWidth,
      nodeHeight,
      selfLoopIndex,
      effect: resolvedEffect,
      coupling: callCoupling,
      critical: callCritical,
      isFailed: isFailedEdge,
      isFallbackActive: isFallbackEdge,
      travelingLabel: (call as any).travelingLabel as boolean | undefined,
      stream: (call as any).stream,
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
  hideOverlay = false,
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

  // Compute resolved sub-states by walking steps
  const resolvedSubstateMap = useMemo(
    () => resolveSubstates(story.steps, currentStepIndex, story.services),
    [story.steps, story.services, currentStepIndex],
  );

  // Build step-level effects map (target callId → merged effect config)
  const stepEffectsMap = useMemo(() => {
    const map = new Map<string, CallEffect>();
    const step = story.steps[currentStepIndex];
    if (step?.effects) {
      for (const eff of step.effects) {
        // Step effect overrides: merge with call-level effect
        const callDef = story.calls.find(c => c.id === eff.target);
        const callEffect = (callDef as any)?.effect as CallEffect | undefined;
        const { target: _, ...overrides } = eff;
        const merged = callEffect ? { ...callEffect, ...overrides } : overrides;
        map.set(eff.target, merged as CallEffect);
      }
    }
    return map;
  }, [story.steps, story.calls, currentStepIndex]);

  // Compute failure cascade from simulateFailure step field
  const failureCascade = useMemo<FailureCascadeResult | null>(() => {
    const step = story.steps[currentStepIndex];
    if (!step?.simulateFailure) return null;
    return getServiceFlowCascade(story.calls, step.simulateFailure);
  }, [story.steps, story.calls, currentStepIndex]);

  // Build layout with progressive reveal
  const { nodes, edges } = useMemo(() => {
    return buildDagreLayout(
      story, activeCallIds, completedCallIds, revealedCallIds,
      activeNodeSet, completedNodeIds, revealedNodeIds,
      newCallIds, newNodeIds, resolvedSubstateMap, stepEffectsMap, failureCascade,
    );
  }, [story, activeCallIds, completedCallIds, revealedCallIds, activeNodeSet, completedNodeIds, revealedNodeIds, newCallIds, newNodeIds, resolvedSubstateMap, stepEffectsMap, failureCascade]);

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

  // Gate edges until ReactFlow has DOM-measured all node dimensions.
  // On initial render (especially inside iframes or embed mode), edges connect
  // to wrong handle positions because node ResizeObservers haven't fired yet.
  // useNodesInitialized() returns true only after every visible node has been
  // measured — we relay that from the inner EdgeReadinessGate component.
  const [edgesReady, setEdgesReady] = useState(false);
  const onEdgesReady = useCallback(() => setEdgesReady(true), []);

  // Reset when story changes (new nodes need fresh measurement)
  useEffect(() => {
    setEdgesReady(false);
  }, [story.id]);

  return (
    <EffectsProvider budget={{ maxConcurrentEffects: 15 }}>
      <div className="service-flow-canvas" data-testid="service-flow-canvas">
        <ReactFlow
          nodes={nodes}
          edges={edgesReady ? edges : []}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          onNodeClick={onNodeClick}
          connectionMode={ConnectionMode.Loose}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          minZoom={0.3}
          maxZoom={2}
          nodesDraggable={true}
          nodesConnectable={false}
          elementsSelectable={true}
        >
          <Background variant="lines" color="var(--grid-line-color, rgba(255,255,255,0.03))" gap={40} lineWidth={0.5} />
          <Controls showInteractive={false} />
          <EdgeReadinessGate onReady={onEdgesReady} />
          <ServiceFlowCameraController activeNodeIds={focusNodeIds} cameraOverride={currentStep?.camera} />
          <MiniMap
            nodeColor={(node) => {
              if (node.type === 'queue') return SERVICE_TYPE_COLORS.worker;
              const data = node.data as ServiceNodeData;
              return SERVICE_TYPE_COLORS[data.type] || SERVICE_TYPE_COLORS.api;
            }}
            maskColor="rgba(0, 0, 0, 0.1)"
          />
        </ReactFlow>

        {!hideOverlay && (
          <StepOverlay
            stepIndex={currentStepIndex}
            totalSteps={story.steps.length}
            title={story.steps[currentStepIndex]?.title}
            narrative={story.steps[currentStepIndex]?.narrative}
            narration={story.steps[currentStepIndex]?.narration}
            onStepChange={onStepChange}
            showDots
          />
        )}
      </div>
    </EffectsProvider>
  );
}

/**
 * Inner component for camera auto-focus.
 * Must be a child of <ReactFlow> to access useReactFlow().
 */
function ServiceFlowCameraController({ activeNodeIds, cameraOverride }: {
  activeNodeIds: string[];
  cameraOverride?: import('../../schemas/service-flow').CameraOverride | null;
}) {
  useAutoFocus(activeNodeIds, {
    padding: 100,
    duration: 600,
    maxZoom: 1.3,
    minZoom: 0.4,
  }, cameraOverride);
  return null;
}

export default ServiceFlowCanvas;
