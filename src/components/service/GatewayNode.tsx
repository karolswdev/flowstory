import { motion } from 'motion/react';
import { memo } from 'react';
import { NodeHandles } from '../nodes/NodeHandles';
import type { ServiceNodeData } from './ServiceNode';

interface GatewayNodeProps {
  data: ServiceNodeData;
}

export const GatewayNode = memo(function GatewayNode({ data }: GatewayNodeProps) {
  const { name, technology, isActive = false, isComplete = false, isNew = false } = data;
  const stateClass = isActive ? 'active' : isComplete ? 'complete' : 'inactive';

  return (
    <motion.div
      className={`shape-node shape-node--gateway shape-node--${stateClass}`}
      initial={isNew ? { opacity: 0, scale: 0.6 } : { opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={isNew ? { type: 'spring', stiffness: 400, damping: 25, mass: 0.8 } : { duration: 0.2 }}
    >
      <NodeHandles />
      <div className="shape-node__body">
        <span className="shape-node__icon">🚪</span>
        <span className="shape-node__name">{name}</span>
        {technology && <span className="shape-node__tech">{technology}</span>}
      </div>
    </motion.div>
  );
});

export default GatewayNode;
