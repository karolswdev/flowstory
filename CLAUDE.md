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
│   ├── service/      # ServiceFlowCanvas + ServiceNode + QueueNode
│   ├── http/         # HttpFlowCanvas + participants
│   ├── pipeline/     # PipelineCanvas + StageNode + JobNode + GateNode
│   ├── bc-deployment/  # BCDeploymentCanvas + BCCoreNode + ArtifactNode
│   ├── bc-composition/ # BCCompositionCanvas + radial layout
│   ├── state-diagram/  # StateDiagramCanvas + dagre layout + UML markers
│   ├── c4-context/     # C4ContextCanvas (SVG)
│   ├── tech-radar/     # TechRadarCanvas (SVG)
│   ├── event-storming/ # EventStormingCanvas (SVG)
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

### MVP Showcase (12 renderers in catalog)

| Renderer | Key | ReactFlow? | Camera | Best For |
|----------|-----|-----------|--------|----------|
| Story Flow | `story-flow` | Yes | legacy | User journeys, generic flows |
| Service Flow | `service-flow` | Yes | useAutoFocus | Microservice choreography |
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
- Easing: `f(t) = 1 - e^(-6t) * cos(3πt)` — cinematic spring-overshoot

### Hooks Barrel (`src/hooks/index.ts`)
Exports: `useCameraController`, `useAutoFocus`, `usePresentationMode`, `useStepNavigation`, `useShareableUrl`

## Step System

Every story has ordered **steps** — the heart of FlowStory. Each step:
- **Reveals** new elements (nodeIds, activeCalls, activeStates, focusNodes, reveal)
- **Narrates** (narrative text + optional speaker)
- **Controls camera** (auto-focus on active nodes, or manual camera YAML)
- **Has timing** (duration in ms for auto-advance)

### Step State Pattern (all ReactFlow renderers)

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
- Dark mode handled automatically via tokens
- CSS: `src/components/shared/step-overlay.css`

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

**service-flow:** `services[] + queues[] + calls[] + steps[{activeCalls}]`
**http-flow:** `participants[] + exchanges[] + steps[{activeExchanges}]`
**pipeline:** `pipeline{} + stages[] + jobs[] + steps[{activeStages, activeJobs, activeGates}]`
**bc-deployment:** `bc{} + artifacts[] + edges[] + steps[{focusNodes, activeEdges, expandNodes}]`
**bc-composition:** `core{} + elements[] + edges[] + steps[{reveal, focus, expand}]`
**state-diagram:** `states[] + transitions[] + phases[] + steps[{activeStates, activeTransitions}]`
**c4-context:** `system{} + people[] + externalSystems[] + relationships[] + steps[{focusNode, highlightNodes}]`

### Narration Patterns
```yaml
narrative: "Inline text"           # Most renderers
narration:                          # bc-deployment, bc-composition, state-diagram
  speaker: Architect
  message: "Detailed explanation"
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
Types: pulse, glow, shake, emoji-explosion, particles, confetti, ripples, bounce, breathe
Triggers: on-reveal, on-focus, on-click, on-hover, continuous, manual

## Dependencies
@xyflow/react ^12.10, motion ^12.33, zod ^4.3, @dagrejs/dagre, elkjs, yaml, jspdf, html-to-image

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
