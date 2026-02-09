import { BaseEdge, EdgeLabelRenderer, getBezierPath } from '@xyflow/react';
import type { FlowEdgeProps } from './types';
import './edges.css';

/** Default labels for edge types when no explicit label provided */
const DEFAULT_EDGE_LABELS: Record<string, string> = {
  flow: '',        // No label for generic flow
  command: '→',    // Arrow for commands
  action: '',      // No label for actions
  query: '?',      // Question mark for queries
};

/**
 * FlowEdge - Standard flow connection
 * Renders as a solid arrow with optional label
 */
export function FlowEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected,
}: FlowEdgeProps) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const isActive = data?.isActive;
  // Use explicit label, or default based on edge type
  const label = data?.label || (data?.edgeType ? DEFAULT_EDGE_LABELS[data.edgeType] : '');

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        className={`flow-edge ${data?.edgeType ? `${data.edgeType}-edge` : ''} ${isActive ? 'edge-active' : ''} ${selected ? 'edge-selected' : ''}`}
        data-testid="flow-edge"
        markerEnd="url(#arrow-flow)"
      />
      {label && (
        <EdgeLabelRenderer>
          <div
            className={`edge-label flow-edge-label ${isActive ? 'label-active' : ''}`}
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              pointerEvents: 'all',
            }}
            data-testid="edge-label"
          >
            {label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}
