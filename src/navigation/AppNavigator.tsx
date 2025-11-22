import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { TabNavigator } from './TabNavigator';
import { OnboardingNavigator } from '../screens/onboarding/OnboardingNavigator';
import { useUserStore } from '../stores/userStore';
import { storage } from '../services/storage';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { getThemeColors } from '../theme/colors';
import type { RootStackParamList } from '../types/navigation';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function AppNavigator() {
  const [loading, setLoading] = useState(true);
  const [isOnboarding, setIsOnboarding] = useState(true);
  const loadPreferences = useUserStore(state => state.loadPreferences);
  const theme = useUserStore(state => state.preferences?.theme || 'dark');
  const themeColors = getThemeColors(theme);

  useEffect(() => {
    async function initialize() {
      await loadPreferences();
      const completed = await storage.isOnboardingCompleted();
      setIsOnboarding(!completed);
      setLoading(false);
    }
    initialize();
  }, []);

  if (loading) {
    return (
      <View style={[styles.loading, { backgroundColor: themeColors.background }]}>
        <ActivityIndicator size="large" color={themeColors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isOnboarding ? (
          <Stack.Screen name="Onboarding" component={OnboardingNavigator} />
        ) : (
          <Stack.Screen name="Main" component={TabNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
