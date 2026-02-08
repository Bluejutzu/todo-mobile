import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../common/Card';
import { useUserStore } from '../../stores/userStore';
import { getThemeColors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import type { Todo } from '../../types/todo';

interface TodoItemProps {
  todo: Todo;
  onPress: () => void;
  onToggle: () => void;
  onLongPress?: () => void;
  selectionMode?: boolean;
  isSelected?: boolean;
}

export function TodoItem({
  todo,
  onPress,
  onToggle,
  onLongPress,
  selectionMode,
  isSelected,
}: TodoItemProps) {
  const theme = useUserStore(state => state.preferences?.theme || 'dark');
  const themeColors = getThemeColors(theme);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return '#ef4444';
      case 'medium':
        return '#f59e0b';
      case 'low':
        return '#10b981';
      default:
        return themeColors.textSecondary;
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const priorityColor = getPriorityColor(todo.priority || 'medium');

  return (
    <TouchableOpacity
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.7}
      delayLongPress={500}
      style={isSelected && selectionMode ? { opacity: styles.card.opacity } : undefined}
    >
      <Card
        style={[
          styles.card,
          isSelected &&
            selectionMode && {
              backgroundColor: themeColors.primary + '15',
              borderColor: themeColors.text,
              borderWidth: spacing.xs,
            },
        ]}
      >
        <View style={styles.headerRow}>
          {selectionMode && (
            <View style={[styles.selectionCheckbox, { borderColor: themeColors.border }]}>
              {isSelected && <Ionicons name="checkmark" size={18} color={themeColors.primary} />}
            </View>
          )}
          <View style={styles.leftHeader}>
            <TouchableOpacity
              style={[
                styles.checkbox,
                { borderColor: priorityColor },
                todo.completed && { backgroundColor: priorityColor, borderColor: priorityColor },
              ]}
              onPress={onToggle}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              {todo.completed && <Ionicons name="checkmark" size={14} color="#fff" />}
            </TouchableOpacity>

            <Text
              style={[
                styles.title,
                { color: todo.completed ? themeColors.textSecondary : themeColors.text },
                todo.completed && styles.completedTitle,
              ]}
              numberOfLines={1}
            >
              {todo.title}
            </Text>
          </View>

          <View style={styles.priorityContainer}>
            <View style={[styles.priorityDot, { backgroundColor: priorityColor }]} />
            <Text style={[styles.priorityText, { color: themeColors.textSecondary }]}>
              {(todo.priority || 'medium').charAt(0).toUpperCase() +
                (todo.priority || 'medium').slice(1)}
            </Text>
          </View>
        </View>

        {todo.description && (
          <Text
            style={[
              styles.description,
              { color: themeColors.textSecondary },
              todo.completed && styles.completedDescription,
            ]}
            numberOfLines={2}
          >
            {todo.description}
          </Text>
        )}

        <View style={styles.footer}>
          <View style={styles.footerLeft}>
            {todo.dueDate && (
              <View style={styles.footerItem}>
                <Ionicons name="calendar-outline" size={12} color={themeColors.textSecondary} />
                <Text style={[styles.footerText, { color: themeColors.textSecondary }]}>
                  {formatDate(todo.dueDate)}
                </Text>
              </View>
            )}
            {todo.category && (
              <View style={styles.footerItem}>
                {todo.dueDate && (
                  <Text style={[styles.footerText, { color: themeColors.textSecondary }]}> • </Text>
                )}
                <Ionicons name="pricetag-outline" size={12} color={themeColors.textSecondary} />
                <Text style={[styles.footerText, { color: themeColors.textSecondary }]}>
                  {todo.category}
                </Text>
              </View>
            )}
          </View>

          {/* Keep tags/subtasks as chips if needed, or just hide them for now based on "instead of everything being in chips" */}
          {/* I'll keep subtasks as a small indicator if present */}
          {todo.subtasks && todo.subtasks.length > 0 && (
            <Text
              style={[
                styles.footerText,
                { color: themeColors.textSecondary, marginLeft: spacing.sm },
              ]}
            >
              {todo.subtasks.filter(t => t.completed).length}/{todo.subtasks.length} subtasks
            </Text>
          )}
        </View>
      </Card>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.sm,
    padding: spacing.md,
    opacity: 0.7,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  leftHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: spacing.sm,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  title: {
    ...typography.body,
    fontWeight: '600',
    flex: 1,
    fontSize: 16,
  },
  completedTitle: {
    textDecorationLine: 'line-through',
    opacity: 0.7,
  },
  priorityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priorityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  priorityText: {
    ...typography.caption,
    textTransform: 'capitalize',
    fontWeight: '500',
  },
  description: {
    ...typography.bodySmall,
    marginBottom: spacing.sm,
    marginLeft: 34, // Align with title
    lineHeight: 20,
  },
  completedDescription: {
    opacity: 0.5,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 34, // Align with title
    flexWrap: 'wrap',
  },
  footerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  footerText: {
    ...typography.caption,
    fontSize: 12,
  },
  selectionCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    marginRight: spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
