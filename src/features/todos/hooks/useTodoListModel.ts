import { useMemo } from 'react';
import { useTodoStore } from '../../../stores/todoStore';
import { selectGroupedTodos, selectTodoStats } from '../domain/todoSelectors';

export function useTodoListModel(groupByCategory: boolean) {
  const todos = useTodoStore(state => state.todos);

  return useMemo(
    () => ({
      sections: selectGroupedTodos(todos, groupByCategory),
      stats: selectTodoStats(todos),
    }),
    [todos, groupByCategory]
  );
}
