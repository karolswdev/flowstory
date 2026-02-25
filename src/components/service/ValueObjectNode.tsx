import { motion } from 'motion/react';
import { memo, useMemo } from 'react';
import { Gem } from 'lucide-react';
import { NodeHandles } from '../nodes/NodeHandles';
import { NodeTags } from '../shared';
import { EffectWrapper } from '../../effects';
import { SubstateBadge } from './SubstateBadge';
import type { ServiceNodeData } from './ServiceNode';
import type { ServiceType } from '../../schemas/service-flow';
import type { EffectConfig } from '../../effects';

const REVEAL_EFFECTS: EffectConfig[] = [{ type: 'pulse', trigger: 'on-reveal', params: { scale: 1.08, duration: 600 } }];

export const ValueObjectNode = memo(function ValueObjectNode({ data }: { data: ServiceNodeData }) {
  const { id, name, technology, status, isActive = false, isComplete = false, isNew = false, isFailed = false, substate } = data;
  const stateClass = isActive ? 'active' : isComplete ? 'complete' : 'inactive';
  const failureClass = isFailed ? 'shape-node--failure-down' : '';
  const effects = useMemo(() => {
    const arr: EffectConfig[] = isNew ? [...REVEAL_EFFECTS] : [];
    return arr;
  }, [isNew]);

  return (
    <EffectWrapper nodeId={id} effects={effects} isActive={isActive} isRevealed={!isNew || isActive || isComplete}>
      <motion.div
        className={`shape-node shape-node--value-object shape-node--${stateClass} ${failureClass}`}
        initial={isNew ? { opacity: 0, scale: 0.8 } : { opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={isNew ? { type: 'spring', stiffness: 300, damping: 28 } : { duration: 0.2 }}
      >
        <NodeHandles />
        <div className="shape-node__body">
          <span className="shape-node__icon-badge">
            <Gem size={16} strokeWidth={2} />
          </span>
          <span className="shape-node__name">{name}</span>
          {technology && <span className="shape-node__tech">{technology}</span>}
        </div>
        <NodeTags tags={data.tags} />
        <SubstateBadge substate={substate} serviceType={data.type as ServiceType} />
      </motion.div>
    </EffectWrapper>
  );
});

export default ValueObjectNode;
