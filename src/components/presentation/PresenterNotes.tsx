/**
 * Presenter Notes Component
 * 
 * Shows presenter-only notes during presentation mode.
 * Can be displayed as:
 * - Side panel (default)
 * - Bottom drawer
 * - Overlay
 * 
 * Notes are hidden from the main presentation view.
 */

import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { fadeUp, TRANSITION } from '../../animation';
import './presenter-notes.css';

export interface PresenterNotesProps {
  /** Notes content (markdown supported) */
  notes?: string;
  /** Current step index */
  stepIndex: number;
  /** Total number of steps */
  totalSteps: number;
  /** Whether presentation mode is active */
  isPresenting?: boolean;
  /** Display position */
  position?: 'side' | 'bottom' | 'overlay';
  /** Called when notes panel is toggled */
  onToggle?: (visible: boolean) => void;
}

export function PresenterNotes({
  notes,
  stepIndex,
  totalSteps,
  isPresenting = false,
  position = 'side',
  onToggle,
}: PresenterNotesProps): JSX.Element | null {
  const [isVisible, setIsVisible] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);

  const toggleNotes = useCallback(() => {
    const newVisible = !isVisible;
    setIsVisible(newVisible);
    onToggle?.(newVisible);
  }, [isVisible, onToggle]);

  // Keyboard shortcut: N to toggle notes
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      
      if (e.key.toLowerCase() === 'n' && isPresenting) {
        e.preventDefault();
        toggleNotes();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isPresenting, toggleNotes]);

  // Only show in presentation mode
  if (!isPresenting) return null;

  return (
    <>
      {/* Toggle button */}
      <button 
        className="presenter-notes-toggle"
        onClick={toggleNotes}
        title={isVisible ? 'Hide notes (N)' : 'Show notes (N)'}
        aria-label={isVisible ? 'Hide presenter notes' : 'Show presenter notes'}
      >
        📝
      </button>

      {/* Notes panel */}
      <AnimatePresence>
        {isVisible && (
          <motion.div 
            className={`presenter-notes presenter-notes--${position}`}
            variants={fadeUp}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={TRANSITION.default}
          >
            <div className="presenter-notes__header">
              <div className="presenter-notes__step">
                Step {stepIndex + 1} of {totalSteps}
              </div>
              <div className="presenter-notes__actions">
                <button 
                  className="presenter-notes__expand"
                  onClick={() => setIsExpanded(!isExpanded)}
                  aria-label={isExpanded ? 'Collapse notes' : 'Expand notes'}
                >
                  {isExpanded ? '−' : '+'}
                </button>
                <button 
                  className="presenter-notes__close"
                  onClick={toggleNotes}
                  aria-label="Close notes"
                >
                  ×
                </button>
              </div>
            </div>

            <AnimatePresence mode="wait">
              {isExpanded && (
                <motion.div 
                  className="presenter-notes__content"
                  key={stepIndex}
                  variants={fadeUp}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={TRANSITION.default}
                >
                  {notes ? (
                    <div className="presenter-notes__text">
                      {notes.split('\n').map((line, i) => (
                        <p key={i}>{line || '\u00A0'}</p>
                      ))}
                    </div>
                  ) : (
                    <div className="presenter-notes__empty">
                      No notes for this step
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="presenter-notes__footer">
              <kbd>N</kbd> Toggle notes · 
              <kbd>←</kbd><kbd>→</kbd> Navigate
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default PresenterNotes;
