# FlowStory

[![CI](https://github.com/karolswdev/flowstory/actions/workflows/ci.yml/badge.svg)](https://github.com/karolswdev/flowstory/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61dafb.svg)](https://react.dev/)

Visual story-driven flow diagrams for user journeys, system architecture, and process documentation.

## See It In Action

### Service Flow
Map microservice choreography with **9 distinct node shapes** (cylinders, hexagons, diamonds, clouds, pills), dagre auto-layout, zone grouping, response arrows, and cinematic entry animations.

![Service Flow Demo](docs/demos/demo-service-flow.gif)

### State Diagram
UML state machines with dagre auto-layout, phase grouping, and transition animations.

![State Diagram Demo](docs/demos/demo-state-diagram.gif)

### CI/CD Pipeline
Document build pipelines with stages, jobs, gates, and status indicators.

![Pipeline Demo](docs/demos/demo-pipeline.gif)

### BC Composition
Progressive reveal of bounded context internals — API, database, cache, events.

![BC Composition Demo](docs/demos/demo-bc-composition.gif)

### HTTP Flow
Visualize REST API sequences with request/response details, status codes, and headers.

![HTTP Flow Demo](docs/demos/demo-http-flow.gif)

## Features

- **YAML-based stories** — Define flows in simple, readable YAML
- **12 renderer types** — Service Flow, HTTP Flow, Pipeline, BC Deployment, BC Composition, State Diagram, C4 Context, Tech Radar, Event Storming, ADR Timeline, Cloud Cost, Story Flow
- **Cinematic step transitions** — Spring-overshoot camera, node glow/dim lifecycle, edge draw animations
- **Presentation mode** — Press `P` for fullscreen CTO-ready demos
- **Export options** — PNG, SVG, PDF, animated GIF (in-browser + CLI recorder)
- **Auto-focus camera** — Smooth pan/zoom to active elements each step
- **Dark/light themes** — Full token-based theming with `data-theme` switching
- **Embed mode** — `?embed=true` for clean iframe embedding with subtle attribution
- **Shareable URLs** — `?story=id&step=N` for direct linking
- **Rich text narration** — `**bold**`, `*italic*`, `` `code` ``, `{color:name|text}` in narrative text

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Open http://localhost:5173
```

## Creating Stories

Stories are defined in YAML format in the `stories/` directory.

### User Story Example

```yaml
version: "1"
title: "User Login Flow"
description: "Authentication journey for returning users"

actors:
  - id: user
    label: "User"
    icon: "👤"

steps:
  - id: step-1
    title: "Enter Credentials"
    activeNodes: [user, login-form]
    
  - id: step-2
    title: "Validate"
    activeNodes: [auth-service]

nodes:
  - id: user
    type: actor
    label: "User"
    position: { x: 100, y: 200 }
    
  - id: login-form
    type: action
    label: "Login Form"
    position: { x: 300, y: 200 }
    
  - id: auth-service
    type: system
    label: "Auth Service"
    position: { x: 500, y: 200 }

edges:
  - id: e1
    source: user
    target: login-form
    label: "submits"
    
  - id: e2
    source: login-form
    target: auth-service
    label: "validates"
```

### HTTP Flow Example

```yaml
version: "1"
type: http
title: "Create User API"

participants:
  - id: client
    label: "Client"
    type: client
  - id: api
    label: "API Server"
    type: server

exchanges:
  - id: create-user
    from: client
    to: api
    request:
      method: POST
      path: /api/users
      headers:
        Content-Type: application/json
      body:
        name: "John Doe"
        email: "john@example.com"
    response:
      status: 201
      headers:
        Location: /api/users/123
      body:
        id: 123
        name: "John Doe"
```

### Service Flow Example

```yaml
version: "1"
type: service
title: "Order Processing"

services:
  - id: api
    label: "API Gateway"
    type: gateway
  - id: orders
    label: "Order Service"
    type: api
  - id: queue
    label: "Order Queue"
    type: queue
  - id: processor
    label: "Order Processor"
    type: worker

calls:
  - id: c1
    from: api
    to: orders
    type: sync
    label: "createOrder()"
  - id: c2
    from: orders
    to: queue
    type: publish
    label: "OrderCreated"
  - id: c3
    from: queue
    to: processor
    type: subscribe
    label: "process"
```

### Pipeline Example

```yaml
version: "1"
type: pipeline
title: "CI/CD Pipeline"

trigger:
  type: push
  branch: main

stages:
  - id: build
    name: "Build"
    jobs:
      - id: compile
        name: "Compile"
        status: success
        duration: 45000
      - id: test
        name: "Unit Tests"
        status: success
        duration: 120000

  - id: deploy
    name: "Deploy"
    needs: [build]
    jobs:
      - id: staging
        name: "Deploy Staging"
        status: running
```

## CLI GIF Recorder

Record any story as an animated GIF from the command line — no browser interaction needed. Great for CI pipelines, batch generation, and reproducible output.

```bash
# Start the dev server first
npm run dev

# Record a story — canvas only, no UI chrome
npm run record-gif -- service-order-processing --clean

# Record a custom YAML file
npm run record-gif -- ./stories/service/order-processing.yaml -o demo.gif --clean

# Customize output
npm run record-gif -- pipeline-cicd --dwell 3000 --fps 15 --scale 1280
```

**Options:**

| Option | Default | Description |
|--------|---------|-------------|
| `--output, -o` | `<name>.gif` | Output GIF path |
| `--fps` | `12` | GIF framerate |
| `--dwell` | `2500` | Dwell time per step (ms) |
| `--width` | `1440` | Viewport width |
| `--height` | `900` | Viewport height |
| `--scale` | `960` | Output GIF width (px) |
| `--server` | `http://localhost:5173` | Dev server URL |
| `--clean` | off | Canvas only — hide toolbar, panels, controls; add watermark |

**Prerequisites:** Dev server running, [ffmpeg](https://ffmpeg.org/) installed, Playwright browsers installed.

## Scripts

```bash
# Development
npm run dev          # Start dev server
npm run build        # Production build
npm run preview      # Preview production build

# Quality
npm run lint         # Run ESLint
npm run typecheck    # TypeScript check
npm run test         # Unit tests
npm run test:e2e     # E2E tests (Playwright)
npm run test:all     # All checks

# Utilities
npm run screenshots  # Capture story screenshots
npm run record-gif   # Record animated GIF (see above)
```

## Project Structure

```
flowstory/
├── src/
│   ├── schemas/          # Zod schemas per renderer type
│   ├── components/
│   │   ├── shared/       # StepOverlay (unified step info card)
│   │   ├── nodes/        # Shared node components + sizes
│   │   ├── edges/        # FlowEdge, AnimatedEventEdge, EdgeParticle
│   │   ├── service/      # ServiceFlowCanvas + 9 node shapes + edge + zones
│   │   ├── http/         # HttpFlowCanvas
│   │   ├── pipeline/     # PipelineCanvas
│   │   ├── bc-deployment/  # BCDeploymentCanvas
│   │   ├── bc-composition/ # BCCompositionCanvas
│   │   ├── state-diagram/  # StateDiagramCanvas
│   │   └── ...           # c4-context, tech-radar, event-storming, etc.
│   ├── hooks/            # Camera, step nav, presentation, shareable URL
│   ├── animations/       # Timing config, motion variants, step transitions
│   ├── effects/          # Pluggable effects (pulse, glow, shake, particles)
│   ├── renderers/        # Renderer registry (specialized.ts)
│   ├── themes/           # Light/dark theme provider + tokens
│   └── styles/           # Design tokens (tokens.css), global styles
├── stories/              # Example YAML stories by renderer type
├── scripts/              # CLI GIF recorder, screenshot tools
├── e2e/                  # Playwright E2E tests
└── docs/demos/           # README showcase GIFs
```

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Space` / `→` | Next step |
| `←` | Previous step |
| `Home` / `End` | First / Last step |
| `P` | Toggle presentation mode |
| `ESC` | Exit presentation |
| `?` | Keyboard help overlay |
| `N` | Toggle presenter notes |

## Export Formats

- **PNG** - Raster image, good for docs
- **SVG** - Vector, scalable for any size
- **PDF** - Print-ready document
- **GIF** - Animated, captures full playback

## License

MIT © [karolswdev](https://github.com/karolswdev)
