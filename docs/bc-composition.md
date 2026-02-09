# BC Composition Visualization

Visualize the composition of any bounded context or central concept with **progressive reveal** - start with the center, reveal constituents one by one.

## Key Concepts

### Progressive Reveal
Unlike traditional diagrams that dump everything on screen at once, BC Composition reveals elements step by step:

1. **Step 1**: Only the core node (your central concept)
2. **Step 2**: Core + first constituent with animation
3. **Step 3**: Core + first + second constituent
4. ...and so on

This creates a narrative flow, perfect for presentations and documentation.

### Generic Elements
Not locked to DevOps artifacts. Visualize anything:
- Domain model constituents (aggregates, entities, services)
- Infrastructure topology (APIs, databases, queues)
- Team structures
- Service dependencies
- Or any custom type you define

## YAML Schema

```yaml
title: "Order Service Composition"
version: 1
type: bc-composition

layout:
  mode: radial          # radial | hierarchical | layered
  spacing: 200          # gap between layers

# The central concept
core:
  id: order-service
  name: "Order Service"
  icon: "🛒"
  description: "Handles order lifecycle"
  color: "#4CAF50"

# What constitutes this concept
elements:
  - id: order-api
    name: "Order API"
    type: "api"           # Any string - not enum-locked
    icon: "🌐"
    layer: 1              # Distance from center
    effect:
      type: grow          # Animation on reveal
      duration: 500
    children:             # Nested elements (expand on click)
      - id: create-endpoint
        name: "POST /orders"
        type: "endpoint"

  - id: order-db
    name: "Orders Database"
    type: "database"
    layer: 1
    effect:
      type: slide
      direction: up

# Relationships
edges:
  - id: api-to-db
    source: order-api
    target: order-db
    type: depends
    label: "persists to"

# Progressive reveal sequence
steps:
  - id: step-1
    title: "The Core"
    reveal: []            # Empty = only core visible
    narration:
      speaker: "Architect"
      message: "This is our Order Service."

  - id: step-2
    title: "The API"
    reveal: [order-api]   # Reveal this element
    focus: [order-api]    # Camera focuses here

  - id: step-3
    title: "Persistence"
    reveal: [order-db]
    expand: [order-db]    # Auto-expand children
```

## Reveal Effects

Each element can have a custom reveal effect:

| Effect | Description |
|--------|-------------|
| `fade` | Simple opacity fade (default) |
| `grow` | Scale from 0 to 1 |
| `slide` | Slide in from direction (up/down/left/right) |
| `pulse` | Fade in with scale pulse |
| `radiate` | Ripple effect from center |
| `glow` | Appear with blur-to-sharp |
| `cascade` | For children - sequential reveal |
| `none` | Instant appear |

```yaml
effect:
  type: grow
  duration: 500    # ms
  delay: 100       # ms after step starts
  direction: up    # for slide effect
```

## Element Types

Use any string as the `type` field. Built-in colors exist for common types:

**DevOps**: helm-chart, deployment, service, secret, configmap, database, queue, ingress

**Domain**: aggregate, entity, value-object, repository, domain-service, event, command

**Infrastructure**: api, cache, storage

Custom types get a default gray color, or specify `color` explicitly.

## Nested Hierarchies

Elements can have children that expand on click:

```yaml
elements:
  - id: events
    name: "Domain Events"
    type: "event-bus"
    children:
      - id: order-created
        name: "OrderCreated"
        type: "event"
      - id: order-shipped
        name: "OrderShipped"
        type: "event"
```

Children are hidden by default. Expand via:
- Click the `+` button on the parent node
- Use `expand: [parent-id]` in a step to auto-expand

## Navigation

- **Space / →**: Next step (reveal next element)
- **←**: Previous step
- **Home**: First step
- **End**: Last step

## Example Use Cases

### Domain Model Walkthrough
```yaml
core:
  name: "Order Aggregate"
  
elements:
  - { id: order-entity, name: "Order", type: "entity" }
  - { id: line-item, name: "LineItem", type: "entity" }
  - { id: order-status, name: "OrderStatus", type: "value-object" }
```

### Service Dependencies
```yaml
core:
  name: "Payment Gateway"
  
elements:
  - { id: stripe, name: "Stripe", type: "external", layer: 1 }
  - { id: paypal, name: "PayPal", type: "external", layer: 1 }
  - { id: fraud-check, name: "Fraud Detection", type: "internal", layer: 2 }
```

### Infrastructure Topology
```yaml
core:
  name: "Order Service"
  
elements:
  - { id: api, name: "REST API", type: "api" }
  - { id: db, name: "PostgreSQL", type: "database" }
  - { id: cache, name: "Redis", type: "cache" }
  - { id: queue, name: "RabbitMQ", type: "queue" }
```

## Comparison: BC Composition vs BC Deployment

| Feature | BC Composition | BC Deployment (legacy) |
|---------|---------------|------------------------|
| Reveal | Progressive, one-by-one | All at once |
| Types | Generic (any string) | Fixed enum (22 types) |
| Effects | Configurable per element | None |
| Focus | Narrative flow | Static topology |
| Use case | Presentations, docs | Quick reference |

**Recommendation**: Use BC Composition for new visualizations.
