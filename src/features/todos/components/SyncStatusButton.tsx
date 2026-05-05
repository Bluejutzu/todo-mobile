import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { SyncStatus } from '../../../services/storage/syncStatus';
import { spacing } from '../../../theme/spacing';
import type { Colors } from '../../../theme/colors';

interface SyncStatusButtonProps {
  syncStatus: SyncStatus;
  lastSyncTime: Date | null;
  pendingCount: number;
  colors: Colors;
}

function getSyncIcon(syncStatus: SyncStatus): keyof typeof Ionicons.glyphMap {
  const map = {
    synced: 'cloud-done-outline',
    syncing: 'sync-outline',
    offline: 'cloud-offline-outline',
    error: 'alert-circle-outline',
  } as const;
  return map[syncStatus];
}

function getSyncColor(syncStatus: SyncStatus, colors: Colors) {
  const map = {
    synced: colors.success,
    syncing: colors.primary,
    offline: colors.textSecondary,
    error: colors.error,
  };
  return map[syncStatus];
}

export function SyncStatusButton({
  syncStatus,
  lastSyncTime,
  pendingCount,
  colors,
}: SyncStatusButtonProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const icon = getSyncIcon(syncStatus);
  const iconColor = getSyncColor(syncStatus, colors);

  return (
    <>
      <TouchableOpacity onPress={() => setShowTooltip(true)} style={styles.iconBtn}>
        <Ionicons name={icon} size={22} color={iconColor} />
      </TouchableOpacity>

      <Modal
        transparent
        visible={showTooltip}
        animationType="fade"
        onRequestClose={() => setShowTooltip(false)}
      >
        <Pressable style={styles.overlay} onPress={() => setShowTooltip(false)}>
          <View
            style={[
              styles.tooltip,
              { backgroundColor: colors.surfaceElevated, borderColor: colors.border },
            ]}
          >
            <View style={styles.tooltipRow}>
              <Ionicons name={icon} size={18} color={iconColor} />
              <Text style={[styles.tooltipLabel, { color: colors.text }]}>
                {syncStatus.charAt(0).toUpperCase() + syncStatus.slice(1)}
              </Text>
            </View>
            {pendingCount > 0 && (
              <Text style={[styles.tooltipMeta, { color: colors.textSecondary }]}>
                {pendingCount} pending
              </Text>
            )}
            <Text style={[styles.tooltipMeta, { color: colors.textSecondary }]}>
              Last sync: {lastSyncTime ? lastSyncTime.toLocaleTimeString() : 'Never'}
            </Text>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  iconBtn: {
    padding: 6,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tooltip: {
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    minWidth: 180,
    elevation: 4,
  },
  tooltipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  tooltipLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  tooltipMeta: {
    fontSize: 12,
    marginTop: 2,
  },
});
