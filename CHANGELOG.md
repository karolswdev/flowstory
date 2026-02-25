# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed

- **Service-Flow Visual Refresh** — Enterprise-polished node design replacing generic Bootstrap-era styling
  - Replaced emoji icons with Lucide SVG icons in colored 28×28 badge containers (white icon on type-color bg)
  - Replaced left accent bars with top-edge color coding (2.5px `border-top`)
  - Replaced plain type text with type pill badges (9px uppercase, 12% type-color background)
  - Replaced glow-pulse animations with solid 2px ring focus (static, crisp, no animation)
  - Lighter default shadows, removed divider line, tighter vertical layout (~15% shorter nodes)
  - Updated all 9 shape nodes (Database, EventBus, Gateway, External, Worker, Workflow, Cache) + QueueNode
  - Added `lucide-react` dependency for tree-shakeable SVG icons

### Added

- **Composite Renderer** — Multi-perspective stories that span multiple renderers in a single YAML file
  - New `composite` renderer type with `sections[]` containing any existing renderer
  - Steps are flattened globally across all sections for seamless linear navigation
  - Section transitions use fade animations via `AnimatePresence`
  - Unified `StepOverlay` with section badge indicator
  - Schema validation via `superRefine` validates each section against its renderer's Zod schema
  - Example story: `stories/composite/order-deep-dive.yaml` (C4 Context → Service Flow → State Diagram)
- **`hideOverlay` prop** on all 14 canvas components — enables overlay suppression for embedding canvases inside composite or other wrappers
- **Rich Text Markup in Narration** — `narrative`, `description`, and `narration.message` fields now support inline formatting
  - `**bold**`, `*italic*`, `` `code` ``, `{color:name|text}` (11 named Tailwind colors + raw hex), `\n` line breaks
  - Zero-dependency micro-parser in `StepOverlay` — no external markdown library needed
  - CSS: `.so-bold`, `.so-italic`, `.so-code`, `.so-color` classes in `step-overlay.css`
- **10 Domain-Level Node Types** — Service-flow expanded from 17 to 27 SERVICE_TYPES
  - `entity` (pentagon), `aggregate` (double-border rect), `value-object` (rounded hexagon), `domain-event` (tab shape), `policy` (shield), `read-model` (reverse parallelogram), `saga` (arrow/chevron), `repository` (house), `bounded-context` (rect with notch), `actor` (trapezoid)
  - Each with unique CSS clip-path shape, Tailwind color, Lucide icon, and entry animation
  - Full dark mode support via `--svc-border-*` design tokens
- **Per-Step Camera Overrides** — YAML-driven cinematic camera control for service-flow
  - `camera: { zoom, duration, easing, focusNodes, fitAll, pan, padding }` on any step
  - 5 named easing functions: spring-overshoot, linear, ease-in, ease-out, ease-in-out
  - Priority: `fitAll` > `focusNodes` override > auto-focus
- **Coupling Indicators** — Visual coupling analysis on service-flow edges
  - `coupling: tight|loose|eventual` on all 4 call types — varying stroke width and dash patterns
  - `critical: true` marks critical path with pulsing glow animation
  - `fallback` field for graceful degradation documentation
- **Failure Cascade Simulation** — `simulateFailure` step field
  - BFS upstream through `critical: true` calls from a failed service
  - Affected nodes get red outline + pulse, failed edges pulse red
  - Fallback edges draw in green when activated
  - `getServiceFlowCascade()` utility function in schema
- **Edge Effects System** — Projectile-based visual effects on service-flow edges
  - `effect: { type: emoji-fan|label-yeet|particle-stream, ... }` on calls
  - Step-level overrides via `effects[]` array
  - SVG-based `EdgeEffectLayer` with physics (velocity, jitter, gravity, fade)
- **Self-Loop Arc Redesign** — Self-referencing edges now arc above the node
  - Dynamic arc height scales with node dimensions
  - Multiple self-loops on same node stagger vertically
- **3 New Demo Stories**
  - `stories/service/ddd-order-domain.yaml` — All 10 domain types in Order bounded context
  - `stories/service/coupling-analysis.yaml` — Coupling indicators + failure cascade
  - `stories/service/cinematic-camera.yaml` — Camera override showcase

## [1.0.0] - 2026-02-08

### Added

- Initial public release
- **Story Types**
  - User Stories - Actor-driven user journey flows
  - HTTP Flows - REST API request/response sequences
  - Service Flows - Microservice communication diagrams
  - Pipelines - CI/CD and workflow visualizations
- **Core Features**
  - YAML-based story definitions
  - Step-by-step playback with keyboard navigation
  - Export to PNG, SVG, PDF, and animated GIF
  - Light and dark themes
  - Auto-layout with dagre
- **Developer Experience**
  - TypeScript with strict mode
  - ESLint + Prettier configuration
  - Vitest unit tests
  - Playwright E2E tests
  - GitHub Actions CI/CD
