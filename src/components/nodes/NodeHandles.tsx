import { Handle, Position } from '@xyflow/react';

/**
 * Standard handles for all 4 sides of a node.
 * Allows edges to connect from any direction based on relative position.
 */
export function NodeHandles() {
  return (
    <>
      {/* Target handles (incoming edges) */}
      <Handle 
        type="target" 
        position={Position.Top} 
        id="target-top"
        style={{ background: 'transparent', border: 'none' }}
      />
      <Handle 
        type="target" 
        position={Position.Bottom} 
        id="target-bottom"
        style={{ background: 'transparent', border: 'none' }}
      />
      <Handle 
        type="target" 
        position={Position.Left} 
        id="target-left"
        style={{ background: 'transparent', border: 'none' }}
      />
      <Handle 
        type="target" 
        position={Position.Right} 
        id="target-right"
        style={{ background: 'transparent', border: 'none' }}
      />
      
      {/* Source handles (outgoing edges) */}
      <Handle 
        type="source" 
        position={Position.Top} 
        id="source-top"
        style={{ background: 'transparent', border: 'none' }}
      />
      <Handle 
        type="source" 
        position={Position.Bottom} 
        id="source-bottom"
        style={{ background: 'transparent', border: 'none' }}
      />
      <Handle 
        type="source" 
        position={Position.Left} 
        id="source-left"
        style={{ background: 'transparent', border: 'none' }}
      />
      <Handle 
        type="source" 
        position={Position.Right} 
        id="source-right"
        style={{ background: 'transparent', border: 'none' }}
      />
    </>
  );
}

/**
 * Determine the best handle positions based on source and target positions.
 * Returns [sourceHandle, targetHandle] ids.
 */
export function getBestHandles(
  sourcePos: { x: number; y: number },
  targetPos: { x: number; y: number }
): [string, string] {
  const dx = targetPos.x - sourcePos.x;
  const dy = targetPos.y - sourcePos.y;

  // Determine primary direction
  const absDx = Math.abs(dx);
  const absDy = Math.abs(dy);

  if (absDy > absDx) {
    // Vertical connection preferred
    if (dy > 0) {
      // Target is below source
      return ['source-bottom', 'target-top'];
    } else {
      // Target is above source
      return ['source-top', 'target-bottom'];
    }
  } else {
    // Horizontal connection preferred
    if (dx > 0) {
      // Target is to the right
      return ['source-right', 'target-left'];
    } else {
      // Target is to the left
      return ['source-left', 'target-right'];
    }
  }
}

/**
 * Node rectangle for dimension-aware handle selection.
 */
export interface NodeRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Dimension-aware smart handle selection.
 * Computes actual handle anchor points (midpoints of each side) and picks
 * the source–target pair with the shortest Euclidean distance.
 * Returns [sourceHandle, targetHandle] ids.
 */
export function getSmartHandles(
  source: NodeRect,
  target: NodeRect
): [string, string] {
  const sourceAnchors = {
    right:  { x: source.x + source.width,    y: source.y + source.height / 2 },
    left:   { x: source.x,                    y: source.y + source.height / 2 },
    bottom: { x: source.x + source.width / 2, y: source.y + source.height },
    top:    { x: source.x + source.width / 2, y: source.y },
  };
  const targetAnchors = {
    left:   { x: target.x,                    y: target.y + target.height / 2 },
    right:  { x: target.x + target.width,     y: target.y + target.height / 2 },
    top:    { x: target.x + target.width / 2, y: target.y },
    bottom: { x: target.x + target.width / 2, y: target.y + target.height },
  };

  let bestDist = Infinity;
  let bestSource = 'right';
  let bestTarget = 'left';

  for (const [sKey, sPos] of Object.entries(sourceAnchors)) {
    for (const [tKey, tPos] of Object.entries(targetAnchors)) {
      const dist = Math.hypot(tPos.x - sPos.x, tPos.y - sPos.y);
      if (dist < bestDist) {
        bestDist = dist;
        bestSource = sKey;
        bestTarget = tKey;
      }
    }
  }

  return [`source-${bestSource}`, `target-${bestTarget}`];
}
