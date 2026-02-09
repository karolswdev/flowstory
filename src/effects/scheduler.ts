/**
 * FlowStory Effects System - Effect Scheduler
 * 
 * Manages effect lifecycle, scheduling, and performance budgeting.
 */

import type {
  EffectInstance,
  EffectController,
  EffectState,
  PerformanceBudget,
  PerformanceStats,
  BaseEffectParams,
  EffectContext,
} from './types';
import { EffectRegistry } from './registry';

interface ScheduledEffect {
  instance: EffectInstance;
  controller: EffectController | null;
  startTime: number;
  priority: number;
}

interface QualityLevel {
  particleMultiplier: number;
  enableGlow: boolean;
  enableBlur: boolean;
}

const QUALITY_LEVELS: Record<'full' | 'reduced' | 'minimal', QualityLevel> = {
  full: { particleMultiplier: 1.0, enableGlow: true, enableBlur: true },
  reduced: { particleMultiplier: 0.5, enableGlow: true, enableBlur: false },
  minimal: { particleMultiplier: 0.25, enableGlow: false, enableBlur: false },
};

export class EffectScheduler {
  private registry: EffectRegistry;
  private active: Map<string, ScheduledEffect> = new Map();
  private pending: ScheduledEffect[] = [];
  private budget: PerformanceBudget;
  private frameTimes: number[] = [];
  private particleCount = 0;
  private droppedFrames = 0;
  private lastFrameTime = 0;
  private qualityLevel: 'full' | 'reduced' | 'minimal' = 'full';
  private stateListeners: Map<string, Set<(state: EffectState) => void>> = new Map();

  constructor(registry: EffectRegistry, budget?: Partial<PerformanceBudget>) {
    this.registry = registry;
    this.budget = {
      maxConcurrentEffects: 10,
      maxParticles: 200,
      targetFrameTime: 16, // 60fps
      maxFrameCost: 8,
      ...budget,
    };
  }

  /**
   * Schedule an effect for execution
   */
  schedule(
    instance: EffectInstance,
    contextProvider: () => EffectContext
  ): string {
    const plugin = this.registry.get(instance.type);
    if (!plugin) {
      console.warn(`Unknown effect type: ${instance.type}`);
      return instance.id;
    }

    // Check performance budget
    if (!this.canSchedule(instance)) {
      console.warn(`Effect ${instance.id} exceeds performance budget, skipping`);
      return instance.id;
    }

    const scheduled: ScheduledEffect = {
      instance: { ...instance, state: 'pending' },
      controller: null,
      startTime: performance.now() + (instance.params.delay || 0),
      priority: this.getEffectPriority(instance),
    };

    // If delay is 0 or already passed, start immediately
    if (scheduled.startTime <= performance.now()) {
      this.startEffect(scheduled, contextProvider);
    } else {
      this.pending.push(scheduled);
      this.pending.sort((a, b) => a.startTime - b.startTime);
    }

    this.notifyStateChange(instance.id, 'pending');
    return instance.id;
  }

  /**
   * Start a scheduled effect
   */
  private startEffect(
    scheduled: ScheduledEffect,
    contextProvider: () => EffectContext
  ): void {
    const plugin = this.registry.get(scheduled.instance.type);
    if (!plugin) return;

    const context = contextProvider();
    
    // Handle reduced motion
    if (context.prefersReducedMotion) {
      const fallback = plugin.definition.reducedMotionFallback;
      if (fallback === 'skip') {
        scheduled.instance.state = 'complete';
        this.notifyStateChange(scheduled.instance.id, 'complete');
        return;
      }
      // For 'fade' and 'static', the plugin handles it
    }

    try {
      const controller = plugin.createController(
        scheduled.instance,
        context
      );

      scheduled.controller = controller;
      scheduled.instance.state = 'running';
      this.active.set(scheduled.instance.id, scheduled);

      // Listen for completion
      controller.onStateChange((state) => {
        if (state === 'complete' || state === 'cancelled') {
          this.cleanup(scheduled.instance.id);
        }
        this.notifyStateChange(scheduled.instance.id, state);
      });

      controller.start();
      this.notifyStateChange(scheduled.instance.id, 'running');
    } catch (err) {
      console.error(`Failed to start effect ${scheduled.instance.id}:`, err);
      scheduled.instance.state = 'cancelled';
      this.notifyStateChange(scheduled.instance.id, 'cancelled');
    }
  }

  /**
   * Cancel a scheduled or running effect
   */
  cancel(instanceId: string): void {
    // Check pending
    const pendingIdx = this.pending.findIndex(s => s.instance.id === instanceId);
    if (pendingIdx >= 0) {
      this.pending.splice(pendingIdx, 1);
      this.notifyStateChange(instanceId, 'cancelled');
      return;
    }

    // Check active
    const active = this.active.get(instanceId);
    if (active) {
      active.controller?.stop();
      this.cleanup(instanceId);
      this.notifyStateChange(instanceId, 'cancelled');
    }
  }

  /**
   * Pause a running effect
   */
  pause(instanceId: string): void {
    const active = this.active.get(instanceId);
    if (active?.controller) {
      active.controller.pause();
      active.instance.state = 'paused';
      this.notifyStateChange(instanceId, 'paused');
    }
  }

