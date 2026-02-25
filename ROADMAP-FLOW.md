# ROADMAP-FLOW.md — Service Flow Flagship Evolution

> Service-flow is FlowStory's flagship renderer. This roadmap tracks its evolution
> into the richest, most expressive architecture storytelling tool — with 17
> first-class node types and per-node sub-states that animate with each step.

---

## FlowStory Onboarding — Read This First

**What is FlowStory?** A visual, step-based architecture storytelling engine.
Authors write YAML files that describe services, connections, and ordered steps.
FlowStory renders these as animated, interactive diagrams — pan, zoom, step
forward/back — for CTO-ready presentations. React + TypeScript + React Flow +
Motion.

**How stories work:** A YAML story declares *elements* (services, queues, calls,
zones) and *steps*. Each step reveals/activates a subset of elements, shows
narration text, and controls the camera. The user clicks through steps like a
slideshow, but the diagram is live and animated.

**What is service-flow?** One of 13+ renderers. It visualizes microservice
architectures: services as typed nodes (API, database, worker, etc.), calls as
animated edges between them, zones as grouping backgrounds. It's the most
feature-rich renderer and the one we invest in most heavily.

### Key Files You'll Touch

| File | What it does |
|---|---|
| `src/schemas/service-flow.ts` | Zod schemas, type unions, icon/color maps, validation |
| `src/components/service/ServiceFlowCanvas.tsx` | Main canvas — builds React Flow nodes/edges, manages step state, registers node types |
| `src/components/service/ServiceNode.tsx` | The "rectangle" node component (used by `api`, `event-processor`) |
| `src/components/service/{Type}Node.tsx` | Shape-specific node components: `DatabaseNode` (cylinder), `GatewayNode` (diamond), `ExternalNode` (cloud), `WorkerNode` (rounded rect), `WorkflowNode` (pill), `EventBusNode` (hexagon), `CacheNode` (rounded square), `QueueNode` |
| `src/components/service/ServiceCallEdge.tsx` | Custom edge component with labels, state tiers, response arrows, traveling dots |
| `src/components/service/ZoneNode.tsx` | Background grouping rectangles |
| `src/components/service/service-nodes.css` | ALL service-flow CSS — shapes, states, dark mode, edges, zones |
| `src/components/service/index.ts` | Barrel exports |
| `src/components/nodes/dimensions.ts` | `NODE_DIMENSIONS` — width/height per type for smart edge routing |
| `src/styles/tokens.css` | Design tokens (colors, spacing, typography) — single source of truth |
| `src/renderers/specialized.ts` | Registry mapping renderer names to canvas components + schemas |
| `src/components/shared/StepOverlay.tsx` | Shared step info card (glass-blur, bottom-center, used by ALL renderers) |
| `src/hooks/useCameraController.ts` | `useAutoFocus(activeNodeIds, options)` — camera animation hook |
| `src/animations/config.ts` | Core timing constants, easing functions, opacity/saturation states |
| `src/animations/nodeVariants.ts` | 6-state animation pipeline (hidden → entering → active → complete → faded) |
| `src/animations/edgeVariants.ts` | Edge animation states (hidden → drawing → active → complete → faded) |
| `src/effects/` | Pluggable effects system (pulse, glow, shake, emoji-explosion, particles) |
| `stories/service/*.yaml` | Example stories for service-flow |

---

### How a Service Node Renders

```
ServiceFlowCanvas
  → builds `nodes[]` array from `story.services` + `story.queues`
  → each node gets a `type` field matching a key in `nodeTypes` map
  → React Flow renders the matching component
  → the component receives `data` with service definition + state flags
```

Node types map (current):
```ts
const nodeTypes = {
  api: ServiceNode,        // rectangle
  worker: WorkerNode,      // rounded rect
  gateway: GatewayNode,    // diamond
  database: DatabaseNode,  // cylinder
  cache: CacheNode,        // rounded square
  external: ExternalNode,  // dashed cloud
  'event-bus': EventBusNode,    // hexagon
  workflow: WorkflowNode,       // pill
  'event-processor': ServiceNode, // rectangle (shares with api)
  queue: QueueNode,              // separate component
  zone: ZoneNode,                // background group
};
```

---

### Step-Driven Visibility — The 6-Set Pattern (CRITICAL)

This is the **heart of the animation system.** The canvas computes 6+2 sets
from `story.steps[0..currentStepIndex]` in a single `useMemo`. Every visual
decision flows from these sets.

```
┌─────────────────────────────────────────────────────────────┐
│                    Steps 0 .. N                             │
│                                                             │
│  For each step ≤ currentStepIndex:                          │
│    revealedCalls   += step.activeCalls + step.revealCalls   │
│    revealedNodes   += step.revealNodes + call participants  │
│    completedCalls  += (steps < current).activeCalls         │
│    completedNodes  += (steps < current) participants        │
│    activeCalls     = current step's activeCalls ONLY        │
│    activeNodes     = current step's participants ONLY       │
│                                                             │
│  Derived:                                                   │
│    newCallIds = revealedCalls - previouslyRevealedCalls     │
│    newNodeIds = revealedNodes - previouslyRevealedNodes     │
└─────────────────────────────────────────────────────────────┘
```

**What each set controls:**

| Set | Purpose | Visual consequence |
|---|---|---|
| `revealedCallIds` | All calls visible up to now | Determines which edges exist in the DOM |
| `revealedNodeIds` | All nodes visible up to now | Determines which nodes exist in the DOM |
| `activeCallIds` | Calls in THIS step only | Bright edges, traveling dots, thick stroke |
| `activeNodeIds` | Nodes in THIS step only | Glow ring, scale(1.02), brightness boost |
| `completedCallIds` | Calls from past steps | Dimmed edges (opacity 0.5, stroke 1.5) |
| `completedNodeIds` | Nodes from past steps | Faded nodes (opacity 0.55, desaturated) |
| `newCallIds` | First-time-revealed calls | Draw-in animation (stroke-dashoffset) |
| `newNodeIds` | First-time-revealed nodes | Spring-bounce entry (x: -20, scale: 0.8) |

**CRITICAL: Elements not in `revealedNodeIds`/`revealedCallIds` DO NOT EXIST in
the DOM.** They are not hidden — they are absent. The Dagre layout only runs on
revealed participants. This means:

- A node only appears when it's first mentioned in a step's `activeCalls`,
  `revealCalls`, or `revealNodes`
- Once revealed, a node **never disappears** — it fades through states
- The layout recomputes when the revealed set changes (new nodes enter)

Each node component receives these flags in its `data` prop:

