import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import { writeAsStringAsync, documentDirectory } from 'expo-file-system/legacy';
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

export type SyncStatus = 'synced' | 'syncing' | 'offline' | 'error';
export type SyncStatusListener = (
  status: SyncStatus,
  lastSyncTime: Date | null,
  pendingCount: number
) => void;

export const storage = {
  listeners: [] as SyncStatusListener[],
  currentStatus: 'offline' as SyncStatus,
  lastSyncTime: null as Date | null,
  pendingCount: 0,

  subscribe(listener: SyncStatusListener) {
    this.listeners.push(listener);
    listener(this.currentStatus, this.lastSyncTime, this.pendingCount);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  },

  notifyListeners(status: SyncStatus, time?: Date | null, pendingCount?: number) {
    this.currentStatus = status;
    if (status === 'synced') {
      this.lastSyncTime = time || new Date();
      this.pendingCount = 0;
    }
    if (pendingCount !== undefined) {
      this.pendingCount = pendingCount;
    }
    this.listeners.forEach(l => l(this.currentStatus, this.lastSyncTime, this.pendingCount));
  },

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
      // Always try Cloud Storage first if authenticated
      if (getToken) {
        this.notifyListeners('syncing');
        try {
          const client = await this.getSupabaseClient(getToken);
          if (client) {
            const { data, error } = await client
              .from('todos')
              .select('*')
              .order('created_at', { ascending: false });

            if (!error && data) {
              console.log('✓ Loaded from cloud storage');
              this.notifyListeners('synced');
              return data;
            }
          }
        } catch (cloudError) {
          console.log('Cloud load failed, using local:', cloudError);
          this.notifyListeners('error');
        }
      }

      // Fall back to local storage
      this.notifyListeners('offline');
      const customPath = await this.getStoragePath();

      if (customPath) {
        // Read from custom path (SAF on Android)
        if (Platform.OS === 'android' && customPath.startsWith('content://')) {
          try {
            const fileUri = customPath + '%2F' + TODOS_FILENAME; // SAF encoding
            const file = new FileSystem.File(fileUri);
            const content = await file.text();
            console.log('✓ Loaded from local storage (SAF)');
            return JSON.parse(content);
          } catch {
            // File might not exist yet
            return [];
          }
        } else {
          // Standard file system path
          const fileUri = customPath + '/' + TODOS_FILENAME;
          const file = new FileSystem.File(fileUri);
          const info = await file.info();
          if (info.exists) {
            const content = await file.text();
            console.log('✓ Loaded from local storage (file)');
            return JSON.parse(content);
          }
        }
        return [];
      }

      // Fallback to AsyncStorage if no custom path
      const data = await AsyncStorage.getItem(STORAGE_KEYS.TODOS);
      if (data) {
        console.log('✓ Loaded from local storage (AsyncStorage)');
        return JSON.parse(data);
      }
      return [];
    } catch (error) {
      console.error('Error loading todos:', error);
      this.notifyListeners('error');
      return [];
    }
  },

  async saveTodos(todos: Todo[], getToken?: () => Promise<string | null>): Promise<void> {
    try {
      // Always try Cloud Storage first if authenticated
      if (getToken) {
        this.notifyListeners('syncing');
        try {
          const client = await this.getSupabaseClient(getToken);
          if (client) {
            const token = await getToken();
            if (token) {
              // Decode JWT to get user_id (sub claim)
              const payload = JSON.parse(atob(token.split('.')[1]));
              const userId = payload.sub;

              // Save to cloud
              const { error } = await client.from('todos').upsert(
                todos.map(t => ({
                  id: t.id,
                  title: t.title,
                  completed: t.completed,
                  user_id: userId,
                  created_at: t.createdAt || new Date().toISOString(),
                  updated_at: t.updatedAt || new Date().toISOString(),
                }))
              );

              if (error) {
                console.error('Cloud Storage save error:', error);
                this.notifyListeners('error', null, todos.length); // Assume all pending on error
              } else {
                console.log('✓ Saved to cloud storage');
                this.notifyListeners('synced', new Date(), 0);
              }
            }
          }
        } catch (cloudError) {
          console.log('Cloud save failed, will save locally:', cloudError);
          this.notifyListeners('offline', null, todos.length);
        }
      } else {
        this.notifyListeners('offline', null, todos.length);
      }

      // Always save locally as backup/cache
      const customPath = await this.getStoragePath();
      const content = JSON.stringify(todos, null, 2);

      if (customPath) {
        if (Platform.OS === 'android' && customPath.startsWith('content://')) {
          // SAF on Android
          try {
            const fileUri = customPath + '%2F' + TODOS_FILENAME;
            const file = new FileSystem.File(fileUri);
            await file.write(content);
          } catch {
            // If write fails, maybe file doesn't exist. Create it.
            try {
              const SAF = (FileSystem as any).StorageAccessFramework;
              await SAF.createFileAsync(customPath, TODOS_FILENAME, 'application/json').then(
                async (uri: string) => {
                  const file = new FileSystem.File(uri);
                  await file.write(content);
                }
              );
            } catch (createError) {
              console.error('Error creating file in SAF:', createError);
            }
          }
        } else {
          // Standard file system
          const fileUri = customPath + '/' + TODOS_FILENAME;
          const file = new FileSystem.File(fileUri);
          await file.write(content);
        }
      } else {
        // Fallback to AsyncStorage
        await AsyncStorage.setItem(STORAGE_KEYS.TODOS, content);
      }
      console.log('✓ Saved to local storage (backup)');
    } catch (error) {
      console.error('Error saving todos:', error);
      this.notifyListeners('error');
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
