import { memo, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BaseEdge, EdgeLabelRenderer, getBezierPath, type EdgeProps } from '@xyflow/react';
import { EdgeEffectLayer } from './EdgeEffectLayer';

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
  /** Index of this edge among all edges from the same source (for stagger) */
  sourceEdgeIndex?: number;
  /** Total count of edges from the same source */
  sourceEdgeCount?: number;
  /** Node dimensions for self-loop arc computation */
  nodeWidth?: number;
  nodeHeight?: number;
  /** Index among self-loop edges on the same node (for staggering arcs) */
  selfLoopIndex?: number;
  /** Edge effect configuration */
  effect?: import('../../schemas/service-flow').CallEffect | null;
  /** Coupling level indicator */
  coupling?: import('../../schemas/service-flow').CouplingLevel;
  /** Critical path marker */
  critical?: boolean;
  /** Edge is part of a failure cascade */
  isFailed?: boolean;
  /** Fallback path is active (failure cascade) */
  isFallbackActive?: boolean;
  /** Label rides along the edge path when active */
  travelingLabel?: boolean;
  /** Stream visualization — continuous particle flow */
  stream?: import('../../schemas/service-flow').StreamConfig | boolean;
  [key: string]: unknown;
}

/** Call-type badge icons for visual distinction */
const CALL_TYPE_BADGES: Record<string, { icon: string; label: string }> = {
  sync: { icon: '→', label: '' },
  async: { icon: '⚡', label: '' },
  publish: { icon: '📤', label: 'pub' },
  subscribe: { icon: '📥', label: 'sub' },
};

/** Per-type dash patterns for visual distinction */
const CALL_TYPE_DASHES: Record<string, string | undefined> = {
  sync: undefined,        // solid line
  async: '8,5',           // dashed
  publish: '3,6',         // dotted
  subscribe: '8,3,2,3',   // dash-dot
};

/** Per-type traveling dot animation config */
const CALL_TYPE_DOT_CONFIG: Record<string, { dash: string; speed: string; offset: string }> = {
  sync:      { dash: '4, 12', speed: '0.8s', offset: '-16' },
  async:     { dash: '3, 10', speed: '0.5s', offset: '-13' },
  publish:   { dash: '6, 8',  speed: '0.6s', offset: '-14' },
  subscribe: { dash: '4, 14', speed: '1.1s', offset: '-18' },
};

/**
 * Parse a hex color like "#3B82F6" into {r, g, b}.
 * Returns null for non-hex strings (CSS vars, named colors, etc.).
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const m = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex);
  if (!m) return null;
  return { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) };
}

/**
 * Compute direction-aware label transform.
 * - Forward edges (L→R): label above the line
 * - Response edges (R→L): label below the line
 * - Mostly-vertical edges: label offset to the right
 * - Multiple edges from same source get staggered vertically
 */
