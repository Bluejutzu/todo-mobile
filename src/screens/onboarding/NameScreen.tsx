import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUserStore } from '../../stores/userStore';
import { getThemeColors } from '../../theme/colors';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { OnboardingStackParamList } from './OnboardingNavigator';

type NavigationProp = NativeStackNavigationProp<OnboardingStackParamList, 'Name'>;

export function NameScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [name, setName] = useState('');
  const setUserName = useUserStore(state => state.setUserName);
  const theme = useUserStore(state => state.preferences?.theme || 'dark');
  const colors = getThemeColors(theme);

  const canProceed = name.trim().length >= 2;

  const handleNext = async () => {
    if (canProceed) {
      await setUserName(name.trim());
      navigation.navigate('Preferences');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Welcome!</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            What should we call you?
          </Text>
        </View>

        <View style={styles.inputContainer}>
          <TextInput
            style={[styles.input, { color: colors.text, backgroundColor: colors.input, borderColor: colors.border }]}
            placeholder="Your Name"
            placeholderTextColor={colors.textSecondary}
            value={name}
            onChangeText={setName}
            autoFocus
            returnKeyType="next"
            onSubmitEditing={handleNext}
          />
        </View>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: canProceed ? colors.primary : colors.surface }]}
          onPress={handleNext}
          disabled={!canProceed}
          activeOpacity={0.7}
        >
          <Text style={[styles.buttonText, { color: canProceed ? colors.onPrimary : colors.textSecondary }]}>
            Next
          </Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
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
    justifyContent: 'center',
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
  },
  inputContainer: {
    marginBottom: 32,
  },
  input: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: 16,
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
