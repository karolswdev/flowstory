# 04 — Camera Cinematography

The camera system is what transforms a static diagram into a guided narrative. Every step can control where the audience looks, how fast the camera moves, and what easing gives the transition its emotional feel.

---

## How the Camera Works

The camera is controlled by `useAutoFocus`, which runs inside every ReactFlow-based canvas. On each step change, it determines:

1. **What to frame** — which nodes to center on
2. **How to animate** — duration, easing, zoom level, padding

### Focus Priority (highest wins)

| Priority | Source | When |
|----------|--------|------|
| 1 | `camera.fitAll: true` | Zoom to fit ALL nodes on canvas |
| 2 | `camera.focusNodes: [...]` | Frame these specific nodes |
| 3 | Step-level `focusNodes: [...]` | Frame these nodes (outside camera block) |
| 4 | Auto-derived from `activeCalls` | Frame source + target nodes of active calls |

If none of these are set, the camera doesn't move.

---

## Camera Override Fields

Every step can include a `camera` object:

```yaml
steps:
  - id: step-1
    title: "My Step"
    activeCalls: [some-call]
    camera:
      zoom: 1.8                  # Target zoom level (0.1 – 5.0)
      duration: 2500             # Animation duration in ms (100 – 10000)
      easing: ease-in            # Named easing function
      focusNodes: [svc-a, svc-b] # Override which nodes to frame
      fitAll: true               # Zoom to show ALL nodes
      pan: [100, -50]            # Manual offset [x, y] after focus
      padding: 150               # Px padding around focus area
```

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `zoom` | number | auto | Target zoom level. 0.1 = very far, 5.0 = very close. |
| `duration` | number | 600 | Animation time in milliseconds. |
| `easing` | string | `spring-overshoot` | Named easing function (see below). |
| `focusNodes` | string[] | — | Override which nodes to center on. |
| `fitAll` | boolean | false | Zoom to fit all nodes. Overrides focusNodes. |
| `pan` | [x, y] | — | Manual pixel offset applied after focus. |
| `padding` | number | 100 | Pixels of padding around the focus area. |

### Service-Flow Camera Defaults

When no `camera` override is provided, the service-flow renderer uses these defaults:

```
padding: 100px
duration: 600ms
maxZoom: 1.3
minZoom: 0.4
easing: spring-overshoot
```

---

## The Five Named Easings

Each easing function controls the *feel* of the camera transition. Choose based on the emotional beat of the step.

### `spring-overshoot` (Default)

**Formula:** `f(t) = 1 - e^(-6t) * cos(3πt)`

**Feel:** Cinematic snap with ~10% overshoot then settle. Like a camera operator snapping to a subject.

**Best for:** Most steps. Quick, punchy transitions. Action beats. The default for a reason — it feels alive.

```yaml
camera:
  easing: spring-overshoot
  duration: 800
```

### `ease-in`

**Formula:** `f(t) = t³` (cubic)

**Feel:** Slow start, accelerating. Builds anticipation. The camera *leans in*.

**Best for:** Dramatic zoom-ins. Building tension before a reveal. "Let me show you something important..."

```yaml
camera:
  easing: ease-in
  zoom: 1.8
  duration: 2500
```

### `ease-out`

**Formula:** `f(t) = 1 - (1-t)³` (cubic)

**Feel:** Fast start, gentle settle. The camera arrives and *lands*.

**Best for:** Landing on a detail after a fast cut. "Here it is." Arrival moments.

```yaml
camera:
  easing: ease-out
  zoom: 1.5
  duration: 1200
```

### `ease-in-out`

**Formula:** `f(t) = t < 0.5 ? 4t³ : 1 - (-2t+2)³/2` (cubic S-curve)

**Feel:** Smooth, symmetrical acceleration and deceleration. Cinematic sweep.

**Best for:** Panoramic sweeps. `fitAll` transitions. Establishing shots. Resolution moments.

```yaml
camera:
  easing: ease-in-out
  fitAll: true
  duration: 2000
```

### `linear`

**Formula:** `f(t) = t`

**Feel:** Constant speed. Mechanical, deliberate.

