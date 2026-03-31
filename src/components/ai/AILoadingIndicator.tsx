import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useUserStore } from '../../stores/userStore';
import { getThemeColors, isDarkTheme } from '../../theme/colors';
import { spacing, borderRadius } from '../../theme/spacing';
import { typography } from '../../theme/typography';

interface AILoadingIndicatorProps {
  message?: string;
}

export function AILoadingIndicator({ message = 'AI is thinking...' }: AILoadingIndicatorProps) {
  const theme = useUserStore(state => state.preferences?.theme || 'dark');
  const colors = getThemeColors(theme);
  const dark = isDarkTheme(theme);

  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    const shimmer = Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 1500,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      })
    );

    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.6,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    shimmer.start();
    pulse.start();
    return () => { shimmer.stop(); pulse.stop(); };
  }, [shimmerAnim, pulseAnim]);

  const translateX = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-200, 200],
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.primary + '10', borderColor: colors.primary + '25' }]}>
      <View style={styles.row}>
        <Animated.View style={{ opacity: pulseAnim }}>
          <Ionicons name="sparkles" size={16} color={colors.primary} />
        </Animated.View>
        <Text style={[styles.text, { color: colors.primary }]}>{message}</Text>
      </View>
      <View style={styles.shimmerBar}>
        <View style={[styles.shimmerTrack, { backgroundColor: colors.primary + '15' }]}>
          <Animated.View style={[styles.shimmerGlow, { transform: [{ translateX }] }]}>
            <LinearGradient
              colors={['transparent', colors.primary + '40', 'transparent']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.gradient}
            />
          </Animated.View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    marginVertical: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  text: {
    ...typography.bodySmall,
    fontWeight: '500',
  },
  shimmerBar: {
    height: 3,
    borderRadius: 2,
    overflow: 'hidden',
  },
  shimmerTrack: {
    flex: 1,
    height: '100%',
    borderRadius: 2,
  },
  shimmerGlow: {
    position: 'absolute',
    top: 0,
    left: -200,
    width: 400,
    height: '100%',
  },
  gradient: {
    flex: 1,
  },
});
