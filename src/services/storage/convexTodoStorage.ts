import { ConvexHttpClient } from 'convex/browser';
import { makeFunctionReference } from 'convex/server';
import type { Todo } from '../../types/todo';
import { normalizeTodo } from '../../features/todos/domain/todoMappers';
import { logger } from '../../lib/logger';

export type TokenGetter = (options?: {
  template?: string;
  skipCache?: boolean;
}) => Promise<string | null>;

interface ConvexTodoRecord {
  localId: string;
  title: string;
  description?: string;
  completed: boolean;
  priority: Todo['priority'];
  dueDate?: number;
  category?: string;
  tags?: string[];
  color?: string;
  subtasks?: Todo['subtasks'];
  attachments?: Todo['attachments'];
  createdAt: number;
  updatedAt: number;
  completedAt?: number;
  deletedAt?: number;
  externalCalendarEventId?: string;
}

const listTodos = makeFunctionReference<'query', Record<string, never>, ConvexTodoRecord[]>(
  'todos:list'
);
const replaceTodos = makeFunctionReference<'mutation', { todos: ConvexTodoRecord[] }, null>(
  'todos:replaceAll'
);
const deleteTodos = makeFunctionReference<'mutation', Record<string, never>, null>(
  'todos:deleteAllForCurrentUser'
);

let client: ConvexHttpClient | null = null;

function getClient() {
  const url = process.env.EXPO_PUBLIC_CONVEX_URL;
  if (!url) return null;

  if (!client) {
    client = new ConvexHttpClient(url, { logger: false });
  }
  return client;
}

async function setClientAuth(convexClient: ConvexHttpClient, getToken?: TokenGetter) {
  const token = await getToken?.({ template: 'convex' }).catch(async () => getToken?.());
  if (token) {
    convexClient.setAuth(token);
  } else {
    convexClient.clearAuth();
  }
}

function toConvexTodo(todo: Todo): ConvexTodoRecord {
  return {
    localId: todo.id,
    title: todo.title,
    description: todo.description,
    completed: todo.completed,
    priority: todo.priority,
    dueDate: todo.dueDate ? new Date(todo.dueDate).getTime() : undefined,
    category: todo.category,
    tags: todo.tags,
    color: todo.color,
    subtasks: todo.subtasks,
    attachments: todo.attachments,
    createdAt: new Date(todo.createdAt).getTime(),
    updatedAt: new Date(todo.updatedAt).getTime(),
    completedAt: todo.completedAt ? new Date(todo.completedAt).getTime() : undefined,
    deletedAt: todo.deletedAt ? new Date(todo.deletedAt).getTime() : undefined,
    externalCalendarEventId: todo.externalCalendarEventId,
  };
}

function fromConvexTodo(todo: ConvexTodoRecord): Todo {
  return normalizeTodo({
    id: todo.localId,
    title: todo.title,
    description: todo.description,
    completed: todo.completed,
    priority: todo.priority,
    dueDate: todo.dueDate ? new Date(todo.dueDate) : undefined,
    category: todo.category,
    tags: todo.tags,
    color: todo.color,
    subtasks: todo.subtasks,
    attachments: todo.attachments,
    createdAt: new Date(todo.createdAt),
    updatedAt: new Date(todo.updatedAt),
    completedAt: todo.completedAt ? new Date(todo.completedAt) : undefined,
    deletedAt: todo.deletedAt ? new Date(todo.deletedAt) : undefined,
    externalCalendarEventId: todo.externalCalendarEventId,
  });
}

export const convexTodoStorage = {
  async loadTodos(getToken?: TokenGetter): Promise<Todo[] | null> {
    const convexClient = getClient();
    if (!convexClient || !getToken) return null;

    try {
      await setClientAuth(convexClient, getToken);
      const todos = await convexClient.query(listTodos, {});
      logger.debug('Loaded todos from Convex');
      return todos.map(fromConvexTodo);
    } catch (error) {
      logger.warn('Convex todo load failed:', error);
      return null;
    }
  },

  async saveTodos(todos: Todo[], getToken?: TokenGetter): Promise<boolean> {
    const convexClient = getClient();
    if (!convexClient || !getToken) return false;

    try {
      await setClientAuth(convexClient, getToken);
      await convexClient.mutation(replaceTodos, { todos: todos.map(toConvexTodo) });
      logger.debug('Saved todos to Convex');
      return true;
    } catch (error) {
      logger.warn('Convex todo save failed:', error);
      return false;
    }
  },

  async deleteAll(getToken?: TokenGetter): Promise<boolean> {
    const convexClient = getClient();
    if (!convexClient || !getToken) return false;

    try {
      await setClientAuth(convexClient, getToken);
      await convexClient.mutation(deleteTodos, {});
      return true;
    } catch (error) {
      logger.warn('Convex todo delete failed:', error);
      return false;
    }
  },
};
