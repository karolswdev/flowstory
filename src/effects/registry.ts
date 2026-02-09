/**
 * FlowStory Effects System - Effect Registry
 * 
 * Central registry for effect plugins with defaults resolution.
 */

import type {
  EffectPlugin,
  EffectCategory,
  BaseEffectParams,
  EffectDefinition,
} from './types';

export class EffectRegistry {
  private plugins: Map<string, EffectPlugin> = new Map();
  private categoryDefaults: Map<EffectCategory, Partial<BaseEffectParams>> = new Map();
  private globalDefaults: Partial<BaseEffectParams> = {
    duration: 500,
    delay: 0,
    repeat: 1,
    easing: 'ease-out',
    reducedMotion: 'fade',
  };

  /**
   * Register an effect plugin
   */
  register<P extends BaseEffectParams>(plugin: EffectPlugin<P>): void {
    if (this.plugins.has(plugin.definition.type)) {
      console.warn(`Effect "${plugin.definition.type}" is already registered. Overwriting.`);
    }
    this.plugins.set(plugin.definition.type, plugin as EffectPlugin);
  }

  /**
   * Unregister an effect plugin
   */
  unregister(type: string): boolean {
    return this.plugins.delete(type);
  }

  /**
   * Get plugin by type
   */
  get<P extends BaseEffectParams>(type: string): EffectPlugin<P> | undefined {
    return this.plugins.get(type) as EffectPlugin<P> | undefined;
  }

  /**
   * Check if effect type exists
   */
  has(type: string): boolean {
    return this.plugins.has(type);
  }

  /**
   * List all registered effect types
   */
  list(): string[] {
    return Array.from(this.plugins.keys());
  }

  /**
   * List effects by category
   */
  listByCategory(category: EffectCategory): string[] {
    return Array.from(this.plugins.entries())
      .filter(([, plugin]) => plugin.definition.category === category)
      .map(([type]) => type);
  }

  /**
   * List effects by layer
   */
  listByLayer(layer: 'css' | 'canvas' | 'motion' | 'svg'): string[] {
    return Array.from(this.plugins.entries())
      .filter(([, plugin]) => plugin.definition.layer === layer)
      .map(([type]) => type);
  }

  /**
   * Get effect definition
   */
  getDefinition<P extends BaseEffectParams>(type: string): EffectDefinition<P> | undefined {
    return this.plugins.get(type)?.definition as EffectDefinition<P> | undefined;
  }

  /**
   * Set global defaults
   */
  setGlobalDefaults(defaults: Partial<BaseEffectParams>): void {
    this.globalDefaults = { ...this.globalDefaults, ...defaults };
  }

  /**
   * Set category defaults
   */
  setCategoryDefaults(category: EffectCategory, defaults: Partial<BaseEffectParams>): void {
    const existing = this.categoryDefaults.get(category) || {};
    this.categoryDefaults.set(category, { ...existing, ...defaults });
  }

  /**
   * Resolve parameters with defaults chain:
   * Global → Category → Effect → User params
   */
  resolveParams<P extends BaseEffectParams>(
    type: string,
    userParams: Partial<P> = {}
  ): P {
    const plugin = this.plugins.get(type);
    if (!plugin) {
      throw new Error(`Unknown effect type: ${type}`);
    }

    const { category, defaults } = plugin.definition;
    const categoryDefaults = this.categoryDefaults.get(category) || {};

    return {
      ...this.globalDefaults,
      ...categoryDefaults,
      ...defaults,
      ...userParams,
    } as P;
  }

  /**
   * Get performance cost for an effect
   */
  getPerformanceCost(type: string): number {
    return this.plugins.get(type)?.definition.performanceCost ?? 1;
  }

  /**
   * Get reduced motion fallback strategy
   */
  getReducedMotionFallback(type: string): 'skip' | 'fade' | 'static' {
    return this.plugins.get(type)?.definition.reducedMotionFallback ?? 'fade';
  }

  /**
   * Get all registered plugins
   */
  getAll(): EffectPlugin[] {
    return Array.from(this.plugins.values());
  }

  /**
   * Clear all registered plugins
   */
  clear(): void {
    this.plugins.clear();
  }
}

// Singleton instance
export const effectRegistry = new EffectRegistry();
