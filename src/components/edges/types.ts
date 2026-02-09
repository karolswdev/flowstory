import type { EdgeProps } from '@xyflow/react';

/** Common props for all custom edges */
export interface BaseEdgeData {
  label?: string;
  isActive?: boolean;
}

/** Props for FlowEdge */
export interface FlowEdgeData extends BaseEdgeData {}

/** Props for EventEdge */
export interface EventEdgeData extends BaseEdgeData {}

/** Props for ErrorEdge */
export interface ErrorEdgeData extends BaseEdgeData {}

/** Props for AsyncEdge */
export interface AsyncEdgeData extends BaseEdgeData {}

/** Edge props type helpers */
export type FlowEdgeProps = EdgeProps<FlowEdgeData>;
export type EventEdgeProps = EdgeProps<EventEdgeData>;
export type ErrorEdgeProps = EdgeProps<ErrorEdgeData>;
export type AsyncEdgeProps = EdgeProps<AsyncEdgeData>;
