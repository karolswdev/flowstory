import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { motion } from 'framer-motion';
import type { JobDef, JobStatus } from '../../schemas/pipeline';
import { JOB_STATUS_COLORS, JOB_STATUS_ICONS } from '../../schemas/pipeline';

export interface JobNodeData extends JobDef {
  isActive?: boolean;
  isComplete?: boolean;
}

interface JobNodeProps {
  data: JobNodeData;
  selected?: boolean;
}

const formatDuration = (ms?: number) => {
  if (!ms) return '';
  if (ms < 1000) return `${ms}ms`;
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
};

export const JobNode = memo(function JobNode({ data, selected }: JobNodeProps) {
  const {
    name,
    status,
    runner,
    duration,
    isActive = false,
    isComplete = false,
  } = data;

  const statusColor = JOB_STATUS_COLORS[status as JobStatus] || '#9E9E9E';
  const statusIcon = JOB_STATUS_ICONS[status as JobStatus] || '⏳';
  const stateClass = isActive ? 'active' : isComplete ? 'complete' : 'inactive';

  return (
    <motion.div
      className={`job-node job-node--${status} job-node--${stateClass}`}
      data-state={stateClass}
      data-status={status}
      style={{ borderColor: statusColor }}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ 
        opacity: 1, 
        scale: 1,
        boxShadow: isActive ? `0 0 12px ${statusColor}60` : 'none',
      }}
      transition={{ duration: 0.2 }}
    >
      <Handle type="target" position={Position.Left} className="job-handle" />
      
      <div className="job-node__header">
        <span className="job-node__icon">{statusIcon}</span>
        <span className="job-node__name">{name}</span>
      </div>
      
      <div className="job-node__details">
        {runner && <span className="job-node__runner">🖥️ {runner}</span>}
        {duration && <span className="job-node__duration">⏱️ {formatDuration(duration)}</span>}
      </div>
      
      {status === 'running' && (
        <motion.div 
          className="job-node__progress"
          initial={{ width: '0%' }}
          animate={{ width: '100%' }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        />
      )}
      
      <Handle type="source" position={Position.Right} className="job-handle" />
    </motion.div>
  );
});

export default JobNode;
