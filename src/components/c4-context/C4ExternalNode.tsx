import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { motion } from 'motion/react';
import type { C4ExternalSystem } from '../../schemas/c4-context';
import { C4_COLORS, C4_ICONS } from '../../schemas/c4-context';
import './c4-context.css';

interface C4ExternalNodeData extends C4ExternalSystem {
  isActive?: boolean;
  isHighlighted?: boolean;
  isDimmed?: boolean;
}

const TYPE_ICONS: Record<string, string> = {
  saas: C4_ICONS.externalSaas,
  api: C4_ICONS.externalApi,
  database: C4_ICONS.externalDatabase,
  legacy: C4_ICONS.externalLegacy,
  partner: C4_ICONS.externalPartner,
  infrastructure: C4_ICONS.externalInfra,
};

/**
 * C4ExternalNode - External system dependency
 */
export const C4ExternalNode = memo(function C4ExternalNode({ 
  data,
  selected,
}: NodeProps<C4ExternalNodeData>) {
  const { 
    name, 
    description,
    icon,
    vendor,
    critical,
    type,
    isActive,
    isHighlighted,
    isDimmed,
  } = data;

  const displayIcon = icon || (type ? TYPE_ICONS[type] : '🔗') || '🔗';
  const stateClass = isActive ? 'c4-active' : 
                     isHighlighted ? 'c4-highlighted' :
                     isDimmed ? 'c4-dimmed' : '';

  return (
    <motion.div
      className={`c4-external-node ${stateClass} ${critical ? 'c4-critical' : ''} ${selected ? 'node-selected' : ''}`}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ 
        opacity: isDimmed ? 0.4 : 1, 
        scale: 1,
      }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      data-testid="c4-external-node"
    >
      {/* External system icon */}
      <motion.div 
        className="c4-external-icon"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.1, type: 'spring' }}
      >
        {displayIcon}
      </motion.div>

      {/* Name */}
      <div className="c4-external-name">{name}</div>

      {/* Vendor badge */}
      {vendor && (
        <div className="c4-external-vendor">[{vendor}]</div>
      )}

      {/* Description */}
      {description && (
        <div className="c4-external-description">{description}</div>
      )}

      {/* Critical badge */}
      {critical && (
        <motion.div 
          className="c4-critical-badge"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring' }}
        >
          ⚠️ Critical
        </motion.div>
      )}

      {/* External system label */}
      <div className="c4-external-label">
        [External System]
      </div>

      {/* Active glow */}
      {isActive && (
        <motion.div
          className="c4-glow c4-glow-external"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      )}

      <Handle type="target" position={Position.Top} className="c4-handle" />
      <Handle type="source" position={Position.Bottom} className="c4-handle" />
      <Handle type="target" position={Position.Left} id="left" className="c4-handle" />
      <Handle type="source" position={Position.Right} id="right" className="c4-handle" />
    </motion.div>
  );
});
