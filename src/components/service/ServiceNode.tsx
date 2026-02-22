import { motion } from 'motion/react';
import { memo } from 'react';
import { NodeHandles } from '../nodes/NodeHandles';
import type { ServiceDef, HealthStatus, ServiceType } from '../../schemas/service-flow';
import {
  SERVICE_TYPE_ICONS,
  SERVICE_TYPE_COLORS,
  STATUS_COLORS,
} from '../../schemas/service-flow';

export interface ServiceNodeData extends ServiceDef {
  isActive?: boolean;
  isComplete?: boolean;
}

interface ServiceNodeProps {
  data: ServiceNodeData;
  selected?: boolean;
}

const statusIndicator = (status?: HealthStatus) => {
  if (!status) return null;
  const color = STATUS_COLORS[status];
  return (
    <span className="service-status" style={{ color }}>
      <span className="status-dot" style={{ backgroundColor: color }} />
      {status}
    </span>
  );
};

export const ServiceNode = memo(function ServiceNode({ data, selected }: ServiceNodeProps) {
  const {
    name,
    type,
    technology,
    status,
    instances,
    isActive = false,
    isComplete = false,
  } = data;

  const icon = SERVICE_TYPE_ICONS[type as ServiceType] || '⚙️';
  const borderColor = SERVICE_TYPE_COLORS[type as ServiceType] || '#2196F3';

  const stateClass = isActive ? 'active' : isComplete ? 'complete' : 'inactive';

  return (
    <motion.div
      className={`service-node service-node--${type} service-node--${stateClass}`}
      data-state={stateClass}
      style={{
        borderColor: isActive ? borderColor : undefined,
        boxShadow: isActive ? `0 0 12px ${borderColor}40` : undefined,
      }}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ 
        opacity: 1, 
        scale: 1,
        filter: isActive ? 'brightness(1.1)' : 'brightness(1)',
      }}
      transition={{ duration: 0.2 }}
    >
      <NodeHandles />

      <div className="service-node__header">
        <span className="service-node__icon">{icon}</span>
        <span className="service-node__name">{name}</span>
      </div>
      
      <div className="service-node__divider" />
      
      <div className="service-node__details">
        <span className="service-node__type">{type}</span>
        {technology && (
          <>
            <span className="service-node__sep">•</span>
            <span className="service-node__tech">{technology}</span>
          </>
        )}
        {instances && instances > 1 && (
          <>
            <span className="service-node__sep">•</span>
            <span className="service-node__instances">{instances}x</span>
          </>
        )}
      </div>
      
      {status && (
        <div className="service-node__status">
          {statusIndicator(status)}
        </div>
      )}
      
    </motion.div>
  );
});

export default ServiceNode;
