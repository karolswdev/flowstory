import { memo } from 'react';
import type { NodeProps } from '@xyflow/react';
import { motion } from 'motion/react';
import { NodeHandles } from '../nodes/NodeHandles';
import { STATE_VARIANT_ICONS } from '../../schemas/state-diagram';
import type { StateVariant } from '../../schemas/state-diagram';

export interface StateNormalNodeData {
  label: string;
  variant: StateVariant;
  description?: string;
  isActive?: boolean;
  isComplete?: boolean;
  isRevealed?: boolean;
  [key: string]: unknown;
}

function StateNormalNodeInner({ data }: NodeProps<StateNormalNodeData>) {
  const { label, variant = 'default', description, isActive, isComplete, isRevealed } = data;

  const stateClass = isActive
    ? 'node-active'
    : isComplete
      ? 'node-complete'
      : isRevealed === false
        ? 'node-dimmed'
        : '';

  const icon = STATE_VARIANT_ICONS[variant] || '●';

  return (
    <motion.div
      className={`state-diagram-node variant-${variant} ${stateClass}`}
      title={description}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      <span className="state-diagram-icon">{icon}</span>
      <span className="state-diagram-label">{label}</span>
      <NodeHandles />
    </motion.div>
  );
}

export const StateNormalNode = memo(StateNormalNodeInner);
