import YAML from 'yaml';
import type { UserStory, ValidationResult, ValidationError, StoryStep } from '../types/story';

// Valid types for v1 schema
const V1_ACTOR_TYPES = ['user', 'system', 'external'];
const V1_NODE_TYPES = ['actor', 'action', 'decision', 'system', 'event', 'state', 'start', 'end', 'integration'];
const V1_EDGE_TYPES = ['flow', 'event', 'error', 'async'];

// Additional types for v2 (architectural) schema
const V2_ACTOR_TYPES = [...V1_ACTOR_TYPES, 'orchestrator', 'service'];
const V2_NODE_TYPES = [
  ...V1_NODE_TYPES, 
  'orchestrator-step', 'infrastructure', 'aggregate', 'service', 'external',
  // Extended types for architectural stories
  'conductor', 'handler', 'bus', 'entity'
];
const V2_EDGE_TYPES = [
  ...V1_EDGE_TYPES, 
  'command', 'query', 'compensation',
  // Extended types for architectural stories
  'action', 'integration'
];

/**
 * Determine if a story uses the v2 (architectural) schema
 */
function isV2Schema(story: Record<string, unknown>): boolean {
  return (
    story.schemaVersion === '2.0' ||
    story.renderer === 'architectural' ||
    !!story.boundedContexts ||
    !!story.orchestration ||
    !!story.infrastructure
  );
}

/**
 * Normalize step fields for backward compatibility
 * Handles both v1 (nodeIds, edgeIds) and v2 (activeNodes, activeEdges) formats
 */
function normalizeStep(step: Record<string, unknown>, index: number): StoryStep {
  return {
    id: step.id as string,
    order: (step.order as number) ?? index + 1,
    title: step.title as string | undefined,
    nodeIds: (step.nodeIds ?? step.activeNodes) as string[] | undefined,
    activeNodes: (step.activeNodes ?? step.nodeIds) as string[] | undefined,
    edgeIds: (step.edgeIds ?? step.activeEdges) as string[] | undefined,
    activeEdges: (step.activeEdges ?? step.edgeIds) as string[] | undefined,
    narrative: step.narrative as string,
    duration: step.duration as number | undefined,
    // V2 fields
    activeBCs: step.activeBCs as string[] | undefined,
    orchestrationStep: step.orchestrationStep as string | undefined,
    events: step.events as StoryStep['events'],
    commands: step.commands as StoryStep['commands'],
  };
}

/**
 * Parse a YAML or JSON string into a UserStory object.
 * Validates the structure and returns errors if invalid.
 * 
 * Supports both v1 (basic flow) and v2 (architectural) schemas.
 */
