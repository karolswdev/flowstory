# 09 — Recipes: Proven Story Patterns

Complete, copy-paste-ready patterns for common architecture stories. Each recipe includes the structural skeleton, key elements, and tips.

---

## Recipe 1: The Saga Orchestration

Show a workflow engine coordinating multiple services through a multi-step process.

```yaml
id: saga-orchestration
title: "Order Fulfillment Saga"
renderer: service-flow
schemaVersion: "2.0"

services:
  - id: conductor
    name: Conductor
    type: workflow
    technology: "Orkes Conductor"
    substates: [idle, running, waiting, compensating, completed, failed]
    initialSubstate: idle

  - id: approval
    name: Human Approval
    type: human-task
    substates: [pending, assigned, reviewing, approved, rejected]

  - id: order-svc
    name: Order Service
    type: api
    technology: "Node.js"

  - id: payment-svc
    name: Payment Service
    type: api
    technology: "Java"

  - id: inventory
    name: Inventory
    type: database
    technology: "PostgreSQL"

calls:
  - id: start-saga
    type: async
    from: order-svc
    to: conductor
    messageType: StartFulfillment

  - id: check-inventory
    type: sync
    from: conductor
    to: inventory
    method: GET
    path: /stock/check

  - id: request-approval
    type: async
    from: conductor
    to: approval
    messageType: ApprovalRequest

  - id: process-payment
    type: sync
    from: conductor
    to: payment-svc
    method: POST
    path: /charge
    coupling: tight
    critical: true

  - id: saga-complete
    type: publish
    from: conductor
    to: order-svc
    messageType: FulfillmentCompleted
    effect:
      type: emoji-fan
      emojis: ["🎉", "✅"]
      count: 6
      spread: 45

steps:
  - id: step-1
    title: "Saga Triggered"
    activeCalls: [start-saga]
    substates: { conductor: running }
    camera: { fitAll: true, duration: 1500, easing: ease-in-out }
    narrative: >-
      The **Order Service** triggers the fulfillment saga.
      The {color:pink|Conductor} begins orchestration.

  - id: step-2
    title: "Inventory Check"
    activeCalls: [check-inventory]
    revealCalls: [start-saga]
    substates: { conductor: running, inventory: querying }
    camera: { focusNodes: [conductor, inventory], zoom: 1.4, duration: 1000 }
    narrative: >-
      First task: verify `stock/check` returns available inventory.

  - id: step-3
    title: "Human Approval"
    activeCalls: [request-approval]
    revealCalls: [start-saga, check-inventory]
    substates: { conductor: waiting, approval: reviewing }
    camera: { focusNodes: [conductor, approval], zoom: 1.4, duration: 1200, easing: ease-in }
    narrative: >-
      High-value orders require **manual approval**.
      The saga {color:amber|waits} for the human decision.

  - id: step-4
    title: "Payment Processing"
    activeCalls: [process-payment]
    revealCalls: [start-saga, check-inventory, request-approval]
    substates: { conductor: running, approval: approved, payment-svc: processing }
    camera: { focusNodes: [conductor, payment-svc], zoom: 1.5, duration: 800 }
    narrative: >-
      Approval granted. The saga charges payment via
      a {color:red|tightly coupled} sync call.

  - id: step-5
    title: "Saga Complete"
    activeCalls: [saga-complete]
    revealCalls: [start-saga, check-inventory, request-approval, process-payment]
    substates: { conductor: completed }
    camera: { fitAll: true, duration: 2000, easing: ease-in-out }
    narrative: >-
      Fulfillment complete. The saga publishes
      {color:green|FulfillmentCompleted} back to the Order Service.
```

**Key elements:** Sub-states on workflow node show the saga lifecycle. `human-task` for approval gates. Camera zooms into each phase then pulls back.

---

## Recipe 2: The Security Onion

Show request path through security layers with zones.

```yaml
services:
  - { id: client, name: Browser, type: client }
  - { id: waf, name: WAF, type: firewall, technology: "Cloudflare" }
  - { id: lb, name: Load Balancer, type: load-balancer, technology: "NGINX" }
  - { id: auth, name: Auth Service, type: api, technology: "Go",
      substates: [idle, authenticating, verified, rejected] }
  - { id: api, name: API Gateway, type: gateway }
  - { id: service, name: Order Service, type: api }

zones:
  - { id: dmz, label: "DMZ", members: [waf, lb] }
  - { id: trusted, label: "Trusted Network", members: [auth, api, service] }

scenes:
  - { id: perimeter, direction: LR, members: [client, waf, lb] }
  - { id: internal, direction: LR, members: [auth, api, service] }

steps:
  - id: step-1
    title: "Request Hits DMZ"
    activeCalls: [client-to-waf, waf-to-lb]
    camera: { focusNodes: [client, waf, lb], zoom: 1.3 }
    narrative: >-
      Request enters the {color:red|DMZ}. The **WAF** inspects
      for malicious payloads, then the **Load Balancer** distributes.

  - id: step-2
    title: "Authentication"
    activeCalls: [lb-to-auth]
    revealCalls: [client-to-waf, waf-to-lb]
    substates: { auth: authenticating }
    narrative: >-
      Crossing into the {color:green|trusted network}.
      The **Auth Service** validates JWT tokens.

  - id: step-3
    title: "Authorized Request"
    activeCalls: [auth-to-api, api-to-service]
    revealCalls: [client-to-waf, waf-to-lb, lb-to-auth]
    substates: { auth: verified }
    camera: { fitAll: true, duration: 1500 }
    narrative: >-
      Token verified. Request flows through the **Gateway**
      to the {color:blue|Order Service}.
```

