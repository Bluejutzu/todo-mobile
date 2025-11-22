import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { TabNavigator } from './TabNavigator';
import { OnboardingNavigator } from '../screens/onboarding/OnboardingNavigator';
import { useUserStore } from '../stores/userStore';
import { useTodoStore } from '../stores/todoStore'; // Added import
import { useAuth } from '@clerk/clerk-expo'; // Added import
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

  // Added for Clerk authentication and Cloud Storage
  const { setTokenGetter } = useTodoStore();
  const { getToken, isSignedIn } = useAuth();

  // Initialize token getter for Cloud Storage
  useEffect(() => {
    setTokenGetter(getToken);
  }, []); // Only run once on mount

  useEffect(() => {
    async function initialize() {
      await loadPreferences();
      const completed = await storage.isOnboardingCompleted();
      // If not signed in, force onboarding/auth flow even if locally marked as completed
      setIsOnboarding(!completed || !isSignedIn);
      setLoading(false);
    }
    initialize();
  }, [isSignedIn]);

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
        {isOnboarding || !isSignedIn ? (
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