export function parseStory(content: string): { story: UserStory | null; validation: ValidationResult } {
  const errors: ValidationError[] = [];
  const warnings: string[] = [];
  
  let parsed: unknown;
  try {
    // Try YAML first (also handles JSON)
    parsed = YAML.parse(content);
  } catch (e) {
    return {
      story: null,
      validation: {
        valid: false,
        errors: [{ path: 'root', message: `Parse error: ${e instanceof Error ? e.message : 'Unknown error'}` }],
      },
    };
  }

  // Validate structure
  if (!parsed || typeof parsed !== 'object') {
    return {
      story: null,
      validation: {
        valid: false,
        errors: [{ path: 'root', message: 'Story must be an object' }],
      },
    };
  }

  const story = parsed as Record<string, unknown>;
  const isV2 = isV2Schema(story);
  
  // Select valid types based on schema version
  const validActorTypes = isV2 ? V2_ACTOR_TYPES : V1_ACTOR_TYPES;
  const validNodeTypes = isV2 ? V2_NODE_TYPES : V1_NODE_TYPES;
  const validEdgeTypes = isV2 ? V2_EDGE_TYPES : V1_EDGE_TYPES;

  // Required fields (relaxed for v2)
  const requiredFields = ['id', 'title', 'actors', 'nodes', 'edges', 'steps'];
  for (const field of requiredFields) {
    if (!(field in story)) {
      errors.push({ path: field, message: `Missing required field: ${field}` });
    }
  }

  // Check for context field (either context or boundedContext)
  if (!story.context && !story.boundedContext && !isV2) {
    warnings.push('Story has no context or boundedContext field');
  }

  // Validate boundedContexts (v2)
  if (isV2 && story.boundedContexts) {
    if (!Array.isArray(story.boundedContexts)) {
      errors.push({ path: 'boundedContexts', message: 'boundedContexts must be an array' });
    } else {
      (story.boundedContexts as unknown[]).forEach((bc: unknown, i: number) => {
        if (typeof bc !== 'object' || bc === null) {
          errors.push({ path: `boundedContexts[${i}]`, message: 'Bounded context must be an object' });
          return;
        }
        const b = bc as Record<string, unknown>;
        if (!b.id) errors.push({ path: `boundedContexts[${i}].id`, message: 'Bounded context missing id' });
        if (!b.name) errors.push({ path: `boundedContexts[${i}].name`, message: 'Bounded context missing name' });
      });
    }
  }

  // Validate orchestration (v2) - flexible format
  if (isV2 && story.orchestration) {
    const orch = story.orchestration as Record<string, unknown>;
    // Support both strict format (id, name, type) and flexible format (conductor, steps)
    const hasStrictFormat = orch.id || orch.name || orch.type;
    
    if (hasStrictFormat) {
      if (!orch.id) errors.push({ path: 'orchestration.id', message: 'Orchestration missing id' });
      if (!orch.name) errors.push({ path: 'orchestration.name', message: 'Orchestration missing name' });
      if (!orch.type || !['conductor', 'saga', 'choreography'].includes(orch.type as string)) {
        errors.push({ path: 'orchestration.type', message: 'Orchestration type must be conductor, saga, or choreography' });
      }
      if (orch.steps && Array.isArray(orch.steps)) {
        (orch.steps as unknown[]).forEach((step: unknown, i: number) => {
          if (typeof step !== 'object' || step === null) return;
          const s = step as Record<string, unknown>;
          if (!s.id) errors.push({ path: `orchestration.steps[${i}].id`, message: 'Orchestration step missing id' });
          if (!s.targetBC) errors.push({ path: `orchestration.steps[${i}].targetBC`, message: 'Orchestration step missing targetBC' });
        });
      }
    }
    // Flexible format is valid as-is (conductor name + steps with id/name/description)
  }

  // Validate infrastructure (v2) - support both array and object formats
  if (isV2 && story.infrastructure) {
    if (Array.isArray(story.infrastructure)) {
      const validInfraTypes = ['bus', 'topic', 'queue', 'database', 'cache', 'external'];
      (story.infrastructure as unknown[]).forEach((infra: unknown, i: number) => {
        if (typeof infra !== 'object' || infra === null) {
          errors.push({ path: `infrastructure[${i}]`, message: 'Infrastructure element must be an object' });
          return;
        }
        const inf = infra as Record<string, unknown>;
        if (!inf.id) errors.push({ path: `infrastructure[${i}].id`, message: 'Infrastructure element missing id' });
        if (!inf.type || !validInfraTypes.includes(inf.type as string)) {
          errors.push({ path: `infrastructure[${i}].type`, message: `Infrastructure type must be one of: ${validInfraTypes.join(', ')}` });
        }
      });
    }
  }

  // Validate actors
  if (Array.isArray(story.actors)) {
    story.actors.forEach((actor: unknown, i: number) => {
      if (typeof actor !== 'object' || actor === null) {
        errors.push({ path: `actors[${i}]`, message: 'Actor must be an object' });
        return;
      }
      const a = actor as Record<string, unknown>;
      if (!a.id) errors.push({ path: `actors[${i}].id`, message: 'Actor missing id' });
      if (!a.name) errors.push({ path: `actors[${i}].name`, message: 'Actor missing name' });
      // Type is optional in v2 schema - icon can substitute
      if (a.type && !validActorTypes.includes(a.type as string)) {
        errors.push({ path: `actors[${i}].type`, message: `Actor type must be one of: ${validActorTypes.join(', ')}` });
      }
    });
  }

  // Validate nodes
  if (Array.isArray(story.nodes)) {
    story.nodes.forEach((node: unknown, i: number) => {
      if (typeof node !== 'object' || node === null) {
        errors.push({ path: `nodes[${i}]`, message: 'Node must be an object' });
        return;
      }
      const n = node as Record<string, unknown>;
      if (!n.id) errors.push({ path: `nodes[${i}].id`, message: 'Node missing id' });
      if (!n.type || !validNodeTypes.includes(n.type as string)) {
        errors.push({ path: `nodes[${i}].type`, message: `Node type must be one of: ${validNodeTypes.join(', ')}` });
      }
      if (!n.label) errors.push({ path: `nodes[${i}].label`, message: 'Node missing label' });
      // Position required for v1, optional for v2 (auto-layout)
      if (!isV2 && (!n.position || typeof n.position !== 'object')) {
        errors.push({ path: `nodes[${i}].position`, message: 'Node missing position {x, y}' });
      }
      
      // V2 validations
      if (isV2) {
        const validLayers = ['orchestration', 'domain', 'infrastructure'];
        const validZoomLevels = ['executive', 'manager', 'engineer'];
        
        if (n.layer && !validLayers.includes(n.layer as string)) {
          warnings.push(`Node ${n.id}: layer should be one of: ${validLayers.join(', ')}`);
        }
        if (n.zoomLevel && !validZoomLevels.includes(n.zoomLevel as string)) {
          warnings.push(`Node ${n.id}: zoomLevel should be one of: ${validZoomLevels.join(', ')}`);
        }
      }
    });
  }

  // Validate edges
  if (Array.isArray(story.edges)) {
    const nodeIds = new Set((story.nodes as Array<{ id: string }>)?.map(n => n.id) || []);
    const actorIds = new Set((story.actors as Array<{ id: string }>)?.map(a => a.id) || []);
    const validIds = new Set([...nodeIds, ...actorIds]);
    
    story.edges.forEach((edge: unknown, i: number) => {
      if (typeof edge !== 'object' || edge === null) {
        errors.push({ path: `edges[${i}]`, message: 'Edge must be an object' });
        return;
      }
      const e = edge as Record<string, unknown>;
      if (!e.id) errors.push({ path: `edges[${i}].id`, message: 'Edge missing id' });
      if (!e.source) errors.push({ path: `edges[${i}].source`, message: 'Edge missing source' });
      if (!e.target) errors.push({ path: `edges[${i}].target`, message: 'Edge missing target' });
      if (!e.type || !validEdgeTypes.includes(e.type as string)) {
        errors.push({ path: `edges[${i}].type`, message: `Edge type must be one of: ${validEdgeTypes.join(', ')}` });
      }
      // Validate source/target exist (in nodes or actors)
      if (e.source && !validIds.has(e.source as string)) {
        errors.push({ path: `edges[${i}].source`, message: `Edge source "${e.source}" not found in nodes or actors` });
      }
      if (e.target && !validIds.has(e.target as string)) {
        errors.push({ path: `edges[${i}].target`, message: `Edge target "${e.target}" not found in nodes or actors` });
      }
    });
  }

  // Validate steps (flexible for both v1 and v2)
  if (Array.isArray(story.steps)) {
    story.steps.forEach((step: unknown, i: number) => {
      if (typeof step !== 'object' || step === null) {
        errors.push({ path: `steps[${i}]`, message: 'Step must be an object' });
        return;
      }
      const s = step as Record<string, unknown>;
      if (!s.id) errors.push({ path: `steps[${i}].id`, message: 'Step missing id' });
      
      // Check for node IDs (either nodeIds or activeNodes)
      const hasNodeIds = Array.isArray(s.nodeIds) || Array.isArray(s.activeNodes);
      if (!hasNodeIds) {
        errors.push({ path: `steps[${i}]`, message: 'Step missing nodeIds or activeNodes array' });
      }
      
      // Check for edge IDs (either edgeIds or activeEdges)
      const hasEdgeIds = Array.isArray(s.edgeIds) || Array.isArray(s.activeEdges);
      if (!hasEdgeIds) {
        errors.push({ path: `steps[${i}]`, message: 'Step missing edgeIds or activeEdges array' });
      }
      
      if (!s.narrative) errors.push({ path: `steps[${i}].narrative`, message: 'Step missing narrative' });
    });
    
    // Normalize steps for consistent access
    story.steps = (story.steps as unknown[]).map((s, i) => normalizeStep(s as Record<string, unknown>, i));
  }

  if (errors.length > 0) {
    return { story: null, validation: { valid: false, errors, warnings } };
  }

  // Normalize context field
  if (!story.context && story.boundedContext) {
    story.context = story.boundedContext;
  }

  return { 
    story: story as unknown as UserStory, 
    validation: { valid: true, errors: [], warnings: warnings.length > 0 ? warnings : undefined } 
  };
}

