/**
 * BaseCanvas Component
 * 
 * Abstract base component for all FlowStory specialized renderers.
 * Provides consistent:
 * - Container layout
 * - Info panel with step title/description
 * - Step navigation controls
 * - Keyboard navigation (← → Space)
 * 
 * @example
 * ```tsx
 * <BaseCanvas
 *   className="my-renderer"
 *   currentStepIndex={stepIndex}
 *   totalSteps={story.steps.length}
 *   stepTitle={currentStep.title}
 *   stepDescription={currentStep.description}
 *   onStepChange={setStepIndex}
 * >
 *   <svg>...</svg>
 * </BaseCanvas>
 * ```
 */

import { useEffect, useCallback, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { fadeUp, TRANSITION } from '../../animation';
import './base-canvas.css';

export interface BaseCanvasProps {
  /** Additional CSS class for the container */
  className?: string;
  /** Current step index (0-based) */
  currentStepIndex: number;
  /** Total number of steps */
  totalSteps: number;
  /** Current step title (for info panel) */
  stepTitle?: string;
  /** Current step description (for info panel) */
  stepDescription?: string;
  /** Optional additional content for info panel */
  stepExtra?: ReactNode;
  /** Callback when step changes */
  onStepChange?: (step: number) => void;
  /** Main visualization content */
  children: ReactNode;
  /** Whether to show the info panel (default: true) */
  showInfo?: boolean;
  /** Whether to show navigation (default: true) */
  showNav?: boolean;
  /** Whether to enable keyboard navigation (default: true) */
  enableKeyboard?: boolean;
  /** Custom info panel class */
  infoClassName?: string;
  /** Custom nav class */
  navClassName?: string;
}

/**
 * BaseCanvas provides a consistent layout and navigation for all specialized renderers.
 * 
 * Features:
 * - Animated info panel with step title and description
 * - Previous/Next navigation with step counter
 * - Keyboard shortcuts (← → for navigation, Space for next)
 * - Responsive design using design tokens
 * - Presentation mode compatible
 */
export function BaseCanvas({
  className = '',
  currentStepIndex,
  totalSteps,
  stepTitle,
  stepDescription,
  stepExtra,
  onStepChange,
  children,
  showInfo = true,
  showNav = true,
  enableKeyboard = true,
  infoClassName = '',
  navClassName = '',
}: BaseCanvasProps): JSX.Element {
  
  // Navigation helpers
  const canGoPrev = currentStepIndex > 0;
  const canGoNext = currentStepIndex < totalSteps - 1;
  
  const goToPrev = useCallback(() => {
    if (canGoPrev) {
      onStepChange?.(currentStepIndex - 1);
    }
  }, [canGoPrev, currentStepIndex, onStepChange]);
  
  const goToNext = useCallback(() => {
    if (canGoNext) {
      onStepChange?.(currentStepIndex + 1);
    }
  }, [canGoNext, currentStepIndex, onStepChange]);
  
  // Keyboard navigation
  useEffect(() => {
    if (!enableKeyboard) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      
      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          goToPrev();
          break;
        case 'ArrowRight':
        case ' ': // Space
          e.preventDefault();
          goToNext();
          break;
        case 'Home':
          e.preventDefault();
          onStepChange?.(0);
          break;
        case 'End':
          e.preventDefault();
          onStepChange?.(totalSteps - 1);
          break;
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [enableKeyboard, goToPrev, goToNext, onStepChange, totalSteps]);
  
  const hasStepInfo = stepTitle || stepDescription;
  
  return (
    <div className={`base-canvas ${className}`.trim()}>
      {/* Main visualization slot */}
      <div className="base-canvas__content">
        {children}
      </div>
      
      {/* Info panel */}
      {showInfo && (
        <AnimatePresence mode="wait">
          {hasStepInfo && (
            <motion.div
              className={`base-canvas__info ${infoClassName}`.trim()}
              variants={fadeUp}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={TRANSITION.default}
              key={currentStepIndex}
            >
              {stepTitle && <h3 className="base-canvas__title">{stepTitle}</h3>}
              {stepDescription && <p className="base-canvas__description">{stepDescription}</p>}
              {stepExtra}
            </motion.div>
          )}
        </AnimatePresence>
      )}
      
      {/* Navigation */}
      {showNav && totalSteps > 1 && (
        <nav className={`base-canvas__nav ${navClassName}`.trim()} aria-label="Step navigation">
          <button
            className="base-canvas__nav-btn"
            onClick={goToPrev}
            disabled={!canGoPrev}
            aria-label="Previous step"
          >
            ← Previous
          </button>
          <span className="base-canvas__nav-progress" aria-live="polite">
            {currentStepIndex + 1} / {totalSteps}
          </span>
          <button
            className="base-canvas__nav-btn"
            onClick={goToNext}
            disabled={!canGoNext}
            aria-label="Next step"
          >
            Next →
          </button>
        </nav>
      )}
    </div>
  );
}

export default BaseCanvas;
