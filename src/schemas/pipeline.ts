import { z } from 'zod';

// ============================================================================
// Type Definitions
// ============================================================================

export const TRIGGER_TYPES = ['push', 'pull_request', 'schedule', 'manual', 'workflow_dispatch', 'tag'] as const;
export type TriggerType = typeof TRIGGER_TYPES[number];

export const GATE_TYPES = ['approval', 'manual', 'scheduled', 'condition'] as const;
export type GateType = typeof GATE_TYPES[number];

export const GATE_STATUSES = ['pending', 'approved', 'rejected', 'skipped'] as const;
export type GateStatus = typeof GATE_STATUSES[number];

export const JOB_STATUSES = ['pending', 'queued', 'running', 'success', 'failed', 'cancelled', 'skipped'] as const;
export type JobStatus = typeof JOB_STATUSES[number];

export const ARTIFACT_TYPES = ['build', 'test-results', 'coverage', 'docker-image', 'package', 'logs'] as const;
export type ArtifactType = typeof ARTIFACT_TYPES[number];

export const LAYOUTS = ['stages', 'dag', 'timeline'] as const;
export type PipelineLayout = typeof LAYOUTS[number];

// ============================================================================
// Color Configurations
// ============================================================================

export const JOB_STATUS_COLORS: Record<JobStatus, string> = {
  pending: '#9E9E9E',
  queued: '#2196F3',
  running: '#FF9800',
  success: '#4CAF50',
  failed: '#F44336',
  cancelled: '#9E9E9E',
  skipped: '#BDBDBD',
};

export const JOB_STATUS_ICONS: Record<JobStatus, string> = {
  pending: '⏳',
  queued: '📋',
  running: '🔄',
  success: '✅',
  failed: '❌',
  cancelled: '⛔',
  skipped: '⏭️',
};

export const GATE_STATUS_COLORS: Record<GateStatus, string> = {
  pending: '#FF9800',
  approved: '#4CAF50',
  rejected: '#F44336',
  skipped: '#9E9E9E',
};

export const TRIGGER_TYPE_ICONS: Record<TriggerType, string> = {
  push: '📤',
  pull_request: '🔀',
  schedule: '⏰',
  manual: '👆',
  workflow_dispatch: '🚀',
  tag: '🏷️',
};

export const ARTIFACT_TYPE_ICONS: Record<ArtifactType, string> = {
  build: '📦',
  'test-results': '🧪',
  coverage: '📊',
  'docker-image': '🐳',
  package: '📦',
  logs: '📜',
};

// ============================================================================
// Zod Schemas
// ============================================================================

const TriggerTypeSchema = z.enum(TRIGGER_TYPES);
const GateTypeSchema = z.enum(GATE_TYPES);
const GateStatusSchema = z.enum(GATE_STATUSES);
const JobStatusSchema = z.enum(JOB_STATUSES);
const ArtifactTypeSchema = z.enum(ARTIFACT_TYPES);
const LayoutSchema = z.enum(LAYOUTS);

export const TriggerDefSchema = z.object({
  type: TriggerTypeSchema,
  branch: z.string().optional(),
  commit: z.string().optional(),
  actor: z.string().optional(),
  scheduledTime: z.string().optional(),
});

export const GateDefSchema = z.object({
  type: GateTypeSchema,
  status: GateStatusSchema,
  approvers: z.array(z.string()).optional(),
  approvedBy: z.string().optional(),
  condition: z.string().optional(),
  scheduledTime: z.string().optional(),
});

export const StepDefSchema = z.object({
  id: z.string(),
  name: z.string(),
  status: JobStatusSchema,
  duration: z.number().optional(),
  action: z.string().optional(),
  command: z.string().optional(),
  workingDirectory: z.string().optional(),
});

export const ArtifactDefSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: ArtifactTypeSchema,
  path: z.string().optional(),
  size: z.number().optional(),
});

export const StageDefSchema = z.object({
  id: z.string(),
  name: z.string(),
  needs: z.array(z.string()).optional(),
  environment: z.string().optional(),
  gate: GateDefSchema.optional(),
});

export const JobDefSchema = z.object({
  id: z.string(),
  stage: z.string(),
  name: z.string(),
  runner: z.string().optional(),
  status: JobStatusSchema,
  duration: z.number().optional(),
  needs: z.array(z.string()).optional(),
  matrix: z.record(z.array(z.string())).optional(),
  steps: z.array(StepDefSchema).optional(),
  artifacts: z.array(ArtifactDefSchema).optional(),
});

export const PipelineMetadataSchema = z.object({
  name: z.string(),
  trigger: TriggerDefSchema,
  status: JobStatusSchema,
  duration: z.number().optional(),
  startTime: z.string().optional(),
});

export const PipelineStepSchema = z.object({
  id: z.string(),
  title: z.string(),
  narrative: z.string(),
  activeStages: z.array(z.string()).optional(),
  activeJobs: z.array(z.string()).optional(),
  activeGates: z.array(z.string()).optional(),
  duration: z.number().optional(),
});

export const PipelineStorySchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  renderer: z.literal('pipeline'),
  schemaVersion: z.literal('2.0'),
  layout: LayoutSchema.optional().default('stages'),
  pipeline: PipelineMetadataSchema,
  stages: z.array(StageDefSchema),
  jobs: z.array(JobDefSchema),
  steps: z.array(PipelineStepSchema),
});

// ============================================================================
// TypeScript Types (inferred from Zod)
// ============================================================================

export type TriggerDef = z.infer<typeof TriggerDefSchema>;
export type GateDef = z.infer<typeof GateDefSchema>;
export type StepDef = z.infer<typeof StepDefSchema>;
export type ArtifactDef = z.infer<typeof ArtifactDefSchema>;
export type StageDef = z.infer<typeof StageDefSchema>;
export type JobDef = z.infer<typeof JobDefSchema>;
export type PipelineMetadata = z.infer<typeof PipelineMetadataSchema>;
export type PipelineStep = z.infer<typeof PipelineStepSchema>;
export type PipelineStory = z.infer<typeof PipelineStorySchema>;

// ============================================================================
// Validation Helper
// ============================================================================

export function validatePipelineStory(data: unknown): PipelineStory {
  return PipelineStorySchema.parse(data);
}

export function isValidPipelineStory(data: unknown): data is PipelineStory {
  return PipelineStorySchema.safeParse(data).success;
}

// ============================================================================
// Layout Constants
// ============================================================================

export const PIPELINE_LAYOUT = {
  STAGE_WIDTH: 280,
  STAGE_SPACING: 40,
  JOB_HEIGHT: 60,
  JOB_SPACING: 20,
  STEP_HEIGHT: 36,
  HEADER_HEIGHT: 80,
  PADDING: 40,
} as const;
