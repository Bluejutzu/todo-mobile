import React from 'react';
import { Switch } from 'react-native';
import { useUserStore } from '../stores/userStore';
import { getThemeColors } from '../theme/colors';
import { ListRow } from './ListRow';

interface SwitchRowProps {
  title: string;
  subtitle?: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}

export function SwitchRow({ title, subtitle, value, onValueChange }: SwitchRowProps) {
  const theme = useUserStore(state => state.preferences?.theme || 'dark');
  const colors = getThemeColors(theme);

  return (
    <ListRow
      title={title}
      subtitle={subtitle}
      value={
        <Switch
          value={value}
          onValueChange={onValueChange}
          trackColor={{ false: colors.border, true: colors.primary }}
          thumbColor="#FFFFFF"
        />
      }
    />
  );
}
