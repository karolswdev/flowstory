/**
 * Animation System
 * 
 * Exports for the directional animation system.
 * Based on SPEC-021: Directional Animation System
 */

// Configuration
export {
  ANIMATION_TIMING,
  ANIMATION_SIZES,
  ANIMATION_OPACITY,
  ANIMATION_SATURATION,
  EASING,
  LAYER_ORDER,
  prefersReducedMotion,
  getTiming,
  type LayerName,
} from './config';

// Node variants
export {
  nodeVariants,
  reducedMotionVariants,
  getNodeVariants,
  getNodeAnimationState,
  activeGlowVariants,
  staggerContainerVariants,
  floatVariants,
  spinVariants,
  flashVariants,
  decisionVariants,
  celebrateVariants,
  type NodeAnimationState,
} from './nodeVariants';

// Edge variants
export {
  edgeVariants,
  reducedMotionEdgeVariants,
  getEdgeVariants,
  getEdgeAnimationState,
  particleVariants,
  edgePulseVariants,
  EDGE_DRAW_KEYFRAMES,
  calculateEdgeDelay,
  type EdgeAnimationState,
} from './edgeVariants';

// Step transition hook
export {
  useStepTransition,
  delay,
  animateStepTransition,
} from './useStepTransition';