```ts
data: {
  ...serviceDef,     // id, name, type, technology, status, tags, etc.
  isActive: boolean, // In activeNodeIds?
  isComplete: boolean, // In completedNodeIds?
  isNew: boolean,    // In newNodeIds? (first-time reveal)
}
```

---

### Node Lifecycle — The 3 States + Entry

Every node on screen is in exactly one of these states:

```
[NOT IN DOM] ──reveal──→ [ENTERING] ──settle──→ [ACTIVE] ──next step──→ [COMPLETE] ──next step──→ [INACTIVE]
                              │                     │                        │                        │
                              │  spring-bounce in   │  glow ring, bright    │  faded, desaturated    │  very faded
                              │  opacity 0 → 1      │  scale 1.02           │  opacity 0.55          │  opacity 0.4
                              │  x: -20 → 0         │  brightness 1.05      │  saturate(50%)         │  saturate(30%)
                              │  scale: 0.8 → 1     │  z-index: 10          │                        │
```

**There is no "hide" transition.** Once revealed, a node stays in the DOM
forever. It only gets progressively more faded. If your story needs a node to
"disappear," use the `inactive` state (opacity 0.4, very desaturated) — which
effectively makes it invisible in a busy diagram.

**Zones** are the exception — they are regenerated on every layout pass and only
appear if at least one of their `members` is in the revealed set.

---

### Node Entry Animations — Per-Shape Personality

Every shape has a unique entry animation that matches its visual character.
**This is critical for new node types — give each shape a distinctive entrance.**

| Shape | `initial` (isNew) | `animate` | Entry feel |
|---|---|---|---|
| **Rectangle** (api) | `{ opacity: 0, x: -20, scale: 0.8 }` | `{ opacity: 1, x: 0, scale: 1 }` | Slide-in from left + scale up |
| **Cylinder** (database) | `{ opacity: 0, scaleY: 0.3, y: 20 }` | `{ opacity: 1, scaleY: 1, y: 0 }` | Grows vertically like filling up |
| **Diamond** (gateway) | `{ opacity: 0, rotate: 45, scale: 0.6 }` | `{ opacity: 1, rotate: 0, scale: 1 }` | Rotates from tilted + scale up |
| **Hexagon** (event-bus) | `{ opacity: 0, scale: 0.5, rotate: -30 }` | `{ opacity: 1, scale: 1, rotate: 0 }` | Spin-in from small |
| **Cloud** (external) | `{ opacity: 0, scale: 0.7, y: -15 }` | `{ opacity: 1, scale: 1, y: 0 }` | Drifts down from above |
| **Rounded rect** (worker) | `{ opacity: 0, x: -20, scale: 0.8 }` | `{ opacity: 1, x: 0, scale: 1 }` | Slide-in (same as rectangle) |
| **Pill** (workflow) | `{ opacity: 0, scaleX: 0.4 }` | `{ opacity: 1, scaleX: 1 }` | Stretches horizontally open |
| **Rounded sq** (cache) | `{ opacity: 0, scale: 0.5, rotate: 90 }` | `{ opacity: 1, scale: 1, rotate: 0 }` | Spins in from quarter-turn |

**Spring transitions for new nodes:**
```tsx
transition={isNew
  ? { type: 'spring', stiffness: 400, damping: 25, mass: 0.8 }  // bouncy
  : { duration: 0.2 }  // instant for re-renders
}
```

**Shape-specific active animations** (continuous while `isActive`):
- **Database:** `y: [0, -2, 0]` — subtle floating bob (3s, infinite)
- **Gateway:** slight brightness boost (no movement — diamond is already bold)
- **All types:** `filter: brightness(1.05)` when active

**REQUIREMENT for new types:** Every new shape node MUST have:
1. A unique `initial` animation matching its visual character
2. A spring transition for `isNew` entries
3. The standard `filter: brightness(1.05)` when active
4. Optionally, a shape-specific continuous active animation

---

### Edge Animations — Draw-In, Traveling Dots, States

Edges have their own animation lifecycle, independent of nodes:

**Edge states (CSS classes):**

| State | Class | Stroke | Opacity | Extra |
|---|---|---|---|---|
| New | `.call-edge-new` | 1.5 | 1 | Draw-in animation (600ms) |
| Active | `.call-edge-active` | 2.5 | 1 | Traveling dots overlay + drop-shadow |
| Complete | `.call-edge-complete` | 1.5 | 0.5 | None |
| Dimmed | `.call-edge-dimmed` | 1 | 0.2 | None |

**Draw-in effect** (new edges):
```css
.call-edge-new {
  stroke-dasharray: 1000;
  stroke-dashoffset: 1000;
  animation: call-edge-draw-in 0.6s ease-out forwards;
}
@keyframes call-edge-draw-in {
  to { stroke-dashoffset: 0; }
}
```

**Traveling dots** (active edges only):
```css
.call-edge-flow-dots {
  stroke-width: 3;
  stroke-linecap: round;
  opacity: 0.7;
  animation: call-edge-flow 0.8s linear infinite;
}
```

Dot patterns vary by call type:
- **sync:** dash `4, 12` — fast, regular
- **async:** dash `3, 10` — slightly slower
- **publish:** dotted pattern
- **subscribe:** dash-dot pattern

**Response edges** (sync call responses): dotted `6, 3`, reversed arrowhead,
0.5 opacity. Only rendered when call has a `response` field.

---

### Effects System — Programmatic Node Effects

Beyond CSS states, nodes can trigger **programmatic effects** via the
`EffectWrapper` component. Effects are composable and trigger-driven.

**Architecture:**
```
EffectWrapper (component)
  → creates effect instances from config[]
  → subscribes to TriggerDispatcher
  → dispatches events on state changes (reveal, focus, blur, click, hover)
  → EffectScheduler picks up events → creates Controllers
  → Controllers animate via Web Animations API or requestAnimationFrame
```

**Built-in effects:**

| Effect | Type | Visual | Default params |
|---|---|---|---|
| `pulse` | CSS | Scale oscillation 1 → 1.1 → 1 | `{ scale: 1.08, duration: 600 }` |
| `glow` | CSS | Pulsing box-shadow with type color | `{ size: 20, intensity: 0.6, duration: 2000 }` |
| `shake` | CSS | Horizontal/vertical tremor | `{ intensity: 0.4, frequency: 6, duration: 500 }` |
| `emoji-explosion` | Canvas | Radiating emoji particles from center | `{ emojis: ['...'], count: 12, duration: 1500 }` |
| `particles` | Canvas | Dots flowing along edge path | `{ count: 5, speed: 1, duration: 2000 }` |

**Trigger types:** `on-reveal`, `on-focus`, `on-blur`, `on-click`, `on-hover`,
`on-step`, `continuous`, `manual`

