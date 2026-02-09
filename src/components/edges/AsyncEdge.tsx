import { BaseEdge, EdgeLabelRenderer, getBezierPath } from '@xyflow/react';
import type { AsyncEdgeProps } from './types';
import './edges.css';

/**
 * AsyncEdge - Async operation connection
 * Renders as a dotted line with clock icon
 */
export function AsyncEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected,
}: AsyncEdgeProps) {
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
        className={`async-edge ${isActive ? 'edge-active' : ''} ${selected ? 'edge-selected' : ''}`}
        data-testid="async-edge"
        markerEnd="url(#arrow-async)"
      />
      <EdgeLabelRenderer>
        <div
          className={`edge-icon async-edge-icon ${isActive ? 'icon-active' : ''}`}
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            pointerEvents: 'all',
          }}
          data-testid="async-edge-icon"
        >
          ⏱
        </div>
      </EdgeLabelRenderer>
      {data?.label && (
        <EdgeLabelRenderer>
          <div
            className={`edge-label async-edge-label ${isActive ? 'label-active' : ''}`}
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY + 20}px)`,
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
