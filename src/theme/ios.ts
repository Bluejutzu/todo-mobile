import { ViewStyle, TextStyle } from 'react-native';
import { borderRadius } from './spacing';

// iOS liquid glass styles using @callstack/liquid-glass
export const iosGlassCard: ViewStyle = {
  borderRadius: borderRadius.lg,
  overflow: 'hidden',
};

export const iosGlassText: TextStyle = {
  // Use PlatformColor for automatic adaptation
  // This will be applied in components
};

// Fallback styles for iOS < 18
export const iosFallbackCard: ViewStyle = {
  backgroundColor: 'rgba(255, 255, 255, 0.1)',
  borderRadius: borderRadius.lg,
  borderWidth: 1,
  borderColor: 'rgba(255, 255, 255, 0.2)',
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.1,
  shadowRadius: 12,
};
