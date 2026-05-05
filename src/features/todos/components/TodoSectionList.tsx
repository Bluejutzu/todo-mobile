import React from 'react';
import { LayoutAnimation, SectionList, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TodoItem } from '../../../components/todo/TodoItem';
import type { Todo } from '../../../types/todo';
import type { TodoSection } from '../domain/todoSelectors';
import type { Colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';

interface TodoSectionListProps {
  sections: TodoSection[];
  colors: Colors;
  groupByCategory: boolean;
  collapsedCategories: Record<string, boolean>;
  selectionMode: boolean;
  selectedTodos: Set<string>;
  onToggleCategory: (category: string) => void;
  onSelectTodo: (id: string) => void;
  onOpenTodo: (todo: Todo) => void;
  onToggleTodo: (id: string) => void;
}

export function TodoSectionList({
  sections,
  colors,
  groupByCategory,
  collapsedCategories,
  selectionMode,
  selectedTodos,
  onToggleCategory,
  onSelectTodo,
  onOpenTodo,
  onToggleTodo,
}: TodoSectionListProps) {
  const toggleCategory = (category: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    onToggleCategory(category);
  };

  return (
    <SectionList
      sections={sections}
      keyExtractor={item => item.id}
      renderItem={({ item, section }) => {
        if (groupByCategory && collapsedCategories[section.title]) return null;
        return (
          <TodoItem
            todo={item}
            onPress={() => (selectionMode ? onSelectTodo(item.id) : onOpenTodo(item))}
            onToggle={() => onToggleTodo(item.id)}
            onLongPress={selectionMode ? undefined : () => onSelectTodo(item.id)}
            selectionMode={selectionMode}
            isSelected={selectedTodos.has(item.id)}
          />
        );
      }}
      renderSectionHeader={({ section: { title } }) => {
        if (!groupByCategory) return null;
        return (
          <TouchableOpacity
            style={[styles.sectionHeader, { backgroundColor: colors.background }]}
            onPress={() => toggleCategory(title)}
          >
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
            <Ionicons
              name={collapsedCategories[title] ? 'chevron-forward' : 'chevron-down'}
              size={18}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        );
      }}
      contentContainerStyle={styles.list}
      showsVerticalScrollIndicator={false}
      stickySectionHeadersEnabled={false}
    />
  );
}

const styles = StyleSheet.create({
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  list: {
    padding: spacing.md,
    paddingBottom: 100,
  },
});
