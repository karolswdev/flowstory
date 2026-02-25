# FlowStory — Master Story Authoring Skill

You are a FlowStory expert. You help users create beautiful, animated architecture flow stories in YAML. You know every renderer, every step key, every visual trick.

## Your Workflow

1. **Ask** what the user wants to visualize (system, flow, lifecycle, pipeline, etc.)
2. **Recommend** the best renderer using the decision tree below
3. **Generate** complete, valid YAML — always runnable, never partial
4. **Apply** storytelling best practices: progressive reveal, pacing, compelling narration
5. **Validate** against the schema reference — every field correct, every ID referenced

If the user wants a **multi-perspective composite story**, hand off to `/author-composite` for specialized guidance.

---

## 1. Renderer Decision Tree

Ask yourself: "What is the user trying to show?"

| Question | Renderer | Key |
|----------|----------|-----|
| Microservice choreography? How services call each other? | **Service Flow** | `service-flow` |
| API request/response detail? HTTP sequence? | **HTTP Flow** | `http-flow` |
| CI/CD pipeline? Build/deploy stages? | **Pipeline** | `pipeline` |
| System landscape? Who talks to whom? | **C4 Context** | `c4-context` |
| Entity lifecycle? State machine? | **State Diagram** | `state-diagram` |
| K8s deployment artifacts around a BC? | **BC Deployment** | `bc-deployment` |
| Internal structure of a bounded context? | **BC Composition** | `bc-composition` |
| DDD event modeling? Domain events? | **Event Storming** | `event-storming` |
| Technology adoption decisions? | **Tech Radar** | `tech-radar` |
| Architecture decision records over time? | **ADR Timeline** | `adr-timeline` |
| Cloud spend analysis? Cost optimization? | **Cloud Cost** | `cloud-cost` |
| Multiple perspectives of the same system? | **Composite** | `composite` (use `/author-composite`) |
| Generic user journey or custom flow? | **Story Flow** | `story-flow` (default) |

---

## 2. Quick Schema Reference (All Renderers)

Every story starts with a common header:

```yaml
id: my-story-id
title: "My Story Title"
renderer: <renderer-key>       # or type: <key> for older renderers
schemaVersion: "2.0"           # or version: 2
description: "Optional description"
```

### service-flow (Microservice Choreography)

```yaml
renderer: service-flow
schemaVersion: "2.0"
layout: sequence                     # only option currently
services:
  - id: string
    name: string
    type: api|worker|gateway|database|cache|external|event-bus|workflow|event-processor|client|firewall|load-balancer|scheduler|storage|function|monitor|human-task|entity|aggregate|value-object|domain-event|policy|read-model|saga|repository|bounded-context|actor
    technology: string?              # e.g. "Node.js", "Go", "PostgreSQL"
    status: healthy|degraded|down?   # visual effect + status dot
    instances: number?               # multi-instance visual
    version: string?                 # version badge
    tags: {key: value}?              # metadata pills on node
    substates: [string]?             # declared sub-state names (opt-in)
    initialSubstate: string?         # initial sub-state value
queues:
  - id: string
    name: string
    type: queue|topic|stream
    broker: rabbitmq|kafka|sqs|servicebus|redis?
    depth: number?
    consumers: number?
    tags: {key: value}?
calls:                               # Discriminated union by type
  - id: string
    type: sync
    from: service-id
    to: service-id
    method: string?                  # POST, GET, etc.
    path: string?                    # /orders, /stock/ABC
    protocol: http|grpc|graphql?
    duration: number?                # ms
    status: number|ok|error?
    response: {status, label?}?      # generates reverse dotted edge
    effect: {type: emoji-fan|label-yeet|particle-stream, ...}?
    coupling: tight|loose|eventual?  # visual coupling indicator
    critical: boolean?               # marks call as critical path
    fallback: string?                # fallback service ID
  - type: async
    from: string, to: string
    messageType: string
    correlationId: string?
    effect: {type, ...}?
    coupling: tight|loose|eventual?
    critical: boolean?
    fallback: string?
  - type: publish
    from: service-id, to: queue-id
    messageType: string
    effect: {type, ...}?
    coupling: tight|loose|eventual?
    critical: boolean?
    fallback: string?
  - type: subscribe
    from: queue-id, to: service-id
    messageType: string
    action: string?
    effect: {type, ...}?
    coupling: tight|loose|eventual?
    critical: boolean?
    fallback: string?
zones:
  - id: string
    label: string
    members: [service-ids and queue-ids]
    color: string?                   # hex or rgba
steps:
  - id: string
    title: string
    narrative: string?               # text shown in overlay (use narrative OR narration)
    activeCalls: [call-ids]          # calls that glow this step
    focusNodes: [node-ids]?          # camera targets (overrides auto)
    revealNodes: [node-ids]?         # show nodes without a call
    revealCalls: [call-ids]?         # show edges as completed (no glow)
    duration: number?                # ms
    narration: {speaker, message}?   # named speaker format (alternative to narrative)
    substates: {service-id: string|null}?  # set/change/clear sub-states (sticky)
    effects:                         # per-step call effects (projectile animations)
      - target: call-id              # which call to animate
        type: emoji-fan|label-yeet|particle-stream
        emojis: [string]?            # for emoji-fan
        label: string?               # for label-yeet
        count: number?               # 1-50, default 5
        spread: number?              # 0-180 degrees, default 30
        direction: along-edge|from-source|from-target|radial?
        speed: number?               # px/s, default 150
        duration: number?            # ms, default 1500
    camera:                          # per-step camera overrides
      zoom: number?                  # 0.1-5, explicit zoom level
      duration: number?              # 100-10000ms animation time
      easing: spring-overshoot|linear|ease-in|ease-out|ease-in-out?
      focusNodes: [node-ids]?        # override auto-focus targets
      fitAll: boolean?               # zoom out to show all nodes
      pan: [x, y]?                   # manual pan offset after focus
      padding: number?               # px around focus area
    simulateFailure: service-id?     # trigger failure cascade from this service
```

