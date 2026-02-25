# Service-Flow Mastery Guide

The **service-flow** renderer is FlowStory's flagship — an architecture storytelling engine built for CTO-ready presentations. It visualizes infrastructure topology, domain models, coupling analysis, and failure cascades through step-by-step animated narratives.

---

## Overview & When to Use

Use `service-flow` when you need to show:
- How microservices call each other (sync/async/pub-sub)
- Request flow through an architecture (gateway → service → database)
- Event-driven choreography (publish → queue → subscribe)
- Infrastructure topology with zones and grouping
- DDD domain models (aggregates, entities, policies, sagas)
- Coupling analysis and failure cascade visualization
- Cinematic camera-driven architecture walkthroughs

**Not ideal for:** Entity lifecycles (use `state-diagram`), API detail (use `http-flow`), system landscape (use `c4-context`).

---

## Schema Reference

### Story Header

```yaml
id: my-story
title: "My Service Flow"
renderer: service-flow
schemaVersion: "2.0"
layout: sequence                # only option currently (dagre LR)
description: "Optional description"
```

### Services

```yaml
services:
  - id: string                  # unique, referenced in calls/steps
    name: string                # display label
    type: <service-type>        # see 27 types below
    technology: string?         # shown below name (e.g. "Node.js")
    status: healthy|degraded|down?   # status dot + visual effect
    instances: number?          # multi-instance badge (e.g. "x3")
    version: string?            # version badge (e.g. "v2.1")
    tags: {key: value}?         # colored metadata pills
    substates: [string]?        # named sub-state list
    initialSubstate: string?    # starting sub-state
```

### Queues

```yaml
queues:
  - id: string
    name: string
    type: queue|topic|stream
    broker: rabbitmq|kafka|sqs|servicebus|redis?
    depth: number?              # message count display
    consumers: number?          # consumer count
    tags: {key: value}?
```

### Calls (Discriminated Union)

Calls are the edges of the graph. The `type` field determines available fields. All four call types share these optional fields:

| Field | Type | Description |
|-------|------|-------------|
| `coupling` | `tight\|loose\|eventual` | Coupling level — affects edge color and cascade behavior |
| `critical` | `boolean` | Marks the call as critical path — participates in failure cascade BFS |
| `fallback` | `string` | Fallback service/strategy name — shown when cascade reaches this call |
| `effect` | `CallEffect` | Edge visual effect (emoji-fan, label-yeet, particle-stream) |

#### Sync Call

```yaml
- id: string
  type: sync
  from: service-id
  to: service-id
  method: string?               # POST, GET, INSERT, etc.
  path: string?                 # /orders, /stock/ABC
  protocol: http|grpc|graphql?
  duration: number?             # milliseconds
  status: number|ok|error?      # 200, 201, ok, error
  coupling: tight|loose|eventual?
  critical: boolean?
  fallback: string?
  response:                     # generates reverse dotted edge
    status: number|string
    label: string?              # e.g. "Order Created"
```

#### Async Call

```yaml
- id: string
  type: async
  from: service-id
  to: service-id
  messageType: string           # e.g. "OrderCreatedEvent"
  correlationId: string?
  coupling: tight|loose|eventual?
  critical: boolean?
  fallback: string?
```

#### Publish (Service → Queue)

```yaml
- id: string
  type: publish
  from: service-id
  to: queue-id
  messageType: string
  coupling: tight|loose|eventual?
  critical: boolean?
  fallback: string?
```

#### Subscribe (Queue → Service)

```yaml
- id: string
  type: subscribe
  from: queue-id
  to: service-id
  messageType: string
  action: string?               # e.g. "SendConfirmationEmail"
  coupling: tight|loose|eventual?
  critical: boolean?
  fallback: string?
```

### Zones

```yaml
zones:
  - id: string
    label: string               # displayed as watermark text
    members: [service-ids, queue-ids]
    color: string?              # hex or rgba override
```

### Steps

