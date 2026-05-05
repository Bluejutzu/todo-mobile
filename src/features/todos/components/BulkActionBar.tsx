import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';

interface BulkActionBarProps {
  colors: Colors;
  visible: boolean;
  onComplete: () => void;
  onIncomplete: () => void;
  onHighPriority: () => void;
  onDelete: () => void;
}

export function BulkActionBar({
  colors,
  visible,
  onComplete,
  onIncomplete,
  onHighPriority,
  onDelete,
}: BulkActionBarProps) {
  if (!visible) return null;

  return (
    <View
      style={[
        styles.bulkBar,
        { backgroundColor: colors.surfaceElevated, borderTopColor: colors.border },
      ]}
    >
      <TouchableOpacity style={styles.bulkAction} onPress={onComplete}>
        <Ionicons name="checkmark-circle-outline" size={22} color={colors.success} />
        <Text style={[styles.bulkText, { color: colors.text }]}>Done</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.bulkAction} onPress={onIncomplete}>
        <Ionicons name="close-circle-outline" size={22} color={colors.textSecondary} />
        <Text style={[styles.bulkText, { color: colors.text }]}>Undo</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.bulkAction} onPress={onHighPriority}>
        <Ionicons name="flag-outline" size={22} color="#ef4444" />
        <Text style={[styles.bulkText, { color: colors.text }]}>High</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.bulkAction} onPress={onDelete}>
        <Ionicons name="trash-outline" size={22} color={colors.error} />
        <Text style={[styles.bulkText, { color: colors.text }]}>Delete</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  bulkBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: spacing.md,
    borderTopWidth: 0.5,
  },
  bulkAction: {
    alignItems: 'center',
    gap: 2,
  },
  bulkText: {
    fontSize: 11,
  },
});
