import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { motion, AnimatePresence } from 'motion/react';
import type { BCDeploymentNode } from '../../schemas/bc-deployment';
import './bc-deployment.css';

interface BCCoreNodeProps {
  data: {
    bc: BCDeploymentNode & { type: 'bc-core' };
    isActive?: boolean;
    isComplete?: boolean;
  };
  selected?: boolean;
}

/**
 * BCCoreNode - Central bounded context node
 * Large circular node with icon, name, and event indicators
 */
export const BCCoreNode = memo(function BCCoreNode({ data, selected }: BCCoreNodeProps) {
  const { bc, isActive, isComplete } = data;
  const stateClass = isActive ? 'node-active' : isComplete ? 'node-complete' : '';

  return (
    <motion.div
      className={`bc-core-node ${stateClass} ${selected ? 'node-selected' : ''}`}
      data-testid="bc-core-node"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ 
        scale: 1, 
        opacity: 1,
        boxShadow: isActive 
          ? `0 0 40px ${bc.color || '#4CAF50'}40`
          : '0 8px 32px rgba(0,0,0,0.15)'
      }}
      transition={{ 
        type: 'spring', 
        stiffness: 300, 
        damping: 25,
        delay: 0.1 
      }}
      style={{
        '--bc-color': bc.color || '#4CAF50',
      } as React.CSSProperties}
    >
      {/* Pulsing ring when active */}
      <AnimatePresence>
        {isActive && (
          <motion.div
            className="bc-core-pulse"
            initial={{ scale: 0.8, opacity: 0.5 }}
            animate={{ scale: 1.5, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        )}
      </AnimatePresence>

      {/* Icon */}
      <motion.div 
        className="bc-core-icon"
        animate={isActive ? { 
          scale: [1, 1.1, 1],
          rotate: [0, 5, -5, 0]
        } : {}}
        transition={{ duration: 2, repeat: Infinity }}
      >
        {bc.icon}
      </motion.div>

      {/* Name */}
      <div className="bc-core-name">{bc.name}</div>

      {/* Event indicators */}
      {(bc.publishes?.length || bc.subscribes?.length) && (
        <div className="bc-core-events">
          {bc.publishes?.length && (
            <span className="bc-event-badge bc-event-publishes" title={`Publishes: ${bc.publishes.join(', ')}`}>
              ↑ {bc.publishes.length}
            </span>
          )}
          {bc.subscribes?.length && (
            <span className="bc-event-badge bc-event-subscribes" title={`Subscribes: ${bc.subscribes.join(', ')}`}>
              ↓ {bc.subscribes.length}
            </span>
          )}
        </div>
      )}

      {/* Connection handles (hidden, for edge routing) */}
      <Handle type="source" position={Position.Right} className="bc-handle" />
      <Handle type="source" position={Position.Bottom} className="bc-handle" />
      <Handle type="source" position={Position.Left} className="bc-handle" />
      <Handle type="source" position={Position.Top} className="bc-handle" />
    </motion.div>
  );
});

export default BCCoreNode;