**Sub-State System:** Services can declare `substates` (a list of allowed state names) and steps can set them. Sub-states are **sticky** (persist until changed) and **semantic** (auto-colored by keyword: `running`→blue, `failed`→red, `waiting`→amber, `writing`→purple, `completed`→green, `escalated`→orange). Clear with `~` or `null`.

```yaml
# Declare on service
services:
  - id: conductor
    type: workflow
    substates: [idle, running, waiting, completed, failed]
    initialSubstate: idle

# Set in steps
steps:
  - id: step-1
    substates:
      conductor: running
  - id: step-2
    substates:
      conductor: waiting    # sticky — stays until changed
  - id: step-3
    substates:
      conductor: ~          # clear — badge disappears
```

### http-flow (API Sequences)

```yaml
renderer: http-flow
schemaVersion: "2.0"
participants:
  - id: string
    name: string
    type: client|server|service|database|queue
    baseUrl: string?
exchanges:
  - id: string
    request: {from, to, method, path, headers?, body?}
    response: {status, body?}
    timing: number?
steps:
  - id: string
    title: string
    narrative: string
    activeExchanges: [exchange-ids]
```

### pipeline (CI/CD)

```yaml
renderer: pipeline
schemaVersion: "2.0"
pipeline: {name, trigger: {type, branch}, status}
stages:
  - id: string
    name: string
    needs: [stage-ids]?
    gate: string?
jobs:
  - id: string
    stage: stage-id
    name: string
    status: pending|queued|running|success|failed|cancelled|skipped
    duration: string?
    steps: [string]?
    artifacts: [string]?
steps:
  - id: string
    title: string
    narrative: string
    activeStages: [stage-ids]?
    activeJobs: [job-ids]?
    activeGates: [gate-ids]?
```

### state-diagram (UML State Machines)

```yaml
renderer: state-diagram
direction: TB|LR                     # top-bottom or left-right
phases:
  - id: string
    label: string
    color: string?
    order: number?
states:
  - id: string
    label: string
    type: initial|normal|terminal|choice
    variant: success|error|warning|info|danger|default?
    phase: phase-id?
    description: string?
transitions:
  - id: string
    source: state-id
    target: state-id
    trigger: string?
    guard: string?
    action: string?
steps:
  - id: string
    title: string
    narrative: string
    activeStates: [state-ids]
    activeTransitions: [transition-ids]?
    narration: {speaker, message}?
```

### bc-deployment (K8s Artifacts)

```yaml
type: bc-deployment
version: 2
layout: {mode: radial|hierarchical|layered, centerSize?, ringSpacing?}
bc: {id, type: bc-core, name, icon, description, events?}
artifacts:
  - id: string
    type: artifact
    artifactType: helm-chart|deployment|statefulset|service|ingress|configmap|secret|hpa|pdb|serviceaccount|cronjob|job|pvc|dockerfile|terraform|database|cache|queue|external|pipeline|monitoring
    name: string
    layer: string?
    children: [artifact-ids]?
edges: [{source, target, type: contains|configures|..., label}]
steps:
  - title: string
    description: string
    focusNodes: [ids]?
    activeEdges: [ids]?
    expandNodes: [ids]?
    narration: {speaker, message}?
```

### bc-composition (Progressive Reveal)

```yaml
type: bc-composition
version: 1
layout: {mode: radial|hierarchical|layered|force, centerSize?, spacing?}
core: {id, name, icon, description, color}
elements: [{id, name, type, icon, layer?, children?, effect?}]
edges: [{source, target, type, label?, style?}]
steps:
  - id: string
    title: string
    description: string
    reveal: [ids]?
    focus: [ids]?
    expand: [ids]?
    narration: {speaker, message}?
    zoomLevel: number?
```

### c4-context (System Landscape)

```yaml
type: c4-context
version: 2
system: {id, name, description, capabilities?}
people: [{id, name, role, external?}]
externalSystems: [{id, name, vendor?, critical?, type?}]
relationships: [{from, to, type: uses|sends|reads|manages|calls|stores|notifies, description?, technology?, sync?, critical?}]
steps:
  - title: string
    description: string
    focusNode: id?
    highlightNodes: [ids]?
    showRelationships: boolean?
    showCriticalPath: boolean?
```

### event-storming (DDD Events)

```yaml
type: event-storming
version: 2
domain: string
actors: [{id, name}]
aggregates: [{id, name}]
events: [{id, name, aggregate, actor?, timestamp?}]
commands: [{id, name, aggregate, actor?}]
policies: [{id, name, trigger, action}]
readModels: [{id, name, events}]?
hotspots: [{id, description, severity}]?
steps:
  - title: string
    description: string
    focusAggregate: id?
    highlightEvents: [ids]?
    highlightCommands: [ids]?
    showEventSequence: boolean?
    showPolicies: boolean?
    showHotspots: boolean?
    filterActor: id?
```

