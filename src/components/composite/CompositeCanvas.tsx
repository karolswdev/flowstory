import { useMemo } from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import { AnimatePresence, motion } from 'motion/react';
import { RENDERER_MAP, type SpecializedStoryType } from '../../renderers/specialized';
import type { CompositeStory, CompositeVirtualStep } from '../../schemas/composite';
import { StepOverlay } from '../shared';
import './composite.css';

interface CompositeCanvasProps {
  story: CompositeStory;
  currentStepIndex: number;
  onStepChange?: (step: number) => void;
}

export function CompositeCanvas({ story, currentStepIndex, onStepChange }: CompositeCanvasProps) {
  const virtualStep: CompositeVirtualStep | undefined = story.steps[currentStepIndex];
  const sectionIndex = virtualStep?.sectionIndex ?? 0;
  const localStepIndex = virtualStep?.localStepIndex ?? 0;

  const section = story.sections[sectionIndex];
  const rendererType = section?._renderer as SpecializedStoryType;
  const config = rendererType ? RENDERER_MAP[rendererType] : undefined;

  // Build the section story object for the inner canvas
  const sectionStory = useMemo(() => {
    if (!section) return null;
    // Strip internal composite metadata, keep the validated story data
    const { _renderer, _title, _accentColor, ...rest } = section;
    return rest;
  }, [section]);

  if (!config || !sectionStory || !virtualStep) {
    return <div className="composite-canvas">No section data available</div>;
  }

  const { Canvas, needsReactFlowProvider } = config;

  const innerCanvas = (
    <Canvas
      story={sectionStory}
      currentStepIndex={localStepIndex}
      hideOverlay
    />
  );

  return (
    <div className="composite-canvas">
      <AnimatePresence mode="wait">
        <motion.div
          key={sectionIndex}
          className="composite-section"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {needsReactFlowProvider
            ? <ReactFlowProvider key={sectionIndex}>{innerCanvas}</ReactFlowProvider>
            : innerCanvas
          }
        </motion.div>
      </AnimatePresence>

      {/* Section badge — top-left */}
      <div
        className="composite-section-badge"
        style={virtualStep.accentColor ? { borderLeftColor: virtualStep.accentColor } : undefined}
      >
        {virtualStep.sectionTitle}
      </div>

      {/* Unified step overlay */}
      <StepOverlay
        stepIndex={currentStepIndex}
        totalSteps={story.steps.length}
        title={virtualStep.title}
        narrative={virtualStep.narrative}
        narration={virtualStep.narration}
        description={virtualStep.description}
        accentColor={virtualStep.accentColor}
        onStepChange={onStepChange}
        showDots
      />
    </div>
  );
}
