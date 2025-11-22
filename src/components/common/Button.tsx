import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { useUserStore } from '../../stores/userStore';
import { getThemeColors } from '../../theme/colors';
import { spacing, borderRadius } from '../../theme/spacing';
import { typography } from '../../theme/typography';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'destructive' | 'outline';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  style,
}: ButtonProps) {
  const theme = useUserStore(state => state.preferences?.theme || 'dark');
  const themeColors = getThemeColors(theme);

  const buttonStyle: ViewStyle = {
    backgroundColor:
      variant === 'primary'
        ? themeColors.primary
        : variant === 'secondary'
          ? themeColors.secondary
          : variant === 'destructive'
            ? themeColors.error
            : 'transparent',
    borderWidth: variant === 'outline' ? 1 : 0,
    borderColor: variant === 'outline' ? themeColors.border : undefined,
  };

  const getTextColor = () => {
    if (variant === 'outline') return themeColors.text;
    if (variant === 'primary') return themeColors.onPrimary;
    if (variant === 'destructive') return themeColors.onPrimary;
    return themeColors.onPrimary; // Default for secondary
  };

  const textStyle: TextStyle = {
    color: getTextColor(),
  };

  return (
    <TouchableOpacity
      style={[styles.button, buttonStyle, (disabled || loading) && styles.disabled, style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'outline' ? themeColors.primary : getTextColor()} />
      ) : (
        <Text style={[styles.text, textStyle]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  text: {
    ...typography.body,
    fontWeight: '600',
  },
  disabled: {
    opacity: 0.5,
  },
});
