export { C4PersonNode } from './C4PersonNode';
export { C4SystemNode } from './C4SystemNode';
export { C4ExternalNode } from './C4ExternalNode';
export { C4ContextCanvas } from './C4ContextCanvas';

import type { NodeTypes } from '@xyflow/react';
import { C4PersonNode } from './C4PersonNode';
import { C4SystemNode } from './C4SystemNode';
import { C4ExternalNode } from './C4ExternalNode';

/** Node types for C4 Context visualization */
export const c4ContextNodeTypes: NodeTypes = {
  person: C4PersonNode,
  system: C4SystemNode,
  external: C4ExternalNode,
};
