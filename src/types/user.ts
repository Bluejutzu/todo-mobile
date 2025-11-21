import type { AIConfig } from './ai';
import type { PermissionStatus } from './permissions';

export interface UserPreferences {
  name: string;
  theme: 'light' | 'dark' | 'auto';
  onboardingCompleted: boolean;

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
