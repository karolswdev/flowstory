# 02 — Node Types

Service-flow has **28 unique node types** — 18 infrastructure and 10 domain-level. Every type has a distinct shape, making the system colorblind-safe. Shape is the primary discriminator; color is secondary.

---

## Infrastructure Types (18)

### Standard Services

| Type | Shape | Color | Icon | Dimensions | When to Use |
|------|-------|-------|------|------------|-------------|
| `api` | Rectangle | Blue `#3B82F6` | Server | Dynamic (name-based) | Any HTTP/gRPC/GraphQL service |
| `worker` | Rounded rectangle | Purple `#A855F7` | Hammer | Dynamic | Background processors, job consumers |
| `gateway` | Diamond | Amber `#F59E0B` | Globe | Dynamic | API gateways, reverse proxies, routers |
| `database` | Tall cylinder | Stone `#78716C` | Database | Dynamic | SQL/NoSQL databases |
| `cache` | Rounded square | Cyan `#06B6D4` | Zap | Dynamic | Redis, Memcached, in-memory caches |
| `external` | Dashed cloud/pill | Slate `#64748B` | Cloud | Dynamic | 3rd-party APIs (Stripe, Maps, Twilio) |

### Messaging & Event Infrastructure

| Type | Shape | Color | Icon | Dimensions | When to Use |
|------|-------|-------|------|------------|-------------|
| `event-bus` | Hexagon | Orange `#F97316` | Radio | Dynamic | Kafka topics, RabbitMQ exchanges — routing points |
| `event-stream` | Wide pipe + marquee | Cyan `#0891B2` | Waves | **Fixed 420x72** | Central event backbone (Kafka streams, Kinesis). One per story. |
| `event-processor` | Rounded rect + conveyor | Violet `#8B5CF6` | Activity | **Fixed 220x90** | Stream processors (Flink, Spark, ksqlDB). Shows conveyor belt when consuming. |

### Orchestration & Compute

| Type | Shape | Color | Icon | Dimensions | When to Use |
|------|-------|-------|------|------------|-------------|
| `workflow` | Pill/stadium | Pink `#EC4899` | GitBranch | Dynamic | Orchestrators (Conductor, Temporal, Step Functions) |
| `scheduler` | Circle | Amber `#D97706` | Clock | Dynamic | Cron jobs, timed triggers |
| `function` | Parallelogram | Orange `#EA580C` | Cpu | Dynamic | Serverless (Lambda, Azure Functions) |

### Network & Security

| Type | Shape | Color | Icon | Dimensions | When to Use |
|------|-------|-------|------|------------|-------------|
| `client` | Card + avatar | Indigo `#6366F1` | Monitor | Dynamic | Browser, mobile app, CLI, IoT device |
| `firewall` | Octagon | Rose `#F43F5E` | ShieldCheck | Dynamic | WAFs, security boundaries |
| `load-balancer` | Inverted trapezoid | Teal `#14B8A6` | Network | Dynamic | NGINX, ALB, K8s Ingress |

### Storage & Observability

| Type | Shape | Color | Icon | Dimensions | When to Use |
|------|-------|-------|------|------------|-------------|
| `storage` | Wide cylinder | Stone `#A8A29E` | HardDrive | Dynamic | Blob storage, S3, file systems |
| `monitor` | Rect + chart accent | Emerald `#10B981` | BarChart3 | Dynamic | Observability (Datadog, PagerDuty) |
| `human-task` | Card + person badge | Pink `#EC4899` | UserCheck | Dynamic | Manual approval, human-in-the-loop |

---

## Domain-Level Types (10) — For DDD Stories

| Type | Shape | Color | Icon | DDD Concept |
|------|-------|-------|------|-------------|
| `actor` | Regular trapezoid | Pink `#DB2777` | User | User, external agent initiating actions |
| `aggregate` | Double-border rectangle | Indigo `#4F46E5` | Box | Aggregate root — consistency boundary |
| `entity` | Pentagon | Sky `#0EA5E9` | Fingerprint | Domain entity with identity |
| `value-object` | Rounded hexagon | Lime `#84CC16` | Gem | Immutable value — no identity |
| `domain-event` | Tab shape | Amber `#F59E0B` | BellRing | Published domain event |
| `policy` | Shield (vertical hex) | Rose `#E11D48` | Scale | Business rule, specification, invariant |
| `read-model` | Reverse parallelogram | Cyan `#06B6D4` | Eye | CQRS read projection |
| `saga` | Arrow/chevron | Violet `#7C3AED` | Route | Process manager, saga orchestrator |
| `repository` | House/pentagon-up | Stone `#57534E` | Archive | Persistence gateway |
| `bounded-context` | Rect with left notch | Emerald `#059669` | Layers | Bounded context boundary marker |

