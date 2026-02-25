import { motion } from 'motion/react';
import { memo, useMemo } from 'react';
import { Zap } from 'lucide-react';
import { NodeHandles } from '../nodes/NodeHandles';
import { EffectWrapper } from '../../effects';
import { SubstateBadge } from './SubstateBadge';
import type { ServiceNodeData } from './ServiceNode';
import type { ServiceType } from '../../schemas/service-flow';

interface CacheNodeProps {
  data: ServiceNodeData;
}

const REVEAL_EFFECTS = [{ type: 'glow' as const, trigger: 'on-reveal' as const, params: { intensity: 0.8, duration: 800 } }];

export const CacheNode = memo(function CacheNode({ data }: CacheNodeProps) {
  const { id, name, technology, isActive = false, isComplete = false, isNew = false, isFailed = false, substate } = data;
  const stateClass = isActive ? 'active' : isComplete ? 'complete' : 'inactive';
  const failureClass = isFailed ? 'shape-node--failure-down' : '';
  const effects = useMemo(() => isNew ? REVEAL_EFFECTS : [], [isNew]);

  return (
    <EffectWrapper nodeId={id} effects={effects} isActive={isActive} isRevealed={!isNew || isActive || isComplete}>
    <motion.div
      className={`shape-node shape-node--cache shape-node--${stateClass} ${failureClass}`}
      initial={isNew ? { opacity: 0, scale: 1.3, filter: 'brightness(2)' } : { opacity: 0, scale: 0.9 }}
      animate={{
        opacity: 1,
        scale: 1,
        filter: isActive ? ['brightness(1)', 'brightness(1.15)', 'brightness(1)'] : 'brightness(1)',
      }}
      transition={isNew
        ? { duration: 0.4, ease: 'easeOut' }
        : {
            duration: 0.2,
            ...(isActive ? { filter: { duration: 1.5, repeat: Infinity, ease: 'easeInOut' } } : {}),
          }
      }
    >
      <NodeHandles />
      <div className="shape-node__body">
        <span className="shape-node__icon-badge">
          <Zap size={16} strokeWidth={2} />
        </span>
        <span className="shape-node__name">{name}</span>
        {technology && <span className="shape-node__tech">{technology}</span>}
      </div>
      <SubstateBadge substate={substate} serviceType={data.type as ServiceType} />
    </motion.div>
    </EffectWrapper>
  );
});

export default CacheNode;
