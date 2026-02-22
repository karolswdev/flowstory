import { memo } from 'react';
import type { NodeProps } from '@xyflow/react';

export interface StatePhaseNodeData {
  label: string;
  color?: string;
  width: number;
  height: number;
  [key: string]: unknown;
}

function StatePhaseNodeInner({ data }: NodeProps<StatePhaseNodeData>) {
  const { label, color, width, height } = data;

  return (
    <div
      className="state-diagram-phase"
      style={{
        width,
        height,
        background: color || 'rgba(33, 150, 243, 0.05)',
      }}
    >
      <span className="phase-label">{label}</span>
    </div>
  );
}

export const StatePhaseNode = memo(StatePhaseNodeInner);
