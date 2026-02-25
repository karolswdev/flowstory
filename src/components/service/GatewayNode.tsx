import { motion } from 'motion/react';
import { memo, useMemo } from 'react';
import { Globe } from 'lucide-react';
import { NodeHandles } from '../nodes/NodeHandles';
import { EffectWrapper } from '../../effects';
import { SubstateBadge } from './SubstateBadge';
import type { ServiceNodeData } from './ServiceNode';
import type { ServiceType } from '../../schemas/service-flow';

interface GatewayNodeProps {
  data: ServiceNodeData;
}

const REVEAL_EFFECTS = [{ type: 'pulse' as const, trigger: 'on-reveal' as const, params: { scale: 1.08, duration: 600 } }];

export const GatewayNode = memo(function GatewayNode({ data }: GatewayNodeProps) {
  const { id, name, technology, isActive = false, isComplete = false, isNew = false, isFailed = false, substate } = data;
  const stateClass = isActive ? 'active' : isComplete ? 'complete' : 'inactive';
  const failureClass = isFailed ? 'shape-node--failure-down' : '';
  const effects = useMemo(() => isNew ? REVEAL_EFFECTS : [], [isNew]);

  return (
    <EffectWrapper nodeId={id} effects={effects} isActive={isActive} isRevealed={!isNew || isActive || isComplete}>
    <motion.div
      className={`shape-node shape-node--gateway shape-node--${stateClass} ${failureClass}`}
      initial={isNew ? { opacity: 0, rotate: 45, scale: 0.6 } : { opacity: 0, scale: 0.9 }}
      animate={{
        opacity: 1,
        rotate: 0,
        scale: 1,
      }}
      transition={isNew
        ? { type: 'spring', stiffness: 300, damping: 20, mass: 0.8 }
        : { duration: 0.2 }
      }
    >
      <NodeHandles />
      <div className="shape-node__body">
        <span className="shape-node__icon-badge">
          <Globe size={16} strokeWidth={2} />
        </span>
        <span className="shape-node__name">{name}</span>
        {technology && <span className="shape-node__tech">{technology}</span>}
      </div>
      <SubstateBadge substate={substate} serviceType={data.type as ServiceType} />
    </motion.div>
    </EffectWrapper>
  );
});

export default GatewayNode;