```yaml
steps:
  - id: string
    title: string
    narrative: string           # shown in step overlay
    activeCalls: [call-ids]     # REQUIRED — calls that glow
    focusNodes: [node-ids]?     # camera targets (overrides auto)
    revealNodes: [node-ids]?    # show nodes without active call
    revealCalls: [call-ids]?    # show edges in completed state
    duration: number?           # ms (for auto-advance)
    narration:                  # alternative to narrative
      speaker: string
      message: string
    substates:                  # per-node sub-state overrides
      service-id: string|null   # set or clear (~) sub-state
    effects: [StepCallEffect]?  # per-call edge effects for this step
    camera:                     # per-step camera override
      zoom: number?             # target zoom level (0.1–5)
      duration: number?         # animation ms (100–10000)
      easing: string?           # spring-overshoot|linear|ease-in|ease-out|ease-in-out
      focusNodes: [node-ids]?   # explicit focus (overrides auto)
      fitAll: boolean?          # zoom out to show everything
      pan: [x, y]?             # manual offset after focus
      padding: number?          # px around focus area
    simulateFailure: string?    # service ID to fail — triggers BFS cascade
```

**Rich text markup** is supported in `narrative` and `narration.message`: `**bold**`, `*italic*`, `` `code` ``, `{color:name|text}` (11 named Tailwind colors + hex), `\n` line breaks. See the Presentation Playbook for best practices.

---

## Service Types (27: 17 Infrastructure + 10 Domain)

### Infrastructure Types (17)

| Type | Shape | Border Color | Lucide Icon | Best Use |
|------|-------|-------------|-------------|----------|
| `api` | Rectangle | Blue #3B82F6 | `Server` | REST/gRPC microservices |
| `worker` | Rounded rectangle | Purple #A855F7 | `Hammer` | Background job processors |
| `gateway` | Diamond | Amber #F59E0B | `Globe` | API gateways, load balancers |
| `database` | Cylinder | Stone #78716C | `Database` | PostgreSQL, MongoDB, DynamoDB |
| `cache` | Rounded square | Cyan #06B6D4 | `Zap` | Redis, Memcached |
| `external` | Cloud | Slate #64748B | `Cloud` | Third-party APIs, SaaS |
| `event-bus` | Hexagon | Orange #F97316 | `Radio` | Kafka broker, event mesh |
| `workflow` | Pill | Pink #EC4899 | `GitBranch` | Saga orchestrators, step functions |
| `event-processor` | Rounded rectangle | Violet #8B5CF6 | `Activity` | Stream processors, Flink |
| `client` | Card + avatar | Indigo #6366F1 | `Monitor` | Browser, mobile, CLI clients |
| `firewall` | Octagon | Rose #F43F5E | `ShieldCheck` | WAF, security boundaries |
| `load-balancer` | Inverted trapezoid | Teal #14B8A6 | `Network` | L4/L7 load balancers |
| `scheduler` | Circle | Amber #D97706 | `Clock` | Cron, scheduled triggers |
| `storage` | Wide cylinder | Stone #A8A29E | `HardDrive` | Blob/object storage, S3 |
| `function` | Parallelogram | Orange #EA580C | `Cpu` | Lambda, serverless functions |
| `monitor` | Rect + chart accent | Emerald #10B981 | `BarChart3` | Observability, dashboards |
| `human-task` | Card + person badge | Pink #EC4899 | `UserCheck` | Manual approval, human-in-loop |

### Domain Types (10)

| Type | Shape | Border Color | Lucide Icon | Best Use |
|------|-------|-------------|-------------|----------|
| `entity` | Pentagon | Sky #0EA5E9 | `Fingerprint` | Domain entities with identity |
| `aggregate` | Double-border rectangle | Indigo #4F46E5 | `Box` | Aggregate roots (DDD) |
| `value-object` | Rounded hexagon | Lime #84CC16 | `Gem` | Immutable value objects |
| `domain-event` | Tab shape | Amber #F59E0B | `BellRing` | Domain events |
| `policy` | Shield | Rose #E11D48 | `Scale` | Business rules, policies |
| `read-model` | Reverse parallelogram | Cyan #06B6D4 | `Eye` | CQRS read projections |
| `saga` | Arrow/chevron | Violet #7C3AED | `Route` | Long-running processes |
| `repository` | House | Stone #57534E | `Archive` | Persistence abstraction |
| `bounded-context` | Rect with notch | Emerald #059669 | `Layers` | BC boundary markers |
| `actor` | Trapezoid | Pink #DB2777 | `User` | Human actors, roles |

