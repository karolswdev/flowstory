import { ReactFlowProvider } from '@xyflow/react';
import type { SpecializedRendererConfig } from '../renderers/specialized';

interface SpecializedRendererProps {
  config: SpecializedRendererConfig;
  story: any;
  currentStepIndex: number;
  onStepChange: (step: number) => void;
}

export function SpecializedRenderer({ config, story, currentStepIndex, onStepChange }: SpecializedRendererProps) {
  const { Canvas, needsReactFlowProvider } = config;

  const content = (
    <div style={{ flex: 1, position: 'relative' }}>
      <Canvas story={story} currentStepIndex={currentStepIndex} onStepChange={onStepChange} />
    </div>
  );

  return needsReactFlowProvider
    ? <ReactFlowProvider key={config.type}>{content}</ReactFlowProvider>
    : content;
}
