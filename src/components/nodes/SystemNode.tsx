import { NodeHandles } from './NodeHandles';
import { getNodeSize, getSizeStyles } from './sizes';
import { motion, AnimatePresence } from 'motion/react';
import type { SystemNodeProps } from './types';
import { nodeVariants, spinVariants, pulseVariants, getNodeAnimationState } from '../../animations/nodeVariants';
import './nodes.css';

/**
 * SystemNode - Represents a system/service process
 * Rectangle with spinning gear icon when active
 */
export function SystemNode({ data, selected }: SystemNodeProps) {
  const { label, description, isActive, isComplete, size } = data;
  const sizeConfig = getNodeSize('system', size);
  const sizeStyles = getSizeStyles(sizeConfig);

  const animationState = getNodeAnimationState(isActive, isComplete);
  const stateClass = isActive ? 'node-active' : isComplete ? 'node-complete' : '';
  const sizeClass = size ? `node-size-${size}` : '';

  return (
    <motion.div
      className={`system-node ${stateClass} ${sizeClass} ${selected ? 'node-selected' : ''}`}
      data-testid="system-node"
      data-state={animationState}
      title={description}
      variants={nodeVariants}
      initial="hidden"
      animate={animationState}
      layout
      style={sizeStyles}
    >
      {/* Glow effect */}
      <motion.div
        className="node-glow-layer system-glow"
        variants={pulseVariants}
        animate={animationState}
      />

      {/* Spinning gear icon */}
      <motion.div 
        className="system-icon-container"
        variants={spinVariants}
        animate={isActive ? 'active' : 'inactive'}
      >
        <span className="system-icon">⚙️</span>
      </motion.div>

      {/* Label with staggered entrance */}
      <motion.div 
        className="system-content"
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.15, duration: 0.3 }}
      >
        <div className="system-label">{label}</div>
        {description && (
          <motion.div 
            className="system-description"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.7 }}
            transition={{ delay: 0.25 }}
          >
            {description}
          </motion.div>
        )}
      </motion.div>

      {/* Progress indicator when active */}
      <AnimatePresence>
        {isActive && (
          <motion.div
            className="system-progress"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            exit={{ scaleX: 0, opacity: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        )}
      </AnimatePresence>

      {/* Completion check */}
      <AnimatePresence>
        {isComplete && (
          <motion.span 
            className="complete-check"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
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
