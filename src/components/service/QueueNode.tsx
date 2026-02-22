import { motion } from 'motion/react';
import { memo } from 'react';
import { NodeHandles } from '../nodes/NodeHandles';
import type { QueueDef, QueueType } from '../../schemas/service-flow';
import { QUEUE_TYPE_ICONS } from '../../schemas/service-flow';

export interface QueueNodeData extends QueueDef {
  isActive?: boolean;
  isComplete?: boolean;
}

interface QueueNodeProps {
  data: QueueNodeData;
  selected?: boolean;
}

export const QueueNode = memo(function QueueNode({ data, selected }: QueueNodeProps) {
  const {
    name,
    type,
    broker,
    depth,
    consumers,
    isActive = false,
    isComplete = false,
  } = data;

  const icon = QUEUE_TYPE_ICONS[type as QueueType] || '📥';
  const stateClass = isActive ? 'active' : isComplete ? 'complete' : 'inactive';

  return (
    <motion.div
      className={`queue-node queue-node--${type} queue-node--${stateClass}`}
      data-state={stateClass}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ 
        opacity: 1, 
        scale: 1,
        boxShadow: isActive ? '0 0 12px rgba(156, 39, 176, 0.4)' : 'none',
      }}
      transition={{ duration: 0.2 }}
    >
      <NodeHandles />

      <div className="queue-node__header">
        <span className="queue-node__icon">{icon}</span>
        <span className="queue-node__name">{name}</span>
      </div>
      
      <div className="queue-node__divider" />
      
      <div className="queue-node__details">
        <span className="queue-node__type">{type}</span>
        {broker && (
          <>
            <span className="queue-node__sep">•</span>
            <span className="queue-node__broker">{broker}</span>
          </>
        )}
      </div>
      
      {(depth !== undefined || consumers !== undefined) && (
        <div className="queue-node__metrics">
          {depth !== undefined && (
            <span className="queue-node__depth">depth: {depth.toLocaleString()}</span>
          )}
          {consumers !== undefined && (
            <>
              <span className="queue-node__sep">•</span>
              <span className="queue-node__consumers">{consumers} ⬇</span>
            </>
          )}
        </div>
      )}
      
    </motion.div>
  );
});

export default QueueNode;
