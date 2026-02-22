import { memo } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import './step-overlay.css';

export interface StepOverlayProps {
  /** Current step index (0-based) */
  stepIndex: number;
  /** Total number of steps */
  totalSteps: number;
  /** Step title */
  title?: string;
  /** Simple narrative text */
  narrative?: string;
  /** Structured narration (speaker + message) */
  narration?: {
    speaker?: string;
    message: string;
  };
  /** Step description (alternative to narrative) */
  description?: string;
  /** Optional accent color for dots */
  accentColor?: string;
  /** Callback when a step dot is clicked */
  onStepChange?: (index: number) => void;
  /** Show step progress dots */
  showDots?: boolean;
  /** Additional CSS class */
  className?: string;
}

export const StepOverlay = memo(function StepOverlay({
  stepIndex,
  totalSteps,
  title,
  narrative,
  narration,
  description,
  accentColor,
  onStepChange,
  showDots = false,
  className,
}: StepOverlayProps) {
  const text = narrative || description;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={stepIndex}
        className={`step-overlay ${className || ''}`}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
        style={accentColor ? { '--step-accent': accentColor } as React.CSSProperties : undefined}
      >
        <div className="step-overlay__badge">
          Step {stepIndex + 1} / {totalSteps}
        </div>

        {title && <h3 className="step-overlay__title">{title}</h3>}

        {text && <p className="step-overlay__text">{text}</p>}

        {narration && (
          <div className="step-overlay__narration">
            {narration.speaker && (
              <span className="step-overlay__speaker">{narration.speaker}:</span>
            )}
            <span className="step-overlay__message">{narration.message}</span>
          </div>
        )}

        {showDots && totalSteps > 1 && (
          <div className="step-overlay__dots">
            {Array.from({ length: totalSteps }, (_, i) => (
              onStepChange ? (
                <button
                  key={i}
                  className={`step-overlay__dot ${i === stepIndex ? 'active' : i < stepIndex ? 'complete' : ''}`}
                  onClick={() => onStepChange(i)}
                  aria-label={`Go to step ${i + 1}`}
                />
              ) : (
                <div
                  key={i}
                  className={`step-overlay__dot ${i === stepIndex ? 'active' : i < stepIndex ? 'complete' : ''}`}
                />
              )
            ))}
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
});
