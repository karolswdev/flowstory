import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { motion } from 'motion/react';
import type { Phase } from '../../schemas/migration-roadmap';
import { STATUS_COLORS, STATUS_ICONS } from '../../schemas/migration-roadmap';
import './migration-roadmap.css';

interface PhaseNodeData extends Phase {
  progress?: number;
  isActive?: boolean;
  isHighlighted?: boolean;
  isDimmed?: boolean;
}

/**
 * PhaseNode - Migration phase card
 */
export const PhaseNode = memo(function PhaseNode({ 
  data,
  selected,
}: NodeProps<PhaseNodeData>) {
  const { 
    name,
    description,
    timeline,
    status,
    progress = 0,
    milestones,
    isActive,
    isHighlighted,
    isDimmed,
  } = data;

  const statusColor = STATUS_COLORS[status];
  const statusIcon = STATUS_ICONS[status];
  
  const stateClass = isActive ? 'mr-active' : 
                     isHighlighted ? 'mr-highlighted' :
                     isDimmed ? 'mr-dimmed' : '';

  return (
    <motion.div
      className={`mr-phase ${stateClass} ${selected ? 'node-selected' : ''}`}
      style={{ '--status-color': statusColor } as React.CSSProperties}
      initial={{ opacity: 0, y: 20 }}
      animate={{ 
        opacity: isDimmed ? 0.4 : 1, 
        y: 0,
      }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      data-testid="phase-node"
    >
      {/* Status bar */}
      <div className="mr-status-bar" style={{ backgroundColor: statusColor }} />

      {/* Timeline badge */}
      {timeline && (
        <div className="mr-timeline">{timeline}</div>
      )}

      {/* Header */}
      <div className="mr-phase-header">
        <span className="mr-status-icon">{statusIcon}</span>
        <span className="mr-phase-name">{name}</span>
      </div>

      {/* Description */}
      {description && (
        <div className="mr-phase-desc">{description}</div>
      )}

      {/* Progress bar */}
      <div className="mr-progress-container">
        <div className="mr-progress-bar">
          <motion.div 
            className="mr-progress-fill"
            style={{ backgroundColor: statusColor }}
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </div>
        <span className="mr-progress-text">{progress.toFixed(0)}%</span>
      </div>

      {/* Milestones */}
      {milestones && milestones.length > 0 && (
        <div className="mr-milestones">
          {milestones.map((m, i) => (
            <div key={i} className={`mr-milestone ${m.done ? 'mr-done' : ''}`}>
              {m.done ? '✓' : '○'} {m.name}
            </div>
          ))}
        </div>
      )}

      <Handle type="target" position={Position.Left} className="mr-handle" />
      <Handle type="source" position={Position.Right} className="mr-handle" />
      <Handle type="source" position={Position.Bottom} id="bottom" className="mr-handle" />
    </motion.div>
  );
});
