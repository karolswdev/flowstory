# 05 — Effects, Animated Labels & Streams

Effects are the pyrotechnics of service-flow stories. Used sparingly, they create memorable moments. Overused, they create chaos. This document covers all three projectile effect types, traveling labels, and stream particles.

---

## The Three Edge Effect Types

### 1. `emoji-fan` — Scatter Emojis Along an Edge

Emojis spawn and fan out from source to target with physics-based motion. The signature "celebration" effect.

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
      count: 8                        # How many emojis (1-50, default 5)
      spread: 45                      # Fan angle in degrees (0-180, default 30)
      speed: 150                      # Pixels per frame (default 150)
      duration: 2000                  # Total effect duration ms (default 1500)
      direction: from-source          # Where they spawn (default: along-edge)
      gravity: 0                      # Downward pull (default: 0 = float)
      fade: true                      # Fade out over time (default: true)
      scale: [1.2, 0.4]              # [start, end] scale (default: [1, 0.5])
      stagger: 100                    # Delay between emissions ms (default: 100)
      jitter: 0.3                     # Random position wobble 0-1 (default: 0.2)
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

### 2. `label-yeet` — Text That Flies

A text label in a pill that launches from the edge with gravity physics. The label literally gets **yeeted** — it arcs upward and falls.

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
      label: "CACHE MISS!"            # The text that flies (REQUIRED for this type)
      count: 1                         # Usually just 1
      speed: 200                       # Launch velocity
      gravity: 2                       # Falls like a physical object
      direction: from-target           # Launches FROM the cache
      fade: true
      scale: [1.5, 0.8]               # Starts big, shrinks
```

**Ideas for label-yeet text:**
- `"CACHE HIT! ⚡"` — on a cache read success
- `"TIMEOUT!"` — on a slow call
- `"201 CREATED"` — on a successful write
- `"ROLLBACK"` — on a compensation step
- `"RETRY #3"` — on a retry path
- `"CIRCUIT OPEN"` — on a circuit breaker trip

### 3. `particle-stream` — Colored Dot Flow

Flowing colored particles along an edge — like data visually streaming through a pipe.

```yaml
calls:
  - id: data-stream
    type: subscribe
    from: events
    to: processor
    messageType: StreamData
    effect:
      type: particle-stream
      count: 15                        # Dense stream of dots (1-50)
      speed: 100                       # Moderate flow speed
      direction: along-edge            # Distributed along the full edge
      stagger: 50                      # Fast emission rate (ms)
      duration: 2500                   # Lifetime per projectile (ms)
      jitter: 0.1                      # Tight stream (low wobble)
      fade: true
```

---

## Effect Parameters Reference

All three types share the same parameter set. Some parameters are more relevant to certain types.

| Parameter | Type | Default | Range | Description |
|-----------|------|---------|-------|-------------|
| `type` | string | — | `emoji-fan \| label-yeet \| particle-stream` | REQUIRED |
| `emojis` | string[] | — | — | Emoji pool (emoji-fan, particle-stream) |
| `label` | string | — | — | Text label (label-yeet) |
| `count` | number | 5 | 1-50 | Number of projectiles |
| `spread` | number | 30 | 0-180 | Fan angle in degrees |
| `direction` | string | `along-edge` | see below | Where projectiles spawn |
| `speed` | number | 150 | — | Pixels per second |
| `jitter` | number | 0.2 | 0-1 | Random position wobble |
| `gravity` | number | 0 | — | Downward pull (0 = float) |
| `fade` | boolean | true | — | Fade out over lifetime |
| `scale` | [n, n] | [1, 0.5] | — | [start, end] scale factor |
| `stagger` | number | 100 | — | Delay between emissions (ms) |
| `duration` | number | 1500 | — | Lifetime per projectile (ms) |

### Effect Directions

| Direction | Behavior | Best For |
|-----------|----------|----------|
| `along-edge` | Spawn at random points distributed along the edge path | particle-stream, sustained flows |
| `from-source` | All spawn at source node, fan toward target | emoji-fan, outgoing events |
| `from-target` | All spawn at target node, fan backward | label-yeet, rejections, cache misses |
| `radial` | Spawn at edge midpoint, disperse in all directions | Explosions, errors, celebrations |

---

## Call-Level vs Step-Level Effects

### Call-Level Effect

Defined on the call definition. Fires every time this call is active.

```yaml
calls:
  - id: emit-event
    type: publish
    from: orders
    to: events
    effect:
      type: emoji-fan
      emojis: ["📦"]
      count: 5
```

### Step-Level Effect Override

Defined on a step. Overrides or adds an effect for a specific call in that step only.

```yaml
steps:
  - id: step-3
    title: "Event Burst"
    activeCalls: [emit-event]
    effects:
      - target: emit-event       # Call ID to attach effect to
        type: emoji-fan
        emojis: ["🚀", "📡"]    # Different emojis for this step
        count: 12                 # More projectiles for this step
        spread: 60
