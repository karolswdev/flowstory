# BC Deployment Renderer - Research & Specification

## Executive Summary

A **Bounded Context Deployment View** visualizes the operational infrastructure of a domain service from a DevOps perspective. Unlike code-level views, this shows what gets deployed, how it's configured, and the relationships between artifacts.

---

## 1. Research: Supported Artifact Types

### Core Deployment Artifacts

| Type | Icon | Description | Use Case |
|------|------|-------------|----------|
| `helm-chart` | 📦 | Helm chart package | K8s deployment bundle |
| `values-yaml` | ⚙️ | Values override file | Environment config |
| `deployment` | 🚀 | K8s Deployment | Workload definition |
| `statefulset` | 🗄️ | K8s StatefulSet | Stateful workloads |
| `service` | 🔌 | K8s Service | Network exposure |
| `ingress` | 🌐 | K8s Ingress | External routing |
| `configmap` | 📋 | K8s ConfigMap | Non-secret config |
| `secret` | 🔐 | K8s Secret | Sensitive data |
| `hpa` | 📈 | HorizontalPodAutoscaler | Auto-scaling rules |
| `pdb` | 🛡️ | PodDisruptionBudget | Availability guarantee |
| `serviceaccount` | 👤 | K8s ServiceAccount | Pod identity |
| `cronjob` | ⏰ | K8s CronJob | Scheduled tasks |
| `job` | ▶️ | K8s Job | One-time tasks |
| `pvc` | 💾 | PersistentVolumeClaim | Storage request |

### Extended Artifacts (Non-K8s)

| Type | Icon | Description | Use Case |
|------|------|-------------|----------|
| `dockerfile` | 🐳 | Container definition | Build artifact |
| `terraform` | 🏗️ | IaC module | Infrastructure |
| `database` | 🗃️ | Database resource | Data persistence |
| `queue` | 📬 | Message queue | Async messaging |
| `cache` | ⚡ | Cache layer | Performance |
| `external` | 🔗 | External dependency | 3rd party service |
| `pipeline` | 🔄 | CI/CD pipeline | Build/deploy |
| `monitoring` | 📊 | Observability config | Alerts, dashboards |

**Recommendation:** Support all 22 types, grouped into categories:
- **Kubernetes** (14 types)
- **Infrastructure** (4 types)
- **Integration** (4 types)

---

## 2. Research: Child Nodes (Sub-Artifacts)

### Problem
Some artifacts contain or reference other artifacts. Example:
- `helm-chart` → contains → `deployment`, `service`, `configmap`
- `deployment` → references → `configmap`, `secret`, `serviceaccount`
- `values-yaml` → overrides → specific keys in templates

### Proposed Solution: Hierarchical Nodes

```yaml
artifacts:
  - id: main-chart
    type: helm-chart
    name: "order-service"
    children:
      - id: deployment
        type: deployment
        name: "order-api"
      - id: worker-deployment
        type: deployment
        name: "order-worker"
      - id: service
        type: service
        name: "order-api-svc"
```

### Visual Representation Options

| Option | Description | Pros | Cons |
|--------|-------------|------|------|
| **Nested rings** | Children in outer ring around parent | Clear hierarchy | Complex layout |
| **Expandable nodes** | Click to expand/collapse children | Clean, progressive | Hides detail |
| **Grouped clusters** | Visual grouping with border | Standard pattern | Can get cluttered |
| **Connection-only** | Children as separate nodes with edge | Simple | Loses hierarchy |

**Recommendation:** **Expandable nodes** as primary, with option for **grouped clusters** for complex charts.

---

## 3. Research: Emphasis & Transition Effects

### Emphasis Effects (What draws attention)

| Effect | When to Use | Implementation |
|--------|-------------|----------------|
| **Pulse glow** | Active/selected artifact | CSS box-shadow animation |
| **Scale bounce** | New artifact appearing | Spring animation on entry |
| **Radiate rings** | Event source (BC core) | Expanding circles from center |
| **Highlight border** | Focus target | Border color change |
| **Dimming** | Background artifacts | Opacity reduction |
| **Connection trace** | Active data flow | Edge particle animation |

