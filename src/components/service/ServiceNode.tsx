import { motion } from 'motion/react';
import { memo, useMemo } from 'react';
import { NodeHandles } from '../nodes/NodeHandles';
import { NodeTags } from '../shared';
import { EffectWrapper } from '../../effects';
import { SubstateBadge } from './SubstateBadge';
import type { ServiceDef, HealthStatus, ServiceType } from '../../schemas/service-flow';
import type { EffectConfig } from '../../effects';
import {
  SERVICE_TYPE_ICONS,
  STATUS_COLORS,
} from '../../schemas/service-flow';

export interface ServiceNodeData extends ServiceDef {
  isActive?: boolean;
  isComplete?: boolean;
  isNew?: boolean;
  substate?: string;
  isFailed?: boolean;
}

interface ServiceNodeProps {
  data: ServiceNodeData;
  selected?: boolean;
}

const statusIndicator = (status?: HealthStatus) => {
  if (!status) return null;
  const color = STATUS_COLORS[status];
  return (
    <span className="service-node__status-inline" style={{ color }}>
      <span className="status-dot" style={{ backgroundColor: color }} />
      {status}
    </span>
  );
};

/** Build programmatic effects based on node status */
function buildStatusEffects(status?: HealthStatus, isNew?: boolean): EffectConfig[] {
  const effects: EffectConfig[] = [];
  if (isNew) {
    effects.push({ type: 'pulse', trigger: 'on-reveal', params: { scale: 1.08, duration: 600 } });
  }
  if (status === 'down') {
    effects.push({ type: 'shake', trigger: 'continuous', params: { intensity: 0.4, frequency: 6 } });
  } else if (status === 'degraded') {
    effects.push({ type: 'pulse', trigger: 'continuous', params: { scale: 1.03, duration: 2000 } });
  }
  return effects;
}

export const ServiceNode = memo(function ServiceNode({ data, selected }: ServiceNodeProps) {
  const {
    id,
    name,
    type,
    technology,
    status,
    instances,
    version,
    isActive = false,
    isComplete = false,
    isNew = false,
    substate,
    isFailed = false,
  } = data;

  const IconComponent = SERVICE_TYPE_ICONS[type as ServiceType];
  const stateClass = isActive ? 'active' : isComplete ? 'complete' : 'inactive';
  const failureClass = isFailed ? 'service-node--failure-down' : '';
  const isMultiInstance = instances !== undefined && instances > 1;
  const effects = useMemo(() => buildStatusEffects(status, isNew), [status, isNew]);

  return (
    <EffectWrapper
      nodeId={id}
      effects={effects}
      isActive={isActive}
      isRevealed={!isNew || isActive || isComplete}
    >
      <motion.div
        className={`service-node service-node--${type} service-node--${stateClass}${isMultiInstance ? ' service-node--multi-instance' : ''} ${failureClass}`}
        data-state={stateClass}
        initial={isNew ? { opacity: 0, x: -20, scale: 0.8 } : { opacity: 0, scale: 0.9 }}
        animate={{
          opacity: 1,
          x: 0,
          scale: 1,
          filter: isActive ? 'brightness(1.05)' : 'brightness(1)',
        }}
        transition={isNew
          ? { type: 'spring', stiffness: 400, damping: 25, mass: 0.8 }
          : { duration: 0.2 }
        }
      >
        <NodeHandles />
        {isMultiInstance && (
          <span className="service-node__instance-badge">{instances}x</span>
        )}

        <div className="service-node__header">
          <span className="service-node__icon-badge">
            {IconComponent && <IconComponent size={16} strokeWidth={2} />}
          </span>
          <span className="service-node__name">{name}</span>
          {version && <span className="service-node__version">v{version}</span>}
        </div>

        <div className="service-node__details">
          <span className="service-node__type-pill">{type}</span>
          {technology && (
            <span className="service-node__tech">{technology}</span>
          )}
          {status && statusIndicator(status)}
        </div>

        <NodeTags tags={data.tags} />
        <SubstateBadge substate={substate} serviceType={type as ServiceType} />
      </motion.div>
    </EffectWrapper>
  );
});

export default ServiceNode;
