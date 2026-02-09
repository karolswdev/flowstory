import { useEffect, useMemo } from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import { StoryProvider, useStory, useCurrentStep, useStoryNavigation, usePlayback } from '../context';
import { ThemeProvider, type Theme } from '../themes';
import { StoryPanel } from './StoryPanel';
import { PlaybackControls } from './PlaybackControls';
import { ThemeToggle } from './ThemeToggle';
import { ExportButton } from './ExportButton';
import { parseStory } from '../utils/parser';
import { getRenderer, getDefaultRendererId, FlowRenderer } from '../renderers';
import type { UserStory, ValidationResult } from '../types/story';
import type { StoryRenderer, CanvasProps, PanelProps, ControlsProps } from '../types/renderer';
import '../styles/global.css';

/** Props for the UserStoryViewer component */
export interface UserStoryViewerProps {
  /** Story data - either a UserStory object or YAML string */
  story: UserStory | string;
  /**
   * Renderer to use
   * - String: ID of registered renderer (default: 'flow')
   * - Object: Custom StoryRenderer instance
   */
  renderer?: string | StoryRenderer;
  /** Initial theme (default: 'light') */
  theme?: Theme;
  /** Show the toolbar with export/theme controls (default: true) */
  showToolbar?: boolean;
  /** Show the story panel with narrative (default: true) */
  showPanel?: boolean;
  /** Show playback controls (default: true) */
  showPlaybackControls?: boolean;
  /** Show minimap (default: true) */
  showMinimap?: boolean;
  /** Show zoom controls (default: true) */
  showControls?: boolean;
  /** Show background grid (default: true) */
  showBackground?: boolean;
  /** Show export button in toolbar (default: true) */
  showExport?: boolean;
  /** Show theme toggle in toolbar (default: true) */
  showThemeToggle?: boolean;
  /** Custom class name */
  className?: string;
  /** Callback when story loads */
  onStoryLoad?: (story: UserStory) => void;
  /** Callback when step changes */
  onStepChange?: (stepIndex: number) => void;
  /** Callback when parsing error occurs */
  onError?: (error: string) => void;
  /** Callback when renderer validation completes */
  onRendererValidation?: (result: ValidationResult) => void;
}

/**
 * Resolve renderer from prop value
 */
function resolveRenderer(rendererProp: string | StoryRenderer | undefined): StoryRenderer {
  // Default to flow renderer
  if (!rendererProp) {
    return getRenderer(getDefaultRendererId()) ?? FlowRenderer;
  }
  
  // If string, look up in registry
  if (typeof rendererProp === 'string') {
    const registered = getRenderer(rendererProp);
    if (!registered) {
      console.warn(`Renderer '${rendererProp}' not found, using '${getDefaultRendererId()}'`);
      return getRenderer(getDefaultRendererId()) ?? FlowRenderer;
    }
    return registered;
  }
  
  // If object, use directly
  return rendererProp;
}

/** Internal story loader component */
function StoryLoader({ 
  story, 
  renderer,
  onStoryLoad, 
  onError,
  onRendererValidation,
}: { 
  story: UserStory | string;
  renderer: StoryRenderer;
  onStoryLoad?: (story: UserStory) => void;
  onError?: (error: string) => void;
  onRendererValidation?: (result: ValidationResult) => void;
}) {
  const { loadStory, isLoaded, error } = useStory();

  useEffect(() => {
    if (!isLoaded) {
      let parsedStory: UserStory | null = null;

      if (typeof story === 'string') {
        // Parse YAML string
        const { story: parsed, validation } = parseStory(story);
        if (parsed && validation.valid) {
          parsedStory = parsed;
        } else {
          const errorMsg = validation.errors.join(', ');
          console.error('Failed to parse story:', errorMsg);
          onError?.(errorMsg);
          return;
        }
      } else {
        // Already a UserStory object
        parsedStory = story;
      }

      if (parsedStory) {
        // Run renderer validation if available
        if (renderer.validateStory) {
          const validationResult = renderer.validateStory(parsedStory);
          onRendererValidation?.(validationResult);
          if (!validationResult.valid) {
            console.warn('Renderer validation warnings:', validationResult.errors);
          }
        }

        // Preprocess story if renderer has a prepareStory function
        const processedStory = renderer.prepareStory 
          ? renderer.prepareStory(parsedStory) 
          : parsedStory;

        loadStory(processedStory);
        onStoryLoad?.(processedStory);
      }
    }
  }, [story, renderer, isLoaded, loadStory, onStoryLoad, onError, onRendererValidation]);

  useEffect(() => {
    if (error) {
      onError?.(error);
    }
  }, [error, onError]);

  return null;
}

/** Step change notifier component */
function StepChangeNotifier({ 
  onStepChange 
}: { 
  onStepChange?: (stepIndex: number) => void;
}) {
  const { currentStepIndex } = useStory();

  useEffect(() => {
    onStepChange?.(currentStepIndex);
  }, [currentStepIndex, onStepChange]);

  return null;
}

/** Renderer canvas wrapper - gets state from context and passes to renderer */
function RendererCanvas({
  renderer,
  showMinimap,
  showControls,
  showBackground,
}: {
  renderer: StoryRenderer;
  showMinimap: boolean;
  showControls: boolean;
  showBackground: boolean;
}) {
  const { story, activeNodeIds, activeEdgeIds, completedNodeIds, completedEdgeIds, isLoaded, error } = useStory();

  if (error) {
    return (
      <div className="story-canvas story-canvas-error" data-testid="story-canvas-error">
        <p>Error: {error}</p>
      </div>
    );
  }

  if (!isLoaded || !story) {
    return (
      <div className="story-canvas story-canvas-empty" data-testid="story-canvas-empty">
        <p>No story loaded</p>
      </div>
    );
  }

  const CanvasComponent = renderer.Canvas;
  const canvasProps: CanvasProps = {
    story,
    activeNodeIds,
    activeEdgeIds,
    completedNodeIds,
    completedEdgeIds,
    showMinimap,
    showControls,
    showBackground,
  };

  return (
    <div className="story-canvas" data-testid="story-canvas">
      <div className="story-canvas-flow">
        <CanvasComponent {...canvasProps} />
      </div>
    </div>
  );
}