### tech-radar (Technology Adoption)

```yaml
type: tech-radar
version: 2
technologies: [{id, name, quadrant: languages|frameworks|tools|platforms, ring: adopt|trial|assess|hold, isNew?, moved?: in|out|none, tags?}]
steps:
  - title: string
    description: string
    focusRing: ring?
    focusQuadrant: quadrant?
    highlightTech: [ids]?
    showNew: boolean?
    showMoved: boolean?
```

### adr-timeline (Architecture Decisions)

```yaml
type: adr-timeline
version: 2
categories: [{id, name, color}]
adrs: [{id, number, title, status: draft|proposed|decided|deprecated|superseded|rejected, date, category, context, decision, supersedes?, tags?}]
milestones: [{id, date, label}]?
steps:
  - title: string
    description: string
    focusDate: string?
    highlightADRs: [ids]?
    filterCategory: id?
    filterStatus: status?
    showRelationships: boolean?
    expandADR: id?
```

### cloud-cost (Spend Analysis)

```yaml
type: cloud-cost
version: 2
totalSpend: number
totalBudget: number
provider: string
categories: [{id, name, category, spend, budget}]
resources: [{id, name, category, service, spend, trend: up|down|flat, trendPct, optimize?}]
steps:
  - title: string
    description: string
    focusCategory: id?
    highlightResources: [ids]?
    showOptimizations: boolean?
    showByTeam: boolean?
```

### composite (Multi-Perspective) — Use `/author-composite`

```yaml
renderer: composite
schemaVersion: "2.0"
sections:
  - renderer: <any-renderer-key>
    title: "Section Title"
    accentColor: "#hex"?
    # ... all keys that renderer expects
    steps: [...]
```

---

## 3. Service-Flow Deep Dive

Service-flow is the MVP flagship renderer. Master it.

### Dynamic Node Sizing — CRITICAL BEST PRACTICE

**Nodes automatically stretch to fit their content.** The engine measures the `name`, `type`, and `technology` fields to compute optimal width. This means:

- **Service names can be long and descriptive** — "Enrollment & Demand API" will render beautifully without truncation
- **Shape nodes** (database, worker, external, etc.) also auto-size — no more cramped cylinder labels
- **Queue nodes** size based on name + broker text

**Width ranges (clamped):**
| Node Category | Min Width | Max Width |
|---------------|-----------|-----------|
| ServiceNode (rectangle) | 200px | 360px |
| Shape nodes (database, worker, etc.) | 140px | 280px |
| Queue nodes | 160px | 280px |

**How it works internally:**
- `measureServiceNodeWidth(name, type, technology)` in `src/components/nodes/dimensions.ts` estimates pixel width from character count
- `measureShapeNodeWidth(name, technology)` does the same for shape nodes
- `measureQueueNodeWidth(name, type, broker)` for queues
- `getParticipantDimensions()` in `ServiceFlowCanvas.tsx` feeds these into dagre layout AND the node's inline style
- Shape node heights scale proportionally when width grows

**Best practice:** Use clear, descriptive service names. Don't abbreviate — the nodes will size themselves.

```yaml
# GOOD — descriptive name, node will auto-size to ~280px
- id: enrollment
  name: Enrollment & Demand API
  type: api
  technology: .NET 10

# ALSO GOOD — short name stays at min-width 200px
- id: cache
  name: Stock Cache
  type: cache
  technology: Redis
```

### Dynamic Dagre Ranksep

The horizontal spacing between node columns (`ranksep`) is also **computed dynamically** based on the longest edge label in your story. Long `method + path` labels like `GET /v1/ceps/{studentId}/eligibility` will cause dagre to space nodes further apart so labels don't overlap the target node.

This is automatic — you don't need to configure anything. Just know that very long paths will push nodes apart.

### Visual Design: Top-Edge Color Coding, Icon Badges & Solid Ring Focus

Each service type has a **top accent border** (2.5px colored border-top), a **colored icon badge** (28×28 rounded container with white Lucide SVG icon), and a **top-down gradient header** (12% type color). Active nodes get a **solid 2px ring** in the type color with a subtle depth shadow — no animated glow pulses.

The accent colors come from the `--svc-border-*` design tokens:
| Type | Accent Color | Visual |
|------|-------------|--------|
| `api` | Blue #3B82F6 | Blue top bar + blue icon badge + gradient |
| `worker` | Purple #A855F7 | Purple top bar + purple icon badge |
| `gateway` | Amber #F59E0B | Amber top bar + amber icon badge |
| `database` | Stone #78716C | Stone top bar + stone icon badge |
| `cache` | Cyan #06B6D4 | Cyan top bar + cyan icon badge |
| `external` | Slate #64748B | Slate top bar + slate icon badge |
| `event-bus` | Orange #F97316 | Orange hexagon border + icon badge |
| `workflow` | Pink #EC4899 | Pink pill border + icon badge |
| `event-processor` | Violet #8B5CF6 | Violet rounded rect border + icon badge |

Type details use a **pill badge** (9px uppercase, type-colored background at 12% opacity) next to plain technology text.

### Smart Edge Label Positioning — Direction-Aware

