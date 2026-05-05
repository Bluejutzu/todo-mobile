import React, { useEffect, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUserStore } from '../../stores/userStore';
import { getThemeColors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { TodoModal } from '../../components/todo/TodoModal';
import { TodoDetailModal } from '../../components/todo/TodoDetailModal';
import type { Todo } from '../../types/todo';
import { useTodoStore } from '../../stores/todoStore';
import { EmptyState } from '../../ui/EmptyState';
import { TodoListHeader } from '../../features/todos/components/TodoListHeader';
import { TodoSectionList } from '../../features/todos/components/TodoSectionList';
import { BulkActionBar } from '../../features/todos/components/BulkActionBar';
import { useTodoListModel } from '../../features/todos/hooks/useTodoListModel';

export function TodoListScreen() {
  const theme = useUserStore(state => state.preferences?.theme || 'dark');
  const colors = getThemeColors(theme);
  const insets = useSafeAreaInsets();

  const {
    loadTodos,
    addTodo,
    updateTodo,
    deleteTodo,
    duplicateTodo,
    toggleComplete,
    bulkComplete,
    bulkDelete,
    bulkUpdatePriority,
  } = useTodoStore();

  const syncStatus = useTodoStore(state => state.syncStatus);
  const lastSyncTime = useTodoStore(state => state.lastSyncTime);
  const pendingCount = useTodoStore(state => state.pendingCount);

  useEffect(() => {
    loadTodos();
  }, [loadTodos]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [editingTodo, setEditingTodo] = useState<Todo | undefined>();
  const [selectedTodo, setSelectedTodo] = useState<Todo | undefined>();
  const [groupByCategory, setGroupByCategory] = useState(true);
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedTodos, setSelectedTodos] = useState<Set<string>>(new Set());
  const { sections: processedSections, stats } = useTodoListModel(groupByCategory);

  const handleAddTodo = () => {
    setEditingTodo(undefined);
    setShowAddModal(true);
  };
  const handleEditTodo = (todo: Todo) => {
    setEditingTodo(todo);
    setShowAddModal(true);
  };
  const handleOpenTodo = (todo: Todo) => {
    setSelectedTodo(todo);
    setShowDetailModal(true);
  };

  const handleSaveTodo = async (todoData: Partial<Todo>) => {
    if (editingTodo) await updateTodo(editingTodo.id, todoData);
    else await addTodo(todoData);
    setShowAddModal(false);
    setEditingTodo(undefined);
  };

  const handleDeleteTodo = () => {
    if (!selectedTodo) return;
    Alert.alert('Delete Todo', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteTodo(selectedTodo.id);
          setShowDetailModal(false);
        },
      },
    ]);
  };

  const handleDuplicateTodo = async () => {
    if (!selectedTodo) return;
    await duplicateTodo(selectedTodo.id);
    setShowDetailModal(false);
  };

  const handleTogglePriority = async () => {
    if (!selectedTodo) return;
    const p: Todo['priority'][] = ['low', 'medium', 'high'];
    const next = p[(p.indexOf(selectedTodo.priority) + 1) % p.length];
    await updateTodo(selectedTodo.id, { priority: next });
    setShowDetailModal(false);
  };

  const toggleSelectionMode = () => {
    setSelectionMode(!selectionMode);
    setSelectedTodos(new Set());
  };

  const toggleTodoSelection = (id: string) => {
    if (!selectionMode) setSelectionMode(true);
    const next = new Set(selectedTodos);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedTodos(next);
  };

  const exitSelection = () => {
    setSelectionMode(false);
    setSelectedTodos(new Set());
  };

  const handleBulkComplete = async () => {
    await bulkComplete(Array.from(selectedTodos), true);
    exitSelection();
  };
  const handleBulkIncomplete = async () => {
    await bulkComplete(Array.from(selectedTodos), false);
    exitSelection();
  };
  const handleBulkDelete = () => {
    Alert.alert('Delete', `Delete ${selectedTodos.size} todo(s)?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await bulkDelete(Array.from(selectedTodos));
          exitSelection();
        },
      },
    ]);
  };
  const handleBulkPriority = (priority: string) => {
    Alert.alert('Priority', `Set ${selectedTodos.size} todo(s) to ${priority}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Confirm',
        onPress: async () => {
          await bulkUpdatePriority(Array.from(selectedTodos), priority);
          exitSelection();
        },
      },
    ]);
  };

  const toggleCategory = (category: string) => {
    setCollapsedCategories(prev => ({ ...prev, [category]: !prev[category] }));
  };

  return (
    <View
      style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}
    >
      <TodoListHeader
        colors={colors}
        selectionMode={selectionMode}
        selectedCount={selectedTodos.size}
        activeCount={stats.active}
        completedCount={stats.completed}
        groupByCategory={groupByCategory}
        syncStatus={syncStatus}
        lastSyncTime={lastSyncTime}
        pendingCount={pendingCount}
        onToggleSelection={toggleSelectionMode}
        onToggleGrouping={() => setGroupByCategory(!groupByCategory)}
      />

      {stats.total === 0 ? (
        <EmptyState
          icon="document-text-outline"
          title="No todos yet"
          description="Tap + to create your first todo"
        />
      ) : (
        <TodoSectionList
          sections={processedSections}
          colors={colors}
          groupByCategory={groupByCategory}
          collapsedCategories={collapsedCategories}
          selectionMode={selectionMode}
          selectedTodos={selectedTodos}
          onToggleCategory={toggleCategory}
          onSelectTodo={toggleTodoSelection}
          onOpenTodo={handleOpenTodo}
          onToggleTodo={toggleComplete}
        />
      )}

      <BulkActionBar
        colors={colors}
        visible={selectionMode && selectedTodos.size > 0}
        onComplete={handleBulkComplete}
        onIncomplete={handleBulkIncomplete}
        onHighPriority={() => handleBulkPriority('high')}
        onDelete={handleBulkDelete}
      />

      {!selectionMode && (
        <TouchableOpacity
          style={[styles.fab, { backgroundColor: colors.primary }]}
          onPress={handleAddTodo}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={28} color={colors.onPrimary} />
        </TouchableOpacity>
      )}

      <TodoModal
        visible={showAddModal}
        todo={editingTodo}
        onClose={() => setShowAddModal(false)}
        onSave={handleSaveTodo}
      />
      <TodoDetailModal
        visible={showDetailModal}
        todo={selectedTodo}
        onClose={() => setShowDetailModal(false)}
        onEdit={() => handleEditTodo(selectedTodo!)}
        onDelete={handleDeleteTodo}
        onDuplicate={handleDuplicateTodo}
        onTogglePriority={handleTogglePriority}
        onToggleComplete={() => {
          if (selectedTodo) toggleComplete(selectedTodo.id);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  fab: {
    position: 'absolute',
    bottom: spacing.lg,
    right: spacing.lg,
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
});
