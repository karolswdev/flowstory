# FlowStory Presentation Playbook

> **The craft guide for building architecture presentations that land in board decks.**
>
> This is NOT a schema reference — see [`service-flow-mastery.md`](./service-flow-mastery.md) for field-level docs and [`author-composite.md`](../.claude/commands/author-composite.md) for composite structure conventions. This document teaches **how to tell a compelling story** with FlowStory's renderers.

---

## 1. The Three-Act Narrative Arc

Every great FlowStory presentation follows a three-act structure. This applies to standalone service-flow stories AND composite multi-renderer stories.

### Act 1: Context (1-2 steps)

Set the scene. Orient the viewer. Show the landscape before zooming in.

- Reveal only the **entry point** and **primary service** (2-3 nodes max)
- Use broad, orientation language: *"Our Order System sits at the heart of commerce..."*
- Duration: 4000-5000ms — give the viewer time to absorb

### Act 2: Action (3-5 steps)

The meat of the story. This is where calls flow, events fan out, and the architecture comes alive.

- Each step reveals **1-3 new elements** (progressive reveal)
- Active calls glow while completed calls fade to grey context
- Vary the pace: fast action steps (2500ms) between slower explanation steps (4000ms)
- This is where `narration: {speaker, message}` shines — name the speaker, explain the WHY

### Act 3: Resolution (1-2 steps)

Tie it all together. Show the full picture. Deliver the takeaway.

- All elements visible — the complete architecture
- Camera pulls back to show everything
- Narrative delivers the insight: *"This entire flow completes in under 200ms — well within our SLA."*
- Duration: 5000-6000ms — let it sink in

### Act Boundaries in YAML

```yaml
steps:
  # ═══ ACT 1: CONTEXT ═══════════════════════════════════════════════
  - id: step-1
    title: "The Order System"
    narrative: "Customer submits an order through the API Gateway."
    activeCalls: [submit-order]                     # ← Just the entry point
    duration: 4500

  # ═══ ACT 2: ACTION ════════════════════════════════════════════════
  - id: step-2
    title: "Payment Processing"
    narrative: "Before inventory reservation, we charge the card — this 300ms Stripe call is the critical path."
    activeCalls: [charge-payment]
    revealCalls: [submit-order]                     # ← Previous call stays visible as context
    duration: 3500

  - id: step-3
    title: "Stock Reservation"
    narration:
      speaker: Architect
      message: "Inventory check runs in parallel with payment on the happy path, but we serialize on degraded."
    activeCalls: [reserve-stock]
    revealCalls: [submit-order, charge-payment]
    duration: 4000

  - id: step-4
    title: "Persist & Publish"
    narrative: "Order persisted to PostgreSQL, event published to Kafka — both in a single transaction."
    activeCalls: [save-order, emit-event]
    revealCalls: [submit-order, charge-payment, reserve-stock]
    duration: 3500

  # ═══ ACT 3: RESOLUTION ════════════════════════════════════════════
  - id: step-5
    title: "Full Picture"
    narrative: "End-to-end: 450ms median, 99th percentile under 800ms. Every path is async-safe."
    activeCalls: []
    revealCalls: [submit-order, charge-payment, reserve-stock, save-order, emit-event]
    duration: 5000                                  # ← Long hold, let viewer absorb
```

---

## 2. Service-Flow Storytelling Patterns

These six named patterns are the building blocks. Mix and match them within a single story.

### Pattern 1: Progressive Infrastructure Reveal

**Build the diagram node-by-node.** Don't show all services in step 1 — let the architecture unfold as the narrative demands it.

```yaml
# Step 1: Just the entry point (2 nodes visible)
- id: step-1
  title: "Request Arrives"
  activeCalls: [gateway-to-orders]           # ← Only gateway + orders visible

# Step 2: Reveal the database BEFORE we use it
- id: step-2
  title: "Infrastructure"
  activeCalls: []
  revealNodes: [orders-db, cache]            # ← DB and cache appear, no calls yet
  focusNodes: [orders-db]                    # ← Camera points at new infrastructure
  narrative: "Order Service depends on PostgreSQL for persistence and Redis for hot-path caching."

# Step 3: Now USE the infrastructure
- id: step-3
  title: "Cache Check"
  activeCalls: [check-cache]                 # ← Now the call to cache glows
  revealCalls: [gateway-to-orders]           # ← Entry call stays as grey context
```

