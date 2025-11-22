import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUserStore } from '../../stores/userStore';
import { getThemeColors } from '../../theme/colors';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { OnboardingStackParamList } from './OnboardingNavigator';

type NavigationProp = NativeStackNavigationProp<OnboardingStackParamList, 'Preferences'>;

export function PreferencesScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { preferences, updatePreferences } = useUserStore();
  const theme = preferences?.theme || 'dark';
  const colors = getThemeColors(theme);

  const toggleTheme = () => {
    updatePreferences({
      theme: theme === 'dark' ? 'light' : 'dark',
    });
  };

  const toggleNotifications = () => {
    updatePreferences({
      notificationsEnabled: !preferences?.notificationsEnabled,
    });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Preferences</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Customize your experience
          </Text>
        </View>

        <View style={styles.optionsContainer}>
          <View
            style={[styles.option, { backgroundColor: colors.surface, borderColor: colors.border }]}
          >
            <View style={styles.optionTextContainer}>
              <Text style={[styles.optionTitle, { color: colors.text }]}>Dark Mode</Text>
              <Text style={[styles.optionDescription, { color: colors.textSecondary }]}>
                Easier on the eyes
              </Text>
            </View>
            <Switch
              value={theme === 'dark'}
              onValueChange={toggleTheme}
              trackColor={{ false: '#767577', true: colors.primary }}
              thumbColor={theme === 'dark' ? '#FFFFFF' : '#f4f3f4'}
            />
          </View>

          <View
            style={[styles.option, { backgroundColor: colors.surface, borderColor: colors.border }]}
          >
            <View style={styles.optionTextContainer}>
              <Text style={[styles.optionTitle, { color: colors.text }]}>Notifications</Text>
              <Text style={[styles.optionDescription, { color: colors.textSecondary }]}>
                Stay updated with tasks
              </Text>
            </View>
            <Switch
              value={preferences?.notificationsEnabled ?? false}
              onValueChange={toggleNotifications}
              trackColor={{ false: '#767577', true: colors.primary }}
              thumbColor={preferences?.notificationsEnabled ? '#FFFFFF' : '#f4f3f4'}
            />
          </View>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.primary }]}
            onPress={() => navigation.navigate('StorageSelection')}
          >
            <Text style={styles.buttonText}>Continue</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 24,
  },
  header: {
    marginBottom: 40,
    marginTop: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 18,
  },
  optionsContainer: {
    gap: 16,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
  },
  optionTextContainer: {
    flex: 1,
    marginRight: 16,
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 14,
  },
  footer: {
    marginTop: 'auto',
  },
  button: {
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
});
