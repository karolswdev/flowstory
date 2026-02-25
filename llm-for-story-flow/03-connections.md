# 03 — Connections (Calls, Edges, Self-Loops, Responses)

Calls are the edges between nodes. Every call has a distinct visual treatment — dash pattern, badge, label format, and traveling dot animation — making them distinguishable at a glance.

---

## The Four Call Types

| Type | Line Pattern | Badge | Dot Speed | Best For |
|------|-------------|-------|-----------|----------|
| `sync` | Solid | `→` | 0.8s | HTTP, gRPC, direct calls |
| `async` | Dashed `8,5` | `⚡` | 0.5s | Fire-and-forget messages |
| `publish` | Dotted `3,6` | `📤` | 0.6s | Event publication |
| `subscribe` | Dash-dot `8,3,2,3` | `📥` | 1.1s | Event consumption |

Each type has a colored traveling dot animation that pulses along the edge when active — the pattern and speed differ per type so you can tell them apart even without reading labels.

### Type Colors

| Type | Color | Hex |
|------|-------|-----|
| sync | Blue | `#3B82F6` |
| async | Purple | `#A855F7` |
| publish | Orange/Amber | `#F59E0B` |
| subscribe | Teal | `#14B8A6` |

---

## Sync Calls — HTTP/gRPC

The most detailed call type. Shows method, path, duration, protocol, and can generate a response edge.

```yaml
calls:
  - id: create-order
    type: sync
    from: gateway                # Source service ID
    to: order-svc                # Target service ID
    method: POST                 # HTTP method
    path: /orders                # URI path
    protocol: http               # http | grpc | graphql
    duration: 150                # Expected latency in ms (shown on label)
    status: 201                  # HTTP status code
    payload: { orderId: "123" }  # Optional request payload (any JSON)
    response:                    # Generates a REVERSE edge
      status: 201
      label: "Order Created"     # Override label (default: status code)
```

**Label format:** `POST /orders 150ms` — method + path + duration, compactly.

### Protocols

| Protocol | Visual Hint | Use For |
|----------|------------|---------|
| `http` | Default | REST APIs |
| `grpc` | Adds gRPC badge | gRPC services |
| `graphql` | Adds GQL badge | GraphQL endpoints |

---

## Async Calls — Fire and Forget

Messages sent without waiting for a response.

```yaml
calls:
  - id: send-command
    type: async
    from: api
    to: worker
    messageType: ProcessOrder    # REQUIRED — the message/command name
    correlationId: order-123     # Optional — correlation tracking
    payload: { orderId: "123" }  # Optional
```

**Label format:** Shows `messageType` as the label text.

---

## Publish Calls — Event Emission

Publishing events to a bus, stream, or topic.

```yaml
calls:
  - id: emit-event
    type: publish
    from: order-svc
    to: event-bus
    messageType: OrderCreated    # REQUIRED — the event name
    payload: { orderId: "123" }  # Optional
```

**Label format:** `pub OrderCreated` — prefix + event name.

---

## Subscribe Calls — Event Consumption

Subscribing to events from a bus, stream, or topic.

```yaml
calls:
  - id: consume-event
    type: subscribe
    from: event-bus
    to: notification-svc
    messageType: OrderCreated    # REQUIRED — the event name
    action: SendConfirmationEmail  # Optional — what the subscriber does
```

**Label format:** `sub SendConfirmationEmail` (uses `action` if present, falls back to `messageType`).

---

## Response Edges — The Round Trip

Sync calls can declare a `response` to create a **reverse edge** — a dashed return arrow from target back to source.

```yaml
calls:
  - id: create-order
    type: sync
    from: gateway
    to: order-svc
    method: POST
    path: /orders
    response:
      status: 201
      label: "Order Created"     # Optional override
```

This generates a second edge: `order-svc → gateway` with dash pattern `6,3`, a `↩` badge, and label `↩ 201 Order Created`.

**When to use responses:**
- On the "entry" call (client → gateway, gateway → service) to show the full HTTP lifecycle
- NOT on every internal call — it gets noisy. Pick 1-2 calls where showing the return adds meaning.

---

## Self-Loops — Node Calls Itself

When `from` and `to` are the same service ID, the edge renders as an **arc above the node** instead of a straight line.

```yaml
calls:
  - id: self-retry
    type: async
    from: conductor
    to: conductor
    messageType: RetryWorkflow
```

**Behavior:**
- Arc curves above the node (not a bezier to itself)
- Multiple self-loops on the same node **stack vertically** (each gets a `selfLoopIndex`)
- All call types work as self-loops (sync, async, publish, subscribe)
- Effects work on self-loops
- Node width/height are passed to the edge for correct arc sizing

**Use cases:** Retry loops, state machine self-transitions, recursive processing, health checks.

---

## Queues as Nodes

Queues are separate from services and render as distinct queue-shaped nodes. They participate in calls like any service.

