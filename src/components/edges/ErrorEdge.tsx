import { BaseEdge, EdgeLabelRenderer, getBezierPath } from '@xyflow/react';
import type { ErrorEdgeProps } from './types';
import './edges.css';

/**
 * ErrorEdge - Error path connection
 * Renders as a red dashed line
 */
export function ErrorEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected,
}: ErrorEdgeProps) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const isActive = data?.isActive;

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        className={`error-edge ${isActive ? 'edge-active' : ''} ${selected ? 'edge-selected' : ''}`}
        data-testid="error-edge"
        markerEnd="url(#arrow-error)"
      />
      {data?.label && (
        <EdgeLabelRenderer>
          <div
            className={`edge-label error-edge-label ${isActive ? 'label-active' : ''}`}
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              pointerEvents: 'all',
            }}
            data-testid="edge-label"
          >
            {data.label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}