Icons render as white SVGs inside colored badge containers. Nodes use **top-edge color coding** (2.5px border-top), **type pill badges** (9px uppercase), and **solid ring focus** (no animated glow) for active state.

Shape is the primary discriminator, color is secondary — all 27 shapes are unique for colorblind accessibility.

---

## Call Types (4 Types)

| Type | Line Style | Dot Speed | Color | Arrow | Use For |
|------|-----------|-----------|-------|-------|---------|
| `sync` | Solid | Fast | Blue #3B82F6 | Filled | Request-response (REST, gRPC) |
| `async` | Dashed | Medium | Purple #A855F7 | Open | Fire-and-forget messages |
| `publish` | Dashed | Medium | Amber #F59E0B | Open | Service → Queue/Topic |
| `subscribe` | Dashed | Medium | Teal #14B8A6 | Open | Queue/Topic → Service |

### Visual States

- **Hidden** — not yet revealed (invisible)
- **Active** — glowing edge with animated dots (current step)
- **Completed** — solid line, no glow, muted (previous steps)
- **Dimmed** — very low opacity (not part of current narrative)

---

## Zone Grouping Strategies

### 1. Team Zones

Group services by owning team:

```yaml
zones:
  - id: platform-team
    label: "Platform Team"
    members: [gateway, orders, orders-db]
  - id: supply-chain
    label: "Supply Chain"
    members: [inventory, warehouse]
```

### 2. Domain Zones

Group by bounded context:

```yaml
zones:
  - id: order-domain
    label: "Order Domain"
    members: [orders, orders-db, order-events]
  - id: fulfillment
    label: "Fulfillment"
    members: [inventory, shipping, warehouse-db]
```

### 3. Data-Flow Zones

Group by pipeline stage:

```yaml
zones:
  - id: ingestion
    label: "Ingestion"
    members: [gateway, api-service]
  - id: processing
    label: "Processing"
    members: [order-events, enrichment, validation]
  - id: persistence
    label: "Storage"
    members: [orders-db, analytics-db]
```

### 4. Security Zones

Group by trust boundary:

```yaml
zones:
  - id: dmz
    label: "DMZ"
    members: [gateway, waf]
  - id: internal
    label: "Internal Network"
    members: [orders, inventory, orders-db]
```

### 5. Infrastructure Zones

Group by deployment target:

```yaml
zones:
  - id: k8s-cluster
    label: "K8s Cluster"
    members: [orders, inventory, notification]
  - id: managed-services
    label: "Managed Services"
    members: [orders-db, order-events, cache]
```

### Zone Colors

6 predefined semi-transparent colors are available:
- Blue: `rgba(59, 130, 246, 0.06)`
- Purple: `rgba(168, 85, 247, 0.06)`
- Green: `rgba(34, 197, 94, 0.06)`
- Orange: `rgba(249, 115, 22, 0.06)`
- Pink: `rgba(236, 72, 153, 0.06)`
- Cyan: `rgba(6, 182, 212, 0.06)`

---

## Coupling & Failure Cascade

### Three Coupling Levels

Every call can declare a `coupling` level that controls its visual treatment and cascade behavior:

| Level | Edge Color | Line Weight | Behavior |
|-------|-----------|-------------|----------|
| `tight` | Red #EF4444 | Thick (3px) | Failure propagates — caller cannot function without callee |
| `loose` | Blue #3B82F6 | Normal (2px) | Degraded — caller can partially function, may use fallback |
| `eventual` | Slate #94A3B8 | Thin (1px) | Decoupled — async delivery, no runtime dependency |

```yaml
calls:
  - id: check-inventory
    type: sync
    from: orders
    to: inventory
    method: GET
    path: /stock
    coupling: tight
    critical: true
    fallback: "cached-stock-levels"

  - id: notify-shipped
    type: publish
    from: orders
    to: shipping-events
    messageType: OrderShippedEvent
    coupling: eventual
```

### `simulateFailure` — Failure Cascade Visualization

