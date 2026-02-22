# FlowStory — Service-Flow Renderer Upgrade Roadmap

> **Status:** Phase 1 — Not Started
> **Created:** 2026-02-21
> **Goal:** Transform the service-flow renderer from 4.5/10 to 9.5/10 — distinct visual shapes per actor type, dagre layout, multi-axis step control, zone grouping, and cinematic animation

---

## Why This Upgrade

The service-flow renderer powers our best stories (Trip Ops — SignalR Self-Consumption, Event Fanout, Dual CQRS). But it's the weakest ReactFlow-based renderer:

| Problem | Impact |
|---------|--------|
| One node shape for everything | Databases, event buses, gateways all look identical |
| Single step axis (`activeCalls` only) | Can't focus camera, introduce nodes, or show responses independently |
| Hand-rolled BFS layout | No edge crossing minimization, fragile vertical centering |
| No custom edge component | Hardcoded colors break dark mode, no bidirectional handling |
| No zone/group support | Can't show "Trip Ops BC" boundary around related services |
| Narration silently dropped | YAML has `narration: { speaker }` but canvas ignores it |

The state-diagram renderer (dagre, phases, dual-axis, custom edges) is the gold standard at 9/10. This roadmap brings service-flow to parity.

---

## Phase 1 — CSS Cleanup + Narration Wiring
**Size: S | Rating after: 5.5/10**

Immediate quality lift. Fix design system violations, wire narration already in YAML.

- [ ] Delete dead CSS (`.service-flow-step-info`, `.database-node` — 70+ lines)
- [ ] Fix `background: white` → `var(--color-bg-elevated)`
- [ ] Fix Material Design purple in queue glow → Tailwind `#A855F7`
- [ ] Add `narration` to step schema (one-line `.optional()` addition)
- [ ] Replace Material Design → Tailwind colors in `SERVICE_TYPE_COLORS` and `CALL_TYPE_COLORS`
- [ ] Pass `narration`, `onStepChange`, `showDots` to `<StepOverlay>`

**Files:** `service-nodes.css`, `service-flow.ts` (schema), `ServiceFlowCanvas.tsx`

---

## Phase 2 — Multi-Axis Step Control
**Size: M | Depends on: Phase 1 | Rating after: 6.5/10**

The architectural fix that unblocks the most painful authoring problems.

- [ ] Add `focusNodes[]` to step schema — camera targets independent of calls
- [ ] Add `revealNodes[]` to step schema — explicitly reveal nodes without a call
- [ ] Add `revealCalls[]` to step schema — reveal edges in completed state
- [ ] Replace 3-set step computation with 6-set (modeled on state-diagram)
- [ ] Camera uses `focusNodeIds` when non-empty, falls back to call participants

**Files:** `service-flow.ts` (schema), `ServiceFlowCanvas.tsx`

**YAML after:**
```yaml
- title: "The Hub — Trip Operations"
  revealNodes: [trip-ops, outbox]   # Introduce without activating calls
  focusNodes: [trip-ops]             # Camera targets
  activeCalls: []                    # Nothing glowing yet
  narration:
    speaker: Architect
    message: "This is the event hub for all trip lifecycle events."
```

---

## Phase 3 — Dagre Layout
**Size: M | Depends on: Phase 2 | Rating after: 7.0/10**

Replace hand-rolled BFS with dagre for proper graph layout.

- [ ] Import `@dagrejs/dagre` (already a project dependency)
- [ ] Replace `computeNodeDepths` + `buildSequenceLayout` with `buildDagreLayout`
- [ ] `rankdir: 'LR'`, `nodesep: 80`, `ranksep: 140`, type-aware node dimensions
- [ ] Port `detectBidirectional()` from state-diagram
- [ ] Exclude self-loops from dagre graph
- [ ] Remove dead `LAYOUTS` constants (`topology`/`trace` never implemented)

**Files:** `ServiceFlowCanvas.tsx`, `service-flow.ts` (layout constants)

**Result:** Same YAML, better layout. Edge crossings minimized, proper rank assignment.

---

## Phase 4 — Distinct Visual Node Types
**Size: L | Depends on: Phase 3 | Rating after: 8.0/10**

Each actor type gets a distinct visual shape. The #1 user request.

| Service Type | Shape | New Component |
|-------------|-------|---------------|
| `api` | Rectangle (existing) | `ServiceNode.tsx` |
| `database` | Cylinder (CSS pseudo-ellipses) | `DatabaseNode.tsx` |
| `event-bus` | Hexagon (clip-path) | `EventBusNode.tsx` |
| `gateway` | Diamond (rotated square) | `GatewayNode.tsx` |
| `external` | Cloud shape | `ExternalNode.tsx` |
| `worker` / `event-processor` | Rounded rect + gear | `WorkerNode.tsx` |
| `workflow` | Pill/stadium | `WorkflowNode.tsx` |
| `cache` | Rounded square + bolt | `CacheNode.tsx` |

- [ ] Create 7 new node components in `src/components/service/`
- [ ] Expand `SERVICE_TYPES` with `'event-bus'`, `'workflow'`, `'event-processor'`
- [ ] Expand `nodeTypes` registry in canvas, map service type → component
- [ ] Add per-type dimensions in `dimensions.ts` for smart edge routing
- [ ] CSS for each shape with three-tier states (active/complete/dimmed)
- [ ] Update barrel exports

