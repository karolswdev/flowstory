# Author a Composite Story

You are helping the user create a **composite FlowStory** — a multi-perspective YAML story that stitches together multiple renderers into one seamless narrative.

## Your Job

1. Ask the user what system/domain they want to tell a story about
2. Help them choose 2-4 sections (renderers) that tell a compelling multi-perspective narrative
3. Generate a complete, valid `renderer: composite` YAML file
4. Apply the **transition conventions** below to make section boundaries feel seamless

## Available Renderers for Sections

| Renderer | Best For | Step Keys |
|----------|----------|-----------|
| `c4-context` | Big-picture system landscape | `focusNode`, `highlightNodes`, `showRelationships` |
| `service-flow` | Microservice choreography | `activeCalls`, `focusNodes`, `revealNodes` |
| `state-diagram` | Entity lifecycle / state machines | `activeStates`, `activeTransitions` |
| `http-flow` | API request/response detail | `activeExchanges` |
| `pipeline` | CI/CD or workflow stages | `activeStages`, `activeJobs` |
| `bc-deployment` | K8s artifacts around a bounded context | `focusNodes`, `activeEdges`, `expandNodes` |
| `bc-composition` | Progressive reveal of BC internals | `reveal`, `focus`, `expand` |
| `event-storming` | DDD domain event modeling | `highlightEvents`, `focusAggregate` |
| `tech-radar` | Technology adoption decisions | `focusRing`, `highlightTech` |

## Section Transition Conventions

These patterns make the jump between renderers feel intentional rather than jarring.

### 1. Bridge Node Pattern (MOST IMPORTANT)

The **last step of a section** should spotlight the element that becomes the **focus of the next section**. This creates a visual "handoff."

**Example: C4 Context → Service Flow**

```yaml
sections:
  - renderer: c4-context
    title: "System Landscape"
    steps:
      - title: "The Order System"
        focusNode: order-system
        # ...other steps...
      # BRIDGE STEP — spotlights the node we're about to zoom into
      - title: "Inside the Order System"
        description: "Let's zoom into the Order System to see how its microservices collaborate."
        highlightNodes: [order-system]
        duration: 3000

  - renderer: service-flow
    title: "Order Service Internals"
    # Now we're "inside" that C4 box
    services:
      - id: orders
        name: Order Service   # ← same name as the C4 system node
        # ...
```

### 2. Narrative Bridge Pattern

The last step's narration should **foreshadow** the next section. The first step of the next section should **acknowledge** the transition.

```yaml
# End of C4 section
- title: "Critical Path"
  description: "The payment flow is our most critical path. Let's trace it step by step."

# Start of service-flow section
- title: "Payment Flow Begins"
  narrative: "Zooming into the microservice level — here's how a payment actually flows."
```

### 3. Zoom Metaphor (Wide → Medium → Detail)

Order sections from broadest to most detailed perspective:

| Order | Renderer | Perspective |
|-------|----------|-------------|
| 1st | `c4-context` | 30,000-foot view — systems and actors |
| 2nd | `service-flow` or `http-flow` | Microservice / API level |
| 3rd | `state-diagram` | Single entity lifecycle |
| 4th | `pipeline` | Build/deploy mechanics |

This creates a natural "drill down" narrative arc.

### 4. Color Continuity

Use `accentColor` to create a visual thread. The section badge color hints at the "perspective":

```yaml
sections:
  - renderer: c4-context
    accentColor: "#3B82F6"      # Blue = system/context
  - renderer: service-flow
    accentColor: "#22C55E"      # Green = action/flow
  - renderer: state-diagram
    accentColor: "#A855F7"      # Purple = state/lifecycle
```

### 5. Bookend Pattern

For stories with 3+ sections, have the **last section tie back** to the first:

```yaml
sections:
  - renderer: c4-context
    title: "System Landscape"
    steps:
      - title: "Overview"
        # Show everything
  - renderer: service-flow
    title: "Order Flow Detail"
    # ...
  - renderer: c4-context
    title: "Landscape Revisited"
    steps:
      - title: "Full Picture"
        description: "Now that we've seen the internals, here's the complete system with all integration points highlighted."
        highlightNodes: [payment-gateway, warehouse, order-system]
```

