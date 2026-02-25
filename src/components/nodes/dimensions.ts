/**
 * Node dimensions by canvas/type for smart edge routing.
 * Values sourced from CSS and layout constants in each renderer's schema.
 */

/** Character-width estimates for text measurement (proportional avg at given font size) */
const CHAR_WIDTH_NAME = 9.5;     // ~14px semibold font (Inter)
const CHAR_WIDTH_DETAIL = 7.0;   // ~12px regular font
const CHAR_WIDTH_SHAPE = 8.0;    // ~13px font inside shapes

/** Width clamp ranges per node category */
const SERVICE_WIDTH_RANGE = { min: 200, max: 360 } as const;
const SHAPE_WIDTH_RANGE   = { min: 140, max: 280 } as const;
const QUEUE_WIDTH_RANGE   = { min: 160, max: 280 } as const;

/**
 * Estimate node width from text content. Returns clamped pixel width.
 */
export function measureServiceNodeWidth(
  name: string,
  type?: string,
  technology?: string,
): number {
  // Header line: icon(32px) + gap(8px) + name + gap(8px) + version(~44px) + padding(16px)
  const nameWidth = name.length * CHAR_WIDTH_NAME + 108;
  // Detail line: type + " • " + technology
  const detailText = [type, technology].filter(Boolean).join(' • ');
  const detailWidth = detailText.length * CHAR_WIDTH_DETAIL + 24;
  const contentWidth = Math.max(nameWidth, detailWidth);
  return Math.round(Math.max(SERVICE_WIDTH_RANGE.min, Math.min(SERVICE_WIDTH_RANGE.max, contentWidth)));
}

export function measureShapeNodeWidth(name: string, technology?: string): number {
  const nameWidth = name.length * CHAR_WIDTH_SHAPE + 32;
  const techWidth = technology ? technology.length * CHAR_WIDTH_DETAIL + 32 : 0;
  const contentWidth = Math.max(nameWidth, techWidth);
  return Math.round(Math.max(SHAPE_WIDTH_RANGE.min, Math.min(SHAPE_WIDTH_RANGE.max, contentWidth)));
}

export function measureQueueNodeWidth(name: string, type?: string, broker?: string): number {
  const nameWidth = name.length * CHAR_WIDTH_NAME + 44;
  const detailText = [type, broker].filter(Boolean).join(' • ');
  const detailWidth = detailText.length * CHAR_WIDTH_DETAIL + 24;
  const contentWidth = Math.max(nameWidth, detailWidth);
  return Math.round(Math.max(QUEUE_WIDTH_RANGE.min, Math.min(QUEUE_WIDTH_RANGE.max, contentWidth)));
}

export const NODE_DIMENSIONS = {
  // service-flow — generic service (rectangle) and queue
  service:   { width: 200, height: 68 },
  queue:     { width: 160, height: 56 },
  // service-flow — distinct visual shapes
  database:        { width: 160, height: 100 },
  'event-bus':     { width: 180, height: 90 },
  gateway:         { width: 120, height: 120 },
  external:        { width: 180, height: 90 },
  worker:          { width: 180, height: 80 },
  'event-processor': { width: 220, height: 90 },
  workflow:        { width: 180, height: 70 },
  cache:           { width: 120, height: 120 },
  // service-flow — 8 new shape types
  client:          { width: 180, height: 80 },
  firewall:        { width: 140, height: 140 },
  'load-balancer': { width: 180, height: 80 },
  scheduler:       { width: 120, height: 120 },
  storage:         { width: 200, height: 80 },
  function:        { width: 180, height: 80 },
  monitor:         { width: 180, height: 80 },
  'human-task':    { width: 180, height: 80 },
  'event-stream':  { width: 420, height: 72 },
  // service-flow — 10 domain-level shape types
  entity:            { width: 160, height: 100 },
  aggregate:         { width: 180, height: 90 },
  'value-object':    { width: 160, height: 80 },
  'domain-event':    { width: 180, height: 96 },
  policy:            { width: 140, height: 120 },
  'read-model':      { width: 180, height: 80 },
  saga:              { width: 200, height: 80 },
  repository:        { width: 160, height: 100 },
  'bounded-context': { width: 220, height: 100 },
  actor:             { width: 160, height: 80 },

  // http-flow (CSS: participant min-width 120px ~80h; request/response min-width 280px ~90h)
  participant: { width: 120, height: 80 },
  request:     { width: 280, height: 90 },
  response:    { width: 280, height: 90 },

  // pipeline (CSS: stage min-width 260px, min-height 120px; job min-width 220px, JOB_HEIGHT 60; gate min-width 120px ~60h)
  stage: { width: 260, height: 120 },
  job:   { width: 220, height: 60 },
  gate:  { width: 120, height: 60 },

  // bc-deployment (CSS: bc-core 140×140; artifact 100–160 → ~130×100; child 80–140 → ~100×50)
  bcCore:        { width: 140, height: 140 },
  artifact:      { width: 130, height: 100 },
  childArtifact: { width: 100, height: 50 },

  // bc-composition (CSS: core 160×160; element 140–180 → ~160×90; child 100× ~50)
  compositionCore:    { width: 160, height: 160 },
  compositionElement: { width: 160, height: 90 },
  compositionChild:   { width: 100, height: 50 },

  // state-diagram (schema: NODE_WIDTH 192, NODE_HEIGHT 56; initial/terminal 32+80 × 32; choice 56 × 76)
  stateNormal:   { width: 192, height: 56 },
  stateInitial:  { width: 112, height: 32 },
  stateTerminal: { width: 112, height: 32 },
  stateChoice:   { width: 56, height: 76 },
} as const;

export type NodeDimensionKey = keyof typeof NODE_DIMENSIONS;
