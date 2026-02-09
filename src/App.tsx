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
import { parseStory } from './utils/parser';
import { assignSimplePositions } from './utils/layout/simpleLayout';
import { BCDeploymentCanvas } from './components/bc-deployment';
import { validateBCDeploymentStory, type BCDeploymentStory } from './schemas/bc-deployment';
import './styles/global.css';

/** Detect story type from YAML content */
function detectStoryType(content: string): 'bc-deployment' | 'story-flow' {
  try {
    const parsed = YAML.parse(content);
    if (parsed?.type === 'bc-deployment') return 'bc-deployment';
  } catch { /* ignore parse errors, fall through */ }
  return 'story-flow';
}

// All available stories
const STORIES: Record<string, { title: string; category: string; yaml?: string; file?: string }> = {
  // User Journey Examples
  'user-registration': {
    title: 'User Registration',
    category: 'User Journeys',
    yaml: `
id: user-registration
title: User Registration Flow
description: New user signs up for an account
version: "1.0"

actors:
  - id: user
    name: New User
    type: user
    avatar: "👤"
    color: "#4CAF50"

nodes:
  - id: user-actor
    type: actor
    actorId: user
    label: New User
    position: { x: 50, y: 200 }
  - id: visit-site
    type: action
    actorId: user
    label: Visits Website
    position: { x: 200, y: 200 }
  - id: click-signup
    type: action
    actorId: user
    label: Clicks Sign Up
    position: { x: 350, y: 200 }
  - id: enter-details
    type: action
    actorId: user
    label: Enters Details
    description: Email, password, name
    position: { x: 500, y: 200 }
  - id: validate-form
    type: system
    label: Validate Form
    position: { x: 650, y: 150 }
  - id: create-account
    type: system
    label: Create Account
    position: { x: 800, y: 150 }
  - id: account-created-event
    type: event
    label: AccountCreatedEvent
    position: { x: 800, y: 300 }
  - id: send-welcome-email
    type: system
    label: Send Welcome Email
    position: { x: 950, y: 300 }
  - id: redirect-dashboard
    type: action
    actorId: user
    label: Sees Dashboard
    position: { x: 950, y: 150 }
  - id: success
    type: state
    label: Registration Complete
    position: { x: 1100, y: 200 }
    data:
      variant: success

edges:
  - { id: e1, source: user-actor, target: visit-site, type: flow }
  - { id: e2, source: visit-site, target: click-signup, type: flow }
  - { id: e3, source: click-signup, target: enter-details, type: flow }
  - { id: e4, source: enter-details, target: validate-form, type: flow }
  - { id: e5, source: validate-form, target: create-account, type: flow }
  - { id: e6, source: create-account, target: account-created-event, type: event, label: publishes }
  - { id: e7, source: create-account, target: redirect-dashboard, type: flow }
  - { id: e8, source: account-created-event, target: send-welcome-email, type: async }
  - { id: e9, source: redirect-dashboard, target: success, type: flow }

steps:
  - id: step-1
    order: 1
    nodeIds: [user-actor]
    edgeIds: []
    narrative: "Meet Alex, a new user who wants to create an account."
    duration: 2500
  - id: step-2
    order: 2
    nodeIds: [user-actor, visit-site, click-signup]
    edgeIds: [e1, e2]
    narrative: "Alex visits the website and clicks the Sign Up button."
    duration: 2500
  - id: step-3
    order: 3
    nodeIds: [click-signup, enter-details, validate-form]
    edgeIds: [e3, e4]
    narrative: "Alex fills in their email, password, and name. The form validates the input."
    duration: 3000
  - id: step-4
    order: 4
    nodeIds: [validate-form, create-account, account-created-event]
    edgeIds: [e5, e6]
    narrative: "The system creates the account and publishes an AccountCreatedEvent."
    duration: 2500
  - id: step-5
    order: 5
    nodeIds: [account-created-event, send-welcome-email, redirect-dashboard, success]
    edgeIds: [e7, e8, e9]
    narrative: "Alex sees their new dashboard. A welcome email is sent in the background."
    duration: 3000
`
  },
  'checkout-flow': {
    title: 'E-commerce Checkout',
    category: 'User Journeys',
    yaml: `
id: checkout-flow
title: E-commerce Checkout Flow
description: Customer completes a purchase
version: "1.0"

actors:
  - id: customer
    name: Customer
    type: user
    avatar: "🛒"
    color: "#2196F3"

nodes:
  - id: customer-actor
    type: actor
    actorId: customer
    label: Customer
    position: { x: 50, y: 200 }
  - id: view-cart
    type: action
    actorId: customer
    label: Views Cart
    position: { x: 200, y: 200 }
  - id: click-checkout
    type: action
    actorId: customer
    label: Clicks Checkout
    position: { x: 350, y: 200 }
  - id: enter-shipping
    type: action
    actorId: customer
    label: Enters Shipping
    position: { x: 500, y: 200 }
  - id: enter-payment
    type: action
    actorId: customer
    label: Enters Payment
    position: { x: 650, y: 200 }
  - id: process-payment
    type: system
    label: Process Payment
    position: { x: 800, y: 150 }
  - id: decision-approved
    type: decision
    label: Payment OK?
    position: { x: 950, y: 180 }
  - id: create-order
    type: system
    label: Create Order
    position: { x: 1100, y: 100 }
  - id: order-created-event
    type: event
    label: OrderCreatedEvent
    position: { x: 1100, y: 220 }
  - id: send-confirmation
    type: system
    label: Send Confirmation
    position: { x: 1250, y: 220 }
  - id: show-confirmation
    type: action
    actorId: customer
    label: Sees Confirmation
    position: { x: 1250, y: 100 }
  - id: order-complete
    type: state
    label: Order Complete
    position: { x: 1400, y: 150 }
    data:
      variant: success
  - id: payment-failed
    type: state
    label: Payment Failed
    position: { x: 1100, y: 280 }
    data:
      variant: error

edges:
  - { id: e1, source: customer-actor, target: view-cart, type: flow }
  - { id: e2, source: view-cart, target: click-checkout, type: flow }
  - { id: e3, source: click-checkout, target: enter-shipping, type: flow }
  - { id: e4, source: enter-shipping, target: enter-payment, type: flow }
  - { id: e5, source: enter-payment, target: process-payment, type: flow }
  - { id: e6, source: process-payment, target: decision-approved, type: flow }
  - { id: e7, source: decision-approved, target: create-order, type: flow, label: "Yes" }
  - { id: e8, source: decision-approved, target: payment-failed, type: error, label: "No" }
  - { id: e9, source: create-order, target: order-created-event, type: event }
  - { id: e10, source: create-order, target: show-confirmation, type: flow }
  - { id: e11, source: order-created-event, target: send-confirmation, type: async }
  - { id: e12, source: show-confirmation, target: order-complete, type: flow }

steps:
  - id: step-1
    order: 1
    nodeIds: [customer-actor, view-cart]
    edgeIds: [e1]
    narrative: "Sarah reviews her shopping cart with 3 items totaling $79.99."
    duration: 2500
  - id: step-2
    order: 2
    nodeIds: [view-cart, click-checkout, enter-shipping]
    edgeIds: [e2, e3]
    narrative: "She proceeds to checkout and enters her shipping address."
    duration: 2500
  - id: step-3
    order: 3
    nodeIds: [enter-shipping, enter-payment, process-payment]
    edgeIds: [e4, e5]
    narrative: "She enters her credit card details. The payment gateway processes the charge."
    duration: 3000
  - id: step-4
    order: 4
    nodeIds: [process-payment, decision-approved, create-order, order-created-event]
    edgeIds: [e6, e7, e9]
    narrative: "Payment approved! An order is created and OrderCreatedEvent is published."
    duration: 3000
  - id: step-5
    order: 5
    nodeIds: [create-order, show-confirmation, order-complete, send-confirmation]
    edgeIds: [e10, e11, e12]
    narrative: "Sarah sees her order confirmation. An email receipt is sent automatically."
    duration: 3000
`
  },
  'password-reset': {
    title: 'Password Reset',
    category: 'User Journeys',
    yaml: `
id: password-reset
title: Password Reset Flow
description: User resets their forgotten password
version: "1.0"

actors:
  - id: user
    name: User
    type: user
    avatar: "🔐"
    color: "#FF9800"

nodes:
  - id: user-actor
    type: actor
    actorId: user
    label: User
    position: { x: 50, y: 200 }
  - id: click-forgot
    type: action
    actorId: user
    label: Clicks Forgot Password
    position: { x: 200, y: 200 }
  - id: enter-email
    type: action
    actorId: user
    label: Enters Email
    position: { x: 350, y: 200 }
  - id: generate-token
    type: system
    label: Generate Reset Token
    position: { x: 500, y: 150 }
  - id: send-email
    type: system
    label: Send Reset Email
    position: { x: 650, y: 150 }
  - id: email-sent-event
    type: event
    label: ResetEmailSentEvent
    position: { x: 650, y: 280 }
  - id: check-inbox
    type: action
    actorId: user
    label: Checks Email
    position: { x: 800, y: 200 }
  - id: click-link
    type: action
    actorId: user
    label: Clicks Reset Link
    position: { x: 950, y: 200 }
  - id: enter-new-password
    type: action
    actorId: user
    label: Enters New Password
    position: { x: 1100, y: 200 }
  - id: update-password
    type: system
    label: Update Password
    position: { x: 1250, y: 150 }
  - id: password-changed-event
    type: event
    label: PasswordChangedEvent
    position: { x: 1250, y: 280 }
  - id: success
    type: state
    label: Password Reset
    position: { x: 1400, y: 200 }
    data:
      variant: success

edges:
  - { id: e1, source: user-actor, target: click-forgot, type: flow }
  - { id: e2, source: click-forgot, target: enter-email, type: flow }
  - { id: e3, source: enter-email, target: generate-token, type: flow }
  - { id: e4, source: generate-token, target: send-email, type: flow }
  - { id: e5, source: send-email, target: email-sent-event, type: event }
  - { id: e6, source: send-email, target: check-inbox, type: async, label: waits for }
  - { id: e7, source: check-inbox, target: click-link, type: flow }
  - { id: e8, source: click-link, target: enter-new-password, type: flow }
  - { id: e9, source: enter-new-password, target: update-password, type: flow }
  - { id: e10, source: update-password, target: password-changed-event, type: event }
  - { id: e11, source: update-password, target: success, type: flow }

steps:
  - id: step-1
    order: 1
    nodeIds: [user-actor, click-forgot, enter-email]
    edgeIds: [e1, e2]
    narrative: "User forgot their password. They click 'Forgot Password' and enter their email."
    duration: 2500
  - id: step-2
    order: 2
    nodeIds: [enter-email, generate-token, send-email, email-sent-event]
    edgeIds: [e3, e4, e5]
    narrative: "The system generates a secure reset token and sends an email."
    duration: 3000
  - id: step-3
    order: 3
    nodeIds: [send-email, check-inbox, click-link]
    edgeIds: [e6, e7]
    narrative: "User checks their inbox and clicks the reset link."
    duration: 2500
  - id: step-4
    order: 4
    nodeIds: [click-link, enter-new-password, update-password, password-changed-event, success]
    edgeIds: [e8, e9, e10, e11]
    narrative: "They enter a new password. Account updated! Password reset complete."
    duration: 3000
`
  },
  // HTTP Flow Examples
  'http-user-creation': {
    title: 'REST API: Create User',
    category: 'HTTP Flows',
    yaml: '',
    file: '/stories/http/user-creation.yaml'
  },
  // Service Flow Examples  
  'service-order-processing': {
    title: 'Microservices: Order Flow',
    category: 'Service Flows',
    yaml: '',
    file: '/stories/service/order-processing.yaml'
  },
  // Pipeline Examples
  'pipeline-cicd': {
    title: 'CI/CD Pipeline',
    category: 'Pipelines',
    yaml: '',
    file: '/stories/pipeline/ci-cd-deploy.yaml'
  },
  // BC Deployment Examples
  'bc-order-service': {
    title: 'Order Service Deployment',
    category: 'BC Deployments',
    yaml: '',
    file: '/stories/bc-deployment/order-service.yaml'
  },
  'bc-api-gateway': {
    title: 'API Gateway Pattern',
    category: 'BC Deployments',
    yaml: '',
    file: '/stories/bc-deployment/api-gateway.yaml'
  }
};

