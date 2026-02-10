import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface KeyboardHelpProps {
  /** Whether help can be shown (e.g., only in presentation mode) */
  enabled?: boolean;
}

const SHORTCUTS = [
  { key: '→ / Space', action: 'Next step' },
  { key: '←', action: 'Previous step' },
  { key: 'Home', action: 'First step' },
  { key: 'End', action: 'Last step' },
  { key: 'P', action: 'Enter presentation' },
  { key: 'ESC', action: 'Exit presentation' },
  { key: '?', action: 'Toggle this help' },
];

/**
 * Keyboard shortcut help overlay
 * 
 * Press ? to show/hide
 */
export function KeyboardHelp({ enabled = true }: KeyboardHelpProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setIsVisible(false);
      return;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.key === '?') {
        e.preventDefault();
        setIsVisible(v => !v);
      }
      
      // Hide on ESC
      if (e.key === 'Escape' && isVisible) {
        setIsVisible(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [enabled, isVisible]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="keyboard-help-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={() => setIsVisible(false)}
        >
          <motion.div
            className="keyboard-help-modal"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.2 }}
            onClick={e => e.stopPropagation()}
          >
            <h2>Keyboard Shortcuts</h2>
            <div className="keyboard-help-list">
              {SHORTCUTS.map(({ key, action }) => (
                <div key={key} className="keyboard-help-item">
                  <kbd>{key}</kbd>
                  <span>{action}</span>
                </div>
              ))}
            </div>
            <p className="keyboard-help-dismiss">Press <kbd>?</kbd> or click to close</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default KeyboardHelp;
