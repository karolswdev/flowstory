import { z } from 'zod';

// ============================================================================
// Type Definitions
// ============================================================================

export const STATE_TYPES = ['initial', 'normal', 'terminal', 'choice'] as const;
export type StateType = typeof STATE_TYPES[number];

export const STATE_VARIANTS = ['success', 'error', 'warning', 'info', 'danger', 'default'] as const;
export type StateVariant = typeof STATE_VARIANTS[number];

export const DIRECTIONS = ['TB', 'LR'] as const;
export type Direction = typeof DIRECTIONS[number];

// ============================================================================
// Color & Icon Configurations
// ============================================================================

export const STATE_VARIANT_COLORS: Record<StateVariant, string> = {
  success: '#4CAF50',
  error: '#F44336',
  warning: '#FF9800',
  info: '#2196F3',
  danger: '#E91E63',
  default: '#607D8B',
};

export const STATE_VARIANT_ICONS: Record<StateVariant, string> = {
  success: '✓',
  error: '✗',
  warning: '⚠',
  info: 'ℹ',
  danger: '☠',
  default: '●',
};

export const STATE_TYPE_COLORS: Record<StateType, string> = {
  initial: '#333333',
  normal: '#607D8B',
  terminal: '#333333',
  choice: '#FF9800',
};

// ============================================================================
// Zod Schemas
// ============================================================================

const StateTypeSchema = z.enum(STATE_TYPES);
const StateVariantSchema = z.enum(STATE_VARIANTS);
const DirectionSchema = z.enum(DIRECTIONS);

export const StateDefSchema = z.object({
  id: z.string(),
  label: z.string(),
  type: StateTypeSchema.optional().default('normal'),
  variant: StateVariantSchema.optional().default('default'),
  phase: z.string().optional(),
  description: z.string().optional(),
});

export const TransitionDefSchema = z.object({
  id: z.string(),
  source: z.string(),
  target: z.string(),
  trigger: z.string().optional(),
  guard: z.string().optional(),
  action: z.string().optional(),
});

export const PhaseDefSchema = z.object({
  id: z.string(),
  label: z.string(),
  color: z.string().optional(),
  order: z.number().int().optional(),
});

export const StateDiagramStepSchema = z.object({
  id: z.string().optional(),
  title: z.string(),
  narrative: z.string(),
  activeStates: z.array(z.string()),
  activeTransitions: z.array(z.string()).optional().default([]),
  duration: z.number().optional(),
  narration: z.object({
    speaker: z.string(),
    message: z.string(),
  }).optional(),
});

export const StateDiagramStorySchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  renderer: z.literal('state-diagram'),
  schemaVersion: z.literal('2.0').optional(),
  direction: DirectionSchema.optional().default('TB'),
  states: z.array(StateDefSchema),
  transitions: z.array(TransitionDefSchema),
  phases: z.array(PhaseDefSchema).optional().default([]),
  steps: z.array(StateDiagramStepSchema),
});

// ============================================================================
// TypeScript Types (inferred from Zod)
// ============================================================================

export type StateDef = z.infer<typeof StateDefSchema>;
export type TransitionDef = z.infer<typeof TransitionDefSchema>;
export type PhaseDef = z.infer<typeof PhaseDefSchema>;
export type StateDiagramStep = z.infer<typeof StateDiagramStepSchema>;
export type StateDiagramStory = z.infer<typeof StateDiagramStorySchema>;

// ============================================================================
// Validation Helpers
// ============================================================================

export function validateStateDiagramStory(data: unknown): StateDiagramStory {
  return StateDiagramStorySchema.parse(data);
}

export function isValidStateDiagramStory(data: unknown): data is StateDiagramStory {
  return StateDiagramStorySchema.safeParse(data).success;
}

// ============================================================================
// Layout Constants
// ============================================================================

export const STATE_DIAGRAM_LAYOUT = {
  NODE_WIDTH: 192,
  NODE_HEIGHT: 56,
  INITIAL_SIZE: 32,
  TERMINAL_SIZE: 32,
  CHOICE_SIZE: 56,
  NODE_SPACING: 80,
  RANK_SPACING: 120,
  PHASE_PADDING: 40,
  SELF_LOOP_RADIUS: 40,
} as const;

// ============================================================================
// Phase Color Palette (for auto-assignment when no color specified)
// ============================================================================

export const PHASE_COLORS = [
  'rgba(33, 150, 243, 0.08)',   // blue
  'rgba(76, 175, 80, 0.08)',    // green
  'rgba(255, 152, 0, 0.08)',    // orange
  'rgba(156, 39, 176, 0.08)',   // purple
  'rgba(0, 188, 212, 0.08)',    // cyan
  'rgba(244, 67, 54, 0.08)',    // red
] as const;
