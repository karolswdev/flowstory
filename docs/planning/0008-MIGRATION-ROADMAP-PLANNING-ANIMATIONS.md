# 0008: Migration Roadmap

## Concept

Visualize phased migration from legacy to modern architecture - the strangler fig pattern, parallel running, and cutover timeline.

**Target audience:** Architects, Project Managers, Stakeholders

## Use Cases

1. **Migration Planning**: "What's our path from legacy to modern?"
2. **Progress Tracking**: "Where are we in the migration?"
3. **Risk Communication**: "What are the critical dependencies?"
4. **Stakeholder Updates**: "Show me the timeline"

## Visual Design

```
PHASE 1 (Q1)      PHASE 2 (Q2)      PHASE 3 (Q3)      PHASE 4 (Q4)
┌────────────┐    ┌────────────┐    ┌────────────┐    ┌────────────┐
│ Strangler  │    │ Parallel   │    │ Traffic    │    │ Cutover    │
│ Proxy      │───▶│ Running    │───▶│ Migration  │───▶│ Complete   │
│ 🟢 Done    │    │ 🟡 Active  │    │ ⚪ Planned │    │ ⚪ Planned │
└────────────┘    └────────────┘    └────────────┘    └────────────┘
      │                 │
      ▼                 ▼
┌────────────┐    ┌────────────┐
│ Auth Svc   │    │ Order Svc  │
│ Migration  │    │ Migration  │
│ 🟢 Done    │    │ 🟡 Active  │
└────────────┘    └────────────┘
```

## Phase/Task States

| State | Icon | Color | Description |
|-------|------|-------|-------------|
| `planned` | ⚪ | Grey | Not started |
| `active` | 🟡 | Yellow | In progress |
| `done` | 🟢 | Green | Complete |
| `blocked` | 🔴 | Red | Blocked |
| `at-risk` | 🟠 | Orange | At risk |

## Schema

```yaml
type: migration-roadmap

phases:
  - id: phase-1
    name: "Foundation"
    quarter: "Q1 2026"
    status: done
    
workstreams:
  - id: auth
    name: "Authentication"
    phase: phase-1
    tasks:
      - id: auth-proxy
        name: "Add auth proxy"
        status: done
```

## Implementation (minimal for time)

- Schema with phases, workstreams, tasks
- PhaseNode, TaskNode components
- Example: Legacy to microservices migration

---

**Priority:** P0
**Estimated time:** 1 hour
