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

export function StorageSelectionScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [selected, setSelected] = useState<StorageOption>('cloud');
  const theme = useUserStore(state => state.preferences?.theme || 'dark');
  const colors = getThemeColors(theme);

  const handleContinue = async () => {
    await storage.setStorageMethod(selected);
    navigation.navigate('Auth');
  };

  const options = [
    {
      id: 'cloud' as StorageOption,
      title: 'Cloud Storage',
      description: 'Your data is securely stored in our cloud database and synced across devices',
      icon: 'cloud' as const,
      recommended: true,
    },
    {
      id: 'local' as StorageOption,
      title: 'Local Storage',
      description: 'Your data stays on your device. You can choose a custom folder location',
      icon: 'phone-portrait' as const,
      recommended: false,
    },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Choose Storage</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Where would you like to store your todos?
          </Text>
        </View>

        <View style={styles.optionsContainer}>
          {options.map(option => (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.option,
                {
                  backgroundColor: colors.surface,
                  borderColor: selected === option.id ? colors.primary : colors.border,
                },
                selected === option.id ? styles.optionSelected : styles.optionUnselected,
              ]}
              onPress={() => setSelected(option.id)}
            >
              <View style={styles.optionHeader}>
                <Ionicons
                  name={option.icon}
                  size={32}
                  color={selected === option.id ? colors.primary : colors.textSecondary}
                />
                {option.recommended && (
                  <View style={[styles.badge, { backgroundColor: colors.primary }]}>
                    <Text style={styles.badgeText}>Recommended</Text>
                  </View>
                )}
              </View>
              <Text style={[styles.optionTitle, { color: colors.text }]}>{option.title}</Text>
              <Text style={[styles.optionDescription, { color: colors.textSecondary }]}>
                {option.description}
              </Text>
              <View style={styles.radioContainer}>
                <View
                  style={[
                    styles.radio,
                    { borderColor: selected === option.id ? colors.primary : colors.border },
                  ]}
                >
                  {selected === option.id && (
                    <View style={[styles.radioInner, { backgroundColor: colors.primary }]} />
                  )}
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.primary }]}
            onPress={handleContinue}
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
  optionsContainer: {
    gap: 16,
  },
  option: {
    padding: 20,
    borderRadius: 16,
    position: 'relative',
  },
  optionSelected: {
    borderWidth: 2,
  },
  optionUnselected: {
    borderWidth: 1,
  },
  optionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  optionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  optionDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  radioContainer: {
    alignItems: 'flex-end',
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
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
