/**
 * Architectural Story Validator
 * 
 * Additional validation rules specific to architectural (v2) stories.
 * Per SPEC-004: specs/architectural-schema.md Section 6.
 */

import type { UserStory, StoryNode, StoryEdge } from '../types/story';

export interface ArchitecturalValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validate an architectural story with domain-specific rules.
 * 
 * Rules from SPEC-004:
 * - Node without boundedContext → warning
 * - Reference to undefined BC → error
 * - Orchestration step without targetBC → error
 * - Cross-BC edge without routeVia → warning
 * - Missing activeBCs in step → warning
 */
export function validateArchitecturalStory(story: UserStory): ArchitecturalValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Build set of valid BC IDs
  const bcIds = new Set<string>(['external', 'default']);
  if (story.boundedContexts) {
    for (const bc of story.boundedContexts) {
      bcIds.add(bc.id);
    }
  }
  
  // Build set of valid infrastructure IDs
  const infraIds = new Set<string>();
  if (story.infrastructure) {
    for (const infra of story.infrastructure) {
      infraIds.add(infra.id);
    }
  }
  
  // Build map of node ID → BC
  const nodeBCMap = new Map<string, string>();
  
  // Validate nodes
  for (const node of story.nodes) {
    if (!node.boundedContext) {
      warnings.push(`Node '${node.id}' has no boundedContext, will use 'default'`);
      nodeBCMap.set(node.id, 'default');
    } else if (!bcIds.has(node.boundedContext)) {
      errors.push(`Node '${node.id}' references undefined BC '${node.boundedContext}'`);
    } else {
      nodeBCMap.set(node.id, node.boundedContext);
    }
    
    // Validate orchestrator-step nodes have orchestrationStepId
    if (node.type === 'orchestrator-step' && !node.orchestrationStepId) {
      warnings.push(`Orchestrator-step node '${node.id}' missing orchestrationStepId`);
    }
    
    // Validate infrastructure nodes have infrastructureId
    if (node.type === 'infrastructure' && !node.infrastructureId) {
      warnings.push(`Infrastructure node '${node.id}' missing infrastructureId`);
    }
    
    // Validate infrastructureId references exist
    if (node.infrastructureId && !infraIds.has(node.infrastructureId)) {
      errors.push(`Node '${node.id}' references undefined infrastructure '${node.infrastructureId}'`);
    }
  }
  
  // Validate orchestration steps
  if (story.orchestration) {
    for (const step of story.orchestration.steps) {
      if (!step.targetBC) {
        errors.push(`Orchestration step '${step.id}' missing targetBC`);
      } else if (!bcIds.has(step.targetBC)) {
        errors.push(`Orchestration step '${step.id}' references undefined BC '${step.targetBC}'`);
      }
      
      // Validate compensation step references
      if (step.compensation) {
        const compensationExists = story.orchestration.steps.some(s => s.id === step.compensation);
        if (!compensationExists) {
          errors.push(`Orchestration step '${step.id}' references undefined compensation step '${step.compensation}'`);
        }
      }
    }
  }
  
  // Validate edges
  for (const edge of story.edges) {
    const sourceBC = nodeBCMap.get(edge.source);
    const targetBC = nodeBCMap.get(edge.target);
    
    // Check for cross-BC edges
    const isCrossBC = sourceBC && targetBC && sourceBC !== targetBC;
    
    if (isCrossBC) {
      // Explicit crossBC should match computed value
      if (edge.crossBC === false) {
        warnings.push(`Edge '${edge.id}' crosses BCs (${sourceBC} → ${targetBC}) but crossBC is false`);
      }
      
      // Cross-BC event edges should have routeVia
      if (edge.type === 'event' && !edge.routeVia) {
        warnings.push(`Edge '${edge.id}' crosses BCs without routeVia infrastructure`);
      }
    }
    
    // Validate routeVia references
    if (edge.routeVia && !infraIds.has(edge.routeVia)) {
      errors.push(`Edge '${edge.id}' routeVia references undefined infrastructure '${edge.routeVia}'`);
    }
  }
  
  // Validate steps
  for (const step of story.steps) {
    // Check for activeBCs
    if (!step.activeBCs || step.activeBCs.length === 0) {
      warnings.push(`Step '${step.id}' has no activeBCs, will be inferred from active nodes`);
    } else {
      // Validate activeBCs references
      for (const bcId of step.activeBCs) {
        if (!bcIds.has(bcId)) {
          errors.push(`Step '${step.id}' references undefined BC '${bcId}' in activeBCs`);
        }
      }
    }
    
    // Validate orchestrationStep reference
    if (step.orchestrationStep && story.orchestration) {
      const stepExists = story.orchestration.steps.some(s => s.id === step.orchestrationStep);
      if (!stepExists) {
        errors.push(`Step '${step.id}' references undefined orchestration step '${step.orchestrationStep}'`);
      }
    }
    
    // Validate events
    if (step.events) {
      for (const event of step.events) {
        if (!bcIds.has(event.from) && event.from !== 'conductor') {
          errors.push(`Step '${step.id}' event has undefined source BC '${event.from}'`);
        }
        if (!bcIds.has(event.to)) {
          errors.push(`Step '${step.id}' event has undefined target BC '${event.to}'`);
        }
      }
    }
    
    // Validate commands
    if (step.commands) {
      for (const command of step.commands) {
        if (!bcIds.has(command.to)) {
          errors.push(`Step '${step.id}' command has undefined target BC '${command.to}'`);
        }
      }
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Infer activeBCs for a step from its active nodes
 */
export function inferActiveBCs(
  step: { nodeIds?: string[]; activeNodes?: string[] },
  nodes: StoryNode[]
): string[] {
  const nodeIds = step.nodeIds ?? step.activeNodes ?? [];
  const bcs = new Set<string>();
  
  for (const nodeId of nodeIds) {
    const node = nodes.find(n => n.id === nodeId);
    if (node?.boundedContext) {
      bcs.add(node.boundedContext);
    }
  }
  
  return Array.from(bcs);
}

/**
 * Check if an edge crosses bounded context boundaries
 */
export function isCrossBCEdge(
  edge: StoryEdge,
  nodes: StoryNode[]
): boolean {
  const sourceNode = nodes.find(n => n.id === edge.source);
  const targetNode = nodes.find(n => n.id === edge.target);
  
  if (!sourceNode?.boundedContext || !targetNode?.boundedContext) {
    return false;
  }
  
  return sourceNode.boundedContext !== targetNode.boundedContext;
}

/**
 * Upgrade a v1 story to v2 architectural format
 * Migration helper per SPEC-004 Section 4.2
 */
export function migrateToV2(story: UserStory): UserStory {
  // Already v2? Return as-is
  if (story.schemaVersion === '2.0' || story.boundedContexts) {
    return story;
  }
  
  const defaultBC = story.context || story.boundedContext || 'Default';
  
  return {
    ...story,
    schemaVersion: '2.0',
    boundedContexts: [
      { id: 'default', name: defaultBC }
    ],
    nodes: story.nodes.map(n => ({
      ...n,
      boundedContext: n.boundedContext ?? 'default',
      layer: n.layer ?? 'domain',
      zoomLevel: n.zoomLevel ?? 'engineer',
    })),
    edges: story.edges.map(e => ({
      ...e,
      zoomLevel: e.zoomLevel ?? 'engineer',
    })),
    steps: story.steps.map(s => ({
      ...s,
      activeBCs: s.activeBCs ?? ['default'],
    })),
  };
}
