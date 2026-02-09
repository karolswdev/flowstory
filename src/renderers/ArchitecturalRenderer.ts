/**
 * Architectural Renderer - BC-aware visualization with swim lanes
 * 
 * This renderer shows bounded contexts as swim lanes with auto-layout.
 * Designed for architectural views showing event flow across BCs.
 * 
 * @module renderers/ArchitecturalRenderer
 */

import type { StoryRenderer } from '../types/renderer';
import type { UserStory, ValidationResult } from '../types/story';
import { ArchitecturalCanvas } from '../components/ArchitecturalCanvas';

/**
 * Validate that a story has the required fields for architectural rendering
 */
function validateArchitecturalStory(story: UserStory): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check for boundedContexts definition
  if (!story.boundedContexts || story.boundedContexts.length === 0) {
    warnings.push('Story has no boundedContexts defined. Nodes will be grouped by their boundedContext field or placed in "default" lane.');
  }

  // Check that nodes have boundedContext assignments
  const nodesWithoutBC = story.nodes.filter(n => !n.boundedContext);
  if (nodesWithoutBC.length > 0) {
    warnings.push(`${nodesWithoutBC.length} nodes have no boundedContext. They will be placed in "default" lane.`);
  }

  // Check for orchestration (optional but recommended)
  if (!story.orchestration) {
    warnings.push('Story has no orchestration defined. Orchestration layer will not be shown.');
  }

  // Check that referenced BCs exist
  if (story.boundedContexts) {
    const bcIds = new Set(story.boundedContexts.map(bc => bc.id));
    story.nodes.forEach(node => {
      if (node.boundedContext && !bcIds.has(node.boundedContext) && node.boundedContext !== 'external') {
        errors.push(`Node "${node.id}" references undefined boundedContext "${node.boundedContext}"`);
      }
    });
  }

  // Check orchestration step targets
  if (story.orchestration?.steps) {
    const bcIds = new Set(story.boundedContexts?.map(bc => bc.id) || []);
    story.orchestration.steps.forEach(step => {
      if (!bcIds.has(step.targetBC) && step.targetBC !== 'external') {
        warnings.push(`Orchestration step "${step.id}" targets undefined BC "${step.targetBC}"`);
      }
    });
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}

/**
 * ArchitecturalRenderer - BC-aware visualization with swim lanes and auto-layout
 * 
 * Features:
 * - Automatic layout (ignores manual node.position)
 * - Bounded context swim lanes
 * - Orchestration layer (Conductor visualization)
 * - Infrastructure layer (Service Bus)
 * - Event flow animation
 * - Three zoom levels (Executive, Manager, Engineer)
 * 
 * @example
 * ```tsx
 * <UserStoryViewer story={archStory} renderer="architectural" />
 * // or
 * <UserStoryViewer story={archStory} renderer={ArchitecturalRenderer} />
 * ```
 */
export const ArchitecturalRenderer: StoryRenderer = {
  id: 'architectural',
  name: 'Architectural Renderer',
  description: 'BC-aware visualization with swim lanes, orchestration layer, and auto-layout. Designed for cross-context event flow visualization.',
  
  layoutMode: 'auto',
  
  capabilities: {
    animation: true,
    export: true,
    minimap: true,
    regions: true,
    infrastructure: true,
    zoomLevels: true,
    autoLayout: true,
  },
  
  Canvas: ArchitecturalCanvas,
  
  // Uses default StoryPanel (could override with ArchitecturalPanel later)
  // Panel: ArchitecturalPanel,
  
  // Uses default PlaybackControls
  // Controls: undefined,
  
  validateStory: validateArchitecturalStory,
  
  // No preprocessing needed - layout is calculated in the canvas
  // prepareStory: undefined,
};

export default ArchitecturalRenderer;
