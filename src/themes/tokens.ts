/**
 * Design tokens for FlowStory theming (JS)
 *
 * Must stay aligned with src/styles/tokens.css.
 * ThemeContext applies these as CSS custom properties.
 */

export interface ThemeTokens {
  name: 'light' | 'dark';

  // Typography
  fontFamily: string;
  fontFamilyDisplay: string;
  fontFamilyMono: string;

  // Brand colors
  primary: string;
  primaryHover: string;
  secondary: string;

  // Background colors
  bgPrimary: string;
  bgSecondary: string;
  bgTertiary: string;
  bgElevated: string;

  // Surface colors (aliases for bg)
  surfacePrimary: string;
  surfaceSecondary: string;
  surfaceBorder: string;

  // Text colors
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textInverse: string;

  // Border colors
  border: string;
  borderStrong: string;

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

/** Light Theme — Tailwind palette */
export const lightTheme: ThemeTokens = {
  name: 'light',

  // Typography
  fontFamily: "'Plus Jakarta Sans', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
  fontFamilyDisplay: "'DM Sans', 'Plus Jakarta Sans', sans-serif",
  fontFamilyMono: "'JetBrains Mono', 'SF Mono', 'Fira Code', monospace",

  // Brand
  primary: '#3b82f6',
  primaryHover: '#2563eb',
  secondary: '#22c55e',

  // Backgrounds
  bgPrimary: '#ffffff',
  bgSecondary: '#f8fafc',
  bgTertiary: '#f1f5f9',
  bgElevated: '#ffffff',

  // Surfaces
  surfacePrimary: '#ffffff',
  surfaceSecondary: '#f8fafc',
  surfaceBorder: '#e2e8f0',

  // Text
  textPrimary: '#0f172a',
  textSecondary: '#64748b',
  textMuted: '#94a3b8',
  textInverse: '#ffffff',

  // Borders
  border: '#e2e8f0',
  borderStrong: '#cbd5e1',

  // Nodes
  nodeActor: '#a855f7',
  nodeAction: '#22c55e',
  nodeDecision: '#f97316',
  nodeSystem: '#3b82f6',
  nodeEvent: '#f59e0b',
  nodeStateSuccess: '#22c55e',
  nodeStateError: '#ef4444',
  nodeStatePending: '#f59e0b',

  // Edges
  edgeFlow: '#3b82f6',
  edgeEvent: '#f59e0b',
  edgeError: '#ef4444',
  edgeAsync: '#8b5cf6',

  // Status
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',

  // Shadows
  shadowSm: '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)',
  shadowMd: '0 4px 8px rgba(0, 0, 0, 0.12), 0 2px 4px rgba(0, 0, 0, 0.08)',
  shadowLg: '0 10px 20px rgba(0, 0, 0, 0.12), 0 4px 8px rgba(0, 0, 0, 0.06)',
};

/** Dark Theme — Tailwind palette */
export const darkTheme: ThemeTokens = {
  name: 'dark',

  // Typography
  fontFamily: "'Plus Jakarta Sans', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
  fontFamilyDisplay: "'DM Sans', 'Plus Jakarta Sans', sans-serif",
  fontFamilyMono: "'JetBrains Mono', 'SF Mono', 'Fira Code', monospace",

  // Brand
  primary: '#60a5fa',
  primaryHover: '#3b82f6',
  secondary: '#4ade80',

  // Backgrounds — deep navy
  bgPrimary: '#0B0B1F',
  bgSecondary: '#12122B',
  bgTertiary: '#1C1C3A',
  bgElevated: '#161635',

  // Surfaces
  surfacePrimary: '#0B0B1F',
  surfaceSecondary: '#12122B',
  surfaceBorder: 'rgba(255, 255, 255, 0.08)',

  // Text — tuned for navy contrast
  textPrimary: '#E8EAF0',
  textSecondary: '#8B8FAA',
  textMuted: '#5C5F7A',
  textInverse: '#0B0B1F',

  // Borders — subtle white alpha
  border: 'rgba(255, 255, 255, 0.08)',
  borderStrong: 'rgba(255, 255, 255, 0.15)',

  // Nodes
  nodeActor: '#c084fc',
  nodeAction: '#4ade80',
  nodeDecision: '#fb923c',
  nodeSystem: '#60a5fa',
  nodeEvent: '#fbbf24',
  nodeStateSuccess: '#4ade80',
  nodeStateError: '#f87171',
  nodeStatePending: '#fbbf24',

  // Edges
  edgeFlow: '#60a5fa',
  edgeEvent: '#fbbf24',
  edgeError: '#f87171',
  edgeAsync: '#a78bfa',

  // Status
  success: '#34d399',
  warning: '#fbbf24',
  error: '#f87171',
  info: '#60a5fa',

  // Shadows — layered depth
  shadowSm: '0 2px 6px rgba(0,0,0,0.5), 0 0 2px rgba(0,0,0,0.3), 0 0 20px rgba(10,10,40,0.3)',
  shadowMd: '0 4px 12px rgba(0,0,0,0.6), 0 0 4px rgba(0,0,0,0.3), 0 0 30px rgba(10,10,40,0.25)',
  shadowLg: '0 8px 24px rgba(0,0,0,0.6), 0 0 6px rgba(0,0,0,0.3), 0 0 40px rgba(15,15,50,0.2)',
};

/** Get theme by name */
export function getTheme(name: 'light' | 'dark'): ThemeTokens {
  return name === 'dark' ? darkTheme : lightTheme;
}
