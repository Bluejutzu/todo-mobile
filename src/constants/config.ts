export const APP_NAME = 'AI Todo';
export const APP_VERSION = '1.0.0';

// OpenRouter API configuration
export const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
export const OPENROUTER_MODEL = 'anthropic/claude-3.5-sonnet';

// Storage keys
export const STORAGE_KEYS = {
  TODOS: '@todos',
  USER_PREFERENCES: '@user_preferences',
  ONBOARDING_COMPLETED: '@onboarding_completed',
} as const;