  /**
   * Resume a paused effect
   */
  resume(instanceId: string): void {
    const active = this.active.get(instanceId);
    if (active?.controller && active.instance.state === 'paused') {
      active.controller.resume();
      active.instance.state = 'running';
      this.notifyStateChange(instanceId, 'running');
    }
  }

  /**
   * Pause all effects
   */
  pauseAll(): void {
    for (const [id] of this.active) {
      this.pause(id);
    }
  }

  /**
   * Resume all effects
   */
  resumeAll(): void {
    for (const [id] of this.active) {
      this.resume(id);
    }
  }

  /**
   * Process pending effects (call each frame)
   */
  tick(
    timestamp: number,
    contextProvider: () => EffectContext
  ): void {
    // Track frame time for performance monitoring
    if (this.lastFrameTime > 0) {
      const frameTime = timestamp - this.lastFrameTime;
      this.frameTimes.push(frameTime);
      if (this.frameTimes.length > 60) {
        this.frameTimes.shift();
      }
      if (frameTime > this.budget.targetFrameTime * 1.5) {
        this.droppedFrames++;
      }
    }
    this.lastFrameTime = timestamp;

    // Update quality level based on performance
    this.updateQualityLevel();

    // Start pending effects that are due
    while (this.pending.length > 0 && this.pending[0].startTime <= timestamp) {
      const scheduled = this.pending.shift()!;
      if (this.canSchedule(scheduled.instance)) {
        this.startEffect(scheduled, contextProvider);
      }
    }
  }

  /**
   * Check if effect can be scheduled within budget
   */
  canSchedule(instance: EffectInstance): boolean {
    const cost = this.registry.getPerformanceCost(instance.type);
    const currentCost = this.getCurrentFrameCost();

    return (
      this.active.size < this.budget.maxConcurrentEffects &&
      currentCost + cost <= this.budget.maxFrameCost
    );
  }

  /**
   * Get current performance stats
   */
  getStats(): PerformanceStats {
    const avgFrameTime = this.frameTimes.length > 0
      ? this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length
      : 0;

    return {
      fps: avgFrameTime > 0 ? 1000 / avgFrameTime : 0,
      avgFrameTime,
      activeEffects: this.active.size,
      particleCount: this.particleCount,
      droppedFrames: this.droppedFrames,
    };
  }

  /**
   * Get current quality level
   */
  getQualityLevel(): QualityLevel {
    return QUALITY_LEVELS[this.qualityLevel];
  }

  /**
   * Get active effect count
   */
  getActiveCount(): number {
    return this.active.size;
  }

  /**
   * Get effect state
   */
  getState(instanceId: string): EffectState | undefined {
    const pending = this.pending.find(s => s.instance.id === instanceId);
    if (pending) return pending.instance.state;

    const active = this.active.get(instanceId);
    return active?.instance.state;
  }

  /**
   * Subscribe to state changes for an effect
   */
  onStateChange(
    instanceId: string,
    callback: (state: EffectState) => void
  ): () => void {
    if (!this.stateListeners.has(instanceId)) {
      this.stateListeners.set(instanceId, new Set());
    }
    this.stateListeners.get(instanceId)!.add(callback);

    return () => {
      this.stateListeners.get(instanceId)?.delete(callback);
    };
  }

  /**
   * Update particle count (called by canvas effects)
   */
  updateParticleCount(count: number): void {
    this.particleCount = count;
  }

  /**
   * Get particle budget remaining
   */
  getParticleBudget(): number {
    return Math.max(0, this.budget.maxParticles - this.particleCount);
  }

  // Private methods

  private cleanup(instanceId: string): void {
    const active = this.active.get(instanceId);
    if (active) {
      active.controller?.stop();
      this.active.delete(instanceId);
    }
    this.stateListeners.delete(instanceId);
  }

  private notifyStateChange(instanceId: string, state: EffectState): void {
    const listeners = this.stateListeners.get(instanceId);
    if (listeners) {
      for (const callback of listeners) {
        try {
          callback(state);
        } catch (err) {
          console.error('Error in state change listener:', err);
        }
      }
    }
  }

  private getCurrentFrameCost(): number {
    let cost = 0;
    for (const [, scheduled] of this.active) {
      cost += this.registry.getPerformanceCost(scheduled.instance.type);
    }
    return cost;
  }

  private getEffectPriority(instance: EffectInstance): number {
    // Lower number = higher priority
    const triggerType = typeof instance.trigger === 'string' 
      ? instance.trigger 
      : instance.trigger.type;

    switch (triggerType) {
      case 'on-reveal': return 1;
      case 'on-focus': return 2;
      case 'on-click': return 3;
      case 'on-step': return 4;
      case 'continuous': return 5;
      default: return 10;
    }
  }

  private updateQualityLevel(): void {
    const stats = this.getStats();
    
    if (stats.fps < 30 || stats.droppedFrames > 10) {
      this.qualityLevel = 'minimal';
    } else if (stats.fps < 50 || stats.droppedFrames > 5) {
      this.qualityLevel = 'reduced';
    } else {
      this.qualityLevel = 'full';
    }
  }
}
