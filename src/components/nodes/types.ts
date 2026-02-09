import type { NodeProps } from '@xyflow/react';
import type { NodeEffect } from '../../types/story';

/** Common props for all custom nodes */
export interface BaseNodeData {
  label: string;
  description?: string;
  isActive?: boolean;
  isComplete?: boolean;
  /** Effects configuration from YAML */
  effects?: NodeEffect[];
}

/** Props for ActorNode */
export interface ActorNodeData extends BaseNodeData {
  actorId: string;
  avatar?: string;
  color?: string;
}

/** Props for ActionNode */
export interface ActionNodeData extends BaseNodeData {
  actorId?: string;
}

/** Props for DecisionNode */
export interface DecisionNodeData extends BaseNodeData {}

/** Props for SystemNode */
export interface SystemNodeData extends BaseNodeData {}

/** Props for EventNode */
export interface EventNodeData extends BaseNodeData {
  /** Event type: published (outgoing), subscribed (incoming), or default */
  eventType?: 'published' | 'subscribed';
}

/** Props for StateNode */
export interface StateNodeData extends BaseNodeData {
  variant?: 'success' | 'error' | 'pending' | 'default';
}

/** Node props type helpers */
export type ActorNodeProps = NodeProps<ActorNodeData>;
export type ActionNodeProps = NodeProps<ActionNodeData>;
export type DecisionNodeProps = NodeProps<DecisionNodeData>;
export type SystemNodeProps = NodeProps<SystemNodeData>;
export type EventNodeProps = NodeProps<EventNodeData>;
export type StateNodeProps = NodeProps<StateNodeData>;
