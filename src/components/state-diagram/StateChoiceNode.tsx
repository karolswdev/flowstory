import { memo } from 'react';
import type { NodeProps } from '@xyflow/react';
import { motion } from 'motion/react';
import { NodeHandles } from '../nodes/NodeHandles';

export interface StateChoiceNodeData {
  label: string;
  isActive?: boolean;
  isComplete?: boolean;
  isRevealed?: boolean;
  [key: string]: unknown;
}

function StateChoiceNodeInner({ data }: NodeProps<StateChoiceNodeData>) {
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
      className={`state-diagram-choice ${stateClass}`}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      <div className="choice-diamond">
        <span className="choice-icon">?</span>
      </div>
      <span className="choice-label">{label}</span>
      <NodeHandles />
    </motion.div>
  );
}

export const StateChoiceNode = memo(StateChoiceNodeInner);
