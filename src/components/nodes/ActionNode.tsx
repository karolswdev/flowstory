import { NodeHandles } from './NodeHandles';
import { getNodeSize, getSizeStyles } from './sizes';
import { motion, AnimatePresence } from 'motion/react';
import type { ActionNodeProps } from './types';
import { nodeVariants, pulseVariants, getNodeAnimationState } from '../../animations/nodeVariants';
import './nodes.css';

/**
 * ActionNode - Represents a user action
 * Renders as a rounded rectangle with dynamic animations
 */
export function ActionNode({ data, selected }: ActionNodeProps) {
  const { label, description, isActive, isComplete, size } = data;
  const sizeConfig = getNodeSize('action', size);
  const sizeStyles = getSizeStyles(sizeConfig);

  const animationState = getNodeAnimationState(isActive, isComplete);
  const stateClass = isActive ? 'node-active' : isComplete ? 'node-complete' : '';
  const sizeClass = size ? `node-size-${size}` : '';

  return (
    <motion.div
      className={`action-node ${stateClass} ${sizeClass} ${selected ? 'node-selected' : ''}`}
      data-testid="action-node"
      data-state={animationState}
      title={description}
      variants={nodeVariants}
      initial="hidden"
      animate={animationState}
      layout
      layoutId={`action-${label}`}
      style={{ ...sizeStyles, perspective: 1000 }}
    >
      {/* Glow effect layer */}
      <motion.div
        className="node-glow-layer"
        variants={pulseVariants}
        animate={animationState}
      />
      
      {/* Content */}
      <motion.div 
        className="action-content"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.3 }}
      >
        <span className="action-icon">👆</span>
        <div className="action-label">{label}</div>
      </motion.div>

      {/* Completion check with animation */}
      <AnimatePresence>
        {isComplete && (
          <motion.span 
            className="complete-check"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 180 }}
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
