import { motion } from 'motion/react';
import { memo, useMemo } from 'react';
import { GitBranch } from 'lucide-react';
import { NodeHandles } from '../nodes/NodeHandles';
import { EffectWrapper } from '../../effects';
import { SubstateBadge } from './SubstateBadge';
import type { ServiceNodeData } from './ServiceNode';
import type { ServiceType } from '../../schemas/service-flow';

interface WorkflowNodeProps {
  data: ServiceNodeData;
}

const REVEAL_EFFECTS = [{ type: 'pulse' as const, trigger: 'on-reveal' as const, params: { scale: 1.08, duration: 600 } }];

export const WorkflowNode = memo(function WorkflowNode({ data }: WorkflowNodeProps) {
  const { id, name, technology, isActive = false, isComplete = false, isNew = false, isFailed = false, substate } = data;
  const stateClass = isActive ? 'active' : isComplete ? 'complete' : 'inactive';
  const failureClass = isFailed ? 'shape-node--failure-down' : '';
  const effects = useMemo(() => isNew ? REVEAL_EFFECTS : [], [isNew]);

  return (
    <EffectWrapper nodeId={id} effects={effects} isActive={isActive} isRevealed={!isNew || isActive || isComplete}>
    <motion.div
      className={`shape-node shape-node--workflow shape-node--${stateClass} ${failureClass}`}
      initial={isNew ? { opacity: 0, rotate: -180, scale: 0.5 } : { opacity: 0, scale: 0.9 }}
      animate={{
        opacity: 1,
        rotate: 0,
        scale: 1,
      }}
      transition={isNew
        ? { type: 'spring', stiffness: 200, damping: 18, mass: 0.8 }
        : { duration: 0.2 }
      }
    >
      <NodeHandles />
      <div className="shape-node__body">
        <motion.span
          className="shape-node__icon-badge"
          animate={isActive ? { rotate: [0, 360] } : { rotate: 0 }}
          transition={isActive ? { duration: 4, repeat: Infinity, ease: 'linear' } : { duration: 0 }}
        >
          <GitBranch size={16} strokeWidth={2} />
        </motion.span>
        <span className="shape-node__name">{name}</span>
        {technology && <span className="shape-node__tech">{technology}</span>}
      </div>
      <SubstateBadge substate={substate} serviceType={data.type as ServiceType} />
    </motion.div>
    </EffectWrapper>
  );
});

export default WorkflowNode;
