/**
 * Node dimensions by canvas/type for smart edge routing.
 * Values sourced from CSS and layout constants in each renderer's schema.
 */

export const NODE_DIMENSIONS = {
  // service-flow (CSS: min-width 200px, schema NODE_HEIGHT 80; queue min-width 160px, QUEUE_HEIGHT 60)
  service:   { width: 200, height: 80 },
  queue:     { width: 160, height: 60 },

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
