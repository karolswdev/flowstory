# FlowStory Renderer Development Guide

A comprehensive guide to building specialized renderers for FlowStory.

---

## 5-Minute Quickstart

```bash
# 1. Create folder structure
mkdir -p src/components/my-renderer

# 2. Create required files
touch src/components/my-renderer/MyRendererCanvas.tsx
touch src/components/my-renderer/my-renderer.css
touch src/components/my-renderer/index.ts

# 3. Create schema
touch src/schemas/my-renderer.ts

# 4. Wire up in App.tsx (add import and route)
```

Then follow the templates below.

---

## Folder Structure

```
src/components/<renderer-name>/
├── <RendererName>Canvas.tsx    # Main canvas component
├── <renderer-name>.css         # Component styles
├── index.ts                    # Exports
└── [SubComponent].tsx          # Optional sub-components
```

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Folder | kebab-case | `tech-radar/` |
| Canvas | PascalCase + Canvas | `TechRadarCanvas.tsx` |
| CSS | kebab-case | `tech-radar.css` |
| Schema | kebab-case | `tech-radar.ts` |

---

## Required Files

### 1. Canvas Component (`<RendererName>Canvas.tsx`)

```tsx
import { useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { fadeUp, TRANSITION } from '../../animation';
import type { MyStory, MyStep } from '../../schemas/my-renderer';
import './my-renderer.css';

interface MyRendererCanvasProps {
  story: MyStory;
  currentStepIndex: number;
  onStepChange?: (step: number) => void;
  hideOverlay?: boolean;       // When true, suppress info panel + nav (used by composite renderer)
}

export function MyRendererCanvas({
  story,
  currentStepIndex,
  onStepChange,
  hideOverlay = false,
}: MyRendererCanvasProps): JSX.Element {
  const currentStep = story.steps[currentStepIndex];
  
  // Compute visible elements based on currentStep
  const visibleElements = useMemo(() => {
    // Filter/compute based on step
    return story.elements.filter(el => 
      currentStep.activeElements?.includes(el.id)
    );
  }, [story.elements, currentStep]);

  return (
    <div className="my-renderer-canvas">
      {/* Main visualization */}
      <svg className="my-renderer-svg" viewBox="0 0 800 600">
        <AnimatePresence>
          {visibleElements.map((el, i) => (
            <motion.g
              key={el.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              {/* Render element */}
            </motion.g>
          ))}
        </AnimatePresence>
      </svg>

      {/* Info panel + navigation — hidden when used inside composite renderer */}
      {!hideOverlay && (
        <>
          <AnimatePresence mode="wait">
            {currentStep && (
              <motion.div
                className="my-renderer-info"
                variants={fadeUp}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={TRANSITION.default}
                key={currentStepIndex}
              >
                <h3>{currentStep.title}</h3>
                <p>{currentStep.description}</p>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="my-renderer-nav">
            <button
              onClick={() => onStepChange?.(Math.max(0, currentStepIndex - 1))}
              disabled={currentStepIndex === 0}
            >
              ← Previous
            </button>
            <span>{currentStepIndex + 1} / {story.steps.length}</span>
            <button
              onClick={() => onStepChange?.(Math.min(story.steps.length - 1, currentStepIndex + 1))}
              disabled={currentStepIndex >= story.steps.length - 1}
            >
              Next →
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default MyRendererCanvas;
```

### 2. CSS Styles (`<renderer-name>.css`)

