/**
 * Flow Renderer - Default React Flow based renderer
 * 
 * This is the default renderer using React Flow for flowchart-style visualization.
 * It uses manual positioning from YAML node.position fields.
 * 
 * @module renderers/FlowRenderer
 */

import type { StoryRenderer } from '../types/renderer';
import { FlowCanvas } from '../components/FlowCanvas';

/**
 * FlowRenderer - Standard flowchart visualization
 * 
 * Features:
 * - Manual layout (respects node.position from YAML)
 * - Step-based animation with Framer Motion
 * - Image export (PNG/SVG)
 * - Minimap navigation
 * - Zoom and pan controls
 * 
 * @example
 * ```tsx
 * <UserStoryViewer story={story} renderer="flow" />
 * // or
 * <UserStoryViewer story={story} renderer={FlowRenderer} />
 * ```
 */
export const FlowRenderer: StoryRenderer = {
  id: 'flow',
  name: 'Flow Renderer',
  description: 'Standard flowchart-style visualization using React Flow. Uses manual node positioning from YAML.',
  
  layoutMode: 'manual',
  
  capabilities: {
    animation: true,
    export: true,
    minimap: true,
    regions: false,
    infrastructure: false,
    zoomLevels: false,
    autoLayout: false,
  },
  
  Canvas: FlowCanvas,
  
  // Uses default StoryPanel
  // Panel: undefined,
  
  // Uses default PlaybackControls
  // Controls: undefined,
  
  // No special validation needed
  // validateStory: undefined,
  
  // No preprocessing needed
  // prepareStory: undefined,
};

export default FlowRenderer;