**Best for:** Tracking shots across many nodes. Scanning a layer. Feels methodical — good for "let me walk you through each service" moments.

```yaml
camera:
  easing: linear
  duration: 1500
  focusNodes: [svc-a, svc-b, svc-c, svc-d]
```

---

## Camera Recipes

### The Establishing Shot

Start wide. Show the whole canvas. Give the audience context before diving in.

```yaml
- id: step-1
  title: "Architecture Overview"
  revealNodes: [all, your, services]
  camera:
    fitAll: true
    duration: 2000
    easing: ease-in-out
    padding: 150
```

**When:** First step of almost every story. Sets the scene.

### The Dramatic Zoom

Slow push into a single service. Builds tension and focus.

```yaml
- id: step-2
  title: "The Critical Service"
  focusNodes: [payment-svc]
  camera:
    zoom: 1.8
    duration: 2500
    easing: ease-in
```

**When:** Highlighting a critical component. "This is where it gets interesting."

### The Spring Snap

Quick cinematic cut. The camera snaps to a new target with a slight bounce.

```yaml
- id: step-3
  title: "Authentication Check"
  activeCalls: [check-auth]
  camera:
    zoom: 1.5
    duration: 800
    easing: spring-overshoot
```

**When:** Action moments. Step-to-step transitions where something *happens*.

### The Tracking Shot

Smooth, linear pan across multiple services. Walking the audience through a layer.

```yaml
- id: step-4
  title: "API Layer"
  focusNodes: [api-a, api-b, api-c, api-d]
  camera:
    zoom: 1.2
    duration: 1500
    easing: linear
```

**When:** Showing a group of related services. "Here's the entire API layer."

### The Pull-Back Reveal

After zooming into details, pull back to show how everything connects.

```yaml
- id: step-final
  title: "The Complete Picture"
  activeCalls: [every, single, call]
  camera:
    fitAll: true
    duration: 2000
    easing: ease-in-out
    padding: 150
```

**When:** Last step, or after a deep-dive section. "Now see how it all fits together."

### The Offset Focus

Frame a node but shift the viewport to make room for the overlay or to show context.

```yaml
- id: step-5
  title: "Database Layer"
  focusNodes: [main-db]
  camera:
    zoom: 1.4
    pan: [0, -80]               # Shift up to show nodes below
    duration: 1000
```

**When:** When the default framing cuts off important context. `pan` is a pixel offset applied *after* the focus calculation.

---

## The Camera Arc

The best stories follow a cinematic camera arc:

```
Step 1:  fitAll        (establish the scene)
Step 2:  zoom 1.5      (first detail)
Step 3:  zoom 1.8      (deeper detail — the climax)
Step 4:  zoom 1.3      (pull back slightly)
Step 5:  fitAll        (resolution — the full picture)
```

This mirrors classic storytelling: **context → tension → climax → resolution**.

### Arc Variations

**The Progressive Zoom:**
```
fitAll → 1.2 → 1.5 → 1.8 → 1.5 → fitAll
```
Steadily zooms in, then reverses. Good for "peeling the onion" stories.

**The Ping-Pong:**
```
fitAll → zoom-left → fitAll → zoom-right → fitAll
```
Alternates between overview and detail. Good for comparing two parts of the architecture.

**The Cascade:**
```
fitAll → zoom-A → zoom-B → zoom-C → fitAll
```
Hops between different areas. Good for showing a request path through multiple services.

---

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| No camera on first step | Add `fitAll: true` or explicit `focusNodes` |
| Every step has `fitAll` | Use `fitAll` for establishing/resolving shots, zoom for details |
| Duration too fast (<400ms) | Minimum ~600ms for the audience to track the movement |
| Duration too slow (>3000ms) | Feels sluggish. Keep it under 2500ms for most steps. |
| Same zoom on every step | Vary zoom levels to create visual rhythm |
| Missing easing | Defaults to `spring-overshoot` which is good, but vary it for drama |
| `focusNodes` + `fitAll` on same step | `fitAll` wins — `focusNodes` is ignored. Use one or the other. |
