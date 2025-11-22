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
import { Input } from '../../components/common/Input';
import { useUserStore } from '../../stores/userStore';
import { getThemeColors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

import { storage } from '../../services/storage';
import * as FileSystem from 'expo-file-system';
import { Ionicons } from '@expo/vector-icons';
import { getAvailableThemes, getThemeDisplayName, themes } from '../../theme/colors';

export function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const theme = useUserStore(state => state.preferences?.theme || 'dark');
  const preferences = useUserStore(state => state.preferences);
  const { setTheme, setAIEnabled, setApiKey } = useUserStore();

  const themeColors = getThemeColors(theme);

  const [apiKey, setApiKeyLocal] = useState(preferences?.ai?.openRouterKey || '');
  const [storagePath, setStoragePath] = useState<string | null>(null);
  const [migrating, setMigrating] = useState(false);
  const [storageMethod, setStorageMethodState] = useState<'cloud' | 'local'>('local');
  const [switching, setSwitching] = useState(false);

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
        `Your data (${sizeFormatted}) is too large to migrate automatically. Please export your data first, then switch storage methods.`,
        [{ text: 'OK' }]
      );
      return;
    }

    const methodName = newMethod === 'cloud' ? 'Cloud Storage' : 'Local Storage';
    Alert.alert(
      'Switch Storage',
      `Switch to ${methodName}? Your current data (${sizeFormatted}) will be migrated.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Switch',
          onPress: async () => {
            setSwitching(true);
            try {
              await storage.setStorageMethod(newMethod);
              setStorageMethodState(newMethod);
              Alert.alert('Success', `Switched to ${methodName}`);
            } catch {
              Alert.alert('Error', 'Failed to switch storage method');
            } finally {
              setSwitching(false);
            }
          },
        },
      ]
    );
  };

  const handleSaveApiKey = async () => {
    await setApiKey(apiKey);
  };

  return (
    <ScrollView
      style={[
        styles.container,
        { backgroundColor: themeColors.background, paddingTop: insets.top },
      ]}
      contentContainerStyle={styles.content}
    >
      <Text style={[styles.title, { color: themeColors.text }]}>Settings</Text>

      {/* Appearance Section */}
      <Card style={styles.section}>
        <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Appearance</Text>
        <View style={styles.row}>
          <Text style={[styles.label, { color: themeColors.text }]}>Dark Mode</Text>
          <Switch
            value={theme === 'dark'}
            onValueChange={value => setTheme(value ? 'dark' : 'light')}
            trackColor={{ false: themeColors.border, true: themeColors.primary }}
            thumbColor="#ffffff"
          />
        </View>
      </Card>

      {/* Theme Selector */}
      <Card style={styles.section}>
        <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Theme</Text>
        <View style={styles.themeGrid}>
          {getAvailableThemes().map(themeName => {
            const themePreview = themes[themeName];
            const isSelected = theme === themeName;
            return (
              <TouchableOpacity
                key={themeName}
                style={[
                  styles.themeCard,
                  {
                    backgroundColor: themeColors.surface,
                    borderColor: isSelected ? themeColors.primary : themeColors.border,
                  },
                  isSelected && styles.themeCardSelected,
                ]}
                onPress={() => setTheme(themeName)}
              >
                <View style={styles.themePreview}>
                  <View style={[styles.themeColorBox, { backgroundColor: themePreview.primary }]} />
                  <View
                    style={[styles.themeColorBox, { backgroundColor: themePreview.secondary }]}
                  />
                  <View
                    style={[styles.themeColorBox, { backgroundColor: themePreview.background }]}
                  />
                </View>
                <Text style={[styles.themeName, { color: themeColors.text }]}>
                  {getThemeDisplayName(themeName)}
                </Text>
                {isSelected && (
                  <View style={[styles.themeCheckmark, { backgroundColor: themeColors.primary }]}>
                    <Ionicons name="checkmark" size={16} color="#FFFFFF" />
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
        <View style={styles.row}>
          <Text style={[styles.label, { color: themeColors.text }]}>Enable AI</Text>
          <Switch
            value={preferences?.ai?.enabled || false}
            onValueChange={setAIEnabled}
            trackColor={{ false: themeColors.border, true: themeColors.primary }}
            thumbColor="#ffffff"
          />
        </View>

        {preferences?.ai?.enabled && (
          <>
            <Input
              label="OpenRouter API Key"
              value={apiKey}
              onChangeText={setApiKeyLocal}
              placeholder="sk-or-..."
              secureTextEntry={true}
            />
            <Button title="Save API Key" onPress={handleSaveApiKey} variant="secondary" />
          </>
        )}
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
          />
        )}
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
            <View style={styles.row}>
              <Text style={{ color: themeColors.text }}>Moving files...</Text>
              <ActivityIndicator color={themeColors.primary} />
            </View>
          ) : (
            <Button title="Change Location" onPress={handleSelectStorage} variant="secondary" />
          )}
        </Card>
      )}

      <Card style={styles.section}>
        <Text style={[styles.sectionTitle, { color: themeColors.text }]}>About</Text>
        <Text style={[styles.bodyText, { color: themeColors.textSecondary }]}>
          AI Todo App v1.0.0
        </Text>
        <Text style={[styles.bodyText, { color: themeColors.textSecondary }]}>
          Built with React Native & Expo
        </Text>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: spacing.md,
    paddingTop: spacing.xl,
  },
  title: {
    ...typography.h1,
    marginBottom: spacing.lg,
  },
  section: {
    marginBottom: spacing.md,
    padding: spacing.lg,
  },
  sectionTitle: {
    ...typography.h3,
    marginBottom: spacing.md,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  label: {
    ...typography.body,
    fontWeight: '600',
  },
  bodyText: {
    ...typography.bodySmall,
    marginBottom: spacing.xs,
  },
  pathText: {
    ...typography.bodySmall,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  pathTextMargin: {
    marginBottom: 12,
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
  themeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
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
    gap: 4,
    marginBottom: 8,
  },
  themeColorBox: {
    flex: 1,
    height: 24,
    borderRadius: 4,
  },
  themeName: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  themeCheckmark: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  comingSoonBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
  },
  comingSoonText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
});
