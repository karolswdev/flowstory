import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { motion } from 'motion/react';
import type { Task } from '../../schemas/migration-roadmap';
import { STATUS_COLORS, STATUS_ICONS, RISK_COLORS } from '../../schemas/migration-roadmap';
import './migration-roadmap.css';

interface TaskNodeData extends Task {
  isActive?: boolean;
  isHighlighted?: boolean;
  isDimmed?: boolean;
}

/**
 * TaskNode - Individual migration task
 */
export const TaskNode = memo(function TaskNode({ 
  data,
  selected,
}: NodeProps<TaskNodeData>) {
  const { 
    name,
    description,
    status,
    progress = 0,
    owner,
    risk,
    notes,
    isActive,
    isHighlighted,
    isDimmed,
  } = data;

  const statusColor = STATUS_COLORS[status];
  const statusIcon = STATUS_ICONS[status];
  const riskColor = risk ? RISK_COLORS[risk] : undefined;
  
  const stateClass = isActive ? 'mr-active' : 
                     isHighlighted ? 'mr-highlighted' :
                     isDimmed ? 'mr-dimmed' : '';

  return (
    <motion.div
      className={`mr-task ${stateClass} ${selected ? 'node-selected' : ''}`}
      style={{ '--status-color': statusColor } as React.CSSProperties}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ 
        opacity: isDimmed ? 0.4 : 1, 
        scale: 1,
      }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      data-testid="task-node"
    >
      {/* Status indicator */}
      <div className="mr-task-status" style={{ backgroundColor: statusColor }}>
        {statusIcon}
      </div>

      {/* Content */}
      <div className="mr-task-content">
        <div className="mr-task-name">{name}</div>
        
        {description && (
          <div className="mr-task-desc">{description}</div>
        )}

        {/* Progress for active tasks */}
        {status === 'active' && (
          <div className="mr-task-progress">
            <div className="mr-task-progress-bar">
              <div 
                className="mr-task-progress-fill"
                style={{ width: `${progress}%`, backgroundColor: statusColor }}
              />
            </div>
            <span>{progress}%</span>
          </div>
        )}

        {/* Owner */}
        {owner && (
          <div className="mr-task-owner">@{owner}</div>
        )}

        {/* Risk badge */}
        {risk && risk !== 'low' && (
          <div className="mr-task-risk" style={{ backgroundColor: riskColor }}>
            ⚠️ {risk}
          </div>
        )}

        {/* Notes/blocker reason */}
        {notes && status === 'blocked' && (
          <div className="mr-task-notes">{notes}</div>
        )}
      </div>

      <Handle type="target" position={Position.Top} className="mr-handle" />
      <Handle type="source" position={Position.Bottom} className="mr-handle" />
    </motion.div>
  );
});