Set `simulateFailure` on any step to trigger a BFS cascade from a failed service. The engine walks upstream through all calls marked `critical: true`, coloring affected services red and activating fallback labels.

```yaml
steps:
  - id: step-failure
    title: "Inventory Service Down"
    narrative: >-
      The **Inventory Service** goes down. Because the
      {color:red|Orders → Inventory} call is marked `critical: true`,
      the failure cascades upstream to **Orders** and **Gateway**.
    activeCalls: []
    simulateFailure: inventory
```

### BFS Cascade Algorithm

1. Start at the failed service ID
2. Find all incoming calls where `critical: true`
3. Mark those calls as failed (red edge state)
4. Add the caller to the affected set
5. If the call has a `fallback`, mark it as active (dashed amber overlay)
6. Recurse: repeat from step 2 for each newly-affected service
7. Result: `affectedServices` (red nodes), `failedCalls` (red edges), `activeFallbacks` (amber edges)

This is implemented in `getServiceFlowCascade()` in `src/schemas/service-flow.ts`.

---

## Camera Overrides

Each step can include a `camera:` object to override the default auto-focus behavior for cinematic control.

### Full Camera Schema

```yaml
steps:
  - id: dramatic-intro
    title: "System Overview"
    activeCalls: []
    revealNodes: [gateway, orders, inventory, db]
    camera:
      fitAll: true              # zoom out to show everything
      duration: 2000            # slow 2-second animation
      easing: ease-out          # gentle deceleration
      padding: 120              # extra breathing room

  - id: zoom-into-orders
    title: "Order Service Detail"
    activeCalls: [create-order]
    camera:
      zoom: 1.8                 # close-up
      duration: 1500
      easing: spring-overshoot  # cinematic bounce
      focusNodes: [orders]      # override auto-focus

  - id: pan-to-database
    title: "Persistence Layer"
    activeCalls: [save-order]
    camera:
      zoom: 1.4
      pan: [100, 0]            # shift right after focus
      easing: linear            # steady tracking shot
```

### Easing Functions

| Easing | Curve | Feel | Best For |
|--------|-------|------|----------|
| `spring-overshoot` | `1 - e^(-6t) * cos(3*pi*t)` | Bouncy, cinematic | Default — most transitions |
| `linear` | `t` | Constant speed | Tracking shots, panning |
| `ease-in` | `t^2` | Slow start, fast end | Building tension |
| `ease-out` | `1 - (1-t)^2` | Fast start, gentle landing | Reveals, arrivals |
| `ease-in-out` | Cubic bezier | Smooth both ends | Deliberate transitions |

### Cinematic Patterns

**Slow zoom reveal** — start wide, gradually zoom into the action:
```yaml
- camera: { fitAll: true, duration: 2500, easing: ease-out }
- camera: { zoom: 1.2, duration: 1800, easing: ease-in-out }
- camera: { zoom: 1.6, duration: 1200, easing: spring-overshoot }
```

**Pull-back overview** — zoom in tight, then pull back to show context:
```yaml
- camera: { zoom: 2.0, focusNodes: [orders], easing: spring-overshoot }
- camera: { fitAll: true, duration: 2000, easing: ease-out }
```

**Linear tracking** — smooth horizontal pan across the architecture:
```yaml
- camera: { focusNodes: [gateway], easing: linear, duration: 1000 }
- camera: { focusNodes: [orders], easing: linear, duration: 1000 }
- camera: { focusNodes: [database], easing: linear, duration: 1000 }
```

---

## Edge Effects

Calls can have visual effects that fire when the call becomes active. Three effect types are available:

### `emoji-fan`

Launches a fan of emoji sprites along the edge path.

```yaml
effect:
  type: emoji-fan
  emojis: ["💰", "🧾", "✅"]
  count: 8
  spread: 45
  speed: 200
```

### `label-yeet`

Flings the call label off the edge with physics (gravity, fade, scale).

```yaml
effect:
  type: label-yeet
  label: "OrderCreated"
  gravity: 120
  fade: true
  scale: [1, 0.3]
```

### `particle-stream`

Continuous particle emission along the edge — ideal for data flow visualization.

