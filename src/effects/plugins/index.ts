/**
 * FlowStory Effects - Built-in Plugins
 */

export { pulseEffect } from './pulse';
export { glowEffect } from './glow';
export { shakeEffect } from './shake';
export { emojiExplosionEffect } from './emoji-explosion';
export { particlesEffect } from './particles';
export { edgeProjectileEffect } from './edge-projectile';

import type { EffectPlugin } from '../types';
import { pulseEffect } from './pulse';
import { glowEffect } from './glow';
import { shakeEffect } from './shake';
import { emojiExplosionEffect } from './emoji-explosion';
import { particlesEffect } from './particles';
import { edgeProjectileEffect } from './edge-projectile';

/**
 * All built-in effect plugins
 */
export const builtinEffects: EffectPlugin[] = [
  // Phase 1 - MVP
  pulseEffect,
  glowEffect,
  shakeEffect,
  emojiExplosionEffect,
  particlesEffect,
  // Phase 2 - Edge effects
  edgeProjectileEffect,
];

/**
 * Effect types by category
 */
export const effectsByCategory = {
  attention: ['pulse', 'glow', 'shake'],
  celebration: ['emoji-explosion'],
  flow: ['particles', 'edge-projectile'],
  state: [],
  ambient: [],
} as const;

/**
 * Effect types by layer
 */
export const effectsByLayer = {
  css: ['pulse', 'glow', 'shake'],
  canvas: ['emoji-explosion', 'particles'],
  motion: [],
  svg: ['edge-projectile'],
} as const;
