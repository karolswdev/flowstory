# FlowStory — Project Instructions

FlowStory is a **visual story-driven architecture visualization engine**. React + TypeScript + React Flow + Motion. It renders step-based animated narratives from YAML for CTO-ready presentations.

## Architecture Overview

```
src/
├── schemas/          # Zod schemas per renderer (one .ts file each)
├── components/       # Canvas + node components per renderer
│   ├── shared/       # Shared UI: StepOverlay (unified step info card)
│   ├── nodes/        # Shared node components (StateNode, NodeHandles, sizes, etc.)
│   ├── edges/        # Shared edge components (FlowEdge, etc.)
│   ├── service/      # ServiceFlowCanvas + 28 node types + ServiceCallEdge + ZoneNode + SubstateBadge
│   ├── http/         # HttpFlowCanvas + participants
│   ├── pipeline/     # PipelineCanvas + StageNode + JobNode + GateNode
│   ├── bc-deployment/  # BCDeploymentCanvas + BCCoreNode + ArtifactNode
│   ├── bc-composition/ # BCCompositionCanvas + radial layout
│   ├── state-diagram/  # StateDiagramCanvas + dagre layout + UML markers
│   ├── c4-context/     # C4ContextCanvas (SVG)
│   ├── tech-radar/     # TechRadarCanvas (SVG)
│   ├── event-storming/ # EventStormingCanvas (SVG)
│   ├── composite/      # CompositeCanvas — multi-renderer section switcher
│   └── ...             # adr-timeline, cloud-cost, dependency-graph, etc.
├── hooks/            # Camera, step nav, presentation, shareable URL
├── animations/       # Timing config, motion variants, step transitions
├── layout/           # Camera math, layout engine, edge routing
├── effects/          # Pluggable effects (pulse, glow, shake, emoji, particles)
├── renderers/        # specialized.ts — renderer registry map
├── context/          # StoryContext (story-flow state management)
├── themes/           # Light/dark theme provider
├── utils/            # Parser, export (PNG/PDF/GIF), layout algorithms
└── App.tsx           # Story catalog, loader, toolbar, presentation mode
stories/              # Example YAML stories organized by renderer type
```

## Renderers

### MVP Showcase (13 renderers in catalog)

| Renderer | Key | ReactFlow? | Camera | Best For |
|----------|-----|-----------|--------|----------|
| Story Flow | `story-flow` | Yes | legacy | User journeys, generic flows |
| Service Flow | `service-flow` | Yes | useAutoFocus | Architecture storytelling (flagship) |
| HTTP Flow | `http-flow` | Yes | useAutoFocus | API request/response sequences |
| Pipeline | `pipeline` | Yes | useAutoFocus | CI/CD pipeline visualization |
| BC Deployment | `bc-deployment` | Yes | useAutoFocus | K8s artifacts around a BC |
| BC Composition | `bc-composition` | Yes | useAutoFocus | Progressive reveal of BC internals |
| State Diagram | `state-diagram` | Yes | useAutoFocus | UML state machines (VR/PT lifecycle) |
| C4 Context | `c4-context` | SVG | N/A | C4 Model Level 1 |
| Tech Radar | `tech-radar` | SVG | N/A | Technology adoption radar |
| Event Storming | `event-storming` | SVG | N/A | DDD event storming |
| ADR Timeline | `adr-timeline` | SVG | N/A | Architecture decision records |
| Cloud Cost | `cloud-cost` | SVG | N/A | Cloud spend analysis |
| Composite | `composite` | Meta | Per-section | Multi-renderer deep dives |

### Hidden from MVP (code exists, not in catalog)
| Renderer | Key | Reason |
|----------|-----|--------|
| Dependency Graph | `dependency-graph` | Too thin (136 lines) |
| Migration Roadmap | `migration-roadmap` | Too thin (97 lines) |
| Team Ownership | `team-ownership` | Too thin (99 lines) |

### Adding a New Renderer