/** Story selector component */
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

/** Story loader component - handles both story-flow and bc-deployment */
function StoryLoader({ 
  storyId, 
  onBCDeploymentLoad 
}: { 
  storyId: string;
  onBCDeploymentLoad?: (story: BCDeploymentStory | null) => void;
}) {
  const { loadStory, reset } = useStory();

  useEffect(() => {
    const storyData = STORIES[storyId];
    if (!storyData) return;

    const loadFromYaml = (yaml: string) => {
      const storyType = detectStoryType(yaml);
      
      if (storyType === 'bc-deployment') {
        // Parse as BC Deployment
        try {
          const parsed = YAML.parse(yaml);
          const bcStory = validateBCDeploymentStory(parsed);
          reset();
          onBCDeploymentLoad?.(bcStory);
        } catch (err) {
          console.error('Failed to parse BC Deployment story:', err);
          onBCDeploymentLoad?.(null);
        }
      } else {
        // Parse as story-flow
        onBCDeploymentLoad?.(null);
        const { story, validation } = parseStory(yaml);
        if (story && validation.valid) {
          // Auto-assign positions if nodes don't have them
          const needsPositions = story.nodes.some(n => !n.position || (n.position.x === 0 && n.position.y === 0));
          if (needsPositions) {
            story.nodes = assignSimplePositions(story.nodes);
          }
          reset();
          setTimeout(() => loadStory(story), 50);
        } else {
          console.error('Failed to parse story:', validation.errors);
        }
      }
    };

    // If story has a file path, fetch it; otherwise use inline yaml
    if (storyData.file) {
      fetch(storyData.file)
        .then(res => res.text())
        .then(loadFromYaml)
        .catch(err => console.error('Failed to load story file:', err));
    } else if (storyData.yaml) {
      loadFromYaml(storyData.yaml);
    }
  }, [storyId, loadStory, reset, onBCDeploymentLoad]);

  return null;
}

