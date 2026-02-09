import { useEffect, useCallback, type ChangeEvent } from 'react';
import { usePlayback, useStoryNavigation } from '../context';
import './PlaybackControls.css';

export interface PlaybackControlsProps {
  /** Show keyboard shortcut hints */
  showHints?: boolean;
}

/**
 * PlaybackControls - Full playback control bar
 * Includes play/pause, step buttons, progress slider, and keyboard shortcuts
 */
export function PlaybackControls({ showHints = false }: PlaybackControlsProps) {
  const { isPlaying, canPlay, currentStepIndex, totalSteps, togglePlay, goToStep, reset } = usePlayback();
  const { canGoNext, canGoPrev, nextStep, prevStep } = useStoryNavigation();

  // Keyboard shortcuts
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Don't trigger if user is typing in an input
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
      return;
    }

    switch (e.code) {
      case 'Space':
        e.preventDefault();
        togglePlay();
        break;
      case 'ArrowRight':
        e.preventDefault();
        if (canGoNext) nextStep();
        break;
      case 'ArrowLeft':
        e.preventDefault();
        if (canGoPrev) prevStep();
        break;
      case 'Home':
        e.preventDefault();
        reset();
        break;
      case 'End':
        e.preventDefault();
        goToStep(totalSteps - 1);
        break;
    }
  }, [togglePlay, nextStep, prevStep, canGoNext, canGoPrev, reset, goToStep, totalSteps]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const handleSliderChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    goToStep(value);
  };

  const progress = totalSteps > 1 ? (currentStepIndex / (totalSteps - 1)) * 100 : 0;

  return (
    <div className="playback-controls" data-testid="playback-controls">
      <div className="playback-buttons">
        {/* Reset button */}
        <button
          onClick={reset}
          className="playback-button"
          data-testid="reset-button"
          aria-label="Reset to beginning"
          title="Reset (Home)"
        >
          ⏮
        </button>

        {/* Previous step */}
        <button
          onClick={prevStep}
          disabled={!canGoPrev}
          className="playback-button"
          data-testid="prev-button"
          aria-label="Previous step"
          title="Previous (←)"
        >
          ⏪
        </button>

        {/* Play/Pause */}
        <button
          onClick={togglePlay}
          disabled={!canPlay}
          className="playback-button playback-button-primary"
          data-testid="play-pause-button"
          aria-label={isPlaying ? 'Pause' : 'Play'}
          title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
        >
          {isPlaying ? '⏸' : '▶'}
        </button>

        {/* Next step */}
        <button
          onClick={nextStep}
          disabled={!canGoNext}
          className="playback-button"
          data-testid="next-button"
          aria-label="Next step"
          title="Next (→)"
        >
          ⏩
        </button>

        {/* Go to end */}
        <button
          onClick={() => goToStep(totalSteps - 1)}
          disabled={currentStepIndex >= totalSteps - 1}
          className="playback-button"
          data-testid="end-button"
          aria-label="Go to end"
          title="End (End)"
        >
          ⏭
        </button>
      </div>

      {/* Progress slider */}
      <div className="playback-progress">
        <input
          type="range"
          min={0}
          max={Math.max(0, totalSteps - 1)}
          value={currentStepIndex}
          onChange={handleSliderChange}
          className="progress-slider"
          data-testid="progress-slider"
          aria-label="Story progress"
        />
        <div 
          className="progress-fill" 
          style={{ width: `${progress}%` }}
          data-testid="progress-fill"
        />
      </div>

      {/* Step counter */}
      <div className="playback-info">
        <span className="step-counter" data-testid="step-counter">
          {currentStepIndex + 1} / {totalSteps}
        </span>
        {showHints && (
          <span className="keyboard-hints">
            Space: Play/Pause | ←→: Step | Home/End: Jump
          </span>
        )}
      </div>
    </div>
  );
}

export default PlaybackControls;
