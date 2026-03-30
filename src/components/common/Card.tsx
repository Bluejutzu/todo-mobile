import React from 'react';
import { View, ViewStyle, StyleProp, StyleSheet, Platform } from 'react-native';
import { useUserStore } from '../../stores/userStore';
import { getThemeColors, isDarkTheme } from '../../theme/colors';
import { borderRadius, spacing } from '../../theme/spacing';

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  elevated?: boolean;
}

export function Card({ children, style, elevated = false }: CardProps) {
  const theme = useUserStore(state => state.preferences?.theme || 'dark');
  const colors = getThemeColors(theme);
  const dark = isDarkTheme(theme);

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: elevated ? colors.surfaceElevated : colors.surface,
          borderColor: colors.border,
        },
        dark ? styles.darkShadow : styles.lightShadow,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    padding: spacing.md,
  },
  lightShadow: {
    shadowColor: '#8B7E6A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  darkShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
});
