import { useEffect, useState, useCallback } from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import YAML from 'yaml';
import { StoryProvider, useStory } from './context';
import { ThemeProvider } from './themes';
import { StoryCanvas } from './components/StoryCanvas';
import { StoryPanel } from './components/StoryPanel';
import { PlaybackControls } from './components/PlaybackControls';
import { ThemeToggle } from './components/ThemeToggle';
import { ExportButton } from './components/ExportButton';
import { SpecializedRenderer } from './components/SpecializedRenderer';
import { parseStory } from './utils/parser';
import { assignSimplePositions } from './utils/layout/simpleLayout';
import { RENDERER_MAP, type StoryType, type SpecializedStoryType } from './renderers/specialized';
import { EffectsProvider } from './effects';
import { usePresentationMode, useStepNavigation, useShareableUrl } from './hooks';
import { StepProgressDots } from './components/StepProgressDots';
import { KeyboardHelp } from './components/KeyboardHelp';
import './styles/global.css';

// ── URL param helpers ──

function getUrlParams() {
  const params = new URLSearchParams(window.location.search);
  return {
    story: params.get('story'),
    step: params.get('step') ? Number(params.get('step')) : null,
    embed: params.get('embed') === 'true',
  };
}

// ── Detect story type from YAML content ──

function detectStoryType(content: string): StoryType {
  try {
    const parsed = YAML.parse(content);
    const type = parsed?.type || parsed?.renderer;
    if (type && type in RENDERER_MAP) return type as SpecializedStoryType;
  } catch { /* ignore parse errors, fall through */ }
  return 'story-flow';
}

// ── Unified active story state ──

type ActiveStory =
  | { type: 'story-flow' }
  | { type: SpecializedStoryType; story: any; step: number };

// ── Story catalog ──

