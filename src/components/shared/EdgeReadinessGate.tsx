import { useEffect } from 'react';
import { useNodesInitialized } from '@xyflow/react';

/**
 * Inner component (must be a child of <ReactFlow>) that waits for all
 * visible nodes to be DOM-measured before signalling edge readiness.
 *
 * useNodesInitialized() returns true only after every node's
 * ResizeObserver has fired — meaning actual pixel dimensions, not
 * Dagre/layout estimates. This is critical in iframes and embed mode
 * where the first layout paint can be deferred, causing edges to
 * connect to stale (0,0) handle positions on the initial render.
 */
export function EdgeReadinessGate({ onReady }: { onReady: () => void }) {
  const nodesInitialized = useNodesInitialized();
  useEffect(() => {
    if (nodesInitialized) {
      // One extra frame for handle positions to settle after measurement
      requestAnimationFrame(() => onReady());
    }
  }, [nodesInitialized, onReady]);
  return null;
}
