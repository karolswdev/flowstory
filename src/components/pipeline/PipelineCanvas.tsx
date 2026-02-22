import { useMemo, useCallback } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  ConnectionMode,
  MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { StageNode, type StageNodeData } from './StageNode';
import { JobNode, type JobNodeData } from './JobNode';
import { GateNode, type GateNodeData } from './GateNode';
import type {
  PipelineStory,
  StageDef,
  JobDef,
  PipelineStep,
  JobStatus,
} from '../../schemas/pipeline';
import {
  PIPELINE_LAYOUT,
  JOB_STATUS_COLORS,
  TRIGGER_TYPE_ICONS,
} from '../../schemas/pipeline';
import { getSmartHandles, type NodeRect } from '../nodes/NodeHandles';
import { NODE_DIMENSIONS } from '../nodes/dimensions';

import './pipeline-nodes.css';

// ============================================================================
// Node Types Registry
// ============================================================================

const nodeTypes = {
  stage: StageNode,
  job: JobNode,
  gate: GateNode,
};

// ============================================================================
// Props
// ============================================================================

interface PipelineCanvasProps {
  story: PipelineStory;
  currentStepIndex: number;
  onStepChange?: (step: number) => void;
}

// ============================================================================
// Layout Helpers
// ============================================================================

interface LayoutResult {
  nodes: Node[];
  edges: Edge[];
}

function buildStagesLayout(
  story: PipelineStory,
  activeStages: Set<string>,
  activeJobs: Set<string>,
  activeGates: Set<string>,
  completedStages: Set<string>,
  completedJobs: Set<string>
): LayoutResult {
  const { stages, jobs, pipeline } = story;
  const { STAGE_WIDTH, STAGE_SPACING, JOB_HEIGHT, JOB_SPACING, HEADER_HEIGHT, PADDING } = PIPELINE_LAYOUT;

  const nodes: Node[] = [];
  const edges: Edge[] = [];

  // Create stage nodes
  stages.forEach((stage, stageIndex) => {
    const x = PADDING + stageIndex * (STAGE_WIDTH + STAGE_SPACING);
    const isActive = activeStages.has(stage.id);
    const isComplete = completedStages.has(stage.id);

    // Stage container node
    nodes.push({
      id: stage.id,
      type: 'stage',
      position: { x, y: HEADER_HEIGHT },
      data: {
        ...stage,
        isActive,
        isComplete,
      } as StageNodeData,
    });

    // Gate node if present
    if (stage.gate) {
      const gateId = `gate-${stage.id}`;
      const isGateActive = activeGates.has(stage.id);
      
      nodes.push({
        id: gateId,
        type: 'gate',
        position: { x: x + STAGE_WIDTH / 2 - 60, y: HEADER_HEIGHT + 60 },
        data: {
          id: gateId,
          ...stage.gate,
          stageName: stage.name,
          isActive: isGateActive,
          isComplete: stage.gate.status === 'approved',
        } as GateNodeData,
      });
    }

    // Jobs in this stage
    const stageJobs = jobs.filter(j => j.stage === stage.id);
    stageJobs.forEach((job, jobIndex) => {
      const jobY = HEADER_HEIGHT + (stage.gate ? 140 : 80) + jobIndex * (JOB_HEIGHT + JOB_SPACING);
      const isJobActive = activeJobs.has(job.id);
      const isJobComplete = completedJobs.has(job.id) || job.status === 'success';

      nodes.push({
        id: job.id,
        type: 'job',
        position: { x: x + 20, y: jobY },
        data: {
          ...job,
          isActive: isJobActive,
          isComplete: isJobComplete,
        } as JobNodeData,
      });
    });

    // Stage dependency edges (collected, resolved after nodeRects built)
    if (stage.needs) {
      stage.needs.forEach(depStageId => {
        edges.push({
          id: `stage-${depStageId}-${stage.id}`,
          source: depStageId,
          target: stage.id,
          style: { stroke: '#9E9E9E', strokeWidth: 2 },
          markerEnd: { type: MarkerType.ArrowClosed, color: '#9E9E9E' },
        });
      });
    }
  });

  // Job dependency edges
  jobs.forEach(job => {
    if (job.needs) {
      job.needs.forEach(depJobId => {
        const color = JOB_STATUS_COLORS[job.status as JobStatus] || '#9E9E9E';
        edges.push({
          id: `job-${depJobId}-${job.id}`,
          source: depJobId,
          target: job.id,
          style: { stroke: color, strokeWidth: 1.5, strokeDasharray: '4,4' },
          markerEnd: { type: MarkerType.ArrowClosed, color },
        });
      });
    }
  });

  // Build node rects and assign smart handles to all edges
  const nodeRects = new Map<string, NodeRect>();
  for (const node of nodes) {
    const dim = node.type === 'stage'
      ? NODE_DIMENSIONS.stage
      : node.type === 'gate'
        ? NODE_DIMENSIONS.gate
        : NODE_DIMENSIONS.job;
    nodeRects.set(node.id, {
      x: node.position.x,
      y: node.position.y,
      width: dim.width,
      height: dim.height,
    });
  }

  for (const edge of edges) {
    const sourceRect = nodeRects.get(edge.source);
    const targetRect = nodeRects.get(edge.target);
    if (sourceRect && targetRect) {
      const [sh, th] = getSmartHandles(sourceRect, targetRect);
      edge.sourceHandle = sh;
      edge.targetHandle = th;
    }
  }

  return { nodes, edges };
}

