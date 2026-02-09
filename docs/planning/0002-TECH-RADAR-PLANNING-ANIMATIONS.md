# 0002: Technology Radar

## Concept

Visualize the organization's technology landscape using the ThoughtWorks Tech Radar pattern - concentric rings showing adoption status, with quadrants for different tech categories.

**Target audience:** CTOs, Architects, Developers, Hiring managers

## Use Cases

1. **Tech Strategy**: "Here's our technology roadmap"
2. **Onboarding**: "These are the technologies we use"
3. **Governance**: "What should we adopt vs avoid?"
4. **Hiring**: "Show candidates our tech stack"
5. **Architecture Review**: "Are we aligned with industry trends?"

## Visual Design (Radar Style)

```
                    ADOPT
                      │
         ┌────────────┼────────────┐
        /             │             \
       /    ┌─────────┼─────────┐    \
      /    /          │          \    \
     /    /    ┌──────┼──────┐    \    \
    │    │    │       │       │    │    │
LANGUAGES   FRAMEWORKS   DATA   PLATFORMS
    │    │    │       │       │    │    │
     \    \    └──────┼──────┘    /    /
      \    \          │          /    /
       \    └─────────┼─────────┘    /
        \             │             /
         └────────────┼────────────┘
                      │
                    HOLD
```

## Rings (Adoption Status)

| Ring | Meaning | Visual |
|------|---------|--------|
| **Adopt** | Production-ready, recommended | Inner ring, bright |
| **Trial** | Worth exploring in projects | Second ring |
| **Assess** | Evaluate for potential | Third ring |
| **Hold** | Don't start new projects | Outer ring, muted |

## Quadrants (Categories)

| Quadrant | Examples |
|----------|----------|
| **Languages** | TypeScript, Go, Python, Rust |
| **Frameworks** | React, .NET, FastAPI, Next.js |
| **Data** | PostgreSQL, Redis, Kafka, Elasticsearch |
| **Platforms** | Kubernetes, AWS, Azure, Vercel |

## Node Types

| Type | Visual | Description |
|------|--------|-------------|
| `tech` | Circle/dot | Individual technology |
| `category-label` | Text | Quadrant label |
| `ring-label` | Arc text | Ring label |

## Animation Effects

1. **Quadrant focus**: Dim other quadrants when highlighting one
2. **Ring pulse**: Animate ring boundaries when discussing adoption
3. **Tech entrance**: Dots fly in from edge to their position
4. **Movement**: Show tech moving between rings (adoption changes)
5. **Cluster**: Group related technologies together

## Schema

```yaml
type: tech-radar

quadrants:
  - id: languages
    name: "Languages & Runtimes"
    angle: 0  # Top-right
    
  - id: frameworks
    name: "Frameworks & Libraries"
    angle: 90  # Bottom-right
    
  - id: data
    name: "Data & Storage"
    angle: 180  # Bottom-left
    
  - id: platforms
    name: "Platforms & Infrastructure"
    angle: 270  # Top-left

rings:
  - id: adopt
    name: "Adopt"
    description: "Technologies we use in production"
    
  - id: trial
    name: "Trial"
    description: "Worth exploring in real projects"
    
  - id: assess
    name: "Assess"
    description: "Worth understanding"
    
  - id: hold
    name: "Hold"
    description: "Proceed with caution"

technologies:
  - id: typescript
    name: "TypeScript"
    quadrant: languages
    ring: adopt
    description: "Our primary frontend language"
    isNew: false
    
  - id: rust
    name: "Rust"
    quadrant: languages
    ring: assess
    description: "Evaluating for performance-critical services"
    isNew: true
    moved: 1  # Moved in from outer ring

steps:
  - title: "Our Tech Radar"
    description: "Overview of our technology landscape"
    focusRing: null
    focusQuadrant: null
    
  - title: "What We Adopt"
    description: "Production-ready technologies"
    focusRing: adopt
    highlightTech: [typescript, react, dotnet]
```

## Implementation Plan

### Phase 1: Schema (20 min)
- [ ] Create `tech-radar.ts` schema
- [ ] Define quadrant, ring, technology types
- [ ] Add movement tracking (ring changes)

### Phase 2: Components (1.5 hours)
- [ ] `RadarCanvas`: Polar layout with rings and quadrants
- [ ] `TechBlip`: Dot/circle for each technology
- [ ] `QuadrantLabel`: Category text
- [ ] `RingLabel`: Arc text for ring names

### Phase 3: Examples (30 min)
- [ ] `modern-stack.yaml`: Typical modern tech stack
- [ ] `transition.yaml`: Legacy to modern journey

### Phase 4: Export (15 min)
- [ ] Add to GIF pipeline
- [ ] Verify visual quality

---

**Priority:** P0
**Estimated time:** 2.5 hours
**Start:** Now
