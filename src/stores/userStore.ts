import { create } from 'zustand';
import type { UserPreferences } from '../types/user';
import { storage } from '../services/storage';

interface UserStore {
  preferences: UserPreferences | null;
  loading: boolean;

  // Actions
  loadPreferences: () => Promise<void>;
  updatePreferences: (updates: Partial<UserPreferences>) => Promise<void>;
  setTheme: (theme: 'light' | 'dark' | 'auto') => Promise<void>;
  setAIEnabled: (enabled: boolean) => Promise<void>;
  setApiKey: (key: string) => Promise<void>;
  setUserName: (name: string) => Promise<void>;
}

const defaultPreferences: UserPreferences = {
  name: '',
  theme: 'auto',
  onboardingCompleted: false,
  notificationsEnabled: false,
  ai: {
    provider: 'google',
    model: 'gemini-pro',
    enabled: true,
    requestCount: 0,
    autoSuggest: true,
    smartCategorization: true,
    voiceInput: false,
  },
  permissions: {
    notifications: 'undetermined',
    calendar: 'undetermined',
    photos: 'undetermined',
    contacts: 'undetermined',
  },
};

export const useUserStore = create<UserStore>((set, get) => ({
  preferences: null,
  loading: false,

  loadPreferences: async () => {
    set({ loading: true });
    const preferences = await storage.getUserPreferences();
    set({ preferences: preferences || defaultPreferences, loading: false });
  },

  updatePreferences: async (updates: Partial<UserPreferences>) => {
    const current = get().preferences || defaultPreferences;
    const updated = { ...current, ...updates };
    set({ preferences: updated });
    await storage.saveUserPreferences(updated);
  },

  setTheme: async (theme: 'light' | 'dark' | 'auto') => {
    await get().updatePreferences({ theme });
  },

  setAIEnabled: async (enabled: boolean) => {
    const current = get().preferences || defaultPreferences;
    await get().updatePreferences({
      ai: { ...current.ai, enabled },
    });
  },

  setApiKey: async (key: string) => {
    const current = get().preferences || defaultPreferences;
    await get().updatePreferences({
      ai: { ...current.ai, openRouterKey: key },
    });
  },

  setUserName: async (name: string) => {
    await get().updatePreferences({ name });
  },
}));
