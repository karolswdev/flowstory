import { memo } from 'react';
import type { NodeProps } from '@xyflow/react';
import { motion } from 'motion/react';
import { NodeHandles } from '../nodes/NodeHandles';

export interface StateInitialNodeData {
  label: string;
  isActive?: boolean;
  isComplete?: boolean;
  isRevealed?: boolean;
  [key: string]: unknown;
}

function StateInitialNodeInner({ data }: NodeProps<StateInitialNodeData>) {
  const { label, isActive, isComplete, isRevealed } = data;

  const stateClass = isActive
    ? 'node-active'
    : isComplete
      ? 'node-complete'
      : isRevealed === false
        ? 'node-dimmed'
        : '';

  return (
    <motion.div
      className={`state-diagram-initial ${stateClass}`}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      <div className="initial-marker" />
      <span className="initial-label">{label}</span>
      <NodeHandles />
    </motion.div>
  );
}

export const StateInitialNode = memo(StateInitialNodeInner);
