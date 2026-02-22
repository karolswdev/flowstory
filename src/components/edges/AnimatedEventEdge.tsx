import { motion, AnimatePresence } from 'motion/react';
import { memo, useEffect, useState, useId } from 'react';
import { BaseEdge, EdgeLabelRenderer, getBezierPath } from '@xyflow/react';
import type { EventEdgeProps } from './types';
import './edges.css';
import './animated-edges.css';

/**
 * Animation phase for event edges
 */
export type AnimationPhase = 'idle' | 'emitting' | 'transit' | 'receiving' | 'complete';

/**
 * Timing constants (in ms)
 */
const TIMING = {
  emit: 150,
  transit: 500,
  receive: 150,
  complete: 100,
} as const;

/**
 * Event colors by type
 */
const EVENT_COLORS = {
  published: '#22c55e',  // green-500
  subscribed: '#3b82f6', // blue-500
  command: '#f59e0b',    // amber-500
  query: '#8b5cf6',      // violet-500
  default: '#FFC107',    // yellow (legacy)
} as const;

interface AnimatedEventEdgeData {
  label?: string;
  isActive?: boolean;
  eventType?: keyof typeof EVENT_COLORS;
  animationPhase?: AnimationPhase;
}

interface AnimatedEventEdgeProps extends Omit<EventEdgeProps, 'data'> {
  data?: AnimatedEventEdgeData;
}

/**
 * AnimatedEventEdge - Event edge with emission, transit, and reception animations
 * 
 * Phases:
 * 1. emitting (150ms): Source node ripple + arrow extends
 * 2. transit (500ms): Particle travels along edge path
 * 3. receiving (150ms): Target node flash + arrow retracts
 * 4. complete (100ms): Fade out animations
 */
export const AnimatedEventEdge = memo(function AnimatedEventEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected,
}: AnimatedEventEdgeProps) {
  const maskId = useId();
  
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const isActive = data?.isActive;
  const phase = data?.animationPhase ?? 'idle';
  const eventColor = EVENT_COLORS[data?.eventType ?? 'default'];

  // Check for reduced motion preference
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // For reduced motion, just show active state without animation
  if (prefersReducedMotion && phase !== 'idle') {
    return (
      <>
        <BaseEdge
          id={id}
          path={edgePath}
          className={`event-edge edge-active ${selected ? 'edge-selected' : ''}`}
          style={{ stroke: eventColor }}
          markerEnd="url(#arrow-event)"
        />
        <EdgeLabelRenderer>
          <div
            className="edge-icon event-edge-icon icon-active"
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              borderColor: eventColor,
            }}
          >
            ⚡
          </div>
        </EdgeLabelRenderer>
      </>
    );
  }

  const isAnimating = phase !== 'idle' && phase !== 'complete';
  const showParticle = phase === 'emitting' || phase === 'transit';
  const showEmitRipple = phase === 'emitting';
  const showReceiveFlash = phase === 'receiving';

  return (
    <>
      {/* Base edge - always visible */}
      <BaseEdge
        id={id}
        path={edgePath}
        className={`event-edge ${isActive || isAnimating ? 'edge-active' : ''} ${selected ? 'edge-selected' : ''}`}
        data-testid="animated-event-edge"
        markerEnd="url(#arrow-event)"
      />

      {/* SVG elements for animations */}
      <g className="animated-event-edge-overlays">
        <AnimatePresence>
          {/* Emission Ripple at source */}
          {showEmitRipple && (
            <motion.circle
              key={`emit-${id}`}
              cx={sourceX}
              cy={sourceY}
              r={16}
              fill="none"
              stroke={eventColor}
              strokeWidth={2}
              initial={{ scale: 1, opacity: 0.8 }}
              animate={{ scale: 2.5, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: TIMING.emit / 1000, ease: 'easeOut' }}
              data-testid="emit-ripple"
            />
          )}

          {/* Transit Particle */}
          {showParticle && (
            <motion.circle
              key={`particle-${id}`}
              r={6}
              fill={eventColor}
              style={{
                offsetPath: `path('${edgePath}')`,
                offsetRotate: '0deg',
                filter: `drop-shadow(0 0 4px ${eventColor})`,
              }}
              initial={{ offsetDistance: '0%', opacity: 0 }}
              animate={{ 
                offsetDistance: '100%', 
                opacity: phase === 'emitting' ? [0, 1] : 1 
              }}
              exit={{ opacity: 0 }}
              transition={{ 
                offsetDistance: { 
                  duration: TIMING.transit / 1000, 
                  ease: 'linear',
                  delay: phase === 'emitting' ? TIMING.emit / 1000 : 0,
                },
                opacity: { duration: 0.1 }
              }}
              data-testid="transit-particle"
            />
          )}

          {/* Reception Flash at target */}
          {showReceiveFlash && (
            <motion.circle
              key={`receive-${id}`}
              cx={targetX}
              cy={targetY}
              r={20}
              fill={eventColor}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: [0, 0.6, 0], scale: [0.8, 1.2, 1] }}
              transition={{ duration: TIMING.receive / 1000, ease: 'easeInOut' }}
              data-testid="receive-flash"
            />
          )}
        </AnimatePresence>

        {/* Active edge highlight during animation */}
        {isAnimating && (
          <motion.path
            d={edgePath}
            stroke={eventColor}
            strokeWidth={3}
            strokeDasharray="8 4"
            fill="none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.7 }}
            style={{ filter: `drop-shadow(0 0 6px ${eventColor})` }}
          />
        )}
      </g>

      {/* Edge icon */}
      <EdgeLabelRenderer>
        <motion.div
          className={`edge-icon event-edge-icon ${isActive || isAnimating ? 'icon-active' : ''}`}
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            pointerEvents: 'all',
            borderColor: isAnimating ? eventColor : undefined,
          }}
          animate={isAnimating ? {
            scale: [1, 1.2, 1],
            transition: { duration: 0.3, repeat: Infinity, repeatDelay: 0.5 }
          } : {}}
          data-testid="event-edge-icon"
        >
          ⚡
        </motion.div>
      </EdgeLabelRenderer>

      {/* Edge label */}
      {data?.label && (
        <EdgeLabelRenderer>
          <div
            className={`edge-label event-edge-label ${isActive || isAnimating ? 'label-active' : ''}`}
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY + 20}px)`,
              pointerEvents: 'all',
            }}
            data-testid="edge-label"
          >
            {data.label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
});

export default AnimatedEventEdge;
