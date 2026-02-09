import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { motion } from 'motion/react';
import type { DomainEvent } from '../../schemas/event-storming';
import { ES_COLORS, ES_ICONS } from '../../schemas/event-storming';
import './event-storming.css';

interface EventNoteData extends DomainEvent {
  isActive?: boolean;
  isHighlighted?: boolean;
  isDimmed?: boolean;
}

/**
 * EventNote - Orange sticky note for Domain Events
 * "Something that happened" - past tense
 */
export const EventNote = memo(function EventNote({ 
  data,
  selected,
}: NodeProps<EventNoteData>) {
  const { 
    name, 
    description,
    data: eventData,
    isActive,
    isHighlighted,
    isDimmed,
  } = data;

  const stateClass = isActive ? 'es-active' : 
                     isHighlighted ? 'es-highlighted' :
                     isDimmed ? 'es-dimmed' : '';

  return (
    <motion.div
      className={`es-note es-event-note ${stateClass} ${selected ? 'node-selected' : ''}`}
      initial={{ opacity: 0, scale: 0.8, rotate: -5 }}
      animate={{ 
        opacity: isDimmed ? 0.4 : 1, 
        scale: 1,
        rotate: 0,
      }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      data-testid="event-note"
    >
      {/* Icon */}
      <span className="es-icon">{ES_ICONS.domainEvent}</span>

      {/* Event name (past tense) */}
      <div className="es-note-name">{name}</div>

      {/* Description */}
      {description && (
        <div className="es-note-desc">{description}</div>
      )}

      {/* Event data fields */}
      {eventData && eventData.length > 0 && (
        <div className="es-event-data">
          {eventData.slice(0, 3).map((field, i) => (
            <span key={i} className="es-data-field">{field}</span>
          ))}
          {eventData.length > 3 && <span className="es-data-more">+{eventData.length - 3}</span>}
        </div>
      )}

      {/* Active lightning effect */}
      {isActive && (
        <motion.div
          className="es-lightning"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 0.5, repeat: Infinity }}
        />
      )}

      <Handle type="source" position={Position.Right} className="es-handle" />
      <Handle type="target" position={Position.Left} className="es-handle" />
      <Handle type="source" position={Position.Bottom} id="bottom" className="es-handle" />
      <Handle type="target" position={Position.Top} id="top" className="es-handle" />
    </motion.div>
  );
});
