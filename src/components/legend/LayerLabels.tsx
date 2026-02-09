import { memo } from 'react';
import './layer-labels.css';

/**
 * Layer configuration
 */
interface LayerConfig {
  id: 'orchestration' | 'domain' | 'infrastructure';
  label: string;
  shortLabel: string;
  icon: string;
  color: string;
  bgColor: string;
}

/**
 * Layer bounds for positioning
 */
interface LayerBounds {
  y: number;
  height: number;
}

/**
 * LayerLabels props
 */
interface LayerLabelsProps {
  /** Layer positions (y and height for each layer) */
  layers?: {
    orchestration?: LayerBounds;
    domain?: LayerBounds;
    infrastructure?: LayerBounds;
  };
  /** Whether to show labels */
  visible?: boolean;
  /** Use compact labels */
  compact?: boolean;
}

/**
 * Layer configurations
 */
const LAYERS: LayerConfig[] = [
  {
    id: 'orchestration',
    label: 'ORCHESTRATION',
    shortLabel: 'ORCH',
    icon: '⚡',
    color: '#7c4dff',
    bgColor: 'rgba(124, 77, 255, 0.08)',
  },
  {
    id: 'domain',
    label: 'DOMAIN',
    shortLabel: 'DOM',
    icon: '📦',
    color: '#4caf50',
    bgColor: 'rgba(76, 175, 80, 0.05)',
  },
  {
    id: 'infrastructure',
    label: 'INFRASTRUCTURE',
    shortLabel: 'INFRA',
    icon: '🔧',
    color: '#ff9800',
    bgColor: 'rgba(255, 152, 0, 0.08)',
  },
];

/**
 * Default layer bounds when not provided
 */
const DEFAULT_BOUNDS: Record<string, LayerBounds> = {
  orchestration: { y: 0, height: 150 },
  domain: { y: 150, height: 300 },
  infrastructure: { y: 450, height: 150 },
};

/**
 * LayerLabels - Left margin labels for canvas layers
 * 
 * Displays vertical text labels for Orchestration, Domain, and Infrastructure
 * layers with color-coded borders.
 */
export const LayerLabels = memo(function LayerLabels({
  layers = {},
  visible = true,
  compact = false,
}: LayerLabelsProps) {
  if (!visible) return null;

  return (
    <div className="layer-labels" data-testid="layer-labels">
      {LAYERS.map(layer => {
        const bounds = layers[layer.id] ?? DEFAULT_BOUNDS[layer.id];
        
        return (
          <div
            key={layer.id}
            className={`layer-label layer-label-${layer.id}`}
            style={{
              top: bounds.y,
              height: bounds.height,
              borderLeftColor: layer.color,
              backgroundColor: layer.bgColor,
            }}
            data-testid={`layer-label-${layer.id}`}
          >
            <div className="layer-label-content">
              <span className="layer-label-icon">{layer.icon}</span>
              <span className="layer-label-text">
                {compact ? layer.shortLabel : layer.label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
});

export default LayerLabels;
