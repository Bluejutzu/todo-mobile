/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Switch } from 'react-native';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { useUserStore } from '../../stores/userStore';
import { getThemeColors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

import { storage } from '../../services/storage';
import * as FileSystem from 'expo-file-system';
import { Platform, Alert, ActivityIndicator } from 'react-native';
import { useUser } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { MainTabParamList } from '../../types/navigation';

export function SettingsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<MainTabParamList>>();
  const { user } = useUser();
  const theme = useUserStore(state => state.preferences?.theme || 'dark');
  const preferences = useUserStore(state => state.preferences);
  const { setTheme, setAIEnabled, setApiKey, updatePreferences } = useUserStore();

  const themeColors = getThemeColors(theme);

  const [apiKey, setApiKeyLocal] = useState(preferences?.ai?.openRouterKey || '');
  const [name, setName] = useState(preferences?.name || '');
  const [storagePath, setStoragePath] = useState<string | null>(null);
  const [migrating, setMigrating] = useState(false);
  const [showExportReminder, setShowExportReminder] = useState(false);
  const [lastExportDate, setLastExportDate] = useState<Date | null>(null);
  const [exporting, setExporting] = useState(false);
  const [storageMethod, setStorageMethodState] = useState<'cloud' | 'local'>('cloud');
  const [switching, setSwitching] = useState(false);

  React.useEffect(() => {
    loadStoragePath();
    checkExportReminder();
    loadStorageMethod();
  }, []);

  const loadStoragePath = async () => {
    const path = await storage.getStoragePath();
    setStoragePath(path);
  };

  const checkExportReminder = async () => {
    const shouldRemind = await storage.shouldShowExportReminder();
    setShowExportReminder(shouldRemind);
    const lastExport = await storage.getLastExportDate();
    setLastExportDate(lastExport);
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

  const handleManageAccount = async () => {
    // Navigate to custom account management screen
    (navigation as any).navigate('AccountManagement');
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

  const handleExportData = async () => {
    setExporting(true);
    try {
      if (Platform.OS === 'android') {
        Alert.alert('Export Data', 'Choose export method:', [
          {
            text: 'Share File',
            onPress: async () => {
              const success = await storage.exportData();
              if (success) {
                Alert.alert('Success', 'Data exported successfully');
                await checkExportReminder();
              } else {
                Alert.alert('Error', 'Failed to export data');
              }
              setExporting(false);
            },
          },
          {
            text: 'Save to Folder',
            onPress: async () => {
              try {
                const SAF = (FileSystem as any).StorageAccessFramework;
                const permissions = await SAF.requestDirectoryPermissionsAsync();
                if (permissions.granted) {
                  const success = await storage.exportData(permissions.directoryUri);
                  if (success) {
                    Alert.alert('Success', 'Data exported to selected folder');
                    await checkExportReminder();
                  } else {
                    Alert.alert('Error', 'Failed to export data');
                  }
                }
              } catch (error) {
                console.error('Export error:', error);
                Alert.alert('Error', 'Failed to export data');
              }
              setExporting(false);
            },
          },
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => setExporting(false),
          },
        ]);
      } else {
        const success = await storage.exportData();
        if (success) {
          Alert.alert('Success', 'Data exported successfully');
          await checkExportReminder();
        } else {
          Alert.alert('Error', 'Failed to export data');
        }
        setExporting(false);
      }
    } catch (error) {
      console.error('Export error:', error);
      Alert.alert('Error', 'Failed to export data');
      setExporting(false);
    }
  };

  const handleSaveProfile = async () => {
    await updatePreferences({ name });
  };

  const handleSaveApiKey = async () => {
    await setApiKey(apiKey);
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: themeColors.background }]}
      contentContainerStyle={styles.content}
    >
      <Text style={[styles.title, { color: themeColors.text }]}>Settings</Text>

      {/* Profile Section */}
      <Card style={styles.section}>
        <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Profile</Text>
        <Input label="Name" value={name} onChangeText={setName} placeholder="Enter your name" />
        <Button title="Save Profile" onPress={handleSaveProfile} variant="primary" />
      </Card>

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

      {/* Account Management Section */}
      <Card style={styles.section}>
        <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Account</Text>
        {user && (
          <>
            <View style={styles.row}>
              <Ionicons name="person-circle" size={24} color={themeColors.textSecondary} />
              <View style={styles.userInfo}>
                <Text style={[styles.label, { color: themeColors.text }]}>
                  {user.fullName || user.primaryEmailAddress?.emailAddress || 'User'}
                </Text>
                <Text
                  style={[styles.bodyText, styles.emailText, { color: themeColors.textSecondary }]}
                >
                  {user.primaryEmailAddress?.emailAddress}
                </Text>
              </View>
            </View>
            <Button title="Manage Account" onPress={handleManageAccount} variant="secondary" />
          </>
        )}
      </Card>

      {/* Data Export Section */}
      <Card style={styles.section}>
        <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Data Export</Text>
        {showExportReminder && (
          <View
            style={[
              styles.reminderBanner,
              { backgroundColor: themeColors.primary + '20', borderColor: themeColors.primary },
            ]}
          >
            <Ionicons name="warning" size={20} color={themeColors.primary} />
            <Text style={[styles.reminderText, { color: themeColors.primary }]}>
              It&apos;s been 30+ days since your last export
            </Text>
          </View>
        )}
        {lastExportDate && (
          <Text
            style={[styles.bodyText, styles.lastExportText, { color: themeColors.textSecondary }]}
          >
            Last exported: {lastExportDate.toLocaleDateString()}
          </Text>
        )}
        {exporting ? (
          <View style={styles.row}>
            <Text style={{ color: themeColors.text }}>Exporting...</Text>
            <ActivityIndicator color={themeColors.primary} />
          </View>
        ) : (
          <Button title="Export Data" onPress={handleExportData} variant="primary" />
        )}
      </Card>

      {/* About Section */}
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
  reminderBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 12,
    gap: 8,
  },
  reminderText: {
    flex: 1,
    fontSize: 14,
  },
  userInfo: {
    marginLeft: 12,
    flex: 1,
  },
  emailText: {
    fontSize: 12,
  },
  lastExportText: {
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
});