```

**Priority:** Step-level effect **replaces** the call-level effect for that step. Fields from the call-level effect are merged as defaults, then step-level fields override.

### Composition Rules

- **One effect per call** at call level. Step-level overrides replace it for that step.
- **Effects only fire when the call is active** (call ID must be in `activeCalls`).
- **Don't put effects on every call.** 1-3 effects per story is impactful. 10 is chaos.
- **Match the effect to the moment:** emoji-fan for events, label-yeet for status callouts, particle-stream for data flow.

---

## Traveling Labels

Not a projectile effect — this is a call-level boolean that makes the edge label physically ride along the edge path when active.

```yaml
calls:
  - id: send-command
    type: async
    from: api
    to: worker
    messageType: ProcessOrder
    travelingLabel: true
```

**Visual behavior:**
- **Active:** The label pill (containing `ProcessOrder`) slides from source to target along the edge path, riding with the traveling dots.
- **Inactive:** The label sits at the edge midpoint as usual.

**When to use:** When you want to emphasize that a specific message is being transmitted. Especially effective on async/publish calls where the message name IS the story.

---

## Stream Particles (Continuous Flow)

Different from projectile effects — stream particles create a **persistent, continuous flow** along an edge rather than a burst. Think of it as a visual data pipe.

```yaml
calls:
  - id: data-feed
    type: subscribe
    from: stream
    to: processor
    stream: true                 # Simple: enable with defaults

  - id: heavy-feed
    type: subscribe
    from: stream
    to: analytics
    stream:                      # Advanced: customize
      density: 12                # 1-30, particles visible at once (default: 6)
      speed: 1.5                 # 0.5-10, seconds per full traversal (default: 2.5)
      width: 24                  # 4-60px, stream band width (default: 16)
      color: "#3B82F6"           # Override color (default: call type color)
      fade: true                 # Fade at endpoints (default: true)
      bandOpacity: 0.12          # 0-0.5, band opacity (default: 0.08)
      particles: ["📦", "📨"]   # Optional emoji instead of colored dots
```

**Visual:** A translucent band along the edge with dots (or emojis) flowing continuously through it. The band has a soft color matching the call type.

**Difference from particle-stream effect:** Stream particles are *always on* when the call is active. Particle-stream effects are *burst* animations.

---

## Event Stream Marquee (Node-Level)

The `event-stream` service type has a built-in marquee animation — event pills scroll left-to-right inside the wide pipe shape. This is NOT an edge effect; it's part of the node itself.

```yaml
services:
  - id: trip-stream
    type: event-stream
    events:
      - key: TripCreated
        emoji: "📦"
        color: "#3B82F6"
```

- **Active:** Marquee scrolls continuously. Glow pulses at inlet/outlet edges.
- **Inactive:** Pipe visible but static. Marquee paused, pills dimmed.

---

## Event Processor Conveyor (Node-Level)

The `event-processor` service type has a built-in conveyor belt that appears when active calls with `messageType` target the node. Pills slide **right-to-left** — the opposite direction of event-stream — representing consumption.

**No YAML fields needed.** The conveyor is derived from active calls:
- A call with `messageType` targeting this node → a pill on the conveyor
- Badge shows call type: 📥 subscribe, ⚡ async, 📤 publish
- Pills dissolve at the left edge via fade mask

---

## Effect Recipes

### The Event Celebration

When a saga completes, yeet emojis:

```yaml
effect:
  type: emoji-fan
  emojis: ["🎉", "✅", "🚀"]
  count: 10
  spread: 60
  speed: 180
  gravity: 1
  duration: 2500
```

### The Error Explosion

When a service fails:

```yaml
effect:
  type: emoji-fan
  emojis: ["💥", "🔥", "❌"]
  count: 8
  spread: 90
  direction: radial
  gravity: 0.5
  duration: 2000
```

### The Cache Miss Callout

Yeet a label when the cache misses:

```yaml
effect:
  type: label-yeet
  label: "CACHE MISS!"
  count: 1
  speed: 200
  gravity: 2
  direction: from-target
  scale: [1.5, 0.8]
```

### The Data Pipeline

Sustained particle flow for a data pipeline:

```yaml
effect:
  type: particle-stream
  count: 15
  speed: 100
  direction: along-edge
  stagger: 50
  jitter: 0.1
  duration: 2500
```

---

## Performance Notes

- Edge projectile effects have a performance cost rating of 3/5.
- Under reduced motion preferences, effects fall back to static rendering.
- Effects render in an SVG overlay layer (`EdgeEffectLayer`) above the React Flow canvas.
- Projectiles travel ~65% of the edge path before fading. Fade-out begins at ~55% progress. Fade-in ends at ~8% progress.
- Emoji projectiles float 14px above the edge path. Labels float 18px above. Dots float 6px above.
