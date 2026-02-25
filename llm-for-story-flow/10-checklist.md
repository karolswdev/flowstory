# 10 — Pre-Flight Checklist & Common Mistakes

Run this checklist before delivering any service-flow story. Every item is a real mistake that has happened.

---

## Structure Checklist

- [ ] Every service has a unique `id` and descriptive `name`
- [ ] Every service `type` is one of the 28 valid types
- [ ] Every call has a unique `id` and valid `from`/`to` referencing existing service/queue IDs
- [ ] Every call `type` is one of: `sync`, `async`, `publish`, `subscribe`
- [ ] Steps have unique `id` values
- [ ] First step has `focusNodes` or `camera.fitAll` (don't start with auto-focus on nothing)
- [ ] Last step resolves the camera (usually `fitAll`)
- [ ] `renderer: service-flow` and `schemaVersion: "2.0"` are present
- [ ] `activeCalls` references only defined call IDs
- [ ] `revealCalls` accumulates properly (nothing vanishes unexpectedly between steps)
- [ ] `revealNodes`, `focusNodes` reference only defined service/queue IDs

---

## Visual Polish Checklist

- [ ] Each step activates 1-3 calls maximum (4+ creates visual noise)
- [ ] Sub-states tell a coherent lifecycle (not random state jumps)
- [ ] Sub-state names use semantic keywords for auto-coloring (see keyword table)
- [ ] Zones group logically related services (security, data tier, domain)
- [ ] Zone members all belong to the same scene (if scenes used)
- [ ] Tags add genuine context (protocol, team, SLA) — not filler
- [ ] No more than 4 tags per node
- [ ] Technology field is set on services where it adds value

---

## Camera Checklist

- [ ] First step establishes the scene (`fitAll` or explicit wide focus)
- [ ] Last step resolves (`fitAll` or meaningful final focus)
- [ ] Camera movements match emotional beats (slow = dramatic, spring = action)
- [ ] Zoom levels vary between steps (not the same zoom every step)
- [ ] Duration is reasonable: 600-2500ms per step (not <400ms or >3000ms)
- [ ] No step has both `focusNodes` and `camera.fitAll` (fitAll wins, focusNodes ignored)
- [ ] Easing is varied — not spring-overshoot on every single step

---

## Effects Checklist

- [ ] Effects are used sparingly: 1-3 per story maximum
- [ ] Effect type matches the moment (emoji-fan for events, label-yeet for callouts)
- [ ] `direction` makes logical sense (from-source for outgoing, from-target for rejections)
- [ ] `gravity` makes physical sense (0 for floating, 1-2 for falling)
- [ ] Effect `count` is reasonable (5-10 typical, not 50)

---

## Narration Checklist

- [ ] Every step has EXACTLY ONE of `narrative` or `narration` (never both, never neither)
- [ ] Narrations are 2-3 sentences maximum
- [ ] Rich text highlights 1-2 key terms per narration, not every word
- [ ] Color markup matches semantic meaning (red = danger, green = success)
- [ ] Code backticks used for API paths, event names, technical terms
- [ ] Speaker narration (`narration.speaker`) used only when a persona adds value

---

## Coupling & Failure Checklist (if used)

- [ ] `coupling` is set on ALL calls in the story (not just some)
- [ ] `critical: true` forms a connected chain for cascade BFS
- [ ] `fallback` is set on `loose` coupling calls
- [ ] `simulateFailure` step has dramatic camera + sub-state changes
- [ ] Failure cascade step has corresponding sub-state changes (e.g., `payment-svc: failed`)

---

## Scene & Layout Checklist (if used)

- [ ] No node appears in multiple scenes
- [ ] Scene members reference existing service/queue IDs
- [ ] Scene directions match the intended flow (LR for horizontal chains, TB for vertical)
- [ ] Zone members don't span multiple scenes
- [ ] Unassigned nodes (not in any scene) are intentional

---

## Common Mistakes

### 1. Forgetting `revealCalls` — Edges Vanish

**Symptom:** An edge that was visible in step 2 disappears in step 3.

**Cause:** Step 3's `activeCalls` doesn't include the step 2 call, and `revealCalls` doesn't list it either.

**Fix:** Always accumulate previous calls in `revealCalls`:
```yaml
# Step 3
activeCalls: [new-call]
revealCalls: [step1-call, step2-call]   # Keep previous visible
```

### 2. Self-Loop Without Matching `from`/`to`

**Symptom:** Expected a self-loop arc but got a normal edge.

**Cause:** `from` and `to` are different IDs.

**Fix:** Make them identical:
```yaml
- id: retry
  type: async
  from: conductor
  to: conductor               # Same ID = self-loop
```

### 3. Event Processor Conveyor Not Showing

**Symptom:** The event-processor node is active but no conveyor belt appears.

**Cause:** The active calls targeting this node don't have `messageType`.

**Fix:** Ensure calls to the processor include `messageType`:
```yaml
- id: stream-to-proc
  type: subscribe
  from: stream
  to: processor
  messageType: TripCreated     # REQUIRED for conveyor
```

### 4. Camera Not Moving

**Symptom:** The camera stays in the same position between steps.

**Cause:** No `focusNodes`, no `camera` override, and `activeCalls` is empty.

**Fix:** Add explicit camera control or `focusNodes`:
```yaml
focusNodes: [target-node]
# or
camera: { fitAll: true }
```

### 5. Sub-State Not Clearing

**Symptom:** A sub-state badge persists when it shouldn't.

**Cause:** Sub-states are sticky by default.

**Fix:** Explicitly clear with `~` or `null`:
```yaml
substates:
  conductor: ~                 # Removes the badge
```

### 6. Coupling Cascade Not Propagating

**Symptom:** `simulateFailure` only marks one node, not the chain.

**Cause:** Calls in the chain are missing `critical: true`.

**Fix:** Mark every call in the cascade chain:
```yaml
calls:
  - { id: a-to-b, coupling: tight, critical: true }
  - { id: b-to-c, coupling: tight, critical: true }   # MUST have critical
```

### 7. Layout Jumping Between Steps

**Symptom:** Nodes shift position when new elements are revealed.

**Cause:** Nodes added in later steps weren't in the initial layout calculation.

**Fix:** Use scenes with all members declared upfront. The layout engine positions all declared members at once (even unrevealed ones), so positions are stable.

### 8. Edge Labels Overlapping Nodes

**Symptom:** Long method+path labels collide with target nodes.

**Cause:** `ranksep` is too small for the label length.

**Fix:** The engine auto-calculates `ranksep` from label length. If using scene-level `ranksep` override, increase it:
```yaml
scenes:
  - id: main
    direction: LR
    ranksep: 250               # Wider gap for long labels
    members: [...]
```

### 9. Too Many Effects — Visual Noise

**Symptom:** The story feels chaotic and unfocused.

**Cause:** Effects on every call, every step.

**Fix:** Strip effects down to 1-3 per story. Place them on the most dramatic moments only.

### 10. Rainbow Narration

**Symptom:** Every other word is a different color.

**Cause:** Over-using `{color:...|...}` markup.

**Fix:** 1-2 colored terms per narration. Use color only when it maps to something visible on the canvas (a service color, a coupling level).

---

## Validation Rules (Engine-Enforced)

These will cause schema validation errors:

| Rule | Error |
|------|-------|
| Node in multiple scenes | `Node X appears in multiple scenes` |
| Zone spans scenes | `Zone members must be in same scene` |
| Missing `from`/`to` reference | `Call references unknown service` |
| Invalid service type | `Invalid enum value` |
| Missing required fields | Zod validation error |
| `schemaVersion` not `"2.0"` | Schema mismatch |
| `renderer` not `"service-flow"` | Wrong renderer |
