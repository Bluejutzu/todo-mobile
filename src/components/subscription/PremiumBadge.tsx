import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSubscription } from '../../hooks/useSubscription';
import { getThemeColors } from '../../theme/colors';
import { useUserStore } from '../../stores/userStore';
import { typography } from '../../theme/typography';

export function PremiumBadge() {
  const theme = useUserStore(state => state.preferences?.theme || 'dark');
  const themeColors = getThemeColors(theme);
  const { isPremium } = useSubscription();

  if (!isPremium) return null;

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: themeColors.primary + '20', borderColor: themeColors.primary },
      ]}
    >
      <Ionicons name="diamond" size={12} color={themeColors.primary} />
      <Text style={[styles.text, { color: themeColors.primary }]}>PREMIUM</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  text: {
    ...typography.caption,
    fontWeight: 'bold',
    fontSize: 10,
  },
});