**How effects are wired in node components:**
```tsx
const effects = useMemo(() => {
  const arr: EffectConfig[] = [];
  if (isNew) {
    arr.push({ type: 'pulse', trigger: 'on-reveal', params: { scale: 1.08, duration: 600 } });
  }
  if (status === 'down') {
    arr.push({ type: 'shake', trigger: 'continuous', params: { intensity: 0.4, frequency: 6 } });
  } else if (status === 'degraded') {
    arr.push({ type: 'pulse', trigger: 'continuous', params: { scale: 1.03, duration: 2000 } });
  }
  return arr;
}, [status, isNew]);

<EffectWrapper nodeId={id} effects={effects} isActive={isActive} isRevealed={!isNew || isActive || isComplete}>
  <motion.div ...>
    {/* node content */}
  </motion.div>
</EffectWrapper>
```

**Performance budget:** Max 10 concurrent effects, max 200 particles, 16ms
frame target. Graceful degradation under load.

**Reduced motion:** Effects respect `prefers-reduced-motion`. Pulse → static
box-shadow. Shake → red border. Emoji → single fade. Particles → skip.

**REQUIREMENT for new types:** Use `EffectWrapper` with status-based effects
(at minimum: pulse on-reveal when new, shake when down, pulse when degraded).
Shape-specific effects are encouraged — e.g., a `firewall` could glow red
when `status: down`, a `scheduler` could pulse rhythmically when active.

---

### Camera System — Spring-Overshoot Auto-Focus

**MANDATORY for all ReactFlow renderers.** The camera smoothly animates to keep
active nodes in view.

**Easing function:**
```
f(t) = 1 - e^(-6t) * cos(3πt)
```
This creates a cinematic **spring-overshoot** — accelerates, overshoots by ~8%
at t≈0.55, then settles back. Much more alive than linear or ease-out.

**Canonical pattern:**
```tsx
function MyCameraController({ activeNodeIds }: { activeNodeIds: string[] }) {
  useAutoFocus(activeNodeIds, {
    padding: 100,   // px around focus area
    duration: 600,  // ms animation
    maxZoom: 1.3,
    minZoom: 0.4,
  });
  return null;
}

// MUST be a child of <ReactFlow>:
<ReactFlow nodes={nodes} edges={edges} nodeTypes={nodeTypes}>
  <Background />
  <MyCameraController activeNodeIds={focusNodeIds} />
</ReactFlow>
```

**Focus target priority:** If the step has explicit `focusNodes`, those are
used. Otherwise, the camera targets all `activeNodeIds` (participants in
active calls).

---

### StepOverlay — Animated Step Info Card

The StepOverlay is a shared component used by ALL renderers. It animates
between steps using `AnimatePresence`:

```tsx
<AnimatePresence mode="wait">
  <motion.div
    key={stepIndex}         // Key change triggers unmount → remount
    initial={{ opacity: 0, y: 16 }}    // Slide up from below
    animate={{ opacity: 1, y: 0 }}     // Settle into place
    exit={{ opacity: 0, y: -8 }}       // Slide down on exit
    transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
  >
```

**Lifecycle:** Old overlay slides down (exit) → new overlay slides up (enter).
Both animations run in parallel (`mode="wait"` ensures exit completes before
enter starts).

---

### Animation Timing Constants (`src/animations/config.ts`)

These are the canonical timing values. Use them — don't invent your own.

| Constant | Value | Used for |
|---|---|---|
| `nodeEntry` | 300ms | Node appear animation |
| `nodeStagger` | 80ms | Delay between sequential node entries |
| `edgeDraw` | 400ms | Edge draw-in stroke animation |
| `edgeDelay` | 50ms | Delay after nodes before edges start |
| `stateTransition` | 200ms | Active → complete transition |
| `fadeDuration` | 400ms | Complete → faded transition |
| `glowPulse` | 1500ms | Glow effect cycle |
| `totalStepTransition` | ~1600ms | Full step transition sequence |

**Easing presets:**
- `easeOutCubic`: `[0.4, 0, 0.2, 1]` — smooth deceleration
- `spring`: `{ stiffness: 400, damping: 30, mass: 1 }` — natural bounce
- `bouncySpring`: `{ stiffness: 500, damping: 25, mass: 0.8 }` — dramatic entries

**Opacity states:** hidden=0, entering/active=1, complete=0.7, faded=0.4
**Saturation:** active=100%, complete=80%, faded=50%

---

### Step Transition Choreography — The Full Sequence

When the user clicks "next step," here's what happens in order:

```
Time 0ms      ┌─ Previous active nodes → "complete" (opacity 0.55, desat)
              ├─ Previous active edges → "complete" (opacity 0.5, stroke 1.5)
              └─ StepOverlay exits (fade out + slide down, 250ms)

Time 200ms    ┌─ New nodes enter DOM (spring-bounce, staggered 80ms apart)
              ├─ Layout recomputes if new nodes appeared
              └─ Camera begins spring-overshoot to new focus area

Time 500ms    ┌─ New edges draw in (stroke-dashoffset animation, 600ms)
              └─ Traveling dots activate on active edges

Time 700ms    ┌─ Effects trigger (pulse on-reveal for new nodes)
              └─ StepOverlay enters (fade in + slide up, 250ms)

Time 1600ms   └─ All animations settled. Ready for next step.
```

**Backward navigation** works the same way — sets recompute for
`currentStepIndex - 1`, elements that were "new" at that step get their entry
animations replayed, and the camera re-targets.

---

### How to Control Visibility in YAML

**Reveal a node for the first time (spring-bounce entry):**
```yaml
steps:
  - id: step-2
    revealNodes: [inventory, cache]     # These nodes enter the DOM
    activeCalls: [check-inventory]      # This edge + its endpoints become active
```

**Keep a previously-revealed edge visible but dimmed:**
```yaml
steps:
  - id: step-3
    activeCalls: [save-order]           # New active edge
    revealCalls: [create-order, check-inventory]  # Keep these visible (complete state)
```

**Focus the camera on specific nodes (override auto-focus):**
```yaml
steps:
  - id: step-3
    focusNodes: [inventory]             # Camera zooms to this node only
    activeCalls: [check-inventory]
```

**Effectively "hide" a node (make it near-invisible):**
There is no explicit "hide" in the schema. But a revealed node that is neither
active nor in `revealNodes`/`revealCalls` of any subsequent step becomes
`inactive` — opacity 0.4, saturate(0.3). In a diagram with 10+ nodes, this
is effectively invisible. If you need a node to be visually prominent in one
step and gone in the next, stop including it in `revealNodes`/`revealCalls`
and the visual system handles the rest.

