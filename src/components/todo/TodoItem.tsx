import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Card } from '../common/Card';
import { useUserStore } from '../../stores/userStore';
import { getThemeColors } from '../../theme/colors';
import { spacing, borderRadius } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import type { Todo } from '../../types/todo';

interface TodoItemProps {
  todo: Todo;
  onPress: () => void;
  onToggle: () => void;
  onLongPress?: () => void;
}

export function TodoItem({ todo, onPress, onToggle, onLongPress }: TodoItemProps) {
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

  return (
    <TouchableOpacity
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.7}
      delayLongPress={500}
    >
      <Card
        style={[
          styles.card,
          styles.borderLeft,
          { borderLeftColor: todo.color || themeColors.primary },
        ]}
      >
        <View style={styles.container}>
          <TouchableOpacity
            onPress={onToggle}
            style={[
              styles.checkbox,
              { borderColor: themeColors.primary },
              todo.completed && { backgroundColor: themeColors.primary },
            ]}
            activeOpacity={0.7}
          >
            {todo.completed && <Text style={styles.checkmark}>✓</Text>}
          </TouchableOpacity>

          <View style={styles.content}>
            <View style={styles.headerRow}>
              <Text
                style={[
                  styles.title,
                  { color: themeColors.text },
                  todo.completed && styles.completedText,
                ]}
                numberOfLines={1}
              >
                {todo.title}
              </Text>
              {todo.priority && (
                <View
                  style={[
                    styles.badge,
                    { backgroundColor: getPriorityColor(todo.priority) + '20' },
                  ]}
                >
                  <Text style={[styles.badgeText, { color: getPriorityColor(todo.priority) }]}>
                    {todo.priority}
                  </Text>
                </View>
              )}
            </View>

            {todo.description && (
              <Text
                style={[
                  styles.description,
                  { color: themeColors.textSecondary },
                  todo.completed && styles.completedOpacity,
                ]}
                numberOfLines={2}
              >
                {todo.description}
              </Text>
            )}

            <View style={styles.footer}>
              {todo.dueDate && (
                <View style={styles.metaItem}>
                  <Text style={[styles.metaText, { color: themeColors.textSecondary }]}>
                    📅 {formatDate(todo.dueDate)}
                  </Text>
                </View>
              )}
              {todo.category && (
                <View style={styles.metaItem}>
                  <Text style={[styles.metaText, { color: themeColors.textSecondary }]}>
                    🏷️ {todo.category}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.sm,
    overflow: 'hidden',
  },
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: spacing.md,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
    marginTop: 2,
  },
  borderLeft: {
    borderLeftWidth: 4,
  },
  completedText: {
    textDecorationLine: 'line-through',
    opacity: 0.6,
  },
  completedOpacity: {
    opacity: 0.5,
  },
  checkmark: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  title: {
    ...typography.body,
    fontWeight: '600',
    flex: 1,
    marginRight: spacing.sm,
  },
  description: {
    ...typography.bodySmall,
    marginBottom: spacing.sm,
  },
  footer: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    ...typography.caption,
  },
  badge: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  badgeText: {
    ...typography.caption,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
});