**Why it works:** The viewer's attention follows the reveal. They see the database appear, understand it's important, then see the call to it — creating a cause-and-effect narrative.

### Pattern 2: Context Accumulation

**Completed calls stay visible as grey context.** Each step adds to `revealCalls`, so the architecture "fills in" as the story progresses. By the final step, every call is visible.

```yaml
# Step 1: First call only
- activeCalls: [call-1]

# Step 2: First call fades, second glows
- activeCalls: [call-2]
  revealCalls: [call-1]                      # ← call-1 now grey

# Step 3: Two grey, one glowing
- activeCalls: [call-3]
  revealCalls: [call-1, call-2]              # ← Both previous calls grey

# Step 4: Everything visible, nothing glowing — the full picture
- activeCalls: []
  revealCalls: [call-1, call-2, call-3]      # ← All calls visible as context
```

**Why it works:** The viewer builds a mental model incrementally. By the end, they've seen every call animated individually AND can see the complete topology. This is the pattern used in `stories/service/order-processing.yaml`.

### Pattern 3: Camera Redirect

**Point the camera where action will happen NEXT**, not where it is now. Creates anticipation.

```yaml
# The active call is gateway → orders, but camera is on the database
- id: step-3
  title: "Preparing for Persistence"
  activeCalls: [gateway-to-orders]
  focusNodes: [orders-db]                    # ← Camera anticipates the next action
  narrative: "While the request flows in, let's look at where the data will land."

# Next step: the call TO the database now fires
- id: step-4
  title: "Write Path"
  activeCalls: [save-to-db]                  # ← Camera auto-focuses here naturally
```

**When to use:** Before a key moment — point the camera at the destination before the call happens. Creates a "and now watch THIS" effect.

### Pattern 4: The Degradation Story

**Start with a healthy system, then reveal a problem mid-story.** The `status: degraded` field triggers visual effects (amber pulse), and the narration switches to an incident voice.

```yaml
services:
  - id: inventory
    name: Inventory Service
    type: api
    status: degraded                         # ← Amber dot + pulse effect
    tags:
      latency: "85ms p99"                    # ← Evidence of the problem

steps:
  # Steps 1-2: Normal flow, everything healthy...

  # Step 3: Focus shifts to the degraded service
  - id: step-3
    title: "Latency Spike Detected"
    narration:
      speaker: SRE                           # ← Switch to SRE voice for drama
      message: "Inventory Service is at 85ms p99 — 3x normal. The degraded status triggers our circuit breaker threshold."
    activeCalls: [check-inventory]
    focusNodes: [inventory]                  # ← Camera zooms to the problem
```

**Why it works:** Architecture isn't just boxes and arrows — it has failure modes. This pattern makes the story relatable to anyone who's lived through a production incident.

### Pattern 5: Fan-Out Drama

**Show an event spreading to multiple consumers, one subscriber at a time.** This creates a "spreading ripple" effect that makes event-driven architecture feel dynamic.

```yaml
# Step 1: Service publishes to queue
- id: step-3
  title: "Event Published"
  activeCalls: [publish-event]               # ← orders → order-events topic
  narrative: "OrderCreatedEvent hits the Kafka topic."

# Step 2: First consumer
- id: step-4
  title: "Notification"
  activeCalls: [sub-notification]            # ← order-events → notification worker
  revealCalls: [publish-event]
  narrative: "The notification worker picks it up — confirmation email sent."

# Step 3: Second consumer
- id: step-5
  title: "Analytics"
  activeCalls: [sub-analytics]              # ← order-events → analytics
  revealCalls: [publish-event, sub-notification]
  narrative: "Analytics ingests the same event for real-time dashboards — fully decoupled."
```

**Why it works:** Showing subscribers one at a time (not all at once) emphasizes that consumers are independent. The viewer sees the event "spread" outward from the topic.

### Pattern 6: The Bridge Step

**The last step of a composite section spotlights the element that becomes the focus of the next section.** This creates a seamless handoff between renderers.

