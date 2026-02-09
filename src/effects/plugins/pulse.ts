/**
 * Pulse Effect - Rhythmic scale/opacity pulsing
 * 
 * Category: attention
 * Layer: css
 */

import type {
  CSSEffectPlugin,
  PulseParams,
  EffectInstance,
  EffectContext,
  EffectController,
  EffectState,
} from '../types';

const DEFAULT_PARAMS: PulseParams = {
  scale: 1.1,
  duration: 1000,
  easing: 'ease-in-out',
  repeat: 'infinite',
  color: undefined,
  intensity: 0.5,
};

class PulseController implements EffectController {
  private state: EffectState = 'idle';
  private animation: Animation | null = null;
  private listeners: Set<(state: EffectState) => void> = new Set();
  private element: HTMLElement | null;
  private params: PulseParams;

  constructor(
    private instance: EffectInstance<PulseParams>,
    private context: EffectContext
  ) {
    this.element = context.targetElement;
    this.params = instance.params;
  }

  start(): void {
    if (!this.element || this.context.prefersReducedMotion) {
      // Reduced motion: apply static glow
      if (this.element && this.params.color) {
        this.element.style.boxShadow = `0 0 10px ${this.params.color}`;
      }
      this.setState('complete');
      return;
    }

    const { scale = 1.1, duration = 1000, easing = 'ease-in-out', repeat } = this.params;

    const keyframes: Keyframe[] = [
      { transform: 'scale(1)', opacity: 1 },
      { transform: `scale(${scale})`, opacity: 0.9 },
      { transform: 'scale(1)', opacity: 1 },
    ];

    const iterations = repeat === 'infinite' ? Infinity : (repeat ?? 1);

    this.animation = this.element.animate(keyframes, {
      duration,
      easing: this.mapEasing(easing),
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
    // Clean up any static styles
    if (this.element) {
      this.element.style.boxShadow = '';
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

  private mapEasing(easing: string): string {
    switch (easing) {
      case 'spring': return 'cubic-bezier(0.34, 1.56, 0.64, 1)';
      case 'bounce': return 'cubic-bezier(0.68, -0.55, 0.265, 1.55)';
      default: return easing;
    }
  }
}

export const pulseEffect: CSSEffectPlugin<PulseParams> = {
  definition: {
    type: 'pulse',
    category: 'attention',
    layer: 'css',
    defaults: DEFAULT_PARAMS,
    reducedMotionFallback: 'static',
    performanceCost: 1,
  },

  createController(
    instance: EffectInstance<PulseParams>,
    context: EffectContext
  ): EffectController {
    return new PulseController(instance, context);
  },

  getKeyframes(params: PulseParams): Record<string, React.CSSProperties> {
    const scale = params.scale ?? 1.1;
    return {
      '0%, 100%': { transform: 'scale(1)', opacity: 1 },
      '50%': { transform: `scale(${scale})`, opacity: 0.9 },
    };
  },

  getAnimationProps(params: PulseParams): React.CSSProperties {
    const iterations = params.repeat === 'infinite' ? 'infinite' : params.repeat ?? 1;
    return {
      animationDuration: `${params.duration ?? 1000}ms`,
      animationIterationCount: iterations,
      animationTimingFunction: params.easing ?? 'ease-in-out',
    };
  },
};
