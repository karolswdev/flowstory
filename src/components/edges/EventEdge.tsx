import { BaseEdge, EdgeLabelRenderer, getBezierPath } from '@xyflow/react';
import type { EventEdgeProps } from './types';
import './edges.css';

/**
 * EventEdge - Event trigger connection
 * Renders as a dashed line with lightning icon
 */
export function EventEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected,
}: EventEdgeProps) {
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
        className={`event-edge ${isActive ? 'edge-active' : ''} ${selected ? 'edge-selected' : ''}`}
        data-testid="event-edge"
        markerEnd="url(#arrow-event)"
      />
      <EdgeLabelRenderer>
        <div
          className={`edge-icon event-edge-icon ${isActive ? 'icon-active' : ''}`}
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            pointerEvents: 'all',
          }}
          data-testid="event-edge-icon"
        >
          ⚡
        </div>
      </EdgeLabelRenderer>
      {data?.label && (
        <EdgeLabelRenderer>
          <div
            className={`edge-label event-edge-label ${isActive ? 'label-active' : ''}`}
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
