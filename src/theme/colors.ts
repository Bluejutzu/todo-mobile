export interface ThemeColors {
  primary: string;
  secondary: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  border: string;
  error: string;
  success: string;
  warning: string;
  onPrimary: string; // Text color on primary background
  [key: string]: string; // Index signature for compatibility
}

export const themes = {
  light: {
    primary: '#6366f1', // Indigo
    secondary: '#8b5cf6', // Purple
    background: '#ffffff',
    surface: '#f9fafb',
    text: '#111827',
    textSecondary: '#6b7280',
    border: '#e5e7eb',
    error: '#ef4444',
    success: '#10b981',
    warning: '#f59e0b',
    onPrimary: '#ffffff',
  },
  dark: {
    primary: '#818cf8', // Light indigo
    secondary: '#a78bfa', // Light purple
    background: '#111827',
    surface: '#1f2937',
    text: '#f9fafb',
    textSecondary: '#9ca3af',
    border: '#374151',
    error: '#f87171',
    success: '#34d399',
    warning: '#fbbf24',
    onPrimary: '#ffffff',
  },
  midnight: {
    primary: '#ffffff',
    secondary: '#e5e7eb',
    background: '#000000',
    surface: '#0a0a0a',
    text: '#ffffff',
    textSecondary: '#9ca3af',
    border: '#1f1f1f',
    error: '#ff6b6b',
    success: '#51cf66',
    warning: '#ffd43b',
    onPrimary: '#000000',
  },
  ocean: {
    primary: '#0ea5e9', // Sky blue
    secondary: '#06b6d4', // Cyan
    background: '#0c4a6e',
    surface: '#075985',
    text: '#f0f9ff',
    textSecondary: '#bae6fd',
    border: '#0369a1',
    error: '#f87171',
    success: '#34d399',
    warning: '#fbbf24',
    onPrimary: '#ffffff',
  },
  forest: {
    primary: '#22c55e', // Green
    secondary: '#84cc16', // Lime
    background: '#14532d',
    surface: '#166534',
    text: '#f0fdf4',
    textSecondary: '#bbf7d0',
    border: '#15803d',
    error: '#f87171',
    success: '#4ade80',
    warning: '#fbbf24',
    onPrimary: '#ffffff',
  },
  sunset: {
    primary: '#f97316', // Orange
    secondary: '#f59e0b', // Amber
    background: '#7c2d12',
    surface: '#9a3412',
    text: '#fff7ed',
    textSecondary: '#fed7aa',
    border: '#c2410c',
    error: '#f87171',
    success: '#34d399',
    warning: '#fde047',
    onPrimary: '#ffffff',
  },
  lavender: {
    primary: '#a78bfa', // Purple
    secondary: '#c084fc', // Light purple
    background: '#3b0764',
    surface: '#581c87',
    text: '#faf5ff',
    textSecondary: '#e9d5ff',
    border: '#6b21a8',
    error: '#f87171',
    success: '#34d399',
    warning: '#fbbf24',
    onPrimary: '#ffffff',
  },
  rose: {
    primary: '#fb7185', // Rose
    secondary: '#f472b6', // Pink
    background: '#881337',
    surface: '#9f1239',
    text: '#fff1f2',
    textSecondary: '#fecdd3',
    border: '#be123c',
    error: '#fca5a5',
    success: '#34d399',
    warning: '#fbbf24',
    onPrimary: '#ffffff',
  },
} satisfies Record<string, ThemeColors>;

export type ThemeName = keyof typeof themes;
export type Colors = ThemeColors;

// Helper to get colors for a theme
export function getThemeColors(theme: ThemeName): Colors {
  return themes[theme];
}

// Get all available theme names
export function getAvailableThemes(): ThemeName[] {
  return Object.keys(themes) as ThemeName[];
}

// Get theme display name
export function getThemeDisplayName(theme: ThemeName): string {
  const displayNames: Record<ThemeName, string> = {
    light: 'Light',
    dark: 'Dark',
    midnight: 'Midnight',
    ocean: 'Ocean',
    forest: 'Forest',
    sunset: 'Sunset',
    lavender: 'Lavender',
    rose: 'Rose',
  };
  return displayNames[theme];
}
