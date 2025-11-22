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
            style={[
              styles.checkbox,
              {
                borderColor: getPriorityColor(todo.priority),
              },
              todo.completed && { backgroundColor: themeColors.success },
              todo.completed && { borderColor: themeColors.success },
            ]}
            onPress={onToggle}
          >
            {todo.completed && (
              <Ionicons name="checkmark" size={16} color={themeColors.onPrimary} />
            )}
          </TouchableOpacity>

          <View style={styles.content}>
            <Text
              style={[
                styles.title,
                {
                  color: todo.completed ? themeColors.textSecondary : themeColors.text,
                },
                // eslint-disable-next-line react-native/no-inline-styles
                todo.completed && { textDecorationLine: 'line-through' },
              ]}
              numberOfLines={1}
            >
              {todo.title}
            </Text>
            {todo.dueDate && (
              <Text style={[styles.date, { color: themeColors.textSecondary }]}>
                {new Date(todo.dueDate).toLocaleDateString()}
              </Text>
            )}
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
  completedOpacity: {
    opacity: 0.5,
  },
  content: {
    flex: 1,
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
  date: {
    ...typography.caption,
    marginBottom: spacing.xs,
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
});