/** Renderer panel wrapper - uses renderer's Panel or default */
function RendererPanel({
  renderer,
  showHeader,
  showNextPreview,
  showStepBadge,
}: {
  renderer: StoryRenderer;
  showHeader: boolean;
  showNextPreview: boolean;
  showStepBadge: boolean;
}) {
  const { story } = useStory();
  const currentStep = useCurrentStep();
  const { currentStepIndex, totalSteps } = useStoryNavigation();

  if (!story) return null;

  // Use renderer's Panel or default StoryPanel
  const PanelComponent = renderer.Panel ?? StoryPanel;
  
  // If using default StoryPanel, pass its expected props
  if (PanelComponent === StoryPanel) {
    return (
      <StoryPanel 
        showHeader={showHeader}
        showNextPreview={showNextPreview}
        showStepBadge={showStepBadge}
      />
    );
  }

  // For custom panel, pass PanelProps
  const panelProps: PanelProps = {
    story,
    currentStep,
    currentStepIndex,
    totalSteps,
    showHeader,
    showNextPreview,
    showStepBadge,
  };

  return <PanelComponent {...panelProps} />;
}

/** Renderer controls wrapper - uses renderer's Controls or default */
function RendererControls({
  renderer,
  showHints,
}: {
  renderer: StoryRenderer;
  showHints: boolean;
}) {
  const { currentStepIndex, totalSteps, nextStep, prevStep, canGoNext, canGoPrev, goToStep, reset } = useStoryNavigation();
  const { isPlaying, play, pause, togglePlay } = usePlayback();

  // Use renderer's Controls or default PlaybackControls
  const ControlsComponent = renderer.Controls ?? PlaybackControls;
  
  // If using default PlaybackControls, pass its expected props
  if (ControlsComponent === PlaybackControls) {
    return <PlaybackControls showHints={showHints} />;
  }

  // For custom controls, pass ControlsProps
  const controlsProps: ControlsProps = {
    isPlaying,
    canGoNext,
    canGoPrev,
    currentStepIndex,
    totalSteps,
    onPlay: play,
    onPause: pause,
    onToggle: togglePlay,
    onNext: nextStep,
    onPrev: prevStep,
    onReset: reset,
    onEnd: () => goToStep(totalSteps - 1),
    onSeek: goToStep,
    showHints,
  };

  return <ControlsComponent {...controlsProps} />;
}

/**
 * Main UserStoryViewer component
 * 
 * A complete, self-contained component for rendering interactive user story visualizations.
 * Supports multiple renderers through the `renderer` prop.
 * 
 * @example
 * ```tsx
 * // Default FlowRenderer
 * <UserStoryViewer story={yamlString} />
 * 
 * // Explicit renderer by ID
 * <UserStoryViewer story={yamlString} renderer="architectural" />
 * 
 * // Custom renderer instance
 * <UserStoryViewer story={yamlString} renderer={MyCustomRenderer} />
 * 
 * // With options
 * <UserStoryViewer 
 *   story={story}
 *   renderer="flow"
 *   theme="dark"
 *   showToolbar={false}
 * />
 * ```
 */
export function UserStoryViewer({
  story,
  renderer: rendererProp,
  theme = 'light',
  showToolbar = true,
  showPanel = true,
  showPlaybackControls = true,
  showMinimap = true,
  showControls = true,
  showBackground = true,
  showExport = true,
  showThemeToggle = true,
  className = '',
  onStoryLoad,
  onStepChange,
  onError,
  onRendererValidation,
}: UserStoryViewerProps) {
  // Resolve renderer once
  const renderer = useMemo(
    () => resolveRenderer(rendererProp),
    [rendererProp]
  );

  return (
    <ThemeProvider defaultTheme={theme}>
      <ReactFlowProvider>
        <StoryProvider>
          <div 
            className={`user-story-viewer ${className}`}
            data-testid="user-story-viewer"
            data-renderer={renderer.id}
            style={{ 
              width: '100%', 
              height: '100%', 
              display: 'flex', 
              flexDirection: 'column',
              background: 'var(--color-bg-primary)',
            }}
          >
            <StoryLoader 
              story={story}
              renderer={renderer}
              onStoryLoad={onStoryLoad}
              onError={onError}
              onRendererValidation={onRendererValidation}
            />
            <StepChangeNotifier onStepChange={onStepChange} />

            {showToolbar && (
              <header 
                className="user-story-viewer-toolbar"
                data-testid="viewer-toolbar"
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '8px 16px',
                  borderBottom: '1px solid var(--color-surface-border)',
                  background: 'var(--color-surface-primary)',
                }}
              >
                {showExport && <ExportButton showLabels />}
                {showThemeToggle && <ThemeToggle showLabel />}
              </header>
            )}

            <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
              <RendererCanvas
                renderer={renderer}
                showMinimap={showMinimap}
                showControls={showControls}
                showBackground={showBackground}
              />
              {showPanel && (
                <RendererPanel
                  renderer={renderer}
                  showHeader
                  showNextPreview
                  showStepBadge
                />
              )}
              {showPlaybackControls && (
                <RendererControls
                  renderer={renderer}
                  showHints
                />
              )}
            </main>
          </div>
        </StoryProvider>
      </ReactFlowProvider>
    </ThemeProvider>
  );
}

export default UserStoryViewer;