```yaml
effect:
  type: particle-stream
  count: 20
  speed: 100
  jitter: 0.3
  duration: 2000
```

### Step-Level Effects

Effects can also be applied per-step via the `effects` array, targeting specific calls:

```yaml
steps:
  - id: step-with-effects
    title: "Event Fan-Out"
    activeCalls: [publish-event, sub-notification, sub-analytics]
    effects:
      - target: publish-event
        type: emoji-fan
        emojis: ["📨", "📬"]
        count: 6
      - target: sub-notification
        type: particle-stream
        speed: 80
```

Effect parameters: `count` (1–50), `spread` (0–180 degrees), `direction` (along-edge, from-source, from-target, radial), `speed`, `jitter` (0–1), `gravity`, `fade`, `scale` [start, end], `stagger` (ms between particles), `duration` (ms).

---

## Multi-Axis Step Choreography

Each step has 4 independent axes that control what's visible and how:

### `activeCalls` — What's Happening Now

The primary axis. These calls glow with animated dots. Camera auto-focuses on participants.

```yaml
activeCalls: [create-order]  # This call glows
```

### `focusNodes` — Where to Look

Overrides auto-focus. Use when the camera should target specific nodes that aren't part of active calls.

```yaml
activeCalls: [create-order]
focusNodes: [orders-db]      # Camera points at DB even though the call is gateway→orders
```

### `revealNodes` — Show Infrastructure

Reveals nodes that aren't connected by an active call. Use to set the stage before a call happens.

```yaml
revealNodes: [cache, orders-db]  # These appear but no edge glows
activeCalls: []                  # No active calls this step
```

### `revealCalls` — Background Context

Shows edges in completed (non-glowing) state. Use to provide context while a different call is active.

```yaml
revealCalls: [create-order, check-inventory]  # These show as "already happened"
activeCalls: [save-order]                     # This one glows
```

### Choreography Patterns

**Linear progression:**
```yaml
- activeCalls: [call-1]                          # Step 1: first call
- activeCalls: [call-2]                          # Step 2: second call
- activeCalls: [call-3]                          # Step 3: third call
```

**Context accumulation:**
```yaml
- activeCalls: [call-1]                          # Step 1: just the first call
- revealCalls: [call-1], activeCalls: [call-2]   # Step 2: first fades, second glows
- revealCalls: [call-1, call-2], activeCalls: [call-3]  # Step 3: full context
```

**Infrastructure reveal then action:**
```yaml
- revealNodes: [db, cache], activeCalls: []      # Step 1: show infrastructure
- activeCalls: [write-to-db]                     # Step 2: now use it
```

---

## Common Call Patterns

### Sync + Response (Request-Reply)

```yaml
calls:
  - id: create-order
    type: sync
    from: gateway
    to: orders
    method: POST
    path: /orders
    response:
      status: 201
      label: "Order Created"
```

The `response` field generates a reverse dotted arrow from `orders` back to `gateway`, showing the return path.

### Pub/Sub Fan-Out

```yaml
calls:
  - id: publish-event
    type: publish
    from: orders
    to: order-events
    messageType: OrderCreatedEvent
  - id: sub-notification
    type: subscribe
    from: order-events
    to: notification
    messageType: OrderCreatedEvent
    action: SendEmail
  - id: sub-analytics
    type: subscribe
    from: order-events
    to: analytics
    messageType: OrderCreatedEvent
    action: TrackMetric
```

### Request-Reply via Queue

```yaml
calls:
  - id: send-request
    type: publish
    from: orders
    to: payment-queue
    messageType: PaymentRequest
  - id: process-payment
    type: subscribe
    from: payment-queue
    to: payment-service
    messageType: PaymentRequest
    action: ProcessPayment
  - id: send-result
    type: publish
    from: payment-service
    to: payment-result-queue
    messageType: PaymentResult
  - id: receive-result
    type: subscribe
    from: payment-result-queue
    to: orders
    messageType: PaymentResult
    action: UpdateOrderStatus
```

---

## Status Indicators & Effects

### Status Dot

Every service can have a `status` field:

| Status | Dot Color | Automatic Effect |
|--------|----------|------------------|
| `healthy` | Green #22C55E | None |
| `degraded` | Amber #F59E0B | Pulse |
| `down` | Red #EF4444 | Shake |