### Transition Effects (Step changes)

| Effect | When to Use | Implementation |
|--------|-------------|----------------|
| **Staggered reveal** | Initial artifact display | Delay-based entry |
| **Zoom to focus** | Step with focusNodes | fitBounds with easing |
| **Morph layout** | Expanding children | Layout interpolation |
| **Edge draw** | New connection | pathLength animation |
| **Fade cascade** | Hiding old artifacts | Opacity with stagger |

**Recommendation:** Implement all emphasis effects. For transitions, prioritize:
1. Staggered reveal (done)
2. Zoom to focus (done)
3. Edge draw with particles (done)
4. Expandable children (new)

---

## 4. Research: YAML Schema Configurability

### Current Schema (Prototype)

```yaml
title: string
type: bc-deployment
bc:
  id: string
  name: string
  icon: string
  color: string
  publishes: string[]
  subscribes: string[]
artifacts: Artifact[]
edges: Edge[]
steps: Step[]
```

### Proposed Schema Enhancements

```yaml
title: string
version: 2
type: bc-deployment

# Layout configuration
layout:
  mode: radial | hierarchical | layered
  centerSize: number      # BC core node size (default: 120)
  ringSpacing: number     # Distance between rings (default: 140)
  childLayout: nested | expanded | clustered

# Theme/styling
theme:
  palette: default | kubernetes | azure | aws
  darkMode: auto | light | dark

# Bounded Context (center)
bc:
  id: string
  name: string
  icon: string
  description: string
  color: string
  events:
    publishes: string[]
    subscribes: string[]
  metrics:                # Optional operational metrics
    replicas: number
    cpu: string
    memory: string

# Artifacts with children support
artifacts:
  - id: string
    type: ArtifactType
    name: string
    description: string
    path: string          # File path in repo
    layer: number         # Ring layer (1 = closest to BC)
    children:             # Nested artifacts
      - id: string
        type: ArtifactType
        name: string
    annotations:          # Custom key-value display
      version: string
      replicas: string

# Edges with more types
edges:
  - source: string
    target: string
    type: contains | configures | overrides | mounts | depends | exposes | scales | triggers
    label: string
    animated: boolean

# Steps with enhanced focus
steps:
  - title: string
    description: string
    focusNodes: string[]
    activeEdges: string[]
    zoomLevel: number
    expandNodes: string[]   # Auto-expand these nodes
    highlightPaths: string[]  # File paths to highlight
    narration:              # Optional narrative
      speaker: string
      message: string
```

---

## 5. Research: Audience Value Proposition

### DevOps Engineers
**Primary concern:** "What do I deploy and how is it configured?"

Value features:
- Helm chart structure visualization
- Values file override hierarchy
- Resource relationships (deployment → configmap → secret)
- Environment-specific configs

### Software Architects
**Primary concern:** "How does this BC fit into the system?"

Value features:
- Event publishing/subscribing
- External dependencies
- Database and queue connections
- Service mesh integration points

### Developers
**Primary concern:** "How do I configure my feature?"

Value features:
- ConfigMap key documentation
- Secret mounting patterns
- Environment variable sources
- Resource request/limits visibility

### Platform Teams
**Primary concern:** "Is this following our standards?"

Value features:
- Policy compliance indicators
- Resource allocation visibility
- Scaling configuration
- Monitoring/alerting setup

---

## 6. Specification: Implementation Plan

### Phase 1: Schema & Types (1 hour)
- [ ] Update `bc-deployment.ts` with enhanced schema
- [ ] Add child node support to ArtifactNodeSchema
- [ ] Add layout configuration options
- [ ] Add theme configuration

