export { CostBlock } from './CostBlock';
export { CloudCostCanvas } from './CloudCostCanvas';

import type { NodeTypes } from '@xyflow/react';
import { CostBlock } from './CostBlock';

/** Node types for Cloud Cost visualization */
export const cloudCostNodeTypes: NodeTypes = {
  category: CostBlock,
  resource: CostBlock,
};
