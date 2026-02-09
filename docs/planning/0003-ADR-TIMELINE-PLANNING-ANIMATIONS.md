# 0003: ADR Timeline

## Concept

Visualize Architecture Decision Records (ADRs) as an interactive timeline, showing the evolution of architectural decisions, their status, and relationships.

**Target audience:** Architects, Tech Leads, Governance boards

## Use Cases

1. **Architecture Review**: "Show me our decision history"
2. **Onboarding**: "Why did we choose this technology?"
3. **Governance**: "Which decisions are pending?"
4. **Impact Analysis**: "What decisions affect this area?"
5. **Audit Trail**: "Document our architectural evolution"

## Visual Design

```
                          TIMELINE
    ─────────────────────────────────────────────────────►
    
    Jan 2024          Apr 2024          Jul 2024          Oct 2024
       │                 │                 │                 │
       │   ┌─────────┐   │   ┌─────────┐   │   ┌─────────┐   │
       └───┤ ADR-001 ├───┼───┤ ADR-003 ├───┼───┤ ADR-005 ├───┘
           │ Decided │   │   │ Decided │   │   │ Pending │
           │ ✓ API   │   │   │ ✓ Auth  │   │   │ ? Cache │
           └────┬────┘   │   └────┬────┘   │   └─────────┘
                │        │        │        │
           ┌────┴────┐   │   ┌────┴────┐   │
           │ ADR-002 │   │   │ ADR-004 │   │
           │ Superseded  │   │ Decided │   │
           │ ✗ REST  │   │   │ ✓ Queue │   │
           └─────────┘   │   └─────────┘   │
                         │                 │
                    ┌────┴────┐       ┌────┴────┐
                    │ ADR-006 │       │ ADR-007 │
                    │ Rejected│       │ Draft   │
                    │ ✗ Mono  │       │ ◯ DB    │
                    └─────────┘       └─────────┘

    Legend:
    ✓ Decided    ✗ Rejected/Superseded    ? Pending    ◯ Draft
```

## Node Types

| Type | Visual | Description |
|------|--------|-------------|
| `adr` | Card with status badge | Individual ADR |
| `milestone` | Diamond on timeline | Key date marker |
| `category` | Swimlane | Domain/category grouping |

## ADR Statuses

| Status | Color | Icon | Description |
|--------|-------|------|-------------|
| `draft` | Grey | ◯ | Being written |
| `proposed` | Blue | ○ | Under review |
| `decided` | Green | ✓ | Accepted and active |
| `deprecated` | Orange | ⚠ | Valid but outdated |
| `superseded` | Red strikethrough | ✗ | Replaced by another |
| `rejected` | Red | ✗ | Not accepted |

## Animation Effects

1. **Timeline scroll**: Smooth pan along timeline
2. **ADR expand**: Click to show details, context, consequences
3. **Relationship trace**: Show ADRs that reference each other
4. **Status transition**: Animate status changes
5. **Category filter**: Fade non-matching ADRs

## Schema

```yaml
type: adr-timeline

categories:
  - id: architecture
    name: "Architecture"
    color: "#2196F3"
  - id: data
    name: "Data"
    color: "#4CAF50"

adrs:
  - id: adr-001
    number: 1
    title: "Use REST for external APIs"
    status: decided
    date: "2024-01-15"
    category: architecture
    context: "Need standardized API approach"
    decision: "Use REST with OpenAPI specs"
    consequences:
      - "All external APIs follow REST conventions"
      - "OpenAPI specs required for each service"
    supersedes: null
    supersededBy: null
    relatedTo: [adr-003]

steps:
  - title: "Architecture Decisions"
    description: "Our ADR timeline"
    focusDate: null
    
  - title: "Q1 2024 Decisions"
    description: "Foundation decisions"
    focusDate: "2024-01"
    highlightADRs: [adr-001, adr-002]
```

## Implementation Plan

### Phase 1: Schema (20 min)
- [ ] Create `adr-timeline.ts` schema
- [ ] Define ADR, status, category types
- [ ] Add relationship tracking

### Phase 2: Components (1 hour)
- [ ] `ADRNode`: Card with status badge, expand/collapse
- [ ] `TimelineAxis`: Horizontal timeline with date markers
- [ ] `CategoryLane`: Swimlane for grouping

### Phase 3: Examples (30 min)
- [ ] `api-decisions.yaml`: API strategy evolution
- [ ] `data-architecture.yaml`: Data platform decisions

### Phase 4: Export (15 min)
- [ ] Add to GIF pipeline

---

**Priority:** P0
**Estimated time:** 2 hours
**Start:** Now
