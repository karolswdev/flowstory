/**
 * Glow Effect - Soft outer glow for focus states
 * 
 * Category: attention
 * Layer: css
 */

import type {
  CSSEffectPlugin,
  GlowParams,
  EffectInstance,
  EffectContext,
  EffectController,
  EffectState,
} from '../types';

const DEFAULT_PARAMS: GlowParams = {
  color: 'currentColor',
  intensity: 0.5,
  size: 20,
  duration: 2000,
  easing: 'ease-in-out',
  repeat: 'infinite',
};

class GlowController implements EffectController {
  private state: EffectState = 'idle';
  private animation: Animation | null = null;
  private listeners: Set<(state: EffectState) => void> = new Set();
  private element: HTMLElement | null;
  private params: GlowParams;
  private originalBoxShadow: string = '';

  constructor(
    private instance: EffectInstance<GlowParams>,
    private context: EffectContext
  ) {
    this.element = context.targetElement;
    this.params = instance.params;
    if (this.element) {
      this.originalBoxShadow = this.element.style.boxShadow;
    }
  }

  start(): void {
    if (!this.element) {
      this.setState('complete');
      return;
    }

    const { color = 'currentColor', intensity = 0.5, size = 20, duration = 2000, repeat } = this.params;

    // Resolve currentColor to actual color
    const resolvedColor = color === 'currentColor' 
      ? getComputedStyle(this.element).color 
      : color;

    // Reduced motion: static glow
    if (this.context.prefersReducedMotion) {
      this.element.style.boxShadow = `0 0 ${size}px ${this.toRGBA(resolvedColor, intensity)}`;
      this.setState('complete');
      return;
    }

    const minGlow = this.toRGBA(resolvedColor, intensity * 0.3);
    const maxGlow = this.toRGBA(resolvedColor, intensity);

    const keyframes: Keyframe[] = [
      { boxShadow: `0 0 ${size * 0.5}px ${minGlow}` },
      { boxShadow: `0 0 ${size}px ${maxGlow}` },
      { boxShadow: `0 0 ${size * 0.5}px ${minGlow}` },
    ];

    const iterations = repeat === 'infinite' ? Infinity : (repeat ?? 1);

    this.animation = this.element.animate(keyframes, {
      duration,
      easing: 'ease-in-out',
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
    // Restore original box shadow
    if (this.element) {
      this.element.style.boxShadow = this.originalBoxShadow;
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

  private toRGBA(color: string, alpha: number): string {
    // Simple hex to rgba conversion
    if (color.startsWith('#')) {
      const hex = color.slice(1);
      const r = parseInt(hex.slice(0, 2), 16);
      const g = parseInt(hex.slice(2, 4), 16);
      const b = parseInt(hex.slice(4, 6), 16);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
    // If already rgb/rgba, adjust alpha
    if (color.startsWith('rgb')) {
      const match = color.match(/\d+/g);
      if (match && match.length >= 3) {
        return `rgba(${match[0]}, ${match[1]}, ${match[2]}, ${alpha})`;
      }
    }
    // Fallback
    return color;
  }
}

export const glowEffect: CSSEffectPlugin<GlowParams> = {
  definition: {
    type: 'glow',
    category: 'attention',
    layer: 'css',
    defaults: DEFAULT_PARAMS,
    reducedMotionFallback: 'static',
    performanceCost: 2,
  },

  createController(
    instance: EffectInstance<GlowParams>,
    context: EffectContext
  ): EffectController {
    return new GlowController(instance, context);
  },

  getKeyframes(params: GlowParams): Record<string, React.CSSProperties> {
    const size = params.size ?? 20;
    const intensity = params.intensity ?? 0.5;
    return {
      '0%, 100%': { boxShadow: `0 0 ${size * 0.5}px rgba(var(--effect-color), ${intensity * 0.3})` },
      '50%': { boxShadow: `0 0 ${size}px rgba(var(--effect-color), ${intensity})` },
    };
  },

  getAnimationProps(params: GlowParams): React.CSSProperties {
    const iterations = params.repeat === 'infinite' ? 'infinite' : params.repeat ?? 1;
    return {
      animationDuration: `${params.duration ?? 2000}ms`,
      animationIterationCount: iterations,
      animationTimingFunction: params.easing ?? 'ease-in-out',
    };
  },
};
