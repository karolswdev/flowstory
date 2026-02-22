import { memo } from 'react';
import type { NodeProps } from '@xyflow/react';

export interface ZoneNodeData {
  label: string;
  color?: string;
  width: number;
  height: number;
  [key: string]: unknown;
}

function ZoneNodeInner({ data }: NodeProps<ZoneNodeData>) {
  const { label, color, width, height } = data;

  return (
    <div
      className="service-zone"
      style={{
        width,
        height,
        background: color || 'rgba(59, 130, 246, 0.06)',
      }}
    >
      <span className="service-zone__label">{label}</span>
    </div>
  );
}

export const ZoneNode = memo(ZoneNodeInner);
