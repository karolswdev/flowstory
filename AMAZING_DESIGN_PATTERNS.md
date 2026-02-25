# AMAZING Service-Flow Design Patterns

> **The complete playbook for creating jaw-dropping architecture stories.**
> Service-flow is FlowStory's flagship renderer. This guide covers every weapon in your arsenal — from subtle camera work to emoji-yeeting projectile effects.

---

## Table of Contents

1. [The Mindset](#1-the-mindset)
2. [Story Architecture](#2-story-architecture)
3. [The 28 Node Types](#3-the-28-node-types)
4. [Edge Choreography](#4-edge-choreography)
5. [Progressive Reveal](#5-progressive-reveal)
6. [Sub-States: Living Nodes](#6-sub-states-living-nodes)
7. [Zones: Architectural Boundaries](#7-zones-architectural-boundaries)
8. [Scenes: Layout Direction Control](#8-scenes-layout-direction-control)
9. [Camera Cinematography](#9-camera-cinematography)
10. [Edge Effects: Yeet Things!](#10-edge-effects-yeet-things)
11. [Coupling & Failure Cascade](#11-coupling--failure-cascade)
12. [Rich Text Narration](#12-rich-text-narration)
13. [Tags: Metadata That Breathes](#13-tags-metadata-that-breathes)
14. [Response Edges: The Round Trip](#14-response-edges-the-round-trip)
15. [Self-Loops](#15-self-loops)
16. [Patterns & Recipes](#16-patterns--recipes)
17. [The Checklist](#17-the-checklist)

---

## 1. The Mindset

A great service-flow story isn't a diagram — it's a **narrative**. You're guiding someone through an architecture the way a film director guides an audience through a scene:

- **Reveal, don't dump.** Start with one edge. Add complexity step by step.
- **Focus creates meaning.** The camera should always know where to look.
- **State tells a story.** Sub-states, coupling colors, and failure cascades turn static boxes into living systems.
- **Effects punctuate.** An emoji-fan on a publish call is a *moment*. Don't overdo it.

---

## 2. Story Architecture

### The Skeleton

```yaml
id: my-story
title: "My Amazing Story"
renderer: service-flow
schemaVersion: "2.0"
description: "One sentence that sells this story"

services: [...]    # The cast of characters
queues: [...]      # Message infrastructure (optional)
calls: [...]       # The relationships
zones: [...]       # Logical boundaries (optional)
steps: [...]       # The narrative arc
```

### Pacing Rules

| Story Length | Steps | Best For |
|-------------|-------|----------|
| Quick demo | 3-4 | Single interaction, one concept |
| Standard | 5-8 | A complete flow with setup → climax → resolution |
| Deep dive | 8-12 | Saga orchestration, failure analysis, DDD models |
| Epic | 12+ | Only in composite stories (split across sections) |

**Golden ratio:** Each step should activate 1-3 calls. More than 4 active calls per step creates visual noise.

---

## 3. The 28 Node Types

Every type has a **unique shape** — colorblind-safe by design. Shape is the primary discriminator, color is secondary.

### Infrastructure Types (18)

| Type | Shape | When to Use |
|------|-------|------------|
| `api` | Rectangle | Any HTTP/gRPC service |
| `worker` | Rounded rect | Background processors, consumers |
| `gateway` | Diamond | API gateways, routers, reverse proxies |
| `database` | Tall cylinder | SQL/NoSQL databases |
| `cache` | Rounded square | Redis, Memcached, in-memory caches |
| `external` | Dashed cloud | 3rd-party APIs (Stripe, Maps, Twilio) |
| `event-bus` | Hexagon | Kafka topics, RabbitMQ exchanges |
| `event-stream` | Wide pipe + marquee | High-throughput event backbones (Kafka streams, Kinesis) |
| `workflow` | Pill/stadium | Orchestrators (Conductor, Temporal, Step Functions) |
| `event-processor` | Rounded rect + conveyor belt | Stream processors, Flink, Spark |
| `client` | Card + avatar | Browser, mobile app, CLI, IoT device |
| `firewall` | Octagon | WAFs, security boundaries |
| `load-balancer` | Inverted trapezoid | NGINX, ALB, K8s Ingress |
| `scheduler` | Circle | Cron jobs, timed triggers |
| `storage` | Wide cylinder | Blob storage, S3, file systems |
| `function` | Parallelogram | Serverless (Lambda, Azure Functions) |
| `monitor` | Rect + chart accent | Observability (Datadog, PagerDuty) |
| `human-task` | Card + person badge | Manual approval, human-in-the-loop |

### Domain Types (10) — for DDD Stories

| Type | Shape | DDD Concept |
|------|-------|------------|
| `actor` | Trapezoid | User, external agent |
| `aggregate` | Double-border rect | Aggregate root |
| `value-object` | Rounded hexagon | Immutable value |
| `entity` | Pentagon | Domain entity |
| `domain-event` | Tab shape | Published event |
| `policy` | Shield | Business rule, specification |
| `read-model` | Reverse parallelogram | CQRS read projection |
| `saga` | Arrow/chevron | Process manager, saga |
| `repository` | House shape | Persistence gateway |
| `bounded-context` | Rect with notch | BC boundary marker |

### Pro Tips

- **Mix infrastructure and domain types** in the same story. A `saga` node calling a `database` node is powerful.
- **Use `technology`** to ground abstract shapes: `type: workflow, technology: "Orkes Conductor"`.
- **Use `status`** for visual drama: `status: degraded` adds an amber pulse.

```yaml
services:
  - id: conductor
    name: Conductor
    type: workflow
    technology: "Orkes Conductor"
    substates: [idle, running, waiting, compensating, completed, failed]
    initialSubstate: idle
```

### The Event Stream — A Living Pipe

The `event-stream` type is special — it's a **wide horizontal pipe** (420px) with an internal marquee of event pills scrolling left-to-right. It's designed to be the visual centerpiece of event-driven architectures.

```yaml
services:
  - id: trip-stream
    name: Trip Events
    type: event-stream
    technology: "Kafka"
    tags:
      partitions: "24"
      throughput: "100k/s"
    events:
      - key: TripCreatedEvent
        value: "trip_id, rider_id, pickup"
        emoji: "📦"
        color: "#3B82F6"
      - key: DriverAssignedEvent
        value: "trip_id, driver_id, eta"
        emoji: "🚗"
        color: "#22C55E"
      - key: TripCompletedEvent
        value: "trip_id, fare, duration"
        emoji: "✅"
        color: "#10B981"
```

**How it works:**
- **Active:** Event pills scroll continuously inside the pipe as a marquee. Glow pulses at the inlet (left) and outlet (right) edges showing throughput energy.
- **Inactive:** Pipe is visible but static — marquee paused, pills dimmed, no glow.
- **Events field:** Each event has `key` (name), `value` (payload fields), optional `emoji`, and optional `color` (tints the pill).
- **Marquee speed** scales with event count — more events = longer cycle time for readability.

**When to use `event-stream` vs `event-bus`:**
- `event-bus` (hexagon) — for a Kafka topic or exchange that's a *routing point*. Small, compact, one of many.
- `event-stream` (wide pipe) — for the *central event backbone* of your architecture. Big, dominant, shows what's flowing through it. Use one per story, maybe two.

### The Event Processor — A Consuming Conveyor Belt

The `event-processor` type is the complement to `event-stream` — while the stream *produces* events flowing left-to-right, the processor *consumes* them. When active calls with a `messageType` target a processor node, a **conveyor belt strip** appears inside the node showing event pills sliding **right-to-left** and dissolving at the left edge — visually representing ingestion.

**No new YAML fields required.** The conveyor belt is convention-based — it derives its content from whichever `subscribe`/`async`/`publish` calls are currently active **to** this node.

```yaml
services:
  - id: trip-stream
    name: Trip Events
    type: event-stream
    technology: "Kafka"
    events:
      - key: TripCreated
        emoji: "📦"
        color: "#3B82F6"
      - key: DriverAssigned
        emoji: "🚗"
        color: "#22C55E"

  - id: matching-engine
    name: Matching Engine
    type: event-processor
    technology: "Flink"
    substates: [idle, processing, backpressure, completed]
    initialSubstate: idle

calls:
  - id: stream-to-matching
    type: subscribe
    from: trip-stream
    to: matching-engine
    messageType: TripCreated
    action: "match driver"

  - id: assign-to-matching
    type: async
    from: dispatch-api
    to: matching-engine
    messageType: AssignmentRequest

steps:
  - id: step-1
    title: "Events Arrive"
    activeCalls: [stream-to-matching]
    substates:
      matching-engine: processing
    narrative: >-
      The **Matching Engine** consumes `TripCreated` events from the stream.
      Watch the conveyor belt — pills slide right-to-left and dissolve
      as they're ingested.

  - id: step-2
    title: "Multi-Source Ingestion"
    activeCalls: [stream-to-matching, assign-to-matching]
    substates:
      matching-engine: processing
    narrative: >-
      Now the processor receives from **two sources** simultaneously.
      Both {color:orange|TripCreated} and {color:purple|AssignmentRequest}
      pills appear on the conveyor.

  - id: step-3
    title: "Processing Complete"
    activeCalls: []
    revealCalls: [stream-to-matching, assign-to-matching]
    substates:
      matching-engine: completed
    narrative: >-
      With no active incoming calls, the conveyor disappears —
      the node returns to a clean rounded rectangle.
```

**How it works:**
- **Active + incoming events:** Conveyor strip visible inside the node. Event pills show a call-type badge (📥 subscribe, ⚡ async, 📤 publish) plus the `messageType` text. Pills slide R→L and dissolve at the left edge via a CSS gradient mask — the "consumption" effect.
- **Active + no incoming events:** Standard active glow/pulse. Conveyor hidden. Clean rounded rect.
- **Inactive / Complete:** Standard shape-node dimming. No conveyor. The node is just a violet-bordered rectangle.
- **Conveyor speed** scales with event count — more incoming events = longer cycle time for readability.
- **Step transitions:** The conveyor appears and disappears between steps as calls activate and deactivate. Step 1 might show the conveyor, step 2 might not, step 3 might show it again with different events.

**When to use `event-processor` vs `worker`:**
- `event-processor` (conveyor belt) — for nodes that *ingest events* as their primary purpose. Stream processors (Flink, Spark Streaming, ksqlDB), CQRS projectors, event-sourced read model builders. The conveyor belt visually shows *what's being consumed*.
- `worker` (rounded rect) — for general background processors that don't primarily consume events. Job runners, batch processors, cron workers. No conveyor.

**The `event-stream` → `event-processor` pairing** is the visual storytelling sweet spot for event-driven architectures: the stream's marquee shows what's *flowing through* the backbone, and the processor's conveyor shows what's being *consumed* at the other end.

---

## 4. Edge Choreography

### Four Call Types

Each type has a distinct **dash pattern** and **traveling dot animation** — they're visually distinguishable even at a glance.

| Type | Pattern | Badge | Label Format | Best For |
|------|---------|-------|-------------|----------|
| `sync` | Solid line | `→` | `POST /orders 150ms` | HTTP, gRPC, direct calls |
| `async` | Dashed `8,5` | `⚡` | `OrderCreated` | Fire-and-forget messages |
| `publish` | Dotted `3,6` | `📤` | `pub OrderPlaced` | Event publication |
| `subscribe` | Dash-dot `8,3,2,3` | `📥` | `sub sendEmail` | Event consumption |

### Sync Calls — The Workhorse

```yaml
calls:
  - id: create-order
    type: sync
    from: gateway
    to: orders
    method: POST
    path: /orders
    protocol: http        # http | grpc | graphql
    duration: 150          # ms — shown on label
    status: 201            # HTTP status code
    response:              # Triggers a reverse edge!
      status: 201
      label: "Order Created"
```

### Async / Publish / Subscribe

```yaml
  # Fire-and-forget
  - id: send-command
    type: async
    from: api
    to: worker
    messageType: ProcessOrder
    correlationId: order-123

  # Publish to bus
  - id: emit-event
    type: publish
    from: orders
    to: events
    messageType: OrderCreatedEvent

  # Subscribe from bus
  - id: consume-event
    type: subscribe
    from: events
    to: notification
    messageType: OrderCreatedEvent
    action: SendConfirmationEmail    # Shows as label
```

---

## 5. Progressive Reveal

The magic of service-flow is **progressive disclosure**. Don't show everything at once.

### The Three Reveal Axes

| Field | What It Does |
|-------|-------------|
| `activeCalls` | Calls that are **alive right now** (bright, animated) |
| `revealCalls` | Calls that become **visible but dimmed** (previously active, now background) |
| `revealNodes` | Nodes that appear **without being called** (for context) |

### The Accumulation Pattern

Each step should `revealCalls` the calls from previous steps so they stay visible but fade to background:

```yaml
steps:
  - id: step-1
    activeCalls: [create-order]

  - id: step-2
    activeCalls: [check-cache]
    revealCalls: [create-order]          # Step 1's call stays visible

  - id: step-3
    activeCalls: [check-inventory]
    revealCalls: [create-order, check-cache]  # Steps 1+2 stay visible

  - id: step-4
    activeCalls: [save-order]
    revealCalls: [create-order, check-cache, check-inventory]
```

### The Big Reveal

Start with a subset, then reveal everything at the end:

```yaml
  - id: final-step
    title: "Complete Architecture"
    activeCalls: [every, single, call]
    camera:
      fitAll: true
      duration: 2000
      easing: ease-in-out
```

---

## 6. Sub-States: Living Nodes

Sub-states turn static boxes into **state machines**. Each node can show an animated badge that changes as the story progresses.

### Declaring Sub-States

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
      conductor: running       # Badge appears: "running" (blue)
      rescue-db: writing       # Badge appears: "writing" (purple)

  - id: step-2
    substates:
      conductor: waiting       # Badge changes: "waiting" (amber)
      # rescue-db is STICKY — stays "writing" until changed

  - id: step-3
    substates:
      conductor: completed     # Badge changes: "completed" (green)
      rescue-db: committed     # Badge changes: "committed" (green)

  - id: step-4
    substates:
      conductor: ~             # Badge REMOVED (cleared)
```

### Semantic Auto-Coloring

You don't pick colors — they're derived from keywords:

| Keywords | Color | Meaning |
|----------|-------|---------|
| idle, inactive, off | Gray | At rest |
| pending, queued, waiting, paused | Amber | Waiting for something |
| running, active, processing, assigned | Blue | Working |
| reading, fetching, querying | Cyan | Read operation |
| writing, inserting, updating, committing | Purple | Write operation |
| completed, done, approved, success, committed | Green | Success |
| failed, error, rejected, down | Red | Failure |
| escalated, warning, degraded, compensating | Orange | Degraded |
| locked, blocked, throttled | Rose | Blocked |

**Pro tip:** Name your sub-states using these keywords and the colors "just work."

### Dramatic Patterns

**The Lifecycle Arc:**
```
idle → processing → writing → committed → idle
```

**The Failure Path:**
```
idle → running → waiting → compensating → failed
```

**Parallel State Dance:** Multiple nodes changing sub-states simultaneously tells a rich story of coordination:

```yaml
substates:
  conductor: running
  rescue-db: writing
  pdf-gen: processing
  blob: uploading
```

---

## 7. Zones: Architectural Boundaries

Zones draw **translucent boundary boxes** around groups of services. They're rendered behind everything — pure context.

```yaml
zones:
  - id: security
    label: "Security Boundary"
    members: [waf, lb]
    color: "rgba(244, 63, 94, 0.06)"     # Rose tint

  - id: orchestration
    label: "Orchestration Layer"
    members: [conductor, scheduler, approval]
    color: "rgba(236, 72, 153, 0.06)"     # Pink tint

  - id: data
    label: "Data Layer"
    members: [db, cache, blob]
    color: "rgba(120, 113, 108, 0.06)"    # Stone tint
```

### Built-in Color Cycle

If you omit `color`, zones cycle through: Blue, Purple, Green, Orange, Pink, Cyan.

### Zone Patterns

- **Security boundary:** Group WAF + LB + auth together.
- **Domain boundaries:** Match your bounded contexts.
- **Infrastructure tiers:** Group by data, compute, messaging.
- **Blast radius:** Show what's affected by a failure (pairs beautifully with `simulateFailure`).

---

## 8. Scenes: Layout Direction Control

By default, all service-flow nodes are laid out **left-to-right** (LR) in a single Dagre graph. Scenes let you break your architecture into **layout groups** where each group can flow in a different direction — then scenes are composited together.

### The Problem

Real architectures have layers: an ingress chain flows horizontally (client → gateway → auth), but the domain services beneath might fan out vertically. A single `LR` layout forces everything into one horizontal line.

### The Solution: `scenes[]`

```yaml
scenes:
  - id: ingress
    direction: LR                    # Left-to-right (default)
    members: [client, gateway, auth]

  - id: domain
    direction: TB                    # Top-to-bottom
    members: [order-agg, payment-svc, inventory, order-db, events]
```

### Four Directions

| Direction | Flow | Best For |
|-----------|------|----------|
| `LR` | Left → Right | Request flows, pipelines, horizontal chains |
| `TB` | Top → Bottom | Layered architectures, dependency trees, domain models |
| `RL` | Right → Left | Response paths, reverse flows |
| `BT` | Bottom → Top | Promotion pipelines, bottom-up reveals |

### Scene Fields

```yaml
scenes:
  - id: scene-name          # Unique ID
    direction: TB            # LR | TB | RL | BT (default: LR)
    members: [svc-a, svc-b]  # Service/queue IDs in this scene
    nodesep: 60              # Pixel gap between sibling nodes (optional)
    ranksep: 200             # Pixel gap between ranks/layers (optional)
```

### How It Works

1. **Partition:** Each scene runs its own Dagre layout with its direction and spacing.
2. **Macro layout:** Scenes become meta-nodes in a second Dagre pass (TB by default) that positions them relative to each other.
3. **Merge:** Node coordinates are composited into the final canvas.
4. **Unassigned nodes** (not in any scene) get grouped into a default LR scene.

### Scene Rules

- **Every node can belong to at most one scene.** Putting a node in two scenes is a validation error.
- **Zone members must not span scenes.** A zone boundary can only contain nodes from a single scene.
- **Cross-scene edges still work.** Calls between scenes render normally — Dagre handles them via the macro graph.
- **Scenes stabilize layout.** All declared scene members are laid out (even if not yet revealed), so progressive reveal doesn't shift positions.

### Scene Patterns

**The Layered Architecture:**
```yaml
scenes:
  - id: ingress
    direction: LR
    members: [client, gateway, auth]
  - id: domain
    direction: TB
    members: [order-agg, payment-svc, inventory-svc, db]
```
Ingress flows horizontally across the top; domain services fan out vertically beneath.

**The Hub and Spokes:**
```yaml
scenes:
  - id: hub
    direction: LR
    members: [event-stream]
  - id: producers
    direction: TB
    members: [api-a, api-b, api-c]
  - id: consumers
    direction: TB
    members: [worker-x, worker-y, analytics]
```
Central event backbone with producers stacked on one side and consumers stacked on the other.

**Tight Spacing for Dense Models:**
```yaml
scenes:
  - id: ddd-model
    direction: TB
    nodesep: 30               # Tighter than default 60
    ranksep: 120              # Tighter than default 200
    members: [aggregate, entity-a, entity-b, vo-1, vo-2, repo]
```

### Scenes + Zones

Zones and scenes are complementary — zones are *visual boundaries*, scenes are *layout groups*. You can use both together, but zone members must all be in the same scene:

```yaml
scenes:
  - id: ingress
    direction: LR
    members: [waf, lb, gateway]
  - id: domain
    direction: TB
    members: [orders, payments, inventory, db]

zones:
  - id: dmz
    label: "DMZ"
    members: [waf, lb]           # Both in 'ingress' scene ✓
  - id: data
    label: "Data Layer"
    members: [db]                # In 'domain' scene ✓
```

---

## 9. Camera Cinematography

This is where stories become **films**. Every step can override the camera.

### Camera Override Fields

```yaml
camera:
  zoom: 1.8              # Target zoom level (0.1 – 5.0)
  duration: 2500          # Animation duration in ms
  easing: ease-in         # Named easing function
  focusNodes: [svc-a]     # Override which nodes to frame
  fitAll: true            # Zoom to show ALL nodes
  pan: [100, -50]         # Manual offset after focus
  padding: 150            # Px padding around focus area
```

### Five Named Easings

| Easing | Feel | Best For |
|--------|------|----------|
| `spring-overshoot` | Cinematic snap with 10% bounce | Default. Snappy transitions, most steps. |
| `ease-in` | Slow start, accelerating | Dramatic zoom-ins, building tension |
| `ease-out` | Fast start, gentle settle | Arriving at a detail, landing |
| `ease-in-out` | Smooth S-curve | Panoramic sweeps, fitAll transitions |
| `linear` | Constant speed | Tracking shots across many nodes |

### Camera Recipes

**The Establishing Shot** — Start wide, show everything:
```yaml
  - id: step-1
    title: "Architecture Overview"
    camera:
      fitAll: true
      duration: 2000
      easing: ease-in-out
```

**The Dramatic Zoom** — Slow push into a focal point:
```yaml
  - id: step-2
    title: "The Critical Service"
    focusNodes: [payment-svc]
    camera:
      zoom: 1.8
      duration: 2500
      easing: ease-in
```

**The Spring Snap** — Quick cinematic cut to action:
```yaml
  - id: step-3
    title: "Authentication"
    camera:
      zoom: 1.5
      duration: 800
      easing: spring-overshoot
```

**The Tracking Shot** — Smooth pan across a layer:
```yaml
  - id: step-4
    title: "API Layer"
    focusNodes: [api, user-svc, order-svc, payment-svc]
    camera:
      zoom: 1.2
      duration: 1500
      easing: linear
```

**The Pull-Back Reveal** — Zoom out to show the big picture:
```yaml
  - id: step-5
    title: "Event-Driven Architecture"
    camera:
      fitAll: true
      duration: 2000
      easing: ease-in-out
      padding: 150
```

### Camera Priority

1. `fitAll: true` wins — zooms to fit everything.
2. `focusNodes` override — frames those specific nodes.
3. Auto-focus — frames nodes involved in `activeCalls`.

### The Arc Pattern

The best stories follow a **camera arc**:

```
fitAll (establish) → zoom-in (detail) → zoom-in (detail) → zoom-in (detail) → fitAll (resolve)
```

This gives your audience the full context, takes them on a journey through details, then brings them back to see how it all fits together.

---

## 10. Edge Effects: Yeet Things!

Three projectile effect types that fire along edges when a call is active. This is the fun stuff.

### emoji-fan — Scatter Emojis Along an Edge

Emojis spawn and fan out from source to target with physics-based motion.

```yaml
calls:
  - id: publish-event
    type: publish
    from: orders
    to: events
    messageType: OrderCreated
    effect:
      type: emoji-fan
      emojis: ["📦", "✨", "🎉"]   # Randomly picked per projectile
      count: 8                        # How many emojis
      spread: 45                      # Fan angle in degrees
      speed: 150                      # Pixels per frame
      duration: 2000                  # Total effect duration ms
      direction: from-source          # Where they spawn
      gravity: 0                      # Downward pull (0 = float)
      fade: true                      # Fade out over time
      scale: [1.2, 0.4]              # Start big, shrink
      stagger: 100                    # Delay between emissions
      jitter: 0.3                     # Random position wobble
```

**Best emojis by context:**
| Context | Emojis |
|---------|--------|
| Events/messages | `["📨", "📦", "✉️"]` |
| Errors/failures | `["💥", "🔥", "❌"]` |
| Success/completion | `["✅", "🎉", "✨"]` |
| Money/payments | `["💰", "💳", "🏦"]` |
| Alerts/monitoring | `["🚨", "🔔", "⚠️"]` |
| Data/storage | `["💾", "📀", "🗄️"]` |
| Speed/performance | `["⚡", "🚀", "💨"]` |
| Security | `["🔒", "🛡️", "🔑"]` |

### label-yeet — Text That Flies

A text label in a pill that launches from the edge with gravity physics. The label literally gets **yeeted**.

```yaml
calls:
  - id: cache-miss
    type: sync
    from: orders
    to: cache
    method: GET
    path: /stock/ABC
    effect:
      type: label-yeet
      label: "CACHE MISS!"           # The text that flies
      count: 1                        # Usually just 1
      speed: 200                      # Launch velocity
      gravity: 2                      # Falls like a physical object
      direction: from-target          # Launches FROM the cache
      fade: true
      scale: [1.5, 0.8]
```

**label-yeet ideas:**
- `"CACHE HIT! ⚡"` on a cache read
- `"TIMEOUT!"` on a slow call
- `"201 CREATED"` on a successful write
- `"ROLLBACK"` on a compensation
- `"RETRY #3"` on a retry path

### particle-stream — Colored Dot Stream

Flowing colored particles along an edge — like data visually flowing through a pipe.

```yaml
calls:
  - id: data-stream
    type: subscribe
    from: events
    to: processor
    messageType: StreamData
    effect:
      type: particle-stream
      count: 15                       # Dense stream of dots
      speed: 100                      # Moderate flow speed
      direction: along-edge           # Distributed along the full edge
      stagger: 50                     # Fast emission rate
      duration: 2500
      jitter: 0.1                     # Tight stream
      fade: true
```

### Effect Directions

| Direction | Behavior |
|-----------|----------|
| `along-edge` | Projectiles spawn at random points along the edge path |
| `from-source` | All spawn at source, fan toward target |
| `from-target` | All spawn at target, fan backward |
| `radial` | Spawn at midpoint, disperse in all directions |

### Step-Level Effect Overrides

Override or add effects per step without changing the call definition:

```yaml
steps:
  - id: step-3
    title: "Event Burst"
    activeCalls: [publish-event]
    effects:
      - target: publish-event         # Call ID to attach effect to
        type: emoji-fan
        emojis: ["🚀", "📡"]
        count: 12
        spread: 60
```

### Effect Composition Rules

- **One effect per call** (call-level). Step-level overrides replace call-level.
- **Effects only fire when the call is active** (`activeCalls` includes the call ID).
- **Don't put effects on every call.** 1-2 per story is impactful. 10 is chaos.
- **Match the effect to the moment.** emoji-fan for events, label-yeet for status callouts, particle-stream for data flow.

---

## 11. Coupling & Failure Cascade

### Three Coupling Levels

Every call can declare its coupling level. This changes the edge's visual weight:

```yaml
calls:
  - id: order-to-payment
    type: sync
    from: order-svc
    to: payment-svc
    coupling: tight       # RED, thick solid line
    critical: true        # Part of the failure cascade chain

  - id: order-to-cache
    type: sync
    from: order-svc
    to: cache
    coupling: loose       # BLUE, normal line
    fallback: "Skip cache, serve from DB"

  - id: order-to-events
    type: publish
    from: order-svc
    to: events
    coupling: eventual    # GRAY, thin dashed line
```

| Level | Visual | Meaning |
|-------|--------|---------|
| `tight` | Thick red solid | Synchronous. If it fails, caller fails. |
| `loose` | Normal blue solid | Can degrade gracefully. Has fallback. |
| `eventual` | Thin gray dashed | Async, eventually consistent. No availability coupling. |

### Failure Cascade — The Money Shot

Set `simulateFailure` on a step to watch the dominoes fall:

```yaml
steps:
  - id: step-3
    title: "Payment DB Goes Down"
    activeCalls: [gw-to-order, order-to-payment, payment-to-db]
    simulateFailure: payment-db       # The node that fails
    substates:
      payment-svc: failed
    camera:
      zoom: 1.1
      easing: ease-out
      duration: 1500
```

**What happens:**
1. `payment-db` is marked as failed.
2. BFS walks **upstream** through `critical: true` calls.
3. Every upstream service turns **red with a pulse animation**.
4. Every traversed edge turns **red and pulses**.
5. Calls with `fallback` show a **green dashed fallback edge**.
6. Services on `eventual` coupling are **unaffected** — the blast radius stops.

### The Failure Story Arc

The most dramatic stories follow this pattern:

```
Step 1: "Normal Operation" — show everything working, all coupling visible
Step 2: "Critical Path"    — zoom into the tight-coupling chain
Step 3: "💥 FAILURE!"      — simulateFailure, watch the cascade
Step 4: "Resilience"       — zoom to eventual-consistency services, unaffected
```

This is the **"why coupling analysis matters"** story that makes architects nod.

---

## 12. Rich Text Narration

All text fields (`narrative`, `narration.message`, `description`) support inline markup:

### Markup Syntax

| Syntax | Renders As | Example |
|--------|-----------|---------|
| `**text**` | **bold** | `**critical path**` |
| `*text*` | *italic* | `*optional*` |
| `` `text` `` | `code` | `` `POST /api` `` |
| `{color:name\|text}` | colored text | `{color:red\|failure}` |
| `\n` | line break | multi-line narration |

### Available Colors

11 named colors: `blue`, `green`, `red`, `orange`, `amber`, `purple`, `pink`, `cyan`, `teal`, `yellow`, `gray` — plus raw hex like `{color:#3B82F6|text}`.

### Two Narration Styles

**Simple narrative** — just text:
```yaml
narrative: >-
  The **Gateway** receives `POST /trips` and routes to
  the {color:blue|Trip Service}, which emits a
  {color:orange|TripCreated} event.
```

**Speaker narration** — attributed quote:
```yaml
narration:
  speaker: Architect
  message: >-
    Notice the {color:red|tight coupling} between Payment Service
    and its database. This is our **single point of failure**.
```

### Narration Pro Tips

- Use `{color:red|...}` to highlight dangers and failures.
- Use `{color:green|...}` for successes and healthy paths.
- Use `` `backticks` `` for API paths, event names, and technical terms.
- Use **bold** for key concepts — one or two per narration, not every other word.
- Keep narrations to 2-3 sentences. The visuals do the heavy lifting.

---

## 13. Tags: Metadata That Breathes

Tags are key-value metadata pills that appear inside nodes. They auto-categorize by color:

```yaml
services:
  - id: orders
    name: Order Service
    type: api
    technology: Node.js
    status: healthy
    instances: 3
    version: "2.1"
    tags:
      protocol: gRPC        # infra (blue)
      team: platform         # identity (purple)
      SLA: "99.9%"           # status (green)
      latency: "85ms p99"   # metric (orange)
```

### Tag Categories (Auto-Detected)

| Category | Color | Keys |
|----------|-------|------|
| **infra** | Blue | protocol, broker, runtime, cloud, platform, region, framework, language |
| **metric** | Orange | instances, depth, consumers, throughput, latency, replicas, cpu, memory, rps |
| **identity** | Purple | version, team, owner, domain, namespace |
| **status** | Green | sla, health, tier, env, stage |

Max 4 visible tags per node (overflow shows `+N` badge).

### Tags on Queues Too

```yaml
queues:
  - id: order-events
    name: order-events
    type: topic
    broker: kafka
    depth: 1234
    consumers: 5
    tags:
      throughput: "50k/s"
      tier: premium
      region: us-east-1
```

---

## 14. Response Edges: The Round Trip

Sync calls can declare a `response` to create a **reverse edge** — showing the return path:

```yaml
calls:
  - id: create-order
    type: sync
    from: gateway
    to: orders
    method: POST
    path: /orders
    duration: 150
    response:
      status: 201
      label: "Order Created"    # Optional override (default: status code)
```

This generates a second edge (dashed, hollow arrow) from `orders` back to `gateway` with a `↩ 201` label. The response edge activates at the same time as the forward call.

**When to use responses:**
- On the "entry" call (client → gateway, gateway → service) to show the full HTTP lifecycle.
- Not on every internal call — it gets noisy. Pick the 1-2 calls where showing the response adds meaning.

---

## 15. Self-Loops

When `from` and `to` are the same service, the edge renders as an **arc above the node**:

```yaml
calls:
  - id: self-retry
    type: async
    from: conductor
    to: conductor
    messageType: RetryWorkflow
```

Multiple self-loops on the same node stack vertically. Self-loops work with all call types and effects.

---

## 16. Patterns & Recipes

### Recipe: The Saga Orchestration

Show a workflow engine coordinating multiple services through a multi-step process.

```yaml
services:
  - id: conductor
    type: workflow
    substates: [idle, running, waiting, compensating, completed, failed]
    initialSubstate: idle

  - id: approval
    type: human-task
    substates: [pending, assigned, reviewing, approved, rejected]

# Steps follow the saga lifecycle:
# idle → running → waiting (human) → running → completed
```

**Key elements:** Sub-states on the workflow node, human-task for approval gates, async calls for task assignment, camera zooming into each phase.

### Recipe: The Security Onion

Show request path through security layers with zones.

```yaml
zones:
  - id: dmz
    label: "DMZ"
    members: [waf, lb]
  - id: trusted
    label: "Trusted Network"
    members: [auth, api, services...]

services:
  - id: waf
    type: firewall
  - id: lb
    type: load-balancer
  - id: auth
    type: api
    substates: [idle, authenticating, verified]
```

**Key elements:** Zones for DMZ vs trusted, firewall + load-balancer types, sub-states on auth service, progressive reveal from outer to inner layers.

### Recipe: The DDD Domain Model

Use all 10 domain types to visualize a bounded context's internal model.

```yaml
services:
  - { id: customer, type: actor }
  - { id: order, type: aggregate }
  - { id: order-line, type: value-object }
  - { id: product, type: entity }
  - { id: order-placed, type: domain-event }
  - { id: pricing, type: policy }
  - { id: repo, type: repository }
  - { id: summary, type: read-model }
  - { id: fulfillment, type: saga }
  - { id: order-bc, type: bounded-context }
```

**Key elements:** Actor initiates, aggregate coordinates, value-objects and entities compose, events emit, saga orchestrates cross-BC, read-model for CQRS projections.

### Recipe: The Failure Analysis

Demonstrate blast radius through coupling analysis.

```yaml
# Declare coupling + critical on calls:
calls:
  - { id: a-to-b, coupling: tight, critical: true }
  - { id: b-to-c, coupling: tight, critical: true }
  - { id: a-to-cache, coupling: loose, fallback: "Skip cache" }
  - { id: a-to-events, coupling: eventual }

steps:
  # Step 1: Normal operation (fitAll)
  # Step 2: Highlight critical path (zoom)
  # Step 3: simulateFailure! (cascade)
  # Step 4: Show resilient eventual path (unaffected)
```

### Recipe: The Cinematic Demo

Pure camera showcase — same architecture, different emotional arcs.

```yaml
steps:
  - camera: { fitAll: true, duration: 2000, easing: ease-in-out }   # Establish
  - camera: { zoom: 1.8, duration: 2500, easing: ease-in }          # Dramatic zoom
  - camera: { zoom: 1.5, duration: 800, easing: spring-overshoot }  # Snap to action
  - camera: { zoom: 1.2, duration: 1500, easing: linear }           # Tracking pan
  - camera: { zoom: 1.6, duration: 1200, easing: ease-out }         # Land on detail
  - camera: { fitAll: true, duration: 2000, easing: ease-in-out, padding: 150 }  # Pull back
```

### Recipe: The Event-Driven Celebration

When a saga completes, yeet some emojis:

```yaml
calls:
  - id: saga-complete
    type: publish
    from: conductor
    to: events
    messageType: SagaCompleted
    effect:
      type: emoji-fan
      emojis: ["🎉", "✅", "🚀"]
      count: 10
      spread: 60
      speed: 180
      gravity: 1
      duration: 2500

steps:
  - id: final
    title: "Saga Complete!"
    activeCalls: [saga-complete]
    substates:
      conductor: completed
    camera:
      fitAll: true
      duration: 1500
```

### Recipe: The Event Backbone

Show a high-throughput event stream as the central nervous system with multiple producers and consumers.

```yaml
services:
  - id: trip-api
    name: Trip API
    type: api
    technology: "Node.js"

  - id: trip-stream
    name: Trip Events
    type: event-stream
    technology: "Kafka"
    tags:
      partitions: "24"
      throughput: "100k/s"
    events:
      - key: TripCreated
        emoji: "📦"
        color: "#3B82F6"
        value: "trip_id, rider_id"
      - key: DriverAssigned
        emoji: "🚗"
        color: "#22C55E"
        value: "trip_id, driver_id"
      - key: TripCompleted
        emoji: "✅"
        color: "#10B981"
        value: "trip_id, fare"

  - id: matching
    name: Matching Engine
    type: worker
    technology: "Rust"

  - id: billing
    name: Billing
    type: api
    technology: "Java"

calls:
  - id: api-publish
    type: publish
    from: trip-api
    to: trip-stream
    messageType: TripCreated

  - id: stream-to-matching
    type: subscribe
    from: trip-stream
    to: matching
    messageType: TripCreated
    action: "assign driver"

  - id: stream-to-billing
    type: subscribe
    from: trip-stream
    to: billing
    messageType: TripCompleted
    action: "calculate fare"

steps:
  # Step 1: Producer publishes — the pipe comes alive with scrolling events
  # Step 2: Fan-out to consumers — edges animate from the pipe outward
  # Step 3: fitAll — the wide pipe dominates the center, consumers flank it
```

**Key elements:** One `event-stream` at the center, producers publish into it (left), consumers subscribe from it (right). The marquee of event pills inside the pipe visually shows *what's flowing*. Tags show throughput metrics. The wide pipe shape (420px) naturally becomes the visual backbone of the layout.

**Pro tip:** Use `event-stream` for the *one* central backbone. Use `event-bus` (hexagon) for secondary topics or exchanges that branch off. Mixing both in one story shows the hierarchy of your messaging infrastructure.

### Recipe: The Stream Processing Pipeline

The killer combo — `event-stream` producing, `event-processor` consuming, conveyor belt showing the ingestion in real time.

```yaml
services:
  - id: api
    name: Trip API
    type: api
    technology: "Node.js"

  - id: stream
    name: Trip Events
    type: event-stream
    technology: "Kafka"
    tags:
      partitions: "24"
      throughput: "100k/s"
    events:
      - key: TripCreated
        emoji: "📦"
        color: "#3B82F6"
      - key: DriverAssigned
        emoji: "🚗"
        color: "#22C55E"

  - id: matcher
    name: Matching Engine
    type: event-processor
    technology: "Flink"
    substates: [idle, processing, backpressure]
    initialSubstate: idle

  - id: projector
    name: Analytics Projector
    type: event-processor
    technology: "ksqlDB"
    substates: [idle, projecting]
    initialSubstate: idle

  - id: analytics-db
    name: Analytics Store
    type: database
    technology: "ClickHouse"

calls:
  - id: api-publish
    type: publish
    from: api
    to: stream
    messageType: TripCreated

  - id: stream-to-matcher
    type: subscribe
    from: stream
    to: matcher
    messageType: TripCreated
    action: "match driver"

  - id: stream-to-projector
    type: subscribe
    from: stream
    to: projector
    messageType: TripCreated
    action: "project analytics"

  - id: projector-to-db
    type: sync
    from: projector
    to: analytics-db
    method: INSERT
    path: /trip_metrics

steps:
  - id: step-1
    title: "Events Flow"
    activeCalls: [api-publish]
    narrative: >-
      The **Trip API** publishes `TripCreated` events. The stream's
      marquee shows them flowing through the backbone.
    camera:
      fitAll: true
      duration: 1500

  - id: step-2
    title: "Matching Ingestion"
    activeCalls: [stream-to-matcher]
    revealCalls: [api-publish]
    substates:
      matcher: processing
    narrative: >-
      The **Matching Engine** subscribes — its conveyor belt lights up,
      pulling {color:blue|TripCreated} pills right-to-left as they're consumed.
    camera:
      focusNodes: [matcher]
      zoom: 1.5
      duration: 1200

  - id: step-3
    title: "Fan-Out Processing"
    activeCalls: [stream-to-matcher, stream-to-projector, projector-to-db]
    revealCalls: [api-publish]
    substates:
      matcher: processing
      projector: projecting
      analytics-db: writing
    narrative: >-
      Both processors consume simultaneously. The **Analytics Projector**
      ingests the same events and writes to {color:purple|ClickHouse}.
      Two conveyor belts running in parallel.
    camera:
      fitAll: true
      duration: 1500
      easing: ease-in-out

  - id: step-4
    title: "Back to Idle"
    revealCalls: [api-publish, stream-to-matcher, stream-to-projector, projector-to-db]
    substates:
      matcher: idle
      projector: idle
    narrative: >-
      Processing complete. Both processors return to idle — conveyor belts
      disappear, nodes return to clean rounded rectangles. The architecture
      is ready for the next burst.
    camera:
      fitAll: true
      duration: 2000
```

**Key elements:** The `event-stream` marquee flows L→R (production), while the `event-processor` conveyors flow R→L (consumption) — visually mirroring the data flow. Sub-states on the processors show their lifecycle (`idle → processing → idle`). The conveyor appears/disappears per step based on which calls are active — step 2 shows one conveyor, step 3 shows two, step 4 shows none.

**Pro tip:** Pair an `event-stream` with 1-3 `event-processor` nodes to tell the complete event-driven story. The stream is the *source of truth*, the processors are the *consumers*. Each processor's conveyor shows exactly which events it cares about, derived from the `messageType` on the active calls.

---

## 17. The Checklist

Before calling your story "done," verify:

### Structure
- [ ] Every service has a unique `id` and descriptive `name`
- [ ] Every call references valid `from` and `to` service/queue IDs
- [ ] Steps accumulate `revealCalls` properly (nothing disappears unexpectedly)
- [ ] First step has `focusNodes` or `camera.fitAll` (don't start with auto-focus on nothing)

### Visual Polish
- [ ] Sub-states tell a coherent lifecycle story (not random state jumps)
- [ ] Zones group logically related services (not just "stuff near each other")
- [ ] No more than 3-4 `activeCalls` per step (visual clarity)
- [ ] Tags add genuine context (not just filler)

### Camera
- [ ] First step establishes the scene (fitAll or focused overview)
- [ ] Last step resolves (fitAll or meaningful final focus)
- [ ] Camera movements match emotional beats (slow = dramatic, spring = action)
- [ ] No step is missing camera intent (either explicit `camera:` or good `focusNodes`)

### Effects
- [ ] Effects are used sparingly (1-3 per story max)
- [ ] Effect type matches the moment (emoji-fan for events, label-yeet for callouts)
- [ ] Gravity and direction make physical sense

### Narration
- [ ] Every step has either `narrative` or `narration` (never both, never neither)
- [ ] Rich text highlights key terms, not every word
- [ ] Color markup matches semantic meaning (red=danger, green=success)
- [ ] Narrations are 2-3 sentences max

### Coupling & Failure (if used)
- [ ] `coupling` is set on all calls in the story (not just some)
- [ ] `critical: true` forms a connected chain for cascade
- [ ] `fallback` is set on `loose` coupling calls
- [ ] `simulateFailure` step has dramatic camera + sub-state changes

---

## Quick Reference Card

```yaml
# ── SERVICE FIELDS ──
id, name, type, technology?, status?, instances?, version?, tags?, substates?, initialSubstate?
# event-stream extra: events[{key, value?, emoji?, color?}]
# event-processor: conveyor belt auto-derived from active calls with messageType (no extra fields)

# ── QUEUE FIELDS ──
id, name, type (queue|topic|stream), broker?, depth?, consumers?, tags?

# ── CALL FIELDS (all types) ──
id, type (sync|async|publish|subscribe), from, to, coupling?, critical?, fallback?, effect?
# sync extra: method?, path?, protocol?, duration?, status?, response?, payload?
# async extra: messageType, correlationId?, payload?
# publish extra: messageType, payload?
# subscribe extra: messageType, action?

# ── EFFECT FIELDS ──
type (emoji-fan|label-yeet|particle-stream), emojis?, label?, count?, spread?,
direction?, speed?, jitter?, gravity?, fade?, scale?, stagger?, duration?

# ── CAMERA FIELDS ──
zoom?, duration?, easing?, focusNodes?, fitAll?, pan?, padding?

# ── STEP FIELDS ──
id, title, narrative?, narration?, activeCalls, focusNodes?, revealNodes?,
revealCalls?, substates?, effects?, camera?, simulateFailure?, duration?

# ── ZONE FIELDS ──
id, label, members[], color?

# ── SCENE FIELDS ──
id, direction (LR|TB|RL|BT), members[], nodesep?, ranksep?
```

---

*Now go make something amazing.*
