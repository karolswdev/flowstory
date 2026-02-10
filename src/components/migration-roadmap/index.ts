export { PhaseNode } from './PhaseNode';
export { MigrationRoadmapCanvas } from './MigrationRoadmapCanvas';
export { TaskNode } from './TaskNode';

import type { NodeTypes } from '@xyflow/react';
import { PhaseNode } from './PhaseNode';
import { TaskNode } from './TaskNode';

/** Node types for Migration Roadmap visualization */
export const migrationRoadmapNodeTypes: NodeTypes = {
  phase: PhaseNode,
  task: TaskNode,
  workstream: TaskNode,
};
