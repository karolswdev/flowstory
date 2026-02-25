# 07 — Progressive Reveal, Sub-States & Failure Cascade

The magic of service-flow is **progressive disclosure**. Don't show everything at once. Reveal one concept per step, accumulate context, and use sub-states and failure cascades to bring the architecture to life.

---

## The Three Reveal Axes

Every step controls visibility through three independent axes:

| Field | What It Does | Visual State |
|-------|-------------|--------------|
| `activeCalls` | Calls that are **alive right now** | Bright, animated, traveling dots, full glow |
| `revealCalls` | Calls that become **visible but dimmed** | Reduced opacity, no dots, background context |
| `revealNodes` | Nodes that appear **without being called** | Visible but inactive (no glow, dimmed) |

### Node Visibility Rules

A node becomes visible when:
1. It's the `from` or `to` of an active or revealed call, OR
2. It's listed in `revealNodes`

A node is **active** when it participates in an active call (source or target of a call in `activeCalls`).

A node is **complete** when it was active in a previous step but not in the current step.

---

## The Accumulation Pattern

The fundamental pattern: each step reveals the current action while preserving visibility of everything that came before.

```yaml
steps:
  - id: step-1
    activeCalls: [create-order]
    # Only gateway → orders visible

  - id: step-2
    activeCalls: [check-cache]
    revealCalls: [create-order]           # Step 1's call stays visible (dimmed)
    # gateway → orders (dimmed) + orders → cache (active)

  - id: step-3
    activeCalls: [check-inventory]
    revealCalls: [create-order, check-cache]  # Steps 1+2 stay visible
    # Full chain visible, latest call highlighted

  - id: step-4
    activeCalls: [save-order]
    revealCalls: [create-order, check-cache, check-inventory]
    # Everything visible, final call highlighted
```

**Rule:** `revealCalls` should accumulate ALL previously active calls. If you forget a call ID, that edge disappears — which is jarring unless intentional.

---

## The 6-Set State Model

Under the hood, the canvas computes 6 sets for each step:

| Set | Contents | Purpose |
|-----|----------|---------|
| `activeCallIds` | Calls in current step's `activeCalls` | Bright, animated edges |
| `completedCallIds` | Calls active in any previous step | Dimmed edges |
| `revealedCallIds` | All calls revealed through current step | "Should this edge be visible?" |
| `activeNodeIds` | Nodes from `revealNodes` in current step | Active glow on nodes |
| `completedNodeIds` | Nodes from prior steps' reveals | Dimmed nodes |
| `revealedNodeIds` | All nodes revealed through current step | "Should this node be visible?" |

Plus two "entry" sets:
- `newCallIds` — calls revealed *in this step* for the first time (triggers entry animation)
- `newNodeIds` — nodes revealed *in this step* for the first time (triggers entry animation)

---

## The Big Reveal

After building up progressively, end with everything active:

```yaml
- id: final-step
  title: "Complete Architecture"
  activeCalls: [every, single, call, id]
  camera:
    fitAll: true
    duration: 2000
    easing: ease-in-out
```

This is the "pull-back" moment — the audience sees how all the pieces connect.

---

## The Focus Isolation

Sometimes you want to show ONLY a subset, hiding everything else:

```yaml
- id: step-5
  title: "Just the Event Path"
  activeCalls: [publish-event, consume-event]
  # No revealCalls → previous edges disappear
  # Only the event path is visible
```

**Use sparingly.** Disappearing elements can be disorienting unless the narrative explains it.

---

## Sub-States: Living Nodes

Sub-states turn static boxes into state machines. Each node can display an animated badge that changes as the story progresses.

### Declaring Sub-States

Define available states on the service definition:

```yaml
services:
  - id: conductor
    name: Conductor
    type: workflow
    substates: [idle, running, waiting, compensating, completed, failed]
    initialSubstate: idle
```

### Driving Sub-States Per Step

```yaml
steps:
  - id: step-1
    substates:
      conductor: running          # Badge appears: "running" (blue pill)
      rescue-db: writing          # Badge appears: "writing" (purple pill)

  - id: step-2
    substates:
      conductor: waiting          # Badge changes: "waiting" (amber pill)
      # rescue-db is STICKY — stays "writing" from step-1

  - id: step-3
    substates:
      conductor: completed        # Badge changes: "completed" (green pill)
      rescue-db: committed        # Badge changes: "committed" (green pill)

  - id: step-4
    substates:
      conductor: ~                # Badge REMOVED (null/~ clears it)
```

### Sub-State Rules

| Rule | Behavior |
|------|----------|
| **Sticky** | Sub-states persist until explicitly changed or cleared |
| **Clear with `~` or `null`** | Removes the badge entirely |
| **Optional** | Services without `substates` work exactly as before |
| **Initial** | `initialSubstate` sets the badge before any steps run |

### Semantic Auto-Coloring

You don't pick colors — they're derived from keyword prefixes:

