import { motion } from 'motion/react';
import { memo, useMemo } from 'react';
import { Activity } from 'lucide-react';
import { NodeHandles } from '../nodes/NodeHandles';
import { NodeTags } from '../shared';
import { EffectWrapper } from '../../effects';
import { SubstateBadge } from './SubstateBadge';
import type { ServiceNodeData } from './ServiceNode';
import type { ServiceType } from '../../schemas/service-flow';
import type { EffectConfig } from '../../effects';

export interface IncomingEvent {
  messageType: string;
  callType: string;
}

interface EventProcessorNodeProps {
  data: ServiceNodeData & { incomingEvents?: IncomingEvent[] };
}

const REVEAL_EFFECTS: EffectConfig[] = [
  { type: 'pulse', trigger: 'on-reveal', params: { scale: 1.08, duration: 500 } },
];

/** Base seconds per event for conveyor speed */
const SECONDS_PER_EVENT = 5;

const CALL_TYPE_BADGE: Record<string, string> = {
  subscribe: '\u{1F4E5}',  // 📥
  async: '\u26A1',          // ⚡
  publish: '\u{1F4E4}',     // 📤
};

export const EventProcessorNode = memo(function EventProcessorNode({ data }: EventProcessorNodeProps) {
  const {
    id, name, technology,
    isActive = false, isComplete = false, isNew = false, isFailed = false,
    substate,
  } = data;
  const incomingEvents: IncomingEvent[] = (data as any).incomingEvents ?? [];
  const stateClass = isActive ? 'active' : isComplete ? 'complete' : 'inactive';
  const failureClass = isFailed ? 'shape-node--failure-down' : '';
  const effects = useMemo(() => (isNew ? [...REVEAL_EFFECTS] : []), [isNew]);

  const showConveyor = isActive && incomingEvents.length > 0;
  const conveyorDuration = Math.max(4, incomingEvents.length * SECONDS_PER_EVENT);

  return (
    <EffectWrapper nodeId={id} effects={effects} isActive={isActive} isRevealed={!isNew || isActive || isComplete}>
      <motion.div
        className={`shape-node shape-node--event-processor shape-node--${stateClass} ${failureClass}`}
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

        {/* Header: icon + name + technology */}
        <div className="shape-node__body">
          <span className="shape-node__icon-badge">
            <Activity size={16} strokeWidth={2} />
          </span>
          <span className="shape-node__name">{name}</span>
          {technology && <span className="shape-node__tech">{technology}</span>}
        </div>

        {/* Conveyor strip — only when active AND incoming events exist */}
        {showConveyor && (
          <div className="event-processor__strip">
            <div className="event-processor__fade-mask" />
            <div className="event-processor__track">
              <div
                className="event-processor__conveyor event-processor__conveyor--running"
                style={{ animationDuration: `${conveyorDuration}s` }}
              >
                {incomingEvents.map((evt, i) => (
                  <span key={i} className="event-processor__pill">
                    <span className="event-processor__pill-badge">
                      {CALL_TYPE_BADGE[evt.callType] ?? '\u26A1'}
                    </span>
                    <span className="event-processor__pill-name">{evt.messageType}</span>
                  </span>
                ))}
                {/* Duplicate for seamless loop */}
                {incomingEvents.map((evt, i) => (
                  <span key={`dup-${i}`} className="event-processor__pill">
                    <span className="event-processor__pill-badge">
                      {CALL_TYPE_BADGE[evt.callType] ?? '\u26A1'}
                    </span>
                    <span className="event-processor__pill-name">{evt.messageType}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        <SubstateBadge substate={substate} serviceType={data.type as ServiceType} />
        <NodeTags tags={(data as any).tags} compact />
      </motion.div>
    </EffectWrapper>
  );
});

export default EventProcessorNode;
