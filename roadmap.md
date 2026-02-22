# FlowStory MVP Visual Polish Roadmap

> **Status:** ALL PHASES COMPLETE (2026-02-21)
> **Created:** 2026-02-21
> **Goal:** Transform FlowStory from "impressive prototype" to "polished MVP" suitable for external CTO demos

---

## Current State Summary

| Area | Score | MVP Blocker? |
|------|-------|-------------|
| ReactFlow renderers (6) | 8/10 | No |
| SVG renderers (8) | 4/10 | Yes — 3 are too thin |
| Design token consistency | 3/10 | **Yes** |
| Dark mode | 5/10 | Yes |
| Step overlay consistency | 4/10 | Yes |
| Typography system | 5/10 | Borderline |
| Animation/camera | 8/10 | No |
| Node visual polish | 6.5/10 | Borderline |
| Story library | 8/10 | No |
| Export system | 8/10 | No |

**What's strong:** Camera system, animation variants, layout algorithms (Dagre/BFS/radial), export pipeline, story library (32 YAMLs), presentation mode.

**What's weak:** Three competing token systems, inconsistent step overlays, 75% dark mode coverage, fragmented typography, nearly-invisible shadows, 3 skeletal SVG renderers, debug `console.log` in render paths.

---

## Phase 1 — Unify Design Tokens (Biggest Bang for Buck)

**Problem:** Three CSS token files (`design-tokens.css`, `tokens.css`, `global.css`) + one JS token file (`themes/tokens.ts`) define overlapping variables with incompatible naming and conflicting values. Two brand palettes (Material Design vs Tailwind) coexist. Components randomly consume from different sources.

### Tasks

- [ ] **1.1** Choose ONE canonical token file and naming convention
  - Recommendation: keep `tokens.css` naming (`--fs-*`, `--fw-*`, `--color-*`) — it has the broadest adoption
  - Merge the best values from all three files into one
- [ ] **1.2** Choose ONE color palette
  - Material Design (`#2196F3`, `#4CAF50`, `#F44336`) vs Tailwind (`#3B82F6`, `#22C55E`, `#EF4444`)
  - Pick one. Kill the other. Update `themes/tokens.ts` to match
- [ ] **1.3** Make shadows visible
  - Current `--shadow-md: 0 2px 4px rgba(0,0,0,0.06)` is barely perceptible
  - Increase to something like `0 4px 12px rgba(0,0,0,0.12), 0 2px 4px rgba(0,0,0,0.08)`
- [ ] **1.4** Migrate all consumers to the canonical token file
  - Audit every CSS file for hardcoded colors, font sizes, shadows, radii
  - Replace with token variables
  - Delete the redundant token files
- [ ] **1.5** Align `themes/tokens.ts` JS tokens with CSS tokens
  - The ThemeContext applies ~25 CSS variables via JS — these must match the canonical CSS file
- [ ] **1.6** Delete `App.css` Vite scaffold trash
  - Hardcoded `#646cff` purple, `#242424` dark bg, `.logo` animation — all irrelevant

### Success Criteria
- Single token file imported globally
- `grep` for hardcoded hex colors in CSS returns zero results (outside token definitions)
- Light and dark theme both resolve every variable correctly

---

## Phase 2 — Standardize Step Info Overlay

**Problem:** The step info overlay (step badge + title + narrative) is implemented differently in every renderer — different position, different padding, different blur, different badge style. This is the most visually jarring inconsistency.

### Tasks

- [ ] **2.1** Extract a shared `<StepOverlay>` component
  - Use BC Deployment's centered glass-blur design as the template (it's the best one)
  - Props: `stepIndex`, `stepTitle`, `narrative`, `speaker?`, `position?`
  - Default: bottom-center, `backdrop-filter: blur(8px)`, xl radius, xl padding
- [ ] **2.2** Standardize the step badge
  - One design: translucent primary-color pill with step number
  - Kill the 5 different badge implementations
- [ ] **2.3** Migrate all ReactFlow renderers to `<StepOverlay>`
  - `ServiceFlowCanvas`, `HttpFlowCanvas`, `PipelineCanvas`, `BCDeploymentCanvas`, `BCCompositionCanvas`, `StateDiagramCanvas`
- [ ] **2.4** Migrate all SVG renderers to `<StepOverlay>`
  - They already share `base-canvas.css` patterns — unify into the component
- [ ] **2.5** Delete per-renderer step overlay CSS
  - Remove `.step-info`, `.sf-step-info`, `.pipeline-step-info`, etc.

### Success Criteria
- Every renderer uses the same `<StepOverlay>` component
- Clicking through all renderers shows a consistent overlay experience

---

## Phase 3 — Dark Mode Sweep

**Problem:** ~75% coverage. The remaining 25% contains visible light-mode artifacts: hardcoded backgrounds in StoryPanel, invisible markers in state-diagram, Vite scaffold colors.

### Tasks

- [ ] **3.1** Fix `StoryPanel.css`
  - Hardcoded `#E3F2FD`/`#1565C0` on `.story-context`
  - Hardcoded `#E8F5E9`/`#2E7D32` on `.story-end`
  - Add `[data-theme="dark"]` overrides using tokens
- [ ] **3.2** Fix `state-diagram.css`
  - `.initial-marker`, `.terminal-inner`, `.choice-diamond` use hardcoded `#333`
  - These become invisible on dark backgrounds — replace with token variables
- [ ] **3.3** Fix `narrative-card.css`
  - Currently permanently dark (`rgba(17, 24, 39, 0.97)`) — may be intentional
  - Verify it reads well in both themes or add light-mode variant
