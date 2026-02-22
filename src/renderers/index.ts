/**
 * Renderer exports
 * @module renderers
 */

// Registry functions
export {
  registerRenderer,
  getRenderer,
  getAllRenderers,
  hasRenderer,
  unregisterRenderer,
  clearRenderers,
  getDefaultRendererId,
} from './registry';

// Built-in renderers
export { FlowRenderer } from './FlowRenderer';
export { ArchitecturalRenderer } from './ArchitecturalRenderer';

// Specialized renderer registry
export { RENDERER_MAP, SPECIALIZED_TYPES } from './specialized';
export type { SpecializedRendererConfig, SpecializedStoryType, StoryType } from './specialized';

// Auto-register built-in renderers
import { registerRenderer, hasRenderer } from './registry';
import { FlowRenderer } from './FlowRenderer';
import { ArchitecturalRenderer } from './ArchitecturalRenderer';

// Register FlowRenderer if not already registered
if (!hasRenderer('flow')) {
  registerRenderer(FlowRenderer);
}

// Register ArchitecturalRenderer if not already registered
if (!hasRenderer('architectural')) {
  registerRenderer(ArchitecturalRenderer);
}
