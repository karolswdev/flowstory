/**
 * FlowStory Effects System - Trigger Dispatcher
 * 
 * Manages trigger subscriptions and event dispatching.
 */

import type {
  EffectInstance,
  TriggerConfig,
  TriggerEvent,
  TriggerType,
  ConditionalTrigger,
} from './types';

type TriggerCallback = (event: TriggerEvent) => void;

interface Subscription {
  instance: EffectInstance;
  callback: TriggerCallback;
}

export class TriggerDispatcher {
  private subscriptions: Map<string, Set<Subscription>> = new Map();
  private targetSubscriptions: Map<string, Set<Subscription>> = new Map();

  /**
   * Subscribe an effect instance to its trigger
   */
  subscribe(
    instance: EffectInstance,
    callback: TriggerCallback
  ): () => void {
    const triggerType = this.getTriggerType(instance.trigger);
    const subscription: Subscription = { instance, callback };

    // Subscribe by trigger type
    if (!this.subscriptions.has(triggerType)) {
      this.subscriptions.set(triggerType, new Set());
    }
    this.subscriptions.get(triggerType)!.add(subscription);

    // Also subscribe by target ID for targeted events
    if (!this.targetSubscriptions.has(instance.targetId)) {
      this.targetSubscriptions.set(instance.targetId, new Set());
    }
    this.targetSubscriptions.get(instance.targetId)!.add(subscription);

    // Return unsubscribe function
    return () => {
      this.subscriptions.get(triggerType)?.delete(subscription);
      this.targetSubscriptions.get(instance.targetId)?.delete(subscription);
    };
  }

  /**
   * Dispatch a trigger event
   */
  dispatch(event: TriggerEvent): void {
    // Get subscriptions matching this trigger type
    const typeSubscriptions = this.subscriptions.get(event.type) || new Set();

    for (const subscription of typeSubscriptions) {
      if (this.shouldTrigger(subscription.instance, event)) {
        subscription.callback(event);
      }
    }
  }

  /**
   * Dispatch event to a specific target
   */
  dispatchToTarget(targetId: string, event: TriggerEvent): void {
    const targetSubs = this.targetSubscriptions.get(targetId) || new Set();

    for (const subscription of targetSubs) {
      if (this.shouldTrigger(subscription.instance, event)) {
        subscription.callback(event);
      }
    }
  }

  /**
   * Dispatch reveal event when node becomes visible
   */
  dispatchReveal(targetId: string): void {
    this.dispatchToTarget(targetId, { type: 'on-reveal', targetId });
  }

  /**
   * Dispatch focus event when node becomes active
   */
  dispatchFocus(targetId: string): void {
    this.dispatchToTarget(targetId, { type: 'on-focus', targetId });
  }

  /**
   * Dispatch blur event when node loses focus
   */
  dispatchBlur(targetId: string): void {
    this.dispatchToTarget(targetId, { type: 'on-blur', targetId });
  }

  /**
   * Dispatch click event
   */
  dispatchClick(targetId: string): void {
    this.dispatchToTarget(targetId, { type: 'on-click', targetId });
  }

  /**
   * Dispatch hover event
   */
  dispatchHover(targetId: string): void {
    this.dispatchToTarget(targetId, { type: 'on-hover', targetId });
  }

  /**
   * Dispatch hover end event
   */
  dispatchHoverEnd(targetId: string): void {
    this.dispatchToTarget(targetId, { type: 'on-hover-end', targetId });
  }

  /**
   * Dispatch step change event
   */
  dispatchStep(stepId: string): void {
    this.dispatch({ type: 'on-step', stepId });
  }

  /**
   * Dispatch completion event
   */
  dispatchComplete(): void {
    this.dispatch({ type: 'on-complete' });
  }

  /**
   * Clear all subscriptions
   */
  clear(): void {
    this.subscriptions.clear();
    this.targetSubscriptions.clear();
  }

  /**
   * Clear subscriptions for a specific target
   */
  clearTarget(targetId: string): void {
    const subs = this.targetSubscriptions.get(targetId);
    if (subs) {
      for (const sub of subs) {
        const triggerType = this.getTriggerType(sub.instance.trigger);
        this.subscriptions.get(triggerType)?.delete(sub);
      }
      this.targetSubscriptions.delete(targetId);
    }
  }

  // Private methods

  private getTriggerType(trigger: TriggerConfig): TriggerType {
    if (typeof trigger === 'string') {
      return trigger;
    }
    if (trigger.type === 'on-data') {
      return 'manual'; // Conditional triggers are evaluated separately
    }
    return trigger.type;
  }

  private shouldTrigger(instance: EffectInstance, event: TriggerEvent): boolean {
    const trigger = instance.trigger;

    // Simple string trigger
    if (typeof trigger === 'string') {
      // For targeted events, check target matches
      if (event.targetId && event.targetId !== instance.targetId) {
        return false;
      }
      return trigger === event.type;
    }

    // Conditional trigger
    if (trigger.type === 'on-data') {
      return this.evaluateCondition(trigger, event);
    }

    // Object trigger with type
    if (event.targetId && event.targetId !== instance.targetId) {
      return false;
    }
    return trigger.type === event.type;
  }

  private evaluateCondition(
    trigger: ConditionalTrigger,
    event: TriggerEvent
  ): boolean {
    if (!event.data) return false;

    const { condition } = trigger;
    const value = event.data[condition.field];

    if (condition.equals !== undefined) {
      return value === condition.equals;
    }
    if (condition.notEquals !== undefined) {
      return value !== condition.notEquals;
    }
    if (condition.gt !== undefined && typeof value === 'number') {
      return value > condition.gt;
    }
    if (condition.lt !== undefined && typeof value === 'number') {
      return value < condition.lt;
    }

    return false;
  }
}
