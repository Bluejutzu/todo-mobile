import React from 'react';
import {
  TextInput as RNTextInput,
  StyleSheet,
  View,
  Text,
  TextInputProps,
  ViewStyle,
} from 'react-native';
import { useUserStore } from '../../stores/userStore';
import { getThemeColors } from '../../theme/colors';
import { spacing, borderRadius } from '../../theme/spacing';
import { typography } from '../../theme/typography';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
}

export function Input({ label, error, containerStyle, style, ...props }: InputProps) {
  const theme = useUserStore(state => state.preferences?.theme || 'dark');
  const themeColors = getThemeColors(theme);

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={[styles.label, { color: themeColors.text }]}>{label}</Text>}
      <RNTextInput
        style={[
          styles.input,
          {
            backgroundColor: themeColors.input,
            borderColor: error ? themeColors.error : themeColors.border,
            color: themeColors.text,
          },
          style,
        ]}
        placeholderTextColor={themeColors.textSecondary}
        {...props}
      />
      {error && <Text style={[styles.error, { color: themeColors.error }]}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  label: {
    ...typography.bodySmall,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  input: {
    ...typography.body,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    minHeight: 44,
  },
  error: {
    ...typography.caption,
    marginTop: spacing.xs,
  },
});
