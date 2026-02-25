/**
 * Specialized renderer registry map
 * Maps StoryType → Canvas component + schema for all non-story-flow renderers
 */
import type { ComponentType } from 'react';
import type { ZodType } from 'zod';

import { ServiceFlowCanvas } from '../components/service';
import { ServiceFlowStorySchema } from '../schemas/service-flow';
import { HttpFlowCanvas } from '../components/http';
import { HttpFlowStorySchema } from '../schemas/http-flow';
import { PipelineCanvas } from '../components/pipeline';
import { PipelineStorySchema } from '../schemas/pipeline';
import { BCDeploymentCanvas } from '../components/bc-deployment';
import { BCDeploymentStorySchema } from '../schemas/bc-deployment';
import { BCCompositionCanvas } from '../components/bc-composition';
import { BCCompositionStorySchema } from '../schemas/bc-composition';
import { C4ContextCanvas } from '../components/c4-context';
import { C4ContextStorySchema } from '../schemas/c4-context';
import { TechRadarCanvas } from '../components/tech-radar';
import { TechRadarStorySchema } from '../schemas/tech-radar';
import { EventStormingCanvas } from '../components/event-storming';
import { EventStormingStorySchema } from '../schemas/event-storming';
import { ADRTimelineCanvas } from '../components/adr-timeline';
import { ADRTimelineStorySchema } from '../schemas/adr-timeline';
import { CloudCostCanvas } from '../components/cloud-cost';
import { CloudCostStorySchema } from '../schemas/cloud-cost';
import { DependencyGraphCanvas } from '../components/dependency-graph';
import { DependencyGraphStorySchema } from '../schemas/dependency-graph';
import { MigrationRoadmapCanvas } from '../components/migration-roadmap';
import { MigrationRoadmapStorySchema } from '../schemas/migration-roadmap';
import { TeamOwnershipCanvas } from '../components/team-ownership';
import { TeamOwnershipStorySchema } from '../schemas/team-ownership';
import { StateDiagramCanvas } from '../components/state-diagram';
import { StateDiagramStorySchema } from '../schemas/state-diagram';
import { CompositeCanvas } from '../components/composite';
import { CompositeStorySchema } from '../schemas/composite';

export type SpecializedStoryType =
  | 'service-flow'
  | 'http-flow'
  | 'pipeline'
  | 'bc-deployment'
  | 'bc-composition'
  | 'c4-context'
  | 'tech-radar'
  | 'event-storming'
  | 'adr-timeline'
  | 'cloud-cost'
  | 'dependency-graph'
  | 'migration-roadmap'
  | 'team-ownership'
  | 'state-diagram'
  | 'composite';

export type StoryType = 'story-flow' | SpecializedStoryType;

export interface SpecializedRendererConfig {
  type: SpecializedStoryType;
  Canvas: ComponentType<{ story: any; currentStepIndex: number; onStepChange?: (step: number) => void; hideOverlay?: boolean }>;
  schema: ZodType<any>;
  needsReactFlowProvider?: boolean;
}

export const RENDERER_MAP: Record<SpecializedStoryType, SpecializedRendererConfig> = {
  'service-flow': { type: 'service-flow', Canvas: ServiceFlowCanvas, schema: ServiceFlowStorySchema },
  'http-flow': { type: 'http-flow', Canvas: HttpFlowCanvas, schema: HttpFlowStorySchema },
  'pipeline': { type: 'pipeline', Canvas: PipelineCanvas, schema: PipelineStorySchema },
  'bc-deployment': { type: 'bc-deployment', Canvas: BCDeploymentCanvas, schema: BCDeploymentStorySchema, needsReactFlowProvider: true },
  'bc-composition': { type: 'bc-composition', Canvas: BCCompositionCanvas, schema: BCCompositionStorySchema, needsReactFlowProvider: true },
  'c4-context': { type: 'c4-context', Canvas: C4ContextCanvas, schema: C4ContextStorySchema },
  'tech-radar': { type: 'tech-radar', Canvas: TechRadarCanvas, schema: TechRadarStorySchema },
  'event-storming': { type: 'event-storming', Canvas: EventStormingCanvas, schema: EventStormingStorySchema },
  'adr-timeline': { type: 'adr-timeline', Canvas: ADRTimelineCanvas, schema: ADRTimelineStorySchema },
  'cloud-cost': { type: 'cloud-cost', Canvas: CloudCostCanvas, schema: CloudCostStorySchema },
  'dependency-graph': { type: 'dependency-graph', Canvas: DependencyGraphCanvas, schema: DependencyGraphStorySchema },
  'migration-roadmap': { type: 'migration-roadmap', Canvas: MigrationRoadmapCanvas, schema: MigrationRoadmapStorySchema },
  'team-ownership': { type: 'team-ownership', Canvas: TeamOwnershipCanvas, schema: TeamOwnershipStorySchema },
  'state-diagram': { type: 'state-diagram', Canvas: StateDiagramCanvas, schema: StateDiagramStorySchema },
  'composite': { type: 'composite', Canvas: CompositeCanvas as any, schema: CompositeStorySchema },
};

/** All specialized story type strings for type-guard checks */
export const SPECIALIZED_TYPES = Object.keys(RENDERER_MAP) as SpecializedStoryType[];
