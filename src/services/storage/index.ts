import type { Todo } from '../../types/todo';
import type { StorageMethod } from '../../features/todos/domain/todoTypes';
import { convexTodoStorage, type TokenGetter } from './convexTodoStorage';
import { exportStorage } from './exportStorage';
import { localTodoStorage } from './localTodoStorage';
import { preferencesStorage } from './preferencesStorage';
import { syncStatusStore, type SyncStatus, type SyncStatusListener } from './syncStatus';
import { logger } from '../../lib/logger';

function updateStorageUsage(todos: Todo[]) {
  try {
    const { useSubscriptionStore } = require('../../stores/subscriptionStore');
    const jsonContent = JSON.stringify(todos, null, 2);
    const sizeBytes = new Blob([jsonContent]).size;
    const subscriptionStore = useSubscriptionStore.getState();

    if (!subscriptionStore.checkLimit('maxStorageBytes', sizeBytes)) {
      logger.warn('Storage limit reached');
    }

    subscriptionStore.updateUsage({ storageUsedBytes: sizeBytes });
  } catch (error) {
    logger.warn('Unable to update storage usage:', error);
  }
}

export { SyncStatus, SyncStatusListener };

export const storage = {
  subscribe: syncStatusStore.subscribe.bind(syncStatusStore),
  notifyListeners: syncStatusStore.notify.bind(syncStatusStore),

  deleteRemoteTodos: convexTodoStorage.deleteAll.bind(convexTodoStorage),

  getStorageMethod: localTodoStorage.getStorageMethod.bind(localTodoStorage),
  setStorageMethod: localTodoStorage.setStorageMethod.bind(localTodoStorage),
  switchStorageMethod: localTodoStorage.switchStorageMethod.bind(localTodoStorage),
  getStoragePath: localTodoStorage.getStoragePath.bind(localTodoStorage),
  setStoragePath: localTodoStorage.setStoragePath.bind(localTodoStorage),
  canMigrateData: localTodoStorage.canMigrateData.bind(localTodoStorage),
  migrateData: localTodoStorage.migrateData.bind(localTodoStorage),

  getUserPreferences: preferencesStorage.getUserPreferences.bind(preferencesStorage),
  saveUserPreferences: preferencesStorage.saveUserPreferences.bind(preferencesStorage),
  isOnboardingCompleted: preferencesStorage.isOnboardingCompleted.bind(preferencesStorage),
  setOnboardingCompleted: preferencesStorage.setOnboardingCompleted.bind(preferencesStorage),
  getLastExportDate: preferencesStorage.getLastExportDate.bind(preferencesStorage),
  setLastExportDate: preferencesStorage.setLastExportDate.bind(preferencesStorage),
  shouldShowExportReminder: preferencesStorage.shouldShowExportReminder.bind(preferencesStorage),
  clearAll: preferencesStorage.clearAll.bind(preferencesStorage),

  async getTodos(getToken?: TokenGetter): Promise<Todo[]> {
    const method: StorageMethod = await localTodoStorage.getStorageMethod();

    if (method === 'cloud' && getToken) {
      syncStatusStore.notify('syncing');
      const cloudTodos = await convexTodoStorage.loadTodos(getToken);
      if (cloudTodos) {
        syncStatusStore.notify('synced');
        await localTodoStorage.saveTodos(cloudTodos);
        return cloudTodos;
      }
      syncStatusStore.notify('error');
    }

    const todos = await localTodoStorage.loadTodos();
    syncStatusStore.notify(method === 'local' ? 'offline' : 'error');
    return todos;
  },

  async saveTodos(todos: Todo[], getToken?: TokenGetter): Promise<void> {
    updateStorageUsage(todos);
    const method: StorageMethod = await localTodoStorage.getStorageMethod();

    if (method === 'cloud' && getToken) {
      syncStatusStore.notify('syncing');
      const cloudSaved = await convexTodoStorage.saveTodos(todos, getToken);
      syncStatusStore.notify(
        cloudSaved ? 'synced' : 'error',
        new Date(),
        cloudSaved ? 0 : todos.length
      );
    } else {
      syncStatusStore.notify('offline', null, todos.length);
    }

    await localTodoStorage.saveTodos(todos);
  },

  async exportData(directoryUri?: string): Promise<boolean> {
    const todos = await this.getTodos();
    const success = await exportStorage.exportData(todos, directoryUri);
    if (success) await preferencesStorage.setLastExportDate(new Date());
    return success;
  },
};