- [ ] **3.4** Audit all remaining CSS files for hardcoded colors
  - Specifically: `white`, `#fff`, `#333`, `#666`, `#000`, any `rgb()`/`rgba()` with hardcoded values
  - Replace with token variables
- [ ] **3.5** Test dark mode end-to-end
  - Click through every renderer in dark mode
  - Screenshot any visual artifacts

### Success Criteria
- Zero hardcoded color values in CSS (outside token definitions)
- Every renderer looks intentional in both light and dark mode

---

## Phase 4 — Cut or Polish Thin Renderers

**Problem:** Three SVG renderers are skeletal implementations that hurt credibility:
- `dependency-graph`: 136 lines, hardcoded circular layout, nodes truncated to 8 chars
- `migration-roadmap`: 97 lines, flex divs pretending to be a timeline
- `team-ownership`: 99 lines, similarly thin

### Decision Required

- [ ] **4.1** Choose: polish or remove for MVP
  - **Option A (Recommended):** Remove from the STORIES catalog for MVP. Keep the code but don't showcase it. Re-add when polished.
  - **Option B:** Polish each to ~300+ lines with proper layout, animation, and dark mode
- [ ] **4.2** If polishing:
  - `dependency-graph` — replace circular hack with force-directed or dagre layout, proper node rendering, edge labels
  - `migration-roadmap` — actual timeline visualization with swimlanes, not a Kanban grid
  - `team-ownership` — proper Sankey or chord diagram for service-to-team mapping
- [ ] **4.3** Audit remaining SVG renderers for minimum quality bar
  - `cloud-cost` (182 lines) — borderline, may need a polish pass
  - `adr-timeline` (296 lines) — adequate

### Success Criteria
- Every renderer in the STORIES catalog meets a minimum quality bar
- No renderer makes the tool look unfinished

---

## Phase 5 — Polish Pass

**Problem:** Accumulated small issues that individually are minor but collectively make the tool feel unfinished.

### Tasks

- [ ] **5.1** Remove all `console.log` from render paths
  - `BCDeploymentCanvas.tsx` lines 54, 60 (fires every render!)
  - `ServiceFlowCanvas.tsx` node click handler
  - `PipelineCanvas.tsx` node click handler
- [ ] **5.2** Add `backdrop-filter: blur(8px)` to all overlays
  - Step overlay (handled in Phase 2), toolbar, keyboard help modal
- [ ] **5.3** Fix `transition: all` performance issues
  - `service-nodes.css`, `bc-composition.css` — replace with explicit property lists
  - e.g., `transition: background-color 200ms ease, box-shadow 200ms ease, transform 200ms ease`
- [ ] **5.4** Standardize letter-spacing
  - Define `--tracking-tight`, `--tracking-normal`, `--tracking-wide` tokens
  - Apply consistently to uppercase labels and headings
- [ ] **5.5** Improve node depth/premium feel
  - Consider subtle gradient backgrounds on key node types
  - Increase shadow elevation on hover (currently barely visible)
  - Add micro-interaction: slight scale on hover (`transform: scale(1.02)`) where missing
- [ ] **5.6** Wire effects system to at least 2-3 specialized renderers
  - The 3,000-line effects infrastructure is impressive but currently unused by specialized renderers
  - At minimum, wire `pulse` and `glow` effects to service-flow and bc-deployment
- [ ] **5.7** Fix `actor-label` dark mode
  - Hardcoded `background: white` — breaks completely in dark mode
- [ ] **5.8** Add `focus-visible` to all interactive elements
  - Narrative card buttons, section toggles, playback controls
- [ ] **5.9** Clean up `App.tsx` story catalog
  - 31 entries in a flat dropdown is unwieldy
  - Consider grouped/categorized picker or searchable dropdown

### Success Criteria
- Zero `console.log` in production paths
- Consistent hover/focus states across all interactive elements
- Node depth feels premium, not flat

---

## Phase Order & Dependencies

```
Phase 1 (Tokens)     ──────►  Phase 3 (Dark Mode)  ──────►  Phase 5 (Polish)
                                                                    ▲
Phase 2 (Step Overlay) ─────────────────────────────────────────────┘

Phase 4 (Thin Renderers) ──────────────────────────────────────────►┘
```

- **Phase 1 must come first** — token unification is the foundation for everything else
- **Phase 2 can run in parallel with Phase 1** — it's a component extraction, not a token migration
- **Phase 3 depends on Phase 1** — dark mode fixes need canonical tokens to reference
- **Phase 4 is independent** — can happen anytime
- **Phase 5 depends on Phases 1-3** — polish pass assumes tokens and dark mode are settled

---

## Effort Estimates

| Phase | Complexity | Files Touched |
|-------|-----------|---------------|
| Phase 1 — Tokens | High | ~30 CSS files + 2 TS files |
| Phase 2 — Step Overlay | Medium | ~10 canvas components + 1 new shared component |
| Phase 3 — Dark Mode | Medium | ~15 CSS files |
| Phase 4 — Thin Renderers | Medium-High (if polishing) / Low (if cutting) | 3-6 renderer folders |
| Phase 5 — Polish | Medium | ~20 files, many small changes |

---

## Definition of MVP-Ready

- [x] Single, consistent design token system — `src/styles/tokens.css` is the ONE file
- [x] Unified step overlay across all renderers — `<StepOverlay>` from `src/components/shared/`
- [x] Dark mode works flawlessly in all showcased renderers — 60+ hardcoded colors fixed
- [x] Every renderer in the catalog meets minimum quality bar — 3 thin renderers hidden
- [x] Zero debug artifacts in production paths — all console.log removed
- [x] A CTO can click through 5+ renderers without noticing visual inconsistencies
