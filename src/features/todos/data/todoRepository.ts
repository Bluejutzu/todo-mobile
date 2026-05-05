import type { Todo } from '../../../types/todo';
import { storage } from '../../../services/storage';
import type { TokenGetter } from '../../../services/storage/convexTodoStorage';

let tokenGetter: TokenGetter | undefined;

export const todoRepository = {
  setTokenGetter(getToken: TokenGetter) {
    tokenGetter = getToken;
  },

  loadTodos(): Promise<Todo[]> {
    return storage.getTodos(tokenGetter);
  },

  saveTodos(todos: Todo[]): Promise<void> {
    return storage.saveTodos(todos, tokenGetter);
  },

  exportTodos(): Promise<boolean> {
    return storage.exportData();
  },
};
