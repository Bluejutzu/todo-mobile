import React, { useEffect, useState } from 'react';
import {
    Modal,
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    ScrollView,
    SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PurchasesPackage } from 'react-native-purchases';
import { revenueCatService } from '../../services/revenuecat';
import { useSubscriptionStore } from '../../stores/subscriptionStore';
import { getThemeColors } from '../../theme/colors';
import { useUserStore } from '../../stores/userStore';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

interface PaywallModalProps {
    visible: boolean;
    onClose: () => void;
}

export function PaywallModal({ visible, onClose }: PaywallModalProps) {
    const theme = useUserStore(state => state.preferences?.theme || 'dark');
    const themeColors = getThemeColors(theme);
    const { refreshSubscription } = useSubscriptionStore();

    const [packages, setPackages] = useState<PurchasesPackage[]>([]);
    const [loading, setLoading] = useState(true);
    const [purchasing, setPurchasing] = useState<string | null>(null);
    const [selectedPackage, setSelectedPackage] = useState<string | null>(null);

    useEffect(() => {
        if (visible) {
            loadOfferings();
        }
    }, [visible]);

    const loadOfferings = async () => {
        setLoading(true);
        const offerings = await revenueCatService.getOfferings();
        if (offerings && offerings.availablePackages.length > 0) {
            setPackages(offerings.availablePackages);
            // Select annual by default if available
            const annual = offerings.availablePackages.find(p => p.packageType === 'ANNUAL');
            setSelectedPackage(annual ? annual.identifier : offerings.availablePackages[0].identifier);
        }
        setLoading(false);
    };

    const handlePurchase = async () => {
        if (!selectedPackage) return;

        const pack = packages.find(p => p.identifier === selectedPackage);
        if (!pack) return;

        setPurchasing(pack.identifier);
        try {
            await revenueCatService.purchasePackage(pack);
            await refreshSubscription();
            Alert.alert('Success', 'Welcome to Premium!');
            onClose();
        } catch (error: any) {
            if (!error.userCancelled) {
                Alert.alert('Error', 'Purchase failed. Please try again.');
            }
        } finally {
            setPurchasing(null);
        }
    };

    const handleRestore = async () => {
        setLoading(true);
        try {
            await revenueCatService.restorePurchases();
            await refreshSubscription();
            Alert.alert('Success', 'Purchases restored successfully.');
            onClose();
        } catch (error) {
            Alert.alert('Error', 'Failed to restore purchases.');
        } finally {
            setLoading(false);
        }
    };

    const features = [
        { icon: 'infinite', text: 'Unlimited AI Requests' },
        { icon: 'chatbubbles', text: '100k Token Context Window' },
        { icon: 'cloud-upload', text: '50MB Cloud Storage' },
        { icon: 'star', text: 'Priority Support' },
    ];

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
            <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                        <Ionicons name="close" size={24} color={themeColors.textSecondary} />
                    </TouchableOpacity>
                </View>

                <ScrollView contentContainerStyle={styles.content}>
                    <View style={styles.hero}>
                        <View style={[styles.iconContainer, { backgroundColor: themeColors.primary + '20' }]}>
                            <Ionicons name="diamond" size={48} color={themeColors.primary} />
                        </View>
                        <Text style={[styles.title, { color: themeColors.text }]}>Unlock Premium</Text>
                        <Text style={[styles.subtitle, { color: themeColors.textSecondary }]}>
                            Supercharge your productivity with advanced AI features
                        </Text>
                    </View>

                    <View style={styles.featuresList}>
                        {features.map((feature, index) => (
                            <View key={index} style={styles.featureRow}>
                                <Ionicons name={feature.icon as any} size={24} color={themeColors.primary} />
                                <Text style={[styles.featureText, { color: themeColors.text }]}>{feature.text}</Text>
                            </View>
                        ))}
                    </View>

                    <View style={styles.packagesContainer}>
                        {loading ? (
                            <ActivityIndicator size="large" color={themeColors.primary} />
                        ) : (
                            packages.map((pack) => {
                                const isSelected = selectedPackage === pack.identifier;
                                const isAnnual = pack.packageType === 'ANNUAL';

                                return (
                                    <TouchableOpacity
                                        key={pack.identifier}
                                        style={[
                                            styles.packageCard,
                                            {
                                                borderColor: isSelected ? themeColors.primary : themeColors.border,
                                                backgroundColor: isSelected ? themeColors.primary + '10' : themeColors.surface,
                                            }
                                        ]}
                                        onPress={() => setSelectedPackage(pack.identifier)}
                                    >
                                        <View style={styles.packageInfo}>
                                            <Text style={[styles.packageTitle, { color: themeColors.text }]}>
                                                {isAnnual ? 'Yearly' : 'Monthly'}
                                            </Text>
                                            {isAnnual && (
                                                <View style={[styles.saveBadge, { backgroundColor: themeColors.success }]}>
                                                    <Text style={styles.saveText}>SAVE 17%</Text>
                                                </View>
                                            )}
                                        </View>
                                        <View style={styles.priceContainer}>
                                            <Text style={[styles.price, { color: themeColors.text }]}>
                                                {pack.product.priceString}
                                            </Text>
                                            <Text style={[styles.period, { color: themeColors.textSecondary }]}>
                                                /{isAnnual ? 'year' : 'mo'}
                                            </Text>
                                        </View>
                                    </TouchableOpacity>
                                );
                            })
                        )}
                    </View>
                </ScrollView>

                <View style={[styles.footer, { borderTopColor: themeColors.border }]}>
                    <TouchableOpacity
                        style={[styles.purchaseButton, { backgroundColor: themeColors.primary }]}
                        onPress={handlePurchase}
                        disabled={purchasing !== null || loading}
                    >
                        {purchasing ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.purchaseButtonText}>
                                Subscribe Now
                            </Text>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity onPress={handleRestore} style={styles.restoreButton}>
                        <Text style={[styles.restoreText, { color: themeColors.textSecondary }]}>
                            Restore Purchases
                        </Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        padding: spacing.md,
        alignItems: 'flex-end',
    },
    closeButton: {
        padding: spacing.xs,
    },
    content: {
        padding: spacing.lg,
    },
    hero: {
        alignItems: 'center',
        marginBottom: spacing.xl,
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    title: {
        ...typography.h1,
        textAlign: 'center',
        marginBottom: spacing.xs,
    },
    subtitle: {
        ...typography.body,
        textAlign: 'center',
        opacity: 0.8,
    },
    featuresList: {
        gap: spacing.md,
        marginBottom: spacing.xl,
    },
    featureRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
    },
    featureText: {
        ...typography.body,
        fontWeight: '500',
    },
    packagesContainer: {
        gap: spacing.md,
    },
    packageCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: spacing.md,
        borderRadius: 12,
        borderWidth: 2,
    },
    packageInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    packageTitle: {
        ...typography.h3,
    },
    saveBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    saveText: {
        ...typography.caption,
        color: '#fff',
        fontWeight: 'bold',
    },
    priceContainer: {
        alignItems: 'flex-end',
    },
    price: {
        ...typography.h3,
    },
    period: {
        ...typography.caption,
    },
    footer: {
        padding: spacing.lg,
        borderTopWidth: 1,
        gap: spacing.md,
    },
    purchaseButton: {
        padding: spacing.md,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    purchaseButtonText: {
        ...typography.body,
        color: '#fff',
        fontWeight: 'bold',
    },
    restoreButton: {
        alignItems: 'center',
    },
    restoreText: {
        ...typography.bodySmall,
    },
});
