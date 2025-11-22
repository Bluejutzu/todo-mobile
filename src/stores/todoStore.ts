import { create } from 'zustand';
import uuid from 'react-native-uuid';
import type { Todo } from '../types/todo';
import { storage, SyncStatus } from '../services/storage';

interface TodoStore {
  todos: Todo[];
  loading: boolean;
  getToken?: () => Promise<string | null>; // Clerk token getter
  syncStatus: SyncStatus;
  lastSyncTime: Date | null;
  pendingCount: number;

  // Actions
  setTokenGetter: (getToken: () => Promise<string | null>) => void;
  loadTodos: () => Promise<void>;
  addTodo: (todoData: Partial<Todo>) => Promise<void>;
  updateTodo: (id: string, updates: Partial<Todo>) => Promise<void>;
  deleteTodo: (id: string) => Promise<void>;
  toggleComplete: (id: string) => Promise<void>;
  duplicateTodo: (id: string) => Promise<void>;
}

export const useTodoStore = create<TodoStore>((set, get) => ({
  todos: [],
  loading: false,
  getToken: undefined,

  syncStatus: 'offline' as SyncStatus,
  lastSyncTime: null as Date | null,
  pendingCount: 0,

  setTokenGetter: (getToken: () => Promise<string | null>) => {
    set({ getToken });
    // Subscribe to storage sync status
    storage.subscribe((status, lastSyncTime, pendingCount) => {
      set({ syncStatus: status, lastSyncTime, pendingCount });
    });
  },

  loadTodos: async () => {
    set({ loading: true });
    const todos = await storage.getTodos(get().getToken);
    set({ todos, loading: false });
  },

  addTodo: async (todoData: Partial<Todo>) => {
    const newTodo: Todo = {
      id: uuid.v4() as string,
      title: todoData.title || '',
      description: todoData.description,
      completed: false,
      priority: todoData.priority || 'medium',
      dueDate: todoData.dueDate,
      category: todoData.category,
      tags: todoData.tags,
      color: todoData.color || '#6366f1',
      subtasks: todoData.subtasks || [],
      attachments: todoData.attachments || [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const todos = [...get().todos, newTodo];
    set({ todos });
    await storage.saveTodos(todos, get().getToken);
  },

  updateTodo: async (id: string, updates: Partial<Todo>) => {
    const todos = get().todos.map(todo =>
      todo.id === id ? { ...todo, ...updates, updatedAt: new Date() } : todo
    );
    set({ todos });
    await storage.saveTodos(todos, get().getToken);
  },

  deleteTodo: async (id: string) => {
    const todos = get().todos.filter(todo => todo.id !== id);
    set({ todos });
    await storage.saveTodos(todos, get().getToken);
  },

  toggleComplete: async (id: string) => {
    const todos = get().todos.map(todo =>
      todo.id === id
        ? {
            ...todo,
            completed: !todo.completed,
            completedAt: !todo.completed ? new Date() : undefined,
            updatedAt: new Date(),
          }
        : todo
    );
    set({ todos });
    await storage.saveTodos(todos, get().getToken);
  },

  duplicateTodo: async (id: string) => {
    const original = get().todos.find(t => t.id === id);
    if (!original) return;

    const duplicate: Todo = {
      ...original,
      id: uuid.v4() as string,
      title: `${original.title} (Copy)`,
      completed: false,
      completedAt: undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const todos = [...get().todos, duplicate];
    set({ todos });
    await storage.saveTodos(todos, get().getToken);
  },
}));