const STORIES: Record<string, { title: string; category: string; file?: string }> = {
  // User Journey Examples
  'user-registration': {
    title: 'User Registration',
    category: 'User Journeys',
    file: './stories/user-journeys/user-registration.yaml',
  },
  'checkout-flow': {
    title: 'E-commerce Checkout',
    category: 'User Journeys',
    file: './stories/user-journeys/checkout-flow.yaml',
  },
  'password-reset': {
    title: 'Password Reset',
    category: 'User Journeys',
    file: './stories/user-journeys/password-reset.yaml',
  },
  // HTTP Flow Examples
  'http-user-creation': {
    title: 'REST API: Create User',
    category: 'HTTP Flows',
    file: './stories/http/user-creation.yaml',
  },
  // Service Flow Examples
  'service-order-processing': {
    title: 'Microservices: Order Flow',
    category: 'Service Flows',
    file: './stories/service/order-processing.yaml',
  },
  // Pipeline Examples
  'pipeline-cicd': {
    title: 'CI/CD Pipeline',
    category: 'Pipelines',
    file: './stories/pipeline/ci-cd-pipeline.yaml',
  },
  'pipeline-deploy': {
    title: 'CI/CD Deploy',
    category: 'Pipelines',
    file: './stories/pipeline/ci-cd-deploy.yaml',
  },
  // BC Deployment Examples
  'bc-order-service': {
    title: 'Order Service Deployment',
    category: 'BC Deployments',
    file: './stories/bc-deployment/order-service.yaml',
  },
  'bc-api-gateway': {
    title: 'API Gateway Pattern',
    category: 'BC Deployments',
    file: './stories/bc-deployment/api-gateway.yaml',
  },
  // BC Composition Examples
  'bc-composition-order': {
    title: 'Order Service Composition',
    category: 'BC Composition',
    file: './stories/bc-composition/order-service.yaml',
  },
  // Effects Demo
  'effects-demo': {
    title: 'Node Effects Demo',
    category: 'Effects',
    file: './stories/effects-demo.yaml',
  },
  // Executive Pitch Stories
  'pitch-pain': {
    title: 'Translation Layer Pain',
    category: 'Pitch',
    file: './stories/pitch/translation-layer-pain.yaml',
  },
  'pitch-solution': {
    title: 'Event-Driven Solution',
    category: 'Pitch',
    file: './stories/pitch/event-driven-solution.yaml',
  },
  'pitch-roadmap': {
    title: '12-Week Pilot Roadmap',
    category: 'Pitch',
    file: './stories/pitch/migration-phases.yaml',
  },
  // Specialized Renderers
  'adr-timeline': {
    title: 'ADR Timeline',
    category: 'Governance',
    file: './stories/adr-timeline/api-decisions.yaml',
  },
  'c4-context': {
    title: 'C4 Context Diagram',
    category: 'Architecture',
    file: './stories/c4-context/ecommerce-platform.yaml',
  },
  'cloud-cost': {
    title: 'Cloud Cost Review',
    category: 'FinOps',
    file: './stories/cloud-cost/monthly-review.yaml',
  },
  // dependency-graph: removed from MVP catalog (too thin — 136 lines)
  'event-storming': {
    title: 'Event Storming',
    category: 'DDD',
    file: './stories/event-storming/order-domain.yaml',
  },
  // migration-roadmap: removed from MVP catalog (too thin — 97 lines)
  // team-ownership: removed from MVP catalog (too thin — 99 lines)
  'tech-radar': {
    title: 'Tech Radar',
    category: 'Strategy',
    file: './stories/tech-radar/modern-stack.yaml',
  },
  // Catalyst — Trip Operations
  'catalyst-trip-ops-bc-composition': {
    title: 'Trip Ops — BC Composition',
    category: 'Catalyst',
    file: './stories/catalyst/trip-ops-bc-composition.yaml',
  },
  'catalyst-trip-ops-event-storm': {
    title: 'Trip Ops — Domain Event Storm',
    category: 'Catalyst',
    file: './stories/catalyst/trip-ops-event-storm.yaml',
  },
  'catalyst-trip-ops-vr-state-machine': {
    title: 'Trip Ops — VR 16-State Machine',
    category: 'Catalyst',
    file: './stories/catalyst/trip-ops-vr-state-machine.yaml',
  },
  'state-diagram-vr-lifecycle': {
    title: 'VR Lifecycle (State Diagram)',
    category: 'State Diagrams',
    file: './stories/state-diagram/vr-lifecycle.yaml',
  },
  'catalyst-trip-ops-pt-state-machine': {
    title: 'Trip Ops — PT 16-State Machine',
    category: 'Catalyst',
    file: './stories/catalyst/trip-ops-pt-state-machine.yaml',
  },
  'catalyst-trip-ops-driver-offer': {
    title: 'Trip Ops — Driver Offer Workflow',
    category: 'Catalyst',
    file: './stories/catalyst/trip-ops-driver-offer.yaml',
  },
  'catalyst-trip-ops-event-fanout': {
    title: 'Trip Ops — Cross-BC Event Fanout',
    category: 'Catalyst',
    file: './stories/catalyst/trip-ops-event-fanout.yaml',
  },
  'catalyst-trip-ops-self-consumption': {
    title: 'Trip Ops — SignalR Self-Consumption',
    category: 'Catalyst',
    file: './stories/catalyst/trip-ops-self-consumption.yaml',
  },
  'catalyst-trip-ops-dual-pattern': {
    title: 'Trip Ops — Dual CQRS + Conductor',
    category: 'Catalyst',
    file: './stories/catalyst/trip-ops-dual-pattern.yaml',
  },
  'catalyst-trip-ops-sgr-pipeline': {
    title: 'Trip Ops — SGR Nightly Pipeline',
    category: 'Catalyst',
    file: './stories/catalyst/trip-ops-sgr-pipeline.yaml',
  },
};

// ── Story Selector ──