```yaml
# End of service-flow section
- id: step-4
  title: "The Order Entity"
  narrative: "Every order moves through a state machine. Let's trace the lifecycle."
  activeCalls: []
  focusNodes: [orders]                       # ← Spotlight the Order Service
  duration: 3000                             # ← Short, transitional

# Start of state-diagram section (next renderer)
- title: "Order Created"
  narrative: "A new order starts in PENDING state, waiting for payment."
  activeStates: [pending]
```

**Rule:** Every composite section (except the last) MUST end with a bridge step. The bridge step's narrative should foreshadow what comes next with language like *"Let's zoom into..."*, *"Let's trace..."*, *"Now let's see how..."*.

---

## 3. Narration Voice Guide

The narration is what separates a diagram from a presentation. Bad narration just labels the arrows. Good narration tells the viewer something they can't see.

### Bad vs. Good

| Bad (labeling the diagram) | Good (telling the story) |
|---------------------------|-------------------------|
| "Order Service calls Inventory Service" | "Before committing the order, we check real-time stock via gRPC — this sub-50ms call is the critical path." |
| "Event is published to Kafka" | "OrderCreatedEvent hits the topic — 6 downstream consumers will independently process it within 200ms." |
| "Database stores the order" | "The order is persisted to PostgreSQL in the same AZ for single-digit-ms write latency." |
| "Gateway routes to service" | "Kong strips auth headers and rate-limits to 10k RPM before forwarding to the Order Service cluster." |

### The Four Rules of Good Narration

1. **Mention WHY** — not just what happens, but why it matters
2. **Include numbers** — latency (ms), throughput (RPM), SLA (%), instance count
3. **Name the protocol** — REST, gRPC, Kafka, WebSocket — specifics build credibility
4. **Business impact** — connect the technical to the business: "blocks checkout", "drives revenue", "triggers SLA breach"

### Speaker Personas

Use `narration: {speaker, message}` when you want to add a human voice. The speaker sets the tone:

| Speaker | Voice | Best For |
|---------|-------|----------|
| `Architect` | Technical, design-focused | Architecture decisions, trade-offs, patterns |
| `SRE` | Operational, incident-focused | Failure modes, observability, SLA concerns |
| `Product Owner` | Business-focused | User impact, revenue flow, feature context |
| `Tech Lead` | Implementation-focused | Code patterns, deployment strategy, team ownership |

```yaml
# Architect voice — design decision
narration:
  speaker: Architect
  message: "We chose gRPC here instead of REST — the 40% latency reduction pays for itself on every request."

# SRE voice — operational concern
narration:
  speaker: SRE
  message: "This service is at 85ms p99 — 3x above baseline. Circuit breaker opens at 100ms."

# Product Owner voice — business impact
narration:
  speaker: Product Owner
  message: "This is the payment flow — every millisecond of latency here directly impacts cart abandonment rate."
```

### Rich Text Markup

All narrative text supports inline formatting — bold, italic, code, and colored text:

```yaml
narrative: >-
  The **Gateway** receives `POST /orders` and routes to
  the {color:blue|Order Service}. Validation fails with
  {color:red|400 Bad Request} if the payload is malformed.

narration:
  speaker: SRE
  message: >-
    Latency on `POST /payments` hit {color:red|340ms p99} —
    **3x above baseline**. Circuit breaker at *100ms*.
```

| Syntax | Use For |
|--------|---------|
| `**bold**` | Service names, key terms |
| `*italic*` | Asides, secondary notes |
| `` `code` `` | API paths, methods, events |
| `{color:name\|text}` | Semantic highlights (red=error, green=healthy, blue=service) |

**Named colors:** `blue`, `green`, `red`, `orange`, `amber`, `purple`, `pink`, `cyan`, `teal`, `yellow`, `gray` (or raw hex).

**Tip:** 1-3 formatted spans per narrative is the sweet spot. Over-formatting is worse than plain text.

### When to Use Which Format

- **`narrative:`** — Default. Use for most steps. Clean, simple.
- **`narration: {speaker, message}`** — Use for dramatic moments: the critical path call, the failure scenario, the key architecture decision. Maximum 2-3 per story.

---

## 4. Composite Multi-Perspective Playbook

Composite stories are FlowStory's power feature — stitching multiple renderers into a single linear narrative. The key is making section transitions feel like **lens changes**, not context switches.

