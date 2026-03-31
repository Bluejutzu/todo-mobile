export interface ThemeColors {
  primary: string;
  secondary: string;
  background: string;
  surface: string;
  surfaceElevated: string;
  text: string;
  textSecondary: string;
  border: string;
  input: string;
  error: string;
  success: string;
  warning: string;
  onPrimary: string;
  accent: string;
  [key: string]: string;
}

export const themes = {
  light: {
    primary: '#6366f1',
    secondary: '#EDE0C8',
    background: '#F5F0E6',
    surface: '#FAF6F0',
    surfaceElevated: '#FFFFFF',
    text: '#3E3630',
    textSecondary: '#7A7068',
    border: '#DBD3C8',
    input: '#F2ECE4',
    error: '#C93030',
    success: '#3A9A5C',
    warning: '#C4A235',
    onPrimary: '#FAFAFA',
    accent: '#EBE2D2',
  },
  dark: {
    primary: '#818cf8',
    secondary: '#a78bfa',
    background: '#121212',
    surface: '#1E1E1E',
    surfaceElevated: '#2A2A2A',
    text: '#F5F5F5',
    textSecondary: '#9CA3AF',
    border: '#2E2E2E',
    input: '#252525',
    error: '#F87171',
    success: '#34D399',
    warning: '#FBBF24',
    onPrimary: '#FFFFFF',
    accent: '#2D2D3D',
  },
  oled: {
    primary: '#818cf8',
    secondary: '#a78bfa',
    background: '#000000',
    surface: '#0A0A0A',
    surfaceElevated: '#141414',
    text: '#FFFFFF',
    textSecondary: '#8A8A8A',
    border: '#1A1A1A',
    input: '#111111',
    error: '#FF6B6B',
    success: '#51CF66',
    warning: '#FFD43B',
    onPrimary: '#000000',
    accent: '#1A1A2E',
  },
} satisfies Record<string, ThemeColors>;

export type ThemeName = keyof typeof themes;
export type Colors = ThemeColors;

export function getThemeColors(theme: ThemeName): Colors {
  return themes[theme];
}

export function getAvailableThemes(): ThemeName[] {
  return Object.keys(themes) as ThemeName[];
}

export function getThemeDisplayName(theme: ThemeName): string {
  const displayNames: Record<ThemeName, string> = {
    light: 'Light',
    dark: 'Dark',
    oled: 'OLED Dark',
  };
  return displayNames[theme];
}

export function isDarkTheme(theme: ThemeName): boolean {
  return theme === 'dark' || theme === 'oled';
}
