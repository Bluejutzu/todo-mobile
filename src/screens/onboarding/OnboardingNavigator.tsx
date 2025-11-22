import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NameScreen } from './NameScreen';
import { PreferencesScreen } from './PreferencesScreen';
import { StorageSelectionScreen } from './StorageSelectionScreen';
import { AuthScreen } from './AuthScreen';

export type OnboardingStackParamList = {
  Name: undefined;
  Preferences: undefined;
  StorageSelection: undefined;
  Auth: undefined;
};

const Stack = createNativeStackNavigator<OnboardingStackParamList>();

export function OnboardingNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Name" component={NameScreen} />
      <Stack.Screen name="Preferences" component={PreferencesScreen} />
      <Stack.Screen name="StorageSelection" component={StorageSelectionScreen} />
      <Stack.Screen name="Auth" component={AuthScreen} />
    </Stack.Navigator>
  );
}
