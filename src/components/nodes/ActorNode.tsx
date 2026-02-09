import { NodeHandles } from './NodeHandles';
import { motion, AnimatePresence } from 'motion/react';
import type { ActorNodeProps } from './types';
import { nodeVariants, floatVariants, pulseVariants, getNodeAnimationState } from '../../animations/nodeVariants';
import './nodes.css';

/**
 * ActorNode - Represents a user/persona with avatar
 * Renders as a circle with floating animation when active
 */
export function ActorNode({ data, selected }: ActorNodeProps) {
  const { label, avatar, color, isActive, isComplete } = data;

  const animationState = getNodeAnimationState(isActive, isComplete);
  const stateClass = isActive ? 'node-active' : isComplete ? 'node-complete' : '';

  return (
    <motion.div
      className={`actor-node ${stateClass} ${selected ? 'node-selected' : ''}`}
      data-testid="actor-node"
      data-state={animationState}
      variants={nodeVariants}
      initial="hidden"
      animate={animationState}
      layout
    >
      {/* Outer glow ring */}
      <motion.div
        className="actor-glow-ring"
        variants={pulseVariants}
        animate={animationState}
        style={{ 
          borderColor: color || 'var(--color-brand-primary)',
        }}
      />

      {/* Floating avatar container */}
      <motion.div
        className="actor-avatar-container"
        variants={floatVariants}
        animate={isActive ? 'active' : 'inactive'}
        style={{ 
          backgroundColor: color || 'var(--color-brand-primary)',
        }}
      >
        {/* Avatar with scale-in animation */}
        <motion.span 
          className="actor-avatar"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ 
            type: 'spring', 
            stiffness: 400, 
            damping: 20,
            delay: 0.15,
          }}
        >
          {avatar || '👤'}
        </motion.span>
      </motion.div>

      {/* Label with fade-in */}
      <motion.div 
        className="actor-label"
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.3 }}
      >
        {label}
      </motion.div>

      {/* Completion indicator */}
      <AnimatePresence>
        {isComplete && (
          <motion.span 
            className="complete-check"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
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
