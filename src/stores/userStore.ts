import { create } from 'zustand';
import type { UserPreferences } from '../types/user';
import { storage } from '../services/storage';
import type { ThemeName } from '../theme/colors';
import { defaultPreferences, normalizePreferences } from '../domain/preferences/defaultPreferences';

interface UserStore {
  preferences: UserPreferences | null;
  loading: boolean;
  loadPreferences: () => Promise<void>;
  updatePreferences: (updates: Partial<UserPreferences>) => Promise<void>;
  setTheme: (theme: ThemeName) => Promise<void>;
  setAIEnabled: (enabled: boolean) => Promise<void>;
  setApiKey: (key: string) => Promise<void>;
  setUserName: (name: string) => Promise<void>;
}

export const useUserStore = create<UserStore>((set, get) => ({
  preferences: null,
  loading: false,

  loadPreferences: async () => {
    set({ loading: true });
    const preferences = normalizePreferences(await storage.getUserPreferences());
    set({ preferences, loading: false });
  },

  updatePreferences: async (updates: Partial<UserPreferences>) => {
    const current = get().preferences || defaultPreferences;
    const updated = normalizePreferences({ ...current, ...updates });
    set({ preferences: updated });
    await storage.saveUserPreferences(updated);
  },

  setTheme: async (theme: ThemeName) => {
    const current = get().preferences || defaultPreferences;
    const updated = { ...current, theme };
    await storage.saveUserPreferences(updated);
    set({ preferences: updated });
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
