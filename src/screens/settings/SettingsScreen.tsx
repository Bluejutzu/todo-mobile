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
import { getThemeColors, getAvailableThemes, getThemeDisplayName, themes, ThemeName } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { storage } from '../../services/storage';
import * as FileSystem from 'expo-file-system';
import { Ionicons } from '@expo/vector-icons';
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
  const colors = getThemeColors(theme);

  const [storagePath, setStoragePath] = useState<string | null>(null);
  const [migrating, setMigrating] = useState(false);
  const [storageMethod, setStorageMethodState] = useState<'cloud' | 'local'>('local');
  const [switching, setSwitching] = useState(false);
  const [showAISettings, setShowAISettings] = useState(false);
  const [showUsageModal, setShowUsageModal] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);

  React.useEffect(() => {
    (async () => {
      setStoragePath(await storage.getStoragePath());
      setStorageMethodState(await storage.getStorageMethod());
    })();
  }, []);

  const handleSelectStorage = async () => {
    if (Platform.OS !== 'android') {
      Alert.alert('Not Supported', 'Changing storage location is currently only supported on Android.');
      return;
    }
    try {
      const SAF = (FileSystem as any).StorageAccessFramework;
      const permissions = await SAF.requestDirectoryPermissionsAsync();
      if (permissions.granted) {
        const uri = permissions.directoryUri;
        Alert.alert('Change Storage Location', 'Move existing data to the new location?', [
          {
            text: 'Just change location',
            onPress: async () => {
              await storage.setStoragePath(uri);
              setStoragePath(uri);
            },
          },
          {
            text: 'Move data',
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
        ]);
      }
    } catch (error) {
      console.error('Error selecting storage:', error);
    }
  };

  const handleSwitchStorage = async () => {
    const newMethod = storageMethod === 'cloud' ? 'local' : 'cloud';
    const { canMigrate, sizeFormatted } = await storage.canMigrateData();

    if (!canMigrate) {
      Alert.alert('Data Too Large', `Your data (${sizeFormatted}) exceeds the limit for cloud storage.`);
      return;
    }

    const label = newMethod === 'cloud' ? 'Cloud Storage' : 'Local Storage';
    Alert.alert('Switch Storage', `Switch to ${label}? Your data will be migrated.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Switch',
        onPress: async () => {
          setSwitching(true);
          const success = await storage.switchStorageMethod(newMethod);
          setSwitching(false);
          if (success) {
            setStorageMethodState(newMethod);
            Alert.alert('Success', `Switched to ${label}`);
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
        style={{ backgroundColor: colors.background, paddingTop: insets.top }}
        contentContainerStyle={styles.content}
      >
        <Text style={[styles.title, { color: colors.text }]}>Settings</Text>

        <Card style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Subscription</Text>
            <PremiumBadge />
          </View>
          <View style={styles.row}>
            <View style={styles.flex1}>
              <Text style={[styles.label, { color: colors.text }]}>
                {isPremium ? 'Premium Plan' : 'Free Plan'}
              </Text>
              <Text style={[styles.caption, { color: colors.textSecondary }]}>
                {isPremium ? 'All premium features unlocked.' : 'Upgrade for unlimited AI and more.'}
              </Text>
            </View>
            <Button
              title={isPremium ? 'Manage' : 'Upgrade'}
              onPress={() => setShowPaywall(true)}
              variant={isPremium ? 'ghost' : 'primary'}
              size="sm"
            />
          </View>
        </Card>

        <Card style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Appearance</Text>
          <View style={styles.themeList}>
            {getAvailableThemes().map(t => {
              const preview = themes[t];
              const selected = theme === t;
              return (
                <TouchableOpacity
                  key={t}
                  style={[
                    styles.themeRow,
                    {
                      backgroundColor: selected ? colors.primary + '10' : 'transparent',
                      borderColor: selected ? colors.primary + '30' : colors.border,
                    },
                  ]}
                  onPress={() => setTheme(t)}
                  activeOpacity={0.7}
                >
                  <View style={styles.themeSwatches}>
                    <View style={[styles.swatch, { backgroundColor: preview.background }]} />
                    <View style={[styles.swatch, { backgroundColor: preview.primary }]} />
                    <View style={[styles.swatch, { backgroundColor: preview.surface }]} />
                  </View>
                  <Text style={[styles.themeLabel, { color: colors.text }]}>{getThemeDisplayName(t)}</Text>
                  {selected && <Ionicons name="checkmark-circle" size={20} color={colors.primary} />}
                </TouchableOpacity>
              );
            })}
          </View>
        </Card>

        <Card style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>AI Features</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {preferences?.ai?.requestCount || 0}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Requests</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {preferences?.ai?.totalTokensUsed?.toLocaleString() || 0}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Tokens</Text>
            </View>
          </View>
          <View style={styles.buttonRow}>
            <Button
              title="AI Settings"
              icon="settings-outline"
              onPress={() => setShowAISettings(true)}
              variant="secondary"
              size="sm"
            />
            <Button
              title="Statistics"
              icon="stats-chart-outline"
              onPress={() => setShowUsageModal(true)}
              variant="secondary"
              size="sm"
            />
          </View>
        </Card>

        <Card style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Storage</Text>
          <View style={styles.row}>
            <Ionicons
              name={storageMethod === 'cloud' ? 'cloud-outline' : 'phone-portrait-outline'}
              size={20}
              color={colors.textSecondary}
            />
            <View style={styles.flex1}>
              <Text style={[styles.label, { color: colors.text }]}>
                {storageMethod === 'cloud' ? 'Cloud Storage' : 'Local Storage'}
              </Text>
              <Text style={[styles.caption, { color: colors.textSecondary }]}>
                {storageMethod === 'cloud' ? 'Synced to database' : 'Stored on device'}
              </Text>
            </View>
          </View>
          {switching ? (
            <ActivityIndicator color={colors.primary} style={styles.spinner} />
          ) : (
            <Button
              title={`Switch to ${storageMethod === 'cloud' ? 'Local' : 'Cloud'}`}
              onPress={handleSwitchStorage}
              variant="outline"
              size="sm"
              style={styles.storageButton}
            />
          )}

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={styles.row}>
            <View style={styles.flex1}>
              <Text style={[styles.label, { color: colors.text }]}>Soft Delete</Text>
              <Text style={[styles.caption, { color: colors.textSecondary }]}>
                Archive instead of permanently deleting
              </Text>
            </View>
            <Switch
              value={preferences?.storage?.deleteMode !== 'hard'}
              onValueChange={value =>
                useUserStore.getState().updatePreferences({
                  storage: { ...preferences?.storage, deleteMode: value ? 'soft' : 'hard' },
                })
              }
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#FFFFFF"
            />
          </View>
        </Card>

        {storageMethod === 'local' && (
          <Card style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Storage Location</Text>
            <Text style={[styles.caption, { color: colors.textSecondary }]}>
              {storagePath ? decodeURIComponent(storagePath) : 'Internal App Storage'}
            </Text>
            {migrating ? (
              <ActivityIndicator color={colors.primary} style={styles.spinner} />
            ) : (
              <Button
                title="Change Location"
                onPress={handleSelectStorage}
                variant="outline"
                size="sm"
                style={styles.storageButton}
              />
            )}
          </Card>
        )}

        <Card style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>About</Text>
          <Text style={[styles.caption, { color: colors.textSecondary }]}>Version 1.0.0</Text>
          <Text style={[styles.caption, { color: colors.textSecondary }]}>Made by Bluejutzu</Text>
        </Card>
      </ScrollView>

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
    fontSize: 28,
    fontWeight: '700',
    marginBottom: spacing.lg,
  },
  section: {
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  flex1: {
    flex: 1,
  },
  label: {
    fontSize: 15,
    fontWeight: '500',
  },
  caption: {
    fontSize: 13,
    marginTop: 2,
  },
  themeList: {
    gap: 8,
  },
  themeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  themeSwatches: {
    flexDirection: 'row',
    gap: 4,
  },
  swatch: {
    width: 18,
    height: 18,
    borderRadius: 9,
  },
  themeLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  statItem: {
    flex: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  divider: {
    height: 1,
    marginVertical: spacing.md,
  },
  spinner: {
    marginTop: spacing.sm,
  },
  storageButton: {
    marginTop: spacing.sm,
    alignSelf: 'flex-start',
  },
});
