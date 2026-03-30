import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useUserStore } from '../../stores/userStore';
import { getThemeColors, getAvailableThemes, getThemeDisplayName, isDarkTheme, ThemeName, themes } from '../../theme/colors';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { OnboardingStackParamList } from './OnboardingNavigator';

type NavigationProp = NativeStackNavigationProp<OnboardingStackParamList, 'Preferences'>;

export function PreferencesScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { preferences, updatePreferences } = useUserStore();
  const theme = preferences?.theme || 'dark';
  const colors = getThemeColors(theme);

  const handleThemeSelect = (newTheme: ThemeName) => {
    updatePreferences({ theme: newTheme });
  };

  const toggleNotifications = () => {
    updatePreferences({ notificationsEnabled: !preferences?.notificationsEnabled });
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
            <View style={styles.themeList}>
              {getAvailableThemes().map(t => {
                const preview = themes[t];
                const selected = theme === t;
                return (
                  <TouchableOpacity
                    key={t}
                    style={[
                      styles.themeCard,
                      {
                        backgroundColor: preview.surface,
                        borderColor: selected ? colors.primary : preview.border,
                        borderWidth: selected ? 2 : 1,
                      },
                    ]}
                    onPress={() => handleThemeSelect(t)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.themeCardContent}>
                      <View style={styles.themePreviewRow}>
                        <View style={[styles.previewSwatch, { backgroundColor: preview.background }]} />
                        <View style={[styles.previewSwatch, { backgroundColor: preview.primary }]} />
                        <View style={[styles.previewSwatch, { backgroundColor: preview.text }]} />
                      </View>
                      <View style={styles.themeInfo}>
                        <Text style={[styles.themeName, { color: preview.text }]}>
                          {getThemeDisplayName(t)}
                        </Text>
                        <Text style={[styles.themeDesc, { color: preview.textSecondary }]}>
                          {t === 'light' ? 'Warm beige palette' : t === 'dark' ? 'Easy on the eyes' : 'True black'}
                        </Text>
                      </View>
                    </View>
                    {selected && (
                      <View style={[styles.checkBadge, { backgroundColor: colors.primary }]}>
                        <Ionicons name="checkmark" size={14} color={colors.onPrimary} />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Settings</Text>
            <View style={[styles.option, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.optionTextContainer}>
                <Text style={[styles.optionTitle, { color: colors.text }]}>Notifications</Text>
                <Text style={[styles.optionDescription, { color: colors.textSecondary }]}>
                  Stay updated with tasks
                </Text>
              </View>
              <Switch
                value={preferences?.notificationsEnabled ?? false}
                onValueChange={toggleNotifications}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.primary }]}
            onPress={() => navigation.navigate('StorageSelection')}
            activeOpacity={0.7}
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
    marginBottom: 28,
    marginTop: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
  },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  themeList: {
    gap: 10,
  },
  themeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 12,
  },
  themeCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 14,
  },
  themePreviewRow: {
    flexDirection: 'row',
    gap: 4,
  },
  previewSwatch: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  themeInfo: {
    flex: 1,
  },
  themeName: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  themeDesc: {
    fontSize: 12,
  },
  checkBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  optionTextContainer: {
    flex: 1,
    marginRight: 16,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  optionDescription: {
    fontSize: 13,
  },
  footer: {
    marginTop: 12,
  },
  button: {
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
