import type { Todo, TodoSortBy } from '../../../types/todo';

export interface TodoSection {
  title: string;
  data: Todo[];
}

export function selectVisibleTodos(todos: Todo[]): Todo[] {
  return todos.filter(todo => !todo.deletedAt);
}

export function selectTodoStats(todos: Todo[]) {
  const visible = selectVisibleTodos(todos);
  return {
    active: visible.filter(todo => !todo.completed).length,
    completed: visible.filter(todo => todo.completed).length,
    total: visible.length,
  };
}

export function sortTodos(todos: Todo[], sortBy: TodoSortBy = 'createdAt'): Todo[] {
  return [...todos].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;

    if (sortBy === 'title') return a.title.localeCompare(b.title);
    if (sortBy === 'priority') {
      const weights = { high: 0, medium: 1, low: 2 };
      return weights[a.priority] - weights[b.priority];
    }

    const aValue = a[sortBy];
    const bValue = b[sortBy];
    return new Date(bValue || 0).getTime() - new Date(aValue || 0).getTime();
  });
}

export function selectGroupedTodos(todos: Todo[], groupByCategory: boolean): TodoSection[] {
  const visible = selectVisibleTodos(todos);
  if (!groupByCategory) return [{ title: 'All Todos', data: sortTodos(visible) }];

  const groups: Record<string, Todo[]> = {};
  const uncategorized: Todo[] = [];

  visible.forEach(todo => {
    if (todo.category) {
      (groups[todo.category] ??= []).push(todo);
    } else {
      uncategorized.push(todo);
    }
  });

  const sections = Object.keys(groups)
    .sort()
    .map(category => ({ title: category, data: sortTodos(groups[category]) }));

  if (uncategorized.length > 0) {
    sections.push({ title: 'Uncategorized', data: sortTodos(uncategorized) });
  }

  return sections;
}
