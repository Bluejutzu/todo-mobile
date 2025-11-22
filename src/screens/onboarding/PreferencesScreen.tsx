import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUserStore } from '../../stores/userStore';
import {
  getThemeColors,
  getAvailableThemes,
  getThemeDisplayName,
  ThemeName,
} from '../../theme/colors';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { OnboardingStackParamList } from './OnboardingNavigator';

type NavigationProp = NativeStackNavigationProp<OnboardingStackParamList, 'Preferences'>;

export function PreferencesScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { preferences, updatePreferences } = useUserStore();
  const theme = preferences?.theme || 'dark';
  const colors = getThemeColors(theme);

  const availableThemes = getAvailableThemes();
  const otherThemes = availableThemes.filter(t => t !== 'light' && t !== 'dark');

  const handleThemeSelect = (newTheme: ThemeName) => {
    updatePreferences({ theme: newTheme });
  };

  const toggleNotifications = () => {
    updatePreferences({
      notificationsEnabled: !preferences?.notificationsEnabled,
    });
  };

  const ThemeOption = ({ item, isSelected }: { item: ThemeName; isSelected: boolean }) => {
    const itemColors = getThemeColors(item);
    return (
      <TouchableOpacity
        style={[
          styles.themeOption,
          {
            backgroundColor: itemColors.surface,
            borderColor: isSelected ? colors.primary : itemColors.border,
            borderWidth: isSelected ? 2 : 1,
          },
        ]}
        onPress={() => handleThemeSelect(item)}
      >
        <View style={[styles.themePreview, { backgroundColor: itemColors.primary }]} />
        <Text style={[styles.themeName, { color: itemColors.text }]}>
          {getThemeDisplayName(item)}
        </Text>
      </TouchableOpacity>
    );
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

        <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Appearance</Text>

            <View style={styles.mainThemes}>
              <ThemeOption item="light" isSelected={theme === 'light'} />
              <ThemeOption item="dark" isSelected={theme === 'dark'} />
            </View>

            <Text style={[styles.subSectionTitle, { color: colors.textSecondary }]}>
              More Themes
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.otherThemes}
            >
              {otherThemes.map(t => (
                <ThemeOption key={t} item={t} isSelected={theme === t} />
              ))}
            </ScrollView>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Settings</Text>
            <View
              style={[
                styles.option,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
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
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.primary }]}
            onPress={() => navigation.navigate('StorageSelection')}
          >
            <Text style={[styles.buttonText, { color: colors.onPrimary }]}>Continue</Text>
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
  scrollContent: {
    flex: 1,
  },
  header: {
    marginBottom: 32,
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
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  subSectionTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 16,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  mainThemes: {
    flexDirection: 'row',
    gap: 16,
  },
  otherThemes: {
    flexDirection: 'row',
    marginHorizontal: -4, // Compensate for padding in items if needed, or just let it scroll
  },
  themeOption: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 100,
    marginRight: 12,
  },
  themePreview: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginBottom: 8,
  },
  themeName: {
    fontSize: 14,
    fontWeight: '500',
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
    marginTop: 16,
  },
  button: {
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '600',
  },
});