### Showing Degradation

```yaml
services:
  - id: payment
    name: Payment Service
    type: api
    status: degraded           # amber dot + pulse effect
    technology: Java
```

Combine with narration to tell the story:

```yaml
- title: "Payment Latency Spike"
  narrative: "Payment Service is experiencing elevated latency. SLA breach imminent."
  activeCalls: [process-payment]
  focusNodes: [payment]
```

---

## Tags & Metadata

Tags render as colored pills beneath the service name. They're categorized by key:

| Category | Keys | Pill Color |
|----------|------|-----------|
| Infrastructure | `protocol`, `region`, `tier` | Blue |
| Metrics | `SLA`, `throughput`, `latency` | Green |
| Identity | `version`, `team`, `owner` | Purple |
| Status | `env`, `stage` | Amber |

```yaml
tags:
  protocol: gRPC
  version: "2.1"
  team: platform
  SLA: "99.9%"
  region: us-east-1
```

---

## Advanced Features

### Version Badges

```yaml
services:
  - id: orders
    name: Order Service
    type: api
    version: "2.1"             # shown as badge on node
```

### Multi-Instance Visual

```yaml
services:
  - id: orders
    name: Order Service
    type: api
    instances: 3               # "x3" badge, stacked visual
```

### Bidirectional Detection

When two calls exist between the same pair of nodes (A→B and B→A), the renderer automatically offsets the curves to prevent overlap. Curvature: +0.35 / -0.35.

### Layout

Service-flow uses **dagre** auto-layout (LR direction):
- `nodesep: 80` — horizontal spacing between nodes
- `ranksep: 140` — vertical spacing between ranks
- No manual positioning — all computed from the call graph topology

---

## Example Stories

### `stories/service/order-processing.yaml`

Fully-featured example showcasing:
- 6 services with different types
- 2 queues (Kafka topic + RabbitMQ queue)
- 5 calls (sync + publish + subscribe)
- Zones for logical grouping
- Tags for metadata
- Multi-axis steps with `focusNodes` and `revealCalls`
- `narration: {speaker, message}` format
- `status: degraded` for visual effects

### `stories/service/ddd-order-domain.yaml`

Domain-driven design showcase using the 10 domain types:
- Aggregates, entities, value objects, domain events
- Policies, sagas, read models, repositories
- Bounded context boundaries
- Actor-driven command flows

### `stories/service/coupling-analysis.yaml`

Coupling and failure cascade demonstration:
- `coupling: tight|loose|eventual` on calls
- `critical: true` marking critical paths
- `fallback` strategies on degraded calls
- `simulateFailure` step triggering BFS cascade
- Visual progression from healthy to degraded to failed

### `stories/service/cinematic-camera.yaml`

Camera override showcase with cinematic patterns:
- Per-step `camera:` overrides
- All 5 easing functions demonstrated
- Slow zoom, pull-back, linear tracking patterns
- Combined with edge effects for dramatic presentation

---

## Common Mistakes & Fixes

| Mistake | Fix |
|---------|-----|
| Referencing undefined call IDs in `activeCalls` | Every ID must match a `calls[].id` |
| Referencing undefined node IDs in `focusNodes` | Every ID must match a `services[].id` or `queues[].id` |
| Missing `schemaVersion: "2.0"` | Required — schema validation will fail |
| Using `type: service-flow` | Use `renderer: service-flow` (not `type:`) |
| Setting `activeCalls` to a string | Must be an array: `activeCalls: [call-id]` |
| Zone members referencing non-existent IDs | Every member must be a valid service or queue ID |
| Forgetting `activeCalls` on a step | Required field — use `activeCalls: []` for reveal-only steps |
| Setting manual x/y positions | Dagre handles layout — no position fields exist |
| Putting queue ID in `to:` for sync calls | Sync calls are service-to-service; use `publish` for service-to-queue |
| Using `coupling` without `critical` on cascade paths | `simulateFailure` BFS only follows `critical: true` calls |
| Setting `camera.zoom` outside 0.1–5 range | Schema validates bounds — keep zoom reasonable |