### 6. Step Count Guidelines

| Section Position | Ideal Steps | Why |
|-----------------|-------------|-----|
| First (context) | 2-3 | Set the scene, don't belabor it |
| Middle (detail) | 3-5 | The meat of the story |
| Last (wrap-up) | 2-3 | Tie it together |
| **Total** | **6-12** | Sweet spot for a presentation |

### 7. Consistent Entity Naming

When the same concept appears across sections, **use the same name**:

```yaml
# In c4-context section
system:
  id: order-system
  name: Order System        # ← This name

# In service-flow section
services:
  - id: orders
    name: Order Service     # ← echoes the C4 name

# In state-diagram section
states:
  - id: pending
    label: PENDING
    description: "Order awaiting payment"  # ← "Order" ties back
```

## Recommended Section Combos

### "System Deep Dive" (most common)
`c4-context` (2 steps) → `service-flow` (3-4 steps) → `state-diagram` (2-3 steps)
*"Here's the system → Here's how services talk → Here's the entity lifecycle"*

### "API-First Story"
`c4-context` (2 steps) → `http-flow` (3-4 steps) → `state-diagram` (2 steps)
*"Here's who calls us → Here's the exact API sequence → Here's what changes"*

### "Platform Engineering"
`c4-context` (2 steps) → `bc-deployment` (3 steps) → `pipeline` (3 steps)
*"Here's the system → Here's how it's deployed → Here's how we ship changes"*

### "DDD Journey"
`event-storming` (3 steps) → `bc-composition` (3 steps) → `service-flow` (3 steps)
*"Here's the domain → Here's the bounded context → Here's the implementation"*

### "Tech Strategy"
`tech-radar` (2 steps) → `c4-context` (2 steps) → `service-flow` (3 steps)
*"Here's our tech strategy → Here's the system that uses it → Here's how it works"*

## YAML Template

```yaml
id: $ID
title: "$TITLE"
renderer: composite
schemaVersion: "2.0"
description: "$DESCRIPTION"

sections:
  - renderer: $RENDERER_1
    title: "$SECTION_1_TITLE"
    accentColor: "$COLOR_1"
    # ... renderer-specific data ...
    steps:
      # ... steps with bridge at the end ...

  - renderer: $RENDERER_2
    title: "$SECTION_2_TITLE"
    accentColor: "$COLOR_2"
    # ... renderer-specific data ...
    steps:
      # ... steps ...
```

## Rich Text in Narration

All `narrative`, `description`, and `narration.message` text supports inline formatting:
`**bold**`, `*italic*`, `` `code` ``, `{color:name|text}` (blue, green, red, orange, amber, purple, pink, cyan, teal, yellow, gray — or raw hex), `\n` line breaks.

```yaml
narrative: >-
  The **Gateway** receives `POST /orders` and routes to
  the {color:blue|Order Service}, which emits a
  {color:orange|OrderCreatedEvent} to Kafka.
```

Use sparingly — 1-3 formatted spans per narrative. Great for highlighting service names, API paths, and semantic status (red=error, green=healthy).

## Validation Rules

- Every section must have at least 1 step
- Each section body must be valid for its renderer (same keys as a standalone story)
- Don't include top-level `id`, `renderer`, or `schemaVersion` inside sections (injected automatically)
- Total steps across all sections should ideally be 6-12 for presentation flow
- `composite` cannot be used as a section renderer (no nesting)

## Reference

- **Presentation Playbook:** `docs/presentation-playbook.md` — narrative arcs, 6 storytelling patterns, narration voice guide, pacing, anti-patterns, complete worked composite example
- Full example: `stories/composite/order-deep-dive.yaml`
- Schema: `src/schemas/composite.ts`
- Canvas: `src/components/composite/CompositeCanvas.tsx`
- Renderer guide: `docs/RENDERER-GUIDE.md` (Composite Renderer section)
- All renderer schemas: `src/schemas/*.ts`
- Authoring guide: Memory file `authoring-guide.md`
