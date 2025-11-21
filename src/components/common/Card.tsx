import React from 'react';
import { View, ViewStyle, StyleProp, StyleSheet, Platform } from 'react-native';
import { useUserStore } from '../../stores/userStore';
import { iosGlassCard, iosFallbackCard } from '../../theme/ios';
import { getThemeColors } from '../../theme/colors';
import { borderRadius, spacing } from '../../theme/spacing';

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  elevated?: boolean;
}

export function Card({ children, style, elevated = false }: CardProps) {
  const theme = useUserStore(state => state.preferences?.theme || 'dark');
  const themeColors = getThemeColors(theme);

  if (Platform.OS === 'ios') {
    return (
      <View
        style={[
          theme === 'dark' ? iosGlassCard : iosFallbackCard,
          {
            backgroundColor: themeColors.surface,
            borderColor: themeColors.border,
            padding: spacing.md,
          },
          style,
        ]}
      >
        {children}
      </View>
    );
  }

  // Android Material Design & iOS Fallback
  return (
    <View
      style={[
        styles.card,
        { backgroundColor: themeColors.surface, borderColor: themeColors.border },
        elevated ? styles.elevated : styles.flat,
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
  elevated: {
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  flat: {
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
});
