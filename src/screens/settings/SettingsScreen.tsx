import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Switch,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { useUserStore } from '../../stores/userStore';
import { getThemeColors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

import { storage } from '../../services/storage';
import * as FileSystem from 'expo-file-system';
import { Ionicons } from '@expo/vector-icons';
import { getAvailableThemes, getThemeDisplayName, themes } from '../../theme/colors';
import { AISettingsModal } from '../../components/ai/AISettingsModal';
import { AIUsageModal } from '../../components/ai/AIUsageModal';
import { useSubscription } from '../../hooks/useSubscription';
import { PaywallModal } from '../../components/subscription/PaywallModal';
import { PremiumBadge } from '../../components/subscription/PremiumBadge';

export function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const theme = useUserStore(state => state.preferences?.theme || 'dark');
  const preferences = useUserStore(state => state.preferences);
  const { setTheme } = useUserStore();
  const { isPremium } = useSubscription();

  const themeColors = getThemeColors(theme);

  const [storagePath, setStoragePath] = useState<string | null>(null);
  const [migrating, setMigrating] = useState(false);
  const [storageMethod, setStorageMethodState] = useState<'cloud' | 'local'>('local');
  const [switching, setSwitching] = useState(false);
  const [showAISettings, setShowAISettings] = useState(false);
  const [showUsageModal, setShowUsageModal] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);

  React.useEffect(() => {
    loadStoragePath();
    loadStorageMethod();
  }, []);

  const loadStoragePath = async () => {
    const path = await storage.getStoragePath();
    setStoragePath(path);
  };

  const loadStorageMethod = async () => {
    const method = await storage.getStorageMethod();
    setStorageMethodState(method);
  };

  const handleSelectStorage = async () => {
    if (Platform.OS !== 'android') {
      Alert.alert(
        'Not Supported',
        'Changing storage location is currently only supported on Android.'
      );
      return;
    }

    try {
      const SAF = (FileSystem as any).StorageAccessFramework;
      const permissions = await SAF.requestDirectoryPermissionsAsync();
      if (permissions.granted) {
        const uri = permissions.directoryUri;

        Alert.alert(
          'Change Storage Location',
          'Do you want to move existing data to the new location?',
          [
            {
              text: 'No, just change location',
              onPress: async () => {
                await storage.setStoragePath(uri);
                setStoragePath(uri);
              },
            },
            {
              text: 'Yes, move data',
              onPress: async () => {
                setMigrating(true);
                const success = await storage.migrateData(uri);
                setMigrating(false);
                if (success) {
                  setStoragePath(uri);
                  Alert.alert('Success', 'Data migrated successfully');
                } else {
                  Alert.alert('Error', 'Failed to migrate data');
                }
              },
            },
          ]
        );
      }
    } catch (error) {
      console.error('Error selecting storage:', error);
    }
  };

  const handleSwitchStorage = async () => {
    const newMethod = storageMethod === 'cloud' ? 'local' : 'cloud';

    // Check if data can be migrated
    const { canMigrate, sizeFormatted } = await storage.canMigrateData();

    if (!canMigrate) {
      Alert.alert(
        'Data Too Large',
        `Your data (${sizeFormatted}) exceeds the 5MB limit for cloud storage. Please reduce your data size or continue using local storage.`
      );
      return;
    }

    const methodName = newMethod === 'cloud' ? 'Cloud Storage' : 'Local Storage';
    Alert.alert('Switch Storage', `Switch to ${methodName}? Your data will be migrated.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Switch',
        onPress: async () => {
          setSwitching(true);
          const success = await storage.switchStorageMethod(newMethod);
          setSwitching(false);
          if (success) {
            setStorageMethodState(newMethod);
            Alert.alert('Success', `Switched to ${methodName}`);
          } else {
            Alert.alert('Error', 'Failed to switch storage method');
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={{ backgroundColor: themeColors.background, paddingTop: insets.top }}
        contentContainerStyle={styles.content}
      >
        <Text style={[styles.title, { color: themeColors.text }]}>Settings</Text>

        {/* Subscription Section */}
        <Card style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Subscription</Text>
            <PremiumBadge />
          </View>

          <View style={styles.subscriptionRow}>
            <View>
              <Text style={[styles.planName, { color: themeColors.text }]}>
                {isPremium ? 'Premium Plan' : 'Free Plan'}
              </Text>
              <Text style={[styles.planDescription, { color: themeColors.textSecondary }]}>
                {isPremium
                  ? 'You have access to all premium features.'
                  : 'Upgrade to unlock unlimited AI and more storage.'}
              </Text>
            </View>

            {!isPremium && (
              <TouchableOpacity
                style={[styles.upgradeButton, { backgroundColor: themeColors.primary }]}
                onPress={() => setShowPaywall(true)}
              >
                <Text style={[styles.upgradeText, { color: themeColors.onPrimary }]}>Upgrade</Text>
              </TouchableOpacity>
            )}

            {isPremium && (
              <TouchableOpacity onPress={() => setShowPaywall(true)}>
                <Text style={[styles.manageText, { color: themeColors.primary }]}>Manage</Text>
              </TouchableOpacity>
            )}
          </View>
        </Card>

        {/* Appearance & Themes Section */}
        <Card style={styles.section}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
            Appearance & Themes
          </Text>

          {/* Theme Grid */}
          <View style={styles.themeGrid}>
            {/* Light and Dark themes first */}
            {(['light', 'dark'] as const).map(themeName => {
              const themePreview = themes[themeName];
              const isSelected = theme === themeName;
              return (
                <TouchableOpacity
                  key={themeName}
                  style={[
                    styles.themeCard,
                    {
                      backgroundColor: themePreview.surface,
                      borderColor: isSelected ? themePreview.primary : themePreview.border,
                    },
                    isSelected && styles.themeCardSelected,
                  ]}
                  onPress={() => setTheme(themeName)}
                >
                  <View style={styles.themePreview}>
                    <View
                      style={[styles.themeColorDot, { backgroundColor: themePreview.primary }]}
                    />
                    <View
                      style={[styles.themeColorDot, { backgroundColor: themePreview.secondary }]}
                    />
                    <View
                      style={[styles.themeColorDot, { backgroundColor: themePreview.secondary }]}
                    />
                  </View>
                  <Text style={[styles.themeName, { color: themePreview.text }]}>
                    {getThemeDisplayName(themeName)}
                  </Text>
                  {isSelected && (
                    <View style={[styles.selectedBadge, { backgroundColor: themePreview.primary }]}>
                      <Ionicons name="checkmark" size={16} color={themePreview.onPrimary} />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Separator after Light/Dark */}
          <View style={[styles.separator, { backgroundColor: themeColors.border }]} />

          {/* Other Color Themes */}
          <Text style={[styles.subsectionTitle, { color: themeColors.text }]}>Color Themes</Text>
          <View style={styles.themeGrid}>
            {getAvailableThemes()
              .filter(t => t !== 'light' && t !== 'dark')
              .map(themeName => {
                const themePreview = themes[themeName];
                const isSelected = theme === themeName;
                return (
                  <TouchableOpacity
                    key={themeName}
                    style={[
                      styles.themeCard,
                      {
                        backgroundColor: themePreview.surface,
                        borderColor: isSelected ? themePreview.primary : themePreview.border,
                      },
                      isSelected && styles.themeCardSelected,
                    ]}
                    onPress={() => setTheme(themeName)}
                  >
                    <View style={styles.themePreview}>
                      <View
                        style={[styles.themeColorDot, { backgroundColor: themePreview.primary }]}
                      />
                      <View
                        style={[styles.themeColorDot, { backgroundColor: themePreview.secondary }]}
                      />
                      <View
                        style={[styles.themeColorDot, { backgroundColor: themePreview.secondary }]}
                      />
                    </View>
                    <Text style={[styles.themeName, { color: themePreview.text }]}>
                      {getThemeDisplayName(themeName)}
                    </Text>
                    {isSelected && (
                      <View
                        style={[styles.selectedBadge, { backgroundColor: themePreview.primary }]}
                      >
                        <Ionicons name="checkmark" size={16} color={themePreview.onPrimary} />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
          </View>
          <View
            style={[
              styles.comingSoonBanner,
              { backgroundColor: themeColors.surface, borderColor: themeColors.border },
            ]}
          >
            <Ionicons name="sparkles" size={16} color={themeColors.textSecondary} />
            <Text style={[styles.comingSoonText, { color: themeColors.textSecondary }]}>
              Custom themes coming soon
            </Text>
          </View>
        </Card>

        {/* AI Features Section */}
        <Card style={styles.section}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>AI Features</Text>

          {/* Usage Statistics */}
          <View style={styles.statsContainer}>
            <View style={styles.statRow}>
              <Text style={[styles.statLabel, { color: themeColors.textSecondary }]}>
                Total Requests:
              </Text>
              <Text style={[styles.statValue, { color: themeColors.text }]}>
                {preferences?.ai?.requestCount || 0}
              </Text>
            </View>
            <View style={styles.statRow}>
              <Text style={[styles.statLabel, { color: themeColors.textSecondary }]}>
                Tokens Used:
              </Text>
              <Text style={[styles.statValue, { color: themeColors.text }]}>
                {preferences?.ai?.totalTokensUsed?.toLocaleString() || 0}
              </Text>
            </View>
            {preferences?.ai?.lastUsed && (
              <View style={styles.statRow}>
                <Text style={[styles.statLabel, { color: themeColors.textSecondary }]}>
                  Last Used:
                </Text>
                <Text style={[styles.statValue, { color: themeColors.text }]}>
                  {new Date(preferences.ai.lastUsed).toLocaleDateString()}
                </Text>
              </View>
            )}
          </View>

          {/* Action Buttons */}
          <View style={styles.aiButtonsRow}>
            <TouchableOpacity
              style={[styles.aiButton, { backgroundColor: themeColors.primary }]}
              onPress={() => setShowAISettings(true)}
            >
              <Ionicons name="settings" size={18} color={themeColors.onPrimary} />
              <Text style={[styles.aiButtonText, { color: themeColors.onPrimary }]}>
                AI Settings
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.aiButton,
                styles.aiButtonSecondary,
                { borderColor: themeColors.border },
              ]}
              onPress={() => setShowUsageModal(true)}
            >
              <Ionicons name="stats-chart" size={18} color={themeColors.text} />
              <Text style={[styles.aiButtonText, { color: themeColors.text }]}>
                View Statistics
              </Text>
            </TouchableOpacity>
          </View>
        </Card>

        {/* Storage Method Section */}
        <Card style={styles.section}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Storage Method</Text>
          <View style={styles.row}>
            <View style={styles.storageInfo}>
              <Ionicons
                name={storageMethod === 'cloud' ? 'cloud' : 'phone-portrait'}
                size={24}
                color={themeColors.textSecondary}
              />
              <View style={styles.storageTextContainer}>
                <Text style={[styles.label, { color: themeColors.text }]}>
                  {storageMethod === 'cloud' ? 'Cloud Storage' : 'Local Storage'}
                </Text>
                <Text style={[styles.bodyText, { color: themeColors.textSecondary }]}>
                  {storageMethod === 'cloud'
                    ? 'Data synced to our database'
                    : 'Data stored on device'}
                </Text>
              </View>
            </View>
          </View>
          {switching ? (
            <View style={styles.row}>
              <Text style={{ color: themeColors.text }}>Switching...</Text>
              <ActivityIndicator color={themeColors.primary} />
            </View>
          ) : (
            <Button
              title={`Switch to ${storageMethod === 'cloud' ? 'Local' : 'Cloud'} Storage`}
              onPress={handleSwitchStorage}
              variant="secondary"
              style={styles.swichButton}
            />
          )}

          <View style={[styles.divider, { backgroundColor: themeColors.border }]} />

          <Text style={[styles.label, { color: themeColors.On, marginBottom: spacing.sm }]}>
            Delete Behavior
          </Text>
          <View style={styles.row}>
            <Text style={[styles.bodyText, { color: themeColors.textSecondary }, styles.flex1]}>
              {preferences?.storage?.deleteMode === 'hard'
                ? 'Permanently delete items'
                : 'Archive items (Soft Delete)'}
            </Text>
            <Switch
              value={preferences?.storage?.deleteMode !== 'hard'}
              onValueChange={value =>
                useUserStore.getState().updatePreferences({
                  storage: { ...preferences?.storage, deleteMode: value ? 'soft' : 'hard' },
                })
              }
              trackColor={{ false: themeColors.border, true: themeColors.textSecondary }}
              thumbColor={themeColors.primary}
            />
          </View>
        </Card>

        {/* Data Storage Location (only for local) */}
        {storageMethod === 'local' && (
          <Card style={styles.section}>
            <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Storage Location</Text>
            <Text style={[styles.bodyText, { color: themeColors.textSecondary }]}>
              Current Location:
            </Text>
            <Text style={[styles.pathText, styles.pathTextMargin, { color: themeColors.text }]}>
              {storagePath ? decodeURIComponent(storagePath) : 'Internal App Storage'}
            </Text>

            {migrating ? (
              <View style={styles.migratingContainer}>
                <ActivityIndicator color={themeColors.primary} />
                <Text style={[styles.migratingText, { color: themeColors.text }]}>
                  Moving data...
                </Text>
              </View>
            ) : (
              <Button
                title="Change Location"
                onPress={handleSelectStorage}
                variant="outline"
                style={{ marginTop: spacing.md }}
              />
            )}
          </Card>
        )}

        {/* About Section */}
        <Card style={styles.section}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>About</Text>
          <Text style={[styles.bodyText, { color: themeColors.textSecondary }]}>Version 1.0.0</Text>
          <Text
            style={[styles.bodyText, { color: themeColors.textSecondary, marginTop: spacing.xs }]}
          >
            Made with ❤️ by Bluejutzu
          </Text>
        </Card>
      </ScrollView>

      {/* Modals */}
      <AISettingsModal visible={showAISettings} onClose={() => setShowAISettings(false)} />
      <AIUsageModal visible={showUsageModal} onClose={() => setShowUsageModal(false)} />
      <PaywallModal visible={showPaywall} onClose={() => setShowPaywall(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: spacing.md,
    paddingBottom: 100,
  },
  title: {
    ...typography.h1,
    marginBottom: spacing.lg,
  },
  section: {
    marginBottom: spacing.lg,
    padding: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.h3,
    marginBottom: spacing.md,
  },
  subsectionTitle: {
    ...typography.h3,
    fontSize: 16,
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
  },
  subscriptionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.md,
  },
  planName: {
    ...typography.h3,
    marginBottom: 4,
  },
  planDescription: {
    ...typography.caption,
    maxWidth: 200,
  },
  upgradeButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 16,
  },
  upgradeText: {
    ...typography.bodySmall,
    fontWeight: '600',
  },
  manageText: {
    ...typography.bodySmall,
    fontWeight: '600',
  },
  themeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  themeCard: {
    width: '47%',
    padding: 12,
    borderRadius: 12,
    borderWidth: 2,
    position: 'relative',
  },
  themeCardSelected: {
    borderWidth: 2,
  },
  themePreview: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 8,
  },
  themeColorDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  themeName: {
    ...typography.bodySmall,
    fontWeight: '600',
  },
  selectedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  comingSoonBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: spacing.md,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  comingSoonText: {
    ...typography.bodySmall,
    fontSize: 13,
  },
  divider: {
    height: 1,
    marginVertical: spacing.md,
  },
  flex1: {
    flex: 1,
  },
  swichButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  separator: {
    height: 1,
    marginVertical: spacing.md,
  },
  statsContainer: {
    marginBottom: spacing.md,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  statLabel: {
    ...typography.bodySmall,
  },
  statValue: {
    ...typography.body,
    fontWeight: '600',
  },
  aiButtonsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  aiButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 8,
  },
  aiButtonSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
  },
  aiButtonText: {
    ...typography.bodySmall,
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  storageInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  storageTextContainer: {
    flex: 1,
  },
  label: {
    ...typography.bodySmall,
    fontWeight: '600',
  },
  bodyText: {
    ...typography.bodySmall,
    marginBottom: spacing.xs,
  },
  pathText: {
    ...typography.caption,
  },
  pathTextMargin: {
    marginBottom: 12,
  },
  migratingContainer: {
    marginTop: spacing.md,
  },
  migratingText: {
    color: '#666', // Will be overridden by theme color in render
    textAlign: 'center',
    marginTop: spacing.sm,
  },
});
