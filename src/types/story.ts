/**
 * User Story Visualization Engine - Data Model
 * 
 * These types define the structure of user story YAML/JSON files
 * that can be loaded and visualized by the engine.
 * 
 * Supports both v1 (basic flow) and v2 (architectural) schemas.
 */

// ============================================================================
// Architectural Schema Extensions (v2)
// ============================================================================

/**
 * Bounded context definition for architectural stories
 */
export interface BoundedContextDef {
  /** Unique identifier */
  id: string;
  /** Display name */
  name: string;
  /** Short name for compact views */
  shortName?: string;
  /** Color for visual styling */
  color?: string;
  /** Icon key */
  icon?: string;
}

/**
 * Orchestration workflow definition (Conductor/Saga)
 */
export interface OrchestrationDef {
  /** Unique identifier */
  id: string;
  /** Display name */
  name: string;
  /** Type of orchestration */
  type: 'conductor' | 'saga' | 'choreography';
  /** Workflow steps */
  steps: OrchestrationStep[];
}

/**
 * A step in an orchestration workflow
 */
export interface OrchestrationStep {
  /** Unique identifier */
  id: string;
  /** Display name */
  name: string;
  /** Target bounded context */
  targetBC: string;
  /** Compensation step ID (for saga rollback) */
  compensation?: string;
}

/**
 * Infrastructure element definition
 */
export interface InfrastructureElement {
  /** Unique identifier */
  id: string;
  /** Type of infrastructure */
  type: 'bus' | 'topic' | 'queue' | 'database' | 'cache' | 'external';
  /** Display name */
  name: string;
  /** Parent element ID (for topics within a bus, etc.) */
  parentId?: string;
}

/**
 * Layer assignment for architectural layout
 */
export type Layer = 'orchestration' | 'domain' | 'infrastructure';

/**
 * Zoom level visibility control
 */
export type ZoomLevel = 'executive' | 'manager' | 'engineer';

/**
 * Event in a step (architectural schema)
 */
export interface StepEvent {
  /** Event type name */
  type: string;
  /** Source (BC ID, 'external', or 'conductor') */
  from: string;
  /** Target BC ID */
  to: string;
  /** Optional payload for tooltips */
  payload?: Record<string, unknown>;
}

/**
 * Command in a step (architectural schema)
 */
export interface StepCommand {
  /** Command type name */
  type: string;
  /** Source (usually 'conductor') */
  from: string;
  /** Target BC ID */
  to: string;
  /** Optional payload */
  payload?: Record<string, unknown>;
}

// ============================================================================
// Core Types (v1 + v2 compatible)
// ============================================================================

/** A complete user story definition */
export interface UserStory {
  /** Unique identifier for the story */
  id: string;
  /** Display title */
  title: string;
  /** Brief description of the story */
  description?: string;
  /** Which bounded context this story belongs to (v1) or 'Architecture' (v2) */
  context?: string;
  /** @deprecated Use context instead */
  boundedContext?: string;
  /** Version of the story definition */
  version?: string;
  
  // Architectural extensions (v2)
  /** Schema version ('1.0' or '2.0') */
  schemaVersion?: string;
  /** Preferred renderer ('flow' or 'architectural') */
  renderer?: string;
  /** Bounded contexts participating in this story */
  boundedContexts?: BoundedContextDef[];
  /** Orchestration workflow definition */
  orchestration?: OrchestrationDef;
  /** Infrastructure elements */
  infrastructure?: InfrastructureElement[];
  
  // Core collections
  /** Actors involved in the story */
  actors: Actor[];
  /** Nodes (visual elements) in the story */
  nodes: StoryNode[];
  /** Edges (connections) between nodes */
  edges: StoryEdge[];
  /** Steps that define the animation sequence */
  steps: StoryStep[];
}

/** An actor (person or system) in the story */
export interface Actor {
  /** Unique identifier */
  id: string;
  /** Display name */
  name: string;
  /** Type of actor */
  type: 'user' | 'system' | 'external' | 'orchestrator' | 'service';
  /** Avatar (URL or emoji) */
  avatar?: string;
  /** Color for visual styling */
  color?: string;
  /** Bounded context this actor belongs to (v2) */
  boundedContext?: string;
}

/** Node types supported by the visualization */
export type StoryNodeType = 
  // Basic types (v1)
  | 'actor'       // Person or system avatar
  | 'action'      // User action (rounded rectangle)
  | 'decision'    // Decision point (diamond)
  | 'system'      // System process (rectangle with gear)
  | 'event'       // Domain event (lightning badge)
  | 'state'       // Status/state (pill shape)
  | 'start'       // Start node
  | 'end'         // End node
  | 'integration' // External integration
  // Architectural types (v2)
  | 'orchestrator-step'  // Conductor workflow step
  | 'infrastructure'     // Infrastructure element (bus, queue, etc.)
  | 'aggregate'          // DDD aggregate
  | 'service'            // Domain service
  | 'external';          // External system

/** Effect configuration for a node */
export interface NodeEffect {
  /** Effect type (pulse, glow, shake, emoji-explosion, particles, etc.) */
  type: string;
  /** Trigger condition */
  trigger?: 'on-reveal' | 'on-focus' | 'on-blur' | 'on-click' | 'on-hover' | 'continuous' | 'manual';
  /** Effect-specific parameters */
  params?: Record<string, unknown>;
  /** Delay before effect starts (ms) */
  delay?: number;
  /** Chained effects to run after this one */
  then?: NodeEffect[];
}

