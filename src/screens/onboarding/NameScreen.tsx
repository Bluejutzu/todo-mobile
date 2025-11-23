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

  const handleNext = async () => {
    if (name.trim()) {
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
            style={[
              styles.input,
              {
                color: colors.text,
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}
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
          style={[
            styles.button,
            { backgroundColor: name.trim() ? colors.primary : colors.surface },
            !name.trim() && styles.buttonDisabled,
          ]}
          onPress={handleNext}
          disabled={!name.trim()}
        >
          <Text
            style={[
              styles.buttonText,
              name.trim() ? styles.buttonTextActive : styles.buttonTextInactive,
            ]}
          >
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
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 18,
  },
  inputContainer: {
    marginBottom: 40,
  },
  input: {
    height: 56,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: 18,
  },
  button: {
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '600',
  },
  buttonTextActive: {
    color: '#FFFFFF',
  },
  buttonTextInactive: {
    color: '#666666', 
  },
});
