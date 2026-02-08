import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useUserStore } from '../../stores/userStore';
import { getThemeColors } from '../../theme/colors';
import { spacing, borderRadius } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import type { Todo } from '../../types/todo';
import { TodoActionSheet } from './TodoActionSheet';

interface TodoDetailModalProps {
  visible: boolean;
  todo?: Todo;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onTogglePriority: () => void;
  onToggleComplete: () => void;
}

export function TodoDetailModal({
  visible,
  todo,
  onClose,
  onEdit,
  onDelete,
  onDuplicate,
  onTogglePriority,
  onToggleComplete,
}: TodoDetailModalProps) {
  const theme = useUserStore(state => state.preferences?.theme || 'dark');
  const themeColors = getThemeColors(theme);
  const [showActionSheet, setShowActionSheet] = useState(false);

  if (!todo) return null;

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

  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return 'No date set';
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      if (isNaN(dateObj.getTime())) return 'Invalid date';
      return dateObj.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch (error) {
      console.error(error);
      return 'Invalid date';
    }
  };

  const formatTimestamp = (date: Date | string | null | undefined) => {
    if (!date) return 'Unknown';
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      if (isNaN(dateObj.getTime())) return 'Invalid date';
      return dateObj.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (error) {
      console.error(error);
      return 'Invalid date';
    }
  };

  const handleShare = async () => {
    try {
      let message = `📝 ${todo.title}\n`;
      if (todo.description) message += `\n${todo.description}\n`;
      if (todo.category) message += `\n🏷️ Category: ${todo.category}`;
      if (todo.dueDate) message += `\n📅 Due: ${formatDate(todo.dueDate)}`;
      message += `\n⚡ Priority: ${todo.priority}`;

      await Share.share({
        message,
        title: todo.title,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const priorityColor = getPriorityColor(todo.priority || 'medium');
  const completedSubtasks = todo.subtasks?.filter(t => t.completed).length || 0;
  const totalSubtasks = todo.subtasks?.length || 0;

  return (
    <>
      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={onClose}
      >
        <SafeAreaView
          style={[styles.container, { backgroundColor: themeColors.background }]}
          edges={['top']}
        >
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: themeColors.border }]}>
            <TouchableOpacity onPress={onClose} style={styles.headerButton}>
              <Ionicons
                name={Platform.OS === 'ios' ? 'close' : 'arrow-back'}
                size={24}
                color={themeColors.text}
              />
            </TouchableOpacity>

            <View style={styles.headerActions}>
              <TouchableOpacity
                onPress={() => {
                  onClose();
                  onEdit();
                }}
                style={styles.headerButton}
              >
                <Ionicons name="create-outline" size={24} color={themeColors.text} />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleShare} style={styles.headerButton}>
                <Ionicons name="share-outline" size={24} color={themeColors.text} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Content */}
          <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
            {/* Title */}
            <Text style={[styles.title, { color: themeColors.text }]}>{todo.title}</Text>

            {/* Status Badge */}
            <View style={styles.statusRow}>
              <View
                style={[
                  styles.statusBadge,
                  {
                    backgroundColor: todo.completed
                      ? themeColors.primary + '20'
                      : priorityColor + '20',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.statusText,
                    { color: todo.completed ? themeColors.primary : priorityColor },
                  ]}
                >
                  {todo.completed ? 'Completed' : `${todo.priority || 'medium'} Priority`}
                </Text>
              </View>

              {/* Sync State */}
              <View style={[styles.syncBadge, { backgroundColor: themeColors.surface }]}>
                <Ionicons name="cloud-done-outline" size={14} color="#10b981" />
                <Text style={[styles.syncText, { color: themeColors.textSecondary }]}>Synced</Text>
              </View>
            </View>

            {/* Description */}
            {todo.description && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Description</Text>
                <Text style={[styles.description, { color: themeColors.textSecondary }]}>
                  {todo.description}
                </Text>
              </View>
            )}

            {/* Metadata Grid */}
            <View style={styles.metadataGrid}>
              {/* Due Date */}
              {todo.dueDate && (
                <View style={[styles.metadataItem, { backgroundColor: themeColors.surface }]}>
                  <Ionicons name="calendar-outline" size={20} color={themeColors.primary} />
                  <View style={styles.metadataContent}>
                    <Text style={[styles.metadataLabel, { color: themeColors.textSecondary }]}>
                      Due Date
                    </Text>
                    <Text style={[styles.metadataValue, { color: themeColors.text }]}>
                      {formatDate(todo.dueDate)}
                    </Text>
                  </View>
                </View>
              )}

              {/* Category */}
              {todo.category && (
                <View style={[styles.metadataItem, { backgroundColor: themeColors.surface }]}>
                  <Ionicons name="pricetag-outline" size={20} color={themeColors.primary} />
                  <View style={styles.metadataContent}>
                    <Text style={[styles.metadataLabel, { color: themeColors.textSecondary }]}>
                      Category
                    </Text>
                    <Text style={[styles.metadataValue, { color: themeColors.text }]}>
                      {todo.category}
                    </Text>
                  </View>
                </View>
              )}
            </View>

            {/* Subtasks */}
            {todo.subtasks && todo.subtasks.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Subtasks</Text>
                  <Text style={[styles.sectionBadge, { color: themeColors.textSecondary }]}>
                    {completedSubtasks}/{totalSubtasks}
                  </Text>
                </View>
                {todo.subtasks.map((subtask, index) => (
                  <View key={index} style={styles.subtaskItem}>
                    <Ionicons
                      name={subtask.completed ? 'checkmark-circle' : 'ellipse-outline'}
                      size={20}
                      color={subtask.completed ? themeColors.primary : themeColors.textSecondary}
                    />
                    <Text
                      style={[
                        styles.subtaskText,
                        { color: themeColors.text },
                        subtask.completed && styles.subtaskCompleted,
                      ]}
                    >
                      {subtask.title}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {/* Tags */}
            {todo.tags && todo.tags.length > 0 && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Tags</Text>
                <View style={styles.tagsContainer}>
                  {todo.tags.map((tag, index) => (
                    <View
                      key={index}
                      style={[styles.tag, { backgroundColor: themeColors.primary + '20' }]}
                    >
                      <Text style={[styles.tagText, { color: themeColors.primary }]}>#{tag}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Timestamps */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Information</Text>
              <View style={styles.timestampRow}>
                <Ionicons name="time-outline" size={16} color={themeColors.textSecondary} />
                <Text style={[styles.timestampText, { color: themeColors.textSecondary }]}>
                  Created {formatTimestamp(todo.createdAt)}
                </Text>
              </View>
              <View style={styles.timestampRow}>
                <Ionicons name="create-outline" size={16} color={themeColors.textSecondary} />
                <Text style={[styles.timestampText, { color: themeColors.textSecondary }]}>
                  Updated {formatTimestamp(todo.updatedAt)}
                </Text>
              </View>
              {todo.completedAt && (
                <View style={styles.timestampRow}>
                  <Ionicons name="checkmark-circle-outline" size={16} color="#10b981" />
                  <Text style={[styles.timestampText, { color: themeColors.textSecondary }]}>
                    Completed {formatTimestamp(todo.completedAt)}
                  </Text>
                </View>
              )}
            </View>
          </ScrollView>

          {/* Footer Actions */}
          <View style={[styles.footer, { borderTopColor: themeColors.border }]}>
            <TouchableOpacity
              style={[
                styles.completeButton,
                {
                  backgroundColor: todo.completed ? themeColors.surface : themeColors.primary,
                },
              ]}
              onPress={() => {
                onClose();
                onToggleComplete();
              }}
            >
              <Ionicons
                name={todo.completed ? 'close-circle-outline' : 'checkmark-circle'}
                size={24}
                color={todo.completed ? themeColors.text : themeColors.onPrimary}
              />
              <Text
                style={[
                  styles.completeButtonText,
                  {
                    color: todo.completed ? themeColors.text : themeColors.onPrimary,
                  },
                ]}
              >
                {todo.completed ? 'Mark Incomplete' : 'Mark Complete'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.deleteButton, { backgroundColor: '#ef4444' + '20' }]}
              onPress={() => {
                onClose();
                onDelete();
              }}
            >
              <Ionicons name="trash-outline" size={20} color="#ef4444" />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Action Sheet for More Options */}
      <TodoActionSheet
        visible={showActionSheet}
        todo={todo}
        onClose={() => setShowActionSheet(false)}
        onEdit={() => {
          setShowActionSheet(false);
          onEdit();
        }}
        onDelete={() => {
          setShowActionSheet(false);
          onDelete();
        }}
        onDuplicate={() => {
          setShowActionSheet(false);
          onDuplicate();
        }}
        onShare={() => {
          setShowActionSheet(false);
          handleShare();
        }}
        onTogglePriority={() => {
          setShowActionSheet(false);
          onTogglePriority();
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: spacing.sm,
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  headerButton: {
    padding: spacing.xs,
  },
  headerActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.lg,
  },
  title: {
    ...typography.h2,
    marginBottom: spacing.md,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  statusText: {
    ...typography.caption,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  syncBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  syncText: {
    ...typography.caption,
    fontSize: 11,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    ...typography.body,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  sectionBadge: {
    ...typography.caption,
    fontWeight: '600',
  },
  description: {
    ...typography.body,
    lineHeight: 24,
  },
  metadataGrid: {
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  metadataItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
  },
  metadataContent: {
    flex: 1,
  },
  metadataLabel: {
    ...typography.caption,
    marginBottom: 2,
  },
  metadataValue: {
    ...typography.body,
    fontWeight: '600',
  },
  subtaskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  subtaskText: {
    ...typography.body,
    flex: 1,
  },
  subtaskCompleted: {
    textDecorationLine: 'line-through',
    opacity: 0.6,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  tag: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
  },
  tagText: {
    ...typography.caption,
    fontWeight: '600',
  },
  timestampRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: 4,
  },
  timestampText: {
    ...typography.caption,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderTopWidth: 1,
  },
  completeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
  },
  completeButtonText: {
    ...typography.body,
    fontWeight: '600',
  },
  deleteButton: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
  },
});
