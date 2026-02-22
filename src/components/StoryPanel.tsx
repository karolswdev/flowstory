import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useStory, useCurrentStep } from '../context';
import './StoryPanel.css';

export interface StoryPanelProps {
  /** Show story header with title */
  showHeader?: boolean;
  /** Show next step preview */
  showNextPreview?: boolean;
  /** Show step number badge */
  showStepBadge?: boolean;
  /** Collapsible panel — starts compact, toggle to expand */
  collapsible?: boolean;
}

/**
 * StoryPanel - Displays narrative text for current step
 * Includes animated transitions between steps
 */
export function StoryPanel({
  showHeader = true,
  showNextPreview = true,
  showStepBadge = true,
  collapsible = false,
}: StoryPanelProps) {
  const [expanded, setExpanded] = useState(false);
  const { story, isLoaded } = useStory();
  const { currentStep, currentStepIndex, totalSteps } = useCurrentStep();

  if (!isLoaded || !story) {
    return (
      <div className="story-panel story-panel-empty" data-testid="story-panel">
        <p className="story-panel-message">No story loaded</p>
      </div>
    );
  }

  // Get next step for preview
  const steps = story.steps.sort((a, b) => a.order - b.order);
  const nextStep = currentStepIndex < totalSteps - 1 ? steps[currentStepIndex + 1] : null;

  const isCompact = collapsible && !expanded;
  const panelClass = `story-panel${isCompact ? ' story-panel--compact' : ''}`;

  return (
    <div className={panelClass} data-testid="story-panel">
      {/* Collapse/expand toggle */}
      {collapsible && (
        <button
          className="story-panel-toggle"
          onClick={() => setExpanded(!expanded)}
          aria-label={expanded ? 'Collapse panel' : 'Expand panel'}
          title={expanded ? 'Collapse' : 'Expand'}
        >
          {expanded ? '▾' : '▴'}
        </button>
      )}

      {/* Story header — hidden in compact mode */}
      {showHeader && !isCompact && (
        <header className="story-panel-header" data-testid="story-header">
          <h2 className="story-title" data-testid="story-title">{story.title}</h2>
          <p className="story-description" data-testid="story-description">
            {story.description}
          </p>
          <span className="story-context" data-testid="story-context">
            {story.boundedContext}
          </span>
        </header>
      )}

      {/* Current narrative */}
      <div className="story-narrative" data-testid="story-narrative">
        {showStepBadge && (
          <span className="step-badge" data-testid="step-badge">
            Step {currentStepIndex + 1}
          </span>
        )}

        <AnimatePresence mode="wait">
          <motion.p
            key={currentStep?.id || 'empty'}
            className="narrative-text"
            data-testid="narrative-text"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            {currentStep?.narrative || 'No narrative for this step.'}
          </motion.p>
        </AnimatePresence>
      </div>

      {/* Next step preview — hidden in compact mode */}
      {showNextPreview && !isCompact && nextStep && (
        <div className="story-preview" data-testid="story-preview">
          <span className="preview-label">Coming up:</span>
          <p className="preview-text" data-testid="preview-text">
            {nextStep.narrative}
          </p>
        </div>
      )}

      {/* End of story indicator */}
      {!isCompact && currentStepIndex === totalSteps - 1 && (
        <div className="story-end" data-testid="story-end">
          <span className="end-icon">🎉</span>
          <span className="end-text">End of story</span>
        </div>
      )}
    </div>
  );
}

export default StoryPanel;