```css
/* Canvas container */
.my-renderer-canvas {
  position: relative;
  width: 100%;
  height: 100%;
  background: var(--color-bg);
  overflow: auto;
}

/* SVG viewport */
.my-renderer-svg {
  width: 100%;
  height: calc(100vh - 200px);
}

/* Info panel - use design tokens */
.my-renderer-info {
  position: absolute;
  bottom: calc(var(--space-16) + var(--space-6));
  left: 50%;
  transform: translateX(-50%);
  background: var(--color-bg-elevated);
  border: var(--border-width) solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--space-4) var(--space-6);
  max-width: 500px;
  box-shadow: var(--shadow-lg);
}

.my-renderer-info h3 {
  margin: 0 0 var(--space-2);
  font-size: var(--fs-lg);
  font-weight: var(--fw-semibold);
  color: var(--color-text);
}

.my-renderer-info p {
  margin: 0;
  font-size: var(--fs-md);
  color: var(--color-text-secondary);
}

/* Navigation - use design tokens */
.my-renderer-nav {
  position: absolute;
  bottom: var(--space-5);
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-2) var(--space-4);
  background: var(--color-bg-elevated);
  border: var(--border-width) solid var(--color-border);
  border-radius: var(--radius-full);
  box-shadow: var(--shadow-md);
}

.my-renderer-nav button {
  padding: var(--space-2) var(--space-3);
  border: none;
  background: var(--color-primary);
  color: var(--color-text-inverse);
  border-radius: var(--radius-sm);
  font-size: var(--fs-sm);
  cursor: pointer;
}

.my-renderer-nav button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.my-renderer-nav span {
  font-size: var(--fs-sm);
  color: var(--color-text-secondary);
}
```

### 3. Index Export (`index.ts`)

```ts
export { MyRendererCanvas, default } from './MyRendererCanvas';
export type { MyRendererCanvasProps } from './MyRendererCanvas';
```

### 4. Schema (`src/schemas/<renderer-name>.ts`)

```ts
import { z } from 'zod';

// Define your data types
export const MyElementSchema = z.object({
  id: z.string(),
  name: z.string(),
  // ... element-specific fields
});

export type MyElement = z.infer<typeof MyElementSchema>;

// Define step schema
export const MyStepSchema = z.object({
  title: z.string(),
  description: z.string(),
  activeElements: z.array(z.string()).optional(),
  // ... step-specific fields
});

export type MyStep = z.infer<typeof MyStepSchema>;

// Define full story schema
export const MyStorySchema = z.object({
  title: z.string(),
  type: z.literal('my-renderer'),
  elements: z.array(MyElementSchema),
  steps: z.array(MyStepSchema),
});

export type MyStory = z.infer<typeof MyStorySchema>;
```

---

## Animation Guidelines

### Required Imports

```tsx
import { motion, AnimatePresence } from 'motion/react';
import { fadeUp, TRANSITION } from '../../animation';
```

### Standard Patterns

#### Info Panel Transitions
```tsx
<AnimatePresence mode="wait">
  {currentStep && (
    <motion.div
      variants={fadeUp}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={TRANSITION.default}
      key={currentStepIndex}  // Required for AnimatePresence
    >
      {/* content */}
    </motion.div>
  )}
</AnimatePresence>
```

#### Staggered Element Entry
```tsx
{elements.map((el, i) => (
  <motion.g
    key={el.id}
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: i * 0.05 }}
  >
    {/* element */}
  </motion.g>
))}
```

#### Available Presets

| Preset | Use Case |
|--------|----------|
| `fadeUp` | Info panels, cards |
| `fadeIn` | Simple opacity |
| `scaleIn` | Emphasis entry |
| `slideInLeft/Right` | Side panels |
| `TRANSITION.default` | Standard timing |
| `TRANSITION.spring` | Bouncy feel |

---

## Design Token Reference

Always use CSS custom properties from `src/styles/tokens.css`:

### Colors
- `--color-bg` - Background
- `--color-bg-elevated` - Cards, panels
- `--color-text` - Primary text
- `--color-text-secondary` - Secondary text
- `--color-border` - Borders
- `--color-primary` - Accent/buttons

### Spacing
- `--space-1` through `--space-16` (4px base)

### Typography
- `--fs-xs` through `--fs-3xl`
- `--fw-normal`, `--fw-medium`, `--fw-semibold`, `--fw-bold`

