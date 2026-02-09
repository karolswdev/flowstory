# BC Deployment Renderer

The BC Deployment renderer visualizes Kubernetes deployment artifacts radiating from a Bounded Context. It's designed for DevOps, Platform, and Architecture teams to document and understand deployment topology.

## Features

- **Three Layout Modes**: Radial (default), hierarchical, or layered
- **22 Artifact Types**: Helm charts, deployments, configmaps, databases, queues, and more
- **Expandable Child Nodes**: Nested artifacts with expand/collapse
- **Step-Based Focus**: Zoom and highlight specific artifacts per step
- **Annotations**: Key-value metadata displayed on hover
- **Dark Mode**: Full dark theme support

## Quick Start

```yaml
title: "My Service - Deployment View"
version: 2
type: bc-deployment

bc:
  id: my-service
  name: "My Service"
  icon: "📦"
  events:
    publishes: [OrderCreatedEvent]
    subscribes: [PaymentCompletedEvent]

artifacts:
  - id: helm-chart
    artifactType: helm-chart
    name: "my-service"
    layer: 1
    children:
      - id: deployment
        type: deployment
        name: "my-api"

  - id: database
    artifactType: database
    name: "my-db"
    layer: 2

edges:
  - source: deployment
    target: database
    type: depends

steps:
  - title: "Overview"
    description: "My Service deployment structure"
    focusNodes: [helm-chart]
    expandNodes: [helm-chart]
```

## Schema Reference

### Story Root

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | string | ✅ | Story title |
| `version` | number | ✅ | Schema version (always `2`) |
| `type` | literal | ✅ | Must be `bc-deployment` |
| `layout` | LayoutConfig | ❌ | Layout configuration |
| `theme` | ThemeConfig | ❌ | Theme configuration |
| `bc` | BCCoreNode | ✅ | The central bounded context |
| `artifacts` | ArtifactNode[] | ✅ | Deployment artifacts |
| `edges` | Edge[] | ✅ | Connections between nodes |
| `steps` | Step[] | ✅ | Step-by-step walkthrough |

### Layout Configuration

```yaml
layout:
  mode: radial | hierarchical | layered
  centerSize: 120        # BC node size (pixels)
  ringSpacing: 140       # Distance between rings
  childLayout: nested | expanded | clustered
```

| Mode | Description |
|------|-------------|
| `radial` | Artifacts orbit around BC in concentric rings |
| `hierarchical` | Tree structure with BC at top |
| `layered` | Horizontal left-to-right layers |

### BC Core Node

```yaml
bc:
  id: order-service
  name: "Order Service"
  icon: "🛒"
  description: "Handles order lifecycle"
  color: "#4CAF50"
  events:
    publishes:
      - OrderCreatedEvent
    subscribes:
      - PaymentCompletedEvent
  metrics:
    replicas: 3
    cpu: "500m"
    memory: "512Mi"
```

### Artifact Types (22 total)

#### Kubernetes (14)

| Type | Icon | Use Case |
|------|------|----------|
| `helm-chart` | 📦 | Helm chart package |
| `values-yaml` | ⚙️ | Values override file |
| `deployment` | 🚀 | K8s Deployment |
| `statefulset` | 🗄️ | K8s StatefulSet |
| `service` | 🔌 | K8s Service |
| `ingress` | 🌐 | K8s Ingress |
| `configmap` | 📋 | K8s ConfigMap |
| `secret` | 🔐 | K8s Secret |
| `hpa` | 📈 | HorizontalPodAutoscaler |
| `pdb` | 🛡️ | PodDisruptionBudget |
| `serviceaccount` | 👤 | K8s ServiceAccount |
| `cronjob` | ⏰ | K8s CronJob |
| `job` | ▶️ | K8s Job |
| `pvc` | 💾 | PersistentVolumeClaim |

#### Infrastructure (4)

| Type | Icon | Use Case |
|------|------|----------|
| `dockerfile` | 🐳 | Container definition |
| `terraform` | 🏗️ | IaC module |
| `database` | 🗃️ | Database resource |
| `cache` | ⚡ | Cache layer (Redis) |

#### Integration (4)

| Type | Icon | Use Case |
|------|------|----------|
| `queue` | 📬 | Message queue |
| `external` | 🔗 | External dependency |
| `pipeline` | 🔄 | CI/CD pipeline |
| `monitoring` | 📊 | Observability config |