### Phase 2: Layout Engine (2 hours)
- [ ] Implement `radial` layout (current, polish)
- [ ] Implement `hierarchical` layout (tree view)
- [ ] Implement `layered` layout (horizontal layers)
- [ ] Add child node positioning within parents

### Phase 3: Component Updates (2 hours)
- [ ] Update `ArtifactNode` with expand/collapse
- [ ] Add child node rendering
- [ ] Update edge routing for hierarchical connections
- [ ] Add annotations display

### Phase 4: Generic Examples (1 hour)
- [ ] Create `generic-api-service.yaml` (REST API deployment)
- [ ] Create `generic-worker-service.yaml` (Background processor)
- [ ] Create `generic-gateway.yaml` (API Gateway pattern)
- [ ] Remove EverDriven-specific content

### Phase 5: Documentation (30 min)
- [ ] Update AGENTS.md with BC Deployment examples
- [ ] Add to README feature list
- [ ] Create `docs/bc-deployment.md` guide

---

## 7. Example: Generic API Service

```yaml
title: "Order Service - Deployment View"
version: 2
type: bc-deployment

layout:
  mode: radial
  centerSize: 120
  ringSpacing: 140

bc:
  id: order-service
  name: "Order Service"
  icon: "🛒"
  description: "Handles order lifecycle from creation to fulfillment"
  color: "#4CAF50"
  events:
    publishes:
      - OrderCreatedEvent
      - OrderShippedEvent
    subscribes:
      - PaymentCompletedEvent
      - InventoryReservedEvent

artifacts:
  - id: helm-chart
    type: helm-chart
    name: "order-service"
    path: "charts/order-service"
    layer: 1
    children:
      - id: api-deployment
        type: deployment
        name: "order-api"
      - id: worker-deployment
        type: deployment
        name: "order-worker"
      - id: api-service
        type: service
        name: "order-api-svc"

  - id: values-prod
    type: values-yaml
    name: "values-prod.yaml"
    path: "charts/order-service/values-prod.yaml"
    layer: 2
    annotations:
      replicas: "3"
      cpu: "500m"
      memory: "512Mi"

  - id: configmap
    type: configmap
    name: "order-config"
    layer: 2

  - id: db
    type: database
    name: "orders-db"
    layer: 3
    annotations:
      type: "PostgreSQL"
      version: "15"

  - id: queue
    type: queue
    name: "order-events"
    layer: 3
    annotations:
      type: "RabbitMQ"

edges:
  - source: helm-chart
    target: values-prod
    type: configures
  - source: helm-chart
    target: configmap
    type: contains
  - source: api-deployment
    target: configmap
    type: mounts
  - source: api-deployment
    target: db
    type: depends
  - source: worker-deployment
    target: queue
    type: depends

steps:
  - title: "Helm Chart Overview"
    description: "The Order Service is packaged as a Helm chart with multiple workloads"
    focusNodes: [helm-chart]
    expandNodes: [helm-chart]
    zoomLevel: 1.2

  - title: "Production Configuration"
    description: "Environment-specific values override the defaults"
    focusNodes: [values-prod, configmap]
    activeEdges: [helm-chart->values-prod, helm-chart->configmap]

  - title: "Data Dependencies"
    description: "The service depends on PostgreSQL for persistence and RabbitMQ for events"
    focusNodes: [db, queue]
    activeEdges: [api-deployment->db, worker-deployment->queue]
    zoomLevel: 0.9
```

---

## 8. Decision Summary

| Aspect | Decision | Rationale |
|--------|----------|-----------|
| Artifact types | 22 types in 3 categories | Covers K8s + infra + integration |
| Child nodes | Expandable with nested option | Progressive disclosure |
| Layout modes | Radial (default), hierarchical, layered | Different use cases |
| Effects | All emphasis, prioritized transitions | Polish without bloat |
| Schema | Enhanced with layout, theme, children | Flexible but typed |
| Examples | 3 generic patterns | OSS-appropriate |

---

*Research completed: 2026-02-09*
*Author: Klaudiusz*
