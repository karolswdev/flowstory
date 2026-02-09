import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { motion } from 'motion/react';
import type { ServiceNode as ServiceNodeType, HealthStatus } from '../../schemas/dependency-graph';
import { 
  getHealthStatus, 
  HEALTH_COLORS, 
  HEALTH_ICONS,
  SERVICE_TYPE_ICONS,
} from '../../schemas/dependency-graph';
import './dependency-graph.css';

interface ServiceNodeData extends ServiceNodeType {
  isActive?: boolean;
  isHighlighted?: boolean;
  isDimmed?: boolean;
  isFailing?: boolean;
}

/**
 * ServiceNode - Service in dependency graph with health indicator
 */
export const ServiceNode = memo(function ServiceNode({ 
  data,
  selected,
}: NodeProps<ServiceNodeData>) {
  const { 
    name, 
    type,
    health,
    latency,
    rps,
    owner,
    tech,
    entryPoint,
    icon,
    isActive,
    isHighlighted,
    isDimmed,
    isFailing,
  } = data;

  const healthStatus = getHealthStatus(health);
  const healthColor = HEALTH_COLORS[healthStatus];
  const healthIcon = HEALTH_ICONS[healthStatus];
  const typeIcon = icon || SERVICE_TYPE_ICONS[type];
  
  const stateClass = isFailing ? 'dg-failing' :
                     isActive ? 'dg-active' : 
                     isHighlighted ? 'dg-highlighted' :
                     isDimmed ? 'dg-dimmed' : '';

  return (
    <motion.div
      className={`dg-service-node ${stateClass} ${selected ? 'node-selected' : ''}`}
      style={{ '--health-color': healthColor } as React.CSSProperties}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ 
        opacity: isDimmed ? 0.4 : 1, 
        scale: isFailing ? [1, 1.02, 1] : 1,
      }}
      transition={{ 
        type: 'spring', 
        stiffness: 400, 
        damping: 30,
        scale: isFailing ? { duration: 0.5, repeat: Infinity } : undefined,
      }}
      data-testid="service-node"
    >
      {/* Health status bar */}
      <div className="dg-health-bar" style={{ backgroundColor: healthColor }} />

      {/* Entry point indicator */}
      {entryPoint && (
        <div className="dg-entry-point">▼ Entry</div>
      )}

      {/* Header: Icon + Name */}
      <div className="dg-header">
        <span className="dg-icon">{typeIcon}</span>
        <span className="dg-name">{name}</span>
      </div>

      {/* Health status */}
      <div className="dg-health">
        <span className="dg-health-icon">{healthIcon}</span>
        <span className="dg-health-value">
          {health !== undefined ? `${health.toFixed(1)}%` : 'N/A'}
        </span>
      </div>

      {/* Metrics */}
      <div className="dg-metrics">
        {latency !== undefined && (
          <span className="dg-metric">⏱ {latency}ms</span>
        )}
        {rps !== undefined && (
          <span className="dg-metric">📊 {rps}/s</span>
        )}
      </div>

      {/* Tech/Owner */}
      {(tech || owner) && (
        <div className="dg-footer">
          {tech && <span className="dg-tech">{tech}</span>}
          {owner && <span className="dg-owner">@{owner}</span>}
        </div>
      )}

      {/* Failing pulse */}
      {isFailing && (
        <motion.div
          className="dg-failing-pulse"
          initial={{ opacity: 0, scale: 1 }}
          animate={{ 
            opacity: [0.5, 0, 0.5],
            scale: [1, 1.1, 1],
          }}
          transition={{ duration: 1, repeat: Infinity }}
        />
      )}

      <Handle type="target" position={Position.Top} className="dg-handle" />
      <Handle type="source" position={Position.Bottom} className="dg-handle" />
      <Handle type="target" position={Position.Left} id="left" className="dg-handle" />
      <Handle type="source" position={Position.Right} id="right" className="dg-handle" />
    </motion.div>
  );
});
