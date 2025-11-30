import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSubscription } from '../../hooks/useSubscription';
import { getThemeColors } from '../../theme/colors';
import { useUserStore } from '../../stores/userStore';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { Card } from '../common/Card';

interface SubscriptionCardProps {
    onUpgrade: () => void;
}

export function SubscriptionCard({ onUpgrade }: SubscriptionCardProps) {
    const theme = useUserStore(state => state.preferences?.theme || 'dark');
    const themeColors = getThemeColors(theme);
    const { isPremium, expirationDate, usage, limits } = useSubscription();

    const getProgressColor = (current: number, max: number) => {
        const percentage = current / max;
        if (percentage > 0.9) return themeColors.error;
        if (percentage > 0.7) return themeColors.warning;
        return themeColors.success;
    };

    return (
        <Card style={styles.container}>
            <View style={styles.header}>
                <View style={styles.titleRow}>
                    <Ionicons
                        name={isPremium ? "diamond" : "cube"}
                        size={24}
                        color={isPremium ? themeColors.primary : themeColors.textSecondary}
                    />
                    <View>
                        <Text style={[styles.title, { color: themeColors.text }]}>
                            {isPremium ? 'Premium Plan' : 'Free Plan'}
                        </Text>
                        {isPremium && expirationDate && (
                            <Text style={[styles.subtitle, { color: themeColors.textSecondary }]}>
                                Renews {new Date(expirationDate).toLocaleDateString()}
                            </Text>
                        )}
                    </View>
                </View>

                {!isPremium && (
                    <TouchableOpacity
                        style={[styles.upgradeButton, { backgroundColor: themeColors.primary }]}
                        onPress={onUpgrade}
                    >
                        <Text style={[styles.upgradeText, { color: themeColors.onPrimary }]}>Upgrade</Text>
                    </TouchableOpacity>
                )}
            </View>

            <View style={[styles.divider, { backgroundColor: themeColors.border }]} />

            <View style={styles.statsContainer}>
                <View style={styles.statRow}>
                    <View style={styles.statHeader}>
                        <Text style={[styles.statLabel, { color: themeColors.textSecondary }]}>
                            Daily AI Requests
                        </Text>
                        <Text style={[styles.statValue, { color: themeColors.text }]}>
                            {usage.aiRequestsToday} / {limits.aiRequestsPerDay === -1 ? '∞' : limits.aiRequestsPerDay}
                        </Text>
                    </View>
                    {limits.aiRequestsPerDay !== -1 && (
                        <View style={[styles.progressBarBg, { backgroundColor: themeColors.border }]}>
                            <View
                                style={[
                                    styles.progressBarFill,
                                    {
                                        backgroundColor: getProgressColor(usage.aiRequestsToday, limits.aiRequestsPerDay),
                                        width: `${Math.min((usage.aiRequestsToday / limits.aiRequestsPerDay) * 100, 100)}%`
                                    }
                                ]}
                            />
                        </View>
                    )}
                </View>

                <View style={styles.statRow}>
                    <View style={styles.statHeader}>
                        <Text style={[styles.statLabel, { color: themeColors.textSecondary }]}>
                            Cloud Storage
                        </Text>
                        <Text style={[styles.statValue, { color: themeColors.text }]}>
                            {(usage.storageUsedBytes / (1024 * 1024)).toFixed(1)} MB / {(limits.maxStorageBytes / (1024 * 1024)).toFixed(0)} MB
                        </Text>
                    </View>
                    <View style={[styles.progressBarBg, { backgroundColor: themeColors.border }]}>
                        <View
                            style={[
                                styles.progressBarFill,
                                {
                                    backgroundColor: getProgressColor(usage.storageUsedBytes, limits.maxStorageBytes),
                                    width: `${Math.min((usage.storageUsedBytes / limits.maxStorageBytes) * 100, 100)}%`
                                }
                            ]}
                        />
                    </View>
                </View>
            </View>
        </Card>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: spacing.md,
        marginBottom: spacing.md,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    title: {
        ...typography.h3,
    },
    subtitle: {
        ...typography.caption,
    },
    upgradeButton: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
        borderRadius: 16,
    },
    upgradeText: {
        ...typography.bodySmall,
        fontWeight: '600',
    },
    divider: {
        height: 1,
        marginVertical: spacing.md,
    },
    statsContainer: {
        gap: spacing.md,
    },
    statRow: {
        gap: spacing.xs,
    },
    statHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    statLabel: {
        ...typography.bodySmall,
    },
    statValue: {
        ...typography.bodySmall,
        fontWeight: '600',
    },
    progressBarBg: {
        height: 6,
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        borderRadius: 3,
    },
});
