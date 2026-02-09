import { memo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { Technology, RingId } from '../../schemas/tech-radar';
import { RING_COLORS, MOVEMENT_ICONS } from '../../schemas/tech-radar';
import './tech-radar.css';

interface TechBlipProps {
  tech: Technology;
  x: number;
  y: number;
  isActive?: boolean;
  isHighlighted?: boolean;
  isDimmed?: boolean;
  delay?: number;
}

/**
 * TechBlip - Individual technology dot on the radar
 */
export const TechBlip = memo(function TechBlip({
  tech,
  x,
  y,
  isActive,
  isHighlighted,
  isDimmed,
  delay = 0,
}: TechBlipProps) {
  const { name, ring, isNew, moved, description } = tech;
  const ringColor = RING_COLORS[ring];
  
  const stateClass = isActive ? 'blip-active' : 
                     isHighlighted ? 'blip-highlighted' :
                     isDimmed ? 'blip-dimmed' : '';

  return (
    <motion.g
      className={`tech-blip ${stateClass}`}
      initial={{ opacity: 0, scale: 0 }}
      animate={{ 
        opacity: isDimmed ? 0.3 : 1, 
        scale: 1,
        x,
        y,
      }}
      transition={{ 
        delay: delay / 1000,
        type: 'spring',
        stiffness: 400,
        damping: 25,
      }}
    >
      {/* Glow effect for active/highlighted */}
      <AnimatePresence>
        {(isActive || isHighlighted) && (
          <motion.circle
            className="blip-glow"
            r={20}
            fill={ringColor}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ 
              opacity: [0.2, 0.4, 0.2],
              scale: [1, 1.2, 1],
            }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        )}
      </AnimatePresence>

      {/* Main blip circle */}
      <motion.circle
        className="blip-circle"
        r={12}
        fill={tech.color || ringColor}
        stroke="white"
        strokeWidth={2}
        whileHover={{ scale: 1.2 }}
      />

      {/* New indicator (star) */}
      {isNew && (
        <motion.text
          className="blip-new"
          x={8}
          y={-8}
          fontSize={10}
          fill="#FFD700"
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: (delay + 200) / 1000, type: 'spring' }}
        >
          {MOVEMENT_ICONS.new}
        </motion.text>
      )}

      {/* Movement indicator */}
      {moved !== 0 && (
        <motion.text
          className="blip-movement"
          x={moved > 0 ? 10 : 10}
          y={-6}
          fontSize={8}
          fill={moved > 0 ? '#4CAF50' : '#F44336'}
          initial={{ opacity: 0, y: moved > 0 ? 5 : -5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: (delay + 300) / 1000 }}
        >
          {moved > 0 ? MOVEMENT_ICONS.up : MOVEMENT_ICONS.down}
        </motion.text>
      )}

      {/* Label (shown on hover or when active) */}
      <motion.text
        className="blip-label"
        y={24}
        textAnchor="middle"
        fontSize={11}
        fontWeight={600}
        fill="#333"
        initial={{ opacity: 0 }}
        animate={{ opacity: isActive || isHighlighted ? 1 : 0 }}
      >
        {name}
      </motion.text>

      {/* Tooltip area */}
      <title>{`${name}${description ? ': ' + description : ''}`}</title>
    </motion.g>
  );
});
