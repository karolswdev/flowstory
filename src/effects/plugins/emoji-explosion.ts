/**
 * Emoji Explosion Effect - Burst of emojis radiating from node
 * 
 * Category: celebration
 * Layer: canvas
 */

import type {
  CanvasEffectPlugin,
  EmojiExplosionParams,
  EffectInstance,
  EffectContext,
  EffectController,
  EffectState,
  ParticleSystem,
  Particle,
} from '../types';

const DEFAULT_PARAMS: EmojiExplosionParams = {
  emojis: ['🎉', '✨', '⭐'],
  count: 15,
  spread: 360,
  distance: 100,
  gravity: 0.5,
  duration: 1500,
  fade: true,
};

class EmojiExplosionController implements EffectController {
  private state: EffectState = 'idle';
  private listeners: Set<(state: EffectState) => void> = new Set();
  private system: ParticleSystem | null = null;
  private animationFrame: number | null = null;
  private startTime: number = 0;
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  
  constructor(
    private instance: EffectInstance<EmojiExplosionParams>,
    private context: EffectContext,
    private plugin: CanvasEffectPlugin<EmojiExplosionParams>
  ) {}

  start(): void {
    const params = this.instance.params;
    
    // Reduced motion: show single emoji fade
    if (this.context.prefersReducedMotion) {
      this.showReducedMotionFallback(params);
      return;
    }

    // Create canvas overlay
    this.createCanvas();
    if (!this.ctx || !this.canvas) {
      this.setState('complete');
      return;
    }

    // Initialize particle system
    this.system = this.plugin.init(this.context, params);
    this.startTime = performance.now();
    this.setState('running');
    
    // Start animation loop
    this.animate();
  }

  pause(): void {
    if (this.animationFrame && this.state === 'running') {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
      this.setState('paused');
    }
  }

  resume(): void {
    if (this.state === 'paused' && this.system) {
      this.animate();
      this.setState('running');
    }
  }

  stop(): void {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
    this.cleanup();
    this.setState('cancelled');
  }

  getProgress(): number {
    if (!this.system) return 0;
    const duration = this.instance.params.duration ?? 1500;
    const elapsed = performance.now() - this.startTime;
    return Math.min(1, elapsed / duration);
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

  private createCanvas(): void {
    // Create or get canvas for effects
    let canvas = document.getElementById('effects-canvas') as HTMLCanvasElement;
    
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.id = 'effects-canvas';
      canvas.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 9999;
      `;
      document.body.appendChild(canvas);
    }

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
  }

  private animate = (): void => {
    if (!this.system || !this.ctx || !this.canvas) return;

    const params = this.instance.params;
    const elapsed = performance.now() - this.startTime;
    const duration = params.duration ?? 1500;

    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Update particles
    this.plugin.update(this.system, 16, params);

    // Render particles
    this.plugin.render(this.system, this.ctx);

    // Check completion
    if (elapsed >= duration || this.system.isComplete) {
      this.cleanup();
      this.setState('complete');
      return;
    }

    this.animationFrame = requestAnimationFrame(this.animate);
  };

  private cleanup(): void {
    if (this.canvas && !document.querySelector('[data-effect-active]')) {
      // Only remove if no other effects are using it
      // For now, just clear
      if (this.ctx) {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      }
    }
    this.system = null;
  }

  private showReducedMotionFallback(params: EmojiExplosionParams): void {
    const emoji = params.emojis?.[0] ?? '🎉';
    
    // Create a simple fading emoji element
    const el = document.createElement('div');
    el.textContent = emoji;
    el.style.cssText = `
      position: fixed;
      font-size: 32px;
      pointer-events: none;
      z-index: 9999;
      transition: opacity 0.3s ease-out;
    `;

    if (this.context.targetRect) {
      el.style.left = `${this.context.targetRect.left + this.context.targetRect.width / 2}px`;
      el.style.top = `${this.context.targetRect.top}px`;
      el.style.transform = 'translate(-50%, -100%)';
    }

    document.body.appendChild(el);
    
    requestAnimationFrame(() => {
      el.style.opacity = '0';
    });

    setTimeout(() => {
      el.remove();
      this.setState('complete');
    }, 300);
  }
}

export const emojiExplosionEffect: CanvasEffectPlugin<EmojiExplosionParams> = {
  definition: {
    type: 'emoji-explosion',
    category: 'celebration',
    layer: 'canvas',
    defaults: DEFAULT_PARAMS,
    reducedMotionFallback: 'fade',
    performanceCost: 5,
  },

  createController(
    instance: EffectInstance<EmojiExplosionParams>,
    context: EffectContext
  ): EffectController {
    return new EmojiExplosionController(instance, context, this);
  },

  init(context: EffectContext, params: EmojiExplosionParams): ParticleSystem {
    const {
      emojis = ['🎉', '✨', '⭐'],
      count = 15,
      spread = 360,
      distance = 100,
      gravity = 0.5,
      duration = 1500,
    } = params;

    // Get origin from target
    let originX = window.innerWidth / 2;
    let originY = window.innerHeight / 2;

    if (context.targetRect) {
      originX = context.targetRect.left + context.targetRect.width / 2;
      originY = context.targetRect.top + context.targetRect.height / 2;
    }

    const particles: Particle[] = [];
    const spreadRad = (spread / 360) * Math.PI * 2;
    const startAngle = -spreadRad / 2 - Math.PI / 2; // Start from top

    for (let i = 0; i < count; i++) {
      const angle = startAngle + (spreadRad * i) / count + (Math.random() - 0.5) * 0.3;
      const speed = 2 + Math.random() * 3;
      const emoji = emojis[Math.floor(Math.random() * emojis.length)];

      particles.push({
        x: originX,
        y: originY,
        vx: Math.cos(angle) * speed * (distance / 50),
        vy: Math.sin(angle) * speed * (distance / 50),
        life: duration,
        maxLife: duration,
        size: 20 + Math.random() * 12,
        color: '',
        emoji,
        rotation: Math.random() * 360,
        opacity: 1,
      });
    }

    return {
      particles,
      originX,
      originY,
      isComplete: false,
    };
  },

  update(system: ParticleSystem, deltaTime: number, params: EmojiExplosionParams): void {
    const { gravity = 0.5, fade = true, duration = 1500 } = params;

    let allDead = true;

    for (const p of system.particles) {
      // Apply velocity
      p.x += p.vx;
      p.y += p.vy;

      // Apply gravity
      p.vy += gravity * 0.5;

      // Apply drag
      p.vx *= 0.98;
      p.vy *= 0.98;

      // Rotate
      if (p.rotation !== undefined) {
        p.rotation += p.vx * 2;
      }

      // Decrease life
      p.life -= deltaTime;

      // Fade out
      if (fade && p.opacity !== undefined) {
        p.opacity = Math.max(0, p.life / p.maxLife);
      }

      if (p.life > 0) {
        allDead = false;
      }
    }

    system.isComplete = allDead;
  },

  render(system: ParticleSystem, ctx: CanvasRenderingContext2D): void {
    for (const p of system.particles) {
      if (p.life <= 0 || !p.emoji) continue;

      ctx.save();
      ctx.translate(p.x, p.y);
      
      if (p.rotation !== undefined) {
        ctx.rotate((p.rotation * Math.PI) / 180);
      }
      
      ctx.globalAlpha = p.opacity ?? 1;
      ctx.font = `${p.size}px serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(p.emoji, 0, 0);
      ctx.restore();
    }
  },
};