/** Node size preset */
export type NodeSizePreset = 'xs' | 's' | 'm' | 'l' | 'xl';

/** A node in the story graph */
export interface StoryNode {
  /** Unique identifier */
  id: string;
  /** Type of node (determines rendering) */
  type: StoryNodeType;
  /** Associated actor ID (for actor/action nodes) */
  actorId?: string;
  /** @deprecated Use actorId instead */
  actor?: string;
  /** Display label */
  label: string;
  /** Detailed description (shown on hover/click) */
  description?: string;
  /** Position on canvas (ignored by auto-layout renderers) */
  position: { x: number; y: number };
  /** Size preset (xs, s, m, l, xl) - defaults by node type */
  size?: NodeSizePreset;
  /** Additional data for rendering */
  data?: Record<string, unknown>;
  /** Effects to attach to this node */
  effects?: NodeEffect[];
  
  // Architectural extensions (v2)
  /** Bounded context this node belongs to */
  boundedContext?: string;
  /** Layer for layout positioning */
  layer?: Layer;
  /** Minimum zoom level to show this node */
  zoomLevel?: ZoomLevel;
  /** Link to orchestration step (for orchestrator-step nodes) */
  orchestrationStepId?: string;
  /** Link to infrastructure element (for infrastructure nodes) */
  infrastructureId?: string;
}

/** Edge types supported by the visualization */
export type StoryEdgeType = 
  // Basic types (v1)
  | 'flow'    // Standard flow (solid arrow)
  | 'event'   // Event trigger (dashed with lightning)
  | 'error'   // Error path (red dashed)
  | 'async'   // Async operation (dotted)
  // Architectural types (v2)
  | 'command'       // Command from orchestrator
  | 'query'         // Query/read operation
  | 'compensation'; // Saga compensation

/** Anchor position for edge connections */
export type EdgeAnchor = 'top' | 'bottom' | 'left' | 'right' | 'auto';

/** An edge connecting two nodes */
export interface StoryEdge {
  /** Unique identifier */
  id: string;
  /** Source node ID */
  source: string;
  /** Target node ID */
  target: string;
  /** Type of edge (determines styling) */
  type: StoryEdgeType;
  /** Optional label on the edge */
  label?: string;
  /** Whether edge should animate by default */
  animated?: boolean;
  /** Where the edge exits the source node (default: auto) */
  sourceAnchor?: EdgeAnchor;
  /** Where the edge enters the target node (default: auto) */
  targetAnchor?: EdgeAnchor;
  
  // Architectural extensions (v2)
  /** Whether this edge crosses BC boundaries */
  crossBC?: boolean;
  /** Event type classification */
  eventType?: 'domain' | 'integration' | 'infrastructure';
  /** Route this edge through an infrastructure element */
  routeVia?: string;
  /** Minimum zoom level to show this edge */
  zoomLevel?: ZoomLevel;
}

/** A step in the story playback sequence */
export interface StoryStep {
  /** Unique identifier */
  id: string;
  /** Order in the sequence (1-indexed) - optional if using array order */
  order?: number;
  /** Step title */
  title?: string;
  /** Node IDs that are active/visible in this step */
  nodeIds?: string[];
  /** @deprecated Use nodeIds instead */
  activeNodes?: string[];
  /** Edge IDs that are active/visible in this step */
  edgeIds?: string[];
  /** @deprecated Use edgeIds instead */
  activeEdges?: string[];
  /** Narrative text shown in the story panel */
  narrative: string;
  /** Duration before auto-advancing (ms) */
  duration?: number;
  
  // Architectural extensions (v2)
  /** Bounded contexts that are active in this step */
  activeBCs?: string[];
  /** Current orchestration step ID */
  orchestrationStep?: string;
  /** Events occurring in this step */
  events?: StepEvent[];
  /** Commands dispatched in this step */
  commands?: StepCommand[];
}

// ============================================================================
// Utility Types
// ============================================================================

/** State of a node during playback */
export type NodeState = 'inactive' | 'active' | 'complete';

/** State of an edge during playback */
export type EdgeState = 'inactive' | 'active';

/** Validation result for story parsing */
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[] | string[];
  warnings?: string[];
}

/** A validation error */
export interface ValidationError {
  path: string;
  message: string;
}

/** Position coordinates */
export interface Position {
  x: number;
  y: number;
}

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Check if a story uses the architectural schema (v2)
 */
export function isArchitecturalStory(story: UserStory): boolean {
  return (
    story.schemaVersion === '2.0' ||
    story.renderer === 'architectural' ||
    !!story.boundedContexts ||
    !!story.orchestration ||
    !!story.infrastructure
  );
}

/**
 * Check if a node is an architectural type
 */
export function isArchitecturalNode(node: StoryNode): boolean {
  return (
    node.type === 'orchestrator-step' ||
    node.type === 'infrastructure' ||
    node.type === 'aggregate' ||
    node.type === 'service' ||
    node.type === 'external' ||
    !!node.boundedContext ||
    !!node.layer
  );
}