### The Zoom Metaphor

Order sections from broadest to most detailed perspective:

| Order | Renderer | Altitude | Shows |
|-------|----------|----------|-------|
| 1st | `c4-context` | 30,000 ft | Systems, actors, integration points |
| 2nd | `service-flow` | Building level | Microservice choreography, data flow |
| 3rd | `state-diagram` | Room level | Single entity lifecycle, state transitions |

Each section is a "lens change" — you're looking at the SAME system from a different altitude. The viewer drills deeper each time.

### Recommended Combos

**"System Deep Dive"** (most common, best for stakeholder reviews)
```
c4-context (2-3 steps) → service-flow (3-4 steps) → state-diagram (2-3 steps)
```
*"Here's the system landscape → Here's how services collaborate → Here's the entity lifecycle"*
Total: 8-10 steps. Works for any domain.

**"Event Architecture"** (same renderer, different perspectives)
```
service-flow (3 steps) → service-flow (3 steps) → service-flow (3 steps)
```
*"Here's the ingestion pipeline → Here's the event fan-out → Here's the integration topology"*
Total: 9 steps. Great for complex event-driven systems. Each section shows a different slice of the same service mesh.

**"DDD Journey"** (domain-first storytelling)
```
event-storming (3 steps) → bc-composition (3 steps) → service-flow (3-4 steps)
```
*"Here are the domain events → Here's the bounded context structure → Here's the implementation"*
Total: 9-10 steps. Perfect for DDD-aware audiences.

**"Platform Engineering"**
```
c4-context (2 steps) → bc-deployment (3 steps) → pipeline (3 steps)
```
*"Here's the system → Here's how it's deployed → Here's how we ship changes"*
Total: 8 steps. For infrastructure and DevOps audiences.

### Color Continuity

Use `accentColor` to create a semantic visual thread across sections:

| Color | Hex | Meaning | Use For |
|-------|-----|---------|---------|
| Blue | `#3B82F6` | Context / System | C4 context, system landscape sections |
| Green | `#22C55E` | Action / Flow | Service-flow, http-flow sections |
| Purple | `#A855F7` | Lifecycle / State | State diagrams, BC composition |
| Orange | `#F97316` | Events / Domain | Event storming, event-driven service-flow |
| Cyan | `#06B6D4` | Infrastructure | BC deployment, pipeline sections |

**Rule:** Never use random colors. The viewer unconsciously associates the section badge color with the perspective type. Consistency builds trust.

### Section Transitions

Every section boundary needs TWO things:

1. **Bridge step** (last step of outgoing section) — spotlight the handoff node, foreshadow
2. **Anchor step** (first step of incoming section) — acknowledge the transition, orient

```yaml
# ── End of c4-context section ──
- title: "Inside the Order System"
  description: "Let's zoom into the Order System to see how its microservices collaborate."
  highlightNodes: [order-system]             # ← Spotlight the node we're zooming into
  duration: 3000                             # ← Short transition beat

# ── Start of service-flow section ──
- id: step-1
  title: "API Request"
  narrative: "Zooming into the microservice level — here's how a customer order actually flows."
  activeCalls: [submit-order]                # ← Immediately into action
```

**Naming consistency:** If the C4 system is called "Order System", the service-flow section should have a service called "Order Service" — the echo reinforces that we're looking at the same thing from closer.

---

## 5. Pacing & Timing

### Duration Guidelines

| Step Type | Duration | Rationale |
|-----------|----------|-----------|
| Opening / orientation | 4000-5000ms | Viewer needs time to absorb the canvas |
| Action step (1-2 calls) | 2500-3500ms | Quick progression, maintain momentum |
| Complex step (3+ calls) | 4000-5000ms | More elements to absorb |
| Bridge / transition | 2500-3000ms | Just enough to read the foreshadowing |
| Final overview | 5000-6000ms | Let the full picture sink in |

### The Breathing Room Rule

After 2-3 fast action steps (2500-3500ms), insert a **4000ms+ explanation step**. This prevents "diagram fatigue" — the viewer needs mental processing time.

