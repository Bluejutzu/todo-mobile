import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useUserStore } from '../../stores/userStore';
import { getThemeColors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import MaskedView from '@react-native-masked-view/masked-view';

interface AILoadingIndicatorProps {
  message?: string;
}

export function AILoadingIndicator({ message = 'AI is thinking...' }: AILoadingIndicatorProps) {
  const theme = useUserStore(state => state.preferences?.theme || 'dark');
  const themeColors = getThemeColors(theme);

  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      })
    );
    animation.start();
    return () => animation.stop();
  }, [shimmerAnim]);

  const translateX = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-300, 300],
  });

  return (
    <View style={[styles.container, { backgroundColor: themeColors.surface }]}>
      <MaskedView
        style={styles.maskedView}
        maskElement={
          <View style={styles.maskContainer}>
            <Text style={[styles.text, styles.maskText]}>{message}</Text>
          </View>
        }
      >
        {/* Base text color */}
        <Text style={[styles.text, styles.baseText, { color: themeColors.textSecondary }]}>
          {message}
        </Text>

        {/* Animated shimmer gradient */}
        <Animated.View
          style={[
            styles.shimmerContainer,
            {
              transform: [{ translateX }],
            },
          ]}
        >
          <LinearGradient
            colors={[
              'transparent',
              theme === 'dark' ? 'rgba(255, 255, 255, 0.8)' : 'rgba(100, 100, 100, 0.8)',
              'transparent',
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.gradient}
          />
        </Animated.View>
      </MaskedView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
    borderRadius: 8,
    marginVertical: spacing.sm,
    overflow: 'hidden',
  },
  maskedView: {
    height: 30,
    justifyContent: 'center',
  },
  maskContainer: {
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    ...typography.body,
    textAlign: 'center',
    paddingVertical: spacing.xs,
  },
  maskText: {
    color: '#000',
  },
  baseText: {
    opacity: 0.5,
  },
  shimmerContainer: {
    position: 'absolute',
    top: 0,
    left: -300,
    width: 600,
    height: '100%',
  },
  gradient: {
    flex: 1,
    width: '100%',
  },
});
