import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useUserStore } from '../../stores/userStore';
import { getThemeColors } from '../../theme/colors';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { OnboardingStackParamList } from './OnboardingNavigator';
import { storage } from '../../services/storage';

type NavigationProp = NativeStackNavigationProp<OnboardingStackParamList, 'StorageSelection'>;
type StorageOption = 'cloud' | 'local';

const OPTIONS: { id: StorageOption; title: string; description: string; icon: 'cloud-outline' | 'phone-portrait-outline'; badge?: string }[] = [
  {
    id: 'cloud',
    title: 'Cloud Storage',
    description: 'Synced across devices via our secure database. Requires sign-in.',
    icon: 'cloud-outline',
    badge: 'Recommended',
  },
  {
    id: 'local',
    title: 'Local Storage',
    description: 'Data stays on this device only. You can switch to cloud later.',
    icon: 'phone-portrait-outline',
  },
];

export function StorageSelectionScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [selected, setSelected] = useState<StorageOption>('cloud');
  const theme = useUserStore(state => state.preferences?.theme || 'dark');
  const colors = getThemeColors(theme);

  const handleContinue = async () => {
    await storage.setStorageMethod(selected);
    navigation.navigate('Auth');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Choose Storage</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Where should your todos live?
          </Text>
        </View>

        <View style={styles.options}>
          {OPTIONS.map(option => {
            const isSelected = selected === option.id;
            return (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.option,
                  {
                    backgroundColor: colors.surface,
                    borderColor: isSelected ? colors.primary : colors.border,
                    borderWidth: isSelected ? 2 : 1,
                  },
                ]}
                onPress={() => setSelected(option.id)}
                activeOpacity={0.7}
              >
                <View style={styles.optionTop}>
                  <Ionicons
                    name={option.icon}
                    size={24}
                    color={isSelected ? colors.primary : colors.textSecondary}
                  />
                  {option.badge && (
                    <View style={[styles.badge, { backgroundColor: colors.primary + '18' }]}>
                      <Text style={[styles.badgeText, { color: colors.primary }]}>{option.badge}</Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.optionTitle, { color: colors.text }]}>{option.title}</Text>
                <Text style={[styles.optionDesc, { color: colors.textSecondary }]}>{option.description}</Text>
                <View style={styles.radioRow}>
                  <View style={[styles.radio, { borderColor: isSelected ? colors.primary : colors.border }]}>
                    {isSelected && <View style={[styles.radioInner, { backgroundColor: colors.primary }]} />}
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.primary }]}
            onPress={handleContinue}
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
  options: {
    gap: 12,
  },
  option: {
    padding: 16,
    borderRadius: 12,
  },
  optionTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  optionTitle: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 4,
  },
  optionDesc: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
  },
  radioRow: {
    alignItems: 'flex-end',
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  footer: {
    marginTop: 'auto',
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
