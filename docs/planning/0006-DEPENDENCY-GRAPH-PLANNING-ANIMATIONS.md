# 0006: Dependency Graph

## Concept

Visualize service dependencies as a directed graph, showing health status, criticality, and cascading failure risks.

**Target audience:** SREs, DevOps, Architects, Incident responders

## Use Cases

1. **Incident Response**: "What depends on this failing service?"
2. **Impact Analysis**: "What breaks if we take this down?"
3. **Architecture Health**: "Are there circular dependencies?"
4. **Capacity Planning**: "What's on the critical path?"
5. **Change Management**: "What's the blast radius?"

## Visual Design

```
     ┌─────────┐
     │ API GW  │ ◄── Entry Point
     │ 🟢 99.9%│
     └────┬────┘
          │
    ┌─────┴─────┐
    ▼           ▼
┌───────┐   ┌───────┐
│Order  │   │User   │
│Service│──▶│Service│
│🟢 99.5%│   │🟡 98.2%│
└───┬───┘   └───────┘
    │
    ▼
┌───────┐   ┌───────┐
│Payment│──▶│Redis  │
│Service│   │Cache  │
│🔴 94.1%│   │🟢 99.9%│
└───────┘   └───────┘
```

## Node Types

| Type | Visual | Description |
|------|--------|-------------|
| `service` | Rectangle with health | Microservice |
| `database` | Cylinder | Data store |
| `cache` | Diamond | Cache layer |
| `queue` | Parallelogram | Message queue |
| `external` | Cloud shape | External API |

## Health Status

| Status | Color | Threshold |
|--------|-------|-----------|
| 🟢 Healthy | Green | ≥99.5% |
| 🟡 Degraded | Yellow | 98-99.5% |
| 🔴 Critical | Red | <98% |
| ⚫ Unknown | Grey | No data |

## Animation Effects

1. **Cascade highlight**: Show downstream impact
2. **Health pulse**: Nodes pulse based on status
3. **Traffic flow**: Particles along edges
4. **Failure ripple**: Red wave from failing node

## Schema

```yaml
type: dependency-graph

services:
  - id: api-gateway
    name: "API Gateway"
    type: service
    health: 99.9
    latency: 45
    
dependencies:
  - from: api-gateway
    to: order-service
    type: sync
    criticality: high
    
steps:
  - title: "Service Dependencies"
    focusNode: api-gateway
    showDownstream: true
```

## Implementation Plan

### Phase 1: Schema (20 min)
- [ ] Create `dependency-graph.ts`
- [ ] Node types, health status, dependency types

### Phase 2: Components (1 hour)
- [ ] `ServiceNode`: Rectangle with health indicator
- [ ] `DatabaseNode`: Cylinder shape
- [ ] `DependencyEdge`: Criticality-colored arrows

### Phase 3: Examples (20 min)
- [ ] `microservices.yaml`: Typical microservice graph

---

**Priority:** P0
**Estimated time:** 1.5 hours
