import type { Todo } from '../../types/todo';

export function buildTodoContext(todos: Todo[]): string {
  const categories = [...new Set(todos.map(todo => todo.category).filter(Boolean))];
  const recentTodos = todos.slice(0, 10);

  return `
Context about user's todos:
- Existing categories: ${categories.join(', ') || 'None'}
- Recent todos: ${recentTodos.map(todo => `"${todo.title}" (${todo.category || 'uncategorized'})`).join(', ')}
- Total todos: ${todos.length}
  `.trim();
}
