/**
 * Standardized Node Sizes
 * 
 * Use these for consistent, predictable layouts.
 * Font sizes scale proportionally with node size.
 */

export type NodeSize = 'xs' | 's' | 'm' | 'l' | 'xl';

export interface SizeConfig {
  width: number;
  height: number;
  fontSize: number;
  iconSize: number;
  padding: number;
}

/**
 * Size presets
 */
export const SIZE_PRESETS: Record<NodeSize, SizeConfig> = {
  xs: {
    width: 70,
    height: 35,
    fontSize: 10,
    iconSize: 12,
    padding: 4,
  },
  s: {
    width: 100,
    height: 45,
    fontSize: 12,
    iconSize: 14,
    padding: 6,
  },
  m: {
    width: 140,
    height: 55,
    fontSize: 14,
    iconSize: 16,
    padding: 8,
  },
  l: {
    width: 180,
    height: 70,
    fontSize: 16,
    iconSize: 20,
    padding: 10,
  },
  xl: {
    width: 220,
    height: 90,
    fontSize: 18,
    iconSize: 24,
    padding: 12,
  },
};

/**
 * Default sizes by node type
 */
export const DEFAULT_NODE_SIZES: Record<string, NodeSize> = {
  // Actors are medium-small (circular, avatar)
  actor: 'm',
  
  // Actions are medium
  action: 'm',
  
  // Systems are large (important)
  system: 'l',
  
  // Events are small (badges)
  event: 's',
  
  // Decisions are medium (diamonds)
  decision: 'm',
  
  // States are small-medium
  state: 's',
  
  // Start/end are tiny
  start: 'xs',
  end: 'xs',
  
  // Default
  default: 'm',
};

/**
 * Get size config for a node
 */
export function getNodeSize(
  nodeType: string,
  explicitSize?: NodeSize
): SizeConfig {
  const size = explicitSize || DEFAULT_NODE_SIZES[nodeType] || DEFAULT_NODE_SIZES.default;
  return SIZE_PRESETS[size];
}

/**
 * Get CSS variables for a size
 */
export function getSizeStyles(size: SizeConfig): React.CSSProperties {
  return {
    '--node-width': `${size.width}px`,
    '--node-height': `${size.height}px`,
    '--node-font-size': `${size.fontSize}px`,
    '--node-icon-size': `${size.iconSize}px`,
    '--node-padding': `${size.padding}px`,
    width: size.width,
    height: size.height,
    fontSize: size.fontSize,
    padding: size.padding,
  } as React.CSSProperties;
}
