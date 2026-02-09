import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { motion } from 'motion/react';
import type { C4Person } from '../../schemas/c4-context';
import { C4_COLORS } from '../../schemas/c4-context';
import './c4-context.css';

interface C4PersonNodeData extends C4Person {
  isActive?: boolean;
  isHighlighted?: boolean;
  isDimmed?: boolean;
}

/**
 * C4PersonNode - User/Actor in C4 Context diagram
 */
export const C4PersonNode = memo(function C4PersonNode({ 
  data,
  selected,
}: NodeProps<C4PersonNodeData>) {
  const { 
    name, 
    description,
    icon = '👤',
    external,
    role,
    isActive,
    isHighlighted,
    isDimmed,
  } = data;

  const bgColor = external ? C4_COLORS.personExternal : C4_COLORS.person;
  const stateClass = isActive ? 'c4-active' : 
                     isHighlighted ? 'c4-highlighted' :
                     isDimmed ? 'c4-dimmed' : '';

  return (
    <motion.div
      className={`c4-person-node ${stateClass} ${selected ? 'node-selected' : ''}`}
      style={{ '--node-color': bgColor } as React.CSSProperties}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ 
        opacity: isDimmed ? 0.4 : 1, 
        scale: 1,
      }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      data-testid="c4-person-node"
    >
      {/* Person icon (stick figure style top) */}
      <div className="c4-person-avatar">
        <motion.span 
          className="c4-person-icon"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1, type: 'spring' }}
        >
          {icon}
        </motion.span>
      </div>

      {/* Name and description */}
      <div className="c4-person-body">
        <div className="c4-person-name">{name}</div>
        {role && <div className="c4-person-role">[{role}]</div>}
        {description && (
          <div className="c4-person-description">{description}</div>
        )}
      </div>

      {/* External badge */}
      {external && (
        <motion.div 
          className="c4-external-badge"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          External
        </motion.div>
      )}

      {/* Active glow */}
      {isActive && (
        <motion.div
          className="c4-glow"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      )}

      <Handle type="source" position={Position.Bottom} className="c4-handle" />
      <Handle type="target" position={Position.Top} className="c4-handle" />
      <Handle type="source" position={Position.Right} id="right" className="c4-handle" />
      <Handle type="target" position={Position.Left} id="left" className="c4-handle" />
    </motion.div>
  );
});
