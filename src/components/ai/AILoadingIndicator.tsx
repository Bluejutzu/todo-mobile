import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useUserStore } from '../../stores/userStore';
import { getThemeColors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

interface AILoadingIndicatorProps {
    message?: string;
}

export function AILoadingIndicator({ message = 'AI is thinking...' }: AILoadingIndicatorProps) {
    const theme = useUserStore(state => state.preferences?.theme || 'dark');
    const themeColors = getThemeColors(theme);

    const shimmerAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const animation = Animated.loop(
            Animated.sequence([
                Animated.timing(shimmerAnim, {
                    toValue: 1,
                    duration: 1500,
                    useNativeDriver: true,
                }),
                Animated.timing(shimmerAnim, {
                    toValue: 0,
                    duration: 0,
                    useNativeDriver: true,
                }),
            ])
        );
        animation.start();
        return () => animation.stop();
    }, [shimmerAnim]);

    const translateX = shimmerAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [-200, 200],
    });

    return (
        <View style={[styles.container, { backgroundColor: themeColors.surface }]}>
            <View style={styles.shimmerContainer}>
                <Animated.View
                    style={[
                        styles.shimmer,
                        {
                            backgroundColor: themeColors.primary,
                            transform: [{ translateX }],
                        },
                    ]}
                />
                <Text style={[styles.text, { color: themeColors.text }]}>{message}</Text>
            </View>
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
    shimmerContainer: {
        position: 'relative',
        overflow: 'hidden',
    },
    shimmer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        opacity: 0.2,
    },
    text: {
        ...typography.body,
        textAlign: 'center',
        paddingVertical: spacing.xs,
    },
});
