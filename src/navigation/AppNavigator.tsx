import React, { useEffect, useRef, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { TabNavigator } from './TabNavigator';
import { OnboardingNavigator } from '../screens/onboarding/OnboardingNavigator';
import { useUserStore } from '../stores/userStore';
import { useTodoStore } from '../stores/todoStore'; // Added import
import { useSubscriptionStore } from '../stores/subscriptionStore'; // Added import
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

  const { setTokenGetter } = useTodoStore();
  const { getToken, isSignedIn } = useAuth();

  // Keep a stable ref to getToken so setTokenGetter is only called once.
  // Clerk recreates getToken on each render; storing it in a ref avoids
  // re-registering the token getter on every render which caused an
  // infinite update loop via syncStatusStore.subscribe.
  const getTokenRef = useRef(getToken);
  useEffect(() => {
    getTokenRef.current = getToken;
  }, [getToken]);

  useEffect(() => {
    setTokenGetter((...args) => getTokenRef.current(...args));
  }, [setTokenGetter]);

  useEffect(() => {
    async function initialize() {
      await loadPreferences();
      // Initialize subscription store
      await useSubscriptionStore.getState().initialize();
      const completed = await storage.isOnboardingCompleted();
      // If not signed in, force onboarding/auth flow even if locally marked as completed
      setIsOnboarding(!completed || !isSignedIn);
      setLoading(false);
    }
    initialize();
  }, [isSignedIn, loadPreferences]);

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