Edge labels are **positioned based on edge direction** to prevent overlap:

| Edge Direction | Label Position |
|----------------|---------------|
| Left → Right (forward calls) | **Above** the edge line |
| Right → Left (response edges) | **Below** the edge line |
| Mostly vertical | **Right** of the midpoint |

**When multiple edges share the same source node**, labels are **staggered vertically** by 28px per edge. This means 3 outgoing edges from "Trip Operations API" will have their labels fanned out above the source rather than stacking on top of each other.

This is fully automatic via `sourceEdgeIndex` and `sourceEdgeCount` passed through edge data.

**Authoring tip:** When you have a service with many outgoing calls, the labels will naturally fan out. No need to worry about overlap — the engine handles it.

### 27 Service Types

#### Infrastructure Types (17)

| Type | Shape | Color | Lucide Icon | Best For |
|------|-------|-------|-------------|----------|
| `api` | Rectangle | Blue #3B82F6 | `Server` | REST/gRPC services |
| `worker` | Rounded rect | Purple #A855F7 | `Hammer` | Background processors |
| `gateway` | Diamond | Amber #F59E0B | `Globe` | API gateways, routing |
| `database` | Cylinder | Stone #78716C | `Database` | PostgreSQL, MongoDB, etc. |
| `cache` | Rounded square | Cyan #06B6D4 | `Zap` | Redis, Memcached |
| `external` | Cloud | Slate #64748B | `Cloud` | Third-party APIs |
| `event-bus` | Hexagon | Orange #F97316 | `Radio` | Kafka, RabbitMQ broker |
| `workflow` | Pill | Pink #EC4899 | `GitBranch` | Orchestrators, sagas |
| `event-processor` | Rounded rect | Violet #8B5CF6 | `Activity` | Stream processors |
| `client` | Card + accent | Indigo #6366F1 | `Monitor` | Human users, UIs, apps |
| `firewall` | Octagon | Rose #F43F5E | `ShieldCheck` | WAF, security gateways |
| `load-balancer` | Inv. trapezoid | Teal #14B8A6 | `Network` | NGINX, ALB, K8s Ingress |
| `scheduler` | Circle | Amber #D97706 | `Clock` | Cron jobs, Conductor schedules |
| `storage` | Wide cylinder | Stone #A8A29E | `HardDrive` | S3, Azure Blob, SFTP |
| `function` | Parallelogram | Orange #EA580C | `Cpu` | Lambda, Azure Functions |
| `monitor` | Rect + chart | Emerald #10B981 | `BarChart3` | PagerDuty, Grafana |
| `human-task` | Card + badge | Pink #EC4899 | `UserCheck` | Human approvals, review gates |

#### Domain Types (10)

| Type | Shape | Color | Lucide Icon | Best For |
|------|-------|-------|-------------|----------|
| `entity` | Rounded card | Sky #0EA5E9 | `Fingerprint` | Domain entities with identity |
| `aggregate` | Bold card | Indigo #4F46E5 | `Box` | Aggregate roots, consistency boundaries |
| `value-object` | Pill | Lime #84CC16 | `Gem` | Immutable value types |
| `domain-event` | Hexagon | Amber #F59E0B | `BellRing` | Domain events (past tense facts) |
| `policy` | Octagon | Rose #E11D48 | `Scale` | Business rules, invariants |
| `read-model` | Wide rect | Cyan #06B6D4 | `Eye` | Query-optimized projections |
| `saga` | Stadium | Violet #7C3AED | `Route` | Long-running process managers |
| `repository` | Cylinder | Stone #57534E | `Archive` | Persistence abstractions |
| `bounded-context` | Dashed container | Emerald #059669 | `Layers` | Strategic DDD boundaries |
| `actor` | Card + avatar | Pink #DB2777 | `User` | Human or system actors |

Shape is the primary discriminator (colorblind-safe). Icons are rendered as white SVGs inside colored 28x28 badge containers.

### Coupling & Failure Cascade

Calls can declare **coupling level** and **criticality** to visualize architectural risk:

```yaml
calls:
  - id: check-inventory
    type: sync
    from: orders
    to: inventory
    coupling: tight       # tight | loose | eventual
    critical: true        # marks as critical path
    fallback: cache       # service ID to fall back to

steps:
  - id: step-failure
    title: "Inventory Goes Down"
    simulateFailure: inventory   # triggers BFS upstream cascade
    activeCalls: [check-inventory]
```

**Visual effects:**
- `coupling: tight` — red edge accent, `loose` — blue, `eventual` — slate
- `critical: true` — thicker edge weight, included in cascade BFS
- `simulateFailure: <service-id>` — BFS upstream through critical calls, affected services flash red, fallback edges highlight
- `fallback` — when cascade reaches this call, the fallback service highlights as the recovery path

**How cascade works:** `getServiceFlowCascade()` in `src/schemas/service-flow.ts` does BFS upstream from the failed service through all `critical: true` calls, collecting affected services and active fallbacks.

### Camera Overrides

Per-step `camera:` object overrides the automatic `useAutoFocus` behavior:

