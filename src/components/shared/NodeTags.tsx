import { memo, useMemo } from 'react';
import './node-tags.css';

export type TagCategory = 'infra' | 'metric' | 'identity' | 'status';

const CATEGORY_MAP: Record<string, TagCategory> = {
  // infra
  protocol: 'infra',
  broker: 'infra',
  runtime: 'infra',
  cloud: 'infra',
  platform: 'infra',
  region: 'infra',
  framework: 'infra',
  language: 'infra',
  // metric
  instances: 'metric',
  depth: 'metric',
  consumers: 'metric',
  throughput: 'metric',
  latency: 'metric',
  replicas: 'metric',
  cpu: 'metric',
  memory: 'metric',
  rps: 'metric',
  // identity
  version: 'identity',
  team: 'identity',
  owner: 'identity',
  domain: 'identity',
  namespace: 'identity',
  // status
  sla: 'status',
  health: 'status',
  tier: 'status',
  env: 'status',
  stage: 'status',
};

export function getTagCategory(key: string): TagCategory {
  return CATEGORY_MAP[key.toLowerCase()] ?? 'infra';
}

export interface NodeTagsProps {
  tags?: Record<string, string>;
  maxVisible?: number;
  compact?: boolean;
  className?: string;
}

export const NodeTags = memo(function NodeTags({
  tags,
  maxVisible = 4,
  compact = false,
  className,
}: NodeTagsProps) {
  const entries = useMemo(
    () => (tags ? Object.entries(tags) : []),
    [tags],
  );

  if (entries.length === 0) return null;

  const visible = entries.slice(0, maxVisible);
  const overflow = entries.length - maxVisible;

  return (
    <div className={`node-tags${compact ? ' node-tags--compact' : ''}${className ? ` ${className}` : ''}`}>
      {visible.map(([key, value]) => {
        const category = getTagCategory(key);
        return (
          <span
            key={key}
            className={`node-tag node-tag--${category}`}
            title={`${key}: ${value}`}
          >
            {value}
          </span>
        );
      })}
      {overflow > 0 && (
        <span
          className="node-tag node-tag--overflow"
          title={entries.slice(maxVisible).map(([k, v]) => `${k}: ${v}`).join('\n')}
        >
          +{overflow}
        </span>
      )}
    </div>
  );
});
