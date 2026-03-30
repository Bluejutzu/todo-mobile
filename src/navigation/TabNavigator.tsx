import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { TodoListScreen } from '../screens/todos/TodoListScreen';
import { CalendarScreen } from '../screens/calendar/CalendarScreen';
import { SettingsScreen } from '../screens/settings/SettingsScreen';
import { AccountScreen } from '../screens/account/AccountScreen';
import { useUserStore } from '../stores/userStore';
import { getThemeColors, isDarkTheme } from '../theme/colors';
import type { MainTabParamList } from '../types/navigation';
import { useUser } from '@clerk/clerk-expo';
import { Image, StyleSheet, Platform } from 'react-native';

const Tab = createBottomTabNavigator<MainTabParamList>();

export function TabNavigator() {
  const theme = useUserStore(state => state.preferences?.theme || 'dark');
  const colors = getThemeColors(theme);
  const dark = isDarkTheme(theme);
  const { user } = useUser();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 0.5,
          paddingHorizontal: 8,
          height: Platform.OS === 'ios' ? 84 : 60,
          paddingBottom: Platform.OS === 'ios' ? 28 : 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '500' },
      }}
    >
      <Tab.Screen
        name="Todos"
        component={TodoListScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Ionicons name="checkmark-done" size={size - 2} color={color} />,
        }}
      />
      <Tab.Screen
        name="Calendar"
        component={CalendarScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Ionicons name="calendar" size={size - 2} color={color} />,
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Ionicons name="settings" size={size - 2} color={color} />,
        }}
      />
      <Tab.Screen
        name="Account"
        component={AccountScreen}
        options={{
          tabBarIcon: ({ color, size }) =>
            user?.imageUrl ? (
              <Image source={{ uri: user.imageUrl }} style={[styles.avatar, { width: size - 2, height: size - 2 }]} />
            ) : (
              <Ionicons name="person-circle" size={size - 2} color={color} />
            ),
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  avatar: {
    borderRadius: 100,
  },
});
