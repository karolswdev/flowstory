/**
 * Shake Effect - Horizontal tremor for errors/warnings
 * 
 * Category: attention
 * Layer: css
 */

import type {
  CSSEffectPlugin,
  ShakeParams,
  EffectInstance,
  EffectContext,
  EffectController,
  EffectState,
} from '../types';

const DEFAULT_PARAMS: ShakeParams = {
  intensity: 5,
  direction: 'horizontal',
  frequency: 10,
  duration: 500,
  repeat: 1,
};

class ShakeController implements EffectController {
  private state: EffectState = 'idle';
  private animation: Animation | null = null;
  private listeners: Set<(state: EffectState) => void> = new Set();
  private element: HTMLElement | null;
  private params: ShakeParams;
  private originalBorder: string = '';

  constructor(
    private instance: EffectInstance<ShakeParams>,
    private context: EffectContext
  ) {
    this.element = context.targetElement;
    this.params = instance.params;
    if (this.element) {
      this.originalBorder = this.element.style.border;
    }
  }

  start(): void {
    if (!this.element) {
      this.setState('complete');
      return;
    }

    const { intensity = 5, direction = 'horizontal', duration = 500, repeat, frequency = 10 } = this.params;

    // Reduced motion: show red border instead
    if (this.context.prefersReducedMotion) {
      this.element.style.border = '2px solid #ef4444';
      this.element.style.borderRadius = '4px';
      
      // Remove after duration
      setTimeout(() => {
        if (this.element) {
          this.element.style.border = this.originalBorder;
        }
        this.setState('complete');
      }, duration);
      
      return;
    }

    // Generate shake keyframes based on frequency
    const shakes = Math.floor((duration / 1000) * frequency);
    const keyframes: Keyframe[] = [];
    
    for (let i = 0; i <= shakes; i++) {
      const progress = i / shakes;
      // Decrease intensity toward the end
      const currentIntensity = intensity * (1 - progress * 0.5);
      
      let x = 0, y = 0;
      
      if (i === 0 || i === shakes) {
        // Start and end at center
        x = 0;
        y = 0;
      } else {
        // Alternate direction
        const offset = (i % 2 === 0 ? 1 : -1) * currentIntensity;
        
        switch (direction) {
          case 'horizontal':
            x = offset;
            break;
          case 'vertical':
            y = offset;
            break;
          case 'both':
            x = offset * (Math.random() > 0.5 ? 1 : -1);
            y = offset * (Math.random() > 0.5 ? 1 : -1);
            break;
        }
      }
      
      keyframes.push({ transform: `translate(${x}px, ${y}px)` });
    }

    const iterations = repeat === 'infinite' ? Infinity : (repeat ?? 1);

    this.animation = this.element.animate(keyframes, {
      duration,
      easing: 'linear',
      iterations,
      fill: 'forwards',
    });

    this.animation.onfinish = () => {
      this.setState('complete');
    };

    this.animation.oncancel = () => {
      this.setState('cancelled');
    };

    this.setState('running');
  }

  pause(): void {
    if (this.animation && this.state === 'running') {
      this.animation.pause();
      this.setState('paused');
    }
  }

  resume(): void {
    if (this.animation && this.state === 'paused') {
      this.animation.play();
      this.setState('running');
    }
  }

  stop(): void {
    if (this.animation) {
      this.animation.cancel();
      this.animation = null;
    }
    // Restore original border
    if (this.element) {
      this.element.style.border = this.originalBorder;
    }
    this.setState('cancelled');
  }

  getProgress(): number {
    if (!this.animation) return 0;
    const { currentTime, effect } = this.animation;
    if (!effect || currentTime === null) return 0;
    const timing = effect.getComputedTiming();
    const duration = timing.duration as number || 1;
    return Math.min(1, (currentTime as number) / duration);
  }

  getState(): EffectState {
    return this.state;
  }

  onStateChange(callback: (state: EffectState) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private setState(state: EffectState): void {
    this.state = state;
    for (const listener of this.listeners) {
      listener(state);
    }
  }
}

export const shakeEffect: CSSEffectPlugin<ShakeParams> = {
  definition: {
    type: 'shake',
    category: 'attention',
    layer: 'css',
    defaults: DEFAULT_PARAMS,
    reducedMotionFallback: 'static',
    performanceCost: 1,
  },

  createController(
    instance: EffectInstance<ShakeParams>,
    context: EffectContext
  ): EffectController {
    return new ShakeController(instance, context);
  },

  getKeyframes(params: ShakeParams): Record<string, React.CSSProperties> {
    const intensity = params.intensity ?? 5;
    return {
      '0%, 100%': { transform: 'translate(0, 0)' },
      '10%, 30%, 50%, 70%, 90%': { transform: `translate(${intensity}px, 0)` },
      '20%, 40%, 60%, 80%': { transform: `translate(-${intensity}px, 0)` },
    };
  },

  getAnimationProps(params: ShakeParams): React.CSSProperties {
    const iterations = params.repeat === 'infinite' ? 'infinite' : params.repeat ?? 1;
    return {
      animationDuration: `${params.duration ?? 500}ms`,
      animationIterationCount: iterations,
      animationTimingFunction: 'linear',
    };
  },
};
