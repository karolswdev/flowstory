import { memo } from 'react';
import type { NodeProps } from '@xyflow/react';

export interface ZoneNodeData {
  label: string;
  color?: string;
  width: number;
  height: number;
  [key: string]: unknown;
}

/**
 * Parse an rgba color string into its components.
 * Returns a slightly stronger opacity variant for borders and label pills.
 */
function deriveZoneStyles(color?: string) {
  if (!color) {
    return {
      fill: 'color-mix(in srgb, var(--color-primary) 6%, transparent)',
      border: 'color-mix(in srgb, var(--color-primary) 25%, transparent)',
      labelBg: 'color-mix(in srgb, var(--color-primary) 12%, transparent)',
    };
  }
  // color is typically rgba(..., 0.06) from ZONE_COLORS
  // We derive stronger variants for border and label
  return {
    fill: color,
    border: color.replace(/[\d.]+\)$/, '0.25)'),
    labelBg: color.replace(/[\d.]+\)$/, '0.12)'),
  };
}

function ZoneNodeInner({ data }: NodeProps<ZoneNodeData>) {
  const { label, color, width, height } = data;
  const styles = deriveZoneStyles(color);

  return (
    <div
      className="service-zone"
      style={{
        width,
        height,
        background: `linear-gradient(180deg, ${styles.fill}, transparent)`,
        borderColor: styles.border,
      }}
    >
      <span
        className="service-zone__label"
        style={{ background: styles.labelBg }}
      >
        {label}
      </span>
    </div>
  );
}

export const ZoneNode = memo(ZoneNodeInner);
