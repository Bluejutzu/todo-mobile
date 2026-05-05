import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useUserStore } from '../stores/userStore';
import { getThemeColors } from '../theme/colors';

interface Segment<T extends string> {
  label: string;
  value: T;
}

interface SegmentedControlProps<T extends string> {
  value: T;
  segments: Segment<T>[];
  onChange: (value: T) => void;
}

export function SegmentedControl<T extends string>({
  value,
  segments,
  onChange,
}: SegmentedControlProps<T>) {
  const theme = useUserStore(state => state.preferences?.theme || 'dark');
  const colors = getThemeColors(theme);

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      {segments.map(segment => {
        const selected = value === segment.value;
        return (
          <TouchableOpacity
            key={segment.value}
            style={[styles.segment, selected && { backgroundColor: colors.primary }]}
            onPress={() => onChange(segment.value)}
          >
            <Text style={[styles.label, { color: selected ? colors.onPrimary : colors.text }]}>
              {segment.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderRadius: 8,
    padding: 3,
  },
  segment: {
    flex: 1,
    minHeight: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
  },
});
