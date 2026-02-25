# 08 — Narration & Rich Text

Every step needs narration — it's the voice of the story. This document covers the two narration styles, rich text markup, color semantics, and writing guidelines.

---

## Two Narration Styles

Every step must have **exactly one** of these (never both, never neither):

### Simple Narrative

Plain text narration. Most common.

```yaml
steps:
  - id: step-1
    title: "Request Arrives"
    narrative: >-
      The **Gateway** receives `POST /orders` and routes to
      the {color:blue|Order Service}, which validates the payload.
```

### Speaker Narration

Attributed quote — as if a person is explaining. Adds a "speaker" badge to the overlay.

```yaml
steps:
  - id: step-2
    title: "Authentication"
    narration:
      speaker: Architect
      message: >-
        Notice the {color:red|tight coupling} between the Payment Service
        and its database. This is our **single point of failure**.
```

**When to use speaker narration:** When the story benefits from a persona — an Architect explaining design decisions, a DevOps engineer pointing out operational concerns, or a Tech Lead walking through a code review.

---

## Rich Text Markup

All text fields (`narrative`, `narration.message`, `description`) support inline formatting:

| Syntax | Renders | Example |
|--------|---------|---------|
| `**text**` | **bold** | `**critical path**` |
| `*text*` | *italic* | `*optional*` |
| `` `text` `` | `code` (monospace pill) | `` `POST /api` `` |
| `{color:name\|text}` | colored text | `{color:red\|failure}` |
| `\n` | line break | multi-line narration |

### Color Names

11 named Tailwind colors, plus raw hex:

| Name | Hex | Semantic Use |
|------|-----|-------------|
| `blue` | `#3B82F6` | System, info, API, sync calls |
| `green` | `#22C55E` | Success, healthy, completed |
| `red` | `#EF4444` | Error, danger, failure, tight coupling |
| `orange` | `#F97316` | Warning, event, decision, degraded |
| `amber` | `#F59E0B` | Caution, pending, gateway |
| `purple` | `#A855F7` | Async, actor, queue, write operations |
| `pink` | `#EC4899` | Workflow, orchestration |
| `cyan` | `#06B6D4` | Cache, read operations, stream |
| `teal` | `#14B8A6` | Subscribe, load balancer |
| `yellow` | `#EAB308` | Highlight, attention |
| `gray` | `#6B7280` | De-emphasized, idle, background |

Raw hex: `{color:#3B82F6|text}` — for precise color matching.

### Color Semantics — Match the Meaning

| What You're Describing | Color to Use |
|------------------------|-------------|
| A specific service name | Match the service type color |
| A danger or failure | `red` |
| A success or healthy state | `green` |
| An event name | `orange` or `amber` |
| An API path or method | `blue` or use backticks |
| A queue or async concept | `purple` |
| A technology name | backticks (`` `Kafka` ``) |
| A coupling level | `red` for tight, `blue` for loose, `gray` for eventual |

---

## Writing Guidelines

### Length

**2-3 sentences maximum.** The visuals do the heavy lifting. Narration provides context and directs attention.

```yaml
# GOOD — concise, directive
narrative: >-
  The **Gateway** routes to {color:blue|Order Service}.
  Validation runs synchronously — `150ms` round-trip.

# BAD — too long, over-explains what's visible
narrative: >-
  In this step, we can see that the API Gateway service, which is
  represented by the diamond shape on the left side of the diagram,
  receives an incoming HTTP POST request to the /orders endpoint,
  and then it forwards that request synchronously to the Order Service,
  which is the blue rectangle to the right of the gateway, and this
  call takes approximately 150 milliseconds to complete.
```

### Emphasis Discipline

Use rich text formatting sparingly:

- **Bold** for 1-2 key concepts per narration. Not every other word.
- `` `Code` `` for API paths, event names, and technical terms.
- `{color:...}` for 1-2 colored terms that match the visual. Not a rainbow.
- *Italic* for contrast or aside. Rarely needed.

```yaml
# GOOD — selective emphasis
narrative: >-
  The **Matching Engine** subscribes to `TripCreated` events
  from the {color:cyan|Kafka stream}.

# BAD — everything emphasized
narrative: >-
  The **Matching Engine** **subscribes** to `TripCreated` **events**
  from the {color:cyan|Kafka} {color:orange|stream} via a
  {color:purple|subscribe} **call**.
```

### Directive Narration

The best narrations **direct attention** — they tell the audience what to look at and why it matters.

```yaml
# GOOD — directive
narrative: >-
  Watch the {color:red|tight coupling} chain. If the database
  goes down, everything upstream fails.

# OK — descriptive (less engaging)
narrative: >-
  The database is tightly coupled to the payment service,
  which is tightly coupled to the order service.
```

### Step Title vs Narrative

The **title** names the step (shown as a heading). The **narrative** explains it.

```yaml
# Title: what's happening (noun phrase or short sentence)
title: "Cache Miss"

# Narrative: why it matters (2-3 sentences)
narrative: >-
  The {color:cyan|Cache} returns empty — `GET /stock/ABC` misses.
  The **Order Service** falls back to the {color:gray|database},
  adding `85ms` to the request path.
```

### Multi-Line Narration

Use `\n` for explicit line breaks within a narration:

```yaml
narrative: >-
  **Phase 1:** Event published to stream.\n
  **Phase 2:** Three consumers process in parallel.\n
  **Phase 3:** Results aggregated in the read model.
```

---

## Narration Patterns

### The Observer

Neutral description of what's happening:

```yaml
narrative: >-
  The **Trip API** publishes `TripCreated` to the event stream.
  Three downstream consumers pick it up in parallel.
```

### The Guide

Directing attention to what matters:

```yaml
narrative: >-
  Watch the {color:red|tight coupling} chain from Gateway → Orders → Payment.
  This is the critical path — a single failure propagates upstream.
```

### The Analyst

Explaining architectural implications:

```yaml
narration:
  speaker: Architect
  message: >-
    This {color:purple|eventual consistency} boundary means the
    analytics service can go down without affecting order processing.
    **That's the point of decoupling.**
```

### The Storyteller

Building drama across steps:

```yaml
# Step 1
narrative: "Everything is running smoothly. All services {color:green|healthy}."

# Step 2
narrative: "But notice the {color:red|tight coupling} chain..."

# Step 3
narrative: "The payment database goes down. Watch the cascade."

# Step 4
narrative: >-
  The event-driven services? **Completely unaffected.**
  That's the power of {color:purple|eventual consistency}.
```