| Keywords | Color | Hex | Meaning |
|----------|-------|-----|---------|
| idle, inactive, off, none | Gray | `#9CA3AF` | At rest |
| pending, queued, waiting, paused | Amber | `#F59E0B` | Waiting for something |
| running, active, processing, assigned | Blue | `#3B82F6` | Working |
| reading, fetching, querying | Cyan | `#06B6D4` | Read operation |
| writing, inserting, updating, committing | Purple | `#A855F7` | Write operation |
| completed, done, approved, success, committed | Green | `#22C55E` | Success |
| failed, error, rejected, down | Red | `#EF4444` | Failure |
| escalated, warning, degraded, compensating | Orange | `#F97316` | Degraded |
| locked, blocked, throttled | Rose | `#F43F5E` | Blocked |

**Matching is prefix-based.** `running_task` matches "running" → blue. `processing_batch` matches "processing" → blue. Name your sub-states using these keywords and the colors just work.

### Dramatic Sub-State Patterns

**The Lifecycle Arc:**
```
idle → processing → writing → committed → idle
```

**The Failure Path:**
```
idle → running → waiting → compensating → failed
```

**Parallel State Dance** — multiple nodes changing simultaneously tells a story of coordination:
```yaml
substates:
  conductor: running
  rescue-db: writing
  pdf-gen: processing
  blob: uploading
```

---

## Failure Cascade — The Money Shot

The most dramatic feature in service-flow. Set `simulateFailure` on a step and watch the dominoes fall.

### Setup: Coupling + Critical on Calls

```yaml
calls:
  - id: gw-to-order
    type: sync
    from: gateway
    to: order-svc
    coupling: tight
    critical: true

  - id: order-to-payment
    type: sync
    from: order-svc
    to: payment-svc
    coupling: tight
    critical: true

  - id: payment-to-db
    type: sync
    from: payment-svc
    to: payment-db
    coupling: tight
    critical: true

  - id: order-to-cache
    type: sync
    from: order-svc
    to: cache
    coupling: loose
    fallback: "Skip cache, serve from DB"

  - id: order-to-events
    type: publish
    from: order-svc
    to: events
    coupling: eventual
```

### Triggering the Cascade

```yaml
steps:
  - id: step-3
    title: "Payment DB Goes Down"
    activeCalls: [gw-to-order, order-to-payment, payment-to-db]
    simulateFailure: payment-db
    substates:
      payment-svc: failed
    camera:
      zoom: 1.1
      easing: ease-out
      duration: 1500
```

### What Happens

1. `payment-db` is marked as **failed** (red outline + pulse)
2. BFS walks **upstream** through all calls marked `critical: true`
3. Every upstream service in the chain gets **red outline + pulse** (`.shape-node--failure-down`)
4. Every traversed edge turns **red and pulses** (`.call-edge--failed`)
5. Calls with `fallback` show a **green dashed fallback edge** (`.call-edge--fallback-active`)
6. Services connected only via `coupling: eventual` are **unaffected** — the blast radius stops

### The Failure Story Arc

The most powerful failure analysis follows this pattern:

```
Step 1: "Normal Operation"   → Show everything working, all coupling visible
Step 2: "Critical Path"      → Zoom into the tight-coupling chain
Step 3: "💥 FAILURE!"        → simulateFailure, watch the cascade
Step 4: "Resilience"         → Zoom to eventual-consistency services (unaffected)
```

This is the "why coupling analysis matters" story that makes architects nod.

### Cascade Rules

| Call Property | Effect on Cascade |
|---------------|-------------------|
| `critical: true` | BFS traverses this edge |
| `critical: false` (or absent) | BFS stops — this edge is not in the cascade chain |
| `coupling: tight` | Red thick edge (visual weight) |
| `coupling: loose` + `fallback` | Green dashed fallback edge activates |
| `coupling: eventual` | No visual effect — decoupled |

---

## Putting It All Together

A complete progressive-reveal story with sub-states and failure cascade:

```yaml
steps:
  # ACT 1: Setup
  - id: overview
    title: "Architecture Overview"
    revealNodes: [gateway, order-svc, payment-svc, payment-db, cache, events]
    camera: { fitAll: true, duration: 2000, easing: ease-in-out }
    narrative: "The **Order Processing** architecture with coupling analysis."

  # ACT 2: Normal flow
  - id: happy-path
    title: "Happy Path"
    activeCalls: [gw-to-order, order-to-payment, payment-to-db]
    substates:
      order-svc: processing
      payment-svc: running
      payment-db: writing
    narrative: "Request flows through the {color:red|tightly coupled} chain."

  # ACT 3: Failure
  - id: failure
    title: "Database Failure"
    activeCalls: [gw-to-order, order-to-payment, payment-to-db]
    simulateFailure: payment-db
    substates:
      payment-svc: failed
      order-svc: failed
    narrative: "The {color:red|payment-db} goes down. BFS cascade upstream."

  # ACT 4: Resilience
  - id: resilience
    title: "Decoupled Services Survive"
    activeCalls: [order-to-events]
    revealCalls: [gw-to-order, order-to-payment, payment-to-db, order-to-cache]
    focusNodes: [events]
    camera: { zoom: 1.3, easing: ease-out, duration: 1200 }
    narrative: >-
      The {color:green|event bus} is connected via **eventual** coupling.
      It's completely unaffected by the cascade.
```
