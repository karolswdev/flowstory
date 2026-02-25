# Service-Flow LLM Instruction Set

> **Purpose:** This directory contains a complete, authoritative instruction set for an LLM agent whose job is to author world-class `service-flow` stories in YAML for the FlowStory engine. Every document is self-contained, precise, and optimized for LLM consumption.

## Document Map

| File | Scope | Read When... |
|------|-------|--------------|
| [01-foundation.md](01-foundation.md) | Story skeleton, YAML structure, pacing, step model | Starting any new story |
| [02-nodes.md](02-nodes.md) | All 28 node types — shapes, colors, icons, when to use each | Choosing which service types to use |
| [03-connections.md](03-connections.md) | 4 call types, dash patterns, labels, response edges, self-loops | Wiring services together |
| [04-camera.md](04-camera.md) | Camera system, 5 easings, per-step overrides, cinematic recipes | Controlling what the audience sees |
| [05-effects.md](05-effects.md) | Edge effects (emoji-fan, label-yeet, particle-stream), animated labels, streams | Adding motion and drama |
| [06-layout.md](06-layout.md) | Scenes, directions (LR/TB/RL/BT), zones, multi-axis layout | Controlling spatial arrangement |
| [07-progressive-reveal.md](07-progressive-reveal.md) | 3 reveal axes, accumulation pattern, substates, failure cascade | Building narrative tension |
| [08-narration.md](08-narration.md) | Rich text markup, speaker narration, color semantics, writing style | Writing compelling step text |
| [09-recipes.md](09-recipes.md) | Complete patterns: saga, security onion, DDD, event backbone, failure analysis | Copying proven story structures |
| [10-checklist.md](10-checklist.md) | Pre-flight checklist, common mistakes, validation rules | Final review before delivery |

## How to Use This Set

1. **Always read `01-foundation.md` first** — it establishes the YAML skeleton every story needs.
2. **Pick node types from `02-nodes.md`** — choose by purpose, not by appearance.
3. **Wire them with `03-connections.md`** — understand the 4 call types and when each applies.
4. **Design the camera arc with `04-camera.md`** — every great story has a cinematic arc.
5. **Add effects sparingly per `05-effects.md`** — 1-3 per story maximum.
6. **Control layout with `06-layout.md`** — scenes and zones give architectural clarity.
7. **Build tension with `07-progressive-reveal.md`** — reveal, don't dump.
8. **Write narration per `08-narration.md`** — 2-3 sentences per step, rich text for emphasis.
9. **Check recipes in `09-recipes.md`** — proven patterns you can adapt.
10. **Run the checklist in `10-checklist.md`** — every story, every time.

## Key Principles

- **A story is not a diagram.** It's a guided narrative. Reveal one concept per step.
- **Shape is the primary discriminator.** All 28 node types have unique shapes — colorblind-safe by design.
- **Camera creates meaning.** Where the camera points is what matters. Use the arc: establish → detail → detail → resolve.
- **Effects punctuate.** An emoji-fan on a publish call is a *moment*. Ten effects is noise.
- **Substates bring nodes to life.** A workflow node transitioning idle → running → waiting → completed tells a richer story than a static box.
