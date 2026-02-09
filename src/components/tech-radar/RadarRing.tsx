import { memo } from 'react';
import { motion } from 'motion/react';
import type { Ring, RingId } from '../../schemas/tech-radar';
import { RING_RADII, RING_COLORS, TECH_RADAR_LAYOUT } from '../../schemas/tech-radar';
import './tech-radar.css';

interface RadarRingProps {
  ring: Ring;
  radius: number;
  isActive?: boolean;
  isDimmed?: boolean;
  delay?: number;
}

/**
 * RadarRing - Concentric ring showing adoption status
 */
export const RadarRing = memo(function RadarRing({
  ring,
  radius,
  isActive,
  isDimmed,
  delay = 0,
}: RadarRingProps) {
  const radii = RING_RADII[ring.id as RingId];
  const innerRadius = radii.inner * radius;
  const outerRadius = radii.outer * radius;
  const color = ring.color || RING_COLORS[ring.id as RingId];

  const stateClass = isActive ? 'ring-active' : isDimmed ? 'ring-dimmed' : '';

  return (
    <motion.g className={`radar-ring ${stateClass}`}>
      {/* Ring background */}
      <motion.circle
        className="ring-background"
        r={outerRadius}
        fill={`${color}08`}
        stroke={`${color}30`}
        strokeWidth={1}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ 
          scale: 1, 
          opacity: isDimmed ? 0.3 : 1,
        }}
        transition={{ 
          delay: delay / 1000,
          duration: 0.5,
          ease: 'easeOut',
        }}
      />

      {/* Ring border (inner) */}
      {innerRadius > 0 && (
        <motion.circle
          className="ring-border"
          r={innerRadius}
          fill="none"
          stroke={`${color}50`}
          strokeWidth={1}
          strokeDasharray="4 4"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ 
            pathLength: 1, 
            opacity: isDimmed ? 0.3 : 0.7,
          }}
          transition={{ 
            delay: (delay + 100) / 1000,
            duration: 0.8,
          }}
        />
      )}

      {/* Active pulse */}
      {isActive && (
        <motion.circle
          className="ring-pulse"
          r={(innerRadius + outerRadius) / 2}
          fill="none"
          stroke={color}
          strokeWidth={3}
          initial={{ opacity: 0 }}
          animate={{ 
            opacity: [0.3, 0.6, 0.3],
            scale: [0.98, 1.02, 0.98],
          }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}

      {/* Ring label */}
      <motion.text
        className="ring-label"
        x={outerRadius - 10}
        y={-8}
        fontSize={10}
        fontWeight={600}
        fill={color}
        textAnchor="end"
        initial={{ opacity: 0 }}
        animate={{ opacity: isDimmed ? 0.3 : 0.8 }}
        transition={{ delay: (delay + 200) / 1000 }}
      >
        {ring.name.toUpperCase()}
      </motion.text>
    </motion.g>
  );
});
