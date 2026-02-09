import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { motion, AnimatePresence } from 'motion/react';
import type { Service, ServiceType, Criticality } from '../../schemas/team-ownership';
import { SERVICE_TYPE_ICONS, CRITICALITY_COLORS } from '../../schemas/team-ownership';
import './team-ownership.css';

interface ServiceNodeData extends Service {
  isActive?: boolean;
  isComplete?: boolean;
  isGap?: boolean; // Ownership gap
}

/**
 * ServiceNode - Represents a service/component
 * 
 * Shows service type icon, name, criticality indicator.
 * Special styling for ownership gaps (no team).
 */
export const ServiceNode = memo(function ServiceNode({ 
  data,
  selected,
}: NodeProps<ServiceNodeData>) {
  const { 
    name, 
    type,
    criticality = 'medium',
    description,
    tech,
    shared,
    isActive,
    isGap,
  } = data;

  const icon = SERVICE_TYPE_ICONS[type] || '📦';
  const criticalityColor = CRITICALITY_COLORS[criticality];
  const stateClass = isActive ? 'node-active' : '';
  const gapClass = isGap ? 'service-gap' : '';
  const sharedClass = shared ? 'service-shared' : '';

  return (
    <motion.div
      className={`service-node ${stateClass} ${gapClass} ${sharedClass} ${selected ? 'node-selected' : ''}`}
      initial={{ opacity: 0, scale: 0.8, y: 10 }}
      animate={{ 
        opacity: 1, 
        scale: 1, 
        y: 0,
      }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      data-testid="service-node"
      title={description}
    >
      {/* Criticality indicator */}
      <motion.div 
        className="service-criticality"
        style={{ backgroundColor: criticalityColor }}
        initial={{ width: 0 }}
        animate={{ width: '100%' }}
        transition={{ delay: 0.2, duration: 0.3 }}
      />

      {/* Icon */}
      <motion.div 
        className="service-icon"
        animate={isActive ? {
          scale: [1, 1.1, 1],
          rotate: [0, 5, -5, 0],
        } : {}}
        transition={{ duration: 0.6, repeat: isActive ? Infinity : 0, repeatDelay: 1 }}
      >
        {icon}
      </motion.div>

      {/* Name */}
      <div className="service-name" title={name}>
        {name}
      </div>

      {/* Tech tags */}
      {tech && tech.length > 0 && (
        <div className="service-tech">
          {tech.slice(0, 2).map((t, i) => (
            <span key={i} className="tech-tag">{t}</span>
          ))}
        </div>
      )}

      {/* Gap warning */}
      <AnimatePresence>
        {isGap && (
          <motion.div
            className="gap-warning"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ 
              opacity: 1, 
              scale: 1,
            }}
            exit={{ opacity: 0, scale: 0 }}
          >
            ⚠️ No Owner
          </motion.div>
        )}
      </AnimatePresence>

      {/* Shared indicator */}
      {shared && (
        <div className="shared-indicator" title="Shared across teams">
          🤝
        </div>
      )}

      {/* Active glow */}
      <AnimatePresence>
        {isActive && (
          <motion.div
            className="service-glow"
            initial={{ opacity: 0 }}
            animate={{ 
              opacity: [0.3, 0.6, 0.3],
              boxShadow: [
                '0 0 10px rgba(33, 150, 243, 0.3)',
                '0 0 20px rgba(33, 150, 243, 0.5)',
                '0 0 10px rgba(33, 150, 243, 0.3)',
              ],
            }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        )}
      </AnimatePresence>

      {/* Handles */}
      <Handle type="source" position={Position.Right} className="service-handle" />
      <Handle type="target" position={Position.Left} className="service-handle" />
    </motion.div>
  );
});