/**
 * Validate a parsed story object
 */
export function validateStory(story: UserStory): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Basic validation
  if (!story.id) errors.push('Missing story id');
  if (!story.title) errors.push('Missing story title');
  if (!story.actors?.length) errors.push('Story has no actors');
  if (!story.nodes?.length) errors.push('Story has no nodes');
  if (!story.edges?.length) warnings.push('Story has no edges');
  if (!story.steps?.length) errors.push('Story has no steps');

  // Check for orphan nodes (not referenced in any step)
  const referencedNodes = new Set<string>();
  story.steps?.forEach(step => {
    const nodeIds = step.nodeIds ?? step.activeNodes ?? [];
    nodeIds.forEach(id => referencedNodes.add(id));
  });
  
  story.nodes?.forEach(node => {
    if (!referencedNodes.has(node.id)) {
      warnings.push(`Node "${node.id}" is never activated in any step`);
    }
  });

  return {
    valid: errors.length === 0,
    errors,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}

/**
 * Load a story from a URL or file path.
 */
export async function loadStory(url: string): Promise<{ story: UserStory | null; validation: ValidationResult }> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      return {
        story: null,
        validation: {
          valid: false,
          errors: [{ path: 'url', message: `Failed to fetch: ${response.status} ${response.statusText}` }],
        },
      };
    }
    const content = await response.text();
    return parseStory(content);
  } catch (e) {
    return {
      story: null,
      validation: {
        valid: false,
        errors: [{ path: 'url', message: `Fetch error: ${e instanceof Error ? e.message : 'Unknown error'}` }],
      },
    };
  }
}
