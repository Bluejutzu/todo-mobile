import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useUserStore } from '../stores/userStore';
import { getThemeColors } from '../theme/colors';
import { spacing } from '../theme/spacing';

interface ListRowProps {
  title: string;
  subtitle?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  value?: React.ReactNode;
  onPress?: () => void;
}

export function ListRow({ title, subtitle, icon, value, onPress }: ListRowProps) {
  const theme = useUserStore(state => state.preferences?.theme || 'dark');
  const colors = getThemeColors(theme);
  const Container = onPress ? TouchableOpacity : View;

  return (
    <Container style={styles.row} onPress={onPress as never} activeOpacity={0.7}>
      {icon && <Ionicons name={icon} size={20} color={colors.textSecondary} />}
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
        {subtitle && (
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{subtitle}</Text>
        )}
      </View>
      {value}
    </Container>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '500',
  },
  subtitle: {
    fontSize: 13,
    marginTop: 2,
  },
});
