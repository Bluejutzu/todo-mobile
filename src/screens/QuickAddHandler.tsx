import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useUserStore } from '../stores/userStore';
import { getThemeColors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';

/**
 * Quick Add Handler Screen
 *
 * This screen handles deep links from the Quick Add Live Activity.
 * It navigates to the Todos screen where users can add a new todo.
 *
 * Note: The actual modal opening is handled by the TodoListScreen
 * through a deep link parameter or navigation state.
 */
export function QuickAddHandler() {
  const navigation = useNavigation();
  const theme = useUserStore(state => state.preferences?.theme || 'dark');
  const themeColors = getThemeColors(theme);

  useEffect(() => {
    // Navigate to the Todos screen with a flag to open the create modal
    // @ts-expect-error - navigation types not fully defined
    navigation.navigate('Todos', { showCreateModal: true });
  }, [navigation]);

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      <Text style={[styles.text, { color: themeColors.text }]}>Opening Quick Add...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  text: {
    ...typography.body,
  },
});
