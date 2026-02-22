import { memo } from 'react';
import { BaseEdge, EdgeLabelRenderer, getBezierPath, type EdgeProps } from '@xyflow/react';

export interface ServiceCallEdgeData {
  callType?: string;
  method?: string;
  path?: string;
  duration?: number;
  messageType?: string;
  action?: string;
  isActive?: boolean;
  isComplete?: boolean;
  isNew?: boolean;
  isBidirectional?: boolean;
  bidirectionalIndex?: number;
  isSelfLoop?: boolean;
  isResponse?: boolean;
  responseLabel?: string;
  color?: string;
  [key: string]: unknown;
}

function ServiceCallEdgeInner({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
}: EdgeProps<ServiceCallEdgeData>) {
  const {
    callType = 'sync',
    method,
    path: callPath,
    duration,
    messageType,
    action,
    isActive = false,
    isComplete = false,
    isNew = false,
    isBidirectional = false,
    bidirectionalIndex = 0,
    isSelfLoop = false,
    isResponse = false,
    responseLabel,
    color = 'var(--color-primary)',
  } = data || {};

  // Build semantic label
  const labelParts = isResponse
    ? { primary: responseLabel || '', secondary: '', tertiary: '' }
    : buildLabelParts(callType, method, callPath, duration, messageType, action);
  const hasLabel = labelParts.primary || labelParts.secondary;

  let edgePath: string;
  let labelX: number;
  let labelY: number;

  if (isSelfLoop) {
    const r = 40;
    edgePath = `M ${sourceX} ${sourceY}
      C ${sourceX + r * 2} ${sourceY - r},
        ${sourceX + r * 2} ${sourceY + r},
        ${sourceX} ${sourceY}`;
    labelX = sourceX + r * 2 + 10;
    labelY = sourceY;
  } else {
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

  const isAsync = callType === 'async' || callType === 'publish' || callType === 'subscribe';
  const stateClass = isActive ? 'call-edge-active' : isComplete ? 'call-edge-complete' : 'call-edge-dimmed';
  const newClass = isNew ? 'call-edge-new' : '';
  const responseClass = isResponse ? 'call-edge-response' : '';

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        className={`service-call-edge ${stateClass} ${newClass} ${responseClass}`}
        style={{
          stroke: color,
          strokeDasharray: isResponse ? '4,4' : isAsync ? '6,4' : undefined,
          opacity: isResponse ? 0.6 : undefined,
        }}
        markerEnd={`url(#call-arrow-${id})`}
      />
      {/* Custom arrow marker to match edge color */}
      <defs>
        <marker
          id={`call-arrow-${id}`}
          viewBox="0 0 10 10"
          refX="10"
          refY="5"
          markerWidth="8"
          markerHeight="8"
          orient="auto-start-reverse"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill={color} />
        </marker>
      </defs>
      {hasLabel && (
        <EdgeLabelRenderer>
          <div
            className={`service-call-label ${isActive ? 'service-call-label--active' : ''}`}
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              pointerEvents: 'all',
            }}
          >
            {labelParts.primary && <span className="service-call-label__primary">{labelParts.primary}</span>}
            {labelParts.secondary && <span className="service-call-label__secondary"> {labelParts.secondary}</span>}
            {labelParts.tertiary && <span className="service-call-label__tertiary"> {labelParts.tertiary}</span>}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}

function buildLabelParts(
  callType: string,
  method?: string,
  path?: string,
  duration?: number,
  messageType?: string,
  action?: string,
): { primary: string; secondary: string; tertiary: string } {
  switch (callType) {
    case 'sync':
      return {
        primary: method || '',
        secondary: path || '',
        tertiary: duration ? `${duration}ms` : '',
      };
    case 'async':
      return {
        primary: messageType || '',
        secondary: '',
        tertiary: '',
      };
    case 'publish':
      return {
        primary: 'pub',
        secondary: messageType || '',
        tertiary: '',
      };
    case 'subscribe':
      return {
        primary: 'sub',
        secondary: action || messageType || '',
        tertiary: '',
      };
    default:
      return { primary: '', secondary: '', tertiary: '' };
  }
}

export const ServiceCallEdge = memo(ServiceCallEdgeInner);
