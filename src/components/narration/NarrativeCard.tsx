import { motion, AnimatePresence } from 'motion/react';
import { memo } from 'react';
import './narrative-card.css';

/**
 * NarrativeCard props
 */
interface NarrativeCardProps {
  /** Current step index (0-based) */
  currentStep: number;
  /** Total number of steps */
  totalSteps: number;
  /** Step title */
  title: string;
  /** Narrative text */
  narrative: string;
  /** Optional icon/emoji */
  icon?: string;
  /** Time remaining in seconds */
  timeRemaining?: number;
  /** Is auto-advance paused */
  isPaused?: boolean;
  /** Whether card is visible */
  visible?: boolean;
  /** Callbacks */
  onBack?: () => void;
  onNext?: () => void;
  onPause?: () => void;
  onResume?: () => void;
  onExit?: () => void;
}

/**
 * NarrativeCard - Overlay card showing step narrative with controls
 */
export const NarrativeCard = memo(function NarrativeCard({
  currentStep,
  totalSteps,
  title,
  narrative,
  icon,
  timeRemaining,
  isPaused = false,
  visible = true,
  onBack,
  onNext,
  onPause,
  onResume,
  onExit,
}: NarrativeCardProps) {
  const progress = ((currentStep + 1) / totalSteps) * 100;
  const canGoBack = currentStep > 0;
  const isLastStep = currentStep === totalSteps - 1;

  if (!visible) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        className="narrative-card"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        role="dialog"
        aria-label="Story narration"
        aria-describedby="narrative-content"
        data-testid="narrative-card"
      >
        {/* Close button */}
        <button
          className="narrative-close"
          onClick={onExit}
          aria-label="Exit tour"
        >
          ✕
        </button>

        {/* Progress Section */}
        <div className="narrative-progress">
          <span className="narrative-step-text">
            Step {currentStep + 1} of {totalSteps}
          </span>
          <div className="narrative-progress-bar">
            <motion.div
              className="narrative-progress-fill"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
            <div
              className="narrative-progress-marker"
              style={{ left: `${progress}%` }}
            />
          </div>
        </div>

        {/* Content Section */}
        <div className="narrative-content" id="narrative-content">
          <h3 className="narrative-title">
            {icon && <span className="narrative-icon">{icon}</span>}
            {title}
          </h3>
          <p className="narrative-text" aria-live="polite">
            {narrative}
          </p>
        </div>

        {/* Controls Section */}
        <div className="narrative-controls">
          <button
            className="narrative-btn narrative-btn-back"
            onClick={onBack}
            disabled={!canGoBack}
            aria-label="Previous step"
          >
            ◀ Back
          </button>

          <div className="narrative-timer">
            {timeRemaining !== undefined && (
              <button
                className="narrative-timer-btn"
                onClick={isPaused ? onResume : onPause}
                aria-label={isPaused ? 'Resume auto-advance' : 'Pause auto-advance'}
              >
                {isPaused ? '▶' : '⏸'} {timeRemaining}s
              </button>
            )}
          </div>

          <button
            className="narrative-btn narrative-btn-next"
            onClick={isLastStep ? onExit : onNext}
            aria-label={isLastStep ? 'Finish tour' : 'Next step'}
          >
            {isLastStep ? 'Finish ✓' : 'Next ▶'}
          </button>
        </div>

        {/* Keyboard hint */}
        <div className="narrative-hint">
          <kbd>Space</kbd> or <kbd>→</kbd> next
          {canGoBack && <> • <kbd>←</kbd> back</>}
          {' • '}<kbd>Esc</kbd> exit
        </div>
      </motion.div>
    </AnimatePresence>
  );
});

export default NarrativeCard;
