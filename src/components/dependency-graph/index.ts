export { ServiceNode } from './ServiceNode';

import type { NodeTypes } from '@xyflow/react';
import { ServiceNode } from './ServiceNode';

/** Node types for Dependency Graph visualization */
export const dependencyGraphNodeTypes: NodeTypes = {
  service: ServiceNode,
  database: ServiceNode,
  cache: ServiceNode,
  queue: ServiceNode,
  external: ServiceNode,
  gateway: ServiceNode,
};