**Progressive revelation pattern (most common):**
```yaml
steps:
  - id: step-1                          # Reveal: A, B. Active: A→B
    activeCalls: [a-to-b]
  - id: step-2                          # Reveal: C. Active: B→C. A→B dimmed.
    activeCalls: [b-to-c]
    revealCalls: [a-to-b]               # Keep A→B visible (not invisible)
  - id: step-3                          # Reveal: D. Active: C→D. A→B, B→C dimmed.
    activeCalls: [c-to-d]
    revealCalls: [a-to-b, b-to-c]       # Keep both visible
```

Without `revealCalls`, previous edges become `dimmed` (opacity 0.2) rather than
`complete` (opacity 0.5). Use `revealCalls` to keep the "trail" visible.

---

### Building Rich, Storytelling Node Components

When building a new node type, think of it as a **character in a story**, not
a box on a diagram. Every node type should:

1. **Enter with personality** — the entry animation should match the shape's
   visual metaphor (cylinder grows tall, diamond rotates in, circle pops in)

2. **Show its state** — active nodes glow, complete nodes fade, degraded nodes
   pulse, down nodes shake. Use `EffectWrapper` for programmatic effects.

3. **Carry information density** — name, type pill, technology, version, status
   dot, instance badge, tags. All optional, all animated.

4. **Respond to interaction** — hover lifts the node (`translateY(-1px)`),
   active hover lifts more. The node feels alive.

5. **Support dark mode** — all colors via tokens, `[data-theme="dark"]` CSS
   overrides for backgrounds, borders, text colors.

**Component template for a new shape node:**
```tsx
import { motion } from 'motion/react';
import { memo, useMemo } from 'react';
import { NodeHandles } from '../nodes/NodeHandles';
import { NodeTags } from '../shared';
import { EffectWrapper } from '../../effects';
import { SERVICE_TYPE_ICONS, STATUS_COLORS } from '../../schemas/service-flow';
import type { ServiceNodeData } from './ServiceNode';
import type { EffectConfig } from '../../effects';

function buildEffects(status, isNew): EffectConfig[] {
  const effects: EffectConfig[] = [];
  if (isNew) effects.push({ type: 'pulse', trigger: 'on-reveal', params: { scale: 1.08, duration: 600 } });
  if (status === 'down') effects.push({ type: 'shake', trigger: 'continuous', params: { intensity: 0.4, frequency: 6 } });
  if (status === 'degraded') effects.push({ type: 'pulse', trigger: 'continuous', params: { scale: 1.03, duration: 2000 } });
  return effects;
}

export const MyTypeNode = memo(function MyTypeNode({ data }: { data: ServiceNodeData }) {
  const { id, name, type, technology, status, isActive = false, isComplete = false, isNew = false } = data;
  const Icon = SERVICE_TYPE_ICONS[type];
  const stateClass = isActive ? 'active' : isComplete ? 'complete' : 'inactive';
  const effects = useMemo(() => buildEffects(status, isNew), [status, isNew]);

  return (
    <EffectWrapper nodeId={id} effects={effects} isActive={isActive} isRevealed={!isNew || isActive || isComplete}>
      <motion.div
        className={`shape-node shape-node--my-type shape-node--${stateClass}`}
        initial={isNew ? { /* UNIQUE ENTRY for this shape */ } : { opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1, filter: isActive ? 'brightness(1.05)' : 'brightness(1)' }}
        transition={isNew ? { type: 'spring', stiffness: 400, damping: 25, mass: 0.8 } : { duration: 0.2 }}
      >
        <NodeHandles />
        <div className="shape-node__body">
          <span className="shape-node__icon-badge" style={{ background: SERVICE_TYPE_COLORS[type] }}>
            {Icon && <Icon size={16} strokeWidth={2} />}
          </span>
          <span className="shape-node__name">{name}</span>
          {technology && <span className="shape-node__tech">{technology}</span>}
        </div>
        <NodeTags tags={data.tags} />
      </motion.div>
    </EffectWrapper>
  );
});
```

---

### Pattern for Adding a New Service Type (Complete Checklist)

1. Add the type string to `SERVICE_TYPES` in `src/schemas/service-flow.ts`
2. Add an icon to `SERVICE_TYPE_ICONS` (import from `lucide-react`)
3. Add a color to `SERVICE_TYPE_COLORS`
4. Add `--svc-border-{type}: {color}` CSS custom property in `src/styles/tokens.css`
5. Create `src/components/service/{Type}Node.tsx`:
   - Use `shape-node` CSS pattern
   - Wrap in `EffectWrapper` with status-based effects
   - Use `motion.div` with unique `initial` animation for the shape
   - Include `NodeHandles` for edge connections
   - Include `NodeTags` for metadata display
   - Memo-wrap the component
6. Add CSS for `.shape-node--{type}` in `service-nodes.css`:
   - Base shape (clip-path, border-radius, border, background)
   - `.shape-node--{type} .shape-node__icon-badge { background: var(--svc-border-{type}); }`
   - `.shape-node--{type}.shape-node--active { /* glow/shadow */ }`
   - `[data-theme="dark"]` overrides
7. Register in `nodeTypes` map in `ServiceFlowCanvas.tsx`
8. Add dimensions in `src/components/nodes/dimensions.ts`
9. Export from `src/components/service/index.ts`

### Conventions

- **All CSS colors via token variables** — no hardcoded hex outside `tokens.css`
- **`background: white` is banned** — use `var(--color-bg-elevated)`
- **`transition: all` is banned** — list explicit properties
- **Zod schemas are the source of truth** — TypeScript types are inferred
- **Node components are `memo()`-wrapped**
- **Camera: `useAutoFocus`** is mandatory for all ReactFlow renderers
- **Step overlay: `<StepOverlay>`** from `src/components/shared/` — never roll custom
- **Every shape needs a unique entry animation** — matches its visual metaphor
- **Every shape needs `EffectWrapper`** — at minimum: pulse on-reveal, shake on down
- **Every shape needs dark mode CSS** — `[data-theme="dark"]` overrides

For full project instructions, see `CLAUDE.md` in the project root.

---

## The Problem

Service-flow currently has **9 service types** — and they're excellent for
microservice choreography. But when we sit down to explain a real system to a CTO,
we keep hitting walls:

