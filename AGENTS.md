# AGENTS.md - FlowStory

> For AI coding agents (Claude Code, Codex CLI, Cursor, etc.)

## What is FlowStory?

FlowStory creates animated flow diagrams from YAML. It supports:
- **Service Flows** — Architecture storytelling engine (flagship, 28 node types, coupling analysis, failure cascade, cinematic camera, layout scenes)
- **User Stories** — Actor-driven journeys with effects
- **HTTP Flows** — REST API sequences
- **Pipelines** — CI/CD workflows
- **State Diagrams** — UML state machines
- **BC Composition** — Progressive reveal of any concept's constituents
- **BC Deployments** — Kubernetes/DevOps topology
- **Composite** — Multi-renderer deep dives (any renderers stitched into one story)
- **C4 Context / Tech Radar / Event Storming / ADR Timeline / Cloud Cost** — SVG renderers

## Quick Commands

```bash
npm run dev           # Start dev server (http://localhost:5173)
npm run dev -- --host # Expose on network
npm run test:all      # Run all tests
npm run build         # Production build
```

---

## Core Concepts

### Camera System

Stories use **camera-centric coordinates**. Node positions are relative to camera center `[0, 0]`.

```yaml
camera:
  center: [0, 0]    # Viewport center in world coords
  zoom: 1.0         # 1.0 = 100%, 0.5 = zoomed out, 2.0 = zoomed in

nodes:
  - id: center-node
    position: { x: 0, y: 0 }      # At camera center
  - id: right-node
    position: { x: 200, y: 0 }    # 200px right of center
  - id: below-node
    position: { x: 0, y: 150 }    # 150px below center
```

### Node Sizes

Standardized sizes for consistent layouts. Font scales with size.

```yaml
nodes:
  - id: main-service
    type: system
    label: "Core API"
    size: xl          # xs | s | m | l | xl
    position: { x: 0, y: 0 }
    
  - id: helper
    type: action
    label: "Validate"
    size: s           # Compact helper
    position: { x: 200, y: 0 }
```

**Size presets:**
| Size | Width | Height | Font | Use Case |
|------|-------|--------|------|----------|
| `xs` | 70 | 35 | 10px | Tiny labels, start/end |
| `s` | 100 | 45 | 12px | Compact, secondary |
| `m` | 140 | 55 | 14px | Default |
| `l` | 180 | 70 | 16px | Important nodes |
| `xl` | 220 | 90 | 18px | Main focus |

**Default sizes by type:**
- `system` → `l` (large, important)
- `action` → `m` (medium)
- `event` → `s` (small badge)
- `state` → `s` (compact)
- `actor` → `m` (circular)
- `start`/`end` → `xs` (tiny)

### Edge Anchors

Control where edges connect to nodes:

```yaml
edges:
  # Auto-calculated (default) - picks best side based on positions
  - { source: a, target: b, type: flow }
  
  # Explicit anchors for precise control
  - { source: a, target: b, type: flow, sourceAnchor: bottom, targetAnchor: top }
  - { source: a, target: c, type: flow, sourceAnchor: right, targetAnchor: left }
```

**Anchor values:** `top`, `bottom`, `left`, `right`, `auto`

**Best practice for vertical layouts:**
```yaml
# Main flow goes down
- { source: step1, target: step2, sourceAnchor: bottom, targetAnchor: top }

# Fan out to parallel items
- { source: parent, target: child-left, sourceAnchor: left, targetAnchor: top }
- { source: parent, target: child-center, sourceAnchor: bottom, targetAnchor: top }
- { source: parent, target: child-right, sourceAnchor: right, targetAnchor: top }
```

### Node Effects

Attach visual effects to nodes:

```yaml
nodes:
  - id: important-node
    type: system
    label: "Critical Service"
    position: { x: 0, y: 0 }
    effects:
      - type: pulse
        trigger: on-focus
        params:
          scale: 1.15
          duration: 800
          
      - type: glow
        trigger: continuous
        params:
          color: "#3b82f6"
          intensity: 0.6
          size: 25
```

