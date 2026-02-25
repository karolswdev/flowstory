import { motion } from 'motion/react';
import { memo, useMemo } from 'react';
import { Database } from 'lucide-react';
import { NodeHandles } from '../nodes/NodeHandles';
import { EffectWrapper } from '../../effects';
import { SubstateBadge } from './SubstateBadge';
import type { ServiceNodeData } from './ServiceNode';
import type { ServiceType } from '../../schemas/service-flow';

interface DatabaseNodeProps {
  data: ServiceNodeData;
}

const REVEAL_EFFECTS = [{ type: 'pulse' as const, trigger: 'on-reveal' as const, params: { scale: 1.08, duration: 600 } }];

export const DatabaseNode = memo(function DatabaseNode({ data }: DatabaseNodeProps) {
  const { id, name, technology, isActive = false, isComplete = false, isNew = false, isFailed = false, substate } = data;
  const stateClass = isActive ? 'active' : isComplete ? 'complete' : 'inactive';
  const failureClass = isFailed ? 'shape-node--failure-down' : '';
  const effects = useMemo(() => isNew ? REVEAL_EFFECTS : [], [isNew]);

  return (
    <EffectWrapper nodeId={id} effects={effects} isActive={isActive} isRevealed={!isNew || isActive || isComplete}>
    <motion.div
      className={`shape-node shape-node--database shape-node--${stateClass} ${failureClass}`}
      initial={isNew ? { opacity: 0, scaleY: 0.3, y: 20 } : { opacity: 0, scale: 0.9 }}
      animate={{
        opacity: 1,
        scaleY: 1,
        scale: 1,
        y: isActive ? [0, -2, 0] : 0,
      }}
      transition={isNew
        ? { type: 'spring', stiffness: 300, damping: 20 }
        : {
            duration: 0.2,
            ...(isActive ? { y: { duration: 3, repeat: Infinity, ease: 'easeInOut' } } : {}),
          }
      }
    >
      <NodeHandles />
      <div className="shape-node__cylinder-top" />
      <div className="shape-node__body">
        <span className="shape-node__icon-badge">
          <Database size={16} strokeWidth={2} />
        </span>
        <span className="shape-node__name">{name}</span>
        {technology && <span className="shape-node__tech">{technology}</span>}
      </div>
      <div className="shape-node__cylinder-bottom" />
      <SubstateBadge substate={substate} serviceType={data.type as ServiceType} />
    </motion.div>
    </EffectWrapper>
  );
});

export default DatabaseNode;
