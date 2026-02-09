/**
 * Design tokens for FlowStory theming
 */

export interface ThemeTokens {
  name: 'light' | 'dark';
  
  // Brand colors
  primary: string;
  primaryHover: string;
  secondary: string;
  
  // Background colors
  bgPrimary: string;
  bgSecondary: string;
  bgTertiary: string;
  
  // Surface colors (cards, panels)
  surfacePrimary: string;
  surfaceSecondary: string;
  surfaceBorder: string;
  
  // Text colors
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textInverse: string;
  
  // Node colors
  nodeActor: string;
  nodeAction: string;
  nodeDecision: string;
  nodeSystem: string;
  nodeEvent: string;
  nodeStateSuccess: string;
  nodeStateError: string;
  nodeStatePending: string;
  
  // Edge colors
  edgeFlow: string;
  edgeEvent: string;
  edgeError: string;
  edgeAsync: string;
  
  // Status colors
  success: string;
  warning: string;
  error: string;
  info: string;
  
  // Shadows
  shadowSm: string;
  shadowMd: string;
  shadowLg: string;
}

/** Light Theme */
export const lightTheme: ThemeTokens = {
  name: 'light',
  
  // Brand
  primary: '#2196F3',
  primaryHover: '#1976D2',
  secondary: '#4CAF50',
  
  // Backgrounds
  bgPrimary: '#ffffff',
  bgSecondary: '#f5f5f5',
  bgTertiary: '#e0e0e0',
  
  // Surfaces
  surfacePrimary: '#ffffff',
  surfaceSecondary: '#fafafa',
  surfaceBorder: '#e0e0e0',
  
  // Text
  textPrimary: '#1a1a1a',
  textSecondary: '#666666',
  textMuted: '#999999',
  textInverse: '#ffffff',
  
  // Nodes
  nodeActor: '#4CAF50',
  nodeAction: '#E8F5E9',
  nodeDecision: '#FF9800',
  nodeSystem: '#2196F3',
  nodeEvent: '#FFC107',
  nodeStateSuccess: '#4CAF50',
  nodeStateError: '#F44336',
  nodeStatePending: '#FFC107',
  
  // Edges
  edgeFlow: '#4CAF50',
  edgeEvent: '#FFC107',
  edgeError: '#F44336',
  edgeAsync: '#9C27B0',
  
  // Status
  success: '#4CAF50',
  warning: '#FF9800',
  error: '#F44336',
  info: '#2196F3',
  
  // Shadows
  shadowSm: '0 1px 2px rgba(0, 0, 0, 0.05)',
  shadowMd: '0 4px 6px rgba(0, 0, 0, 0.1)',
  shadowLg: '0 10px 15px rgba(0, 0, 0, 0.1)',
};

/** Dark Theme */
export const darkTheme: ThemeTokens = {
  name: 'dark',
  
  // Brand
  primary: '#64B5F6',
  primaryHover: '#42A5F5',
  secondary: '#81C784',
  
  // Backgrounds
  bgPrimary: '#121212',
  bgSecondary: '#1e1e1e',
  bgTertiary: '#2d2d2d',
  
  // Surfaces
  surfacePrimary: '#1e1e1e',
  surfaceSecondary: '#252525',
  surfaceBorder: '#3d3d3d',
  
  // Text
  textPrimary: '#f5f5f5',
  textSecondary: '#b0b0b0',
  textMuted: '#757575',
  textInverse: '#121212',
  
  // Nodes (slightly muted for dark mode)
  nodeActor: '#66BB6A',
  nodeAction: '#1B5E20',
  nodeDecision: '#FFB74D',
  nodeSystem: '#64B5F6',
  nodeEvent: '#FFD54F',
  nodeStateSuccess: '#66BB6A',
  nodeStateError: '#EF5350',
  nodeStatePending: '#FFD54F',
  
  // Edges
  edgeFlow: '#66BB6A',
  edgeEvent: '#FFD54F',
  edgeError: '#EF5350',
  edgeAsync: '#BA68C8',
  
  // Status
  success: '#66BB6A',
  warning: '#FFB74D',
  error: '#EF5350',
  info: '#64B5F6',
  
  // Shadows (more prominent for dark mode)
  shadowSm: '0 1px 2px rgba(0, 0, 0, 0.3)',
  shadowMd: '0 4px 6px rgba(0, 0, 0, 0.4)',
  shadowLg: '0 10px 15px rgba(0, 0, 0, 0.5)',
};

/** Get theme by name */
export function getTheme(name: 'light' | 'dark'): ThemeTokens {
  return name === 'dark' ? darkTheme : lightTheme;
}