**Key elements:** Zones for DMZ vs trusted. `firewall` + `load-balancer` types. Sub-states on auth. Progressive reveal from outer to inner layers.

---

## Recipe 3: The DDD Domain Model

Use domain-level types to visualize a bounded context's internal structure.

```yaml
services:
  - { id: customer, type: actor, name: Customer }
  - { id: order-agg, type: aggregate, name: Order Aggregate }
  - { id: order-line, type: value-object, name: Order Line }
  - { id: product, type: entity, name: Product }
  - { id: order-placed, type: domain-event, name: OrderPlaced }
  - { id: pricing, type: policy, name: Pricing Policy }
  - { id: order-repo, type: repository, name: Order Repository }
  - { id: order-summary, type: read-model, name: Order Summary }
  - { id: fulfillment, type: saga, name: Fulfillment Saga }
  - { id: order-bc, type: bounded-context, name: Order Context }

scenes:
  - id: model
    direction: TB
    nodesep: 30
    ranksep: 120
    members: [customer, order-agg, order-line, product, order-placed,
             pricing, order-repo, order-summary, fulfillment, order-bc]
```

**Key elements:** 10 unique shapes tell the DDD story visually. TB layout for natural hierarchy. Tight spacing for dense models.

---

## Recipe 4: The Failure Analysis

Demonstrate blast radius through coupling analysis.

```yaml
calls:
  - { id: gw-to-order, type: sync, from: gateway, to: order-svc,
      coupling: tight, critical: true, method: POST, path: /orders }
  - { id: order-to-payment, type: sync, from: order-svc, to: payment-svc,
      coupling: tight, critical: true, method: POST, path: /charge }
  - { id: payment-to-db, type: sync, from: payment-svc, to: payment-db,
      coupling: tight, critical: true, method: INSERT, path: /payments }
  - { id: order-to-cache, type: sync, from: order-svc, to: cache,
      coupling: loose, fallback: "Skip cache, serve from DB" }
  - { id: order-to-events, type: publish, from: order-svc, to: events,
      coupling: eventual, messageType: OrderCreated }

steps:
  - id: step-1
    title: "Normal Operation"
    activeCalls: [gw-to-order, order-to-payment, payment-to-db,
                  order-to-cache, order-to-events]
    camera: { fitAll: true, duration: 1500, easing: ease-in-out }
    narrative: "Everything running. Notice the coupling indicators on each edge."

  - id: step-2
    title: "Critical Path"
    activeCalls: [gw-to-order, order-to-payment, payment-to-db]
    revealCalls: [order-to-cache, order-to-events]
    camera: { focusNodes: [gateway, order-svc, payment-svc, payment-db],
              zoom: 1.3, easing: ease-in, duration: 1500 }
    narrative: >-
      The {color:red|tight coupling} chain. Gateway → Orders → Payment → DB.
      If any link breaks, the entire chain fails.

  - id: step-3
    title: "Database Failure"
    activeCalls: [gw-to-order, order-to-payment, payment-to-db]
    simulateFailure: payment-db
    substates: { payment-svc: failed }
    camera: { zoom: 1.1, easing: ease-out, duration: 1500 }
    narrative: >-
      The {color:red|payment-db} goes down. The cascade ripples upstream
      through every `critical: true` edge.

  - id: step-4
    title: "Resilience Through Decoupling"
    activeCalls: [order-to-events]
    revealCalls: [gw-to-order, order-to-payment, payment-to-db, order-to-cache]
    camera: { focusNodes: [events], zoom: 1.3, easing: ease-out, duration: 1200 }
    narrative: >-
      But the {color:green|event bus} is connected via **eventual** coupling.
      Completely unaffected. *That's* why coupling analysis matters.
```

---

## Recipe 5: The Event Backbone

Central event stream with producers and consumers.

