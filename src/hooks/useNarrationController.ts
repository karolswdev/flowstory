import { useState, useCallback, useEffect } from 'react';
import { useReadingTimer, calculateReadingTime } from './useReadingTimer';
import type { SpotlightRegion } from '../components/narration/SpotlightOverlay';

/**
 * Narration state machine states
 */
export type NarrationState = 
  | 'idle'          // Narration mode not active
  | 'entering'      // Fade in spotlight + card
  | 'reading'       // Timer running, user reading
  | 'paused'        // User paused timer
  | 'transitioning' // Moving between steps
  | 'exiting';      // Fade out, return to normal

/**
 * Single narration step
 */
export interface NarrationStep {
  id: string;
  title: string;
  narrative: string;
  icon?: string;
  /** Regions to spotlight */
  spotlightRegions?: SpotlightRegion[];
  /** Explicit reading time (calculated if not provided) */
  readingTime?: number;
}

/**
 * Narration controller options
 */
interface NarrationControllerOptions {
  /** Steps to narrate */
  steps: NarrationStep[];
  /** Callback when narration completes */
  onComplete?: () => void;
  /** Auto-start narration on mount */
  autoStart?: boolean;
  /** Transition duration in ms */
  transitionDuration?: number;
}

/**
 * Narration controller return type
 */
interface NarrationController {
  /** Current state */
  state: NarrationState;
  /** Current step index */
  currentStep: number;
  /** Current step data */
  currentStepData: NarrationStep | null;
  /** Total steps */
  totalSteps: number;
  /** Time remaining for current step */
  timeRemaining: number;
  /** Whether timer is paused */
  isPaused: boolean;
  /** Start narration */
  start: () => void;
  /** Go to next step */
  goToNext: () => void;
  /** Go to previous step */
  goBack: () => void;
  /** Pause timer */
  pause: () => void;
  /** Resume timer */
  resume: () => void;
  /** Exit narration */
  exit: () => void;
  /** Jump to specific step */
  goToStep: (index: number) => void;
}

/**
 * Hook for managing narration/guided tour
 * 
 * @example
 * ```tsx
 * const narration = useNarrationController({
 *   steps: mySteps,
 *   onComplete: () => setNarrationMode(false),
 * });
 * 
 * return (
 *   <>
 *     <SpotlightOverlay
 *       regions={narration.currentStepData?.spotlightRegions ?? []}
 *       visible={narration.state !== 'idle'}
 *     />
 *     <NarrativeCard
 *       {...narration.currentStepData}
 *       timeRemaining={narration.timeRemaining}
 *       onNext={narration.goToNext}
 *     />
 *   </>
 * );
 * ```
 */
export function useNarrationController({
  steps,
  onComplete,
  autoStart = false,
  transitionDuration = 300,
}: NarrationControllerOptions): NarrationController {
  const [state, setState] = useState<NarrationState>('idle');
  const [currentStep, setCurrentStep] = useState(0);

  const currentStepData = steps[currentStep] ?? null;
  const initialReadingTime = currentStepData?.readingTime ?? 
    calculateReadingTime(currentStepData?.narrative ?? '');

  const timer = useReadingTimer(initialReadingTime, () => {
    // Auto-advance when timer completes
    if (state === 'reading') {
      goToNext();
    }
  });

  const start = useCallback(() => {
    if (steps.length === 0) return;
    
    setState('entering');
    setCurrentStep(0);
    
    const firstStepTime = steps[0]?.readingTime ?? 
      calculateReadingTime(steps[0]?.narrative ?? '');
    timer.reset(firstStepTime);

    setTimeout(() => {
      setState('reading');
      timer.start();
    }, transitionDuration);
  }, [steps, timer, transitionDuration]);

  const goToNext = useCallback(() => {
    if (currentStep >= steps.length - 1) {
      exit();
      return;
    }

    setState('transitioning');
    timer.pause();

    setTimeout(() => {
      const nextIndex = currentStep + 1;
      setCurrentStep(nextIndex);
      
      const nextStepTime = steps[nextIndex]?.readingTime ?? 
        calculateReadingTime(steps[nextIndex]?.narrative ?? '');
      timer.reset(nextStepTime);

      setState('reading');
      timer.start();
    }, transitionDuration);
  }, [currentStep, steps, timer, transitionDuration]);

  const goBack = useCallback(() => {
    if (currentStep <= 0) return;

    setState('transitioning');
    timer.pause();

    setTimeout(() => {
      const prevIndex = currentStep - 1;
      setCurrentStep(prevIndex);
      
      const prevStepTime = steps[prevIndex]?.readingTime ?? 
        calculateReadingTime(steps[prevIndex]?.narrative ?? '');
      timer.reset(prevStepTime);

      setState('reading');
      timer.start();
    }, transitionDuration);
  }, [currentStep, steps, timer, transitionDuration]);

  const goToStep = useCallback((index: number) => {
    if (index < 0 || index >= steps.length) return;

    setState('transitioning');
    timer.pause();

    setTimeout(() => {
      setCurrentStep(index);
      
      const stepTime = steps[index]?.readingTime ?? 
        calculateReadingTime(steps[index]?.narrative ?? '');
      timer.reset(stepTime);

      setState('reading');
      timer.start();
    }, transitionDuration);
  }, [steps, timer, transitionDuration]);

  const pause = useCallback(() => {
    setState('paused');
    timer.pause();
  }, [timer]);

  const resume = useCallback(() => {
    setState('reading');
    timer.resume();
  }, [timer]);

  const exit = useCallback(() => {
    setState('exiting');
    timer.stop();

    setTimeout(() => {
      setState('idle');
      setCurrentStep(0);
      onComplete?.();
    }, transitionDuration);
  }, [timer, transitionDuration, onComplete]);

  // Keyboard shortcuts
  useEffect(() => {
    if (state === 'idle') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't handle if user is typing
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.key) {
        case ' ':
        case 'ArrowRight':
        case 'Enter':
          e.preventDefault();
          if (state === 'paused') resume();
          else goToNext();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          goBack();
          break;
        case 'Escape':
          e.preventDefault();
          exit();
          break;
        case 'p':
        case 'P':
          e.preventDefault();
          if (state === 'paused') resume();
          else pause();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state, goToNext, goBack, pause, resume, exit]);

  // Auto-start if enabled
  useEffect(() => {
    if (autoStart && state === 'idle' && steps.length > 0) {
      start();
    }
  }, [autoStart, state, steps.length, start]);

  return {
    state,
    currentStep,
    currentStepData,
    totalSteps: steps.length,
    timeRemaining: timer.remaining,
    isPaused: state === 'paused',
    start,
    goToNext,
    goBack,
    pause,
    resume,
    exit,
    goToStep,
  };
}

export default useNarrationController;
