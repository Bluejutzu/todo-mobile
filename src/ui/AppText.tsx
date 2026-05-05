import React from 'react';
import { Text, TextProps, StyleSheet } from 'react-native';
import { useUserStore } from '../stores/userStore';
import { getThemeColors } from '../theme/colors';

type AppTextVariant = 'title' | 'section' | 'body' | 'caption';

interface AppTextProps extends TextProps {
  variant?: AppTextVariant;
  muted?: boolean;
}

export function AppText({ variant = 'body', muted = false, style, ...props }: AppTextProps) {
  const theme = useUserStore(state => state.preferences?.theme || 'dark');
  const colors = getThemeColors(theme);
  const variantStyle =
    variant === 'title'
      ? styles.title
      : variant === 'section'
        ? styles.section
        : variant === 'caption'
          ? styles.caption
          : styles.body;

  return (
    <Text
      style={[
        variantStyle,
        muted ? { color: colors.textSecondary } : { color: colors.text },
        style,
      ]}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 28,
    fontWeight: '700',
  },
  section: {
    fontSize: 16,
    fontWeight: '600',
  },
  body: {
    fontSize: 15,
  },
  caption: {
    fontSize: 13,
  },
});