---

## Choosing the Right Type

### Decision Tree

1. **Is it a person or external agent?** → `actor` (DDD) or `client` (infra)
2. **Is it an HTTP/gRPC service?** → `api`
3. **Is it a background job processor?** → `worker`
4. **Does it route requests?** → `gateway` (API gateway) or `load-balancer` (traffic distribution)
5. **Does it store data?**
   - Relational/document DB → `database`
   - Key-value/in-memory → `cache`
   - Blob/file storage → `storage`
6. **Is it a message routing point?** → `event-bus` (compact hex) or `event-stream` (wide pipe for backbone)
7. **Does it consume events as its primary job?** → `event-processor` (conveyor belt visual)
8. **Does it orchestrate a workflow?** → `workflow`
9. **Is it serverless?** → `function`
10. **Is it a security boundary?** → `firewall`
11. **Is it a scheduled trigger?** → `scheduler`
12. **Is it observability/monitoring?** → `monitor`
13. **Does it require human action?** → `human-task`
14. **Is it a 3rd-party external system?** → `external`
15. **Is it a DDD building block?** → Use the domain-level type that matches

### `event-stream` vs `event-bus`

| Criterion | `event-stream` | `event-bus` |
|-----------|---------------|-------------|
| Shape | Wide pipe (420px) with scrolling marquee | Compact hexagon |
| Role | Central event backbone | Individual topic or exchange |
| Per story | 1, maybe 2 | As many as needed |
| Visual weight | Dominant centerpiece | One of many |
| Events field | Yes — shows what flows through | No |

### `event-processor` vs `worker`

| Criterion | `event-processor` | `worker` |
|-----------|-------------------|----------|
| Shape | Rounded rect + conveyor belt strip | Plain rounded rect |
| Conveyor | Auto-derived from active calls with `messageType` | Never |
| Use for | Stream processors (Flink, Spark), CQRS projectors | General background jobs, batch processors |

---

## Node Fields Reference

```yaml
# Full service definition (all optional fields shown)
services:
  - id: my-svc                  # REQUIRED — unique ID
    name: My Service             # REQUIRED — display name
    type: api                    # REQUIRED — one of 28 types
    technology: "Node.js"        # Subtitle text
    status: healthy              # healthy | degraded | down
    instances: 3                 # Instance count badge
    version: "2.1"               # Version string
    tags:                        # Metadata pills (max 4 visible)
      protocol: gRPC             # → blue (infra category)
      team: platform             # → purple (identity category)
      SLA: "99.9%"               # → green (status category)
      latency: "85ms p99"        # → orange (metric category)
    substates:                   # Available sub-state names
      - idle
      - running
      - completed
      - failed
    initialSubstate: idle        # Starting sub-state
    events:                      # event-stream ONLY
      - key: EventName
        value: "field1, field2"
        emoji: "📦"
        color: "#3B82F6"
```

### Tag Auto-Categorization

Tags auto-detect their category (and color) based on key name:

| Category | Color | Matching Keys |
|----------|-------|---------------|
| infra | Blue | protocol, broker, runtime, cloud, platform, region, framework, language |
| metric | Orange | instances, depth, consumers, throughput, latency, replicas, cpu, memory, rps |
| identity | Purple | version, team, owner, domain, namespace |
| status | Green | sla, health, tier, env, stage |

Maximum 4 visible tags per node. Overflow shows `+N` badge.

---

## Mixing Infrastructure and Domain Types

You can and should mix both families in the same story. A `saga` node calling a `database` node, or an `actor` triggering an `api`, creates powerful visual narratives that bridge business and technology perspectives.

```yaml
services:
  - { id: customer, type: actor, name: Customer }
  - { id: order-agg, type: aggregate, name: Order Aggregate }
  - { id: order-db, type: database, name: Order DB, technology: PostgreSQL }
  - { id: events, type: event-bus, name: Domain Events }
  - { id: fulfillment, type: saga, name: Fulfillment Saga }
```

This produces a canvas with 5 visually distinct shapes — immediately communicating the architectural role of each component without reading labels.
