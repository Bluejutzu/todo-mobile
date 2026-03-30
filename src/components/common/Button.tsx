import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useUserStore } from '../../stores/userStore';
import { getThemeColors } from '../../theme/colors';
import { spacing, borderRadius } from '../../theme/spacing';
import { typography } from '../../theme/typography';

type ButtonSize = 'sm' | 'md' | 'lg';
type ButtonVariant = 'primary' | 'secondary' | 'destructive' | 'outline' | 'ghost';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: keyof typeof Ionicons.glyphMap;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  fullWidth?: boolean;
}

const sizeConfig = {
  sm: { paddingV: 6, paddingH: 12, fontSize: 13, iconSize: 14, minHeight: 32, radius: borderRadius.sm },
  md: { paddingV: 10, paddingH: 16, fontSize: 15, iconSize: 16, minHeight: 40, radius: borderRadius.md },
  lg: { paddingV: 14, paddingH: 20, fontSize: 16, iconSize: 18, minHeight: 48, radius: borderRadius.md },
};

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  loading = false,
  disabled = false,
  style,
  fullWidth = false,
}: ButtonProps) {
  const theme = useUserStore(state => state.preferences?.theme || 'dark');
  const colors = getThemeColors(theme);
  const config = sizeConfig[size];

  const getBackgroundColor = () => {
    switch (variant) {
      case 'primary': return colors.primary;
      case 'secondary': return colors.surface;
      case 'destructive': return colors.error;
      case 'outline': return 'transparent';
      case 'ghost': return 'transparent';
    }
  };

  const getTextColor = () => {
    switch (variant) {
      case 'primary': return colors.onPrimary;
      case 'secondary': return colors.text;
      case 'destructive': return colors.onPrimary;
      case 'outline': return colors.text;
      case 'ghost': return colors.primary;
    }
  };

  const getBorderColor = () => {
    if (variant === 'outline') return colors.border;
    if (variant === 'secondary') return colors.border;
    return 'transparent';
  };

  const textColor = getTextColor();

  return (
    <TouchableOpacity
      style={[
        {
          backgroundColor: getBackgroundColor(),
          borderColor: getBorderColor(),
          borderWidth: variant === 'outline' || variant === 'secondary' ? 1 : 0,
          paddingVertical: config.paddingV,
          paddingHorizontal: config.paddingH,
          borderRadius: config.radius,
          minHeight: config.minHeight,
          alignSelf: fullWidth ? 'stretch' : undefined,
        },
        styles.base,
        (disabled || loading) && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator color={textColor} size="small" />
      ) : (
        <View style={styles.content}>
          {icon && <Ionicons name={icon} size={config.iconSize} color={textColor} style={styles.icon} />}
          <Text style={[{ color: textColor, fontSize: config.fontSize }, styles.text]}>{title}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontWeight: '600',
  },
  icon: {
    marginRight: 6,
  },
  disabled: {
    opacity: 0.5,
  },
});
