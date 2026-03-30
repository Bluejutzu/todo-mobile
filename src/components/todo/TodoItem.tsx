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

const PRIORITY_COLORS: Record<string, string> = {
  high: '#ef4444',
  medium: '#f59e0b',
  low: '#10b981',
};

export function TodoItem({ todo, onPress, onToggle, onLongPress, selectionMode, isSelected }: TodoItemProps) {
  const theme = useUserStore(state => state.preferences?.theme || 'dark');
  const colors = getThemeColors(theme);
  const priorityColor = PRIORITY_COLORS[todo.priority || 'medium'] || colors.textSecondary;

  const formatDate = (date: Date) =>
    new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

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
          isSelected && selectionMode && {
            backgroundColor: colors.primary + '12',
            borderColor: colors.primary,
          },
        ]}
      >
        <View style={styles.row}>
          {selectionMode && (
            <View style={[styles.selectionDot, { borderColor: colors.border }]}>
              {isSelected && <Ionicons name="checkmark" size={14} color={colors.primary} />}
            </View>
          )}

          <TouchableOpacity
            style={[
              styles.checkbox,
              { borderColor: priorityColor },
              todo.completed && { backgroundColor: priorityColor },
            ]}
            onPress={onToggle}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            {todo.completed && <Ionicons name="checkmark" size={12} color="#fff" />}
          </TouchableOpacity>

          <View style={styles.body}>
            <Text
              style={[
                styles.title,
                { color: todo.completed ? colors.textSecondary : colors.text },
                todo.completed && styles.strikethrough,
              ]}
              numberOfLines={1}
            >
              {todo.title}
            </Text>

            {todo.description && (
              <Text style={[styles.desc, { color: colors.textSecondary }]} numberOfLines={1}>
                {todo.description}
              </Text>
            )}

            <View style={styles.meta}>
              {todo.dueDate && (
                <View style={styles.metaItem}>
                  <Ionicons name="calendar-outline" size={11} color={colors.textSecondary} />
                  <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                    {formatDate(todo.dueDate)}
                  </Text>
                </View>
              )}
              {todo.category && (
                <View style={styles.metaItem}>
                  <Ionicons name="pricetag-outline" size={11} color={colors.textSecondary} />
                  <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                    {todo.category}
                  </Text>
                </View>
              )}
              {todo.subtasks && todo.subtasks.length > 0 && (
                <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                  {todo.subtasks.filter(t => t.completed).length}/{todo.subtasks.length} subtasks
                </Text>
              )}
            </View>
          </View>

          <View style={[styles.priorityDot, { backgroundColor: priorityColor }]} />
        </View>
      </Card>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.sm,
    padding: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '500',
  },
  strikethrough: {
    textDecorationLine: 'line-through',
    opacity: 0.6,
  },
  desc: {
    fontSize: 13,
    marginTop: 2,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
    flexWrap: 'wrap',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  metaText: {
    fontSize: 11,
  },
  priorityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  selectionDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
