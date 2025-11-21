import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Switch } from 'react-native';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { useUserStore } from '../../stores/userStore';
import { getThemeColors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

export function SettingsScreen() {
  const theme = useUserStore(state => state.preferences?.theme || 'dark');
  const preferences = useUserStore(state => state.preferences);
  const { setTheme, setAIEnabled, setApiKey, updatePreferences } = useUserStore();

  const themeColors = getThemeColors(theme);

  const [apiKey, setApiKeyLocal] = useState(preferences?.ai?.openRouterKey || '');
  const [name, setName] = useState(preferences?.name || '');

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
});