```yaml
steps:
  - id: overview
    title: "System Overview"
    camera:
      fitAll: true              # zoom out to show everything
      duration: 2000            # slow 2s animation
      easing: ease-in-out

  - id: zoom-detail
    title: "Payment Critical Path"
    camera:
      zoom: 1.8                 # explicit zoom level
      focusNodes: [payment, ledger]
      padding: 60

  - id: pan-right
    title: "Downstream Effects"
    camera:
      pan: [200, 0]             # offset after focus
      easing: linear
      duration: 1500
```

**Available easing functions:** `spring-overshoot` (default, cinematic), `linear`, `ease-in`, `ease-out`, `ease-in-out`.

When `camera:` is omitted, the standard `useAutoFocus` behavior applies (auto-focus on active call participants or `focusNodes`).

### 4 Call Types

| Type | Line Style | Color | Arrow | Use For |
|------|-----------|-------|-------|---------|
| `sync` | Solid, animated dots | Blue #3B82F6 | Filled | REST/gRPC request-response |
| `async` | Dashed, animated dots | Purple #A855F7 | Open | Fire-and-forget messages |
| `publish` | Dashed, animated dots | Amber #F59E0B | Open | Service → Queue |
| `subscribe` | Dashed, animated dots | Teal #14B8A6 | Open | Queue → Service |

Sync calls with `response: {status, label}` generate a **reverse dotted edge** showing the return path.

### Zone Grouping Patterns

Zones draw bounding boxes around related services. Use for:

- **Team zones**: Group by owning team (`members: [orders, orders-db, inventory]`)
- **Data-flow zones**: Group by data pipeline stage
- **Risk zones**: Group by security boundary
- **Domain zones**: Group by bounded context

```yaml
zones:
  - id: core-services
    label: "Core Domain"
    members: [orders, inventory, orders-db]
    color: "rgba(59, 130, 246, 0.06)"
  - id: messaging
    label: "Event Infrastructure"
    members: [order-events, notification-queue]
    color: "rgba(168, 85, 247, 0.06)"
```

### Multi-Axis Step Choreography

The power of service-flow is **4 independent axes per step**:

| Axis | Purpose | Visual Effect |
|------|---------|---------------|
| `activeCalls` | Calls happening NOW | Glowing edges, animated dots |
| `focusNodes` | Where to point camera | Overrides auto-focus |
| `revealNodes` | Show nodes without a call | Nodes appear but no edge glow |
| `revealCalls` | Show edges as background | Edges visible, completed state |

**Patterns:**
- **Simple action step**: Just `activeCalls: [call-id]`
- **Context + action**: `revealCalls: [bg-call]` + `activeCalls: [main-call]`
- **Camera redirect**: `activeCalls: [call]` + `focusNodes: [far-node]`
- **Reveal infrastructure**: `revealNodes: [db, cache]` + no calls

### Response Edges

For sync calls, add `response` to show the return path:

```yaml
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

This generates a reverse dotted arrow from `orders` back to `gateway`. The response label appears **below** the edge line (direction-aware positioning).

### Tags (Key-Value Metadata)

Tags render as colored pills on service/queue nodes:

```yaml
tags:
  protocol: gRPC         # infra category (blue)
  version: "2.1"         # identity category (purple)
  SLA: "99.9%"           # metric category (green)
  team: platform          # identity category (purple)
  throughput: "50k/s"     # metric category (green)
```

Tags add extra height to nodes — `getTagsHeight()` estimates this and feeds it into dagre layout so nothing overlaps.

### Status Indicators

```yaml
status: healthy    # green dot, no effect
status: degraded   # amber dot, pulse effect
status: down       # red dot, shake effect
```

---

## 4. Narration & Storytelling Best Practices

> **For the full storytelling craft guide** — narrative arcs, 6 named patterns, narration voice guide, anti-patterns, and a complete worked composite example — see [`docs/presentation-playbook.md`](../docs/presentation-playbook.md).

### Pacing

| Step Type | Duration | Purpose |
|-----------|----------|---------|
| Opening/overview | 4000-5000ms | Orient the viewer |
| Action steps | 2500-3500ms | Quick progression |
| Complex steps | 4000-5000ms | More to absorb |
| Final overview | 5000-6000ms | Let it sink in |

### Progressive Reveal

- **Don't show everything at once** — reveal 1-3 new elements per step
- Start with context (gateway, user), then core services, then infrastructure
- End with the full picture (all elements visible)

### Narrative Voice

Tell a story, don't just label nodes:

```yaml
# Bad
narrative: "Order Service calls Inventory Service"

# Good
narrative: "Before committing the order, we check real-time stock levels via gRPC — this sub-50ms call is the critical path."
```

### Narration Formats

Each step needs **either** `narrative` or `narration` (at least one):

```yaml
# Simple text (most renderers)
narrative: "The user submits the form..."

# Named speaker (service-flow, state-diagram, bc-deployment, bc-composition)
# Can be used INSTEAD OF narrative — no need for both
narration:
  speaker: Architect
  message: "This is our most critical integration point."
