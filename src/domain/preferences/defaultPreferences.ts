import type { UserPreferences } from '../../types/user';
import type { ThemeName } from '../../theme/colors';

const VALID_THEMES: ThemeName[] = ['light', 'dark', 'oled'];

export const defaultPreferences: UserPreferences = {
  name: '',
  theme: 'dark',
  onboardingCompleted: false,
  notificationsEnabled: false,
  ai: {
    provider: 'openrouter',
    model: 'meta-llama/llama-3.3-70b-instruct:free',
    enabled: false,
    requestCount: 0,
    totalTokensUsed: 0,
    autoCategory: true,
    todoImprovement: true,
    prioritySuggestion: true,
    dueDateSuggestion: false,
    subtaskGeneration: true,
    tagSuggestion: true,
  },
  permissions: {
    notifications: 'undetermined',
    calendar: 'undetermined',
    photos: 'undetermined',
    contacts: 'undetermined',
  },
  storage: {
    deleteMode: 'soft',
  },
};

export function normalizePreferences(
  preferences?: Partial<UserPreferences> | null
): UserPreferences {
  const theme =
    preferences?.theme && VALID_THEMES.includes(preferences.theme) ? preferences.theme : 'dark';

  return {
    ...defaultPreferences,
    ...preferences,
    theme,
    ai: {
      ...defaultPreferences.ai,
      ...preferences?.ai,
    },
    permissions: {
      ...defaultPreferences.permissions,
      ...preferences?.permissions,
    },
    storage: {
      ...defaultPreferences.storage,
      ...preferences?.storage,
    },
  };
}