**Files:** 7 new `*.tsx`, `service-flow.ts`, `ServiceFlowCanvas.tsx`, `dimensions.ts`, `service-nodes.css`, `index.ts`

---

## Phase 5 — Custom Edge Component
**Size: M | Depends on: Phase 3 | Rating after: 8.5/10**

Fix dark mode, semantic labels, bidirectional handling, self-loops.

- [ ] Create `ServiceCallEdge.tsx` (modeled on `TransitionEdge.tsx`)
- [ ] Semantic label parts: method (bold) + path (secondary) + duration (tertiary)
- [ ] Three-tier CSS: `.call-edge-active` / `.call-edge-complete` / `.call-edge-dimmed`
- [ ] Bidirectional curvature offset (+0.35 / -0.35)
- [ ] Self-loop bezier arc
- [ ] All colors via design tokens — eliminate hardcoded `#333` and `#fff`
- [ ] Register `edgeTypes` in canvas, pass data instead of inline styles

**Files:** New `ServiceCallEdge.tsx`, `ServiceFlowCanvas.tsx`, `service-nodes.css`

---

## Phase 6 — Zone/Group Support
**Size: M | Depends on: Phase 3 | Rating after: 9.0/10**

Visual grouping for bounded contexts, sync/async paths, teams.

- [ ] Create `ZoneNode.tsx` (modeled on `StatePhaseNode`)
- [ ] Add `ZoneDefSchema` (id, label, members[], color?) to schema
- [ ] Add `zones[]` to story schema
- [ ] Compute zone bounding boxes post-dagre from member positions
- [ ] Zone color palette (6 semi-transparent Tailwind colors)

**Files:** New `ZoneNode.tsx`, `service-flow.ts`, `ServiceFlowCanvas.tsx`

**YAML after:**
```yaml
zones:
  - id: trip-ops-bc
    label: "Trip Operations BC"
    members: [trip-ops-api, trip-ops-db, outbox, trip-ops-ep]
  - id: async-path
    label: "Async Path — 150-250ms"
    members: [outbox, asb-topic, trip-ops-ep]
```

---

## Phase 7 — Entry Effects
**Size: S | Depends on: Phase 2 | Rating after: 9.2/10**

Newly-revealed nodes spring in with a bounce; previously-revealed nodes stay still.

- [ ] Track `isNew` per node (revealed this step vs previously)
- [ ] `isNew` nodes: dramatic entry (scale 0.6→1, spring overshoot)
- [ ] Existing nodes: no re-animation
- [ ] `isNew` edges: stroke draw-in animation (dashoffset)

**Files:** `ServiceFlowCanvas.tsx`, all node components, `ServiceCallEdge.tsx`

---

## Phase 8 — Response Edges + Payload Display
**Size: S | Depends on: Phase 5 | Rating after: 9.5/10**

Show HTTP responses flowing back. Eliminate the "re-activate forward call" hack.

- [ ] Add `response: { status, label? }` to `SyncCallSchema`
- [ ] Generate reverse edge with `isResponse: true` for calls with `response`
- [ ] Response edges: dotted stroke, lighter color, reversed arrowhead

**Files:** `service-flow.ts`, `ServiceFlowCanvas.tsx`, `ServiceCallEdge.tsx`

**YAML after:**
```yaml
calls:
  - id: gps-ingest
    type: sync
    from: driver-app
    to: trip-ops-api
    method: POST
    path: /v1/gps/location
    duration: 35
    response:
      status: 200
      label: "200 OK — 35ms"
```

---

## Dependency Graph

```
Phase 1 (CSS + Narration)        ← Start here
  │
  v
Phase 2 (Multi-Axis Steps)
  │
  v
Phase 3 (Dagre Layout)
  │
  ├──────┬──────┬──────┐
  v      v      v      v
Phase 4  Phase 5  Phase 6  Phase 7
(Shapes) (Edges) (Zones)  (Effects)
                │
                v
              Phase 8
           (Responses)
```

Phases 4, 5, 6, 7 are independent after Phase 3. Can be worked in any order.

---

## Score Progression

| Phase | Cumulative | Key Win |
|-------|:---:|---------|
| Current | 4.5 | — |
| Phase 1 | 5.5 | Speaker narration works, clean CSS |
| Phase 2 | 6.5 | Independent camera control, no more hacks |
| Phase 3 | 7.0 | Proper graph layout, bidirectional edges |
| Phase 4 | 8.0 | Hexagons, cylinders, diamonds — visual identity |
| Phase 5 | 8.5 | Dark mode works, semantic edge labels |
| Phase 6 | 9.0 | BC boundaries visible, path grouping |
| Phase 7 | 9.2 | Cinematic entrance animations |
| Phase 8 | 9.5 | Response arrows, truthful visualizations |

---

## Previous Roadmap (Completed)

The MVP Visual Polish Roadmap (token unification, StepOverlay extraction, dark mode sweep, thin renderer cleanup) was completed 2026-02-21. All phases delivered. This new roadmap builds on that foundation.
