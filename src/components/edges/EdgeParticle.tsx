import { motion, AnimatePresence } from 'motion/react';
import { useMemo } from 'react';
import { ANIMATION_TIMING, ANIMATION_SIZES } from '../../animations/config';
import './edges.css';

interface EdgeParticleProps {
  /** SVG path data for the edge */
  path: string;
  /** Whether the edge is currently active */
  isActive: boolean;
  /** Particle color (matches edge stroke) */
  color?: string;
  /** Unique edge ID for key */
  edgeId: string;
  /** Number of particles (default 1) */
  count?: number;
  /** Delay between particles in ms (default 200) */
  staggerMs?: number;
}

/**
 * EdgeParticle - Animated dot traveling along an edge path
 * 
 * Uses CSS offset-path animation for smooth path following.
 * Shows during active edge state to indicate data/event flow.
 */
export function EdgeParticle({
  path,
  isActive,
  color = '#2196F3',
  edgeId,
  count = 1,
  staggerMs = 200,
}: EdgeParticleProps) {
  const particles = useMemo(() => 
    Array.from({ length: count }, (_, i) => i),
    [count]
  );

  const duration = ANIMATION_TIMING.particleDuration / 1000;
  const radius = ANIMATION_SIZES.particleRadius;

  return (
    <AnimatePresence>
      {isActive && particles.map((index) => (
        <motion.div
          key={`${edgeId}-particle-${index}`}
          className="edge-particle"
          initial={{ 
            opacity: 0,
            offsetDistance: '0%',
          }}
          animate={{ 
            opacity: [0, 1, 1, 0],
            offsetDistance: ['0%', '10%', '90%', '100%'],
          }}
          exit={{ 
            opacity: 0,
          }}
          transition={{
            duration,
            delay: (index * staggerMs) / 1000,
            repeat: Infinity,
            repeatDelay: 0.3,
            ease: 'easeInOut',
            times: [0, 0.1, 0.9, 1],
          }}
          style={{
            position: 'absolute',
            width: radius * 2,
            height: radius * 2,
            borderRadius: '50%',
            backgroundColor: color,
            boxShadow: `0 0 ${radius}px ${color}, 0 0 ${radius * 2}px ${color}50`,
            offsetPath: `path('${path}')`,
            offsetRotate: '0deg',
            pointerEvents: 'none',
            zIndex: 1000,
          }}
        />
      ))}
    </AnimatePresence>
  );
}

/**
 * SVG-based particle (for edges rendered as SVG paths)
 * Uses native SVG animation for better performance.
 */
export function SvgEdgeParticle({
  path,
  isActive,
  color = '#2196F3',
  edgeId,
}: Omit<EdgeParticleProps, 'count' | 'staggerMs'>) {
  const radius = ANIMATION_SIZES.particleRadius;
  const duration = ANIMATION_TIMING.particleDuration;

  if (!isActive) return null;

  return (
    <g className="edge-particle-group">
      <circle
        r={radius}
        fill={color}
        filter={`drop-shadow(0 0 ${radius / 2}px ${color})`}
      >
        <animateMotion
          dur={`${duration}ms`}
          repeatCount="indefinite"
          path={path}
        >
          <mpath xlinkHref={`#${edgeId}-path`} />
        </animateMotion>
        <animate
          attributeName="opacity"
          values="0;1;1;0"
          keyTimes="0;0.1;0.9;1"
          dur={`${duration}ms`}
          repeatCount="indefinite"
        />
      </circle>
    </g>
  );
}
