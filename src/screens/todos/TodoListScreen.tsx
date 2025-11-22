import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Share,
  Alert,
  ActivityIndicator,
  Modal,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TodoItem } from '../../components/todo/TodoItem';
import { useUserStore } from '../../stores/userStore';
import { getThemeColors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

import { TodoModal } from '../../components/todo/TodoModal';
import { TodoActionSheet } from '../../components/todo/TodoActionSheet';
import type { Todo } from '../../types/todo';
import { useTodoStore } from '../../stores/todoStore';

export function TodoListScreen() {
  const theme = useUserStore(state => state.preferences?.theme || 'dark');
  const themeColors = getThemeColors(theme);

  const { todos, loadTodos, addTodo, updateTodo, deleteTodo, duplicateTodo, toggleComplete } =
    useTodoStore();

  useEffect(() => {
    loadTodos();
  }, []);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [editingTodo, setEditingTodo] = useState<Todo | undefined>(undefined);
  const [selectedTodo, setSelectedTodo] = useState<Todo | undefined>(undefined);

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

  const insets = useSafeAreaInsets();
  const [showSyncTooltip, setShowSyncTooltip] = useState(false);
  const syncStatus = useTodoStore(state => state.syncStatus);
  const lastSyncTime = useTodoStore(state => state.lastSyncTime);
  const pendingCount = useTodoStore(state => state.pendingCount);

  const getSyncIcon = () => {
    switch (syncStatus) {
      case 'synced':
        return 'cloud-done-outline';
      case 'syncing':
        return 'sync-outline';
      case 'offline':
        return 'cloud-offline-outline';
      case 'error':
        return 'alert-circle-outline';
      default:
        return 'cloud-outline';
    }
  };

  const getSyncColor = () => {
    switch (syncStatus) {
      case 'synced':
        return themeColors.success;
      case 'syncing':
        return themeColors.primary;
      case 'offline':
        return themeColors.textSecondary;
      case 'error':
        return themeColors.error;
      default:
        return themeColors.textSecondary;
    }
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: themeColors.background, paddingTop: insets.top },
      ]}
    >
      <Modal
        transparent
        visible={showSyncTooltip}
        animationType="fade"
        onRequestClose={() => setShowSyncTooltip(false)}
      >
        <Pressable style={styles.tooltipOverlay} onPress={() => setShowSyncTooltip(false)}>
          <View
            style={[
              styles.tooltipContent,
              { backgroundColor: themeColors.surface, borderColor: themeColors.border },
            ]}
          >
            <Text style={[styles.tooltipTitle, { color: themeColors.text }]}>Sync Status</Text>
            <View style={styles.tooltipRow}>
              <Ionicons name={getSyncIcon()} size={20} color={getSyncColor()} />
              <Text style={[styles.tooltipText, { color: themeColors.text }]}>
                {syncStatus.charAt(0).toUpperCase() + syncStatus.slice(1)}
              </Text>
            </View>
            {pendingCount > 0 && (
              <Text style={[styles.tooltipDetail, { color: themeColors.textSecondary }]}>
                {pendingCount} item{pendingCount !== 1 ? 's' : ''} pending
              </Text>
            )}
            <Text style={[styles.tooltipDetail, { color: themeColors.textSecondary }]}>
              Last sync: {lastSyncTime ? lastSyncTime.toLocaleTimeString() : 'Never'}
            </Text>
          </View>
        </Pressable>
      </Modal>

      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={[styles.title, { color: themeColors.text }]}>My Todos</Text>
          <TouchableOpacity onPress={() => setShowSyncTooltip(true)} style={styles.syncButton}>
            <Ionicons name={getSyncIcon()} size={24} color={getSyncColor()} />
          </TouchableOpacity>
        </View>
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
      {/* Bottom Sync Progress */}
      {(syncStatus === 'syncing' || pendingCount > 0) && (
        <View
          style={[
            styles.bottomProgress,
            { backgroundColor: themeColors.surface, borderTopColor: themeColors.border },
          ]}
        >
          <Text style={[styles.bottomProgressText, { color: themeColors.textSecondary }]}>
            {syncStatus === 'syncing'
              ? 'Syncing...'
              : `${pendingCount} item${pendingCount !== 1 ? 's' : ''} waiting to sync`}
          </Text>
          {syncStatus === 'syncing' && (
            <ActivityIndicator size="small" color={themeColors.primary} style={styles.loader} />
          )}
        </View>
      )}
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
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  title: {
    ...typography.h1,
  },
  syncButton: {
    padding: 8,
  },
  tooltipOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tooltipContent: {
    padding: spacing.lg,
    borderRadius: 12,
    borderWidth: 1,
    minWidth: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  tooltipTitle: {
    ...typography.h3,
    marginBottom: spacing.sm,
  },
  tooltipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: spacing.xs,
  },
  tooltipText: {
    ...typography.body,
    fontWeight: '600',
  },
  tooltipDetail: {
    ...typography.bodySmall,
    marginTop: 4,
  },
  bottomProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.sm,
    borderTopWidth: 1,
  },
  bottomProgressText: {
    ...typography.bodySmall,
  },
  loader: {
    marginLeft: 8,
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
