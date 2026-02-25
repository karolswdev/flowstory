import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { lightTheme, darkTheme, type ThemeTokens } from './tokens';

export interface ThemeContextValue {
  /** Current theme */
  theme: ThemeTokens;
  /** Current theme name */
  themeName: 'light' | 'dark';
  /** Whether dark mode is active */
  isDark: boolean;
  /** Toggle between light and dark */
  toggleTheme: () => void;
  /** Set specific theme */
  setTheme: (name: 'light' | 'dark') => void;
}

export const ThemeContext = createContext<ThemeContextValue | null>(null);

/** Storage key for theme preference */
const THEME_STORAGE_KEY = 'user-story-viz-theme';

/** Apply theme CSS variables to document — must match tokens.css naming */
function applyThemeToDocument(theme: ThemeTokens) {
  const root = document.documentElement;

  // Typography
  root.style.setProperty('--font-family', theme.fontFamily);
  root.style.setProperty('--font-family-display', theme.fontFamilyDisplay);
  root.style.setProperty('--font-family-mono', theme.fontFamilyMono);

  // Brand
  root.style.setProperty('--color-primary', theme.primary);
  root.style.setProperty('--color-primary-hover', theme.primaryHover);
  root.style.setProperty('--color-secondary', theme.secondary);

  // Backgrounds
  root.style.setProperty('--color-bg', theme.bgPrimary);
  root.style.setProperty('--color-bg-secondary', theme.bgSecondary);
  root.style.setProperty('--color-bg-tertiary', theme.bgTertiary);
  root.style.setProperty('--color-bg-elevated', theme.bgElevated);

  // Aliases for global.css consumers
  root.style.setProperty('--color-bg-primary', theme.bgPrimary);

  // Surfaces
  root.style.setProperty('--color-surface-primary', theme.surfacePrimary);
  root.style.setProperty('--color-surface-secondary', theme.surfaceSecondary);
  root.style.setProperty('--color-surface-border', theme.surfaceBorder);

  // Text
  root.style.setProperty('--color-text', theme.textPrimary);
  root.style.setProperty('--color-text-secondary', theme.textSecondary);
  root.style.setProperty('--color-text-muted', theme.textMuted);
  root.style.setProperty('--color-text-inverse', theme.textInverse);

  // Alias for global.css consumers
  root.style.setProperty('--color-text-primary', theme.textPrimary);

  // Borders
  root.style.setProperty('--color-border', theme.border);
  root.style.setProperty('--color-border-strong', theme.borderStrong);

  // Nodes
  root.style.setProperty('--color-node-actor', theme.nodeActor);
  root.style.setProperty('--color-node-action', theme.nodeAction);
  root.style.setProperty('--color-node-decision', theme.nodeDecision);
  root.style.setProperty('--color-node-system', theme.nodeSystem);
  root.style.setProperty('--color-node-event', theme.nodeEvent);
  root.style.setProperty('--color-node-state-success', theme.nodeStateSuccess);
  root.style.setProperty('--color-node-state-error', theme.nodeStateError);
  root.style.setProperty('--color-node-state-pending', theme.nodeStatePending);

  // Edges
  root.style.setProperty('--color-edge-flow', theme.edgeFlow);
  root.style.setProperty('--color-edge-event', theme.edgeEvent);
  root.style.setProperty('--color-edge-error', theme.edgeError);
  root.style.setProperty('--color-edge-async', theme.edgeAsync);

  // Status
  root.style.setProperty('--color-success', theme.success);
  root.style.setProperty('--color-warning', theme.warning);
  root.style.setProperty('--color-error', theme.error);
  root.style.setProperty('--color-info', theme.info);

  // Shadows
  root.style.setProperty('--shadow-sm', theme.shadowSm);
  root.style.setProperty('--shadow-md', theme.shadowMd);
  root.style.setProperty('--shadow-lg', theme.shadowLg);

  // Set data attribute for CSS selectors
  root.setAttribute('data-theme', theme.name);
}

export interface ThemeProviderProps {
  children: ReactNode;
  /** Default theme */
  defaultTheme?: 'light' | 'dark';
  /** Force theme — overrides localStorage and system preference (for embeds) */
  forceTheme?: 'light' | 'dark';
}

export function ThemeProvider({ children, defaultTheme = 'light', forceTheme }: ThemeProviderProps) {
  const [themeName, setThemeName] = useState<'light' | 'dark'>(() => {
    // URL-forced theme overrides everything (for iframe embeds)
    if (forceTheme) {
      return forceTheme;
    }
    // Check localStorage
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(THEME_STORAGE_KEY);
      if (stored === 'light' || stored === 'dark') {
        return stored;
      }
      // Check system preference
      if (window.matchMedia?.('(prefers-color-scheme: dark)').matches) {
        return 'dark';
      }
    }
    return defaultTheme;
  });

  const theme = themeName === 'dark' ? darkTheme : lightTheme;

  // Apply theme on mount and changes
  useEffect(() => {
    applyThemeToDocument(theme);
    localStorage.setItem(THEME_STORAGE_KEY, themeName);
  }, [theme, themeName]);

  const toggleTheme = useCallback(() => {
    setThemeName(prev => prev === 'light' ? 'dark' : 'light');
  }, []);

  const setTheme = useCallback((name: 'light' | 'dark') => {
    setThemeName(name);
  }, []);

  const value: ThemeContextValue = {
    theme,
    themeName,
    isDark: themeName === 'dark',
    toggleTheme,
    setTheme,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

/** Hook to access theme context */
export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
