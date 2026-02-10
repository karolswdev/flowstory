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
import { BCCompositionCanvas } from './components/bc-composition';
import { BCCompositionStorySchema, type BCCompositionStory } from './schemas/bc-composition';
import { TechRadarCanvas } from './components/tech-radar';
import { TechRadarStorySchema, type TechRadarStory } from './schemas/tech-radar';
import { C4ContextCanvas } from './components/c4-context';
import { C4ContextStorySchema, type C4ContextStory } from './schemas/c4-context';
import { EventStormingCanvas } from './components/event-storming';
import { EventStormingStorySchema, type EventStormingStory } from './schemas/event-storming';
import { ADRTimelineCanvas } from './components/adr-timeline';
import { ADRTimelineStorySchema, type ADRTimelineStory } from './schemas/adr-timeline';
import { CloudCostCanvas } from './components/cloud-cost';
import { CloudCostStorySchema, type CloudCostStory } from './schemas/cloud-cost';
import { DependencyGraphCanvas } from './components/dependency-graph';
import { DependencyGraphStorySchema, type DependencyGraphStory } from './schemas/dependency-graph';
import { MigrationRoadmapCanvas } from './components/migration-roadmap';
import { MigrationRoadmapStorySchema, type MigrationRoadmapStory } from './schemas/migration-roadmap';
import { TeamOwnershipCanvas } from './components/team-ownership';
import { TeamOwnershipStorySchema, type TeamOwnershipStory } from './schemas/team-ownership';
import { EffectsProvider } from './effects';
import { usePresentationMode, useStepNavigation } from './hooks';
import './styles/global.css';

/** Detect story type from YAML content */
type StoryType = 
  | 'bc-composition' 
  | 'bc-deployment' 
  | 'story-flow'
  | 'tech-radar'
  | 'c4-context'
  | 'adr-timeline'
  | 'cloud-cost'
  | 'dependency-graph'
  | 'event-storming'
  | 'migration-roadmap'
  | 'team-ownership';

