import { useEffect, useCallback } from 'react';

export interface StepNavigationConfig {
  /** Current step index */
  currentStep: number;
  /** Total number of steps */
  totalSteps: number;
  /** Callback to change step */
  onStepChange: (step: number) => void;
  /** Whether keyboard navigation is enabled */
  enabled?: boolean;
}

/**
 * Hook for keyboard-based step navigation
 * 
 * Keyboard shortcuts:
 * - → or Space: Next step
 * - ←: Previous step
 * - Home: First step
 * - End: Last step
 * 
 * @example
 * useStepNavigation({
 *   currentStep,
 *   totalSteps: story.steps.length,
 *   onStepChange: setCurrentStep,
 *   enabled: isPresenting,
 * });
 */
export function useStepNavigation({
  currentStep,
  totalSteps,
  onStepChange,
  enabled = true,
}: StepNavigationConfig): void {
  const goNext = useCallback(() => {
    if (currentStep < totalSteps - 1) {
      onStepChange(currentStep + 1);
    }
  }, [currentStep, totalSteps, onStepChange]);

  const goPrevious = useCallback(() => {
    if (currentStep > 0) {
      onStepChange(currentStep - 1);
    }
  }, [currentStep, onStepChange]);

  const goFirst = useCallback(() => {
    onStepChange(0);
  }, [onStepChange]);

  const goLast = useCallback(() => {
    onStepChange(totalSteps - 1);
  }, [totalSteps, onStepChange]);

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.key) {
        case 'ArrowRight':
        case ' ': // Space
          e.preventDefault();
          goNext();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          goPrevious();
          break;
        case 'Home':
          e.preventDefault();
          goFirst();
          break;
        case 'End':
          e.preventDefault();
          goLast();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [enabled, goNext, goPrevious, goFirst, goLast]);
}

export default useStepNavigation;
