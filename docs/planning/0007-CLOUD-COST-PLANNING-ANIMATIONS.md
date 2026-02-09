# 0007: Cloud Cost Map

## Concept

Visualize cloud spending by service, resource type, and team - a treemap/sunburst showing where the money goes.

**Target audience:** CTOs, FinOps, Engineering managers

## Use Cases

1. **Budget Review**: "Where is our cloud spend going?"
2. **Cost Optimization**: "What's driving costs?"
3. **Team Allocation**: "Which team costs the most?"
4. **Trend Analysis**: "How has spending changed?"
5. **Anomaly Detection**: "Why did costs spike?"

## Visual Design

```
┌─────────────────────────────────────────────────────────────┐
│                     Total: $125,000/mo                      │
├──────────────────────────┬──────────────────────────────────┤
│      Compute             │        Storage                   │
│      $65,000             │        $35,000                   │
│  ┌──────────┬──────────┐ │  ┌──────────────────────────┐   │
│  │ K8s      │ VMs      │ │  │     S3/Blob              │   │
│  │ $45,000  │ $20,000  │ │  │     $25,000              │   │
│  └──────────┴──────────┘ │  ├──────────────────────────┤   │
│                          │  │  RDS/SQL  │  Cosmos      │   │
│                          │  │  $7,000   │  $3,000      │   │
├──────────────────────────┴──┴───────────┴──────────────┴───┤
│  Network: $15,000        │  Other: $10,000                  │
└──────────────────────────┴──────────────────────────────────┘
```

## Node Types

| Type | Visual | Description |
|------|--------|-------------|
| `category` | Large block | Spend category (Compute, Storage) |
| `resource` | Sized block | Individual resource |
| `team` | Grouped blocks | Team's resources |

## Cost Indicators

| Trend | Icon | Description |
|-------|------|-------------|
| ↑ Up | Red | Cost increasing |
| ↓ Down | Green | Cost decreasing |
| → Stable | Grey | No change |

## Schema (simplified)

```yaml
type: cloud-cost

totalBudget: 150000
totalSpend: 125000
period: "2026-01"

categories:
  - id: compute
    name: "Compute"
    spend: 65000
    budget: 70000
    
resources:
  - id: k8s-prod
    name: "Production K8s"
    category: compute
    spend: 45000
    trend: up
    trendPct: 12
```

## Implementation Plan

### Phase 1: Schema (15 min)
### Phase 2: Components (45 min)
### Phase 3: Example (15 min)

---

**Priority:** P0
**Estimated time:** 1.25 hours
