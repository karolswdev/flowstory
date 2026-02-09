import { Handle, Position } from '@xyflow/react';
import { motion, AnimatePresence } from 'motion/react';
import type { StateNodeProps } from './types';
import { nodeVariants, celebrateVariants, getNodeAnimationState, getStateVariant } from './animations';
import './nodes.css';

/**
 * StateNode - Represents a state/status
 * Pill shape with variant-based styling and celebration animations
 */
export function StateNode({ data, selected }: StateNodeProps) {
  const { label, description, variant, isActive, isComplete } = data;

  const animationState = getNodeAnimationState(isActive, isComplete);
  const variantState = getStateVariant(variant, isActive);
  const stateClass = isActive ? 'node-active' : isComplete ? 'node-complete' : '';
  const variantClass = variant ? `state-${variant}` : '';

  // Variant-specific icons
  const variantIcon = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ',
  }[variant || 'info'] || '●';

  return (
    <motion.div
      className={`state-node ${stateClass} ${variantClass} ${selected ? 'node-selected' : ''}`}
      data-testid="state-node"
      data-state={animationState}
      title={description}
      variants={nodeVariants}
      initial="hidden"
      animate={animationState}
      layout
    >
      {/* Variant-specific glow */}
      <motion.div
        className={`state-glow state-glow-${variant || 'info'}`}
        animate={isActive ? {
          opacity: [0.3, 0.6, 0.3],
          scale: [1, 1.1, 1],
        } : { opacity: 0.1, scale: 1 }}
        transition={{ duration: 2, repeat: Infinity }}
      />

      {/* Celebration animation container */}
      <motion.div
        className="state-content"
        variants={celebrateVariants}
        animate={variantState}
      >
        {/* Variant icon with bounce */}
        <motion.span 
          className="state-icon"
          initial={{ scale: 0, rotate: -90 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ 
            type: 'spring', 
            stiffness: 500, 
            damping: 20,
            delay: 0.1,
          }}
        >
          {variantIcon}
        </motion.span>

        {/* Label */}
        <motion.span 
          className="state-label"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.15, duration: 0.3 }}
        >
          {label}
        </motion.span>
      </motion.div>

      {/* Success confetti effect */}
      <AnimatePresence>
        {isActive && variant === 'success' && (
          <>
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                className="confetti"
                initial={{ 
                  x: 0, 
                  y: 0, 
                  opacity: 1,
                  scale: 1,
                }}
                animate={{ 
                  x: (Math.random() - 0.5) * 100,
                  y: -50 - Math.random() * 50,
                  opacity: 0,
                  scale: 0,
                  rotate: Math.random() * 360,
                }}
                transition={{ 
                  duration: 1,
                  delay: i * 0.1,
                  ease: 'easeOut',
                }}
                style={{
                  position: 'absolute',
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  backgroundColor: ['#4CAF50', '#FFC107', '#2196F3', '#E91E63'][i % 4],
                }}
              />
            ))}
          </>
        )}
      </AnimatePresence>

      {/* Error shake particles */}
      <AnimatePresence>
        {isActive && variant === 'error' && (
          <motion.div
            className="error-indicator"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: 0.3, repeat: 2 }}
          />
        )}
      </AnimatePresence>

      <Handle type="source" position={Position.Right} />
      <Handle type="target" position={Position.Left} />
    </motion.div>
  );
}
