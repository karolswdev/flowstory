import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { motion } from 'motion/react';
import type { Hotspot } from '../../schemas/event-storming';
import { ES_COLORS, ES_ICONS } from '../../schemas/event-storming';
import './event-storming.css';

interface HotspotNoteData extends Hotspot {
  isActive?: boolean;
  isHighlighted?: boolean;
  isDimmed?: boolean;
}

const TYPE_ICONS = {
  question: '❓',
  problem: '⚠️',
  opportunity: '💡',
  risk: '🔴',
};

/**
 * HotspotNote - Red/Pink sticky note for problems and questions
 */
export const HotspotNote = memo(function HotspotNote({ 
  data,
  selected,
}: NodeProps<HotspotNoteData>) {
  const { 
    note, 
    type = 'question',
    raisedBy,
    isActive,
    isHighlighted,
    isDimmed,
  } = data;

  const stateClass = isActive ? 'es-active' : 
                     isHighlighted ? 'es-highlighted' :
                     isDimmed ? 'es-dimmed' : '';

  return (
    <motion.div
      className={`es-note es-hotspot-note ${stateClass} ${selected ? 'node-selected' : ''}`}
      initial={{ opacity: 0, scale: 0.8, rotate: -8 }}
      animate={{ 
        opacity: isDimmed ? 0.4 : 1, 
        scale: 1,
        rotate: -3, // Hotspots stay slightly rotated
      }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      data-testid="hotspot-note"
    >
      {/* Icon based on type */}
      <span className="es-icon">{TYPE_ICONS[type]}</span>

      {/* The concern/question */}
      <div className="es-note-text">{note}</div>

      {/* Who raised this */}
      {raisedBy && (
        <div className="es-hotspot-by">— {raisedBy}</div>
      )}

      {/* Pulsing effect for hotspots */}
      <motion.div
        className="es-hotspot-pulse"
        animate={{ 
          opacity: [0.3, 0.6, 0.3],
          scale: [1, 1.05, 1],
        }}
        transition={{ duration: 2, repeat: Infinity }}
      />

      <Handle type="target" position={Position.Left} className="es-handle" />
    </motion.div>
  );
});
