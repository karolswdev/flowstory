# 01 — Story Foundation

Every service-flow story is a YAML file with a fixed skeleton. This document defines the structure, field-by-field.

---

## The Skeleton

```yaml
id: my-story                    # Unique story ID (kebab-case)
title: "My Story Title"         # Display title
renderer: service-flow           # MUST be "service-flow"
schemaVersion: "2.0"             # MUST be "2.0"
description: "One sentence"      # Optional — shown in catalog

services: [...]                  # The cast — nodes on the canvas
queues: [...]                    # Optional — message infrastructure nodes
calls: [...]                     # The relationships — edges between nodes
zones: [...]                     # Optional — visual boundary boxes
scenes: [...]                    # Optional — layout direction groups
steps: [...]                     # The narrative — ordered step sequence
```

**All top-level fields are documented in the sections below.** Only `id`, `title`, `renderer`, `schemaVersion`, `services`, `calls`, and `steps` are required.

---

## Services — The Cast

Each service is a node on the canvas. There are 28 types (see `02-nodes.md`).

```yaml
services:
  - id: order-svc                # Unique ID (referenced in calls, steps, zones, scenes)
    name: Order Service          # Display name (shown on node)
    type: api                    # One of 28 service types
    technology: "Node.js"        # Optional — shown as subtitle
    status: healthy              # Optional — healthy | degraded | down
    instances: 3                 # Optional — instance count badge
    version: "2.1"               # Optional — version string
    tags:                        # Optional — metadata pills on node
      protocol: gRPC
      team: platform
      SLA: "99.9%"
    substates:                   # Optional — available sub-state names
      - idle
      - running
      - completed
    initialSubstate: idle        # Optional — starting sub-state
```

### Event Stream Services (special)

Services with `type: event-stream` accept an `events` array defining what flows through the pipe:

```yaml
services:
  - id: trip-stream
    name: Trip Events
    type: event-stream
    technology: "Kafka"
    events:
      - key: TripCreated
        value: "trip_id, rider_id"
        emoji: "📦"
        color: "#3B82F6"
      - key: DriverAssigned
        value: "trip_id, driver_id"
        emoji: "🚗"
        color: "#22C55E"
```

### Event Processor Services (special)

Services with `type: event-processor` automatically show a conveyor belt when active calls with `messageType` target them. **No extra YAML fields needed** — the conveyor derives from active calls.

---

## Queues — Message Infrastructure

Queues are separate from services. They render as distinct queue-shaped nodes.

```yaml
queues:
  - id: order-events
    name: order-events
    type: topic                  # queue | topic | stream
    broker: kafka                # rabbitmq | kafka | sqs | servicebus | redis
    depth: 1234                  # Optional — queue depth
    consumers: 5                 # Optional — consumer count
    tags:
      throughput: "50k/s"
```

---

## Calls — The Relationships

Calls are edges between nodes. There are 4 types (see `03-connections.md` for full details).

```yaml
calls:
  # Synchronous HTTP/gRPC call
  - id: create-order
    type: sync
    from: gateway
    to: order-svc
    method: POST
    path: /orders
    duration: 150
    response:
      status: 201
      label: "Order Created"

  # Fire-and-forget async message
  - id: process-cmd
    type: async
    from: order-svc
    to: worker
    messageType: ProcessOrder

  # Publish event to bus/stream
  - id: emit-event
    type: publish
    from: order-svc
    to: event-bus
    messageType: OrderCreated

  # Subscribe to events
  - id: consume-event
    type: subscribe
    from: event-bus
    to: notification-svc
    messageType: OrderCreated
    action: SendEmail
```

### Fields Available on ALL Call Types

| Field | Type | Description |
|-------|------|-------------|
| `coupling` | `tight \| loose \| eventual` | Visual coupling weight |
| `critical` | `boolean` | Part of failure cascade chain |
| `fallback` | `string` | Fallback description (shown on failure) |
| `effect` | `object` | Edge projectile effect |
| `travelingLabel` | `boolean` | Label rides along edge when active |
| `stream` | `boolean \| object` | Continuous particle flow along edge |

---

## Zones — Visual Boundaries

Translucent boundary boxes drawn behind groups of services.

```yaml
zones:
  - id: dmz
    label: "DMZ"
    members: [waf, lb]
    color: "rgba(244, 63, 94, 0.06)"   # Optional — defaults to auto-cycle
```

**Auto-cycle colors** (when `color` omitted): Blue, Purple, Green, Orange, Pink, Cyan.

**Rule:** Zone members must all belong to the same scene (if scenes are used).

---

## Scenes — Layout Direction Groups

Scenes partition services into layout groups with independent Dagre directions.

```yaml
scenes:
  - id: ingress
    direction: LR                # LR | TB | RL | BT (default: LR)
    members: [client, gateway, auth]
    nodesep: 60                  # Optional — pixel gap between siblings
    ranksep: 200                 # Optional — pixel gap between ranks
  - id: domain
    direction: TB
    members: [orders, payments, db]
```

See `06-layout.md` for full scene system documentation.

---

## Steps — The Narrative

Steps are the heart of every story. Each step controls what's visible, active, narrated, and where the camera points.

```yaml
steps:
  - id: step-1                  # Unique step ID
    title: "Request Arrives"    # Step title (shown in overlay)

    # What's alive this step:
    activeCalls: [create-order]  # Call IDs — bright, animated edges

    # What becomes visible (but dimmed):
    revealCalls: []              # Call IDs — previously active, now background
    revealNodes: []              # Service/queue IDs — appear without being called

    # Camera focus:
    focusNodes: [gateway]        # Optional — explicit camera targets
    camera:                      # Optional — per-step camera overrides
      zoom: 1.5
      duration: 1200
      easing: ease-in

    # Narration (use ONE of these, not both):
    narrative: >-
      The **Gateway** receives `POST /orders`
      and routes to the {color:blue|Order Service}.
    # OR:
    narration:
      speaker: Architect
      message: "Notice the tight coupling here."

    # Node state changes:
    substates:
      order-svc: processing      # Set sub-state badge
      db: ~                      # Clear sub-state (null)

    # Failure simulation:
    simulateFailure: payment-db  # Optional — triggers cascade

    # Effect overrides:
    effects:                     # Optional — step-level effect overrides
      - target: emit-event       # Call ID
        type: emoji-fan
        emojis: ["📦", "✨"]

    # Auto-advance:
    duration: 5000               # Optional — ms before auto-advance
```

---

## Pacing Guidelines

| Story Length | Steps | Best For |
|-------------|-------|----------|
| Quick demo | 3-4 | Single interaction, one concept |
| Standard | 5-8 | Complete flow: setup → climax → resolution |
| Deep dive | 8-12 | Saga orchestration, failure analysis, DDD models |

**Golden rule:** Each step should activate 1-3 calls. More than 4 active calls per step creates visual noise.

**Camera arc:** Start with `fitAll` or wide overview → zoom into details → zoom into details → pull back to `fitAll`. This is the establishing → journey → resolution arc that makes stories compelling.