1. Create `src/schemas/{type}.ts` — Zod schemas, types, layout constants, color maps
2. Create `src/components/{type}/{Type}Canvas.tsx` — Main canvas component
3. Create node/edge components in same directory
4. Create `src/components/{type}/{type}.css` — Styling
5. Create `src/components/{type}/index.ts` — Barrel export
6. Register in `src/renderers/specialized.ts` — add to type union + RENDERER_MAP
7. Add node dimensions to `src/components/nodes/dimensions.ts`
8. Add story entry to `src/App.tsx` STORIES catalog
9. Create example YAML in `stories/{type}/`
10. **If ReactFlow-based: MUST use `useAutoFocus` for camera** (see below)
11. **Use `<StepOverlay>` from `src/components/shared/`** for step info display (see below)

## Camera System — Core Infrastructure

**MANDATORY for all ReactFlow-based renderers.** Every ReactFlow canvas MUST use `useAutoFocus`.

### Canonical Pattern

```tsx
import { useAutoFocus } from '../../hooks/useCameraController';

// In canvas component:
const activeNodeIds = useMemo(() => [...activeSet], [activeSet]);

// Inner component (MUST be child of <ReactFlow>):
function MyCameraController({ activeNodeIds }: { activeNodeIds: string[] }) {
  useAutoFocus(activeNodeIds, {
    padding: 100,    // px around focus area
    duration: 600,   // ms animation time
    maxZoom: 1.3,
    minZoom: 0.4,
  });
  return null;
}

// Place inside <ReactFlow>:
<ReactFlow ...>
  <Background />
  <Controls />
  <MyCameraController activeNodeIds={activeNodeIds} />
  <MiniMap />
</ReactFlow>
```

### Camera API (`useCameraController`)
- `focusNodes(nodeIds[], options?)` — spring-overshoot pan/zoom
- `fitAll(padding?)` — fit all nodes
- `panTo(x, y)` / `zoomTo(level)` — manual control
- Default easing: `f(t) = 1 - e^(-6t) * cos(3πt)` — cinematic spring-overshoot

### Named Easing Library
5 named easing functions available via `EASING_FNS`:
- `spring-overshoot` (default) — cinematic snap with 10% overshoot
- `linear` — constant speed
- `ease-in` — cubic accelerate
- `ease-out` — cubic decelerate
- `ease-in-out` — cubic S-curve

### Per-Step Camera Overrides (service-flow)

Steps can include a `camera` object for cinematic control:

```yaml
steps:
  - id: step-1
    camera:
      zoom: 1.8              # target zoom level
      duration: 2500          # animation ms
      easing: ease-in         # named easing function
      focusNodes: [svc-a]     # override auto-focus targets
      fitAll: true            # zoom to fit all nodes
      pan: [100, -50]         # manual pan offset after focus
      padding: 150            # px around focus area
```

Priority: `fitAll` > `focusNodes` override > auto-focus from `activeNodeIds`.

### Hooks Barrel (`src/hooks/index.ts`)
Exports: `useCameraController`, `useAutoFocus`, `usePresentationMode`, `useStepNavigation`, `useShareableUrl`

## Step System

Every story has ordered **steps** — the heart of FlowStory. Each step:
- **Reveals** new elements (nodeIds, activeCalls, activeStates, focusNodes, reveal)
- **Narrates** (narrative text + optional speaker)
- **Controls camera** (auto-focus on active nodes, or manual camera YAML)
- **Has timing** (duration in ms for auto-advance)

### Step State Pattern (all ReactFlow renderers)

**3-set pattern** (most renderers):
```tsx
const { active, completed, revealed } = useMemo(() => {
  const active = new Set<string>();
  const completed = new Set<string>();
  const revealed = new Set<string>();
  story.steps.forEach((step, i) => {
    if (i <= currentStepIndex) step.items.forEach(id => revealed.add(id));
    if (i < currentStepIndex) step.items.forEach(id => completed.add(id));
    else if (i === currentStepIndex) step.items.forEach(id => active.add(id));
  });
  return { active, completed, revealed };
}, [story.steps, currentStepIndex]);
```

**6-set pattern** (service-flow): Separate sets for calls AND nodes, plus `newCallIds`/`newNodeIds` for entry effects. Camera uses explicit `focusNodes[]` when present, falls back to active call participants.

## Node System