function App() {
  // Read initial story from URL or default
  const getInitialStory = () => {
    const params = new URLSearchParams(window.location.search);
    const storyParam = params.get('story');
    const story = storyParam && STORIES[storyParam] ? storyParam : 'user-registration';
    console.log('[FlowStory] Initial story from URL:', storyParam, '-> Using:', story);
    return story;
  };

  const [currentStory, setCurrentStory] = useState(getInitialStory);
  const [bcDeploymentStory, setBCDeploymentStory] = useState<BCDeploymentStory | null>(null);
  const [bcDeploymentStep, setBCDeploymentStep] = useState(0);

  // Reset BC Deployment state when story changes
  const handleStoryChange = useCallback((storyId: string) => {
    setCurrentStory(storyId);
    setBCDeploymentStory(null);
    setBCDeploymentStep(0);
    // Update URL for bookmarking/sharing
    const url = new URL(window.location.href);
    url.searchParams.set('story', storyId);
    window.history.replaceState({}, '', url.toString());
  }, []);

  // Handle BC Deployment story load
  const handleBCDeploymentLoad = useCallback((story: BCDeploymentStory | null) => {
    console.log('[FlowStory] BC Deployment load:', story ? `"${story.title}"` : 'null');
    setBCDeploymentStory(story);
    setBCDeploymentStep(0);
  }, []);

  const isBCDeployment = bcDeploymentStory !== null;
  
  // Debug logging
  console.log('[FlowStory] Render - currentStory:', currentStory, 'isBCDeployment:', isBCDeployment);

  // Keyboard navigation for BC Deployment
  useEffect(() => {
    if (!isBCDeployment || !bcDeploymentStory) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowRight':
        case ' ':
          e.preventDefault();
          setBCDeploymentStep(s => Math.min(bcDeploymentStory.steps.length - 1, s + 1));
          break;
        case 'ArrowLeft':
          e.preventDefault();
          setBCDeploymentStep(s => Math.max(0, s - 1));
          break;
        case 'Home':
          e.preventDefault();
          setBCDeploymentStep(0);
          break;
        case 'End':
          e.preventDefault();
          setBCDeploymentStep(bcDeploymentStory.steps.length - 1);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isBCDeployment, bcDeploymentStory]);

  return (
    <div className="app" style={{ 
      width: '100vw', 
      height: '100vh', 
      display: 'flex', 
      flexDirection: 'column',
      background: 'var(--color-bg-primary)',
    }}>
      {/* Toolbar */}
      <header className="app-toolbar" data-testid="app-toolbar" style={{
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
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {!isBCDeployment && <ExportButton showLabels />}
          <ThemeToggle showLabel />
        </div>
      </header>
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <StoryLoader storyId={currentStory} onBCDeploymentLoad={handleBCDeploymentLoad} />
        
        {isBCDeployment ? (
          <ReactFlowProvider>
            <div style={{ flex: 1, position: 'relative' }}>
              <BCDeploymentCanvas 
                story={bcDeploymentStory} 
                currentStepIndex={bcDeploymentStep}
                onStepChange={setBCDeploymentStep}
              />
              {/* Simple step controls for BC Deployment */}
              <div style={{
                position: 'absolute',
                bottom: 16,
                left: '50%',
                transform: 'translateX(-50%)',
                display: 'flex',
                gap: 8,
                zIndex: 200,
              }}>
                <button
                  onClick={() => setBCDeploymentStep(s => Math.max(0, s - 1))}
                  disabled={bcDeploymentStep === 0}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 8,
                    border: '1px solid var(--color-surface-border)',
                    background: 'var(--color-surface-primary)',
                    cursor: bcDeploymentStep === 0 ? 'not-allowed' : 'pointer',
                    opacity: bcDeploymentStep === 0 ? 0.5 : 1,
                  }}
                >
                  ← Previous
                </button>
                <span 
                  className="step-counter"
                  data-testid="step-counter"
                  style={{
                    padding: '8px 12px',
                    background: 'var(--color-surface-primary)',
                    borderRadius: 8,
                    fontWeight: 600,
                  }}
                >
                  {bcDeploymentStep + 1} / {bcDeploymentStory.steps.length}
                </span>
                <button
                  onClick={() => setBCDeploymentStep(s => Math.min(bcDeploymentStory.steps.length - 1, s + 1))}
                  disabled={bcDeploymentStep >= bcDeploymentStory.steps.length - 1}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 8,
                    border: '1px solid var(--color-surface-border)',
                    background: 'var(--color-surface-primary)',
                    cursor: bcDeploymentStep >= bcDeploymentStory.steps.length - 1 ? 'not-allowed' : 'pointer',
                    opacity: bcDeploymentStep >= bcDeploymentStory.steps.length - 1 ? 0.5 : 1,
                  }}
                >
                  Next →
                </button>
              </div>
            </div>
          </ReactFlowProvider>
        ) : (
          <>
            <StoryCanvas showMinimap showControls showBackground showNavigation={false} />
            <StoryPanel showHeader showNextPreview showStepBadge />
            <PlaybackControls showHints />
          </>
        )}
      </main>
    </div>
  );
}

function AppWrapper() {
  return (
    <ThemeProvider defaultTheme="light">
      <ReactFlowProvider>
        <StoryProvider>
          <App />
        </StoryProvider>
      </ReactFlowProvider>
    </ThemeProvider>
  );
}

export default AppWrapper;
