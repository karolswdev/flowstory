import { useEffect, useRef, useCallback, memo } from 'react';
import type { CallEffect } from '../../schemas/service-flow';

// ============================================================================
// Types
// ============================================================================

interface Projectile {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  rotationSpeed: number;
  scale: number;
  opacity: number;
  life: number;
  maxLife: number;
  content: string;
  type: 'emoji' | 'label' | 'dot';
  /** Path-following: true when direction is 'along-edge' */
  pathFollowing?: boolean;
}

interface EdgeEffectLayerProps {
  edgePath: string;
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
  isActive: boolean;
  effect: CallEffect;
  color: string;
}

// ============================================================================
// Path Sampling
// ============================================================================

/** Sample a point at `t` (0..1) along an SVG path. */
function samplePath(pathEl: SVGPathElement, t: number): { x: number; y: number } {
  const len = pathEl.getTotalLength();
  const pt = pathEl.getPointAtLength(t * len);
  return { x: pt.x, y: pt.y };
}

/** Get the tangent angle at `t` along a path (for rotation). */
function getPathAngle(pathEl: SVGPathElement, t: number): number {
  const len = pathEl.getTotalLength();
  const p1 = pathEl.getPointAtLength(Math.max(0, t * len - 1));
  const p2 = pathEl.getPointAtLength(Math.min(len, t * len + 1));
  return Math.atan2(p2.y - p1.y, p2.x - p1.x);
}

// ============================================================================
// Path-following constants
// ============================================================================

/** How far along the path (0..1) the projectile travels before fully fading. */
const PATH_TRAVEL = 0.65;
/** Progress at which fade-out begins (fraction of life). */
const FADE_OUT_START = 0.55;
/** Progress at which fade-in ends (fraction of life). */
const FADE_IN_END = 0.08;
/** Perpendicular offset above the line for emojis (px). */
const EMOJI_OFFSET = 14;
/** Perpendicular offset above the line for labels (px). */
const LABEL_OFFSET = 18;
/** Perpendicular offset above the line for dots (px). */
const DOT_OFFSET = 6;

// ============================================================================
// Projectile Factory
// ============================================================================

function pickContent(effect: CallEffect, index: number): { content: string; pType: Projectile['type'] } {
  const { type, emojis, label } = effect;
  if (type === 'emoji-fan' && emojis?.length) {
    return { content: emojis[index % emojis.length], pType: 'emoji' };
  } else if (type === 'label-yeet' && label) {
    return { content: label, pType: 'label' };
  }
  return { content: '●', pType: 'dot' };
}

