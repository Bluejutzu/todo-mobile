import { useTodoStore } from '../../../stores/todoStore';

export function useTodoActions() {
  return useTodoStore(state => ({
    createTodo: state.createTodo,
    updateTodo: state.updateTodo,
    completeTodo: state.completeTodo,
    deleteTodo: state.deleteTodo,
    duplicateTodo: state.duplicateTodo,
    bulkUpdate: state.bulkUpdate,
  }));
}