// ============================================================================
// Component
// ============================================================================

export function PipelineCanvas({
  story,
  currentStepIndex,
  onStepChange,
}: PipelineCanvasProps) {
  // Compute active/completed elements based on current step
  const { activeStages, activeJobs, activeGates, completedStages, completedJobs } = useMemo(() => {
    const activeStages = new Set<string>();
    const activeJobs = new Set<string>();
    const activeGates = new Set<string>();
    const completedStages = new Set<string>();
    const completedJobs = new Set<string>();

    story.steps.forEach((step, i) => {
      if (i < currentStepIndex) {
        step.activeStages?.forEach(id => completedStages.add(id));
        step.activeJobs?.forEach(id => completedJobs.add(id));
      } else if (i === currentStepIndex) {
        step.activeStages?.forEach(id => activeStages.add(id));
        step.activeJobs?.forEach(id => activeJobs.add(id));
        step.activeGates?.forEach(id => activeGates.add(id));
      }
    });

    return { activeStages, activeJobs, activeGates, completedStages, completedJobs };
  }, [story.steps, currentStepIndex]);

  // Build layout
  const { nodes, edges } = useMemo(() => {
    return buildStagesLayout(story, activeStages, activeJobs, activeGates, completedStages, completedJobs);
  }, [story, activeStages, activeJobs, activeGates, completedStages, completedJobs]);

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    console.log('Pipeline element clicked:', node.id);
  }, []);

  const triggerIcon = TRIGGER_TYPE_ICONS[story.pipeline.trigger.type] || '🔄';

  return (
    <div className="pipeline-canvas" data-testid="pipeline-canvas">
      {/* Pipeline header */}
      <div className="pipeline-header">
        <div className="pipeline-header__trigger">
          <span className="trigger-icon">{triggerIcon}</span>
          <span className="trigger-type">{story.pipeline.trigger.type}</span>
          {story.pipeline.trigger.branch && (
            <span className="trigger-branch">📌 {story.pipeline.trigger.branch}</span>
          )}
        </div>
        <div className="pipeline-header__name">{story.pipeline.name}</div>
      </div>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodeClick={onNodeClick}
        connectionMode={ConnectionMode.Loose}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.3}
        maxZoom={2}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={true}
      >
        <Background color="#e0e0e0" gap={20} />
        <Controls showInteractive={false} />
        <MiniMap 
          nodeColor={(node) => {
            if (node.type === 'stage') return '#2196F3';
            if (node.type === 'gate') return '#FF9800';
            const data = node.data as JobNodeData;
            return JOB_STATUS_COLORS[data.status] || '#9E9E9E';
          }}
          maskColor="rgba(0, 0, 0, 0.1)"
        />
      </ReactFlow>

      {/* Step info overlay */}
      <div className="pipeline-step-info">
        <div className="step-badge">Step {currentStepIndex + 1} / {story.steps.length}</div>
        <div className="step-title">{story.steps[currentStepIndex]?.title}</div>
        <div className="step-narrative">{story.steps[currentStepIndex]?.narrative}</div>
      </div>
    </div>
  );
}

export default PipelineCanvas;