### Shared Components (`src/components/nodes/`)
- `NodeHandles` — 8 invisible handles (4 source + 4 target) for edge routing
- `getBestHandles(sourcePos, targetPos)` — positional handle selection
- `getSmartHandles(sourceRect, targetRect)` — dimension-aware, Euclidean distance
- `sizes.ts` — SIZE_PRESETS (xs/s/m/l/xl on 8px grid), `getNodeSize()`, `getSizeStyles()`
- `dimensions.ts` — NODE_DIMENSIONS for smart edge routing per renderer

### Node Sizes (8px grid)
| Size | Width | Height | Font | Padding |
|------|-------|--------|------|---------|
| xs | 96 | 40 | 11 | 8 |
| s | 144 | 48 | 12 | 10 |
| m | 192 | 56 | 13 | 12 |
| l | 240 | 64 | 14 | 14 |
| xl | 320 | 80 | 16 | 16 |

### Animation States
`hidden` → `entering` → `active` → `complete` → `faded`

Controlled via `motion/react` variants in `src/animations/nodeVariants.ts`.

## Animation Timing (`src/animations/config.ts`)
- nodeEntry: 300ms, stagger: 80ms, edgeDraw: 400ms
- glowPulse: 1500ms, stateTransition: 200ms
- totalStepTransition: ~1600ms
- Easing: easeOutCubic `[0.4, 0, 0.2, 1]`, spring `{stiffness:400, damping:30}`

## Design Language

### Design Token System — Single Source of Truth

**`src/styles/tokens.css`** is the ONE canonical token file. Do NOT define tokens elsewhere.

- **Palette:** Tailwind CSS colors throughout (NO Material Design)
- **Typography:** `--fs-*` (primary), `--font-size-*` (alias)
- **Weights:** `--fw-*` (primary), `--font-weight-*` (alias)
- **Spacing:** `--space-1` through `--space-16` (4px base)
- **Shadows:** Visible depth — `--shadow-md: 0 4px 8px rgba(0,0,0,0.12), 0 2px 4px rgba(0,0,0,0.08)`
- **Aliases:** `--color-bg-primary` → `var(--color-bg)`, `--color-text-primary` → `var(--color-text)`, etc.
- **JS tokens:** `src/themes/tokens.ts` must stay aligned with `tokens.css`

