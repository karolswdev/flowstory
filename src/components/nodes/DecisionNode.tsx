import { Handle, Position } from '@xyflow/react';
import { motion, AnimatePresence } from 'motion/react';
import type { DecisionNodeProps } from './types';
import { nodeVariants, decisionVariants, pulseVariants, getNodeAnimationState } from './animations';
import './nodes.css';

/**
 * DecisionNode - Represents a decision/branch point
 * Diamond shape with 3D rotation when active
 */
export function DecisionNode({ data, selected }: DecisionNodeProps) {
  const { label, description, isActive, isComplete } = data;

  const animationState = getNodeAnimationState(isActive, isComplete);
  const stateClass = isActive ? 'node-active' : isComplete ? 'node-complete' : '';

  return (
    <motion.div
      className={`decision-node-wrapper ${stateClass} ${selected ? 'node-selected' : ''}`}
      data-testid="decision-node"
      data-state={animationState}
      title={description}
      variants={nodeVariants}
      initial="hidden"
      animate={animationState}
      layout
      style={{ perspective: 800 }}
    >
      {/* Glow layer behind diamond */}
      <motion.div
        className="decision-glow"
        variants={pulseVariants}
        animate={animationState}
      />

      {/* 3D rotating diamond */}
      <motion.div
        className="decision-node"
        variants={decisionVariants}
        animate={isActive ? 'active' : 'inactive'}
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* Question mark icon */}
        <motion.div 
          className="decision-icon"
          animate={isActive ? {
            scale: [1, 1.2, 1],
            rotate: [0, 5, -5, 0],
          } : {}}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          ?
        </motion.div>

        {/* Label */}
        <motion.div 
          className="decision-label"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {label}
        </motion.div>
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

      {/* Handles positioned for diamond shape */}
      <Handle type="target" position={Position.Left} className="decision-handle-left" />
      <Handle type="source" position={Position.Right} id="yes" className="decision-handle-right" />
      <Handle type="source" position={Position.Bottom} id="no" className="decision-handle-bottom" />
    </motion.div>
  );
}