| What we need to show | What we type today | Why it hurts |
|---|---|---|
| "The driver's mobile app initiates..." | `type: external` | Looks like a 3rd-party API, not a human actor |
| "Nightly at 9PM, Conductor fires..." | `type: workflow` + narrative | No visual trigger — the "why now?" is invisible |
| "Traffic hits the WAF first..." | Nothing / `type: gateway` | Security layers are invisible or merged with routing |
| "PagerDuty fires a P1 alert..." | `type: external` | Monitoring looks like any other cloud service |
| "A dispatcher must approve the rescue..." | `type: workflow` + narrative | Human-in-the-loop is the **hardest** thing to show |
| "The PDF is stored in Azure Blob..." | `type: database` | Blob storage is NOT a database — different semantics |
| "An Azure Function processes the webhook..." | `type: worker` | Serverless is ephemeral; a worker is persistent |
| "NGINX distributes across 3 instances..." | `type: gateway` | Load balancing ≠ API routing |

And even when we have the right node type, nodes are **static** between steps.
A Conductor workflow node looks the same whether it's idle, running, waiting for
a human, or compensating. The rescue `human-task` looks identical whether the
dispatcher is reviewing or has already escalated. The story is in the narration
text — not on the nodes themselves.

### The Orkes/Conductor storytelling problem

Explaining Conductor to stakeholders is hard because it does several very
different things:

1. **Orchestrates** — calls HTTP endpoints on your services (arrows FROM Conductor)
2. **Schedules** — triggers workflows on a cron schedule (time-initiated)
3. **Decides** — SWITCH tasks route to different branches conditionally
4. **Waits for humans** — HUMAN_TASK pauses until a person approves/acts
5. **Compensates** — runs rollback workflows on failure
6. **Forks/Joins** — parallel execution with synchronization

Today, all of this collapses into a single `type: workflow` pill shape. We need
richer vocabulary — and those nodes need to **show their internal state** as the
story progresses.

---

## The 8 New Service Types

After deep analysis of 30+ catalyst stories, the Conductor worker patterns, and
the pain points above, here are the 8 new types — chosen to maximize visual
distinctiveness while staying within "8 max" discipline.

### 1. `client` — The Human Actor

**Why:** Every architecture story starts with someone or something initiating.
Trip HQ, Driver App, Browser, Mobile, "the parent calls the hotline." Currently
all forced into `external`, which looks like a cloud API.

| Property | Value |
|---|---|
| Icon | `Monitor` (lucide) |
| Color | Indigo `#6366F1` |
| Shape | Rounded card with top-centered avatar silhouette accent |
| CSS class | `.shape-node--client` |
| Visual | Distinct from `external` (dashed cloud). Solid border, person-badge top-left |
| Use when | The node represents a human user, UI application, device, or browser |

```yaml
services:
  - id: trip-hq
    name: Trip HQ
    type: client
    technology: "React SPA"
  - id: driver-app
    name: Driver App
    type: client
    technology: "React Native"
```

---

### 2. `firewall` — The Security Boundary

**Why:** Security layers are architecturally critical but currently invisible.
WAF, Kubernetes network policies, API security gateways, rate limiters — these
are the first thing traffic hits and the last line of defense.

| Property | Value |
|---|---|
| Icon | `ShieldCheck` (lucide) |
| Color | Rose `#F43F5E` |
| Shape | Octagon (stop-sign silhouette via `clip-path`) |
| CSS class | `.shape-node--firewall` |
| Visual | 8-sided, immediately reads as "security checkpoint" |
| Use when | WAF, firewall, network policy, rate limiter, auth gateway |

```yaml
services:
  - id: waf
    name: Azure WAF
    type: firewall
    technology: "Azure Front Door"
    status: healthy
```

---

### 3. `load-balancer` — The Traffic Distributor

**Why:** Load balancing is one of the most fundamental infrastructure patterns,
yet it's currently merged into `gateway`. An API Gateway routes by path/header;
a load balancer distributes by algorithm (round-robin, least-connections, etc.).
These are different architectural decisions.

| Property | Value |
|---|---|
| Icon | `Network` (lucide) |
| Color | Teal `#14B8A6` |
| Shape | Inverted trapezoid (wider top, narrower bottom — "funnel") |
| CSS class | `.shape-node--load-balancer` |
| Visual | Funnel shape communicates "many-to-few" or "few-to-many" distribution |
| Use when | NGINX, HAProxy, Azure Load Balancer, K8s Ingress, ALB/NLB |

```yaml
services:
  - id: ingress
    name: K8s Ingress
    type: load-balancer
    technology: "NGINX Ingress"
    instances: 2
```

---

### 4. `scheduler` — The Time Trigger

