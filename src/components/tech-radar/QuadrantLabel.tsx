import { memo } from 'react';
import { motion } from 'motion/react';
import type { Quadrant } from '../../schemas/tech-radar';
import { TECH_RADAR_LAYOUT } from '../../schemas/tech-radar';
import './tech-radar.css';

interface QuadrantLabelProps {
  quadrant: Quadrant;
  radius: number;
  isActive?: boolean;
  isDimmed?: boolean;
  delay?: number;
}

/**
 * QuadrantLabel - Category label positioned at quadrant edge
 */
export const QuadrantLabel = memo(function QuadrantLabel({
  quadrant,
  radius,
  isActive,
  isDimmed,
  delay = 0,
}: QuadrantLabelProps) {
  const { name, angle, color = '#666' } = quadrant;
  const labelDistance = TECH_RADAR_LAYOUT.labelDistance * radius;
  
  // Convert angle to radians and calculate position
  const angleRad = (angle - 90) * (Math.PI / 180); // Adjust so 0 is top
  const x = Math.cos(angleRad) * labelDistance;
  const y = Math.sin(angleRad) * labelDistance;

  // Determine text anchor based on position
  const textAnchor = x > 10 ? 'start' : x < -10 ? 'end' : 'middle';
  
  const stateClass = isActive ? 'quadrant-active' : isDimmed ? 'quadrant-dimmed' : '';

  return (
    <motion.g 
      className={`quadrant-label ${stateClass}`}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ 
        opacity: isDimmed ? 0.3 : 1, 
        scale: 1,
      }}
      transition={{ 
        delay: delay / 1000,
        duration: 0.4,
      }}
    >
      {/* Background pill */}
      <motion.rect
        x={x - (textAnchor === 'start' ? 5 : textAnchor === 'end' ? name.length * 6 : name.length * 3)}
        y={y - 12}
        width={name.length * 6.5 + 16}
        height={24}
        rx={12}
        fill={`${color}15`}
        stroke={color}
        strokeWidth={isActive ? 2 : 1}
        initial={{ opacity: 0 }}
        animate={{ opacity: isDimmed ? 0.3 : 1 }}
      />

      {/* Label text */}
      <motion.text
        x={x}
        y={y + 4}
        fontSize={11}
        fontWeight={700}
        fill={color}
        textAnchor={textAnchor}
        initial={{ opacity: 0 }}
        animate={{ opacity: isDimmed ? 0.3 : 1 }}
        transition={{ delay: (delay + 100) / 1000 }}
      >
        {name}
      </motion.text>

      {/* Active indicator */}
      {isActive && (
        <motion.circle
          cx={x - (textAnchor === 'start' ? 12 : textAnchor === 'end' ? -name.length * 6 - 12 : 0)}
          cy={y}
          r={4}
          fill={color}
          initial={{ scale: 0 }}
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 0.8, repeat: Infinity }}
        />
      )}
    </motion.g>
  );
});
