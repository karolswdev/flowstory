import { NodeHandles } from './NodeHandles';
import { getNodeSize, getSizeStyles } from './sizes';
import { motion, AnimatePresence } from 'motion/react';
import type { DecisionNodeProps } from './types';
import { nodeVariants, decisionVariants, pulseVariants, getNodeAnimationState } from '../../animations/nodeVariants';
import './nodes.css';

/**
 * DecisionNode - Represents a decision/branch point
 * Diamond shape with 3D rotation when active
 */
export function DecisionNode({ data, selected }: DecisionNodeProps) {
  const { label, description, isActive, isComplete, size } = data;
  const sizeConfig = getNodeSize('decision', size);
  // Decision is a diamond - use max dimension for square bounding box
  const diamondSize = Math.max(sizeConfig.width, sizeConfig.height);

  const animationState = getNodeAnimationState(isActive, isComplete);
  const stateClass = isActive ? 'node-active' : isComplete ? 'node-complete' : '';
  const sizeClass = size ? `node-size-${size}` : '';

  return (
    <motion.div
      className={`decision-node-wrapper ${stateClass} ${sizeClass} ${selected ? 'node-selected' : ''}`}
      data-testid="decision-node"
      data-state={animationState}
      title={description}
      variants={nodeVariants}
      initial="hidden"
      animate={animationState}
      layout
      style={{ perspective: 800, fontSize: sizeConfig.fontSize }}
    >
      {/* Glow layer behind diamond */}
      <motion.div
        className="decision-glow"
        variants={pulseVariants}
        animate={animationState}
      />

      {/* Diamond badge */}
      <motion.div
        className="decision-node"
        variants={decisionVariants}
        animate={isActive ? 'active' : 'inactive'}
      >
        <motion.div 
          className="decision-icon"
          animate={isActive ? {
            scale: [1, 1.1, 1],
          } : {}}
          transition={{ duration: 1, repeat: Infinity }}
        >
          ?
        </motion.div>
      </motion.div>

      {/* Label inline with badge */}
      <motion.div 
        className="decision-label"
        initial={{ opacity: 0, x: -5 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1 }}
      >
        {label}
      </motion.div>

      {/* Thinking dots animation when active */}
      <AnimatePresence>
        {isActive && (
          <motion.div 
            className="decision-thinking"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {[0, 1, 2].map((i) => (
              <motion.span
                key={i}
                className="thinking-dot"
                animate={{ y: [0, -5, 0] }}
                transition={{
                  duration: 0.6,
                  repeat: Infinity,
                  delay: i * 0.15,
                }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Completion check */}
      <AnimatePresence>
        {isComplete && (
          <motion.span 
            className="complete-check decision-complete"
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
