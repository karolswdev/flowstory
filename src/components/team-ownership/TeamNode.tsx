import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { motion, AnimatePresence } from 'motion/react';
import type { Team } from '../../schemas/team-ownership';
import './team-ownership.css';

interface TeamNodeData extends Team {
  isActive?: boolean;
  isComplete?: boolean;
  showServices?: boolean;
  serviceCount?: number;
}

/**
 * TeamNode - Container representing a team's domain
 * 
 * Displays team name, icon, headcount badge, and contains service nodes.
 */
export const TeamNode = memo(function TeamNode({ 
  data,
  selected,
}: NodeProps<TeamNodeData>) {
  const { 
    name, 
    icon = '👥', 
    color = '#2196F3',
    headcount,
    lead,
    slack,
    isActive,
    serviceCount = 0,
  } = data;

  const stateClass = isActive ? 'node-active' : '';

  return (
    <motion.div
      className={`team-node ${stateClass} ${selected ? 'node-selected' : ''}`}
      style={{ 
        '--team-color': color,
        borderColor: color,
      } as React.CSSProperties}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ 
        opacity: 1, 
        scale: 1,
        boxShadow: isActive 
          ? `0 0 0 3px ${color}40, 0 8px 32px ${color}30`
          : '0 4px 16px rgba(0,0,0,0.1)',
      }}
      transition={{ duration: 0.3 }}
      data-testid="team-node"
    >
      {/* Team Header */}
      <motion.div 
        className="team-header"
        style={{ backgroundColor: `${color}15` }}
      >
        <span className="team-icon">{icon}</span>
        <span className="team-name">{name}</span>
        
        {/* Headcount Badge */}
        {headcount && (
          <motion.span 
            className="team-headcount"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
          >
            👤 {headcount}
          </motion.span>
        )}
      </motion.div>

      {/* Team Info */}
      <div className="team-info">
        {lead && (
          <div className="team-lead">
            <span className="info-label">Lead:</span> {lead}
          </div>
        )}
        {slack && (
          <div className="team-slack">
            <span className="info-label">Slack:</span> {slack}
          </div>
        )}
        {serviceCount > 0 && (
          <div className="team-services-count">
            <span className="info-label">Services:</span> {serviceCount}
          </div>
        )}
      </div>

      {/* Active Pulse */}
      <AnimatePresence>
        {isActive && (
          <motion.div
            className="team-pulse"
            style={{ borderColor: color }}
            initial={{ opacity: 0, scale: 1 }}
            animate={{ 
              opacity: [0.5, 0, 0.5],
              scale: [1, 1.05, 1],
            }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        )}
      </AnimatePresence>

      {/* Connection handles */}
      <Handle type="source" position={Position.Right} className="team-handle" />
      <Handle type="target" position={Position.Left} className="team-handle" />
      <Handle type="source" position={Position.Bottom} id="bottom" className="team-handle" />
      <Handle type="target" position={Position.Top} id="top" className="team-handle" />
    </motion.div>
  );
});
