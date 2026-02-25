import { motion } from 'motion/react';
import { memo, useMemo } from 'react';
import { Cloud } from 'lucide-react';
import { NodeHandles } from '../nodes/NodeHandles';
import { EffectWrapper } from '../../effects';
import { SubstateBadge } from './SubstateBadge';
import type { ServiceNodeData } from './ServiceNode';
import type { ServiceType } from '../../schemas/service-flow';

interface ExternalNodeProps {
  data: ServiceNodeData;
}

const REVEAL_EFFECTS = [{ type: 'pulse' as const, trigger: 'on-reveal' as const, params: { scale: 1.06, duration: 700 } }];

export const ExternalNode = memo(function ExternalNode({ data }: ExternalNodeProps) {
  const { id, name, technology, isActive = false, isComplete = false, isNew = false, isFailed = false, substate } = data;
  const stateClass = isActive ? 'active' : isComplete ? 'complete' : 'inactive';
  const failureClass = isFailed ? 'shape-node--failure-down' : '';
  const effects = useMemo(() => isNew ? REVEAL_EFFECTS : [], [isNew]);

  return (
    <EffectWrapper nodeId={id} effects={effects} isActive={isActive} isRevealed={!isNew || isActive || isComplete}>
    <motion.div
      className={`shape-node shape-node--external shape-node--${stateClass} ${failureClass}`}
      initial={isNew ? { opacity: 0, filter: 'blur(8px)', scale: 0.8 } : { opacity: 0, scale: 0.9 }}
      animate={{
        opacity: 1,
        filter: 'blur(0px)',
        scale: 1,
        y: isActive ? [0, -3, 0] : 0,
      }}
      transition={isNew
        ? { duration: 0.5, ease: 'easeOut' }
        : {
            duration: 0.2,
            ...(isActive ? { y: { duration: 4, repeat: Infinity, ease: 'easeInOut' } } : {}),
          }
      }
    >
      <NodeHandles />
      <div className="shape-node__body">
        <span className="shape-node__icon-badge">
          <Cloud size={16} strokeWidth={2} />
        </span>
        <span className="shape-node__name">{name}</span>
        {technology && <span className="shape-node__tech">{technology}</span>}
      </div>
      <SubstateBadge substate={substate} serviceType={data.type as ServiceType} />
    </motion.div>
    </EffectWrapper>
  );
});

export default ExternalNode;
