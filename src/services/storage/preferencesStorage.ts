import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../../constants/config';
import type { UserPreferences } from '../../types/user';
import { normalizePreferences } from '../../domain/preferences/defaultPreferences';
import { logger } from '../../lib/logger';

const LAST_EXPORT_DATE_KEY = '@last_export_date';

export const preferencesStorage = {
  async getUserPreferences(): Promise<UserPreferences | null> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.USER_PREFERENCES);
      return data ? normalizePreferences(JSON.parse(data)) : null;
    } catch (error) {
      logger.error('Error loading user preferences:', error);
      return null;
    }
  },

  async saveUserPreferences(preferences: UserPreferences): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.USER_PREFERENCES, JSON.stringify(preferences));
  },

  async isOnboardingCompleted(): Promise<boolean> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.ONBOARDING_COMPLETED);
      return data === 'true';
    } catch (error) {
      logger.error('Error checking onboarding status:', error);
      return false;
    }
  },

  async setOnboardingCompleted(completed: boolean): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.ONBOARDING_COMPLETED, completed.toString());
  },

  async getLastExportDate(): Promise<Date | null> {
    try {
      const dateStr = await AsyncStorage.getItem(LAST_EXPORT_DATE_KEY);
      return dateStr ? new Date(dateStr) : null;
    } catch {
      return null;
    }
  },

  async setLastExportDate(date: Date): Promise<void> {
    await AsyncStorage.setItem(LAST_EXPORT_DATE_KEY, date.toISOString());
  },

  async shouldShowExportReminder(): Promise<boolean> {
    const lastExport = await this.getLastExportDate();
    if (!lastExport) return true;
    const daysSinceExport = (Date.now() - lastExport.getTime()) / (1000 * 60 * 60 * 24);
    return daysSinceExport >= 30;
  },

  async clearAll(): Promise<void> {
    await AsyncStorage.clear();
  },
};
