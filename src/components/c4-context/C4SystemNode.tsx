import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { motion, AnimatePresence } from 'motion/react';
import type { C4System } from '../../schemas/c4-context';
import './c4-context.css';

interface C4SystemNodeData extends C4System {
  isActive?: boolean;
  isHighlighted?: boolean;
  isDimmed?: boolean;
  showCapabilities?: boolean;
}

/**
 * C4SystemNode - The main system being described (center of diagram)
 */
export const C4SystemNode = memo(function C4SystemNode({ 
  data,
  selected,
}: NodeProps<C4SystemNodeData>) {
  const { 
    name, 
    description,
    icon = '🏢',
    color = '#2196F3',
    capabilities,
    technology,
    isActive,
    isHighlighted,
    isDimmed,
    showCapabilities,
  } = data;

  const stateClass = isActive ? 'c4-active' : 
                     isHighlighted ? 'c4-highlighted' :
                     isDimmed ? 'c4-dimmed' : '';

  return (
    <motion.div
      className={`c4-system-node ${stateClass} ${selected ? 'node-selected' : ''}`}
      style={{ '--system-color': color } as React.CSSProperties}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ 
        opacity: isDimmed ? 0.4 : 1, 
        scale: isActive ? 1.02 : 1,
      }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      data-testid="c4-system-node"
    >
      {/* System icon */}
      <motion.div 
        className="c4-system-icon"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.1, type: 'spring' }}
      >
        {icon}
      </motion.div>

      {/* Name */}
      <div className="c4-system-name">{name}</div>

      {/* Description */}
      <div className="c4-system-description">{description}</div>

      {/* Technology badge */}
      {technology && (
        <div className="c4-system-tech">[{technology}]</div>
      )}

      {/* Capabilities (expandable) */}
      <AnimatePresence>
        {showCapabilities && capabilities && capabilities.length > 0 && (
          <motion.div
            className="c4-system-capabilities"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
          >
            <div className="c4-capabilities-label">Capabilities:</div>
            <ul>
              {capabilities.map((cap, i) => (
                <li key={i}>{cap}</li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pulsing ring when active */}
      {isActive && (
        <motion.div
          className="c4-system-pulse"
          initial={{ opacity: 0, scale: 1 }}
          animate={{ 
            opacity: [0.4, 0.7, 0.4],
            scale: [1, 1.02, 1],
          }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}

      <Handle type="target" position={Position.Top} className="c4-handle" />
      <Handle type="source" position={Position.Bottom} className="c4-handle" />
      <Handle type="target" position={Position.Left} id="left" className="c4-handle" />
      <Handle type="source" position={Position.Right} id="right" className="c4-handle" />
    </motion.div>
  );
});
