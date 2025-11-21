export const colors = {
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
  },
};

export type Theme = 'light' | 'dark' | 'auto';
export type Colors = typeof colors.light;

// Helper to get colors for a theme (auto defaults to dark)
export function getThemeColors(theme: Theme): Colors {
  if (theme === 'auto') {
    // TODO: Use Appearance.getColorScheme() to detect system theme
    return colors.dark;
  }
  return colors[theme];
}
