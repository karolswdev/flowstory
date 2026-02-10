import { useState, useEffect, useCallback } from 'react';

export interface PresentationModeState {
  /** Whether presentation mode is active */
  isPresenting: boolean;
  /** Toggle presentation mode */
  togglePresentation: () => void;
  /** Enter presentation mode */
  enterPresentation: () => void;
  /** Exit presentation mode */
  exitPresentation: () => void;
}

/**
 * Hook for managing presentation mode
 * 
 * Features:
 * - Fullscreen API integration
 * - Keyboard shortcut (P to toggle, ESC to exit)
 * - Body class for CSS styling
 * 
 * @example
 * const { isPresenting, togglePresentation } = usePresentationMode();
 * 
 * <button onClick={togglePresentation}>
 *   {isPresenting ? 'Exit' : 'Present'}
 * </button>
 */
export function usePresentationMode(): PresentationModeState {
  const [isPresenting, setIsPresenting] = useState(false);

  const enterPresentation = useCallback(async () => {
    try {
      // Request fullscreen
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      }
      setIsPresenting(true);
      document.body.classList.add('presentation-mode');
    } catch (err) {
      // Fullscreen may be blocked, still enter presentation mode
      console.warn('Fullscreen request failed:', err);
      setIsPresenting(true);
      document.body.classList.add('presentation-mode');
    }
  }, []);

  const exitPresentation = useCallback(async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.warn('Exit fullscreen failed:', err);
    }
    setIsPresenting(false);
    document.body.classList.remove('presentation-mode');
  }, []);

  const togglePresentation = useCallback(() => {
    if (isPresenting) {
      exitPresentation();
    } else {
      enterPresentation();
    }
  }, [isPresenting, enterPresentation, exitPresentation]);

  // Handle fullscreen change events (user pressing ESC in fullscreen)
  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && isPresenting) {
        setIsPresenting(false);
        document.body.classList.remove('presentation-mode');
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [isPresenting]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.key.toLowerCase()) {
        case 'p':
          if (!isPresenting) {
            e.preventDefault();
            enterPresentation();
          }
          break;
        case 'escape':
          if (isPresenting) {
            e.preventDefault();
            exitPresentation();
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isPresenting, enterPresentation, exitPresentation]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      document.body.classList.remove('presentation-mode');
    };
  }, []);

  return {
    isPresenting,
    togglePresentation,
    enterPresentation,
    exitPresentation,
  };
}

export default usePresentationMode;
