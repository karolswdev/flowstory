import { motion } from 'motion/react';
import { memo, useMemo } from 'react';
import { Waves } from 'lucide-react';
import { NodeHandles } from '../nodes/NodeHandles';
import { NodeTags } from '../shared';
import { EffectWrapper } from '../../effects';
import { SubstateBadge } from './SubstateBadge';
import type { ServiceNodeData } from './ServiceNode';
import type { ServiceType, EventDef } from '../../schemas/service-flow';
import type { EffectConfig } from '../../effects';

const REVEAL_EFFECTS: EffectConfig[] = [{ type: 'pulse', trigger: 'on-reveal', params: { scale: 1.08, duration: 600 } }];

/** Base seconds per event for marquee speed */
const SECONDS_PER_EVENT = 2.5;

export const EventStreamNode = memo(function EventStreamNode({ data }: { data: ServiceNodeData }) {
  const { id, name, technology, status, isActive = false, isComplete = false, isNew = false, isFailed = false, substate } = data;
  const events: EventDef[] = (data as any).events ?? [];
  const stateClass = isActive ? 'active' : isComplete ? 'complete' : 'inactive';
  const failureClass = isFailed ? 'shape-node--failure-down' : '';

  const effects = useMemo(() => {
    const arr: EffectConfig[] = isNew ? [...REVEAL_EFFECTS] : [];
    if (status === 'down') arr.push({ type: 'shake', trigger: 'continuous', params: { intensity: 0.4, frequency: 6 } });
    else if (status === 'degraded') arr.push({ type: 'pulse', trigger: 'continuous', params: { scale: 1.03, duration: 2000 } });
    return arr;
  }, [isNew, status]);

  const marqueeDuration = Math.max(4, events.length * SECONDS_PER_EVENT);

  return (
    <EffectWrapper nodeId={id} effects={effects} isActive={isActive} isRevealed={!isNew || isActive || isComplete}>
      <motion.div
        className={`shape-node shape-node--event-stream shape-node--${stateClass} ${failureClass}`}
        initial={isNew ? { opacity: 0, scaleX: 0.3, x: 20 } : { opacity: 0, scale: 0.9 }}
        animate={{
          opacity: 1, scaleX: 1, scale: 1, x: 0,
          filter: isActive ? 'brightness(1.05)' : 'brightness(1)',
        }}
        transition={isNew ? { type: 'spring', stiffness: 300, damping: 20 } : { duration: 0.2 }}
      >
        <NodeHandles />

        {/* Label row: icon + name + technology */}
        <div className="event-stream__label">
          <span className="shape-node__icon-badge">
            <Waves size={14} strokeWidth={2} />
          </span>
          <span className="event-stream__name">{name}</span>
          {technology && <span className="event-stream__tech">{technology}</span>}
        </div>

        {/* The pipe */}
        <div className="event-stream__pipe">
          {/* Left edge glow (inlet) */}
          {isActive && <div className="event-stream__edge-glow event-stream__edge-glow--left" />}

          {/* Marquee track */}
          <div className="event-stream__track">
            {events.length > 0 ? (
              <div
                className={`event-stream__marquee ${isActive ? 'event-stream__marquee--running' : ''}`}
                style={{ animationDuration: `${marqueeDuration}s` }}
              >
                {events.map((e, i) => (
                  <span key={i} className="event-stream__pill" style={e.color ? { borderColor: e.color, background: `color-mix(in srgb, ${e.color} 12%, transparent)` } : undefined}>
                    {e.emoji && <span className="event-stream__pill-emoji">{e.emoji}</span>}
                    <span className="event-stream__pill-key" style={e.color ? { color: e.color } : undefined}>{e.key}</span>
                  </span>
                ))}
                {/* Duplicate for seamless loop */}
                {events.map((e, i) => (
                  <span key={`dup-${i}`} className="event-stream__pill" style={e.color ? { borderColor: e.color, background: `color-mix(in srgb, ${e.color} 12%, transparent)` } : undefined}>
                    {e.emoji && <span className="event-stream__pill-emoji">{e.emoji}</span>}
                    <span className="event-stream__pill-key" style={e.color ? { color: e.color } : undefined}>{e.key}</span>
                  </span>
                ))}
              </div>
            ) : (
              <span className="event-stream__empty">No events</span>
            )}
          </div>

          {/* Right edge glow (outlet) */}
          {isActive && <div className="event-stream__edge-glow event-stream__edge-glow--right" />}
        </div>

        <SubstateBadge substate={substate} serviceType={data.type as ServiceType} />
        <NodeTags tags={(data as any).tags} compact />
      </motion.div>
    </EffectWrapper>
  );
});

export default EventStreamNode;
