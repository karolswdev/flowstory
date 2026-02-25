# 06 — Layout: Scenes, Directions & Zones

Layout controls the spatial arrangement of nodes on the canvas. Service-flow uses Dagre (a directed graph layout algorithm) with a powerful scene system that lets you mix horizontal and vertical flows in the same story.

---

## Default Layout

Without scenes, all nodes are laid out in a **single Dagre graph** with direction `LR` (left-to-right). The algorithm reads the call edges to determine rank ordering.

Default Dagre settings:
- `rankdir: LR` — left to right
- `nodesep: 60` — 60px gap between sibling nodes
- `ranksep: auto` — dynamically computed from longest edge label (~200px minimum)
- `marginx: 40, marginy: 40` — canvas margins

**Ranksep auto-calculation:** The engine measures the longest call label (method + path, or messageType) and sets `ranksep` to `max(200, estimatedLabelWidth + 60)`. This prevents labels from overlapping nodes.

---

## Scenes — Multi-Direction Layout Groups

### The Problem

Real architectures have layers. An ingress chain flows horizontally (client → gateway → auth), but the domain services beneath might fan out vertically. A single `LR` direction forces everything into one horizontal line.

### The Solution

Scenes partition your services into **layout groups**, each with its own Dagre direction. Then scenes are composited together via a second (macro) Dagre pass.

```yaml
scenes:
  - id: ingress
    direction: LR
    members: [client, gateway, auth]

  - id: domain
    direction: TB
    members: [orders, payments, inventory, db]
```

### Scene Fields

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `id` | string | — | REQUIRED. Unique scene ID. |
| `direction` | string | `LR` | `LR \| TB \| RL \| BT` |
| `members` | string[] | — | REQUIRED. Service/queue IDs in this scene. |
| `nodesep` | number | 60 | Pixel gap between sibling nodes. |
| `ranksep` | number | auto | Pixel gap between ranks/layers. |

### Four Directions

| Direction | Flow | Best For |
|-----------|------|----------|
| `LR` | Left → Right | Request flows, horizontal chains, pipelines |
| `TB` | Top → Bottom | Layered architectures, dependency trees, domain models |
| `RL` | Right → Left | Response paths, reverse flows |
| `BT` | Bottom → Top | Promotion pipelines, bottom-up reveals |

### How Multi-Scene Layout Works

1. **Partition:** Each scene runs its own Dagre layout independently, using its own direction and spacing.
2. **Macro Dagre:** Scenes become meta-nodes in a second Dagre pass (`rankdir: TB`, `nodesep: 80`, `ranksep: 80`) that positions scenes relative to each other.
3. **Merge:** Each scene's local coordinates are offset by its macro position to produce final canvas coordinates.
4. **Default scene:** Nodes not assigned to any scene go into a `__default__` scene with direction `LR`.

### Scene Rules

| Rule | Consequence |
|------|-------------|
| Every node can belong to **at most one scene** | Putting a node in two scenes is a validation error |
| Scene members must reference existing services/queues | Typos in member IDs cause validation errors |
| Zone members cannot span multiple scenes | A zone boundary can only contain nodes from a single scene |
| Cross-scene edges work normally | Calls between scenes render as edges across the macro layout |
| All declared members are laid out | Even unrevealed nodes get positions — progressive reveal doesn't shift layout |

That last rule is critical: **layout is stable across steps.** When you reveal a node in step 5, it appears at the position it was always going to have. Nothing jumps.

---

## Scene Patterns

### The Layered Architecture

Ingress flows horizontally; domain services fan out vertically.

```yaml
scenes:
  - id: ingress
    direction: LR
    members: [client, gateway, auth]
  - id: domain
    direction: TB
    members: [order-agg, payment-svc, inventory-svc, db]
```

**Result:** Horizontal chain across the top, vertical fan-out beneath.

### The Hub and Spokes

Central event backbone with producers on one side and consumers on the other.

```yaml
scenes:
  - id: producers
    direction: TB
    members: [api-a, api-b, api-c]
  - id: hub
    direction: LR
    members: [event-stream]
  - id: consumers
    direction: TB
    members: [worker-x, worker-y, analytics]
```

**Result:** Producers stacked vertically → central pipe → consumers stacked vertically.

### Tight Spacing for Dense Models