function StorySelector({
  currentStory,
  onStoryChange
}: {
  currentStory: string;
  onStoryChange: (storyId: string) => void;
}) {
  const categories = [...new Set(Object.values(STORIES).map(s => s.category))];

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <label htmlFor="story-select" style={{
        fontSize: '14px',
        fontWeight: 500,
        color: 'var(--color-text-secondary)'
      }}>
        Story:
      </label>
      <select
        id="story-select"
        value={currentStory}
        onChange={(e) => onStoryChange(e.target.value)}
        style={{
          padding: '6px 12px',
          fontSize: '14px',
          borderRadius: '6px',
          border: '1px solid var(--color-surface-border)',
          background: 'var(--color-surface-primary)',
          color: 'var(--color-text-primary)',
          cursor: 'pointer',
          minWidth: '250px',
        }}
      >
        {categories.map(category => (
          <optgroup key={category} label={category}>
            {Object.entries(STORIES)
              .filter(([_, s]) => s.category === category)
              .map(([id, s]) => (
                <option key={id} value={id}>{s.title}</option>
              ))}
          </optgroup>
        ))}
      </select>
    </div>
  );
}

// ── Unified Story Loader ──

function StoryLoader({
  storyId,
  onSpecializedLoad,
}: {
  storyId: string;
  onSpecializedLoad: (story: ActiveStory) => void;
}) {
  const { loadStory, reset } = useStory();

  useEffect(() => {
    const storyData = STORIES[storyId];
    if (!storyData) return;

    const loadFromYaml = (yaml: string) => {
      const storyType = detectStoryType(yaml);

      if (storyType === 'story-flow') {
        // Parse as story-flow (default renderer via StoryContext)
        const { story, validation } = parseStory(yaml);
        if (story && validation.valid) {
          const needsPositions = story.nodes.some(n => !n.position || (n.position.x === 0 && n.position.y === 0));
          if (needsPositions) {
            story.nodes = assignSimplePositions(story.nodes);
          }
          reset();
          onSpecializedLoad({ type: 'story-flow' });
          setTimeout(() => loadStory(story), 50);
        } else {
          console.error('Failed to parse story:', validation.errors);
        }
        return;
      }

      // All specialized renderers go through the registry
      const renderer = RENDERER_MAP[storyType];
      if (!renderer) return;

      try {
        const parsed = YAML.parse(yaml);
        const validated = renderer.schema.parse(parsed);
        reset();
        onSpecializedLoad({ type: storyType, story: validated, step: 0 });
      } catch (err) {
        console.error(`Failed to parse ${storyType} story:`, err);
      }
    };

    if (storyData.file) {
      fetch(storyData.file)
        .then(res => res.text())
        .then(loadFromYaml)
        .catch(err => console.error('Failed to load story file:', err));
    }
  }, [storyId, loadStory, reset, onSpecializedLoad]);

  return null;
}

// ── Main App ──

