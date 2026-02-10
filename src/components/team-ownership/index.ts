export { TeamNode } from './TeamNode';
export { TeamOwnershipCanvas } from './TeamOwnershipCanvas';
export { ServiceNode } from './ServiceNode';

import type { NodeTypes } from '@xyflow/react';
import { TeamNode } from './TeamNode';
import { ServiceNode } from './ServiceNode';

/** Node types for team ownership visualization */
export const teamOwnershipNodeTypes: NodeTypes = {
  team: TeamNode,
  service: ServiceNode,
};
