import React, { useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { TodoItem } from '../../components/todo/TodoItem';
import { useUserStore } from '../../stores/userStore';
import { getThemeColors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

import { TodoModal } from '../../components/todo/TodoModal';
import { TodoActionSheet } from '../../components/todo/TodoActionSheet';
import type { Todo } from '../../types/todo';
import { Share, Alert } from 'react-native';
import { useTodoStore } from '../../stores/todoStore';

export function TodoListScreen() {
  const theme = useUserStore(state => state.preferences?.theme || 'dark');
  const themeColors = getThemeColors(theme);

  const { todos, loadTodos, addTodo, updateTodo, deleteTodo, duplicateTodo, toggleComplete } =
    useTodoStore();

  useEffect(() => {
    loadTodos();
  }, []);

  const [showAddModal, setShowAddModal] = React.useState(false);
  const [showActionSheet, setShowActionSheet] = React.useState(false);
  const [editingTodo, setEditingTodo] = React.useState<Todo | undefined>(undefined);
  const [selectedTodo, setSelectedTodo] = React.useState<Todo | undefined>(undefined);

  const handleAddTodo = () => {
    setEditingTodo(undefined);
    setShowAddModal(true);
  };

  const handleEditTodo = (todo: Todo) => {
    setEditingTodo(todo);
    setShowAddModal(true);
  };

  const handleLongPress = (todo: Todo) => {
    setSelectedTodo(todo);
    setShowActionSheet(true);
  };

  const handleSaveTodo = async (todoData: Partial<Todo>) => {
    if (editingTodo) {
      await updateTodo(editingTodo.id, todoData);
    } else {
      await addTodo(todoData);
    }
    setShowAddModal(false);
    setEditingTodo(undefined);
  };

  const handleTodoPress = (todoId: string) => {
    toggleComplete(todoId);
  };

  // Action Sheet Handlers
  const handleDeleteTodo = () => {
    if (!selectedTodo) return;
    Alert.alert('Delete Todo', 'Are you sure you want to delete this todo?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteTodo(selectedTodo.id);
          setShowActionSheet(false);
        },
      },
    ]);
  };

  const handleDuplicateTodo = async () => {
    if (!selectedTodo) return;
    await duplicateTodo(selectedTodo.id);
    setShowActionSheet(false);
  };

  const handleShareTodo = async () => {
    if (!selectedTodo) return;
    try {
      await Share.share({
        message: `${selectedTodo.title} \n${selectedTodo.description || ''} `,
      });
    } catch (error) {
      console.error(error);
    }
    setShowActionSheet(false);
  };

  const handleTogglePriority = async () => {
    if (!selectedTodo) return;
    const priorities: Todo['priority'][] = ['low', 'medium', 'high'];
    const currentIndex = priorities.indexOf(selectedTodo.priority);
    const nextPriority = priorities[(currentIndex + 1) % priorities.length];
    await updateTodo(selectedTodo.id, { priority: nextPriority });
    // Don't close sheet to allow seeing change? Or close it?
    // Better to close it as it's an action.
    setShowActionSheet(false);
  };

  const activeTodos = todos.filter(t => !t.completed);
  const completedTodos = todos.filter(t => t.completed);

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: themeColors.text }]}>My Todos</Text>
        <Text style={[styles.subtitle, { color: themeColors.textSecondary }]}>
          {activeTodos.length} active, {completedTodos.length} completed
        </Text>
      </View>

      {todos.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={[styles.emptyText, { color: themeColors.textSecondary }]}>
            No todos yet. Create your first one!
          </Text>
        </View>
      ) : (
        <FlatList
          data={todos}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <TodoItem
              todo={item}
              onPress={() => handleTodoPress(item.id)}
              onToggle={() => toggleComplete(item.id)}
              onLongPress={() => handleLongPress(item)}
            />
          )}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}

      <View style={styles.fab}>
        <TouchableOpacity
          style={[styles.fabButton, { backgroundColor: themeColors.primary }]}
          onPress={handleAddTodo}
          activeOpacity={0.8}
        >
          <Text style={styles.fabIcon}>+</Text>
        </TouchableOpacity>
      </View>

      <TodoModal
        visible={showAddModal}
        todo={editingTodo}
        onClose={() => setShowAddModal(false)}
        onSave={handleSaveTodo}
      />

      <TodoActionSheet
        visible={showActionSheet}
        todo={selectedTodo}
        onClose={() => setShowActionSheet(false)}
        onEdit={() => handleEditTodo(selectedTodo!)}
        onDelete={handleDeleteTodo}
        onDuplicate={handleDuplicateTodo}
        onShare={handleShareTodo}
        onTogglePriority={handleTogglePriority}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: spacing.lg,
    paddingTop: spacing.xl,
  },
  title: {
    ...typography.h1,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.bodySmall,
  },
  list: {
    padding: spacing.md,
    paddingBottom: 100,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  emptyText: {
    ...typography.body,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    bottom: spacing.lg,
    right: spacing.lg,
  },
  fabButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabIcon: {
    color: '#ffffff',
    fontSize: 32,
    fontWeight: '300',
  },
});
