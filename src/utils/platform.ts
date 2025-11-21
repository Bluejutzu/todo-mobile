import { Platform } from 'react-native';

export const isIOS = Platform.OS === 'ios';
export const isAndroid = Platform.OS === 'android';

export function getPlatformValue<T>(ios: T, android: T): T {
  return isIOS ? ios : android;
}
