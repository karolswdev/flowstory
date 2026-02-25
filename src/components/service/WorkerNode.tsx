import { motion } from 'motion/react';
import { memo, useMemo } from 'react';
import { Hammer, Activity } from 'lucide-react';
import { NodeHandles } from '../nodes/NodeHandles';
import { EffectWrapper } from '../../effects';
import { SubstateBadge } from './SubstateBadge';
import type { ServiceNodeData } from './ServiceNode';
import type { ServiceType } from '../../schemas/service-flow';

interface WorkerNodeProps {
  data: ServiceNodeData;
}

const REVEAL_EFFECTS = [{ type: 'pulse' as const, trigger: 'on-reveal' as const, params: { scale: 1.08, duration: 500 } }];

export const WorkerNode = memo(function WorkerNode({ data }: WorkerNodeProps) {
  const { id, name, type, technology, isActive = false, isComplete = false, isNew = false, isFailed = false, substate } = data;
  const stateClass = isActive ? 'active' : isComplete ? 'complete' : 'inactive';
  const failureClass = isFailed ? 'shape-node--failure-down' : '';
  const IconComponent = type === 'event-processor' ? Activity : Hammer;
  const effects = useMemo(() => isNew ? REVEAL_EFFECTS : [], [isNew]);

  return (
    <EffectWrapper nodeId={id} effects={effects} isActive={isActive} isRevealed={!isNew || isActive || isComplete}>
    <motion.div
      className={`shape-node shape-node--worker shape-node--${stateClass} ${failureClass}`}
      initial={isNew ? { opacity: 0, y: -30, scale: 0.8 } : { opacity: 0, scale: 0.9 }}
      animate={{
        opacity: 1,
        y: 0,
        scale: isActive ? [1, 1.02, 1] : 1,
      }}
      transition={isNew
        ? { type: 'spring', stiffness: 500, damping: 25, mass: 0.7 }
        : {
            duration: 0.2,
            ...(isActive ? { scale: { duration: 1.2, repeat: Infinity, ease: 'easeInOut' } } : {}),
          }
      }
    >
      <NodeHandles />
      <div className="shape-node__body">
        <span className="shape-node__icon-badge">
          <IconComponent size={16} strokeWidth={2} />
        </span>
        <span className="shape-node__name">{name}</span>
        {technology && <span className="shape-node__tech">{technology}</span>}
      </div>
      <SubstateBadge substate={substate} serviceType={data.type as ServiceType} />
    </motion.div>
    </EffectWrapper>
  );
});

export default WorkerNode;