### Borders & Shadows
- `--radius-sm`, `--radius-md`, `--radius-lg`, `--radius-full`
- `--shadow-sm`, `--shadow-md`, `--shadow-lg`, `--shadow-xl`

---

## Testing Checklist

Before submitting a new renderer:

- [ ] **Build passes:** `npm run build` completes without errors
- [ ] **Step navigation works:** ← → buttons and keyboard arrows
- [ ] **Info panel animates:** Smooth entry/exit on step change
- [ ] **Responsive:** Works at 1920px, 1440px, 1024px widths
- [ ] **Dark mode:** Renders correctly with `[data-theme="dark"]`
- [ ] **Reduced motion:** Respects `prefers-reduced-motion`
- [ ] **Schema validates:** Story files parse without Zod errors

---

## Current Renderer Examples

| Renderer | Type | Key Pattern |
|----------|------|-------------|
| TechRadar | SVG radial | Quadrant layout, ring-based positioning |
| C4Context | SVG boxes | Zone-based layout with relationships |
| EventStorming | SVG sticky notes | Timeline with color-coded notes |
| ADRTimeline | SVG timeline | Chronological decision records |
| CloudCost | HTML cards | Bar charts with staggered animation |
| DependencyGraph | SVG radial | Service nodes with connections |
| MigrationRoadmap | HTML cards | Phase-based progress |
| TeamOwnership | HTML cards | Team-service grid |
| BCDeployment | ReactFlow | Radial artifact layout |
| BCComposition | ReactFlow | Progressive reveal |
| Pipeline | ReactFlow | Stage-based CI/CD |
| ServiceFlow | ReactFlow | Architecture storytelling (27 types) |
| HttpFlow | ReactFlow | HTTP request/response |
| Composite | Meta | Multi-renderer section switching |

---

## Service-Flow Renderer

The `service-flow` renderer is FlowStory's flagship — purpose-built for architecture storytelling with 27 node types (17 infrastructure + 10 domain), 4 call types, coupling/failure cascade modeling, zone grouping, and multi-axis step control.

### YAML Shape

```yaml
id: my-service-flow
title: "My Service Flow"
renderer: service-flow
schemaVersion: "2.0"

services:
  - id: orders
    name: Order Service
    type: api                    # 27 types — see table below
    substates: [idle, running, waiting, completed, failed]  # optional sub-state list
    initialSubstate: idle        # optional starting sub-state
    technology: Node.js
    status: healthy              # healthy|degraded|down
    version: "2.1"
    tags: { team: platform }

queues:
  - id: order-events
    name: order-events
    type: topic                  # queue|topic|stream
    broker: kafka

calls:
  - id: create-order
    type: sync                   # sync|async|publish|subscribe
    from: gateway
    to: orders
    method: POST
    path: /orders
    response: { status: 201 }   # generates reverse dotted edge
    coupling: tight              # tight|loose|eventual — visual coupling indicator
    critical: true               # marks call for failure cascade BFS
    fallback: "Return cached"    # fallback label when upstream fails

zones:
  - id: core
    label: "Core Domain"
    members: [orders, orders-db]

steps:
  - id: step-1
    title: "Request Arrives"
    narrative: "Gateway routes to Order Service."
    activeCalls: [create-order]
    focusNodes: [orders]         # optional camera override
    substates:                   # per-node sub-state changes (sticky)
      orders: running
    camera:                      # optional camera override
      zoom: 1.2
      duration: 800
      easing: spring-overshoot   # spring-overshoot|linear|ease-in|ease-out|ease-in-out
    simulateFailure: orders-db   # trigger failure cascade from this service
```

### Service Types (27 Types)

#### Infrastructure Types (17)