function detectStoryType(content: string): StoryType {
  try {
    const parsed = YAML.parse(content);
    const type = parsed?.type;
    if (type === 'bc-composition') return 'bc-composition';
    if (type === 'bc-deployment') return 'bc-deployment';
    if (type === 'tech-radar') return 'tech-radar';
    if (type === 'c4-context') return 'c4-context';
    if (type === 'adr-timeline') return 'adr-timeline';
    if (type === 'cloud-cost') return 'cloud-cost';
    if (type === 'dependency-graph') return 'dependency-graph';
    if (type === 'event-storming') return 'event-storming';
    if (type === 'migration-roadmap') return 'migration-roadmap';
    if (type === 'team-ownership') return 'team-ownership';
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
    position: { x: 250, y: 200 }
  - id: click-signup
    type: action
    actorId: user
    label: Clicks Sign Up
    position: { x: 450, y: 200 }
  - id: enter-details
    type: action
    actorId: user
    label: Enters Details
    description: Email, password, name
    position: { x: 650, y: 200 }
  - id: validate-form
    type: system
    label: Validate Form
    position: { x: 850, y: 120 }
  - id: create-account
    type: system
    label: Create Account
    position: { x: 1050, y: 120 }
  - id: account-created-event
    type: event
    label: AccountCreatedEvent
    position: { x: 1050, y: 320 }
  - id: send-welcome-email
    type: system
    label: Send Welcome Email
    position: { x: 1250, y: 320 }
  - id: redirect-dashboard
    type: action
    actorId: user
    label: Sees Dashboard
    position: { x: 1250, y: 120 }
  - id: success
    type: state
    label: Registration Complete
    position: { x: 1450, y: 200 }
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
    file: '/stories/pipeline/ci-cd-pipeline.yaml'
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
  },
  // BC Composition Examples (Progressive Reveal)
  'bc-composition-order': {
    title: 'Order Service Composition',
    category: 'BC Composition',
    yaml: '',
    file: '/stories/bc-composition/order-service.yaml'
  },
  // Effects Demo
  'effects-demo': {
    title: 'Node Effects Demo',
    category: 'Effects',
    yaml: '',
    file: '/stories/effects-demo.yaml'
  },
  // Executive Pitch Stories
  'pitch-pain': {
    title: 'Translation Layer Pain',
    category: 'Pitch',
    yaml: '',
    file: '/stories/pitch/translation-layer-pain.yaml'
  },
  'pitch-solution': {
    title: 'Event-Driven Solution',
    category: 'Pitch',
    yaml: '',
    file: '/stories/pitch/event-driven-solution.yaml'
  },
  'pitch-roadmap': {
    title: '12-Week Pilot Roadmap',
    category: 'Pitch',
    yaml: '',
    file: '/stories/pitch/migration-phases.yaml'
  },
  // Specialized Renderers
  'adr-timeline': {
    title: 'ADR Timeline',
    category: 'Governance',
    yaml: '',
    file: '/stories/adr-timeline/api-decisions.yaml'
  },
  'c4-context': {
    title: 'C4 Context Diagram',
    category: 'Architecture',
    yaml: '',
    file: '/stories/c4-context/ecommerce-platform.yaml'
  },
  'cloud-cost': {
    title: 'Cloud Cost Review',
    category: 'FinOps',
    yaml: '',
    file: '/stories/cloud-cost/monthly-review.yaml'
  },
  'dependency-graph': {
    title: 'Dependency Graph',
    category: 'Architecture',
    yaml: '',
    file: '/stories/dependency-graph/microservices.yaml'
  },
  'event-storming': {
    title: 'Event Storming',
    category: 'DDD',
    yaml: '',
    file: '/stories/event-storming/order-domain.yaml'
  },
  'migration-roadmap': {
    title: 'Migration Roadmap',
    category: 'Strategy',
    yaml: '',
    file: '/stories/migration-roadmap/monolith-to-microservices.yaml'
  },
  'team-ownership': {
    title: 'Team Ownership',
    category: 'Organization',
    yaml: '',
    file: '/stories/team-ownership/platform-teams.yaml'
  },
  'tech-radar': {
    title: 'Tech Radar',
    category: 'Strategy',
    yaml: '',
    file: '/stories/tech-radar/modern-stack.yaml'
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

/** Story loader component - handles story-flow, bc-deployment, bc-composition, and specialized renderers */
function StoryLoader({ 
  storyId, 
  onBCDeploymentLoad,
  onBCCompositionLoad,
  onTechRadarLoad,
  onC4ContextLoad,
  onEventStormingLoad,
}: { 
  storyId: string;
  onBCDeploymentLoad?: (story: BCDeploymentStory | null) => void;
  onBCCompositionLoad?: (story: BCCompositionStory | null) => void;
  onTechRadarLoad?: (story: TechRadarStory | null) => void;
  onC4ContextLoad?: (story: C4ContextStory | null) => void;
  onEventStormingLoad?: (story: EventStormingStory | null) => void;
  onADRTimelineLoad?: (story: ADRTimelineStory | null) => void;
  onCloudCostLoad?: (story: CloudCostStory | null) => void;
  onDepGraphLoad?: (story: DependencyGraphStory | null) => void;
  onMigrationLoad?: (story: MigrationRoadmapStory | null) => void;
  onTeamOwnershipLoad?: (story: TeamOwnershipStory | null) => void;
}) {
  const { loadStory, reset } = useStory();

  // Clear all specialized story states
  const clearAllSpecialized = useCallback(() => {
    onBCDeploymentLoad?.(null);
    onBCCompositionLoad?.(null);
    onTechRadarLoad?.(null);
    onC4ContextLoad?.(null);
    onEventStormingLoad?.(null);
    onADRTimelineLoad?.(null);
    onCloudCostLoad?.(null);
    onDepGraphLoad?.(null);
    onMigrationLoad?.(null);
    onTeamOwnershipLoad?.(null);
  }, [onBCDeploymentLoad, onBCCompositionLoad, onTechRadarLoad, onC4ContextLoad, onEventStormingLoad, onADRTimelineLoad, onCloudCostLoad, onDepGraphLoad, onMigrationLoad, onTeamOwnershipLoad]);

  useEffect(() => {
    const storyData = STORIES[storyId];
    if (!storyData) return;

    const loadFromYaml = (yaml: string) => {
      const storyType = detectStoryType(yaml);
      
      if (storyType === 'bc-composition') {
        // Parse as BC Composition (progressive reveal)
        try {
          const parsed = YAML.parse(yaml);
          const bcStory = BCCompositionStorySchema.parse(parsed);
          reset();
          clearAllSpecialized();
          onBCCompositionLoad?.(bcStory);
        } catch (err) {
          console.error('Failed to parse BC Composition story:', err);
        }
      } else if (storyType === 'bc-deployment') {
        // Parse as BC Deployment (legacy)
        try {
          const parsed = YAML.parse(yaml);
          const bcStory = validateBCDeploymentStory(parsed);
          reset();
          clearAllSpecialized();
          onBCDeploymentLoad?.(bcStory);
        } catch (err) {
          console.error('Failed to parse BC Deployment story:', err);
        }
      } else if (storyType === 'tech-radar') {
        // Parse as Tech Radar
        try {
          const parsed = YAML.parse(yaml);
          const radarStory = TechRadarStorySchema.parse(parsed);
          reset();
          clearAllSpecialized();
          onTechRadarLoad?.(radarStory);
        } catch (err) {
          console.error('Failed to parse Tech Radar story:', err);
        }
      } else if (storyType === 'c4-context') {
        // Parse as C4 Context
        try {
          const parsed = YAML.parse(yaml);
          const c4Story = C4ContextStorySchema.parse(parsed);
          reset();
          clearAllSpecialized();
          onC4ContextLoad?.(c4Story);
        } catch (err) {
          console.error('Failed to parse C4 Context story:', err);
        }
      } else if (storyType === 'event-storming') {
        // Parse as Event Storming
        try {
          const parsed = YAML.parse(yaml);
          const esStory = EventStormingStorySchema.parse(parsed);
          reset();
          clearAllSpecialized();
          onEventStormingLoad?.(esStory);
        } catch (err) {
          console.error('Failed to parse Event Storming story:', err);
        }
      } else if (storyType === 'adr-timeline') {
        // Parse as ADR Timeline
        try {
          const parsed = YAML.parse(yaml);
          const adrStory = ADRTimelineStorySchema.parse(parsed);
          reset();
          clearAllSpecialized();
          onADRTimelineLoad?.(adrStory);
        } catch (err) {
          console.error('Failed to parse ADR Timeline story:', err);
        }
      } else if (storyType === 'cloud-cost') {
        try {
          const parsed = YAML.parse(yaml);
          const ccStory = CloudCostStorySchema.parse(parsed);
          reset(); clearAllSpecialized(); onCloudCostLoad?.(ccStory);
        } catch (err) { console.error('Failed to parse Cloud Cost story:', err); }
      } else if (storyType === 'dependency-graph') {
        try {
          const parsed = YAML.parse(yaml);
          const dgStory = DependencyGraphStorySchema.parse(parsed);
          reset(); clearAllSpecialized(); onDepGraphLoad?.(dgStory);
        } catch (err) { console.error('Failed to parse Dependency Graph story:', err); }
      } else if (storyType === 'migration-roadmap') {
        try {
          const parsed = YAML.parse(yaml);
          const mrStory = MigrationRoadmapStorySchema.parse(parsed);
          reset(); clearAllSpecialized(); onMigrationLoad?.(mrStory);
        } catch (err) { console.error('Failed to parse Migration Roadmap story:', err); }
      } else if (storyType === 'team-ownership') {
        try {
          const parsed = YAML.parse(yaml);
          const toStory = TeamOwnershipStorySchema.parse(parsed);
          reset(); clearAllSpecialized(); onTeamOwnershipLoad?.(toStory);
        } catch (err) { console.error('Failed to parse Team Ownership story:', err); }
      } else {
        // Parse as story-flow (default)
        clearAllSpecialized();
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
  }, [storyId, loadStory, reset, clearAllSpecialized, onBCDeploymentLoad, onBCCompositionLoad, onTechRadarLoad, onC4ContextLoad, onEventStormingLoad, onADRTimelineLoad, onCloudCostLoad, onDepGraphLoad, onMigrationLoad, onTeamOwnershipLoad]);

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
  const [bcCompositionStory, setBCCompositionStory] = useState<BCCompositionStory | null>(null);
  const [bcCompositionStep, setBCCompositionStep] = useState(0);
  const [techRadarStory, setTechRadarStory] = useState<TechRadarStory | null>(null);
  const [techRadarStep, setTechRadarStep] = useState(0);
  const [c4ContextStory, setC4ContextStory] = useState<C4ContextStory | null>(null);
  const [c4ContextStep, setC4ContextStep] = useState(0);
  const [eventStormingStory, setEventStormingStory] = useState<EventStormingStory | null>(null);
  const [eventStormingStep, setEventStormingStep] = useState(0);
  const [adrTimelineStory, setADRTimelineStory] = useState<ADRTimelineStory | null>(null);
  const [adrTimelineStep, setADRTimelineStep] = useState(0);
  const [cloudCostStory, setCloudCostStory] = useState<CloudCostStory | null>(null);
  const [cloudCostStep, setCloudCostStep] = useState(0);
  const [depGraphStory, setDepGraphStory] = useState<DependencyGraphStory | null>(null);
  const [depGraphStep, setDepGraphStep] = useState(0);
  const [migrationStory, setMigrationStory] = useState<MigrationRoadmapStory | null>(null);
  const [migrationStep, setMigrationStep] = useState(0);
  const [teamOwnershipStory, setTeamOwnershipStory] = useState<TeamOwnershipStory | null>(null);
  const [teamOwnershipStep, setTeamOwnershipStep] = useState(0);

  // Presentation mode
  const { isPresenting, togglePresentation } = usePresentationMode();

  // Determine current step info for keyboard navigation
  const getCurrentStepInfo = useCallback(() => {
    if (techRadarStory) return { step: techRadarStep, total: techRadarStory.steps.length, setter: setTechRadarStep };
    if (c4ContextStory) return { step: c4ContextStep, total: c4ContextStory.steps.length, setter: setC4ContextStep };
    if (eventStormingStory) return { step: eventStormingStep, total: eventStormingStory.steps.length, setter: setEventStormingStep };
    if (adrTimelineStory) return { step: adrTimelineStep, total: adrTimelineStory.steps.length, setter: setADRTimelineStep };
    if (cloudCostStory) return { step: cloudCostStep, total: cloudCostStory.steps.length, setter: setCloudCostStep };
    if (depGraphStory) return { step: depGraphStep, total: depGraphStory.steps.length, setter: setDepGraphStep };
    if (migrationStory) return { step: migrationStep, total: migrationStory.steps.length, setter: setMigrationStep };
    if (teamOwnershipStory) return { step: teamOwnershipStep, total: teamOwnershipStory.steps.length, setter: setTeamOwnershipStep };
    if (bcDeploymentStory) return { step: bcDeploymentStep, total: bcDeploymentStory.steps.length, setter: setBCDeploymentStep };
    if (bcCompositionStory) return { step: bcCompositionStep, total: bcCompositionStory.steps.length, setter: setBCCompositionStep };
    return null;
  }, [
    techRadarStory, techRadarStep, c4ContextStory, c4ContextStep,
    eventStormingStory, eventStormingStep, adrTimelineStory, adrTimelineStep,
    cloudCostStory, cloudCostStep, depGraphStory, depGraphStep,
    migrationStory, migrationStep, teamOwnershipStory, teamOwnershipStep,
    bcDeploymentStory, bcDeploymentStep, bcCompositionStory, bcCompositionStep,
  ]);

  const stepInfo = getCurrentStepInfo();

  // Keyboard navigation for specialized canvases
  useStepNavigation({
    currentStep: stepInfo?.step ?? 0,
    totalSteps: stepInfo?.total ?? 1,
    onStepChange: stepInfo?.setter ?? (() => {}),
    enabled: stepInfo !== null,
  });

  // Reset special story states when story changes
  const handleStoryChange = useCallback((storyId: string) => {
    setCurrentStory(storyId);
    setBCDeploymentStory(null);
    setBCDeploymentStep(0);
    setBCCompositionStory(null);
    setBCCompositionStep(0);
    setTechRadarStory(null);
    setTechRadarStep(0);
    setC4ContextStory(null);
    setC4ContextStep(0);
    setEventStormingStory(null);
    setEventStormingStep(0);
    setADRTimelineStory(null);
    setADRTimelineStep(0);
    setCloudCostStory(null);
    setCloudCostStep(0);
    setDepGraphStory(null);
    setDepGraphStep(0);
    setMigrationStory(null);
    setMigrationStep(0);
    setTeamOwnershipStory(null);
    setTeamOwnershipStep(0);
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

  // Handle BC Composition story load
  const handleBCCompositionLoad = useCallback((story: BCCompositionStory | null) => {
    console.log('[FlowStory] BC Composition load:', story ? `"${story.title}"` : 'null');
    setBCCompositionStory(story);
    setBCCompositionStep(0);
  }, []);

  // Handle Tech Radar story load
  const handleTechRadarLoad = useCallback((story: TechRadarStory | null) => {
    console.log('[FlowStory] Tech Radar load:', story ? `"${story.title}"` : 'null');
    setTechRadarStory(story);
    setTechRadarStep(0);
  }, []);

  // Handle C4 Context story load
  const handleC4ContextLoad = useCallback((story: C4ContextStory | null) => {
    console.log('[FlowStory] C4 Context load:', story ? `"${story.title}"` : 'null');
    setC4ContextStory(story);
    setC4ContextStep(0);
  }, []);

  // Handle Event Storming story load
  const handleEventStormingLoad = useCallback((story: EventStormingStory | null) => {
    console.log('[FlowStory] Event Storming load:', story ? `"${story.title}"` : 'null');
    setEventStormingStory(story);
    setEventStormingStep(0);
  }, []);

  // Handle ADR Timeline story load
  const handleADRTimelineLoad = useCallback((story: ADRTimelineStory | null) => {
    console.log('[FlowStory] ADR Timeline load:', story ? `"${story.title}"` : 'null');
    setADRTimelineStory(story);
    setADRTimelineStep(0);
  }, []);
  
  const handleCloudCostLoad = useCallback((story: CloudCostStory | null) => {
    setCloudCostStory(story);
    setCloudCostStep(0);
  }, []);
  
  const handleDepGraphLoad = useCallback((story: DependencyGraphStory | null) => {
    setDepGraphStory(story);
    setDepGraphStep(0);
  }, []);
  
  const handleMigrationLoad = useCallback((story: MigrationRoadmapStory | null) => {
    setMigrationStory(story);
    setMigrationStep(0);
  }, []);
  
  const handleTeamOwnershipLoad = useCallback((story: TeamOwnershipStory | null) => {
    setTeamOwnershipStory(story);
    setTeamOwnershipStep(0);
  }, []);

  const isBCDeployment = bcDeploymentStory !== null;
  const isBCComposition = bcCompositionStory !== null;
  const isTechRadar = techRadarStory !== null;
  const isC4Context = c4ContextStory !== null;
  const isEventStorming = eventStormingStory !== null;
  const isADRTimeline = adrTimelineStory !== null;
  const isCloudCost = cloudCostStory !== null;
  const isDepGraph = depGraphStory !== null;
  const isMigration = migrationStory !== null;
  const isTeamOwnership = teamOwnershipStory !== null;
  
  // Debug logging
  console.log('[FlowStory] Render - currentStory:', currentStory, 'isBCDeployment:', isBCDeployment, 'isBCComposition:', isBCComposition);

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

  // Keyboard navigation for BC Composition
  useEffect(() => {
    if (!isBCComposition || !bcCompositionStory) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowRight':
        case ' ':
          e.preventDefault();
          setBCCompositionStep(s => Math.min(bcCompositionStory.steps.length - 1, s + 1));
          break;
        case 'ArrowLeft':
          e.preventDefault();
          setBCCompositionStep(s => Math.max(0, s - 1));
          break;
        case 'Home':
          e.preventDefault();
          setBCCompositionStep(0);
          break;
        case 'End':
          e.preventDefault();
          setBCCompositionStep(bcCompositionStory.steps.length - 1);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isBCComposition, bcCompositionStory]);

  return (
    <div className="app" style={{ 
      width: '100vw', 
      height: '100vh', 
      display: 'flex', 
      flexDirection: 'column',
      background: 'var(--color-bg-primary)',
    }}>
      {/* Toolbar - hidden in presentation mode */}
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
          {!isBCDeployment && !isBCComposition && !isTechRadar && !isC4Context && !isEventStorming && !isADRTimeline && !isCloudCost && !isDepGraph && !isMigration && !isTeamOwnership && <ExportButton showLabels />}
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
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <StoryLoader 
          storyId={currentStory} 
          onBCDeploymentLoad={handleBCDeploymentLoad}
          onBCCompositionLoad={handleBCCompositionLoad}
          onTechRadarLoad={handleTechRadarLoad}
          onC4ContextLoad={handleC4ContextLoad}
          onEventStormingLoad={handleEventStormingLoad}
          onADRTimelineLoad={handleADRTimelineLoad}
          onCloudCostLoad={handleCloudCostLoad}
          onDepGraphLoad={handleDepGraphLoad}
          onMigrationLoad={handleMigrationLoad}
          onTeamOwnershipLoad={handleTeamOwnershipLoad}
        />
        
        {isBCComposition ? (
          <ReactFlowProvider key="bc-composition">
            <div style={{ flex: 1, position: 'relative' }}>
              <BCCompositionCanvas 
                story={bcCompositionStory} 
                currentStepIndex={bcCompositionStep}
                onStepChange={setBCCompositionStep}
              />
              {/* Step controls for BC Composition */}
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
                  onClick={() => setBCCompositionStep(s => Math.max(0, s - 1))}
                  disabled={bcCompositionStep === 0}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 8,
                    border: '1px solid var(--color-surface-border)',
                    background: 'var(--color-surface-primary)',
                    cursor: bcCompositionStep === 0 ? 'not-allowed' : 'pointer',
                    opacity: bcCompositionStep === 0 ? 0.5 : 1,
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
                  {bcCompositionStep + 1} / {bcCompositionStory.steps.length}
                </span>
                <button
                  onClick={() => setBCCompositionStep(s => Math.min(bcCompositionStory.steps.length - 1, s + 1))}
                  disabled={bcCompositionStep >= bcCompositionStory.steps.length - 1}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 8,
                    border: '1px solid var(--color-surface-border)',
                    background: 'var(--color-surface-primary)',
                    cursor: bcCompositionStep >= bcCompositionStory.steps.length - 1 ? 'not-allowed' : 'pointer',
                    opacity: bcCompositionStep >= bcCompositionStory.steps.length - 1 ? 0.5 : 1,
                  }}
                >
                  Next →
                </button>
              </div>
            </div>
          </ReactFlowProvider>
        ) : isBCDeployment ? (
          <ReactFlowProvider key="bc-deployment">
            <div style={{ flex: 1, position: 'relative' }}>
              <BCDeploymentCanvas 
                story={bcDeploymentStory} 
                currentStepIndex={bcDeploymentStep}
                onStepChange={setBCDeploymentStep}
              />
              {/* Step controls for BC Deployment */}
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
        ) : isTechRadar ? (
          <div style={{ flex: 1, position: 'relative' }}>
            <TechRadarCanvas 
              story={techRadarStory} 
              currentStepIndex={techRadarStep}
              onStepChange={setTechRadarStep}
            />
          </div>
        ) : isC4Context ? (
          <div style={{ flex: 1, position: 'relative' }}>
            <C4ContextCanvas 
              story={c4ContextStory} 
              currentStepIndex={c4ContextStep}
              onStepChange={setC4ContextStep}
            />
          </div>
        ) : isEventStorming ? (
          <div style={{ flex: 1, position: 'relative' }}>
            <EventStormingCanvas 
              story={eventStormingStory} 
              currentStepIndex={eventStormingStep}
              onStepChange={setEventStormingStep}
            />
          </div>
        ) : isADRTimeline ? (
          <div style={{ flex: 1, position: 'relative' }}>
            <ADRTimelineCanvas 
              story={adrTimelineStory} 
              currentStepIndex={adrTimelineStep}
              onStepChange={setADRTimelineStep}
            />
          </div>
        ) : isCloudCost ? (
          <div style={{ flex: 1, position: 'relative' }}>
            <CloudCostCanvas story={cloudCostStory} currentStepIndex={cloudCostStep} onStepChange={setCloudCostStep} />
          </div>
        ) : isDepGraph ? (
          <div style={{ flex: 1, position: 'relative' }}>
            <DependencyGraphCanvas story={depGraphStory} currentStepIndex={depGraphStep} onStepChange={setDepGraphStep} />
          </div>
        ) : isMigration ? (
          <div style={{ flex: 1, position: 'relative' }}>
            <MigrationRoadmapCanvas story={migrationStory} currentStepIndex={migrationStep} onStepChange={setMigrationStep} />
          </div>
        ) : isTeamOwnership ? (
          <div style={{ flex: 1, position: 'relative' }}>
            <TeamOwnershipCanvas story={teamOwnershipStory} currentStepIndex={teamOwnershipStep} onStepChange={setTeamOwnershipStep} />
          </div>
        ) : (
          <>
            <StoryCanvas showMinimap showControls showBackground showNavigation={false} useNewLayout />
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
