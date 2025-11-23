import React from 'react';
import { View, Text, Modal, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useUserStore } from '../../stores/userStore';
import { getThemeColors } from '../../theme/colors';
import { spacing, borderRadius } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import type { Todo } from '../../types/todo';

interface TodoActionSheetProps {
  visible: boolean;
  todo?: Todo;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onShare: () => void;
  onTogglePriority: () => void;
}

export function TodoActionSheet({
  visible,
  todo,
  onClose,
  onEdit,
  onDelete,
  onDuplicate,
  onShare,
  onTogglePriority,
}: TodoActionSheetProps) {
  const theme = useUserStore(state => state.preferences?.theme || 'dark');
  const themeColors = getThemeColors(theme);

  if (!todo) return null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: themeColors.surface,
              borderColor: themeColors.border,
            },
          ]}
        >
          <View style={styles.header}>
            <Text style={[styles.title, { color: themeColors.text }]} numberOfLines={1}>
              {todo.title}
            </Text>
          </View>

          <View style={styles.actions}>
            <ActionButton
              iconName="create-outline"
              label="Edit"
              onPress={() => {
                onClose();
                onEdit();
              }}
              themeColors={themeColors}
            />
            <ActionButton
              iconName="copy-outline"
              label="Duplicate"
              onPress={() => {
                onClose();
                onDuplicate();
              }}
              themeColors={themeColors}
            />
            <ActionButton
              iconName="share-outline"
              label="Share"
              onPress={() => {
                onClose();
                onShare();
              }}
              themeColors={themeColors}
            />
            <ActionButton
              iconName="flag-outline"
              label={`Priority: ${todo.priority}`}
              onPress={() => {
                onClose();
                onTogglePriority();
              }}
              themeColors={themeColors}
            />
            <ActionButton
              iconName="trash-outline"
              label="Delete"
              onPress={() => {
                onClose();
                onDelete();
              }}
              themeColors={themeColors}
              destructive
            />
          </View>

          <TouchableOpacity
            style={[styles.cancelButton, { backgroundColor: themeColors.background }]}
            onPress={onClose}
          >
            <Text style={[styles.cancelText, { color: themeColors.text }]}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

interface ActionButtonProps {
  iconName: string;
  label: string;
  onPress: () => void;
  themeColors: Record<string, string>;
  destructive?: boolean;
}

function ActionButton({ iconName, label, onPress, themeColors, destructive }: ActionButtonProps) {
  return (
    <TouchableOpacity
      style={[styles.actionButton, { borderBottomColor: themeColors.border }]}
      onPress={onPress}
    >
      <Ionicons
        name={iconName as any}
        size={22}
        color={destructive ? '#ef4444' : themeColors.text}
        style={styles.actionIcon}
      />
      <Text
        style={[
          styles.actionLabel,
          { color: themeColors.text },
          destructive && styles.destructiveActionLabel,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: borderRadius.lg,
    borderTopRightRadius: borderRadius.lg,
    padding: spacing.md,
    paddingBottom: Platform.OS === 'ios' ? 40 : spacing.md,
    borderTopWidth: 1,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(150, 150, 150, 0.1)',
  },
  title: {
    ...typography.h3,
    fontSize: 18,
  },
  actions: {
    marginBottom: spacing.md,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  actionIcon: {
    marginRight: spacing.md,
    width: 30,
  },
  actionLabel: {
    ...typography.body,
    fontWeight: '500',
  },
  destructiveActionLabel: {
    color: '#ef4444',
  },
  cancelButton: {
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  cancelText: {
    ...typography.body,
    fontWeight: '600',
  },
});