function App() {
  const urlParams = getUrlParams();

  const getInitialStory = () => {
    return urlParams.story && STORIES[urlParams.story] ? urlParams.story : 'user-registration';
  };

  const [currentStory, setCurrentStory] = useState(getInitialStory);
  const [activeStory, setActiveStory] = useState<ActiveStory>({ type: 'story-flow' });
  const [isEmbed] = useState(urlParams.embed);
  const [initialStep] = useState(urlParams.step);

  // Presentation mode
  const { isPresenting, togglePresentation } = usePresentationMode();

  // Unified step change — also update URL param
  const handleStepChange = useCallback((step: number) => {
    setActiveStory(prev => {
      if (prev.type === 'story-flow') return prev;
      const url = new URL(window.location.href);
      url.searchParams.set('step', String(step));
      window.history.replaceState({}, '', url.toString());
      return { ...prev, step };
    });
  }, []);

  // Step info for keyboard navigation + progress dots
  const stepInfo = activeStory.type !== 'story-flow'
    ? { step: activeStory.step, total: activeStory.story.steps.length }
    : null;

  // Keyboard navigation for all specialized canvases
  useStepNavigation({
    currentStep: stepInfo?.step ?? 0,
    totalSteps: stepInfo?.total ?? 1,
    onStepChange: handleStepChange,
    enabled: stepInfo !== null,
  });

  // Shareable URL
  const { copyUrl, copied } = useShareableUrl(currentStory, stepInfo?.step ?? 0);

  // Reset state when switching stories
  const handleStoryChange = useCallback((storyId: string) => {
    setCurrentStory(storyId);
    setActiveStory({ type: 'story-flow' });
    const url = new URL(window.location.href);
    url.searchParams.set('story', storyId);
    window.history.replaceState({}, '', url.toString());
  }, []);

  // Stable callback for StoryLoader — apply initial step from URL if present
  const handleSpecializedLoad = useCallback((story: ActiveStory) => {
    if (initialStep !== null && story.type !== 'story-flow') {
      const maxStep = story.story.steps.length - 1;
      setActiveStory({ ...story, step: Math.min(initialStep, maxStep) });
    } else {
      setActiveStory(story);
    }
  }, [initialStep]);

  const isSpecialized = activeStory.type !== 'story-flow';

  return (
    <div className="app" style={{
      width: '100vw',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--color-bg-primary)',
    }}>
      {/* Toolbar - hidden in presentation mode and embed mode */}
      {!isEmbed && (
        <header className="app-toolbar" data-testid="app-toolbar" data-hide-in-presentation style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '8px 16px',
          borderBottom: '1px solid var(--color-surface-border)',
          background: 'var(--color-surface-primary)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <h1 style={{
              margin: 0,
              fontSize: '18px',
              fontWeight: 600,
              color: 'var(--color-text-primary)'
            }}>
              FlowStory
            </h1>
            <StorySelector currentStory={currentStory} onStoryChange={handleStoryChange} />
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }} data-hide-in-presentation>
            <button
              onClick={copyUrl}
              style={{
                padding: '8px 16px',
                background: copied ? 'var(--color-success)' : 'var(--color-bg-secondary)',
                color: copied ? 'var(--color-text-inverse)' : 'var(--color-text)',
                border: '1px solid var(--color-border)',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 500,
                transition: 'background-color 200ms ease-out, color 200ms ease-out',
              }}
              title="Copy shareable link to clipboard"
            >
              {copied ? 'Copied!' : 'Share Link'}
            </button>
            <ExportButton showLabels />
            <button
              onClick={togglePresentation}
              style={{
                padding: '8px 16px',
                background: 'var(--color-primary)',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 500,
              }}
              title="Press P to present, ESC to exit"
            >
              {isPresenting ? 'Exit (ESC)' : 'Present (P)'}
            </button>
            <ThemeToggle showLabel />
          </div>
        </header>
      )}

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <StoryLoader
          storyId={currentStory}
          onSpecializedLoad={handleSpecializedLoad}
        />

        {isSpecialized ? (
          <SpecializedRenderer
            config={RENDERER_MAP[activeStory.type]}
            story={activeStory.story}
            currentStepIndex={activeStory.step}
            onStepChange={handleStepChange}
          />
        ) : (
          <>
            <StoryCanvas showMinimap showControls showBackground showNavigation={false} useNewLayout />
            <StoryPanel showHeader showNextPreview showStepBadge collapsible />
            <PlaybackControls showHints />
          </>
        )}

        {/* Step progress dots for specialized canvases in presentation mode */}
        {isPresenting && stepInfo && (
          <StepProgressDots
            currentStep={stepInfo.step}
            totalSteps={stepInfo.total}
            onStepClick={handleStepChange}
          />
        )}

        {/* Keyboard help overlay (press ? to toggle) */}
        <KeyboardHelp enabled={true} />
      </main>
    </div>
  );
}

function AppWrapper() {
  return (
    <ThemeProvider defaultTheme="light">
      <EffectsProvider>
        <ReactFlowProvider>
          <StoryProvider>
            <App />
          </StoryProvider>
        </ReactFlowProvider>
      </EffectsProvider>
    </ThemeProvider>
  );
}

export default AppWrapper;