```yaml
queues:
  - id: order-events
    name: order-events
    type: topic                  # queue | topic | stream
    broker: kafka                # rabbitmq | kafka | sqs | servicebus | redis
    depth: 1234                  # Queue depth
    consumers: 5                 # Consumer count
    tags:
      throughput: "50k/s"

calls:
  - id: publish-to-queue
    type: publish
    from: order-svc
    to: order-events             # References the queue ID
    messageType: OrderCreated
```

### Queue Types

| Type | Visual | Use For |
|------|--------|---------|
| `queue` | Standard queue shape | Point-to-point (SQS, RabbitMQ queue) |
| `topic` | Topic-labeled queue | Pub/sub (Kafka topic, SNS topic) |
| `stream` | Stream-labeled queue | Ordered log (Kafka stream, Kinesis) |

### Queue vs Event-Bus vs Event-Stream

| Node | Kind | When |
|------|------|------|
| Queue (`queues[]`) | Queue node | Traditional message queues, when you need depth/consumer metadata |
| `event-bus` (service) | Hexagon | Lightweight topic/exchange references in the service graph |
| `event-stream` (service) | Wide pipe + marquee | Central event backbone — visual centerpiece with scrolling events |

**Rule of thumb:** Use `event-stream` for the ONE central backbone. Use `event-bus` for secondary topics. Use `queues[]` when you need broker/depth/consumer metadata visible.

---

## Coupling Indicators

Every call can declare its coupling level. This changes the edge's visual weight.

```yaml
calls:
  - id: order-to-payment
    type: sync
    from: order-svc
    to: payment-svc
    coupling: tight              # tight | loose | eventual
    critical: true               # Part of failure cascade chain
    fallback: "Skip payment"     # Shown when failure cascade hits
```

| Level | Stroke | Color | Dash | Meaning |
|-------|--------|-------|------|---------|
| `tight` | 3px thick | Red `#EF4444` | Solid | Synchronous dependency — if it fails, caller fails |
| `loose` | 1.5px normal | Blue `#3B82F6` | Normal | Can degrade gracefully, has fallback |
| `eventual` | 1px thin | Slate `#94A3B8` | Dashed | Async, eventually consistent, no availability coupling |

See `07-progressive-reveal.md` for failure cascade details.

---

## Traveling Labels

When `travelingLabel: true` is set on a call, the edge label physically rides along the edge path when the call is active — it animates from source to target.

```yaml
calls:
  - id: send-command
    type: async
    from: api
    to: worker
    messageType: ProcessOrder
    travelingLabel: true         # Label rides along the edge
```

**Visual:** The label pill (containing the method/path or messageType) slides along the edge path with the traveling dot animation. When inactive, the label sits at the midpoint as usual.

---

## Stream Particles

When `stream: true` or `stream: { ... }` is set on a call, a continuous band of flowing particles renders along the edge — visualizing sustained data flow.

```yaml
calls:
  # Simple: just enable it
  - id: data-feed
    type: subscribe
    from: stream
    to: processor
    stream: true

  # Advanced: customize the stream
  - id: heavy-feed
    type: subscribe
    from: stream
    to: analytics
    stream:
      density: 12                # 1-30, particles visible at once (default: 6)
      speed: 1.5                 # 0.5-10, seconds per traversal (default: 2.5)
      width: 24                  # 4-60px, band width (default: 16)
      color: "#3B82F6"           # Override color (default: call type color)
      fade: true                 # Fade at endpoints (default: true)
      bandOpacity: 0.12          # 0-0.5, stream band opacity (default: 0.08)
      particles: ["📦", "📨"]   # Emoji instead of colored dots (optional)
```

**Use cases:** High-throughput data feeds, streaming ingestion, continuous event flow. The visual effect is a translucent band with dots (or emojis) flowing along it.

---

## Edge State Lifecycle

Edges have 3 visual states controlled by the step system:

| State | Appearance | When |
|-------|-----------|------|
| **Active** | Bright color, traveling dots, full opacity, glow | Call ID in current step's `activeCalls` |
| **Complete** | Dimmed, no dots, reduced opacity | Call was active in a previous step, now in `revealCalls` |
| **Hidden** | Not rendered | Call not yet revealed |

New edges (first appearance) get an entry animation: fade-in + slight scale.

---

## Fields Available on ALL Call Types

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `id` | string | — | REQUIRED. Unique call ID. |
| `type` | string | — | REQUIRED. `sync \| async \| publish \| subscribe` |
| `from` | string | — | REQUIRED. Source service/queue ID. |
| `to` | string | — | REQUIRED. Target service/queue ID. |
| `coupling` | string | — | `tight \| loose \| eventual` |
| `critical` | boolean | false | Marks critical path for cascade |
| `fallback` | string | — | Fallback text (shown on failure) |
| `effect` | object | — | Edge projectile effect (see `05-effects.md`) |
| `travelingLabel` | boolean | false | Label rides along edge |
| `stream` | boolean/object | — | Continuous particle flow |
