import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { motion } from 'motion/react';
import type { Command } from '../../schemas/event-storming';
import { ES_COLORS, ES_ICONS } from '../../schemas/event-storming';
import './event-storming.css';

interface CommandNoteData extends Command {
  isActive?: boolean;
  isHighlighted?: boolean;
  isDimmed?: boolean;
}

/**
 * CommandNote - Blue sticky note for Commands
 * "Intention to change state" - imperative
 */
export const CommandNote = memo(function CommandNote({ 
  data,
  selected,
}: NodeProps<CommandNoteData>) {
  const { 
    name, 
    description,
    isActive,
    isHighlighted,
    isDimmed,
  } = data;

  const stateClass = isActive ? 'es-active' : 
                     isHighlighted ? 'es-highlighted' :
                     isDimmed ? 'es-dimmed' : '';

  return (
    <motion.div
      className={`es-note es-command-note ${stateClass} ${selected ? 'node-selected' : ''}`}
      initial={{ opacity: 0, scale: 0.8, rotate: 3 }}
      animate={{ 
        opacity: isDimmed ? 0.4 : 1, 
        scale: 1,
        rotate: 0,
      }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      data-testid="command-note"
    >
      {/* Icon */}
      <span className="es-icon">{ES_ICONS.command}</span>

      {/* Command name (imperative) */}
      <div className="es-note-name">{name}</div>

      {/* Description */}
      {description && (
        <div className="es-note-desc">{description}</div>
      )}

      <Handle type="source" position={Position.Right} className="es-handle" />
      <Handle type="target" position={Position.Left} className="es-handle" />
    </motion.div>
  );
});