**Why:** This is the **biggest gap** for Conductor storytelling. "Day-5 at 9PM,
the SGR workflow fires" — but there's no visual node for the trigger. The
scheduler is a distinct architectural element: it's not a service (it doesn't
handle requests), not a worker (it doesn't process tasks), not a workflow (it
doesn't orchestrate). It *initiates*.

| Property | Value |
|---|---|
| Icon | `Clock` (lucide) |
| Color | Amber `#D97706` |
| Shape | Circle (universal "clock" / "timer" shape) |
| CSS class | `.shape-node--scheduler` |
| Visual | Perfectly circular, clock icon centered — unmistakable |
| Use when | Cron jobs, Conductor schedules, Hangfire, CloudWatch Events, Azure Timer Triggers |

```yaml
services:
  - id: nightly-trigger
    name: "SGR Schedule"
    type: scheduler
    technology: "Conductor Scheduler"
    tags:
      schedule: "Day-5 @ 9PM"
```

---

### 5. `storage` — The Object/Blob Store

**Why:** Blob storage (S3, Azure Blob, SFTP directories) is architecturally
different from a database. Databases have schemas, transactions, queries.
Storage has buckets, keys, and bytes. Forcing both into `type: database` loses
this distinction.

| Property | Value |
|---|---|
| Icon | `HardDrive` (lucide) |
| Color | Stone `#78716C` (shared family with database, lighter tone) |
| Shape | Wide/squat cylinder (horizontally wider, shorter than database cylinder) |
| CSS class | `.shape-node--storage` |
| Visual | Same cylinder family as database but proportionally distinct — wider, shorter |
| Use when | S3, Azure Blob, file systems, SFTP, document stores, image buckets |

```yaml
services:
  - id: blob
    name: Azure Blob Storage
    type: storage
    technology: "Azure Blob"
    tags:
      container: "trip-documents"
```

---

### 6. `function` — Serverless Compute

**Why:** Serverless functions are fundamentally different from workers and APIs.
They're ephemeral (cold start), event-driven (not polling), auto-scaled
(including to zero), and billed per invocation. A `worker` is a long-running
process; a `function` is a flash of computation.

| Property | Value |
|---|---|
| Icon | `Cpu` (lucide) |
| Color | Orange `#EA580C` |
| Shape | Parallelogram (slanted rectangle via `clip-path` / `transform: skewX`) |
| CSS class | `.shape-node--function` |
| Visual | The angular slant communicates "ephemeral / transient / different" |
| Use when | AWS Lambda, Azure Functions, Cloud Run, webhook processors, event-driven compute |

```yaml
services:
  - id: pdf-gen
    name: PDF Generator
    type: function
    technology: "Azure Function"
    tags:
      trigger: "HTTP"
      runtime: ".NET 10"
```

---

### 7. `monitor` — Observability & Alerting

**Why:** Monitoring is the nervous system of any production architecture. Every
catalyst story mentions PagerDuty alerts, Prometheus metrics, or Grafana
dashboards — but they're invisible or typed as `external`. Making monitoring a
first-class type lets us show the **feedback loop**: service → metrics →
alert → human.

| Property | Value |
|---|---|
| Icon | `BarChart3` (lucide) |
| Color | Emerald `#10B981` |
| Shape | Rounded rectangle with subtle chart-line decoration (top-border + sparkline CSS) |
| CSS class | `.shape-node--monitor` |
| Visual | Chart accent on the top edge distinguishes it from plain rectangles |
| Use when | PagerDuty, Prometheus, Grafana, DataDog, Azure Monitor, Application Insights |

```yaml
services:
  - id: pagerduty
    name: PagerDuty
    type: monitor
    technology: "PagerDuty"
    tags:
      integration: "Events API v2"
```

---

### 8. `human-task` — The Human-in-the-Loop

**Why:** This is the **second most critical** type for Conductor storytelling
(after `scheduler`). Conductor's HUMAN_TASK is a first-class concept — the
workflow pauses, assigns a task to a human, and waits. The 5-tier rescue
escalation (None → Dispatcher → Supervisor → OpsManager → Exhausted) is a
chain of human tasks. Currently, this is invisible — hidden in narrative text.

| Property | Value |
|---|---|
| Icon | `UserCheck` (lucide) |
| Color | Pink `#EC4899` |
| Shape | Rounded card with a person-check badge (top-right corner badge like multi-instance) |
| CSS class | `.shape-node--human-task` |
| Visual | Clearly reads as "a person needs to do something here" |
| Use when | Conductor HUMAN_TASK, approval gates, manual dispatch, review steps |

```yaml
services:
  - id: dispatch-approval
    name: Dispatcher Approval
    type: human-task
    technology: "Conductor Human Task"
    tags:
      timeout: "15min"
      escalation: "Supervisor"
```

---

## Node Sub-States — Per-Step Micro State Machines

### The Idea

Every service node can optionally declare a set of **sub-states** — named
internal states that the step system can set, advance, or revert as the story
progresses. A sub-state renders as a **small animated pill badge** inside the
node, showing what that node is *doing right now* at this point in the story.

This turns static nodes into **living participants** in the narrative.

### What It Looks Like

```
Step 1:  Conductor shows [idle]      Human Task shows [—]
Step 2:  Conductor shows [running]   Human Task shows [pending]
Step 3:  Conductor shows [waiting]   Human Task shows [assigned]
Step 4:  Conductor shows [running]   Human Task shows [approved] ✓
Step 5:  Conductor shows [completed] Human Task shows [completed] ✓
```

The badge animates on transition — crossfade text, color shift, optional pulse.
The node's visual weight subtly changes with its sub-state (e.g., a `failed`
sub-state could add a red tint to the border).

### Schema Design

**On the service definition** — declare available sub-states:

```yaml
services:
  - id: conductor
    name: Conductor
    type: workflow
    technology: "Orkes Conductor"
    substates:
      - idle            # gray — nothing happening
      - running         # blue — actively orchestrating
      - waiting         # amber — paused, waiting for external signal
      - compensating    # red — running rollback
      - completed       # green — finished successfully
      - failed          # red — terminal failure
    initialSubstate: idle   # optional, defaults to first in list

  - id: dispatch-approval
    name: Dispatcher Approval
    type: human-task
    substates:
      - pending         # gray — task created, not yet assigned
      - assigned        # blue — dispatcher is looking at it
      - reviewing       # amber — actively being reviewed
      - approved        # green — human said yes
      - rejected        # red — human said no
      - escalated       # orange — bumped to next tier
    initialSubstate: pending

  - id: rescue-db
    name: PostgreSQL
    type: database
    substates: [idle, reading, writing, locked, committed]
```

**On the step definition** — set sub-states for any node:

```yaml
steps:
  - id: step-1
    title: "Workflow Triggered"
    activeCalls: [trigger-workflow]
    substates:
      conductor: running
      rescue-db: idle

  - id: step-2
    title: "Human Approval Required"
    activeCalls: [send-to-dispatcher]
    substates:
      conductor: waiting          # pauses orchestration
      dispatch-approval: assigned # dispatcher sees the task

  - id: step-3
    title: "Dispatcher Approves"
    activeCalls: [accept-rescue]
    substates:
      conductor: running          # resumes orchestration
      dispatch-approval: approved # human acted

  - id: step-4
    title: "Saga Fails — Compensation"
    activeCalls: [compensation-revert]
    substates:
      conductor: compensating     # rollback mode
      rescue-db: writing          # reverting data
```

### Sub-State Persistence Rules

1. **Sticky by default** — if step N sets `conductor: running` and step N+1
   doesn't mention `conductor`, it stays `running`. Sub-states persist until
   explicitly changed.

2. **Clear with `~` or `null`** — to remove a sub-state badge entirely:
   ```yaml
   substates:
     conductor: ~    # badge disappears
   ```

3. **Backward navigation** — when the user clicks "back," sub-states revert
   to whatever the previous step set (or inherited). The sub-state at any step
   is computed by walking steps 0..N and applying each `substates` map.

4. **No sub-states = no badge** — services without `substates` defined work
   exactly as they do today. Purely additive.

### Sub-State Visual Design

**Badge placement:** Bottom-right of the node, inside the border. Small pill
(similar to the type-pill but positioned differently).

**Badge anatomy:**
```
┌─────────────────────────┐
│ 🔧  Order Service    v2 │  ← header (icon, name, version)
│ [api] Node.js           │  ← details (type pill, tech)
│                 [writing]│  ← sub-state badge (bottom-right)
└─────────────────────────┘
```

**Color mapping** — sub-state badge color is derived from semantic keywords:

| Keyword patterns | Color | Hex |
|---|---|---|
| idle, inactive, off, none | Gray | `#9CA3AF` |
| pending, queued, waiting, paused | Amber | `#F59E0B` |
| running, active, processing, assigned | Blue | `#3B82F6` |
| reading, fetching, querying | Cyan | `#06B6D4` |
| writing, inserting, updating, committing | Purple | `#A855F7` |
| completed, done, approved, success, committed | Green | `#22C55E` |
| failed, error, rejected, down | Red | `#EF4444` |
| escalated, warning, degraded, compensating | Orange | `#F97316` |
| locked, blocked, throttled | Rose | `#F43F5E` |
| *fallback (no keyword match)* | Type color | `SERVICE_TYPE_COLORS[type]` |