**Effect types:**
| Type | Description | Key Params |
|------|-------------|------------|
| `pulse` | Scale up/down animation | `scale`, `duration`, `color` |
| `glow` | Colored glow around node | `color`, `intensity`, `size` |
| `shake` | Horizontal shake | `intensity`, `duration` |
| `emoji-explosion` | Burst of emojis | `emojis[]`, `count`, `duration` |
| `particles` | Particle effect | `color`, `count`, `spread` |

**Triggers:** `on-reveal`, `on-focus`, `on-blur`, `continuous`, `on-click`, `on-hover`

### Step Decomposition

**One node per step** for smooth presentations:

```yaml
# ❌ BAD - bundles too many nodes
steps:
  - id: step-1
    nodeIds: [a, b, c, d, e]
    narrative: "Everything happens at once"

# ✅ GOOD - progressive reveal
steps:
  - id: step-1
    nodeIds: [a]
    narrative: "First, we have A."
  - id: step-2
    nodeIds: [a, b]
    edgeIds: [a-to-b]
    narrative: "A connects to B."
  - id: step-3
    nodeIds: [a, b, c]
    edgeIds: [a-to-b, b-to-c]
    narrative: "Then B leads to C."
```

### Step Camera Overrides

Animate camera between steps:

```yaml
steps:
  - id: overview
    nodeIds: [a, b, c]
    camera:
      center: [0, 0]
      zoom: 0.8           # Zoomed out
      transition: 500ms   # Smooth pan
    narrative: "The full system"
    
  - id: focus-detail
    nodeIds: [a, b, c]
    camera:
      center: [200, 0]    # Pan to right
      zoom: 1.5           # Zoom in
      transition: 300ms
    narrative: "Let's focus on this component"
```

---

## Story Templates

### User Story (Full Featured)

```yaml
id: user-registration
title: User Registration Flow
version: "1.0"

camera:
  center: [0, 0]
  zoom: 1.0

actors:
  - id: user
    name: User
    avatar: "👤"
    color: "#4CAF50"

nodes:
  - id: user-actor
    type: actor
    actorId: user
    label: User
    position: { x: -200, y: 0 }
    
  - id: submit-form
    type: action
    actorId: user
    label: Submit Form
    position: { x: 0, y: 0 }
    effects:
      - type: pulse
        trigger: on-focus
        params: { scale: 1.1 }
    
  - id: validate
    type: system
    label: Validate
    position: { x: 200, y: 0 }
    
  - id: success
    type: state
    label: Success
    position: { x: 400, y: 0 }
    data: { variant: success }
    effects:
      - type: emoji-explosion
        trigger: on-reveal
        params:
          emojis: ["🎉", "✨"]
          count: 15

edges:
  - { id: e1, source: user-actor, target: submit-form, type: flow }
  - { id: e2, source: submit-form, target: validate, type: flow, sourceAnchor: right, targetAnchor: left }
  - { id: e3, source: validate, target: success, type: flow }

steps:
  - id: step-1
    nodeIds: [user-actor]
    narrative: "A user wants to register."
  - id: step-2
    nodeIds: [user-actor, submit-form]
    edgeIds: [e1]
    narrative: "They fill out and submit the form."
  - id: step-3
    nodeIds: [user-actor, submit-form, validate]
    edgeIds: [e1, e2]
    narrative: "The system validates input."
  - id: step-4
    nodeIds: [user-actor, submit-form, validate, success]
    edgeIds: [e1, e2, e3]
    narrative: "Registration complete!"
```

### Pipeline (Vertical with Explicit Anchors)

