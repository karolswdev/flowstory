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
 * Size presets - clean, proportional sizing
 * Based on 8px grid with clear hierarchy
 */
export const SIZE_PRESETS: Record<NodeSize, SizeConfig> = {
  xs: {
    width: 96,
    height: 40,
    fontSize: 11,
    iconSize: 14,
    padding: 8,
  },
  s: {
    width: 144,
    height: 48,
    fontSize: 12,
    iconSize: 16,
    padding: 10,
  },
  m: {
    width: 192,
    height: 56,
    fontSize: 13,
    iconSize: 18,
    padding: 12,
  },
  l: {
    width: 240,
    height: 64,
    fontSize: 14,
    iconSize: 20,
    padding: 14,
  },
  xl: {
    width: 320,
    height: 80,
    fontSize: 16,
    iconSize: 24,
    padding: 16,
  },
};

/**
 * Default sizes by node type
 */
export const DEFAULT_NODE_SIZES: Record<string, NodeSize> = {
  // Actors are medium (circular, avatar + name)
  actor: 'm',
  
  // Actions are medium
  action: 'm',
  
  // Systems are large (important, often have descriptions)
  system: 'l',
  
  // Events are medium (names like "AccountCreatedEvent" need space)
  event: 'm',
  
  // Decisions are medium (diamonds)
  decision: 'm',
  
  // States are medium (need room for labels)
  state: 'm',
  
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