The matching is **prefix-based** — `"writing txn"` matches `writing` → purple.
This means authors can write descriptive sub-state names like `"writing outbox"`
and still get correct colors automatically.

**Animations:**
- **On change:** crossfade (old text fades out, new fades in) — 200ms
- **On first appear:** scale-in from 0 — 300ms with spring
- **On remove (`~`):** scale-out to 0 — 200ms ease-out
- **Color transition:** smooth 300ms via CSS `transition: background-color, color`
- **Optional pulse:** brief 1.05x scale pulse when sub-state changes (settles in 400ms)

### Sub-State on Shape Nodes

For non-rectangular shapes (cylinder, hexagon, diamond, circle, etc.), the
badge is positioned **below the shape** as a floating pill, connected by a
subtle 1px line or just proximity:

```
     ╱╲
    ╱    ╲
   ╱ Gate  ╲       ← diamond gateway shape
    ╲    ╱
     ╲╱
   [routing]        ← sub-state badge floats below
```

### Why This Matters for Conductor

Without sub-states, a Conductor story reads like:
> "Conductor is running... now it's waiting... now it's compensating..."
> (all in narrative text, the node looks identical)

With sub-states, the **node itself tells the story**:
- The `workflow` pill shows `[running]` → `[waiting]` → `[running]` → `[completed]`
- The `human-task` card shows `[pending]` → `[assigned]` → `[approved]`
- The `database` cylinder shows `[idle]` → `[writing]` → `[committed]`

The CTO can **see** the state machine progressing without reading the narration.
The narration adds context; the visuals carry the structure.

---

## Updated Type Census

### Before (9 types, no sub-states)

| Type | Shape | Color |
|------|-------|-------|
| `api` | Rectangle | Blue #3B82F6 |
| `worker` | Rounded rect | Purple #A855F7 |
| `gateway` | Diamond | Amber #F59E0B |
| `database` | Cylinder (tall) | Stone #78716C |
| `cache` | Rounded square | Cyan #06B6D4 |
| `external` | Dashed cloud/pill | Slate #64748B |
| `event-bus` | Hexagon | Orange #F97316 |
| `workflow` | Pill/stadium | Pink #EC4899 |
| `event-processor` | Rectangle (variant) | Violet #8B5CF6 |

### After (17 types + sub-states)

| Type | Shape | Color | New? |
|------|-------|-------|------|
| `api` | Rectangle | Blue #3B82F6 | |
| `worker` | Rounded rect | Purple #A855F7 | |
| `gateway` | Diamond | Amber #F59E0B | |
| `database` | Cylinder (tall) | Stone #78716C | |
| `cache` | Rounded square | Cyan #06B6D4 | |
| `external` | Dashed cloud/pill | Slate #64748B | |
| `event-bus` | Hexagon | Orange #F97316 | |
| `workflow` | Pill/stadium | Pink #EC4899 | |
| `event-processor` | Rectangle (variant) | Violet #8B5CF6 | |
| **`client`** | **Card + avatar** | **Indigo #6366F1** | **NEW** |
| **`firewall`** | **Octagon** | **Rose #F43F5E** | **NEW** |
| **`load-balancer`** | **Inverted trapezoid** | **Teal #14B8A6** | **NEW** |
| **`scheduler`** | **Circle** | **Amber #D97706** | **NEW** |
| **`storage`** | **Wide cylinder** | **Stone #A8A29E** | **NEW** |
| **`function`** | **Parallelogram** | **Orange #EA580C** | **NEW** |
| **`monitor`** | **Rect + chart accent** | **Emerald #10B981** | **NEW** |
| **`human-task`** | **Card + person badge** | **Pink #EC4899** | **NEW** |

> **Shape is the primary discriminator, color is secondary.** All 17 shapes are
> unique — colorblind-safe by design. Some color overlap is intentional within
> families (e.g., storage/database share stone, scheduler/gateway share amber).

---

## Delivery Phases

### Phase 1: Schema & Type Registry

**Deliverables:**

- [ ] **P1.1** — Update `SERVICE_TYPES` array in `src/schemas/service-flow.ts` — add 8 new type values
- [ ] **P1.2** — Add `SERVICE_TYPE_ICONS` entries for all 8 (lucide imports: `Monitor`, `ShieldCheck`, `Network`, `Clock`, `HardDrive`, `Cpu`, `BarChart3`, `UserCheck`)
- [ ] **P1.3** — Add `SERVICE_TYPE_COLORS` entries for all 8
- [ ] **P1.4** — Add `--svc-border-*` CSS custom properties in `src/styles/tokens.css` for all 8

**Files touched:**
- `src/schemas/service-flow.ts`
- `src/styles/tokens.css`

---

### Phase 2: Sub-State Schema

**Deliverables:**

- [ ] **P2.1** — Add `substates` optional array to `ServiceDefSchema` (list of allowed sub-state names)
- [ ] **P2.2** — Add `initialSubstate` optional string to `ServiceDefSchema`
- [ ] **P2.3** — Add `substates` optional record `Record<string, string | null>` to `ServiceFlowStepSchema`
- [ ] **P2.4** — Add Zod superRefine validation: step substates reference only declared service IDs, and values are in the service's `substates` list (if defined)
- [ ] **P2.5** — Export `SubstateColorMap` constant and `getSubstateColor(substateName: string, fallbackColor: string)` helper
- [ ] **P2.6** — Compute `resolvedSubstates: Map<string, string | null>` in canvas by walking steps 0..currentStepIndex

**Files touched:**
- `src/schemas/service-flow.ts`

---

### Phase 3: Shape Node Components (8 new types)

Each new type gets its own shape component following the existing pattern.

**Deliverables:**

- [ ] **P3.1** — `ClientNode.tsx` — solid-border card with avatar silhouette CSS pseudo-element
- [ ] **P3.2** — `FirewallNode.tsx` — `clip-path: polygon(...)` octagon (8 vertices)
- [ ] **P3.3** — `LoadBalancerNode.tsx` — `clip-path` inverted trapezoid
- [ ] **P3.4** — `SchedulerNode.tsx` — `border-radius: 50%` circle
- [ ] **P3.5** — `StorageNode.tsx` — wide/squat cylinder (reuse database cylinder, wider proportions)
- [ ] **P3.6** — `FunctionNode.tsx` — `clip-path` parallelogram with counter-skew on content
- [ ] **P3.7** — `MonitorNode.tsx` — rounded rect with sparkline accent on top border
- [ ] **P3.8** — `HumanTaskNode.tsx` — rounded card with person-check corner badge
- [ ] **P3.9** — CSS for all 8 in `service-nodes.css`: base, active, complete, inactive, dark mode
- [ ] **P3.10** — Register all 8 in `ServiceFlowCanvas.tsx` `nodeTypes` map
- [ ] **P3.11** — Add dimensions for all 8 in `src/components/nodes/dimensions.ts`