```yaml
id: ci-cd
title: CI/CD Pipeline
version: "1.0"

camera:
  center: [0, 0]
  zoom: 0.7

nodes:
  - id: trigger
    type: event
    label: Push to main
    position: { x: 0, y: -200 }
    
  - id: build
    type: system
    label: Build
    position: { x: 0, y: -100 }
    
  - id: test
    type: system
    label: Test
    position: { x: 0, y: 0 }
    
  - id: deploy
    type: system
    label: Deploy
    position: { x: 0, y: 100 }
    
  - id: done
    type: state
    label: Complete
    position: { x: 0, y: 200 }
    data: { variant: success }

edges:
  - { id: e1, source: trigger, target: build, type: flow, sourceAnchor: bottom, targetAnchor: top }
  - { id: e2, source: build, target: test, type: flow, sourceAnchor: bottom, targetAnchor: top }
  - { id: e3, source: test, target: deploy, type: flow, sourceAnchor: bottom, targetAnchor: top }
  - { id: e4, source: deploy, target: done, type: flow, sourceAnchor: bottom, targetAnchor: top }

steps:
  - { id: s1, nodeIds: [trigger], edgeIds: [], narrative: "Code pushed." }
  - { id: s2, nodeIds: [trigger, build], edgeIds: [e1], narrative: "Building..." }
  - { id: s3, nodeIds: [trigger, build, test], edgeIds: [e1, e2], narrative: "Testing..." }
  - { id: s4, nodeIds: [trigger, build, test, deploy], edgeIds: [e1, e2, e3], narrative: "Deploying..." }
  - { id: s5, nodeIds: [trigger, build, test, deploy, done], edgeIds: [e1, e2, e3, e4], narrative: "Done!" }
```

### BC Composition

```yaml
title: Order Service
type: bc-composition
version: 1

layout:
  mode: radial
  spacing: 200

core:
  id: order-service
  name: Order Service
  icon: "🛒"

elements:
  - id: api
    name: REST API
    type: api
    icon: "🌐"
    layer: 1
  - id: db
    name: Database
    type: database
    icon: "🗃️"
    layer: 1
  - id: events
    name: Events
    type: event-bus
    icon: "📨"
    layer: 1

edges:
  - { source: api, target: db, type: depends }
  - { source: api, target: events, type: publishes }

steps:
  - { id: s1, title: "Core", reveal: [], focus: [order-service] }
  - { id: s2, title: "API", reveal: [api], focus: [api] }
  - { id: s3, title: "Storage", reveal: [db], focus: [db] }
  - { id: s4, title: "Events", reveal: [events], focus: [events] }
```

---

## Node Types

| Type | Visual | Use |
|------|--------|-----|
| `actor` | Avatar circle | Person/system initiating |
| `action` | Rounded rect | User action |
| `system` | Rect with gear | Backend processing |
| `event` | Badge with ⚡ | Domain event |
| `decision` | Diamond ◇ | Branch point |
| `state` | Pill shape | End state |
| `start` | Small circle | Entry point |
| `end` | Double circle | Exit point |

**State variants:** `success`, `warning`, `danger`, `info`

## Edge Types

| Type | Style | Use |
|------|-------|-----|
| `flow` | Solid arrow | Sequential flow |
| `event` | Dashed + ⚡ | Event publishing |
| `async` | Dotted | Background/eventual |
| `error` | Red dashed | Error paths |

---

## Migration Script

Convert old stories to camera-centric format:

```bash
# Single story
npx tsx scripts/migrate-story.ts stories/my-story.yaml

# All stories
npx tsx scripts/migrate-story.ts --all
```

---

## Validation

Stories are validated on load. Check browser console for errors.

Key rules:
- All `source`/`target` in edges must reference valid node IDs
- Explicit `id` on edges recommended
- Steps should progressively reveal (each step adds 1-2 nodes)
- Use camera-centric positions (relative to `[0,0]`)

## File Structure

```
stories/           <- YAML stories
src/components/    <- React components
src/effects/       <- Effect system
src/layout/        <- Camera & layout engine
src/schemas/       <- Zod validation
scripts/           <- CLI tools
docs/              <- Documentation
```
