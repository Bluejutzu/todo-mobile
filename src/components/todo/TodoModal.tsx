import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput as RNTextInput,
} from 'react-native';
import { Input } from '../common/Input';
import { DatePicker } from '../common/DatePicker';
import { ColorPicker } from '../common/ColorPicker';
import { useUserStore } from '../../stores/userStore';
import { getThemeColors } from '../../theme/colors';
import { spacing, borderRadius } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import type { Todo, TodoPriority } from '../../types/todo';

interface TodoModalProps {
  visible: boolean;
  todo?: Todo;
  onClose: () => void;
  onSave: (todoData: Partial<Todo>) => void;
}

const PRIORITIES: { value: TodoPriority; label: string; color: string }[] = [
  { value: 'low', label: 'Low', color: '#10b981' },
  { value: 'medium', label: 'Medium', color: '#f59e0b' },
  { value: 'high', label: 'High', color: '#ef4444' },
];

export function TodoModal({ visible, todo, onClose, onSave }: TodoModalProps) {
  const theme = useUserStore(state => state.preferences?.theme || 'dark');
  const themeColors = getThemeColors(theme);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TodoPriority>('medium');
  const [dueDate, setDueDate] = useState<Date | undefined>();
  const [category, setCategory] = useState('');
  const [color, setColor] = useState<string>('#6366f1');

  useEffect(() => {
    if (todo) {
      setTitle(todo.title);
      setDescription(todo.description || '');
      setPriority(todo.priority);
      setDueDate(todo.dueDate);
      setCategory(todo.category || '');
      setColor(todo.color || '#6366f1');
    } else {
      // Reset for new todo
      setTitle('');
      setDescription('');
      setPriority('medium');
      setDueDate(undefined);
      setCategory('');
      setColor('#6366f1');
    }
  }, [todo, visible]);

  const handleSave = () => {
    if (!title.trim()) return;

    const todoData: Partial<Todo> = {
      title: title.trim(),
      description: description.trim() || undefined,
      priority,
      dueDate,
      category: category.trim() || undefined,
      color,
    };

    onSave(todoData);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: themeColors.background }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: themeColors.border }]}>
          <TouchableOpacity onPress={onClose} style={styles.headerButton}>
            <Text style={[styles.headerButtonText, { color: themeColors.textSecondary }]}>
              Cancel
            </Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: themeColors.text }]}>
            {todo ? 'Edit Todo' : 'New Todo'}
          </Text>
          <TouchableOpacity onPress={handleSave} style={styles.headerButton}>
            <Text
              style={[
                styles.headerButtonText,
                styles.saveButtonText,
                {
                  color: title.trim() ? themeColors.primary : themeColors.textSecondary,
                },
              ]}
            >
              Save
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          keyboardShouldPersistTaps="handled"
        >
          {/* Title */}
          <Input
            label="Title"
            value={title}
            onChangeText={setTitle}
            placeholder="What needs to be done?"
            autoFocus
          />

          {/* Description */}
          <View style={styles.field}>
            <Text style={[styles.label, { color: themeColors.text }]}>Description</Text>
            <RNTextInput
              style={[
                styles.textarea,
                {
                  backgroundColor: themeColors.surface,
                  borderColor: themeColors.border,
                  color: themeColors.text,
                },
              ]}
              value={description}
              onChangeText={setDescription}
              placeholder="Add details..."
              placeholderTextColor={themeColors.textSecondary}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          {/* Priority */}
          <View style={styles.field}>
            <Text style={[styles.label, { color: themeColors.text }]}>Priority</Text>
            <View style={styles.priorityContainer}>
              {PRIORITIES.map(p => (
                <TouchableOpacity
                  key={p.value}
                  style={[
                    styles.priorityButton,
                    {
                      backgroundColor: priority === p.value ? p.color : themeColors.surface,
                      borderColor: p.color,
                    },
                  ]}
                  onPress={() => setPriority(p.value)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.priorityText,
                      // eslint-disable-next-line react-native/no-inline-styles
                      {
                        color: priority === p.value ? '#ffffff' : themeColors.text,
                      },
                    ]}
                  >
                    {p.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Due Date */}
          <DatePicker
            label="Due Date"
            value={dueDate}
            onChange={setDueDate}
            placeholder="No due date"
          />

          {/* Category */}
          <Input
            label="Category"
            value={category}
            onChangeText={setCategory}
            placeholder="e.g., Work, Personal, Shopping"
          />

          {/* Color */}
          <ColorPicker label="Color" value={color} onChange={setColor} />
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
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
    minWidth: 60,
  },
  headerButtonText: {
    ...typography.body,
  },
  saveButtonText: {
    fontWeight: '600',
  },
  headerTitle: {
    ...typography.h3,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.md,
  },
  field: {
    marginBottom: spacing.md,
  },
  label: {
    ...typography.bodySmall,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  textarea: {
    ...typography.body,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    minHeight: 100,
  },
  priorityContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  priorityButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.sm,
    borderWidth: 2,
    alignItems: 'center',
  },
  priorityText: {
    ...typography.bodySmall,
    fontWeight: '600',
  },
});
