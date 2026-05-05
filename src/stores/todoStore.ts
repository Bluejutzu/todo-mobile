import { create } from 'zustand';
import uuid from 'react-native-uuid';
import type { Todo, TodoPriority } from '../types/todo';
import { storage } from '../services/storage';
import type { SyncStatus } from '../services/storage/syncStatus';
import { todoRepository } from '../features/todos/data/todoRepository';
import type {
  BulkTodoAction,
  CreateTodoInput,
  UpdateTodoInput,
} from '../features/todos/domain/todoTypes';
import type { TokenGetter } from '../services/storage/convexTodoStorage';
import { logger } from '../lib/logger';

interface TodoStore {
  todos: Todo[];
  loading: boolean;
  syncStatus: SyncStatus;
  lastSyncTime: Date | null;
  pendingCount: number;

  setTokenGetter: (getToken: TokenGetter) => void;
  loadTodos: () => Promise<void>;
  createTodo: (todoData: CreateTodoInput) => Promise<void>;
  updateTodo: (id: string, updates: UpdateTodoInput) => Promise<void>;
  completeTodo: (id: string, completed: boolean) => Promise<void>;
  deleteTodo: (id: string) => Promise<void>;
  duplicateTodo: (id: string) => Promise<void>;
  bulkUpdate: (ids: string[], action: BulkTodoAction) => Promise<void>;

  addTodo: (todoData: Partial<Todo>) => Promise<void>;
  toggleComplete: (id: string) => Promise<void>;
  bulkComplete: (ids: string[], completed: boolean) => Promise<void>;
  bulkDelete: (ids: string[]) => Promise<void>;
  bulkUpdatePriority: (ids: string[], priority: string) => Promise<void>;
}

async function getDeleteMode(): Promise<'soft' | 'hard'> {
  const { useUserStore } = require('./userStore');
  return useUserStore.getState().preferences?.storage?.deleteMode || 'soft';
}

async function persistWithRollback(
  previousTodos: Todo[],
  nextTodos: Todo[],
  set: (state: Partial<TodoStore>) => void
) {
  set({ todos: nextTodos });
  try {
    await todoRepository.saveTodos(nextTodos);
  } catch (error) {
    logger.error('Todo persistence failed, rolling back:', error);
    set({ todos: previousTodos });
    throw error;
  }
}

function createTodoFromInput(todoData: CreateTodoInput): Todo {
  const now = new Date();
  return {
    id: uuid.v4() as string,
    title: todoData.title.trim(),
    description: todoData.description,
    completed: false,
    priority: todoData.priority || 'medium',
    dueDate: todoData.dueDate,
    category: todoData.category,
    tags: todoData.tags,
    color: todoData.color || '#6366f1',
    subtasks: todoData.subtasks || [],
    attachments: [],
    createdAt: now,
    updatedAt: now,
  };
}

export const useTodoStore = create<TodoStore>((set, get) => {
  storage.subscribe((status, lastSyncTime, pendingCount) => {
    set({ syncStatus: status, lastSyncTime, pendingCount });
  });

  return {
    todos: [],
    loading: false,
    syncStatus: 'offline',
    lastSyncTime: null,
    pendingCount: 0,

    setTokenGetter: (getToken: TokenGetter) => {
      todoRepository.setTokenGetter(getToken);
    },

    loadTodos: async () => {
      set({ loading: true });
      try {
        const todos = await todoRepository.loadTodos();
        set({ todos, loading: false });
      } catch (error) {
        logger.error('Failed to load todos:', error);
        set({ loading: false });
      }
    },

    createTodo: async (todoData: CreateTodoInput) => {
      const previousTodos = get().todos;
      const todos = [...previousTodos, createTodoFromInput(todoData)];
      await persistWithRollback(previousTodos, todos, set);
    },

    updateTodo: async (id: string, updates: UpdateTodoInput) => {
      const previousTodos = get().todos;
      const todos = previousTodos.map(todo =>
        todo.id === id ? { ...todo, ...updates, updatedAt: new Date() } : todo
      );
      await persistWithRollback(previousTodos, todos, set);
    },

    completeTodo: async (id: string, completed: boolean) => {
      const previousTodos = get().todos;
      const todos = previousTodos.map(todo =>
        todo.id === id
          ? {
              ...todo,
              completed,
              completedAt: completed ? new Date() : undefined,
              updatedAt: new Date(),
            }
          : todo
      );
      await persistWithRollback(previousTodos, todos, set);
    },

    deleteTodo: async (id: string) => {
      const previousTodos = get().todos;
      const deleteMode = await getDeleteMode();
      const todos =
        deleteMode === 'soft'
          ? previousTodos.map(todo =>
              todo.id === id ? { ...todo, deletedAt: new Date(), updatedAt: new Date() } : todo
            )
          : previousTodos.filter(todo => todo.id !== id);

      await persistWithRollback(previousTodos, todos, set);
    },

    duplicateTodo: async (id: string) => {
      const todo = get().todos.find(item => item.id === id);
      if (!todo) return;

      const previousTodos = get().todos;
      const duplicatedTodo: Todo = {
        ...todo,
        id: uuid.v4() as string,
        title: `${todo.title} (Copy)`,
        completed: false,
        completedAt: undefined,
        deletedAt: undefined,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await persistWithRollback(previousTodos, [duplicatedTodo, ...previousTodos], set);
    },

    bulkUpdate: async (ids: string[], action: BulkTodoAction) => {
      const previousTodos = get().todos;
      const idSet = new Set(ids);
      const now = new Date();

      const todos =
        action.type === 'delete' && action.deleteMode === 'hard'
          ? previousTodos.filter(todo => !idSet.has(todo.id))
          : previousTodos.map(todo => {
              if (!idSet.has(todo.id)) return todo;

              if (action.type === 'complete') {
                return {
                  ...todo,
                  completed: action.completed,
                  completedAt: action.completed ? now : undefined,
                  updatedAt: now,
                };
              }

              if (action.type === 'priority') {
                return { ...todo, priority: action.priority, updatedAt: now };
              }

              return { ...todo, deletedAt: now, updatedAt: now };
            });

      await persistWithRollback(previousTodos, todos, set);
    },

    addTodo: async (todoData: Partial<Todo>) => {
      await get().createTodo({
        title: todoData.title || '',
        description: todoData.description,
        priority: todoData.priority,
        dueDate: todoData.dueDate,
        category: todoData.category,
        color: todoData.color,
        tags: todoData.tags,
        subtasks: todoData.subtasks,
      });
    },

    toggleComplete: async (id: string) => {
      const todo = get().todos.find(item => item.id === id);
      if (!todo) return;
      await get().completeTodo(id, !todo.completed);
    },

    bulkComplete: async (ids: string[], completed: boolean) => {
      await get().bulkUpdate(ids, { type: 'complete', completed });
    },

    bulkDelete: async (ids: string[]) => {
      await get().bulkUpdate(ids, { type: 'delete', deleteMode: await getDeleteMode() });
    },

    bulkUpdatePriority: async (ids: string[], priority: string) => {
      await get().bulkUpdate(ids, { type: 'priority', priority: priority as TodoPriority });
    },
  };
});
