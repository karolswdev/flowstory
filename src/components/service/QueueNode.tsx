import { motion } from 'motion/react';
import { memo, useMemo } from 'react';
import { NodeHandles } from '../nodes/NodeHandles';
import { NodeTags } from '../shared';
import { EffectWrapper } from '../../effects';
import type { QueueDef, QueueType } from '../../schemas/service-flow';
import { QUEUE_TYPE_ICONS } from '../../schemas/service-flow';
import type { EffectConfig } from '../../effects';

export interface QueueNodeData extends QueueDef {
  isActive?: boolean;
  isComplete?: boolean;
  isNew?: boolean;
}

interface QueueNodeProps {
  data: QueueNodeData;
  selected?: boolean;
}

function buildQueueEffects(isNew: boolean): EffectConfig[] {
  const effects: EffectConfig[] = [];
  if (isNew) {
    effects.push({ type: 'pulse', trigger: 'on-reveal', params: { scale: 1.1, duration: 500 } });
  }
  return effects;
}

export const QueueNode = memo(function QueueNode({ data, selected }: QueueNodeProps) {
  const {
    id,
    name,
    type,
    broker,
    depth,
    consumers,
    isActive = false,
    isComplete = false,
    isNew = false, isFailed = false,
  } = data;

  const IconComponent = QUEUE_TYPE_ICONS[type as QueueType];
  const stateClass = isActive ? 'active' : isComplete ? 'complete' : 'inactive';
  const failureClass = isFailed ? 'queue-node--failure-down' : '';
  const effects = useMemo(() => buildQueueEffects(isNew), [isNew]);

  return (
    <EffectWrapper
      nodeId={id}
      effects={effects}
      isActive={isActive}
      isRevealed={!isNew || isActive || isComplete}
    >
      <motion.div
        className={`queue-node queue-node--${type} queue-node--${stateClass} ${failureClass}`}
        data-state={stateClass}
        initial={isNew ? { opacity: 0, x: 30, scale: 0.8 } : { opacity: 0, scale: 0.9 }}
        animate={{
          opacity: 1,
          x: isActive ? [0, 1.5, -1.5, 0] : 0,
          scale: 1,
        }}
        transition={isNew
          ? { type: 'spring', stiffness: 400, damping: 25, mass: 0.8 }
          : {
              duration: 0.2,
              ...(isActive ? { x: { duration: 1.5, repeat: Infinity, ease: 'easeInOut' } } : {}),
            }
        }
      >
        <NodeHandles />

        <div className="queue-node__header">
          <span className="queue-node__icon-badge">
            {IconComponent && <IconComponent size={14} strokeWidth={2} />}
          </span>
          <span className="queue-node__name">{name}</span>
        </div>

        <div className="queue-node__details">
          <span className="queue-node__type-pill">{type}</span>
          {broker && (
            <span className="queue-node__broker">{broker}</span>
          )}
        </div>

        {(depth !== undefined || consumers !== undefined) && (
          <div className="queue-node__metrics">
            {depth !== undefined && (
              <span className="queue-node__depth">depth: {depth.toLocaleString()}</span>
            )}
            {consumers !== undefined && (
              <>
                <span className="queue-node__sep">|</span>
                <span className="queue-node__consumers">{consumers} consumers</span>
              </>
            )}
          </div>
        )}

        <NodeTags tags={data.tags} compact />
      </motion.div>
    </EffectWrapper>
  );
});

export default QueueNode;
