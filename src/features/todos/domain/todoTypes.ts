import type { Subtask, Todo, TodoPriority } from '../../../types/todo';
import type { SyncStatus } from '../../../services/storage/syncStatus';

export type StorageMethod = 'cloud' | 'local';

export interface CreateTodoInput {
  title: string;
  description?: string;
  priority?: TodoPriority;
  dueDate?: Date;
  category?: string;
  color?: string;
  tags?: string[];
  subtasks?: Subtask[];
}

export interface UpdateTodoInput extends Partial<CreateTodoInput> {
  completed?: boolean;
  externalCalendarEventId?: string;
}

export interface TodoSyncMeta {
  syncStatus: SyncStatus;
  lastSyncTime: Date | null;
  pendingCount: number;
}

export interface TodoRepository {
  loadTodos(): Promise<Todo[]>;
  saveTodos(todos: Todo[]): Promise<void>;
  exportTodos(): Promise<boolean>;
}

export type BulkTodoAction =
  | { type: 'complete'; completed: boolean }
  | { type: 'delete'; deleteMode: 'soft' | 'hard' }
  | { type: 'priority'; priority: TodoPriority };
