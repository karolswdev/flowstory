export { ActorNode } from './ActorNode';
export { ActionNode } from './ActionNode';
export { DecisionNode } from './DecisionNode';
export { SystemNode } from './SystemNode';
export { EventNode } from './EventNode';
export { StateNode } from './StateNode';
export { NodeHandles, getBestHandles } from './NodeHandles';
export { SIZE_PRESETS, DEFAULT_NODE_SIZES, getNodeSize, getSizeStyles } from './sizes';
export type { NodeSize, SizeConfig } from './sizes';

export * from './types';
export * from '../../animations/nodeVariants';

import type { NodeTypes } from '@xyflow/react';
import { ActorNode } from './ActorNode';
import { ActionNode } from './ActionNode';
import { DecisionNode } from './DecisionNode';
import { SystemNode } from './SystemNode';
import { EventNode } from './EventNode';
import { StateNode } from './StateNode';

/** All custom node types for React Flow registration */
export const nodeTypes: NodeTypes = {
  // Core types
  actor: ActorNode,
  action: ActionNode,
  decision: DecisionNode,
  system: SystemNode,
  event: EventNode,
  state: StateNode,
  
  // Extended types for architectural stories (mapped to existing components)
  conductor: SystemNode,        // Conductor orchestrator → system node
  'orchestrator-step': ActionNode, // Workflow step → action node
  aggregate: StateNode,         // DDD aggregate → state node
  service: SystemNode,          // Service → system node
  external: SystemNode,         // External system → system node
  handler: ActionNode,          // Event handler → action node
  bus: SystemNode,              // Message bus → system node
  entity: StateNode,            // Entity → state node
  infrastructure: SystemNode,   // Infrastructure → system node
  integration: SystemNode,      // Integration point → system node
};
