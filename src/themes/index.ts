export { ThemeProvider, ThemeContext, useTheme, type ThemeContextValue, type ThemeProviderProps } from './ThemeContext';
export { lightTheme, darkTheme, getTheme, type ThemeTokens } from './tokens';

/** Theme name type */
export type Theme = 'light' | 'dark';
