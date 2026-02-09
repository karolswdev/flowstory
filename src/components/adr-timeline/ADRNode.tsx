import { memo, useState } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { motion, AnimatePresence } from 'motion/react';
import type { ADR, ADRStatus } from '../../schemas/adr-timeline';
import { STATUS_STYLES } from '../../schemas/adr-timeline';
import './adr-timeline.css';

interface ADRNodeData extends ADR {
  isActive?: boolean;
  isHighlighted?: boolean;
  isDimmed?: boolean;
  isExpanded?: boolean;
  categoryColor?: string;
}

/**
 * ADRNode - Card representing an Architecture Decision Record
 */
export const ADRNode = memo(function ADRNode({ 
  data,
  selected,
}: NodeProps<ADRNodeData>) {
  const [localExpanded, setLocalExpanded] = useState(false);
  
  const { 
    number,
    title, 
    status,
    date,
    context,
    decision,
    consequences,
    isActive,
    isHighlighted,
    isDimmed,
    isExpanded = localExpanded,
    categoryColor = '#2196F3',
  } = data;

  const statusStyle = STATUS_STYLES[status];
  const isStruck = status === 'superseded' || status === 'rejected';
  
  const stateClass = isActive ? 'adr-active' : 
                     isHighlighted ? 'adr-highlighted' :
                     isDimmed ? 'adr-dimmed' : '';

  return (
    <motion.div
      className={`adr-node ${stateClass} ${selected ? 'node-selected' : ''}`}
      style={{ 
        '--category-color': categoryColor,
        '--status-color': statusStyle.color,
      } as React.CSSProperties}
      initial={{ opacity: 0, y: 20 }}
      animate={{ 
        opacity: isDimmed ? 0.4 : 1, 
        y: 0,
        scale: isActive ? 1.02 : 1,
      }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      onClick={() => setLocalExpanded(!localExpanded)}
      data-testid="adr-node"
    >
      {/* Category indicator */}
      <div className="adr-category-bar" />

      {/* Header */}
      <div className="adr-header">
        <span className="adr-number">ADR-{number.toString().padStart(3, '0')}</span>
        <motion.span 
          className="adr-status"
          style={{ backgroundColor: statusStyle.color }}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring' }}
        >
          {statusStyle.icon} {statusStyle.label}
        </motion.span>
      </div>

      {/* Title */}
      <h3 className={`adr-title ${isStruck ? 'adr-struck' : ''}`}>
        {title}
      </h3>

      {/* Date */}
      <div className="adr-date">
        📅 {new Date(date).toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'short', 
          day: 'numeric' 
        })}
      </div>

      {/* Expandable content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            className="adr-details"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {context && (
              <div className="adr-section">
                <strong>Context:</strong>
                <p>{context}</p>
              </div>
            )}
            {decision && (
              <div className="adr-section">
                <strong>Decision:</strong>
                <p>{decision}</p>
              </div>
            )}
            {consequences && consequences.length > 0 && (
              <div className="adr-section">
                <strong>Consequences:</strong>
                <ul>
                  {consequences.map((c, i) => (
                    <li key={i}>{c}</li>
                  ))}
                </ul>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Expand indicator */}
      <motion.div 
        className="adr-expand-hint"
        animate={{ rotate: isExpanded ? 180 : 0 }}
      >
        ▼
      </motion.div>

      {/* Active glow */}
      {isActive && (
        <motion.div
          className="adr-glow"
          initial={{ opacity: 0 }}
          animate={{ 
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      )}

      {/* Handles for relationships */}
      <Handle type="source" position={Position.Right} className="adr-handle" />
      <Handle type="target" position={Position.Left} className="adr-handle" />
      <Handle type="source" position={Position.Bottom} id="bottom" className="adr-handle" />
      <Handle type="target" position={Position.Top} id="top" className="adr-handle" />
    </motion.div>
  );
});
