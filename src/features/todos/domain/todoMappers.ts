import type { Todo, TodoPriority } from '../../../types/todo';

type TodoLike = Partial<Todo> & Record<string, unknown>;

export interface TodoRow {
  id: string;
  title: string;
  description: string | null;
  completed: boolean;
  priority: TodoPriority;
  category: string | null;
  due_date: string | null;
  user_id: string;
  created_at: string;
  updated_at: string;
  external_calendar_event_id?: string | null;
}

function toDate(value: unknown, fallback = new Date()): Date {
  if (!value) return fallback;
  const date = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(date.getTime()) ? fallback : date;
}

function optionalDate(value: unknown): Date | undefined {
  if (!value) return undefined;
  const date = toDate(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function toPriority(value: unknown): TodoPriority {
  return value === 'low' || value === 'medium' || value === 'high' ? value : 'medium';
}

export function normalizeTodo(input: TodoLike): Todo {
  const now = new Date();

  return {
    id: String(input.id ?? ''),
    title: String(input.title ?? ''),
    description: input.description ? String(input.description) : undefined,
    completed: Boolean(input.completed),
    priority: toPriority(input.priority),
    dueDate: optionalDate(input.dueDate),
    category: input.category ? String(input.category) : undefined,
    tags: Array.isArray(input.tags) ? input.tags.map(String) : undefined,
    color: input.color ? String(input.color) : undefined,
    subtasks: Array.isArray(input.subtasks) ? input.subtasks : [],
    attachments: Array.isArray(input.attachments) ? input.attachments : [],
    createdAt: toDate(input.createdAt, now),
    updatedAt: toDate(input.updatedAt, now),
    completedAt: optionalDate(input.completedAt),
    deletedAt: optionalDate(input.deletedAt),
    externalCalendarEventId: input.externalCalendarEventId
      ? String(input.externalCalendarEventId)
      : undefined,
  };
}

export function mapTodoRowToTodo(row: Record<string, unknown>): Todo {
  return normalizeTodo({
    id: row.id,
    title: row.title,
    description: row.description,
    completed: row.completed,
    priority: row.priority,
    category: row.category,
    dueDate: row.due_date,
    createdAt: row.created_at,
    updatedAt: row.updated_at ?? row.updatedAt,
    color: row.color,
    subtasks: row.subtasks,
    tags: row.tags,
    externalCalendarEventId: row.external_calendar_event_id,
  } as TodoLike);
}

export function mapTodoToRow(todo: Todo, userId: string): TodoRow {
  return {
    id: todo.id,
    title: todo.title,
    description: todo.description || null,
    completed: todo.completed,
    priority: todo.priority || 'medium',
    category: todo.category || null,
    due_date: todo.dueDate ? new Date(todo.dueDate).toISOString() : null,
    user_id: userId,
    created_at: todo.createdAt ? new Date(todo.createdAt).toISOString() : new Date().toISOString(),
    updated_at: todo.updatedAt ? new Date(todo.updatedAt).toISOString() : new Date().toISOString(),
    external_calendar_event_id: todo.externalCalendarEventId || null,
  };
}

export function normalizeTodos(value: unknown): Todo[] {
  if (!Array.isArray(value)) return [];
  return value.map(item => normalizeTodo(item as TodoLike)).filter(todo => todo.id && todo.title);
}