DDD models with many small nodes benefit from tighter spacing.

```yaml
scenes:
  - id: ddd-model
    direction: TB
    nodesep: 30                  # Tighter than default 60
    ranksep: 120                 # Tighter than default 200
    members: [aggregate, entity-a, entity-b, vo-1, vo-2, repo]
```

### The Request-Response Split

Request path flows left-to-right; response/event path flows right-to-left.

```yaml
scenes:
  - id: request
    direction: LR
    members: [client, gateway, api, db]
  - id: events
    direction: RL
    members: [event-bus, notifier, logger]
```

---

## Zones — Visual Boundaries

Zones draw **translucent boundary boxes** behind groups of services. They're purely visual — they don't affect layout. They add context by grouping related services.

```yaml
zones:
  - id: security
    label: "Security Boundary"
    members: [waf, lb]
    color: "rgba(244, 63, 94, 0.06)"    # Rose tint
  - id: orchestration
    label: "Orchestration Layer"
    members: [conductor, scheduler, approval]
    color: "rgba(236, 72, 153, 0.06)"    # Pink tint
  - id: data
    label: "Data Layer"
    members: [db, cache, blob]
    color: "rgba(120, 113, 108, 0.06)"   # Stone tint
```

### Zone Fields

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `id` | string | — | REQUIRED. Unique zone ID. |
| `label` | string | — | REQUIRED. Label text (shown at top of boundary). |
| `members` | string[] | — | REQUIRED. Service/queue IDs inside the zone. |
| `color` | string | auto-cycle | CSS color string (rgba recommended for translucency). |

### Auto-Cycle Colors

When `color` is omitted, zones cycle through this palette:

| Index | Color | Tint |
|-------|-------|------|
| 0 | `rgba(59, 130, 246, 0.06)` | Blue |
| 1 | `rgba(168, 85, 247, 0.06)` | Purple |
| 2 | `rgba(34, 197, 94, 0.06)` | Green |
| 3 | `rgba(249, 115, 22, 0.06)` | Orange |
| 4 | `rgba(236, 72, 153, 0.06)` | Pink |
| 5 | `rgba(6, 182, 212, 0.06)` | Cyan |

### Zone Layout Constants

- `ZONE_PADDING = 60` — px padding inside zone boundary
- `ZONE_LABEL_HEIGHT = 32` — px height for zone label bar
- `MIN_ZONE_MEMBER_GAP = 30` — minimum gap between zone members

### Zone Patterns

| Pattern | Members | Purpose |
|---------|---------|---------|
| Security boundary | WAF + LB + auth | Show the DMZ vs trusted network |
| Domain boundaries | Services in a BC | Match bounded contexts |
| Infrastructure tiers | DB + cache + storage | Group by data, compute, messaging |
| Blast radius | Tightly-coupled chain | Show what's affected by failure |

---

## Scenes + Zones Together

Zones and scenes are complementary:
- **Scenes** control **layout direction** (how nodes are arranged)
- **Zones** add **visual boundaries** (translucent boxes behind nodes)

**Critical rule:** All members of a zone must belong to the same scene.

```yaml
scenes:
  - id: ingress
    direction: LR
    members: [waf, lb, gateway]
  - id: domain
    direction: TB
    members: [orders, payments, inventory, db]

zones:
  - id: dmz
    label: "DMZ"
    members: [waf, lb]            # Both in 'ingress' scene ✓
  - id: data
    label: "Data Layer"
    members: [db]                 # In 'domain' scene ✓
```

**Invalid example:** `members: [waf, orders]` would fail because `waf` is in scene `ingress` and `orders` is in scene `domain`.

---

## Layout Tips

1. **Use scenes when your architecture has distinct tiers.** Ingress (LR) + domain (TB) is the most common pattern.
2. **Don't over-partition.** 2-3 scenes is typical. 5+ scenes suggests the story might be better as a composite.
3. **Adjust `nodesep` and `ranksep` for density.** DDD models with many small nodes need tighter spacing. Infrastructure with wide nodes needs more room.
4. **Zones add meaning, not structure.** Use them to highlight boundaries that matter to the narrative (security, blast radius, team ownership).
5. **Let Dagre handle positions.** Never manually position nodes. The layout algorithm reads your edges and produces optimal placement.