| Type | Shape | Color | Best For |
|------|-------|-------|----------|
| `api` | Rectangle | Blue #3B82F6 | REST/gRPC microservices |
| `worker` | Rounded rect | Purple #A855F7 | Background processors |
| `gateway` | Diamond | Amber #F59E0B | API gateways |
| `database` | Cylinder | Stone #78716C | Databases |
| `cache` | Rounded square | Cyan #06B6D4 | Redis, Memcached |
| `external` | Cloud | Slate #64748B | Third-party APIs |
| `event-bus` | Hexagon | Orange #F97316 | Kafka broker |
| `workflow` | Pill | Pink #EC4899 | Saga orchestrators |
| `event-processor` | Rounded rect | Violet #8B5CF6 | Stream processors |
| `client` | Card + avatar | Indigo #6366F1 | Browser/mobile clients |
| `firewall` | Octagon | Rose #F43F5E | Network firewalls, WAFs |
| `load-balancer` | Inverted trapezoid | Teal #14B8A6 | Load balancers |
| `scheduler` | Circle | Amber #D97706 | Cron, job schedulers |
| `storage` | Wide cylinder | Stone #A8A29E | Blob/file storage |
| `function` | Parallelogram | Orange #EA580C | Serverless functions |
| `monitor` | Rect + chart accent | Emerald #10B981 | Observability, dashboards |
| `human-task` | Card + person badge | Pink #EC4899 | Manual approval, human steps |

#### Domain Types (10)

| Type | Shape | Color | Best For |
|------|-------|-------|----------|
| `entity` | Fingerprint badge | Sky #0EA5E9 | Domain entities |
| `aggregate` | Box badge | Indigo #4F46E5 | Aggregate roots |
| `value-object` | Gem badge | Lime #84CC16 | Value objects |
| `domain-event` | Bell badge | Amber #F59E0B | Domain events |
| `policy` | Scale badge | Rose #E11D48 | Business rules, policies |
| `read-model` | Eye badge | Cyan #06B6D4 | Query/read projections |
| `saga` | Route badge | Violet #7C3AED | Process managers, sagas |
| `repository` | Archive badge | Stone #57534E | Repository abstractions |
| `bounded-context` | Layers badge | Emerald #059669 | Bounded context boundaries |
| `actor` | User badge | Pink #DB2777 | Human/system actors |

### Call Types (4 Types)

| Type | Line | Color | Use |
|------|------|-------|-----|
| `sync` | Solid + dots | Blue | Request-response |
| `async` | Dashed + dots | Purple | Fire-and-forget |
| `publish` | Dashed + dots | Amber | Service → Queue |
| `subscribe` | Dashed + dots | Teal | Queue → Service |

All call types support these optional fields:

| Field | Type | Purpose |
|-------|------|---------|
| `coupling` | `tight\|loose\|eventual` | Visual coupling indicator (red/blue/gray) |
| `critical` | `boolean` | Marks call for failure cascade BFS traversal |
| `fallback` | `string` | Fallback label shown when upstream service fails |
| `effect` | `CallEffect` | Projectile animation (emoji-fan, label-yeet, particle-stream) |

### Step Keys

| Key | Purpose |
|-----|---------|
| `activeCalls` | Calls that glow (required, can be `[]`) |
| `focusNodes` | Camera targets (overrides auto-focus) |
| `revealNodes` | Show nodes without active call |
| `revealCalls` | Show edges in completed state |
| `narration` | `{speaker, message}` format |
| `substates` | Per-node sub-state changes (`{serviceId: "running"}`, sticky, clear with `~`) |
| `camera` | Camera override (`{zoom, duration, easing, fitAll, pan, padding}`) |
| `simulateFailure` | Service ID to trigger failure cascade (BFS through `critical` calls) |
| `effects` | Array of `{target, type, emojis?, ...}` projectile effects on calls |

### Key Files

