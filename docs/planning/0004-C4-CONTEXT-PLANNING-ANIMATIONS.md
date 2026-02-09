# 0004: C4 Context Diagram

## Concept

Visualize system context using the C4 model (Level 1) - showing the system, its users, and external dependencies at the highest level of abstraction.

**Target audience:** Executives, Stakeholders, New team members, External partners

## Use Cases

1. **Executive Summary**: "What does this system do?"
2. **Stakeholder Communication**: "Who uses the system?"
3. **Integration Overview**: "What external systems do we connect to?"
4. **Onboarding**: "The 10,000 foot view"
5. **Risk Assessment**: "What are our external dependencies?"

## Visual Design

```
                              ┌─────────────┐
                              │   Customer  │
                              │   👤        │
                              └──────┬──────┘
                                     │ uses
                                     ▼
    ┌─────────────┐          ┌───────────────┐          ┌─────────────┐
    │  Admin      │ manages  │               │  sends   │   Email     │
    │  👤         │─────────→│   Order       │─────────→│   Service   │
    └─────────────┘          │   System      │          │   📧        │
                             │   🏢          │          └─────────────┘
    ┌─────────────┐          │               │          ┌─────────────┐
    │  Support    │ queries  │               │  stores  │  Warehouse  │
    │  👤         │─────────→│               │─────────→│   System    │
    └─────────────┘          └───────────────┘          │   🏭        │
                                     │                  └─────────────┘
                                     │ processes
                                     ▼
                              ┌─────────────┐
                              │   Payment   │
                              │   Gateway   │
                              │   💳        │
                              └─────────────┘
```

## Node Types (C4 Standard)

| Type | Shape | Description |
|------|-------|-------------|
| `person` | Rounded rect with icon | Human user/actor |
| `system` | Large rounded rect | The system being described |
| `external-system` | Grey rounded rect | External system dependency |
| `container` | Rounded rect | Container within system (for drilling down) |

## Relationship Types

| Type | Visual | Description |
|------|--------|-------------|
| `uses` | Solid arrow | User interacts with system |
| `sends` | Dashed arrow | Sends data/events to |
| `reads` | Dotted arrow | Reads data from |
| `manages` | Solid arrow | Administrative control |

## Animation Effects

1. **Center focus**: System pulses as central element
2. **User flow**: Animate arrows from users to system
3. **Dependency trace**: Show data flow to external systems
4. **Zoom levels**: Overview → System detail → Dependencies

## Schema

```yaml
type: c4-context

system:
  id: order-system
  name: "Order Management System"
  description: "Handles order lifecycle from placement to fulfillment"
  icon: "🏢"
  color: "#2196F3"

people:
  - id: customer
    name: "Customer"
    description: "Places and tracks orders"
    icon: "👤"
    external: false
    
  - id: admin
    name: "Admin"
    description: "Manages orders and configuration"
    icon: "👤"
    external: false

externalSystems:
  - id: payment
    name: "Payment Gateway"
    description: "Stripe payment processing"
    icon: "💳"
    vendor: "Stripe"
    
  - id: email
    name: "Email Service"
    description: "Transactional emails"
    icon: "📧"
    vendor: "SendGrid"

relationships:
  - from: customer
    to: order-system
    type: uses
    description: "Places orders, tracks status"
    
  - from: order-system
    to: payment
    type: sends
    description: "Processes payments"
    technology: "REST/HTTPS"

steps:
  - title: "System Context"
    description: "Order Management System and its environment"
    focusNode: order-system
```

## Implementation Plan

### Phase 1: Schema (20 min)
- [ ] Create `c4-context.ts` schema
- [ ] Define person, system, external-system types
- [ ] Add relationship types

### Phase 2: Components (1 hour)
- [ ] `PersonNode`: User/actor with icon
- [ ] `SystemNode`: Central system (larger, branded)
- [ ] `ExternalSystemNode`: Grey external dependency
- [ ] `C4Edge`: Labeled relationship arrow

### Phase 3: Examples (30 min)
- [ ] `ecommerce-context.yaml`: E-commerce system context
- [ ] `saas-platform.yaml`: SaaS platform with integrations

### Phase 4: Export (15 min)
- [ ] Add to GIF pipeline

---

**Priority:** P0
**Estimated time:** 2 hours
**Start:** Now