```

### Rich Text Markup

All `narrative`, `description`, and `narration.message` text supports **inline formatting** — rendered by the StepOverlay's built-in micro-parser (zero dependencies).

| Syntax | Renders | Use For |
|--------|---------|---------|
| `**text**` | **bold** | Key terms, service names, emphasis |
| `*text*` | *italic* | Asides, secondary info |
| `` `text` `` | `code` | API paths, methods, event names |
| `{color:name\|text}` | colored text | Semantic highlights (success/error/warning) |
| `\n` | line break | Multi-line narratives |

**Named colors:** `blue`, `green`, `red`, `orange`, `amber`, `purple`, `pink`, `cyan`, `teal`, `yellow`, `gray` — or raw hex like `{color:#3B82F6|text}`.

```yaml
# Rich narrative example
narrative: >-
  The **API Gateway** receives `POST /orders` and routes to
  the {color:blue|Order Service}. After validation, a
  {color:orange|OrderCreatedEvent} is emitted to Kafka.

# Rich narration example
narration:
  speaker: SRE
  message: >-
    Latency on `POST /payments` has spiked to {color:red|340ms p99} —
    **3x above baseline**. Circuit breaker threshold is *100ms*.
```

**Best practices:**
- Use `**bold**` for service/entity names that are the focus of the step
- Use `` `code` `` for API paths, methods, event names, and technical identifiers
- Use `{color:red|...}` for errors/warnings, `{color:green|...}` for success/healthy
- Use `{color:blue|...}` for service names that match the blue type accent
- Don't over-format — 1-3 formatted spans per narrative is the sweet spot

---

## 5. Effects

Available effects (primarily on story-flow nodes):

| Effect | Use For | Trigger |
|--------|---------|---------|
| `pulse` | Drawing attention | on-focus, continuous |
| `glow` | Active/highlighted state | on-reveal, on-focus |
| `shake` | Error, failure | on-reveal |
| `emoji-explosion` | Celebration, milestone | on-click |
| `particles` | Background ambiance | continuous |
| `confetti` | Success completion | on-click |

**Service-flow status-driven effects:**
- `degraded` status → automatic pulse effect
- `down` status → automatic shake effect

---

## 6. Camera & Presentation

### ReactFlow Renderers (service-flow, http-flow, pipeline, bc-deployment, bc-composition, state-diagram)

Camera is **automatic** — follows active nodes via `useAutoFocus`. No manual camera YAML needed.

- `activeCalls` participants are auto-focused
- `focusNodes` overrides auto-focus for explicit camera control
- Spring-overshoot easing for cinematic feel

**Embed mode note:** The camera has a 150ms delayed initial focus to allow ReactFlow to measure node dimensions before animating. This ensures edges and connecting lines render correctly in iframes on first load.

### Cinematic Patterns

1. **Progressive zoom-in**: Start overview → detail → detail → full picture
2. **Pan across**: Focus shifts left-to-right across architecture
3. **Focus shift**: Each step highlights a different region
4. **Bookend**: Return to overview at the end

### Presentation Mode

- `P` to toggle, `ESC` to exit
- `→` / `Space` next step, `←` previous
- `Home` / `End` for first/last
- `?` for help overlay
- `N` for speaker notes

### Embed Mode

Add `?embed=true` to URL — hides all chrome, shows only canvas + overlay. For iframes:

```html
<iframe src="https://host/?story=order-processing&step=0&embed=true"
        width="100%" height="600" frameborder="0"></iframe>
```

---

## 7. Design Token Colors (Quick Reference)

### Service Type Colors

| Type | Color | Hex |
|------|-------|-----|
| api | Blue | #3B82F6 |
| worker | Purple | #A855F7 |
| gateway | Amber | #F59E0B |
| database | Stone | #78716C |
| cache | Cyan | #06B6D4 |
| external | Slate | #64748B |
| event-bus | Orange | #F97316 |
| workflow | Pink | #EC4899 |
| event-processor | Violet | #8B5CF6 |
| client | Indigo | #6366F1 |
| firewall | Rose | #F43F5E |
| load-balancer | Teal | #14B8A6 |
| scheduler | Amber | #D97706 |
| storage | Stone | #A8A29E |
| function | Orange | #EA580C |
| monitor | Emerald | #10B981 |
| human-task | Pink | #EC4899 |
| entity | Sky | #0EA5E9 |
| aggregate | Indigo | #4F46E5 |
| value-object | Lime | #84CC16 |
| domain-event | Amber | #F59E0B |
| policy | Rose | #E11D48 |
| read-model | Cyan | #06B6D4 |
| saga | Violet | #7C3AED |
| repository | Stone | #57534E |
| bounded-context | Emerald | #059669 |
| actor | Pink | #DB2777 |

### Coupling Colors

| Level | Color | Hex |
|-------|-------|-----|
| tight | Red | #EF4444 |
| loose | Blue | #3B82F6 |
| eventual | Slate | #94A3B8 |

### Call Type Colors

| Type | Color | Hex |
|------|-------|-----|
| sync | Blue | #3B82F6 |
| async | Purple | #A855F7 |
| publish | Amber | #F59E0B |
| subscribe | Teal | #14B8A6 |

### Semantic Colors

| Meaning | Color | Hex |
|---------|-------|-----|
| Success/healthy | Green | #22C55E |
| Error/down | Red | #EF4444 |
| Warning/degraded | Amber | #F59E0B |
| Info | Blue | #3B82F6 |

### Zone Colors (6 predefined, semi-transparent)

Blue, Purple, Green, Orange, Pink, Cyan — all at `rgba(..., 0.06)` opacity.

---

## 8. Code Architecture Reference (For Agents Modifying FlowStory)

### Key Files & Functions

When modifying the service-flow renderer, these are the critical files:

| File | Purpose |
|------|---------|
| `src/components/nodes/dimensions.ts` | **Node measurement functions** — `measureServiceNodeWidth()`, `measureShapeNodeWidth()`, `measureQueueNodeWidth()`, and static `NODE_DIMENSIONS` |
| `src/components/service/ServiceFlowCanvas.tsx` | **Main canvas** — dagre layout, `getParticipantDimensions()`, `buildDagreLayout()`, edge index computation |
| `src/components/service/ServiceCallEdge.tsx` | **Edge component** — `computeLabelTransform()` for direction-aware label positioning, `ServiceCallEdgeData` interface |
| `src/components/service/ServiceNode.tsx` | **Rectangle node** for `api` type |
| `src/components/service/DatabaseNode.tsx` | **Cylinder shape** — database nodes |
| `src/components/service/service-nodes.css` | **All styles** — node shapes, states, glows, edge labels, zones |
| `src/styles/tokens.css` | **Design tokens** — `--svc-border-*`, `--svc-glow-*`, all color variables |
| `src/hooks/useCameraController.ts` | **Camera system** — `useAutoFocus()` with delayed initial focus for embeds |
| `src/schemas/service-flow.ts` | **Zod schemas** — type unions, color maps, layout constants |

### Node Sizing Pipeline

```
YAML service.name + service.type + service.technology
  ↓
measureServiceNodeWidth() / measureShapeNodeWidth() / measureQueueNodeWidth()
  ↓ (character count × CHAR_WIDTH + padding, clamped to [min, max])
getParticipantDimensions()
  ↓ (width + height including tags)
dagre g.setNode(id, { width, height })
  ↓ (dagre computes positions)
node.style = { width, height }  ← ReactFlow inline style
node.position = { x, y }       ← dagre-computed, centered
```

### Edge Label Pipeline

```
ServiceFlowCanvas: compute sourceEdgeCounts per source node
  ↓ assign sourceEdgeIndex (0, 1, 2...) to each edge
  ↓ pass in ServiceCallEdgeData
ServiceCallEdge: computeLabelTransform(labelX, labelY, sourceX, sourceY, targetX, targetY, isResponse, sourceEdgeIndex, sourceEdgeCount)
  ↓ direction-aware: forward=above, response=below, vertical=right
  ↓ stagger: edgeIndex × 28px vertical offset
  → CSS transform on label div
```

### Adding a New Service Type

1. Add type to the Zod union in `src/schemas/service-flow.ts`
2. Add Lucide icon to `SERVICE_TYPE_ICONS` map (import from `lucide-react`)
3. Add color to `SERVICE_TYPE_COLORS` map
4. Add border token `--svc-border-{type}` to `src/styles/tokens.css` (both light and dark)
5. Create shape component in `src/components/service/{Type}Node.tsx` (or reuse existing shape) — use `.shape-node__icon-badge` for colored icon container
6. Add to `SHAPE_NODE_TYPES` set and `nodeTypes` registry in `ServiceFlowCanvas.tsx`
7. Add CSS for `.shape-node--{type}` in `service-nodes.css` — use `min-width`/`min-height` (NOT fixed width/height)
8. Add icon badge color: `.shape-node--{type} .shape-node__icon-badge { background: var(--svc-border-{type}); }`
9. Add active state: solid ring `box-shadow: 0 0 0 2px var(--svc-border-{type}), ...` (or `filter: drop-shadow()` for clip-path shapes)
10. Add dimensions to `NODE_DIMENSIONS` in `dimensions.ts`
11. Add top-edge accent CSS: `.service-node--{type} { border-top-color: var(--svc-border-{type}); }` + type-pill + icon-badge color rules

### CSS Rules — NEVER BREAK THESE

- **`min-width` / `min-height`** on shape nodes — NEVER `width` / `height` (JS-computed inline styles must be able to override)
- **Token variables for ALL colors** — no hardcoded hex in CSS (outside `tokens.css`)
- **`background: white` is banned** — use `var(--color-bg-elevated)`
- **`transition: all` is banned** — always list explicit properties
- **Shape node `.shape-node__name`** uses `-webkit-line-clamp: 2` for 2-line wrap — NEVER `white-space: nowrap`

---

## 9. Example Templates

### Minimal Service Flow (5 services)

```yaml
id: my-service-flow
title: "Order Processing"
renderer: service-flow
schemaVersion: "2.0"

services:
  - id: gateway
    name: API Gateway
    type: gateway
    technology: Kong
  - id: orders
    name: Order Service
    type: api
    technology: Node.js
  - id: inventory
    name: Inventory Service
    type: api
    technology: Go
  - id: orders-db
    name: Orders DB
    type: database
    technology: PostgreSQL

queues:
  - id: order-events
    name: order-events
    type: topic
    broker: kafka

calls:
  - id: create-order
    type: sync
    from: gateway
    to: orders
    method: POST
    path: /orders
  - id: check-inventory
    type: sync
    from: orders
    to: inventory
    method: GET
    path: /stock
  - id: save-order
    type: sync
    from: orders
    to: orders-db
    method: INSERT
  - id: publish-event
    type: publish
    from: orders
    to: order-events
    messageType: OrderCreatedEvent

steps:
  - id: step-1
    title: "Request Arrives"
    narrative: "Customer submits an order through the API Gateway."
    activeCalls: [create-order]
  - id: step-2
    title: "Stock Check"
    narrative: "Order Service verifies inventory before committing."
    activeCalls: [check-inventory]
  - id: step-3
    title: "Persist & Publish"
    narrative: "Order is saved and an event is published for downstream consumers."
    activeCalls: [save-order]
    revealCalls: [publish-event]
  - id: step-4
    title: "Event Fan-Out"
    narrative: "OrderCreatedEvent flows to Kafka for async processing."
    activeCalls: [publish-event]
```

### Service Flow with Long Names & Responses (Dynamic Sizing Demo)

```yaml
id: enrollment-flow
title: "Student Enrollment Eligibility"
renderer: service-flow
schemaVersion: "2.0"

services:
  - id: trip-ops
    name: Trip Operations API
    type: api
    technology: .NET 10
    status: healthy
  - id: enrollment
    name: Enrollment & Demand API
    type: api
    technology: .NET 10
    status: healthy
  - id: postgres
    name: PostgreSQL + PostGIS
    type: database
    technology: PostgreSQL 16

calls:
  - id: check-eligibility
    type: sync
    from: trip-ops
    to: enrollment
    method: GET
    path: /v1/ceps/{studentId}/eligibility
    duration: 80
    response:
      status: 200
      label: "Eligibility Response"
  - id: query-runs
    type: sync
    from: trip-ops
    to: postgres
    method: GET
    path: subscription_runs WHERE active AND bitmask
    duration: 25

steps:
  - id: step-1
    title: "Eligibility Check"
    narrative: "Trip Operations queries the Enrollment API to verify student eligibility before route generation."
    activeCalls: [check-eligibility]
  - id: step-2
    title: "Active Run Lookup"
    narrative: "Subscription runs with active bitmask flags are fetched from PostGIS for spatial route optimization."
    activeCalls: [query-runs]
    revealCalls: [check-eligibility]
```

### State Machine

```yaml
id: order-lifecycle
title: "Order Lifecycle"
renderer: state-diagram
direction: LR

states:
  - { id: start, label: "", type: initial }
  - { id: pending, label: PENDING, type: normal, variant: info }
  - { id: confirmed, label: CONFIRMED, type: normal, variant: success }
  - { id: shipped, label: SHIPPED, type: normal, variant: success }
  - { id: delivered, label: DELIVERED, type: terminal, variant: success }
  - { id: cancelled, label: CANCELLED, type: terminal, variant: error }

transitions:
  - { id: t1, source: start, target: pending, trigger: "submit order" }
  - { id: t2, source: pending, target: confirmed, trigger: "payment received" }
  - { id: t3, source: confirmed, target: shipped, trigger: "dispatch" }
  - { id: t4, source: shipped, target: delivered, trigger: "delivery confirmed" }
  - { id: t5, source: pending, target: cancelled, trigger: "cancel", guard: "within 24h" }

steps:
  - id: s1
    title: "Order Created"
    narrative: "A new order enters the PENDING state."
    activeStates: [start, pending]
    activeTransitions: [t1]
  - id: s2
    title: "Payment & Fulfillment"
    narrative: "Once paid, the order flows through confirmation and shipping."
    activeStates: [confirmed, shipped]
    activeTransitions: [t2, t3]
  - id: s3
    title: "Terminal States"
    narrative: "Orders end as either delivered or cancelled."
    activeStates: [delivered, cancelled]
    activeTransitions: [t4, t5]
```

### Reference Examples

Browse `stories/` for full, validated examples:
- `stories/service/order-processing.yaml` — Service flow with zones, tags, multi-axis steps
- `stories/service/conductor-orchestration.yaml` — All 8 new infra types + sub-states in a Conductor saga
- `stories/service/payment-platform.yaml` — End-to-end payment processing with effects
- `stories/service/ddd-order-domain.yaml` — All 10 domain-level node types in a DDD Order bounded context
- `stories/service/coupling-analysis.yaml` — Coupling indicators + failure cascade simulation
- `stories/service/cinematic-camera.yaml` — Per-step camera overrides (zoom, fitAll, easing, pan)
- `stories/composite/order-deep-dive.yaml` — Multi-renderer composite
- `stories/pipeline/*.yaml` — CI/CD pipelines
- `stories/state-diagram/*.yaml` — State machines

---

## 10. Common Mistakes

| Mistake | Fix |
|---------|-----|
| Referencing undefined IDs in steps | Every ID in `activeCalls`/`focusNodes` must exist in `calls`/`services`/`queues` |
| Missing `schemaVersion: "2.0"` | Required for service-flow, http-flow, pipeline, composite |
| Showing everything in step 1 | Progressive reveal — start with 1-2 nodes |
| No narrative text | Every step needs either `narrative` (string) or `narration` ({speaker, message}) — at least one |
| Hardcoded node positions | Service-flow uses dagre auto-layout — never set x/y |
| Using `type:` instead of `renderer:` | service-flow, http-flow, pipeline use `renderer:`; bc-deployment, c4-context use `type:` |
| Forgetting `activeCalls` is required | Every service-flow step must have `activeCalls: []` (can be empty) |
| Setting fixed `width`/`height` in shape CSS | Use `min-width`/`min-height` — JS inline styles drive actual size |
| Abbreviating service names to avoid truncation | Not needed — nodes auto-size to fit content up to 360px |
| Worrying about label overlap with many edges | Automatic — `sourceEdgeIndex` staggers labels vertically |
