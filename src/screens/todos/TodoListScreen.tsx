import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  SectionList,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
  Pressable,
  LayoutAnimation,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TodoItem } from '../../components/todo/TodoItem';
import { useUserStore } from '../../stores/userStore';
import { getThemeColors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

import { TodoModal } from '../../components/todo/TodoModal';
import { TodoDetailModal } from '../../components/todo/TodoDetailModal';
import type { Todo } from '../../types/todo';
import { useTodoStore } from '../../stores/todoStore';

export function TodoListScreen() {
  const theme = useUserStore(state => state.preferences?.theme || 'dark');
  const themeColors = getThemeColors(theme);

  const { todos, loadTodos, addTodo, updateTodo, deleteTodo, duplicateTodo, toggleComplete, bulkComplete, bulkDelete, bulkUpdatePriority } =
    useTodoStore();

  useEffect(() => {
    loadTodos();
  }, []);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [editingTodo, setEditingTodo] = useState<Todo | undefined>(undefined);
  const [selectedTodo, setSelectedTodo] = useState<Todo | undefined>(undefined);

  // Grouping State
  const [groupByCategory, setGroupByCategory] = useState(true);
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});

  // Multi-select State
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedTodos, setSelectedTodos] = useState<Set<string>>(new Set());

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
    setShowDetailModal(true);
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
    const priorities: Todo['priority'][] = ['low', 'medium', 'high'];
    const currentIndex = priorities.indexOf(selectedTodo.priority);
    const nextPriority = priorities[(currentIndex + 1) % priorities.length];
    await updateTodo(selectedTodo.id, { priority: nextPriority });
    setShowDetailModal(false);
  };

  // Multi-select Handlers
  const toggleSelectionMode = () => {
    setSelectionMode(!selectionMode);
    setSelectedTodos(new Set());
  };

  const toggleTodoSelection = (todoId: string) => {
    const newSelected = new Set(selectedTodos);
    if (newSelected.has(todoId)) {
      newSelected.delete(todoId);
    } else {
      newSelected.add(todoId);
    }
    setSelectedTodos(newSelected);
  };

  const handleBulkComplete = async () => {
    await bulkComplete(Array.from(selectedTodos), true);
    setSelectionMode(false);
    setSelectedTodos(new Set());
  };

  const handleBulkIncomplete = async () => {
    await bulkComplete(Array.from(selectedTodos), false);
    setSelectionMode(false);
    setSelectedTodos(new Set());
  };

  const handleBulkDelete = () => {
    Alert.alert(
      'Delete Todos',
      `Are you sure you want to delete ${selectedTodos.size} todo(s)?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await bulkDelete(Array.from(selectedTodos));
            setSelectionMode(false);
            setSelectedTodos(new Set());
          },
        },
      ]
    );
  };

  const handleBulkPriority = (priority: string) => {
    Alert.alert(
      'Change Priority',
      `Set priority to ${priority} for ${selectedTodos.size} todo(s)?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            await bulkUpdatePriority(Array.from(selectedTodos), priority);
            setSelectionMode(false);
            setSelectedTodos(new Set());
          },
        },
      ]
    );
  };

  // Grouping & Filtering Logic
  const processedSections = useMemo(() => {
    // 1. Filter out deleted todos
    const filtered = todos.filter(t => !t.deletedAt);

    // 2. Sort: Active first, then Completed (always at bottom)
    const sortTodos = (list: Todo[]) => {
      return list.sort((a, b) => {
        if (a.completed === b.completed) {
          // Secondary sort: Created date (newest first)
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        return a.completed ? 1 : -1;
      });
    };

    if (!groupByCategory) {
      return [{ title: 'All Todos', data: sortTodos(filtered) }];
    }

    // Group by Category
    const groups: Record<string, Todo[]> = {};
    const uncategorized: Todo[] = [];

    filtered.forEach(todo => {
      if (todo.category) {
        if (!groups[todo.category]) groups[todo.category] = [];
        groups[todo.category].push(todo);
      } else {
        uncategorized.push(todo);
      }
    });

    const sections = Object.keys(groups)
      .sort()
      .map(category => ({
        title: category,
        data: sortTodos(groups[category]),
      }));

    if (uncategorized.length > 0) {
      sections.push({ title: 'Uncategorized', data: sortTodos(uncategorized) });
    }

    return sections;
  }, [todos, groupByCategory]);

  const toggleCategory = (category: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setCollapsedCategories(prev => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  const activeTodosCount = todos.filter(t => !t.completed && !t.deletedAt).length;
  const completedTodosCount = todos.filter(t => t.completed && !t.deletedAt).length;

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
          <View style={styles.headerActions}>
            <TouchableOpacity
              onPress={toggleSelectionMode}
              style={styles.iconButton}
            >
              <Ionicons
                name={selectionMode ? "checkmark-done" : "checkbox-outline"}
                size={24}
                color={themeColors.text}
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setGroupByCategory(!groupByCategory)}
              style={styles.iconButton}
            >
              <Ionicons
                name={groupByCategory ? "layers" : "list"}
                size={24}
                color={themeColors.primary}
              />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowSyncTooltip(true)} style={styles.iconButton}>
              <Ionicons name={getSyncIcon()} size={24} color={getSyncColor()} />
            </TouchableOpacity>
          </View>
        </View>
        <Text style={[styles.subtitle, { color: themeColors.textSecondary }]}>
          {selectionMode
            ? `${selectedTodos.size} selected`
            : `${activeTodosCount} active, ${completedTodosCount} completed`}
        </Text>
      </View>

      {todos.filter(t => !t.deletedAt).length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={[styles.emptyText, { color: themeColors.textSecondary }]}>
            No todos yet. Create your first one!
          </Text>
        </View>
      ) : (
        <SectionList
          sections={processedSections}
          keyExtractor={item => item.id}
          renderItem={({ item, section }) => {
            if (groupByCategory && collapsedCategories[section.title]) return null;
            return (
              <TodoItem
                todo={item}
                onPress={() => selectionMode ? toggleTodoSelection(item.id) : handleTodoPress(item.id)}
                onToggle={() => toggleComplete(item.id)}
                onLongPress={selectionMode ? undefined : () => handleLongPress(item)}
                selectionMode={selectionMode}
                isSelected={selectedTodos.has(item.id)}
              />
            );
          }}
          renderSectionHeader={({ section: { title } }) => {
            if (!groupByCategory) return null;
            return (
              <TouchableOpacity
                style={[styles.sectionHeader, { backgroundColor: themeColors.background }]}
                onPress={() => toggleCategory(title)}
              >
                <Text style={[styles.sectionTitle, { color: themeColors.text }]}>{title}</Text>
                <Ionicons
                  name={collapsedCategories[title] ? "chevron-forward" : "chevron-down"}
                  size={20}
                  color={themeColors.textSecondary}
                />
              </TouchableOpacity>
            );
          }}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          stickySectionHeadersEnabled={false}
        />
      )}

      {/* Bulk Action Bar */}
      {selectionMode && selectedTodos.size > 0 && (
        <View style={[styles.bulkActionBar, { backgroundColor: themeColors.surface, borderTopColor: themeColors.border }]}>
          <TouchableOpacity style={styles.bulkAction} onPress={handleBulkComplete}>
            <Ionicons name="checkmark-circle-outline" size={24} color={themeColors.success} />
            <Text style={[styles.bulkActionText, { color: themeColors.text }]}>Complete</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.bulkAction} onPress={handleBulkIncomplete}>
            <Ionicons name="close-circle-outline" size={24} color={themeColors.textSecondary} />
            <Text style={[styles.bulkActionText, { color: themeColors.text }]}>Incomplete</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.bulkAction} onPress={() => handleBulkPriority('high')}>
            <Ionicons name="flag-outline" size={24} color="#ef4444" />
            <Text style={[styles.bulkActionText, { color: themeColors.text }]}>High</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.bulkAction} onPress={handleBulkDelete}>
            <Ionicons name="trash-outline" size={24} color={themeColors.error} />
            <Text style={[styles.bulkActionText, { color: themeColors.text }]}>Delete</Text>
          </TouchableOpacity>
        </View>
      )}

      {
        !selectionMode && (
          <View style={styles.fab}>
            <TouchableOpacity
              style={[styles.fabButton, { backgroundColor: themeColors.primary }]}
              onPress={handleAddTodo}
              activeOpacity={0.8}
            >
              <Text style={[styles.fabIcon, { color: themeColors.onPrimary }]}>+</Text>
            </TouchableOpacity>
          </View>
        )
      }

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
          if (selectedTodo) {
            toggleComplete(selectedTodo.id);
          }
        }}
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
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    ...typography.h1,
  },
  iconButton: {
    padding: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    marginBottom: spacing.xs,
  },
  sectionTitle: {
    ...typography.h3,
    fontSize: 18,
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
    fontSize: 32,
    fontWeight: '300',
  },
  bulkActionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: spacing.md,
    borderTopWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  bulkAction: {
    alignItems: 'center',
    gap: 4,
  },
  bulkActionText: {
    ...typography.bodySmall,
    fontSize: 11,
  },
});
