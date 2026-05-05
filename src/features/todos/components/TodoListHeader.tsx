import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';
import type { SyncStatus } from '../../../services/storage/syncStatus';
import { SyncStatusButton } from './SyncStatusButton';

interface TodoListHeaderProps {
  colors: Colors;
  selectionMode: boolean;
  selectedCount: number;
  activeCount: number;
  completedCount: number;
  groupByCategory: boolean;
  syncStatus: SyncStatus;
  lastSyncTime: Date | null;
  pendingCount: number;
  onToggleSelection: () => void;
  onToggleGrouping: () => void;
}

export function TodoListHeader({
  colors,
  selectionMode,
  selectedCount,
  activeCount,
  completedCount,
  groupByCategory,
  syncStatus,
  lastSyncTime,
  pendingCount,
  onToggleSelection,
  onToggleGrouping,
}: TodoListHeaderProps) {
  return (
    <View style={styles.header}>
      <View style={styles.headerTop}>
        <Text style={[styles.title, { color: colors.text }]}>My Todos</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={onToggleSelection} style={styles.iconBtn}>
            <Ionicons
              name={selectionMode ? 'checkmark-done' : 'checkbox-outline'}
              size={22}
              color={colors.text}
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={onToggleGrouping} style={styles.iconBtn}>
            <Ionicons name={groupByCategory ? 'layers' : 'list'} size={22} color={colors.primary} />
          </TouchableOpacity>
          <SyncStatusButton
            syncStatus={syncStatus}
            lastSyncTime={lastSyncTime}
            pendingCount={pendingCount}
            colors={colors}
          />
        </View>
      </View>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        {selectionMode
          ? `${selectedCount} selected`
          : `${activeCount} active, ${completedCount} completed`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
  },
  iconBtn: {
    padding: 6,
  },
  subtitle: {
    fontSize: 13,
  },
});
