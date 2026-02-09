# 0005: Event Storming Visualization

## Concept

Visualize domain events using Event Storming patterns - the collaborative modeling technique for understanding complex business domains through domain events.

**Target audience:** Domain experts, Developers, Architects, Product owners

## Use Cases

1. **Domain Discovery**: "What events happen in our business?"
2. **Process Understanding**: "How does this workflow progress?"
3. **Bounded Context Mapping**: "Where do domains interact?"
4. **Event Sourcing Design**: "What events drive our system?"
5. **Workshop Documentation**: "Capture the event storming session"

## Visual Design (Event Storming Colors)

```
┌──────────────────────────────────────────────────────────────────────┐
│  TIMELINE →                                                          │
│                                                                      │
│  ┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐       │
│  │ Command │     │ Event   │     │ Event   │     │ Event   │       │
│  │ (Blue)  │────▶│ (Orange)│────▶│ (Orange)│────▶│ (Orange)│       │
│  └─────────┘     └─────────┘     └─────────┘     └─────────┘       │
│       │               │                               │              │
│       │          ┌────┴────┐                    ┌────┴────┐         │
│       │          │ Policy  │                    │ Read    │         │
│       │          │ (Lilac) │                    │ Model   │         │
│       │          └─────────┘                    │ (Green) │         │
│       │                                         └─────────┘         │
│  ┌────┴────┐                                                        │
│  │ Actor   │                                                        │
│  │ (Yellow)│                                                        │
│  └─────────┘                                                        │
│                                                                      │
│  ┌─────────┐                    ┌─────────┐                         │
│  │ Hotspot │                    │ External│                         │
│  │ (Pink)  │                    │ (Pink)  │                         │
│  └─────────┘                    └─────────┘                         │
└──────────────────────────────────────────────────────────────────────┘
```

## Sticky Note Types (Standard Colors)

| Type | Color | Description |
|------|-------|-------------|
| `domain-event` | Orange | Something that happened (past tense) |
| `command` | Blue | Intention to change state |
| `actor` | Yellow | Person or role that initiates |
| `aggregate` | Yellow (large) | Cluster of domain objects |
| `policy` | Lilac | Reactive logic "When X, then Y" |
| `read-model` | Green | Query/projection for users |
| `external-system` | Pink | External integration |
| `hotspot` | Pink/Red | Problem, question, or concern |
| `timeline` | Arrow | Temporal sequence |

## Animation Effects

1. **Timeline flow**: Events appear in sequence
2. **Cause-effect**: Command triggers event animation
3. **Policy reaction**: Lilac note lights up after event
4. **Aggregate focus**: Group related events
5. **Hotspot pulse**: Pink notes pulse for attention

## Schema

```yaml
type: event-storming

domain: "Order Management"

actors:
  - id: customer
    name: "Customer"
    icon: "👤"

aggregates:
  - id: order
    name: "Order"
    events: [order-placed, order-confirmed, order-shipped]

events:
  - id: order-placed
    name: "OrderPlaced"
    aggregate: order
    triggeredBy: place-order
    data:
      - orderId
      - customerId
      - items

commands:
  - id: place-order
    name: "PlaceOrder"
    actor: customer
    aggregate: order

policies:
  - id: notify-warehouse
    name: "When OrderPlaced, notify warehouse"
    trigger: order-placed
    action: send-to-warehouse

hotspots:
  - id: payment-timing
    note: "When should we charge? Before or after confirmation?"
    near: order-placed

steps:
  - title: "Order Lifecycle"
    focusAggregate: order
    showEvents: true
```

## Implementation Plan

### Phase 1: Schema (25 min)
- [ ] Create `event-storming.ts` schema
- [ ] Define all sticky note types
- [ ] Add aggregate grouping

### Phase 2: Components (1.5 hours)
- [ ] `EventNote`: Orange domain event
- [ ] `CommandNote`: Blue command
- [ ] `ActorNote`: Yellow actor
- [ ] `PolicyNote`: Lilac policy
- [ ] `HotspotNote`: Pink problem marker
- [ ] `AggregateGroup`: Yellow container

### Phase 3: Examples (30 min)
- [ ] `order-domain.yaml`: Order lifecycle
- [ ] `payment-flow.yaml`: Payment processing

### Phase 4: Export (15 min)
- [ ] GIF capture

---

**Priority:** P0
**Estimated time:** 2.5 hours
**Start:** Now