function createProjectile(
  effect: CallEffect,
  pathEl: SVGPathElement,
  sourceX: number,
  sourceY: number,
  targetX: number,
  targetY: number,
  index: number,
): Projectile {
  const {
    count = 5,
    spread = 30,
    direction = 'along-edge',
    speed = 150,
    jitter = 0.2,
    duration = 1500,
  } = effect;

  const { content, pType } = pickContent(effect, index);

  // ── Path-following mode (along-edge) ──
  if (direction === 'along-edge') {
    const startPt = samplePath(pathEl, 0);
    return {
      x: startPt.x,
      y: startPt.y,
      vx: 0,
      vy: 0,
      rotation: 0,
      rotationSpeed: 0,
      scale: 1,
      opacity: 0,
      life: duration,
      maxLife: duration,
      content,
      type: pType,
      pathFollowing: true,
    };
  }

  // ── Physics-based modes (from-source, from-target, radial) ──
  let x: number, y: number, vx: number, vy: number;
  const spreadRad = (spread * Math.PI) / 180;
  const baseAngle = Math.atan2(targetY - sourceY, targetX - sourceX);

  switch (direction) {
    case 'from-source': {
      x = sourceX;
      y = sourceY;
      const angle = baseAngle + (Math.random() - 0.5) * spreadRad;
      vx = Math.cos(angle) * speed / 60;
      vy = Math.sin(angle) * speed / 60;
      break;
    }
    case 'from-target': {
      x = targetX;
      y = targetY;
      const revAngle = baseAngle + Math.PI + (Math.random() - 0.5) * spreadRad;
      vx = Math.cos(revAngle) * speed / 60;
      vy = Math.sin(revAngle) * speed / 60;
      break;
    }
    case 'radial': {
      const mid = samplePath(pathEl, 0.5);
      x = mid.x;
      y = mid.y;
      const radAngle = (index / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.3;
      vx = Math.cos(radAngle) * speed / 60;
      vy = Math.sin(radAngle) * speed / 60;
      break;
    }
    default: {
      x = sourceX;
      y = sourceY;
      vx = 0;
      vy = 0;
    }
  }

  return {
    x,
    y,
    vx,
    vy,
    rotation: Math.random() * Math.PI * 2,
    rotationSpeed: (Math.random() - 0.5) * 0.1,
    scale: 1,
    opacity: 1,
    life: duration,
    maxLife: duration,
    content,
    type: pType,
  };
}

// ============================================================================
// Component
// ============================================================================

function EdgeEffectLayerInner({
  edgePath,
  sourceX,
  sourceY,
  targetX,
  targetY,
  isActive,
  effect,
  color,
}: EdgeEffectLayerProps) {
  const svgGroupRef = useRef<SVGGElement>(null);
  const projectilesRef = useRef<Projectile[]>([]);
  const pathElRef = useRef<SVGPathElement | null>(null);
  const rafRef = useRef<number>(0);
  const lastEmitRef = useRef<number>(0);
  const emitCountRef = useRef<number>(0);

  const {
    count = 5,
    stagger = 100,
    jitter = 0.2,
    gravity = 0,
    fade = true,
    scale: scaleRange = [1, 0.5] as [number, number],
  } = effect;

  // Create/cache SVG path element for sampling
  useEffect(() => {
    const el = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    el.setAttribute('d', edgePath);
    pathElRef.current = el;
  }, [edgePath]);

  const updateAndRender = useCallback((timestamp: number) => {
    const group = svgGroupRef.current;
    const pathEl = pathElRef.current;
    if (!group || !pathEl) return;

    // Emit new projectiles with stagger
    if (emitCountRef.current < count && timestamp - lastEmitRef.current > stagger) {
      const p = createProjectile(effect, pathEl, sourceX, sourceY, targetX, targetY, emitCountRef.current);
      projectilesRef.current.push(p);
      emitCountRef.current += 1;
      lastEmitRef.current = timestamp;
    }

    // Update
    const dt = 16.67; // ~60fps frame time
    const alive: Projectile[] = [];
    for (const p of projectilesRef.current) {
      p.life -= dt;
      if (p.life <= 0) continue;

      const progress = 1 - p.life / p.maxLife; // 0 → 1 over duration

      // ── Path-following mode ──
      if (p.pathFollowing) {
        // Map life progress to path position (0 → PATH_TRAVEL)
        const pathT = progress * PATH_TRAVEL;

        // Sample position on the SVG path
        const clampedT = Math.min(pathT, 1);
        const pt = samplePath(pathEl, clampedT);
        const angle = getPathAngle(pathEl, clampedT);

        // Offset perpendicular to path (above the line)
        // Right-normal of tangent: (sin θ, -cos θ) → points "above" for LR edges
        const offsetDist = p.type === 'emoji' ? EMOJI_OFFSET
          : p.type === 'label' ? LABEL_OFFSET
          : DOT_OFFSET;
        p.x = pt.x + Math.sin(angle) * offsetDist;
        p.y = pt.y - Math.cos(angle) * offsetDist;

        // Opacity: quick fade-in, then fade-out well before target
        if (progress < FADE_IN_END) {
          p.opacity = progress / FADE_IN_END;
        } else if (progress > FADE_OUT_START) {
          p.opacity = Math.max(0, 1 - (progress - FADE_OUT_START) / (1 - FADE_OUT_START));
        } else {
          p.opacity = 1;
        }

        // Gentle scale reduction
        p.scale = 1 - progress * 0.15;
        // Keep upright (no rotation)
        p.rotation = 0;

        alive.push(p);
        continue;
      }

      // ── Physics-based mode (from-source, from-target, radial) ──
      p.x += p.vx + (Math.random() - 0.5) * jitter * 2;
      p.y += p.vy + gravity * 0.5;
      p.vy += gravity * 0.3;
      p.vx *= 0.985; // drag
      p.rotation += p.rotationSpeed;

      // Interpolate scale and opacity
      p.scale = scaleRange[0] + (scaleRange[1] - scaleRange[0]) * progress;
      p.opacity = fade ? Math.max(0, 1 - progress * progress) : 1;

      alive.push(p);
    }
    projectilesRef.current = alive;

    // Render to SVG
    while (group.firstChild) group.removeChild(group.firstChild);

    for (const p of alive) {
      if (p.type === 'emoji') {
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', String(p.x));
        text.setAttribute('y', String(p.y));
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('dominant-baseline', 'central');
        text.setAttribute('font-size', String(16 * p.scale));
        text.setAttribute('opacity', String(p.opacity));
        // Path-following: keep upright; physics: use rotation
        if (!p.pathFollowing) {
          text.setAttribute('transform', `rotate(${(p.rotation * 180) / Math.PI} ${p.x} ${p.y})`);
        }
        text.textContent = p.content;
        text.style.pointerEvents = 'none';
        group.appendChild(text);
      } else if (p.type === 'label') {
        const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        g.setAttribute('transform', `translate(${p.x}, ${p.y}) scale(${p.scale})`);
        g.setAttribute('opacity', String(p.opacity));

        // Background pill
        const textLen = p.content.length * 6.5 + 12;
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('x', String(-textLen / 2));
        rect.setAttribute('y', '-10');
        rect.setAttribute('width', String(textLen));
        rect.setAttribute('height', '20');
        rect.setAttribute('rx', '10');
        rect.setAttribute('fill', color);
        rect.setAttribute('opacity', '0.15');
        g.appendChild(rect);

        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('dominant-baseline', 'central');
        text.setAttribute('font-size', '11');
        text.setAttribute('font-weight', '600');
        text.setAttribute('fill', color);
        text.textContent = p.content;
        text.style.pointerEvents = 'none';
        g.appendChild(text);

        group.appendChild(g);
      } else {
        // Dot / particle
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', String(p.x));
        circle.setAttribute('cy', String(p.y));
        circle.setAttribute('r', String(3 * p.scale));
        circle.setAttribute('fill', color);
        circle.setAttribute('opacity', String(p.opacity * 0.8));
        circle.style.pointerEvents = 'none';
        group.appendChild(circle);
      }
    }

    // Continue animation if there are projectiles or more to emit
    if (alive.length > 0 || emitCountRef.current < count) {
      rafRef.current = requestAnimationFrame(updateAndRender);
    }
  }, [effect, sourceX, sourceY, targetX, targetY, count, stagger, jitter, gravity, fade, scaleRange, color]);

  // Start/stop effect based on isActive
  useEffect(() => {
    if (!isActive) {
      cancelAnimationFrame(rafRef.current);
      projectilesRef.current = [];
      emitCountRef.current = 0;
      const group = svgGroupRef.current;
      if (group) while (group.firstChild) group.removeChild(group.firstChild);
      return;
    }

    // Reset and start
    projectilesRef.current = [];
    emitCountRef.current = 0;
    lastEmitRef.current = 0;
    rafRef.current = requestAnimationFrame(updateAndRender);

    return () => {
      cancelAnimationFrame(rafRef.current);
    };
  }, [isActive, updateAndRender]);

  // Respect prefers-reduced-motion
  const prefersReduced = typeof window !== 'undefined'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (prefersReduced || !isActive) return null;

  return <g ref={svgGroupRef} className="edge-effect-layer" />;
}

export const EdgeEffectLayer = memo(EdgeEffectLayerInner);