```yaml
# Fast sequence
- { activeCalls: [call-1], duration: 3000 }  # fast
- { activeCalls: [call-2], duration: 2500 }  # fast
- { activeCalls: [call-3], duration: 3000 }  # fast

# Breathing room
- title: "Architecture Decision"
  narrative: "We chose this topology because..."
  activeCalls: []
  duration: 4500                              # ← Breather step
```

### Total Presentation Length

| Steps | Duration | Best For |
|-------|----------|----------|
| 5-7 | 1.5-2 min | Quick overview, standup demo |
| 8-12 | 2-3.5 min | Stakeholder review, architecture deep dive |
| 13-16 | 3.5-5 min | Multi-perspective composite, detailed walkthrough |
| 17+ | Too long | Split into separate stories or add composite sections |

**Sweet spot: 8-12 steps.** Long enough to tell a real story, short enough to hold attention.

---

## 6. Anti-Patterns

### "The Wall of Nodes"

**Problem:** Step 1 reveals every service, database, queue, and external system at once.
**Fix:** Progressive reveal — start with 2-3 nodes, add 1-2 per step.
**Rule:** No step should introduce more than 3 new nodes.

### "The Dead Narrator"

**Problem:** Narration just restates what the diagram already shows.
> *"The Gateway calls the Order Service, which calls the Database."*

**Fix:** Tell the viewer something they CAN'T see in the diagram — latency, SLA, business context, design rationale.

### "The Orphan Step"

**Problem:** A step with `activeCalls: []` and no `revealNodes` — nothing visually changes.
**Fix:** Every step must change something visible: a new call, a new node, a camera move, or a full-picture reveal.

### "The Endless Story"

**Problem:** 20+ steps in a single story. Viewer loses context.
**Fix:** If you need more than 12 steps, switch to `composite` with multiple sections. Each section acts as a "chapter" with its own focus.

### "The Color Clash"

**Problem:** Composite section accent colors chosen randomly — red, then lime, then hot pink.
**Fix:** Use the semantic color assignments from Section 4. Blue→Green→Purple is the default progression.

### "The Missing Bridge"

**Problem:** Composite section 1 ends abruptly, section 2 starts with no connection to what came before. The renderer change feels jarring.
**Fix:** Every section (except the last) must end with a bridge step. The bridge step's narrative foreshadows the next section, and `highlightNodes`/`focusNodes` spotlights the handoff element.

---

## 7. Complete Worked Example

A payment processing composite: C4 Context → Service Flow → State Diagram.

