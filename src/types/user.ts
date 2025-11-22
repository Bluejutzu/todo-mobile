import type { AIConfig } from './ai';
import type { PermissionStatus } from './permissions';
import type { ThemeName } from '../theme/colors';

export interface UserPreferences {
  name: string;
  theme: ThemeName;
  onboardingCompleted: boolean;
  notificationsEnabled: boolean;

  // AI Configuration
  ai: AIConfig;

  // Permissions
  permissions: PermissionStatus;
}

export interface User {
  id: string;
  email?: string;
  name: string;
  preferences: UserPreferences;
}
