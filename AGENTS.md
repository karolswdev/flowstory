# AGENTS.md - FlowStory

> For AI coding agents (Claude Code, Codex CLI, Cursor, etc.)

## What is FlowStory?

FlowStory creates animated flow diagrams from YAML. It supports:
- **User Stories** — Actor-driven journeys
- **HTTP Flows** — REST API sequences  
- **Service Flows** — Microservice architecture
- **Pipelines** — CI/CD workflows

## Quick Commands

```bash
# Start dev server
npm run dev
# Opens http://localhost:5173

# Run all tests
npm run test:all

# Export screenshots
npx tsx scripts/screenshot-slides.ts <story-id>
```

## Creating a Story

1. Create a YAML file in `stories/`
2. Set `renderer` to choose visualization type
3. Define nodes/participants, edges/calls, and steps
4. View in browser at http://localhost:5173

## Minimal Examples

### User Story
```yaml
id: my-flow
title: My Flow
version: "2.0"
renderer: story-flow

actors:
  - id: user
    name: User
    avatar: "👤"

nodes:
  - id: user-actor
    type: actor
    actorId: user
    label: User
  - id: action-1
    type: action
    actorId: user
    label: Does Something
  - id: result
    type: state
    label: Done
    data: { variant: success }

edges:
  - { source: user-actor, target: action-1, type: flow }
  - { source: action-1, target: result, type: flow }

steps:
  - id: step-1
    nodeIds: [user-actor, action-1]
    narrative: "User performs an action."
  - id: step-2
    nodeIds: [result]
    narrative: "Action completes successfully."
```

### HTTP Flow
```yaml
id: api-call
title: API Call
renderer: http-flow
schemaVersion: "2.0"

participants:
  - id: client
    name: Client
    type: client
  - id: server
    name: Server
    type: service

exchanges:
  - id: request
    request:
      from: client
      to: server
      method: GET
      path: /api/data
    response:
      status: 200
      body: { data: "..." }

steps:
  - id: step-1
    activeExchanges: [request]
    narrative: "Client requests data from server."
```

### Service Flow
```yaml
id: service-call
title: Service Call
renderer: service-flow
schemaVersion: "2.0"

services:
  - id: api
    name: API
    type: api
  - id: db
    name: Database
    type: database

calls:
  - id: query
    type: sync
    from: api
    to: db
    method: SELECT

steps:
  - id: step-1
    activeCalls: [query]
    narrative: "API queries database."
```

## Node Types

| Type | Use |
|------|-----|
| `actor` | Person/system starting actions |
| `action` | User-initiated action |
| `system` | Backend processing |
| `event` | Domain event (⚡) |
| `decision` | Branch point (◇) |
| `state` | End state |

## Edge Types

| Type | When to Use |
|------|-------------|
| `flow` | Sequential steps |
| `event` | Publishing events |
| `async` | Background/eventual |
| `error` | Error paths |

## File Structure

```
stories/         <- Your YAML stories go here
src/schemas/     <- Zod validation schemas
src/components/  <- React components
docs/            <- Documentation
```

## Validation

Stories are validated on load. Check browser console for errors.

Key rules:
- All `source`/`target` in edges must reference valid node IDs
- Actor nodes need matching `actorId` in actors list
- Steps reference `nodeIds` that exist in nodes

## Tips

1. Use `version: "2.0"` for auto-layout (no positions needed)
2. Keep IDs descriptive: `validate-payment` not `node1`
3. Add narratives to steps for storytelling
4. Test with `npm run dev` before committing