function computeLabelTransform(
  labelX: number,
  labelY: number,
  sourceX: number,
  sourceY: number,
  targetX: number,
  targetY: number,
  isResponse: boolean,
  isBidirectional: boolean,
  sourceEdgeIndex: number,
  sourceEdgeCount: number,
): string {
  const dx = targetX - sourceX;
  const dy = targetY - sourceY;
  const isVertical = Math.abs(dy) > Math.abs(dx) * 1.5;

  if (isVertical) {
    // Vertical edge: label to the right of midpoint, staggered vertically
    const stagger = sourceEdgeCount > 1
      ? (sourceEdgeIndex - (sourceEdgeCount - 1) / 2) * 28
      : 0;
    return `translate(${labelX + 16}px, ${labelY + stagger}px) translate(0, -50%)`;
  }

  if (isResponse) {
    // Response: label BELOW the curve midpoint
    // When bidirectional, curvature already separates paths → smaller nudge
    const offset = isBidirectional ? 8 : 18;
    return `translate(-50%, ${offset}px) translate(${labelX}px, ${labelY}px)`;
  }

  // Forward: label ABOVE the curve midpoint
  const baseGap = isBidirectional ? 8 : 18;
  const stagger = sourceEdgeIndex * 24;
  return `translate(-50%, calc(-100% - ${baseGap + stagger}px)) translate(${labelX}px, ${labelY}px)`;
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
    sourceEdgeIndex = 0,
    sourceEdgeCount = 1,
    coupling,
    critical = false,
    isFailed = false,
    isFallbackActive = false,
    travelingLabel = false,
  } = data || {};

  // Build semantic label
  const labelParts = isResponse
    ? { primary: responseLabel || '', secondary: '', tertiary: '' }
    : buildLabelParts(callType, method, callPath, duration, messageType, action);
  const hasLabel = labelParts.primary || labelParts.secondary;

  // Color-tinted label styles
  const labelStyles = useMemo(() => {
    const rgb = hexToRgb(color);
    if (!rgb) return {};
    return {
      borderLeftColor: color,
      background: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.06)`,
    };
  }, [color]);

  const activeLabelStyles = useMemo(() => {
    const rgb = hexToRgb(color);
    if (!rgb) return {};
    return {
      borderLeftColor: color,
      background: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.12)`,
      boxShadow: `0 2px 8px rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.25), 0 0 12px rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.15)`,
    };
  }, [color]);

  let edgePath: string;
  let labelX: number;
  let labelY: number;

  if (isSelfLoop) {
    const w = data?.nodeWidth ?? 192;
    const h = data?.nodeHeight ?? 56;
    const loopIdx = data?.selfLoopIndex ?? 0;

    // sourceX/sourceY are already at the right-center handle (source-right),
    // so they represent the right edge midpoint of the node.
    const rightX = sourceX;
    const centerY = sourceY;
    const startY = centerY - h * 0.3;   // exit ~30% above center
    const endY = centerY + h * 0.3;     // enter ~30% below center

    const loopW = Math.max(40, w * 0.35) + loopIdx * 24;  // stagger outward
    const cpOffsetY = h * 0.55;          // vertical control point spread

    edgePath = `M ${rightX} ${startY} C ${rightX + loopW} ${startY - cpOffsetY}, ${rightX + loopW} ${endY + cpOffsetY}, ${rightX} ${endY}`;
    labelX = rightX + loopW + 8;
    labelY = centerY;
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

  // Per-type dash pattern (response has its own distinct pattern)
  const dashArray = isResponse
    ? '6,3'
    : CALL_TYPE_DASHES[callType];

  const selfLoopClass = isSelfLoop ? 'call-edge-self-loop' : '';
  const stateClass = isActive ? 'call-edge-active' : isComplete ? 'call-edge-complete' : 'call-edge-dimmed';
  const newClass = isNew ? 'call-edge-new' : '';
  const responseClass = isResponse ? 'call-edge-response' : '';
  const typeClass = `call-edge--${callType}`;
  const couplingClass = coupling ? `call-edge--coupling-${coupling}` : '';
  const criticalClass = critical ? 'call-edge--critical' : '';
  const failedClass = isFailed ? 'call-edge--failed' : '';
  const fallbackClass = isFallbackActive ? 'call-edge--fallback-active' : '';
  const badge = CALL_TYPE_BADGES[callType];

  // Override stroke color for failure/fallback states
  const resolvedColor = isFailed ? '#EF4444' : isFallbackActive ? '#22C55E' : color;

  // Traveling dot config for this call type
  const dotConfig = CALL_TYPE_DOT_CONFIG[callType] || CALL_TYPE_DOT_CONFIG.sync;

  // Arrow marker ID — response edges get a distinct hollow arrow
  const markerId = isResponse ? `call-return-arrow-${id}` : `call-arrow-${id}`;

  // Stream config normalization: true → defaults, object → merge with defaults
  const streamConfig = useMemo(() => {
    if (!data?.stream) return null;
    const defaults = { density: 6, speed: 2.5, width: 16, fade: true, bandOpacity: 0.08 };
    if (data.stream === true) return defaults;
    return { ...defaults, ...data.stream };
  }, [data?.stream]);

  const streamColor = streamConfig?.color || color;

  // Generate particle indices array for stream rendering
  const particleIndices = useMemo(() => {
    if (!streamConfig) return [];
    return Array.from({ length: streamConfig.density }, (_, i) => i);
  }, [streamConfig]);

  // Traveling label: when active + travelingLabel, label rides along edge path
  const showTravelingLabel = travelingLabel && isActive && hasLabel;
  const showStaticLabel = hasLabel && !showTravelingLabel;

  // Estimate travel duration proportional to path length (~3s base, min 2s, max 5s)
  const travelDuration = useMemo(() => {
    if (!showTravelingLabel) return 3;
    // Rough path length from source/target distance
    const dx = targetX - sourceX;
    const dy = targetY - sourceY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    // Self-loops are shorter paths — use a fixed shorter duration
    if (isSelfLoop) return 2.5;
    return Math.min(5, Math.max(2, dist / 150));
  }, [showTravelingLabel, sourceX, sourceY, targetX, targetY, isSelfLoop]);

  return (
    <>
      {/* Base edge line — stroke width varies by state */}
      <BaseEdge
        id={id}
        path={edgePath}
        className={`service-call-edge ${stateClass} ${newClass} ${responseClass} ${selfLoopClass} ${typeClass} ${couplingClass} ${criticalClass} ${failedClass} ${fallbackClass}`}
        style={{
          stroke: resolvedColor,
          strokeDasharray: isFallbackActive ? '8,4' : dashArray,
          opacity: isResponse ? 0.6 : undefined,
        }}
        markerEnd={`url(#${markerId})`}
      />
      {/* Animated traveling-dot overlay for active edges */}
      {isActive && (
        <path
          d={edgePath}
          className="call-edge-flow-dots"
          style={{
            stroke: resolvedColor,
            strokeDasharray: dotConfig.dash,
            animationDuration: dotConfig.speed,
            ['--dot-offset' as string]: dotConfig.offset,
          }}
          fill="none"
        />
      )}
      {/* Stream band — wide semi-transparent path */}
      {streamConfig && isActive && (
        <path
          d={edgePath}
          className="call-edge-stream-band"
          style={{
            stroke: streamColor,
            strokeWidth: streamConfig.width,
            opacity: streamConfig.bandOpacity,
          }}
          fill="none"
        />
      )}
      {/* Edge projectile effects */}
      {data?.effect && (
        <EdgeEffectLayer
          edgePath={edgePath}
          sourceX={sourceX}
          sourceY={sourceY}
          targetX={targetX}
          targetY={targetY}
          isActive={isActive}
          effect={data.effect}
          color={color}
        />
      )}
      {/* Arrowhead markers */}
      <defs>
        {isResponse ? (
          /* Hollow return arrow for response edges */
          <marker
            id={markerId}
            viewBox="0 0 12 8"
            refX="11"
            refY="4"
            markerWidth="7"
            markerHeight="5"
            orient="auto-start-reverse"
          >
            <path d="M 0 0.5 L 10 4 L 0 7.5 L 2.5 4 Z" fill="none" stroke={resolvedColor} strokeWidth="1.5" />
          </marker>
        ) : (
          /* Filled chevron arrowhead for forward calls */
          <marker
            id={markerId}
            viewBox="0 0 12 8"
            refX="11"
            refY="4"
            markerWidth="8"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 0.5 L 10 4 L 0 7.5 L 2.5 4 Z" fill={resolvedColor} />
          </marker>
        )}
      </defs>
      {/* Static label — shown when not traveling */}
      {showStaticLabel && (
        <EdgeLabelRenderer>
          <div
            className={`service-call-label ${isActive ? 'service-call-label--active' : ''}`}
            style={{
              position: 'absolute',
              transform: isSelfLoop
                ? `translate(0, -50%) translate(${labelX}px, ${labelY}px)`
                : computeLabelTransform(
                    labelX, labelY, sourceX, sourceY, targetX, targetY,
                    isResponse, isBidirectional, sourceEdgeIndex, sourceEdgeCount,
                  ),
              pointerEvents: 'all',
              ...(isActive ? activeLabelStyles : labelStyles),
            }}
          >
            {badge && !isResponse && (
              <span className="service-call-label__badge" style={{ color }}>{badge.icon}</span>
            )}
            {isResponse && (
              <span className="service-call-label__badge" style={{ color, opacity: 0.6 }}>↩</span>
            )}
            {labelParts.primary && <span className="service-call-label__primary">{labelParts.primary}</span>}
            {labelParts.secondary && <span className="service-call-label__secondary"> {labelParts.secondary}</span>}
            {labelParts.tertiary && <span className="service-call-label__tertiary"> {labelParts.tertiary}</span>}
          </div>
        </EdgeLabelRenderer>
      )}
      {/* Traveling label — rides along the edge path when active */}
      <EdgeLabelRenderer>
        <AnimatePresence>
          {showTravelingLabel && (
            <motion.div
              key={`traveling-${id}`}
              className="service-call-label service-call-label--active service-call-label--traveling"
              style={{
                position: 'absolute',
                offsetPath: `path('${edgePath}')`,
                offsetRotate: '0deg',
                offsetAnchor: 'center',
                pointerEvents: 'none',
                ...activeLabelStyles,
              }}
              initial={{ opacity: 0, offsetDistance: '0%' }}
              animate={{
                opacity: 1,
                offsetDistance: ['0%', '100%', '100%', '0%'],
              }}
              exit={{ opacity: 0 }}
              transition={{
                opacity: { duration: 0.3 },
                offsetDistance: {
                  duration: travelDuration,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  times: [0, 0.45, 0.55, 1],
                },
              }}
            >
              {badge && !isResponse && (
                <span className="service-call-label__badge" style={{ color }}>{badge.icon}</span>
              )}
              {labelParts.primary && <span className="service-call-label__primary">{labelParts.primary}</span>}
              {labelParts.secondary && <span className="service-call-label__secondary"> {labelParts.secondary}</span>}
              {labelParts.tertiary && <span className="service-call-label__tertiary"> {labelParts.tertiary}</span>}
            </motion.div>
          )}
        </AnimatePresence>
      </EdgeLabelRenderer>
      {/* Stream particles — continuous flow along the edge path */}
      {streamConfig && (
        <EdgeLabelRenderer>
          <AnimatePresence>
            {isActive && particleIndices.map(i => {
              const hasEmojis = streamConfig.particles && streamConfig.particles.length > 0;
              const content = hasEmojis
                ? streamConfig.particles![i % streamConfig.particles!.length]
                : null;

              return (
                <motion.div
                  key={`stream-${id}-${i}`}
                  className="stream-particle"
                  style={{
                    position: 'absolute',
                    offsetPath: `path('${edgePath}')`,
                    offsetRotate: '0deg',
                    offsetAnchor: 'center',
                  }}
                  initial={{ opacity: 0, offsetDistance: '0%' }}
                  animate={{
                    opacity: streamConfig.fade ? [0, 1, 1, 0] : 1,
                    offsetDistance: ['0%', '100%'],
                  }}
                  exit={{ opacity: 0 }}
                  transition={{
                    offsetDistance: {
                      duration: streamConfig.speed,
                      repeat: Infinity,
                      ease: 'linear',
                      delay: (i / streamConfig.density) * streamConfig.speed,
                    },
                    opacity: streamConfig.fade
                      ? {
                          duration: streamConfig.speed,
                          repeat: Infinity,
                          ease: 'linear',
                          delay: (i / streamConfig.density) * streamConfig.speed,
                          times: [0, 0.1, 0.85, 1],
                        }
                      : { duration: 0.3 },
                  }}
                >
                  {content ? (
                    <span className="stream-particle__emoji">{content}</span>
                  ) : (
                    <span
                      className="stream-particle__dot"
                      style={{ backgroundColor: streamColor }}
                    />
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
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