### Color Semantics (Tailwind palette)
- Blue (#3B82F6): system, info, API
- Green (#22C55E): success, action, healthy
- Red (#EF4444): error, danger
- Orange (#F59E0B / #F97316): warning, event, decision
- Purple (#A855F7): async, actor, queue

### CSS Patterns
- Canvas: `width: 100%; height: 100%; position: relative;`
- **Step info overlay: use `<StepOverlay>` from `src/components/shared/`** — glass-blur, bottom-center, animated
- Node states: `.node-active` (glow + scale), `.node-complete` (dimmed + desaturated), `.node-dimmed` (very low opacity)
- Dark mode: `[data-theme="dark"]` overrides — all colors MUST use token variables, no hardcoded hex
- **Never use `transition: all`** — always list explicit properties
- **Never use `background: white`** — use `var(--color-bg-elevated)`

## Step Overlay — Shared UI Component

**ALL renderers MUST use `<StepOverlay>` from `src/components/shared/`** for step info display.

```tsx
import { StepOverlay } from '../shared';

// In canvas JSX (OUTSIDE <ReactFlow>, inside the wrapper div):
{currentStep && (
  <StepOverlay
    stepIndex={currentStepIndex}
    totalSteps={story.steps.length}
    title={currentStep.title}
    narrative={currentStep.narrative}           // simple text
    description={currentStep.description}       // alternative to narrative
    narration={currentStep.narration}           // { speaker, message }
    accentColor={story.bc?.color}               // optional accent
    onStepChange={onStepChange}                 // optional dot click handler
    showDots                                    // show progress dots
  />
)}
```

- Glass-blur card, bottom-center, `AnimatePresence` animated
- Supports badge, title, narrative OR narration (speaker+message), accent color, clickable dots
- **Rich text markup** in all text fields: `**bold**`, `*italic*`, `` `code` ``, `{color:name|text}`, `\n`
- Dark mode handled automatically via tokens
- CSS: `src/components/shared/step-overlay.css`

## Canvas `hideOverlay` Prop

All 14 canvas components accept a `hideOverlay?: boolean` prop. When `true`, the canvas suppresses its own step overlay / info panel / navigation. This is used by the `composite` renderer to render a single unified `StepOverlay` while delegating visualization to inner canvases.

The `SpecializedRendererConfig.Canvas` type includes `hideOverlay?` in its signature.

## Renderer Registry (`src/renderers/specialized.ts`)

```typescript
export type SpecializedStoryType = 'service-flow' | 'http-flow' | ... | 'state-diagram';

export const RENDERER_MAP: Record<SpecializedStoryType, SpecializedRendererConfig> = {
  'service-flow': { type: 'service-flow', Canvas: ServiceFlowCanvas, schema: ServiceFlowStorySchema },
  // ...
};
```

Detection in App.tsx: `parsed.type || parsed.renderer` matched against RENDERER_MAP keys.

## YAML Story Authoring

### Common Header
```yaml
id: my-story
title: "My Story Title"
renderer: service-flow          # or type: bc-deployment
schemaVersion: "2.0"            # or version: 2
description: "Optional description"
```

### Key Renderer Schemas

**service-flow:** `services[] + queues[] + calls[] + zones[] + scenes[] + steps[{activeCalls, focusNodes, revealNodes, revealCalls, substates, camera, simulateFailure}]`
**http-flow:** `participants[] + exchanges[] + steps[{activeExchanges}]`
**pipeline:** `pipeline{} + stages[] + jobs[] + steps[{activeStages, activeJobs, activeGates}]`
**bc-deployment:** `bc{} + artifacts[] + edges[] + steps[{focusNodes, activeEdges, expandNodes}]`
**bc-composition:** `core{} + elements[] + edges[] + steps[{reveal, focus, expand}]`
**state-diagram:** `states[] + transitions[] + phases[] + steps[{activeStates, activeTransitions}]`
**c4-context:** `system{} + people[] + externalSystems[] + relationships[] + steps[{focusNode, highlightNodes}]`
**composite:** `sections[{renderer, title, accentColor?, ...rendererKeys, steps[]}]` — steps flattened globally across sections

### Composite Renderer

The `composite` renderer enables **multi-perspective stories** that span multiple renderers in a single YAML file. Each section is a complete renderer story (minus top-level `id`/`renderer`/`schemaVersion`), and steps are navigated as one linear sequence across all sections.

```yaml
renderer: composite
sections:
  - renderer: c4-context
    title: "System Landscape"
    accentColor: "#3B82F6"
    system: { ... }
    steps: [ ... ]          # 2 steps
  - renderer: service-flow
    title: "Service Choreography"
    accentColor: "#22C55E"
    services: [ ... ]
    calls: [ ... ]
    steps: [ ... ]          # 3 steps
  # Total: 5 steps navigated linearly
```

Key behaviors:
- Each section is validated against its renderer's Zod schema via `superRefine`
- Steps are flattened into one global array (App.tsx sees `story.steps.length` as the total)
- Section transitions use `AnimatePresence mode="wait"` with fade
- ReactFlowProvider is rekeyed per section (no stale state)
- Inner canvases receive `hideOverlay` — composite renders one unified `StepOverlay`
- A section badge shows the current section title (top-left)
- All existing renderers can be used as sections (except `composite` itself)
- Every section must have at least 1 step

### Narration Patterns
```yaml
narrative: "Inline text"           # Most renderers
narration:                          # bc-deployment, bc-composition, state-diagram, service-flow
  speaker: Architect
  message: "Detailed explanation"
```

### Rich Text Markup in Narration

All `narrative`, `description`, and `narration.message` text supports inline formatting:

| Syntax | Renders | Example |
|--------|---------|---------|
| `**text**` | **bold** | `**critical path**` |
| `*text*` | *italic* | `*optional*` |
| `` `text` `` | `code` | `` `POST /api` `` |
| `{color:name\|text}` | colored text | `{color:red\|failure}` |
| `\n` | line break | multi-line |

**Named colors:** `blue`, `green`, `red`, `orange`, `amber`, `purple`, `pink`, `cyan`, `teal`, `yellow`, `gray` — or raw hex like `{color:#3B82F6|text}`.

```yaml
narrative: >-
  The **Gateway** receives `POST /trips` and routes to
  the {color:blue|Trip Service}, which emits a
  {color:orange|TripCreated} event.
```

## Sharing & Embed Mode

### URL Parameters
| Param | Purpose | Example |
|-------|---------|---------|
| `story` | Load a specific story | `?story=pipeline-cicd` |
| `step` | Start at a specific step | `?story=pipeline-cicd&step=3` |
| `embed` | Hide toolbar for iframe embedding | `?story=pipeline-cicd&embed=true` |

### Share Button
Toolbar has a "Share Link" button — copies story + step URL to clipboard via `useShareableUrl` hook.

### Embed Mode (`?embed=true`)
Hides toolbar, story selector, and all chrome. Shows only the canvas + step overlay. Ideal for iframes:
```html
<iframe src="https://host/?story=pipeline-cicd&step=0&embed=true" width="100%" height="600" frameborder="0"></iframe>
```

## Presentation Mode
- `P` toggle, `ESC` exit, `→/Space` next, `←` prev, `Home/End`, `?` help, `N` notes
- Hides toolbar/chrome, shows StepProgressDots (bottom center)
- Hook: `usePresentationMode()` from `src/hooks/`

## Effects System (`src/effects/`)
**Node effects:** pulse, glow, shake, emoji-explosion, particles, confetti, ripples, bounce, breathe
**Edge effects:** emoji-fan, label-yeet, particle-stream (projectile-based, SVG layer)
Triggers: on-reveal, on-focus, on-click, on-hover, continuous, manual

## Dependencies
@xyflow/react ^12.10, motion ^12.33, zod ^4.3, @dagrejs/dagre, elkjs, yaml, jspdf, html-to-image

## Service-Flow — 28 Node Types + Sub-States + Coupling + Camera

### Service Types (28 total)

**Infrastructure types (18):**

| Type | Shape | Color | Icon | Component |
|------|-------|-------|------|-----------|
| `api` | Rectangle | Blue #3B82F6 | Server | ServiceNode |
| `worker` | Rounded rect | Purple #A855F7 | Hammer | WorkerNode |
| `gateway` | Diamond | Amber #F59E0B | Globe | GatewayNode |
| `database` | Cylinder (tall) | Stone #78716C | Database | DatabaseNode |
| `cache` | Rounded square | Cyan #06B6D4 | Zap | CacheNode |
| `external` | Dashed cloud/pill | Slate #64748B | Cloud | ExternalNode |
| `event-bus` | Hexagon | Orange #F97316 | Radio | EventBusNode |
| `workflow` | Pill/stadium | Pink #EC4899 | GitBranch | WorkflowNode |
| `event-processor` | Rounded rect + conveyor | Violet #8B5CF6 | Activity | EventProcessorNode |
| `client` | Card + avatar | Indigo #6366F1 | Monitor | ClientNode |
| `firewall` | Octagon | Rose #F43F5E | ShieldCheck | FirewallNode |
| `load-balancer` | Inverted trapezoid | Teal #14B8A6 | Network | LoadBalancerNode |
| `scheduler` | Circle | Amber #D97706 | Clock | SchedulerNode |
| `storage` | Wide cylinder | Stone #A8A29E | HardDrive | StorageNode |
| `function` | Parallelogram | Orange #EA580C | Cpu | FunctionNode |
| `monitor` | Rect + chart accent | Emerald #10B981 | BarChart3 | MonitorNode |
| `human-task` | Card + person badge | Pink #EC4899 | UserCheck | HumanTaskNode |
| `event-stream` | Wide pipe + marquee | Cyan #06B6D4 | Waves | EventStreamNode |

**Domain-level types (10):**

| Type | Shape | Color | Icon | Component |
|------|-------|-------|------|-----------|
| `entity` | Pentagon | Sky #0EA5E9 | Fingerprint | EntityNode |
| `aggregate` | Double-border rect | Indigo #4F46E5 | Box | AggregateNode |
| `value-object` | Rounded hexagon | Lime #84CC16 | Gem | ValueObjectNode |
| `domain-event` | Tab shape | Amber #F59E0B | BellRing | DomainEventNode |
| `policy` | Shield (vertical hex) | Rose #E11D48 | Scale | PolicyNode |
| `read-model` | Reverse parallelogram | Cyan #06B6D4 | Eye | ReadModelNode |
| `saga` | Arrow/chevron | Violet #7C3AED | Route | SagaNode |
| `repository` | House/pentagon-up | Stone #57534E | Archive | RepositoryNode |
| `bounded-context` | Rect with left notch | Emerald #059669 | Layers | BoundedContextNode |
| `actor` | Regular trapezoid | Pink #DB2777 | User | ActorNode |

Shape is the primary discriminator, color is secondary. All 28 shapes are unique — colorblind-safe.

### Event Stream Node — Wide Pipe with Marquee

The `event-stream` type is a **420px-wide horizontal pipe** with an internal marquee of event pills. Services of this type accept an `events` array:

```yaml
services:
  - id: my-stream
    name: Trip Events
    type: event-stream
    technology: "Kafka"
    events:
      - key: TripCreated
        value: "trip_id, rider_id"
        emoji: "📦"
        color: "#3B82F6"
```

- **Active:** Marquee scrolls L→R, edge glow pulses at inlet/outlet
- **Inactive:** Pipe visible but static, marquee paused, pills dimmed
- **Width override:** `event-stream` bypasses `measureShapeNodeWidth` — uses fixed 420×72 dimensions

### Event Processor Node — Conveyor Belt Ingestion

The `event-processor` type is a **220×90 rounded rectangle** with a dedicated `EventProcessorNode` component. When active calls with a `messageType` target this node, a **conveyor belt strip** appears inside showing event pills sliding R→L — visually representing event consumption.

**No new YAML fields needed.** The conveyor is derived from active calls:
- `ServiceFlowCanvas` computes `incomingEventsMap` from active calls where `call.to === node.id` and call has `messageType`
- Passed as `data.incomingEvents` to the node
- `EventProcessorNode` renders conveyor strip when `incomingEvents.length > 0 && isActive`

**Behavior per step:**
- **Active + incoming events:** Conveyor strip visible, pills slide R→L with call-type badges (📥 subscribe, ⚡ async, 📤 publish), pills dissolve at left edge via CSS gradient mask
- **Active + no incoming events:** Standard active glow/pulse, conveyor hidden — clean rounded rect
- **Inactive / Complete:** Standard shape-node dimming, no conveyor

**Key difference from EventStreamNode:** Direction is R→L (consumption), left-edge fade mask creates the "intake" visual. EventStreamNode flows L→R (production).

**Dimension override:** `event-processor` bypasses `measureShapeNodeWidth` — uses fixed 220×90 dimensions (like `event-stream`).

**Key files:**
- `src/components/service/EventProcessorNode.tsx` — component with conveyor belt
- `src/components/service/service-nodes.css` — `.shape-node--event-processor`, `.event-processor__strip`, `.event-processor__conveyor`, `.event-processor__pill`, dark mode overrides

### Scenes — Layout Direction Groups

Scenes partition services into layout groups with independent Dagre directions:

```yaml
scenes:
  - id: ingress
    direction: LR          # LR | TB | RL | BT (default: LR)
    members: [client, gateway, auth]
    nodesep: 60             # optional spacing overrides
    ranksep: 200
  - id: domain
    direction: TB
    members: [orders, payments, db]
```

- Each scene runs its own Dagre pass, then scenes are composited via a macro Dagre (TB)
- Nodes not in any scene go to a default LR group
- Zone members must not span multiple scenes
- All declared scene members are laid out (even if not yet revealed) for stable positions

### Sub-State System

Services can declare named sub-states that animate as the story progresses:

```yaml
services:
  - id: conductor
    type: workflow
    substates: [idle, running, waiting, compensating, completed, failed]
    initialSubstate: idle

steps:
  - id: step-1
    substates:
      conductor: running      # Set sub-state
  - id: step-2
    substates:
      conductor: waiting      # Change sub-state (sticky — persists until changed)
  - id: step-3
    substates:
      conductor: ~            # Clear sub-state (null/~ removes badge)
```

**Rules:**
- **Sticky**: substates persist until explicitly changed or cleared with `~`/`null`
- **Optional**: services without `substates` work exactly as before
- **Semantic colors**: keyword-prefixed (`running` → blue, `failed` → red, `writing` → purple, etc.)
- **Visual**: animated pill badge inside each node via `SubstateBadge` component

**Key files:**
- `src/schemas/service-flow.ts` — `SUBSTATE_COLOR_MAP`, `getSubstateColor()`, `resolveSubstates()`
- `src/components/service/SubstateBadge.tsx` — animated badge component
- `ServiceFlowCanvas.tsx` — computes `resolvedSubstateMap` and passes to node `data`

### Coupling Indicators + Failure Cascade

Calls can declare coupling level and criticality for architecture analysis:

```yaml
calls:
  - id: order-to-payment
    type: sync
    from: order-svc
    to: payment-svc
    coupling: tight          # tight | loose | eventual
    critical: true           # marks critical path
    fallback: "Skip cache"   # fallback description (activates on failure)
```

**Coupling visuals:**
- `tight` — stroke-width 3, red accent
- `loose` — stroke-width 1.5, blue accent (normal)
- `eventual` — stroke-width 1, dashed, gray

**Failure cascade:** Steps can simulate a service failure with `simulateFailure`:

```yaml
steps:
  - id: step-3
    title: "Payment DB Failure"
    simulateFailure: payment-db    # BFS upstream through critical calls
    activeCalls: [...]
```

When `simulateFailure` is set:
- `getServiceFlowCascade(calls, failedServiceId)` runs BFS upstream through `critical: true` calls
- Affected services get red outline + pulse animation (`.service-node--failure-down`, `.shape-node--failure-down`)
- Failed edges pulse red (`.call-edge--failed`)
- Calls with `fallback` show green dashed edges (`.call-edge--fallback-active`)

**Key files:**
- `src/schemas/service-flow.ts` — `COUPLING_LEVELS`, `COUPLING_COLORS`, `getServiceFlowCascade()`
- `src/components/service/ServiceCallEdge.tsx` — coupling/failure visual treatment
- `src/components/service/service-nodes.css` — coupling/cascade CSS animations

### Edge Effects System

Calls can have projectile effects (emoji-fan, label-yeet, particle-stream):

```yaml
calls:
  - id: emit-event
    type: publish
    from: orders
    to: events
    effect:
      type: emoji-fan
      emojis: ["📦", "✨"]
      count: 5
      speed: 150
```

Step-level overrides via `effects[]` array on steps:

```yaml
steps:
  - id: step-2
    effects:
      - target: emit-event    # call ID
        type: particle-stream
        count: 10
```

**Key files:**
- `src/components/service/EdgeEffectLayer.tsx` — SVG projectile renderer
- `src/effects/plugins/edge-projectile.ts` — plugin definition

### Adding a New Service Type (Checklist)

1. Add type string to `SERVICE_TYPES` in `src/schemas/service-flow.ts`
2. Add icon to `SERVICE_TYPE_ICONS` (lucide-react import)
3. Add color to `SERVICE_TYPE_COLORS`
4. Add `--svc-border-{type}` CSS tokens in `src/styles/tokens.css` (light + dark)
5. Create `src/components/service/{Type}Node.tsx` with unique entry animation
6. Add CSS for `.shape-node--{type}` in `service-nodes.css` (base + active + dark)
7. Register in `nodeTypes` map + `SHAPE_NODE_TYPES` set in `ServiceFlowCanvas.tsx`
8. Add dimensions in `src/components/nodes/dimensions.ts`
9. Export from `src/components/service/index.ts`

## Code Style & Conventions
- Zod schemas in `src/schemas/` with inferred TypeScript types
- Layout constants as `const` objects in schema files
- Node components are memoized with `memo()`
- **ALL CSS colors via token variables** — no hardcoded hex in CSS (outside `tokens.css`)
- **Single token file:** `src/styles/tokens.css` — never create parallel token files
- **`background: white` is banned** — use `var(--color-bg-elevated)`
- **`transition: all` is banned** — always list explicit properties
- **No `console.log` in render paths** — use `console.error`/`console.warn` only for real errors
- No manual node positions in specialized renderers — use layout algorithms (dagre, radial, topological, etc.)
- Step overlay: use `<StepOverlay>` from `src/components/shared/` — never roll custom overlay JSX
