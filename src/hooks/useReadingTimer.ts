import { useState, useCallback, useEffect, useRef } from 'react';

/**
 * Reading time calculation constants
 */
const WORDS_PER_MINUTE = 180;
const MIN_SECONDS = 3;
const MAX_SECONDS = 15;
const CONTEXT_SWITCH_BUFFER = 1; // Extra second for context switching

/**
 * Calculate reading time in seconds based on text length
 * 
 * @param text - The text to calculate reading time for
 * @returns Reading time in seconds (bounded between 3-15s)
 */
export function calculateReadingTime(text: string): number {
  if (!text || text.trim().length === 0) {
    return MIN_SECONDS;
  }

  // Count words (split on whitespace)
  const wordCount = text.trim().split(/\s+/).length;
  
  // Calculate raw time in seconds
  const rawSeconds = (wordCount / WORDS_PER_MINUTE) * 60;
  
  // Add buffer for context switching
  const adjustedSeconds = rawSeconds + CONTEXT_SWITCH_BUFFER;
  
  // Clamp to bounds and round
  return Math.max(MIN_SECONDS, Math.min(MAX_SECONDS, Math.round(adjustedSeconds)));
}

/**
 * Reading timer state
 */
interface ReadingTimerState {
  /** Seconds remaining */
  remaining: number;
  /** Whether timer is paused */
  isPaused: boolean;
  /** Whether timer is running */
  isRunning: boolean;
}

/**
 * Reading timer controls
 */
interface ReadingTimerControls {
  /** Start the timer */
  start: () => void;
  /** Pause the timer */
  pause: () => void;
  /** Resume the timer */
  resume: () => void;
  /** Reset timer to new duration */
  reset: (duration: number) => void;
  /** Stop and clear the timer */
  stop: () => void;
}

/**
 * Hook for managing reading time countdown
 * 
 * @param initialDuration - Initial duration in seconds
 * @param onComplete - Callback when timer reaches zero
 * @returns Timer state and controls
 */
export function useReadingTimer(
  initialDuration: number,
  onComplete?: () => void
): ReadingTimerState & ReadingTimerControls {
  const [remaining, setRemaining] = useState(initialDuration);
  const [isPaused, setIsPaused] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  
  const intervalRef = useRef<number | null>(null);
  const onCompleteRef = useRef(onComplete);

  // Keep callback ref updated
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const clearTimer = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const start = useCallback(() => {
    clearTimer();
    setIsPaused(false);
    setIsRunning(true);

    intervalRef.current = window.setInterval(() => {
      setRemaining(prev => {
        if (prev <= 1) {
          clearTimer();
          setIsRunning(false);
          onCompleteRef.current?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [clearTimer]);

  const pause = useCallback(() => {
    clearTimer();
    setIsPaused(true);
  }, [clearTimer]);

  const resume = useCallback(() => {
    if (remaining > 0) {
      setIsPaused(false);
      
      intervalRef.current = window.setInterval(() => {
        setRemaining(prev => {
          if (prev <= 1) {
            clearTimer();
            setIsRunning(false);
            onCompleteRef.current?.();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
  }, [remaining, clearTimer]);

  const reset = useCallback((duration: number) => {
    clearTimer();
    setRemaining(duration);
    setIsPaused(true);
    setIsRunning(false);
  }, [clearTimer]);

  const stop = useCallback(() => {
    clearTimer();
    setRemaining(0);
    setIsPaused(true);
    setIsRunning(false);
  }, [clearTimer]);

  return {
    remaining,
    isPaused,
    isRunning,
    start,
    pause,
    resume,
    reset,
    stop,
  };
}

export default useReadingTimer;
