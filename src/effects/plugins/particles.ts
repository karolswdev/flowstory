/**
 * Particles Effect - Dots moving along edges for data flow
 * 
 * Category: flow
 * Layer: canvas
 */

import type {
  CanvasEffectPlugin,
  ParticlesParams,
  EffectInstance,
  EffectContext,
  EffectController,
  EffectState,
  ParticleSystem,
  Particle,
} from '../types';

const DEFAULT_PARAMS: ParticlesParams = {
  count: 5,
  speed: 100,
  size: 4,
  color: '#3b82f6',
  glow: true,
  path: 'edge',
  duration: 2000,
  repeat: 'infinite',
};

interface FlowParticle extends Particle {
  progress: number;
  pathLength: number;
}

interface FlowParticleSystem extends ParticleSystem {
  particles: FlowParticle[];
  pathStart: { x: number; y: number };
  pathEnd: { x: number; y: number };
}

class ParticlesController implements EffectController {
  private state: EffectState = 'idle';
  private listeners: Set<(state: EffectState) => void> = new Set();
  private system: FlowParticleSystem | null = null;
  private animationFrame: number | null = null;
  private lastTime: number = 0;
  private repeatCount: number = 0;
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  
  constructor(
    private instance: EffectInstance<ParticlesParams>,
    private context: EffectContext,
    private plugin: CanvasEffectPlugin<ParticlesParams>
  ) {}

  start(): void {
    const params = this.instance.params;
    
    // Reduced motion: show dashed line instead
    if (this.context.prefersReducedMotion) {
      this.showReducedMotionFallback();
      return;
    }

    // Create canvas overlay
    this.createCanvas();
    if (!this.ctx || !this.canvas) {
      this.setState('complete');
      return;
    }

    // Initialize particle system
    this.system = this.plugin.init(this.context, params) as FlowParticleSystem;
    this.lastTime = performance.now();
    this.repeatCount = 0;
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
      this.lastTime = performance.now();
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
    if (!this.system || this.system.particles.length === 0) return 0;
    // Return average progress of all particles
    const totalProgress = this.system.particles.reduce((sum, p) => sum + p.progress, 0);
    return totalProgress / this.system.particles.length;
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
    const now = performance.now();
    const deltaTime = now - this.lastTime;
    this.lastTime = now;

    // Clear canvas (only our area to allow multiple effects)
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Update particles
    (this.plugin as unknown as CanvasEffectPlugin<ParticlesParams>).update(
      this.system, 
      deltaTime, 
      params
    );

    // Render particles
    (this.plugin as unknown as CanvasEffectPlugin<ParticlesParams>).render(
      this.system, 
      this.ctx
    );

    // Check for repeat
    if (this.system.isComplete) {
      const repeat = params.repeat ?? 1;
      if (repeat === 'infinite' || this.repeatCount < repeat - 1) {
        // Reset particles for next cycle
        this.resetParticles();
        this.repeatCount++;
      } else {
        this.cleanup();
        this.setState('complete');
        return;
      }
    }

    this.animationFrame = requestAnimationFrame(this.animate);
  };

  private resetParticles(): void {
    if (!this.system) return;
    
    const { count = 5 } = this.instance.params;
    
    for (let i = 0; i < this.system.particles.length; i++) {
      const p = this.system.particles[i];
      p.progress = -i / count; // Stagger start
      p.x = this.system.pathStart.x;
      p.y = this.system.pathStart.y;
      p.life = p.maxLife;
    }
    
    this.system.isComplete = false;
  }

  private cleanup(): void {
    if (this.canvas && this.ctx) {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
    this.system = null;
  }

  private showReducedMotionFallback(): void {
    // For reduced motion, we could add a CSS class to show dashed line
    // But since this is edge-based, we'll just complete immediately
    this.setState('complete');
  }
}

export const particlesEffect: CanvasEffectPlugin<ParticlesParams> = {
  definition: {
    type: 'particles',
    category: 'flow',
    layer: 'canvas',
    defaults: DEFAULT_PARAMS,
    reducedMotionFallback: 'static',
    performanceCost: 4,
  },

  createController(
    instance: EffectInstance<ParticlesParams>,
    context: EffectContext
  ): EffectController {
    return new ParticlesController(instance, context, this);
  },

  init(context: EffectContext, params: ParticlesParams): ParticleSystem {
    const {
      count = 5,
      size = 4,
      color = '#3b82f6',
      speed = 100,
      duration = 2000,
    } = params;

    // Default path: from left of target to right
    let pathStart = { x: 100, y: window.innerHeight / 2 };
    let pathEnd = { x: window.innerWidth - 100, y: window.innerHeight / 2 };

    if (context.targetRect) {
      // If we have a target, create path from center-left to center-right
      pathStart = {
        x: context.targetRect.left,
        y: context.targetRect.top + context.targetRect.height / 2,
      };
      pathEnd = {
        x: context.targetRect.right,
        y: context.targetRect.top + context.targetRect.height / 2,
      };
    }

    const pathLength = Math.sqrt(
      Math.pow(pathEnd.x - pathStart.x, 2) + 
      Math.pow(pathEnd.y - pathStart.y, 2)
    );

    const particles: FlowParticle[] = [];

    for (let i = 0; i < count; i++) {
      particles.push({
        x: pathStart.x,
        y: pathStart.y,
        vx: 0,
        vy: 0,
        life: duration,
        maxLife: duration,
        size: size + Math.random() * 2,
        color,
        opacity: 1,
        progress: -i / count, // Stagger start positions
        pathLength,
      });
    }

    return {
      particles,
      originX: pathStart.x,
      originY: pathStart.y,
      pathStart,
      pathEnd,
      isComplete: false,
    } as FlowParticleSystem;
  },

  update(system: ParticleSystem, deltaTime: number, params: ParticlesParams): void {
    const flowSystem = system as FlowParticleSystem;
    const { speed = 100 } = params;
    
    // Speed as progress per millisecond
    const progressPerMs = speed / 10000;
    let allComplete = true;

    for (const p of flowSystem.particles as FlowParticle[]) {
      // Update progress
      p.progress += progressPerMs * deltaTime;

      if (p.progress < 0) {
        // Not started yet (staggered)
        p.opacity = 0;
        allComplete = false;
      } else if (p.progress >= 1) {
        // Completed
        p.opacity = 0;
      } else {
        // Interpolate position along path
        p.x = flowSystem.pathStart.x + (flowSystem.pathEnd.x - flowSystem.pathStart.x) * p.progress;
        p.y = flowSystem.pathStart.y + (flowSystem.pathEnd.y - flowSystem.pathStart.y) * p.progress;
        
        // Fade in at start, fade out at end
        if (p.progress < 0.1) {
          p.opacity = p.progress / 0.1;
        } else if (p.progress > 0.9) {
          p.opacity = (1 - p.progress) / 0.1;
        } else {
          p.opacity = 1;
        }
        
        allComplete = false;
      }
    }

    flowSystem.isComplete = allComplete;
  },

  render(system: ParticleSystem, ctx: CanvasRenderingContext2D): void {
    const { glow = true } = (system as FlowParticleSystem).particles[0] 
      ? { glow: true } 
      : { glow: false };

    for (const p of system.particles) {
      if ((p.opacity ?? 0) <= 0) continue;

      ctx.save();
      ctx.globalAlpha = p.opacity ?? 1;

      // Glow effect
      if (glow) {
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 10;
      }

      // Draw particle
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.fill();
      
      ctx.restore();
    }
  },
};
