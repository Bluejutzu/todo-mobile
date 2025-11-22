/* eslint-disable @typescript-eslint/no-explicit-any */
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import { readAsStringAsync, writeAsStringAsync, documentDirectory } from 'expo-file-system/legacy';
import { Platform } from 'react-native';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { STORAGE_KEYS } from '../constants/config';
import type { Todo } from '../types/todo';
import * as Sharing from 'expo-sharing';
import type { UserPreferences } from '../types/user';

const TODOS_FILENAME = 'todos.json';
const STORAGE_METHOD_KEY = '@storage_method';
const MAX_MIGRATION_SIZE = 10 * 1024 * 1024; // 10MB in bytes

let supabase: SupabaseClient | null = null;

export const storage = {
  // Initialize Supabase client with Clerk token
  async getSupabaseClient(getToken?: () => Promise<string | null>): Promise<SupabaseClient | null> {
    const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
    const key = process.env.EXPO_PUBLIC_SUPABASE_KEY;

    if (!url || !key) return null;

    // If we have a token getter (from Clerk), create a new client with it
    if (getToken) {
      return createClient(url, key, {
        global: {
          fetch: async (input: RequestInfo | URL, init?: RequestInit) => {
            const token = await getToken();
            const headers = new Headers(init?.headers);
            if (token) {
              headers.set('Authorization', `Bearer ${token}`);
            }
            return fetch(input, { ...init, headers });
          },
        } as any, // Type assertion needed for custom fetch
        auth: {
          persistSession: false,
        },
      });
    }

    // Otherwise, use the cached client or create a new one
    if (supabase) return supabase;
    supabase = createClient(url, key);
    return supabase;
  },

  // Storage Method
  async getStorageMethod(): Promise<'cloud' | 'local'> {
    try {
      const method = await AsyncStorage.getItem(STORAGE_METHOD_KEY);
      return (method as 'cloud' | 'local') || 'cloud'; // Default to cloud
    } catch {
      return 'cloud';
    }
  },

  async setStorageMethod(method: 'cloud' | 'local'): Promise<void> {
    await AsyncStorage.setItem(STORAGE_METHOD_KEY, method);
  },

  async getDataSize(): Promise<number> {
    try {
      const todos = await this.getTodos();
      const dataStr = JSON.stringify(todos);
      return new Blob([dataStr]).size;
    } catch {
      return 0;
    }
  },

  async canMigrateData(): Promise<{ canMigrate: boolean; size: number; sizeFormatted: string }> {
    const size = await this.getDataSize();
    const sizeInMB = size / (1024 * 1024);
    const sizeFormatted =
      sizeInMB < 1 ? `${(size / 1024).toFixed(2)} KB` : `${sizeInMB.toFixed(2)} MB`;

    return {
      canMigrate: size <= MAX_MIGRATION_SIZE,
      size,
      sizeFormatted,
    };
  },

  // Helper to get the current storage path
  async getStoragePath(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(STORAGE_KEYS.STORAGE_PATH);
    } catch {
      return null;
    }
  },

  async setStoragePath(path: string): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.STORAGE_PATH, path);
    } catch (error) {
      console.error('Error saving storage path:', error);
    }
  },

  // Todos
  async getTodos(getToken?: () => Promise<string | null>): Promise<Todo[]> {
    try {
      const storageMethod = await this.getStorageMethod();

      // Try Cloud Storage first if that's the selected method
      if (storageMethod === 'cloud') {
        const client = await this.getSupabaseClient(getToken);
        if (client) {
          const { data, error } = await client
            .from('todos')
            .select('*')
            .order('created_at', { ascending: false });

          if (error) throw error;
          return data || [];
        }
      }

      // Fallback to local storage
      const customPath = await this.getStoragePath();

      if (customPath) {
        // Read from custom path (SAF on Android)
        if (Platform.OS === 'android' && customPath.startsWith('content://')) {
          try {
            const fileUri = customPath + '%2F' + TODOS_FILENAME; // SAF encoding
            const content = await readAsStringAsync(fileUri);
            return JSON.parse(content);
          } catch {
            // File might not exist yet
            return [];
          }
        } else {
          // Standard file system path
          const fileUri = customPath + '/' + TODOS_FILENAME;
          const info = await FileSystem.getInfoAsync(fileUri);
          if (info.exists) {
            const content = await readAsStringAsync(fileUri);
            return JSON.parse(content);
          }
        }
        return [];
      }

      // Fallback to AsyncStorage if no custom path
      const data = await AsyncStorage.getItem(STORAGE_KEYS.TODOS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error loading todos:', error);
      return [];
    }
  },

  async saveTodos(todos: Todo[], getToken?: () => Promise<string | null>): Promise<void> {
    try {
      const storageMethod = await this.getStorageMethod();

      // Try Cloud Storage first if that's the selected method
      if (storageMethod === 'cloud') {
        const client = await this.getSupabaseClient(getToken);
        if (client) {
          // For Cloud Storage, we upsert all todos
          // The user_id will be automatically set by the database default
          const { error } = await client.from('todos').upsert(
            todos.map(t => ({
              id: t.id,
              title: t.title,
              completed: t.completed,
              // user_id is set automatically by Cloud Storage using auth.jwt()->>'sub'
            }))
          );

          if (error) console.error('Cloud Storage save error:', error);
          return; // Don't save locally if using Cloud Storage
        }
      }

      // Fallback to local storage
      const customPath = await this.getStoragePath();
      const content = JSON.stringify(todos, null, 2);

      if (customPath) {
        if (Platform.OS === 'android' && customPath.startsWith('content://')) {
          // SAF on Android
          try {
            const fileUri = customPath + '%2F' + TODOS_FILENAME;
            // Check if file exists, if not create it
            // SAF doesn't support simple "write to URI" if it doesn't exist in some cases,
            // but typically we write to the document URI.
            // However, SAF requires creating the file first if it doesn't exist using createFileAsync
            // But readAsStringAsync works with the direct URI if we know it.
            // Let's try writing. If it fails, we might need to create it.
            await writeAsStringAsync(fileUri, content);
          } catch {
            // If write fails, maybe file doesn't exist. Create it.
            try {
              const SAF = (FileSystem as any).StorageAccessFramework;
              await SAF.createFileAsync(customPath, TODOS_FILENAME, 'application/json').then(
                async (uri: string) => {
                  await writeAsStringAsync(uri, content);
                }
              );
            } catch (createError) {
              console.error('Error creating file in SAF:', createError);
            }
          }
        } else {
          // Standard file system
          const fileUri = customPath + '/' + TODOS_FILENAME;
          await writeAsStringAsync(fileUri, content);
        }
      } else {
        // Fallback to AsyncStorage
        await AsyncStorage.setItem(STORAGE_KEYS.TODOS, content);
      }
    } catch (error) {
      console.error('Error saving todos:', error);
    }
  },

  // Migration
  async migrateData(newPath: string): Promise<boolean> {
    try {
      // 1. Load current data
      const currentTodos = await this.getTodos();

      // 2. Save to new path
      // Temporarily set path to new path to use saveTodos logic, or implement direct write
      // Let's do direct write to ensure we don't corrupt state if it fails
      const content = JSON.stringify(currentTodos, null, 2);

      if (Platform.OS === 'android' && newPath.startsWith('content://')) {
        try {
          const SAF = (FileSystem as any).StorageAccessFramework;
          await SAF.createFileAsync(newPath, TODOS_FILENAME, 'application/json').then(
            async (uri: string) => {
              await writeAsStringAsync(uri, content);
            }
          );
        } catch {
          // File might already exist?
          const fileUri = newPath + '%2F' + TODOS_FILENAME;
          await writeAsStringAsync(fileUri, content);
        }
      } else {
        const fileUri = newPath + '/' + TODOS_FILENAME;
        await writeAsStringAsync(fileUri, content);
      }

      // 3. Update path preference
      await this.setStoragePath(newPath);
      return true;
    } catch (error) {
      console.error('Migration failed:', error);
      return false;
    }
  },

  // User Preferences (Keep in AsyncStorage for now as these are app settings)
  async getUserPreferences(): Promise<UserPreferences | null> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.USER_PREFERENCES);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error loading user preferences:', error);
      return null;
    }
  },

  async saveUserPreferences(preferences: UserPreferences): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.USER_PREFERENCES, JSON.stringify(preferences));
    } catch (error) {
      console.error('Error saving user preferences:', error);
    }
  },

  // Onboarding
  async isOnboardingCompleted(): Promise<boolean> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.ONBOARDING_COMPLETED);
      return data === 'true';
    } catch (error) {
      console.error('Error checking onboarding status:', error);
      return false;
    }
  },

  async setOnboardingCompleted(completed: boolean): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.ONBOARDING_COMPLETED, completed.toString());
    } catch (error) {
      console.error('Error setting onboarding status:', error);
    }
  },

  async clearAll(): Promise<void> {
    try {
      await AsyncStorage.clear();
    } catch (error) {
      console.error('Error clearing storage:', error);
    }
  },

  // Data Export
  async getLastExportDate(): Promise<Date | null> {
    try {
      const dateStr = await AsyncStorage.getItem('@last_export_date');
      return dateStr ? new Date(dateStr) : null;
    } catch {
      return null;
    }
  },

  async setLastExportDate(date: Date): Promise<void> {
    await AsyncStorage.setItem('@last_export_date', date.toISOString());
  },

  async shouldShowExportReminder(): Promise<boolean> {
    const lastExport = await this.getLastExportDate();
    if (!lastExport) return true; // Never exported

    const daysSinceExport = (Date.now() - lastExport.getTime()) / (1000 * 60 * 60 * 24);
    return daysSinceExport >= 30;
  },

  async exportData(directoryUri?: string): Promise<boolean> {
    try {
      const todos = await this.getTodos();
      const exportData = {
        todos,
        exportedAt: new Date().toISOString(),
        version: '1.0',
      };

      const content = JSON.stringify(exportData, null, 2);
      const filename = `todos-export-${new Date().toISOString().split('T')[0]}.json`;

      if (directoryUri && Platform.OS === 'android') {
        // Export to user-selected directory on Android
        const SAF = (FileSystem as any).StorageAccessFramework;
        const fileUri = await SAF.createFileAsync(directoryUri, filename, 'application/json');
        await writeAsStringAsync(fileUri, content);
      } else {
        // Export to app directory and share
        const fileUri = (documentDirectory || '') + filename;
        await writeAsStringAsync(fileUri, content);

        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(fileUri, {
            mimeType: 'application/json',
            dialogTitle: 'Export Todos Data',
          });
        }
      }

      await this.setLastExportDate(new Date());
      return true;
    } catch (error) {
      console.error('Export error:', error);
      return false;
    }
  },
};
