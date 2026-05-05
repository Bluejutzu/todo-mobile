import type {
  CategorySuggestion,
  DueDateSuggestion,
  PrioritySuggestion,
  TodoImprovement,
} from '../../types/ai';
import type { Subtask, TodoPriority } from '../../types/todo';

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isPriority(value: unknown): value is TodoPriority {
  return value === 'low' || value === 'medium' || value === 'high';
}

export function isTodoImprovement(value: unknown): value is TodoImprovement {
  if (!isObject(value)) return false;
  return (
    (value.title === undefined || typeof value.title === 'string') &&
    (value.description === undefined || typeof value.description === 'string') &&
    (value.tags === undefined ||
      (Array.isArray(value.tags) && value.tags.every(tag => typeof tag === 'string')))
  );
}

export function isCategorySuggestion(value: unknown): value is CategorySuggestion {
  return isObject(value) && typeof value.category === 'string';
}

export function isPrioritySuggestion(value: unknown): value is PrioritySuggestion {
  return isObject(value) && isPriority(value.priority);
}

export function isDueDateSuggestion(value: unknown): value is DueDateSuggestion {
  return isObject(value) && value.dueDate instanceof Date && !Number.isNaN(value.dueDate.getTime());
}

export function isSubtaskList(value: unknown): value is Subtask[] {
  return (
    Array.isArray(value) &&
    value.every(
      item =>
        isObject(item) &&
        typeof item.id === 'string' &&
        typeof item.title === 'string' &&
        typeof item.completed === 'boolean'
    )
  );
}

export function isTagList(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(item => typeof item === 'string');
}
