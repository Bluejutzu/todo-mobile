import { ViewStyle } from 'react-native';
import { borderRadius } from './spacing';

// Android Material Design 3 styles
export const androidCard: ViewStyle = {
  borderRadius: borderRadius.md,
  elevation: 2,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.25,
  shadowRadius: 4,
};

export const androidCardElevated: ViewStyle = {
  ...androidCard,
  elevation: 4,
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.3,
  shadowRadius: 8,
};
