export { FlowEdge } from './FlowEdge';
export { EventEdge } from './EventEdge';
export { AnimatedEventEdge } from './AnimatedEventEdge';
export type { AnimationPhase } from './AnimatedEventEdge';
export { ErrorEdge } from './ErrorEdge';
export { AsyncEdge } from './AsyncEdge';
export { EdgeMarkers } from './EdgeMarkers';

export * from './types';
export * from './animations';

import type { EdgeTypes } from '@xyflow/react';
import { FlowEdge } from './FlowEdge';
import { EventEdge } from './EventEdge';
import { AnimatedEventEdge } from './AnimatedEventEdge';
import { ErrorEdge } from './ErrorEdge';
import { AsyncEdge } from './AsyncEdge';

/** All custom edge types for React Flow registration */
export const edgeTypes: EdgeTypes = {
  // Core types
  flow: FlowEdge,
  event: EventEdge,
  'animated-event': AnimatedEventEdge,
  error: ErrorEdge,
  async: AsyncEdge,
  
  // Extended types for architectural stories (mapped to existing)
  command: FlowEdge,      // Commands are synchronous flows
  query: AsyncEdge,       // Queries are async request/response
  action: FlowEdge,       // Actions are synchronous flows
  integration: AsyncEdge, // Integrations are async
  compensation: ErrorEdge, // Compensation is error-handling
};
