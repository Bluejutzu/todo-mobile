import { ViewStyle } from 'react-native';
import { borderRadius } from './spacing';

export const iosGlassCard: ViewStyle = {
  borderRadius: borderRadius.lg,
  overflow: 'hidden',
};

export const iosFallbackCard: ViewStyle = {
  borderRadius: borderRadius.lg,
  borderWidth: 1,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.06,
  shadowRadius: 8,
};