```yaml
id: payment-processing-deep-dive
title: "Payment Processing — System Deep Dive"
renderer: composite
schemaVersion: "2.0"
description: >
  From the system landscape through microservice choreography to the
  payment entity lifecycle — a three-perspective architecture narrative.

sections:
  # ════════════════════════════════════════════════════════════════════
  # SECTION 1: C4 Context — The 30,000ft View
  # ════════════════════════════════════════════════════════════════════
  - renderer: c4-context
    title: "System Landscape"
    accentColor: "#3B82F6"                   # ← Blue = context
    organization: Acme Payments
    system:
      id: payment-system
      name: Payment Platform
      description: "Processes payments, manages subscriptions, handles refunds"
      color: "#3B82F6"
      capabilities:
        - Card payments
        - Subscription billing
        - Refund processing
      technology: "Go, PostgreSQL, Kafka, Stripe"
    people:
      - id: customer
        name: Customer
        description: "Makes purchases and manages payment methods"
        external: true
        role: Buyer
      - id: ops-team
        name: Payments Ops
        description: "Monitors transactions and handles disputes"
        external: false
        role: Internal
    externalSystems:
      - id: stripe
        name: Stripe
        description: "Card network processing"
        vendor: Stripe
        type: saas
        critical: true
      - id: fraud-engine
        name: Fraud Detection
        description: "ML-based transaction scoring"
        vendor: Internal
        type: api
        critical: true
      - id: ledger
        name: General Ledger
        description: "Financial record keeping"
        vendor: Internal
        type: api
    relationships:
      - { from: customer, to: payment-system, type: uses, description: "Submits payments", technology: "HTTPS" }
      - { from: ops-team, to: payment-system, type: manages, description: "Reviews transactions" }
      - { from: payment-system, to: stripe, type: calls, description: "Charges cards", technology: "REST", critical: true }
      - { from: payment-system, to: fraud-engine, type: calls, description: "Scores transactions", technology: "gRPC", critical: true }
      - { from: payment-system, to: ledger, type: sends, description: "Posts journal entries", technology: "Kafka" }

    steps:
      # ACT 1 — Orient the viewer
      - title: "Payment Platform"
        description: "Our Payment Platform processes $2.4M daily — connecting customers to card networks, fraud detection, and financial reporting."
        focusNode: payment-system
        duration: 5000

      # BRIDGE — spotlight Stripe (critical dependency) before zooming in
      - title: "The Critical Path"
        description: "Stripe and Fraud Detection are on the critical path. A failure in either blocks every transaction. Let's see how the internal services handle this."
        highlightNodes: [stripe, fraud-engine]
        duration: 3500

  # ════════════════════════════════════════════════════════════════════
  # SECTION 2: Service Flow — The Microservice Choreography
  # ════════════════════════════════════════════════════════════════════
  - renderer: service-flow
    title: "Payment Flow"
    accentColor: "#22C55E"                   # ← Green = action
    layout: sequence

    services:
      - id: gateway
        name: API Gateway
        type: gateway
        technology: Envoy
        status: healthy
      - id: payment-api
        name: Payment Service
        type: api
        technology: Go
        status: healthy
        instances: 3
        version: "4.2"
        tags:
          SLA: "99.99%"
          team: payments
      - id: fraud
        name: Fraud Scorer
        type: api
        technology: Python
        status: healthy
        tags:
          latency: "12ms p99"
      - id: stripe-adapter
        name: Stripe Adapter
        type: external
        technology: "Stripe API v2"
      - id: payments-db
        name: Payments DB
        type: database
        technology: PostgreSQL
        status: healthy

    queues:
      - id: payment-events
        name: payment-events
        type: topic
        broker: kafka
        consumers: 4

    calls:
      - id: submit-payment
        type: sync
        from: gateway
        to: payment-api
        method: POST
        path: /v1/payments
        protocol: http
        duration: 450
        status: 201
        response:
          status: 201
          label: "Payment Accepted"
      - id: score-fraud
        type: sync
        from: payment-api
        to: fraud
        method: POST
        path: /score
        protocol: grpc
        duration: 12
        status: ok
      - id: charge-card
        type: sync
        from: payment-api
        to: stripe-adapter
        method: POST
        path: /charges
        duration: 300
        status: 200
        response:
          status: 200
          label: "Charge Confirmed"
      - id: persist-payment
        type: sync
        from: payment-api
        to: payments-db
        method: INSERT
        duration: 8
        status: ok
      - id: emit-charged
        type: publish
        from: payment-api
        to: payment-events
        messageType: PaymentChargedEvent

    steps:
      # ACT 2 begins — the action
      - id: sf-1
        title: "Payment Request"
        narrative: "Customer submits payment through Envoy — routed to one of three Payment Service instances."
        activeCalls: [submit-payment]
        duration: 4000

      - id: sf-2
        title: "Fraud Scoring"
        narration:
          speaker: Architect                 # ← Named speaker for the critical decision
          message: "Every transaction hits the fraud scorer first — a 12ms gRPC call that blocks the charge. We accept the latency because a single missed fraud event costs us 50x the compute savings."
        activeCalls: [score-fraud]
        revealCalls: [submit-payment]
        duration: 4500

      - id: sf-3
        title: "Card Charge"
        narrative: "Fraud score passes — Stripe charges the card. This 300ms call is the latency bottleneck."
        activeCalls: [charge-card]
        revealCalls: [submit-payment, score-fraud]
        duration: 3500

      - id: sf-4
        title: "Persist & Publish"
        narrative: "Payment persisted and event published atomically. Downstream systems react to PaymentChargedEvent."
        activeCalls: [persist-payment, emit-charged]
        revealCalls: [submit-payment, score-fraud, charge-card]
        duration: 3500

      # BRIDGE — spotlight the Payment Service before state diagram
      - id: sf-5
        title: "Payment Lifecycle"
        narrative: "Each payment moves through a state machine — from PENDING to SETTLED. Let's trace the lifecycle."
        activeCalls: []
        focusNodes: [payment-api]            # ← Camera holds on Payment Service
        revealCalls: [submit-payment, score-fraud, charge-card, persist-payment, emit-charged]
        duration: 3000

  # ════════════════════════════════════════════════════════════════════
  # SECTION 3: State Diagram — The Entity Lifecycle
  # ════════════════════════════════════════════════════════════════════
  - renderer: state-diagram
    title: "Payment Lifecycle"
    accentColor: "#A855F7"                   # ← Purple = lifecycle
    direction: LR

    phases:
      - { id: processing, label: Processing, color: "rgba(59, 130, 246, 0.06)", order: 1 }
      - { id: settlement, label: Settlement, color: "rgba(34, 197, 94, 0.06)", order: 2 }
      - { id: terminal, label: Terminal, color: "rgba(168, 85, 247, 0.06)", order: 3 }

    states:
      - { id: pending, label: PENDING, type: initial, phase: processing, description: "Awaiting fraud check" }
      - { id: authorized, label: AUTHORIZED, type: normal, variant: info, phase: processing, description: "Fraud cleared, card authorized" }
      - { id: captured, label: CAPTURED, type: normal, variant: success, phase: settlement, description: "Funds captured from card network" }
      - { id: settled, label: SETTLED, type: terminal, variant: success, phase: terminal, description: "Funds deposited to merchant" }
      - { id: failed, label: FAILED, type: terminal, variant: error, phase: terminal, description: "Charge declined or fraud blocked" }
      - { id: refunded, label: REFUNDED, type: terminal, variant: warning, phase: terminal, description: "Full or partial refund issued" }

    transitions:
      - { id: t1, from: pending, to: authorized, label: "fraud_cleared" }
      - { id: t2, from: pending, to: failed, label: "fraud_blocked / card_declined" }
      - { id: t3, from: authorized, to: captured, label: "capture_success" }
      - { id: t4, from: authorized, to: failed, label: "capture_timeout" }
      - { id: t5, from: captured, to: settled, label: "settlement_complete" }
      - { id: t6, from: captured, to: refunded, label: "refund_requested" }

    steps:
      # ACT 3 — resolution
      - title: "Processing"
        narrative: "Payments start PENDING, clear fraud scoring to become AUTHORIZED, then capture funds from the card network."
        activeStates: [pending, authorized, captured]
        activeTransitions: [t1, t2, t3, t4]
        duration: 5000

      - title: "Terminal States"
        narrative: "Happy path ends at SETTLED (T+2 business days). Failure paths lead to FAILED or REFUNDED — all transitions emit domain events for downstream reconciliation."
        activeStates: [settled, failed, refunded]
        activeTransitions: [t5, t6]
        duration: 5500
```