| File | Purpose |
|------|---------|
| `src/schemas/service-flow.ts` | Zod schema + 27-type colors + coupling/cascade + layout constants |
| `src/components/service/ServiceFlowCanvas.tsx` | Core canvas with dagre layout |
| `src/components/service/ServiceNode.tsx` | 27-type service node (shape + icon dispatch) |
| `src/components/service/ServiceCallEdge.tsx` | 4-type animated edge with coupling indicators |
| `src/components/service/ZoneNode.tsx` | Zone bounding box |
| `src/components/service/SubstateBadge.tsx` | Animated per-node sub-state pill badge |
| `src/components/service/EdgeEffectLayer.tsx` | Projectile effects (emoji-fan, label-yeet, particle-stream) |
| `stories/service/order-processing.yaml` | Full-featured example |

### Deep Reference

See **`docs/service-flow-mastery.md`** for the complete guide including zone strategies, multi-axis choreography patterns, common call patterns, and advanced features.

---

## Composite Renderer

The `composite` renderer is a **meta-renderer** that stitches multiple existing renderers into a single story with one linear step sequence.

### YAML Shape

```yaml
id: my-deep-dive
title: "Multi-Perspective Deep Dive"
renderer: composite
schemaVersion: "2.0"

sections:
  - renderer: c4-context       # Any existing renderer key
    title: "System Landscape"   # Shown in section badge
    accentColor: "#3B82F6"      # Optional, tints badge border
    # ... all keys that renderer expects (system, people, steps, etc.)
    steps: [ ... ]

  - renderer: service-flow
    title: "Service Choreography"
    # ... service-flow keys
    steps: [ ... ]
```

### How It Works

1. **Schema validation**: Each section is validated against its renderer's Zod schema via `superRefine`
2. **Step flattening**: All sections' steps are merged into one global `steps[]` array
3. **Section switching**: `CompositeCanvas` mounts only the active section's canvas with `AnimatePresence` fade transitions
4. **Overlay unification**: Inner canvases receive `hideOverlay={true}` — composite renders one `StepOverlay`
5. **ReactFlow isolation**: `ReactFlowProvider` is rekeyed per section to prevent stale state

### Key Files

| File | Purpose |
|------|---------|
| `src/schemas/composite.ts` | Zod schema with `superRefine` + `.transform()` |
| `src/components/composite/CompositeCanvas.tsx` | Core canvas component |
| `src/components/composite/composite.css` | Styles |
| `stories/composite/order-deep-dive.yaml` | Example (3 sections, 8 steps) |

### Rules

- Every section must have at least 1 step
- Section body is the same YAML as a standalone story (minus top-level `id`/`renderer`/`schemaVersion`)
- All existing renderers can be used as sections (except `composite` itself)

---

## Rich Text Markup in Narration

All `narrative`, `description`, and `narration.message` fields support inline formatting via the StepOverlay's micro-parser:

| Syntax | Renders | CSS Class |
|--------|---------|-----------|
| `**text**` | **bold** | `.so-bold` |
| `*text*` | *italic* | `.so-italic` |
| `` `text` `` | `code` | `.so-code` |
| `{color:name\|text}` | colored text | `.so-color` |
| `\n` | line break | `<br>` |

Named colors: `blue`, `green`, `red`, `orange`, `amber`, `purple`, `pink`, `cyan`, `teal`, `yellow`, `gray` — plus raw hex.

---

## Common Pitfalls

1. **Missing `key` on animated elements** - AnimatePresence requires unique keys
2. **Hardcoded colors** - Always use `var(--color-*)` tokens
3. **Missing dark mode** - Add `[data-theme="dark"]` overrides
4. **No exit animations** - Include `exit` variant for AnimatePresence
5. **Duplicated nav styles** - Reference existing patterns
6. **Missing schema validation** - Use Zod for runtime safety

---

## Getting Help

- Design tokens: `src/styles/tokens.css`
- Animation presets: `src/animation/presets.ts`
- Example renderers: `src/components/tech-radar/` (recommended reference)