**Files touched:**
- `src/components/service/` (8 new `.tsx` files)
- `src/components/service/service-nodes.css`
- `src/components/service/ServiceFlowCanvas.tsx`
- `src/components/service/index.ts`
- `src/components/nodes/dimensions.ts`

---

### Phase 4: Sub-State Visual Rendering

**Deliverables:**

- [ ] **P4.1** — `SubstateBadge.tsx` — shared component: animated pill badge with semantic color
- [ ] **P4.2** — Integrate `SubstateBadge` into `ServiceNode.tsx` (rectangular types)
- [ ] **P4.3** — Integrate `SubstateBadge` into all shape node components (position: below shape for non-rect)
- [ ] **P4.4** — Crossfade animation on sub-state text change (AnimatePresence mode="wait")
- [ ] **P4.5** — Scale-in/scale-out animation on badge appear/disappear
- [ ] **P4.6** — Color transition animation (300ms smooth)
- [ ] **P4.7** — Optional border tint when sub-state is `failed`/`error`/`down` (subtle red glow)
- [ ] **P4.8** — CSS for sub-state badge in `service-nodes.css` (base + dark mode)
- [ ] **P4.9** — Wire `resolvedSubstates` from canvas through to node `data` prop

**Files touched:**
- `src/components/service/SubstateBadge.tsx` (new)
- `src/components/service/ServiceNode.tsx`
- `src/components/service/ServiceFlowCanvas.tsx`
- `src/components/service/service-nodes.css`
- All shape node components (database, cache, gateway, external, worker, workflow, event-bus + 8 new)

---

### Phase 5: Demo Stories

**Deliverables:**

- [ ] **P5.1** — `stories/service/conductor-orchestration.yaml` — Showcase story using all 8 new types + sub-states in a Conductor rescue orchestration narrative
- [ ] **P5.2** — `stories/service/order-processing.yaml` — Update with sub-states on key nodes (database: idle→writing→committed, cache: idle→reading)
- [ ] **P5.3** — `stories/service/payment-platform.yaml` — Update with `client`, `firewall`, `function` and sub-states

**Files touched:**
- `stories/service/conductor-orchestration.yaml` (new)
- `stories/service/order-processing.yaml` (update)
- `stories/service/payment-platform.yaml` (update)

---

### Phase 6: Catalyst Story Migration

Retroactively update catalyst stories to use new types and sub-states.

**Deliverables:**

- [ ] **P6.1** — Audit all `stories/catalyst/*.yaml` for `type: external` that should be `client`
- [ ] **P6.2** — Audit for `type: workflow` (Conductor) stories — add `scheduler` and `human-task` nodes
- [ ] **P6.3** — Update rescue orchestration saga: `human-task` for dispatch approval + sub-states for escalation tiers
- [ ] **P6.4** — Update SGR generation: `scheduler` for nightly trigger + sub-states for Conductor lifecycle
- [ ] **P6.5** — Update identity-access: `firewall` for K8s network policy, `client` for admin UI

**Files touched:**
- ~15 catalyst YAML files

---

### Phase 7: Documentation

**Deliverables:**

- [ ] **P7.1** — Update `CLAUDE.md` with new type census, colors, icons, shapes, sub-state system
- [ ] **P7.2** — Update `docs/service-flow-mastery.md` with authoring guidance for new types + sub-states
- [ ] **P7.3** — Update auto-memory `MEMORY.md`
- [ ] **P7.4** — Mark this roadmap phases complete

---

## Design Principles

1. **Shape is king** — every type must be instantly recognizable by shape alone
   (colorblind-safe). 17 types = 17 unique shapes.

2. **Color is secondary** — reinforces shape recognition. Some color overlap is
   fine if shapes differ (circle ≠ diamond, even if both amber).

3. **Sub-states are optional** — services without `substates` work exactly as
   today. Zero breaking changes. The feature is purely additive.

4. **Sub-states are sticky** — once set, they persist until explicitly changed.
   No need to repeat `conductor: running` on every step.

5. **Semantic colors are automatic** — authors write `running` and get blue,
   `failed` and get red. No manual color configuration needed.

6. **Same component pattern** — new types follow `shape-node--{type}` CSS
   pattern with icon-badge, name, tech, and three-tier state classes.

7. **Backward compatible** — existing YAML files continue to work unchanged.

8. **Conductor-first** — `scheduler`, `human-task`, and sub-states were chosen
   specifically because they're the hardest Conductor concepts to visualize.

---

## Decision Log

| Date | Decision | Rationale |
|---|---|---|
| 2026-02-23 | Max 8 new types | Discipline — 17 total is the sweet spot. More creates cognitive overload. |
| 2026-02-23 | `client` over `actor`/`user` | "Client" is the standard C4 term and doesn't imply only human actors |
| 2026-02-23 | `human-task` over `decision`/`gate` | Conductor-specific. Decisions can be workflow branches; human tasks cannot. |
| 2026-02-23 | `function` over `lambda` | Vendor-neutral. Works for Azure Functions, Lambda, Cloud Run, etc. |
| 2026-02-23 | `storage` shares stone with `database` | Same "data layer" family, different shapes and tones |
| 2026-02-23 | Octagon for `firewall` | Universal "stop/check" shape. Instantly readable across cultures. |
| 2026-02-23 | Circle for `scheduler` | Universal "clock" shape. No other type uses it. Maximum distinctiveness. |
| 2026-02-23 | Parallelogram for `function` | Angular = ephemeral/transient. Distinct from all rectangular shapes. |
| 2026-02-23 | Sub-states are per-service opt-in | Not every node needs internal state. Keep it clean for simple diagrams. |
| 2026-02-23 | Semantic color mapping for sub-states | Authors shouldn't need to configure colors. `running` → blue, `failed` → red. Just works. |
| 2026-02-23 | Sub-states sticky across steps | Reduces YAML verbosity. Only mention a node's sub-state when it changes. |
| 2026-02-23 | `null`/`~` to clear sub-state | Explicit removal. No ambiguity between "not mentioned" (sticky) and "clear it" (gone). |
