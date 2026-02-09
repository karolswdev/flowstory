# 0001: Team Ownership Map

## Concept

Visualize organizational ownership of software components - who owns what, team boundaries, handoff points, and communication patterns.

**Target audience:** CTOs, Engineering Managers, new hires, auditors

## Use Cases

1. **Onboarding**: "Here's who owns what"
2. **Incident Response**: "Who do I call for this service?"
3. **Architecture Pitching**: "Here's our team structure mapped to domains"
4. **Governance**: "Show me the ownership gaps"
5. **Reorg Planning**: "What if we merged these teams?"

## Visual Design

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│    ┌─────────────┐          ┌─────────────┐                │
│    │  Team Alpha │          │  Team Beta  │                │
│    │   👥 5 eng  │          │   👥 3 eng  │                │
│    │             │          │             │                │
│    │  ┌───────┐  │   API    │  ┌───────┐  │                │
│    │  │ Svc A │──┼─────────→┼──│ Svc B │  │                │
│    │  └───────┘  │          │  └───────┘  │                │
│    │  ┌───────┐  │          │  ┌───────┐  │                │
│    │  │ Svc C │  │          │  │ Svc D │  │                │
│    │  └───────┘  │          │  └───────┘  │                │
│    └─────────────┘          └─────────────┘                │
│                                                             │
│    ┌─────────────────────────────────────┐                 │
│    │         Platform Team               │                 │
│    │   👥 4 eng    🔧 Infrastructure     │                 │
│    │                                     │                 │
│    │   ┌─────┐  ┌─────┐  ┌─────┐        │                 │
│    │   │ K8s │  │ CI  │  │ DB  │        │                 │
│    │   └─────┘  └─────┘  └─────┘        │                 │
│    └─────────────────────────────────────┘                 │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Node Types

| Type | Visual | Description |
|------|--------|-------------|
| `team` | Rounded container with color | Team boundary with member count |
| `service` | Pill inside team | Service owned by team |
| `shared` | Dashed border | Shared/contested ownership |
| `external` | Grey, outside teams | External dependency |
| `gap` | Red dashed | Unowned component (risk!) |

## Edge Types

| Type | Visual | Description |
|------|--------|-------------|
| `owns` | Containment | Team contains services |
| `calls` | Arrow | Service-to-service call |
| `depends` | Dashed arrow | Dependency (not call) |
| `handoff` | Double arrow | Cross-team handoff point |
| `escalates` | Red arrow | Escalation path |

## Animation Effects

1. **Team highlight**: Pulse entire team boundary when focused
2. **Dependency trace**: Show all services a team depends on
3. **Ownership gap**: Red flash on unowned components
4. **Handoff animation**: Animated arrow between teams
5. **Team size**: Badge with engineer count that bounces on focus

## Step Scenarios

1. "Meet Team Alpha" - highlight team, list services
2. "Their dependencies" - trace outbound calls
3. "Cross-team handoffs" - highlight interaction points
4. "The ownership gap" - show unowned/shared services
5. "Full picture" - zoom out, show all teams

## Schema Extension

```yaml
type: team-ownership

teams:
  - id: team-alpha
    name: "Team Alpha"
    color: "#4CAF50"
    lead: "Alice"
    headcount: 5
    slack: "#team-alpha"
    services:
      - order-api
      - order-worker

services:
  - id: order-api
    name: "Order API"
    team: team-alpha
    type: api
    criticality: high
    
  - id: legacy-billing
    name: "Legacy Billing"
    team: null  # GAP!
    type: monolith
    criticality: critical

handoffs:
  - from: team-alpha
    to: team-beta
    via: order-api -> payment-svc
    frequency: "~1000/day"
    
steps:
  - title: "Meet Team Alpha"
    focusTeam: team-alpha
    showServices: true
```

## Implementation Plan

### Phase 1: Schema (30 min)
- [ ] Create `team-ownership.ts` schema
- [ ] Define team, service, handoff types
- [ ] Add validation helpers

### Phase 2: Components (1 hour)
- [ ] `TeamNode`: Container with header, member badge
- [ ] `ServiceNode`: Pill inside team (or standalone for gaps)
- [ ] `HandoffEdge`: Animated cross-team arrow
- [ ] `TeamOwnershipCanvas`: Layout with team grouping

### Phase 3: Examples (30 min)
- [ ] `platform-teams.yaml`: Classic platform team structure
- [ ] `product-squads.yaml`: Spotify-style squad model
- [ ] `ownership-gaps.yaml`: Example showing risks

### Phase 4: GIF/PNG Export (15 min)
- [ ] Add to generate-demo-gifs.sh
- [ ] Capture screenshots per step
- [ ] Verify visual quality

---

**Priority:** P0
**Estimated time:** 2.5 hours
**Start:** Now