### Artifact Node

```yaml
- id: helm-chart
  artifactType: helm-chart
  name: "order-service"
  path: "charts/order-service"
  description: "Main Helm chart"
  layer: 1
  children:
    - id: api-deployment
      type: deployment
      name: "order-api"
      annotations:
        replicas: "3"
  annotations:
    version: "1.5.0"
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | ✅ | Unique identifier |
| `artifactType` | enum | ✅ | One of 22 artifact types |
| `name` | string | ✅ | Display name |
| `path` | string | ❌ | File path in repository |
| `description` | string | ❌ | Hover description |
| `layer` | number | ❌ | Ring layer (1=closest to BC) |
| `children` | ChildArtifact[] | ❌ | Nested artifacts |
| `annotations` | Record | ❌ | Key-value metadata |

### Edge Types (8)

| Type | Description | Style |
|------|-------------|-------|
| `contains` | BC/chart contains artifact | Solid gray |
| `configures` | Configures another artifact | Dashed orange |
| `overrides` | Values override base | Dashed green |
| `mounts` | Mounts secret/configmap | Dashed purple |
| `depends` | Depends on resource | Dashed red |
| `exposes` | Service exposes deployment | Solid blue |
| `scales` | HPA scales deployment | Dashed green |
| `triggers` | Event triggers action | Dashed pink |

```yaml
edges:
  - source: deployment
    target: configmap
    type: mounts
    label: "env vars"
    animated: true
```

### Steps

```yaml
steps:
  - title: "Helm Chart Overview"
    description: "The service is packaged as a Helm chart"
    focusNodes:
      - helm-chart
    activeEdges:
      - helm-chart->values-prod
    zoomLevel: 1.2
    expandNodes:
      - helm-chart
    highlightPaths:
      - charts/order-service/values.yaml
    duration: 5000
    narration:
      speaker: "DevOps Lead"
      message: "Let's start with the Helm chart structure"
      position: right
```

| Field | Type | Description |
|-------|------|-------------|
| `title` | string | Step title |
| `description` | string | Step description |
| `focusNodes` | string[] | Nodes to highlight |
| `activeEdges` | string[] | Edges to animate |
| `zoomLevel` | number | Zoom (1=normal, 1.2=zoom in) |
| `expandNodes` | string[] | Nodes to auto-expand |
| `highlightPaths` | string[] | File paths to emphasize |
| `duration` | number | Auto-advance duration (ms) |
| `narration` | object | Optional speaker bubble |

## Examples

### Complete Order Service

See `stories/bc-deployment/order-service.yaml` for a full example with:
- Helm chart with child deployments
- Multiple layers (core, config, infrastructure)
- All edge types
- Step-by-step walkthrough

### API Gateway Pattern

See `stories/bc-deployment/api-gateway.yaml` for:
- Gateway with multiple backends
- Ingress routing
- Certificate management
- External dependencies

## Layout Modes

### Radial (Default)

```yaml
layout:
  mode: radial
```

Artifacts positioned in concentric rings:
- Layer 1: Inner ring (closest to BC)
- Layer 2: Middle ring
- Layer 3+: Outer rings

Best for: Understanding deployment topology from the BC perspective.

### Hierarchical

```yaml
layout:
  mode: hierarchical
```

Tree structure flowing top-to-bottom:
- BC at the top
- Layers as horizontal rows
- Children indented under parents

Best for: Documentation and dependency visualization.

### Layered

```yaml
layout:
  mode: layered
```

Horizontal flow left-to-right:
- BC on the left
- Layers as vertical columns
- Children stacked to the right

Best for: Pipeline-style deployments and CI/CD visualization.

## Tips

1. **Use layers strategically**: Put core artifacts (helm-chart, deployment) in layer 1, config in layer 2, infrastructure in layer 3.

2. **Leverage children**: Nest related resources under their parent (e.g., deployments under helm-chart).

3. **Add annotations**: Key-value metadata shows on hover and helps LLMs understand resource configuration.

4. **Use expandNodes in steps**: Auto-expand parent artifacts to reveal children progressively.

5. **Match edge types**: Use semantic edge types (`mounts`, `depends`, `exposes`) for clarity.

## Integration with LLMs

BC Deployment stories are LLM-friendly. See the [LLM Integration Guide](./llm-integration.md) for:
- Example prompts
- Schema reference
- Agent workflows
