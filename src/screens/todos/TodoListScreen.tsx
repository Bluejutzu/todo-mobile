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
import { TodoModal } from '../../components/todo/TodoModal';
import { TodoDetailModal } from '../../components/todo/TodoDetailModal';
import type { Todo } from '../../types/todo';
import { useTodoStore } from '../../stores/todoStore';

export function TodoListScreen() {
  const theme = useUserStore(state => state.preferences?.theme || 'dark');
  const colors = getThemeColors(theme);
  const insets = useSafeAreaInsets();

  const {
    todos, loadTodos, addTodo, updateTodo, deleteTodo, duplicateTodo,
    toggleComplete, bulkComplete, bulkDelete, bulkUpdatePriority,
  } = useTodoStore();

  const syncStatus = useTodoStore(state => state.syncStatus);
  const lastSyncTime = useTodoStore(state => state.lastSyncTime);
  const pendingCount = useTodoStore(state => state.pendingCount);

  useEffect(() => { loadTodos(); }, []);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [editingTodo, setEditingTodo] = useState<Todo | undefined>();
  const [selectedTodo, setSelectedTodo] = useState<Todo | undefined>();
  const [groupByCategory, setGroupByCategory] = useState(true);
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedTodos, setSelectedTodos] = useState<Set<string>>(new Set());
  const [showSyncTooltip, setShowSyncTooltip] = useState(false);

  const handleAddTodo = () => { setEditingTodo(undefined); setShowAddModal(true); };
  const handleEditTodo = (todo: Todo) => { setEditingTodo(todo); setShowAddModal(true); };
  const handleLongPress = (todo: Todo) => { setSelectedTodo(todo); setShowDetailModal(true); };

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
      { text: 'Delete', style: 'destructive', onPress: async () => { await deleteTodo(selectedTodo.id); setShowDetailModal(false); } },
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

  const toggleSelectionMode = () => { setSelectionMode(!selectionMode); setSelectedTodos(new Set()); };

  const toggleTodoSelection = (id: string) => {
    const next = new Set(selectedTodos);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelectedTodos(next);
  };

  const exitSelection = () => { setSelectionMode(false); setSelectedTodos(new Set()); };

  const handleBulkComplete = async () => { await bulkComplete(Array.from(selectedTodos), true); exitSelection(); };
  const handleBulkIncomplete = async () => { await bulkComplete(Array.from(selectedTodos), false); exitSelection(); };
  const handleBulkDelete = () => {
    Alert.alert('Delete', `Delete ${selectedTodos.size} todo(s)?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { await bulkDelete(Array.from(selectedTodos)); exitSelection(); } },
    ]);
  };
  const handleBulkPriority = (priority: string) => {
    Alert.alert('Priority', `Set ${selectedTodos.size} todo(s) to ${priority}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Confirm', onPress: async () => { await bulkUpdatePriority(Array.from(selectedTodos), priority); exitSelection(); } },
    ]);
  };

  const processedSections = useMemo(() => {
    const filtered = todos.filter(t => !t.deletedAt);
    const sortFn = (a: Todo, b: Todo) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    };

    if (!groupByCategory) return [{ title: 'All Todos', data: [...filtered].sort(sortFn) }];

    const groups: Record<string, Todo[]> = {};
    const uncategorized: Todo[] = [];
    filtered.forEach(t => {
      if (t.category) {
        (groups[t.category] ??= []).push(t);
      } else {
        uncategorized.push(t);
      }
    });

    const sections = Object.keys(groups).sort().map(cat => ({ title: cat, data: groups[cat].sort(sortFn) }));
    if (uncategorized.length > 0) sections.push({ title: 'Uncategorized', data: uncategorized.sort(sortFn) });
    return sections;
  }, [todos, groupByCategory]);

  const toggleCategory = (category: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setCollapsedCategories(prev => ({ ...prev, [category]: !prev[category] }));
  };

  const activeTodos = todos.filter(t => !t.completed && !t.deletedAt).length;
  const completedTodos = todos.filter(t => t.completed && !t.deletedAt).length;

  const getSyncIcon = (): keyof typeof Ionicons.glyphMap => {
    const map = { synced: 'cloud-done-outline', syncing: 'sync-outline', offline: 'cloud-offline-outline', error: 'alert-circle-outline' } as const;
    return (map[syncStatus] || 'cloud-outline') as keyof typeof Ionicons.glyphMap;
  };

  const getSyncColor = () => {
    const map = { synced: colors.success, syncing: colors.primary, offline: colors.textSecondary, error: colors.error };
    return map[syncStatus] || colors.textSecondary;
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <Modal transparent visible={showSyncTooltip} animationType="fade" onRequestClose={() => setShowSyncTooltip(false)}>
        <Pressable style={styles.overlay} onPress={() => setShowSyncTooltip(false)}>
          <View style={[styles.tooltip, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
            <View style={styles.tooltipRow}>
              <Ionicons name={getSyncIcon()} size={18} color={getSyncColor()} />
              <Text style={[styles.tooltipLabel, { color: colors.text }]}>
                {syncStatus.charAt(0).toUpperCase() + syncStatus.slice(1)}
              </Text>
            </View>
            {pendingCount > 0 && (
              <Text style={[styles.tooltipMeta, { color: colors.textSecondary }]}>
                {pendingCount} pending
              </Text>
            )}
            <Text style={[styles.tooltipMeta, { color: colors.textSecondary }]}>
              Last sync: {lastSyncTime ? lastSyncTime.toLocaleTimeString() : 'Never'}
            </Text>
          </View>
        </Pressable>
      </Modal>

      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={[styles.title, { color: colors.text }]}>My Todos</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity onPress={toggleSelectionMode} style={styles.iconBtn}>
              <Ionicons name={selectionMode ? 'checkmark-done' : 'checkbox-outline'} size={22} color={colors.text} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setGroupByCategory(!groupByCategory)} style={styles.iconBtn}>
              <Ionicons name={groupByCategory ? 'layers' : 'list'} size={22} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowSyncTooltip(true)} style={styles.iconBtn}>
              <Ionicons name={getSyncIcon()} size={22} color={getSyncColor()} />
            </TouchableOpacity>
          </View>
        </View>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {selectionMode ? `${selectedTodos.size} selected` : `${activeTodos} active, ${completedTodos} completed`}
        </Text>
      </View>

      {todos.filter(t => !t.deletedAt).length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="document-text-outline" size={48} color={colors.border} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>No todos yet</Text>
          <Text style={[styles.emptyDesc, { color: colors.textSecondary }]}>
            Tap + to create your first todo
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
                onPress={() => selectionMode ? toggleTodoSelection(item.id) : toggleComplete(item.id)}
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
              <TouchableOpacity style={[styles.sectionHeader, { backgroundColor: colors.background }]} onPress={() => toggleCategory(title)}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
                <Ionicons name={collapsedCategories[title] ? 'chevron-forward' : 'chevron-down'} size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            );
          }}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          stickySectionHeadersEnabled={false}
        />
      )}

      {selectionMode && selectedTodos.size > 0 && (
        <View style={[styles.bulkBar, { backgroundColor: colors.surfaceElevated, borderTopColor: colors.border }]}>
          <TouchableOpacity style={styles.bulkAction} onPress={handleBulkComplete}>
            <Ionicons name="checkmark-circle-outline" size={22} color={colors.success} />
            <Text style={[styles.bulkText, { color: colors.text }]}>Done</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.bulkAction} onPress={handleBulkIncomplete}>
            <Ionicons name="close-circle-outline" size={22} color={colors.textSecondary} />
            <Text style={[styles.bulkText, { color: colors.text }]}>Undo</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.bulkAction} onPress={() => handleBulkPriority('high')}>
            <Ionicons name="flag-outline" size={22} color="#ef4444" />
            <Text style={[styles.bulkText, { color: colors.text }]}>High</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.bulkAction} onPress={handleBulkDelete}>
            <Ionicons name="trash-outline" size={22} color={colors.error} />
            <Text style={[styles.bulkText, { color: colors.text }]}>Delete</Text>
          </TouchableOpacity>
        </View>
      )}

      {!selectionMode && (
        <TouchableOpacity
          style={[styles.fab, { backgroundColor: colors.primary }]}
          onPress={handleAddTodo}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={28} color={colors.onPrimary} />
        </TouchableOpacity>
      )}

      <TodoModal visible={showAddModal} todo={editingTodo} onClose={() => setShowAddModal(false)} onSave={handleSaveTodo} />
      <TodoDetailModal
        visible={showDetailModal}
        todo={selectedTodo}
        onClose={() => setShowDetailModal(false)}
        onEdit={() => handleEditTodo(selectedTodo!)}
        onDelete={handleDeleteTodo}
        onDuplicate={handleDuplicateTodo}
        onTogglePriority={handleTogglePriority}
        onToggleComplete={() => { if (selectedTodo) toggleComplete(selectedTodo.id); }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.sm },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  title: { fontSize: 28, fontWeight: '700' },
  iconBtn: { padding: 6 },
  subtitle: { fontSize: 13 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.sm },
  sectionTitle: { fontSize: 16, fontWeight: '600' },
  list: { padding: spacing.md, paddingBottom: 100 },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: 8 },
  emptyTitle: { fontSize: 18, fontWeight: '600' },
  emptyDesc: { fontSize: 14, textAlign: 'center' },
  fab: {
    position: 'absolute', bottom: spacing.lg, right: spacing.lg,
    width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 6,
  },
  bulkBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'space-around', padding: spacing.md,
    borderTopWidth: 0.5,
  },
  bulkAction: { alignItems: 'center', gap: 2 },
  bulkText: { fontSize: 11 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  tooltip: { padding: spacing.md, borderRadius: 12, borderWidth: 1, minWidth: 180, elevation: 4 },
  tooltipRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  tooltipLabel: { fontSize: 15, fontWeight: '600' },
  tooltipMeta: { fontSize: 12, marginTop: 2 },
});
