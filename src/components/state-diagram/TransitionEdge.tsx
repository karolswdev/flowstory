import { memo } from 'react';
import { BaseEdge, EdgeLabelRenderer, getBezierPath, type EdgeProps } from '@xyflow/react';

export interface TransitionEdgeData {
  trigger?: string;
  guard?: string;
  action?: string;
  isActive?: boolean;
  isComplete?: boolean;
  isRevealed?: boolean;
  isSelfLoop?: boolean;
  isBidirectional?: boolean;
  bidirectionalIndex?: number;
  isError?: boolean;
  [key: string]: unknown;
}

function TransitionEdgeInner({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
}: EdgeProps<TransitionEdgeData>) {
  const {
    trigger,
    guard,
    action,
    isActive = false,
    isComplete = false,
    isRevealed = true,
    isSelfLoop = false,
    isBidirectional = false,
    bidirectionalIndex = 0,
    isError = false,
  } = data || {};

  // Build label parts
  const hasLabel = trigger || guard || action;

  let edgePath: string;
  let labelX: number;
  let labelY: number;

  if (isSelfLoop) {
    // Self-loop: exit right, arc up, return to top
    const r = 40;
    edgePath = `M ${sourceX} ${sourceY}
      C ${sourceX + r * 2} ${sourceY - r},
        ${sourceX + r * 2} ${sourceY + r},
        ${sourceX} ${sourceY}`;
    labelX = sourceX + r * 2 + 10;
    labelY = sourceY;
  } else {
    // Offset curvature for bidirectional edges
    const curvature = isBidirectional
      ? bidirectionalIndex === 0 ? 0.35 : -0.35
      : undefined;

    const result = getBezierPath({
      sourceX,
      sourceY,
      sourcePosition,
      targetX,
      targetY,
      targetPosition,
      curvature,
    });
    edgePath = result[0];
    labelX = result[1];
    labelY = result[2];
  }

  // Determine CSS class
  const stateClass = isActive
    ? 'edge-active'
    : isComplete
      ? 'edge-complete'
      : !isRevealed
        ? 'edge-dimmed'
        : '';

  const errorClass = isError ? 'edge-error' : '';

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        className={`transition-edge-path ${stateClass} ${errorClass}`}
        markerEnd="url(#state-arrow)"
      />
      {hasLabel && (
        <EdgeLabelRenderer>
          <div
            className={`transition-edge-label ${isActive ? 'label-active' : ''}`}
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              pointerEvents: 'all',
            }}
          >
            {trigger && <span className="trigger-text">{trigger}</span>}
            {guard && <span className="guard-text"> [{guard}]</span>}
            {action && <span className="action-text"> / {action}</span>}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}

export const TransitionEdge = memo(TransitionEdgeInner);