```yaml
services:
  - id: api
    name: Trip API
    type: api

  - id: stream
    name: Trip Events
    type: event-stream
    technology: "Kafka"
    tags: { partitions: "24", throughput: "100k/s" }
    events:
      - { key: TripCreated, emoji: "📦", color: "#3B82F6" }
      - { key: DriverAssigned, emoji: "🚗", color: "#22C55E" }
      - { key: TripCompleted, emoji: "✅", color: "#10B981" }

  - id: matcher
    name: Matching Engine
    type: event-processor
    technology: "Flink"
    substates: [idle, processing]

  - id: billing
    name: Billing
    type: api
    technology: "Java"

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

  - id: stream-to-billing
    type: subscribe
    from: stream
    to: billing
    messageType: TripCompleted
    action: "calculate fare"

scenes:
  - { id: producers, direction: TB, members: [api] }
  - { id: backbone, direction: LR, members: [stream] }
  - { id: consumers, direction: TB, members: [matcher, billing] }

steps:
  - id: step-1
    title: "Events Published"
    activeCalls: [api-publish]
    camera: { focusNodes: [api, stream], zoom: 1.2 }
    narrative: >-
      The **Trip API** publishes `TripCreated` events.
      The stream's marquee shows them flowing through the backbone.

  - id: step-2
    title: "Consumer Fan-Out"
    activeCalls: [stream-to-matcher, stream-to-billing]
    revealCalls: [api-publish]
    substates: { matcher: processing }
    camera: { fitAll: true, duration: 1500 }
    narrative: >-
      Two consumers subscribe. The {color:violet|Matching Engine}'s
      conveyor belt lights up, pulling events right-to-left.

  - id: step-3
    title: "Complete Architecture"
    activeCalls: [api-publish, stream-to-matcher, stream-to-billing]
    camera: { fitAll: true, duration: 2000, easing: ease-in-out, padding: 150 }
    narrative: >-
      The full event-driven pipeline: produce → stream → consume.
      The wide pipe is the visual backbone of the architecture.
```

**Key combo:** `event-stream` (marquee flows L→R for production) + `event-processor` (conveyor flows R→L for consumption).

---

## Recipe 6: The Cinematic Demo

Pure camera showcase — same architecture, different emotional arcs through camera work alone.

```yaml
steps:
  - id: establish
    camera: { fitAll: true, duration: 2000, easing: ease-in-out }
    narrative: "The full architecture. Let me walk you through it."

  - id: dramatic-zoom
    camera: { zoom: 1.8, duration: 2500, easing: ease-in }
    focusNodes: [payment-svc]
    narrative: "This is the payment service — the critical path."

  - id: spring-snap
    camera: { zoom: 1.5, duration: 800, easing: spring-overshoot }
    narrative: "Authentication happens here. Fast and snappy."

  - id: tracking
    camera: { zoom: 1.2, duration: 1500, easing: linear }
    focusNodes: [api-a, api-b, api-c, api-d]
    narrative: "The entire API layer, scanned left to right."

  - id: land
    camera: { zoom: 1.6, duration: 1200, easing: ease-out }
    focusNodes: [database]
    narrative: "Landing on the database. Everything converges here."

  - id: resolve
    camera: { fitAll: true, duration: 2000, easing: ease-in-out, padding: 150 }
    narrative: "Pull back. Now you see how it all connects."
```

---

## Recipe 7: The Stream Processing Pipeline

The killer `event-stream` → `event-processor` combo with conveyor belts.

```yaml
services:
  - id: api
    name: API
    type: api

  - id: stream
    name: Events
    type: event-stream
    technology: "Kafka"
    events:
      - { key: TripCreated, emoji: "📦", color: "#3B82F6" }

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

  - id: db
    name: Analytics Store
    type: database
    technology: "ClickHouse"

calls:
  - { id: api-pub, type: publish, from: api, to: stream, messageType: TripCreated }
  - { id: stream-match, type: subscribe, from: stream, to: matcher,
      messageType: TripCreated, action: "match driver" }
  - { id: stream-proj, type: subscribe, from: stream, to: projector,
      messageType: TripCreated, action: "project analytics" }
  - { id: proj-db, type: sync, from: projector, to: db, method: INSERT, path: /metrics }

steps:
  - id: step-1
    title: "Events Flow"
    activeCalls: [api-pub]
    camera: { fitAll: true, duration: 1500 }
    narrative: "Events published. The stream marquee comes alive."

  - id: step-2
    title: "Matching Ingestion"
    activeCalls: [stream-match]
    revealCalls: [api-pub]
    substates: { matcher: processing }
    camera: { focusNodes: [matcher], zoom: 1.5, duration: 1200 }
    narrative: >-
      The **Matching Engine** subscribes — its conveyor belt lights up,
      pulling {color:blue|TripCreated} pills right-to-left.

  - id: step-3
    title: "Parallel Processing"
    activeCalls: [stream-match, stream-proj, proj-db]
    revealCalls: [api-pub]
    substates: { matcher: processing, projector: projecting }
    camera: { fitAll: true, duration: 1500, easing: ease-in-out }
    narrative: >-
      Two conveyor belts running in parallel. The **Projector**
      writes to {color:purple|ClickHouse} for analytics.

  - id: step-4
    title: "Back to Idle"
    revealCalls: [api-pub, stream-match, stream-proj, proj-db]
    substates: { matcher: idle, projector: idle }
    camera: { fitAll: true, duration: 2000 }
    narrative: >-
      Processing complete. Conveyors disappear. The architecture
      is ready for the next burst.
```

**The visual story:** Stream marquee flows L→R (production). Processor conveyors flow R→L (consumption). Sub-states show lifecycle. Conveyors appear/disappear per step.