### What Makes This Example Work

1. **Three-act arc**: C4 orients (Act 1) → Service flow shows the action (Act 2) → State diagram resolves (Act 3)
2. **Progressive reveal**: Service-flow section builds node-by-node over 4 steps
3. **Context accumulation**: `revealCalls` grows each step
4. **Bridge steps**: C4 section ends spotlighting Stripe; service-flow section ends focusing on Payment Service
5. **Narration variety**: Mix of `narrative` (most steps) and `narration: {speaker}` (fraud scoring decision)
6. **Color continuity**: Blue (context) → Green (action) → Purple (lifecycle)
7. **Pacing**: Opening 5000ms, action 3500-4500ms, bridge 3000ms, resolution 5000-5500ms
8. **Numbers everywhere**: $2.4M daily, 12ms p99, 300ms bottleneck, T+2 settlement, 50x cost ratio
9. **Total: 9 steps** — right in the 8-12 sweet spot

---

## Quick Reference Card

```
NARRATIVE ARC:    Context (1-2) → Action (3-5) → Resolution (1-2)
REVEAL PATTERN:   revealNodes → activeCalls → revealCalls accumulation
BRIDGE PATTERN:   Last step spotlights → First step acknowledges
NARRATION RULES:  WHY + numbers + protocol + business impact
COLOR SEMANTICS:  Blue=context  Green=action  Purple=lifecycle  Orange=events
PACING:           Opening 5s → Action 3s → Breather 4.5s → Resolution 5.5s
SWEET SPOT:       8-12 steps total, 2-3 minutes auto-advance
```
