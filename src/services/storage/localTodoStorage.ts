import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import { writeAsStringAsync } from 'expo-file-system/legacy';
import { Platform } from 'react-native';
import { STORAGE_KEYS } from '../../constants/config';
import type { Todo } from '../../types/todo';
import type { StorageMethod } from '../../features/todos/domain/todoTypes';
import { normalizeTodos } from '../../features/todos/domain/todoMappers';
import { logger } from '../../lib/logger';

const TODOS_FILENAME = 'todos.json';
const STORAGE_METHOD_KEY = '@storage_method';
const MAX_MIGRATION_SIZE = 10 * 1024 * 1024;

async function readCustomPath(customPath: string): Promise<Todo[]> {
  if (Platform.OS === 'android' && customPath.startsWith('content://')) {
    try {
      const file = new FileSystem.File(`${customPath}%2F${TODOS_FILENAME}`);
      return normalizeTodos(JSON.parse(await file.text()));
    } catch {
      return [];
    }
  }

  const file = new FileSystem.File(`${customPath}/${TODOS_FILENAME}`);
  const info = await file.info();
  if (!info.exists) return [];
  return normalizeTodos(JSON.parse(await file.text()));
}

async function writeCustomPath(customPath: string, content: string): Promise<void> {
  if (Platform.OS === 'android' && customPath.startsWith('content://')) {
    try {
      const file = new FileSystem.File(`${customPath}%2F${TODOS_FILENAME}`);
      await file.write(content);
      return;
    } catch {
      const SAF = (FileSystem as any).StorageAccessFramework;
      const uri = await SAF.createFileAsync(customPath, TODOS_FILENAME, 'application/json');
      const file = new FileSystem.File(uri);
      await file.write(content);
      return;
    }
  }

  const file = new FileSystem.File(`${customPath}/${TODOS_FILENAME}`);
  await file.write(content);
}

export const localTodoStorage = {
  async getStorageMethod(): Promise<StorageMethod> {
    try {
      const method = await AsyncStorage.getItem(STORAGE_METHOD_KEY);
      return method === 'local' || method === 'cloud' ? method : 'cloud';
    } catch {
      return 'cloud';
    }
  },

  async setStorageMethod(method: StorageMethod): Promise<void> {
    await AsyncStorage.setItem(STORAGE_METHOD_KEY, method);
  },

  async switchStorageMethod(method: StorageMethod): Promise<boolean> {
    try {
      await this.setStorageMethod(method);
      return true;
    } catch (error) {
      logger.error('Error switching storage method:', error);
      return false;
    }
  },

  async getStoragePath(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(STORAGE_KEYS.STORAGE_PATH);
    } catch {
      return null;
    }
  },

  async setStoragePath(path: string): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.STORAGE_PATH, path);
  },

  async loadTodos(): Promise<Todo[]> {
    const customPath = await this.getStoragePath();
    if (customPath) {
      const todos = await readCustomPath(customPath);
      logger.debug('Loaded todos from custom local storage');
      return todos;
    }

    const data = await AsyncStorage.getItem(STORAGE_KEYS.TODOS);
    if (!data) return [];
    logger.debug('Loaded todos from AsyncStorage');
    return normalizeTodos(JSON.parse(data));
  },

  async saveTodos(todos: Todo[]): Promise<void> {
    const content = JSON.stringify(todos, null, 2);
    const customPath = await this.getStoragePath();

    if (customPath) {
      await writeCustomPath(customPath, content);
    } else {
      await AsyncStorage.setItem(STORAGE_KEYS.TODOS, content);
    }

    logger.debug('Saved todos to local storage');
  },

  async getDataSize(): Promise<number> {
    const todos = await this.loadTodos();
    return new Blob([JSON.stringify(todos)]).size;
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

  async migrateData(newPath: string): Promise<boolean> {
    try {
      const currentTodos = await this.loadTodos();
      const content = JSON.stringify(currentTodos, null, 2);

      if (Platform.OS === 'android' && newPath.startsWith('content://')) {
        try {
          const SAF = (FileSystem as any).StorageAccessFramework;
          const uri = await SAF.createFileAsync(newPath, TODOS_FILENAME, 'application/json');
          await writeAsStringAsync(uri, content);
        } catch {
          await writeAsStringAsync(`${newPath}%2F${TODOS_FILENAME}`, content);
        }
      } else {
        await writeAsStringAsync(`${newPath}/${TODOS_FILENAME}`, content);
      }

      await this.setStoragePath(newPath);
      return true;
    } catch (error) {
      logger.error('Migration failed:', error);
      return false;
    }
  },
};
