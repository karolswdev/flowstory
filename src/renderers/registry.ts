/**
 * Renderer registry for managing available renderers
 * @module renderers/registry
 */

import type { StoryRenderer } from '../types/renderer';

/** Registry of available renderers */
const rendererRegistry = new Map<string, StoryRenderer>();

/**
 * Register a renderer
 * @param renderer - Renderer to register
 * @throws Error if renderer with same ID already exists
 * 
 * @example
 * ```typescript
 * registerRenderer({
 *   id: 'my-renderer',
 *   name: 'My Renderer',
 *   layoutMode: 'manual',
 *   capabilities: {},
 *   Canvas: MyCanvas,
 * });
 * ```
 */
export function registerRenderer(renderer: StoryRenderer): void {
  if (rendererRegistry.has(renderer.id)) {
    throw new Error(`Renderer '${renderer.id}' is already registered`);
  }
  rendererRegistry.set(renderer.id, renderer);
}

/**
 * Get a renderer by ID
 * @param id - Renderer ID
 * @returns Renderer or undefined if not found
 */
export function getRenderer(id: string): StoryRenderer | undefined {
  return rendererRegistry.get(id);
}

/**
 * Get all registered renderers
 * @returns Array of registered renderers
 */
export function getAllRenderers(): StoryRenderer[] {
  return Array.from(rendererRegistry.values());
}

/**
 * Check if a renderer is registered
 * @param id - Renderer ID
 */
export function hasRenderer(id: string): boolean {
  return rendererRegistry.has(id);
}

/**
 * Unregister a renderer (mainly for testing)
 * @param id - Renderer ID
 * @returns true if renderer was removed, false if not found
 */
export function unregisterRenderer(id: string): boolean {
  return rendererRegistry.delete(id);
}

/**
 * Clear all registered renderers (mainly for testing)
 */
export function clearRenderers(): void {
  rendererRegistry.clear();
}

/**
 * Get the default renderer ID
 */
export function getDefaultRendererId(): string {
  return 'flow';
}
