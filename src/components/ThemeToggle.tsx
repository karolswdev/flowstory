import { useTheme } from '../themes';
import './ThemeToggle.css';

export interface ThemeToggleProps {
  /** Show label text */
  showLabel?: boolean;
}

/**
 * ThemeToggle - Button to switch between light and dark themes
 */
export function ThemeToggle({ showLabel = false }: ThemeToggleProps) {
  const { isDark, toggleTheme, themeName } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="theme-toggle"
      data-testid="theme-toggle"
      data-theme={themeName}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} theme`}
      title={`Switch to ${isDark ? 'light' : 'dark'} theme`}
    >
      <span className="theme-icon">{isDark ? '☀️' : '🌙'}</span>
      {showLabel && (
        <span className="theme-label" data-testid="theme-label">
          {isDark ? 'Light' : 'Dark'}
        </span>
      )}
    </button>
  );
}

export default ThemeToggle;
