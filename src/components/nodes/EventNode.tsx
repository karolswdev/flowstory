import { NodeHandles } from './NodeHandles';
import { motion, AnimatePresence } from 'motion/react';
import type { EventNodeProps } from './types';
import { nodeVariants, flashVariants, getNodeAnimationState } from '../../animations/nodeVariants';
import './nodes.css';

/**
 * EventNode - Represents a domain event
 * Badge shape with lightning icon and flash animation
 */
export function EventNode({ data, selected }: EventNodeProps) {
  const { label, description, isActive, isComplete } = data;

  const animationState = getNodeAnimationState(isActive, isComplete);
  const stateClass = isActive ? 'node-active' : isComplete ? 'node-complete' : '';

  return (
    <motion.div
      className={`event-node ${stateClass} ${selected ? 'node-selected' : ''}`}
      data-testid="event-node"
      data-state={animationState}
      title={description}
      variants={nodeVariants}
      initial="hidden"
      animate={animationState}
      layout
    >
      {/* Electric glow effect */}
      <motion.div
        className="event-electric-glow"
        animate={isActive ? {
          boxShadow: [
            '0 0 10px rgba(255, 193, 7, 0.3)',
            '0 0 20px rgba(255, 193, 7, 0.5)',
            '0 0 10px rgba(255, 193, 7, 0.3)',
          ],
        } : {
          boxShadow: '0 0 5px rgba(255, 193, 7, 0.1)',
        }}
        transition={{ duration: 1, repeat: Infinity }}
      />

      {/* Lightning icon */}
      <motion.div
        className="event-icon-wrapper"
        variants={flashVariants}
        animate={isActive ? 'active' : 'inactive'}
      >
        <span className="event-icon">⚡</span>
      </motion.div>

      {/* Label */}
      <motion.div 
        className="event-label"
        title={label}
        initial={{ opacity: 0, x: -5 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1, duration: 0.2 }}
      >
        {label}
      </motion.div>

      {/* Ripple effect on activation */}
      <AnimatePresence>
        {isActive && (
          <motion.div
            className="event-ripple"
            initial={{ scale: 0.8, opacity: 1 }}
            animate={{ scale: 1.5, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1, repeat: Infinity }}
          />
        )}
      </AnimatePresence>

      {/* Completion check */}
      <AnimatePresence>
        {isComplete && (
          <motion.span 
            className="complete-check"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            transition={{ type: 'spring', stiffness: 500, damping: 25 }}
          >
            ✓
          </motion.span>
        )}
      </AnimatePresence>

      <NodeHandles />
    </motion.div>
  );
}
