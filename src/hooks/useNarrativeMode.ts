/**
 * Narrative Mode Hook
 * 
 * Orchestrates the narrative experience:
 * - Auto-advance with configurable timing
 * - Pause on hover/interaction
 * - Keyboard controls
 * - Integration with SpotlightOverlay and NarrativeCard
 */

import { useState, useCallback, useEffect, useRef } from 'react';

export interface NarrativeStep {
  step: number;
  speaker?: string;
  text: string;
  title?: string;
  icon?: string;
  focusNodes?: string[];
  duration?: number;
}

export interface NarrativeConfig {
  enabled?: boolean;
  mode?: 'auto' | 'manual';
  defaultDuration?: number;
  narrator?: {
    name: string;
    avatar: string;
  };
  steps: NarrativeStep[];
}

interface UseNarrativeModeOptions {
  /** Narrative configuration from story */
  narrative?: NarrativeConfig;
  /** Total steps in the story */
  totalSteps: number;
  /** Current step index */
  currentStepIndex: number;
  /** Callback to change step */
  onStepChange: (step: number) => void;
  /** Called when narrative completes */
  onComplete?: () => void;
  /** Called when narrative exits */
  onExit?: () => void;
}

interface NarrativeModeState {
  /** Whether narrative mode is active */
  isActive: boolean;
  /** Whether auto-advance is paused */
  isPaused: boolean;
  /** Time remaining until next auto-advance (seconds) */
  timeRemaining: number;
  /** Current narrative step data */
  currentNarrative: NarrativeStep | null;
  /** Start narrative mode */
  start: () => void;
  /** Stop narrative mode */
  stop: () => void;
  /** Pause auto-advance */
  pause: () => void;
  /** Resume auto-advance */
  resume: () => void;
  /** Go to next step */
  next: () => void;
  /** Go to previous step */
  previous: () => void;
  /** Narrator info */
  narrator: { name: string; avatar: string };
}

const DEFAULT_NARRATOR = {
  name: 'Guide',
  avatar: '🎙️',
};

const DEFAULT_DURATION = 5000;

/**
 * Hook for narrative mode functionality
 */
export function useNarrativeMode(options: UseNarrativeModeOptions): NarrativeModeState {
  const {
    narrative,
    totalSteps,
    currentStepIndex,
    onStepChange,
    onComplete,
    onExit,
  } = options;

  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoAdvanceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const narrator = narrative?.narrator || DEFAULT_NARRATOR;
  const isAutoMode = narrative?.mode !== 'manual';
  const defaultDuration = narrative?.defaultDuration || DEFAULT_DURATION;

  // Get current narrative step
  const currentNarrative = narrative?.steps?.find(
    s => s.step === currentStepIndex + 1
  ) || null;

  // Clear timers
  const clearTimers = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (autoAdvanceRef.current) {
      clearTimeout(autoAdvanceRef.current);
      autoAdvanceRef.current = null;
    }
  }, []);

  // Start auto-advance timer
  const startAutoAdvance = useCallback(() => {
    if (!isAutoMode || isPaused) return;
    
    clearTimers();
    
    const duration = currentNarrative?.duration || defaultDuration;
    const seconds = Math.ceil(duration / 1000);
    setTimeRemaining(seconds);

    // Countdown timer
    timerRef.current = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Auto-advance
    autoAdvanceRef.current = setTimeout(() => {
      if (currentStepIndex < totalSteps - 1) {
        onStepChange(currentStepIndex + 1);
      } else {
        // Completed
        onComplete?.();
        setIsActive(false);
      }
    }, duration);
  }, [
    isAutoMode, 
    isPaused, 
    currentNarrative, 
    defaultDuration, 
    currentStepIndex, 
    totalSteps, 
    onStepChange, 
    onComplete, 
    clearTimers
  ]);

  // Start narrative mode
  const start = useCallback(() => {
    setIsActive(true);
    setIsPaused(false);
    onStepChange(0);
  }, [onStepChange]);

  // Stop/exit narrative mode
  const stop = useCallback(() => {
    clearTimers();
    setIsActive(false);
    setIsPaused(false);
    setTimeRemaining(0);
    onExit?.();
  }, [clearTimers, onExit]);

  // Pause
  const pause = useCallback(() => {
    setIsPaused(true);
    clearTimers();
  }, [clearTimers]);

  // Resume
  const resume = useCallback(() => {
    setIsPaused(false);
    // Will trigger startAutoAdvance via useEffect
  }, []);

  // Next step
  const next = useCallback(() => {
    clearTimers();
    if (currentStepIndex < totalSteps - 1) {
      onStepChange(currentStepIndex + 1);
    } else {
      onComplete?.();
      setIsActive(false);
    }
  }, [currentStepIndex, totalSteps, onStepChange, onComplete, clearTimers]);

  // Previous step
  const previous = useCallback(() => {
    clearTimers();
    if (currentStepIndex > 0) {
      onStepChange(currentStepIndex - 1);
    }
  }, [currentStepIndex, onStepChange, clearTimers]);

  // Start auto-advance when step changes
  useEffect(() => {
    if (isActive && !isPaused && isAutoMode) {
      startAutoAdvance();
    }
    return () => clearTimers();
  }, [isActive, isPaused, currentStepIndex, isAutoMode, startAutoAdvance, clearTimers]);

  // Keyboard controls
  useEffect(() => {
    if (!isActive) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case ' ':
        case 'ArrowRight':
        case 'Enter':
          e.preventDefault();
          next();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          previous();
          break;
        case 'Escape':
          e.preventDefault();
          stop();
          break;
        case 'p':
          e.preventDefault();
          isPaused ? resume() : pause();
          break;
        case 'Home':
          e.preventDefault();
          onStepChange(0);
          break;
        case 'End':
          e.preventDefault();
          onStepChange(totalSteps - 1);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isActive, isPaused, next, previous, stop, pause, resume, onStepChange, totalSteps]);

  return {
    isActive,
    isPaused,
    timeRemaining,
    currentNarrative,
    start,
    stop,
    pause,
    resume,
    next,
    previous,
    narrator,
  };
}

export default useNarrativeMode;
