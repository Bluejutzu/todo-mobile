import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    SubscriptionUsage,
    TIER_CONFIGS,
    SubscriptionState,
} from '../types/subscription';
import { revenueCatService } from '../services/revenuecat';

interface SubscriptionStore extends SubscriptionState {
    usage: SubscriptionUsage;

    // Actions
    initialize: () => Promise<void>;
    refreshSubscription: () => Promise<void>;
    updateUsage: (usage: Partial<SubscriptionUsage>) => void;
    resetDailyUsage: () => void;

    // Getters
    hasFeature: (feature: keyof typeof TIER_CONFIGS.free.features) => boolean;
    getLimits: () => typeof TIER_CONFIGS.free.limits;
    checkLimit: (limit: keyof typeof TIER_CONFIGS.free.limits, value: number) => boolean;
}

const DEFAULT_USAGE: SubscriptionUsage = {
    aiRequestsToday: 0,
    storageUsedBytes: 0,
    lastResetDate: new Date().toISOString().split('T')[0],
};

export const useSubscriptionStore = create<SubscriptionStore>()(
    persist(
        (set, get) => ({
            isActive: false,
            tier: 'free',
            expirationDate: null,
            customerInfo: undefined,
            usage: DEFAULT_USAGE,

            initialize: async () => {
                await revenueCatService.initialize();
                await get().refreshSubscription();
            },

            refreshSubscription: async () => {
                const customerInfo = await revenueCatService.getCustomerInfo();
                const isPremium = revenueCatService.isPremium(customerInfo);

                set({
                    customerInfo: customerInfo || undefined,
                    isActive: isPremium,
                    tier: isPremium ? 'premium' : 'free',
                    expirationDate: customerInfo?.latestExpirationDate || null,
                });
            },

            updateUsage: (newUsage) => {
                set((state) => ({
                    usage: { ...state.usage, ...newUsage },
                }));
            },

            resetDailyUsage: () => {
                const today = new Date().toISOString().split('T')[0];
                const { usage } = get();

                if (usage.lastResetDate !== today) {
                    set({
                        usage: {
                            ...usage,
                            aiRequestsToday: 0,
                            lastResetDate: today,
                        },
                    });
                }
            },

            hasFeature: (feature) => {
                const { tier } = get();
                return TIER_CONFIGS[tier].features[feature];
            },

            getLimits: () => {
                const { tier } = get();
                return TIER_CONFIGS[tier].limits;
            },

            checkLimit: (limit, value) => {
                const limits = get().getLimits();
                const limitValue = limits[limit];

                if (limitValue === -1) return true; // Unlimited
                return value <= limitValue;
            },
        }),
        {
            name: 'subscription-storage',
            storage: createJSONStorage(() => AsyncStorage),
            partialize: (state) => ({ usage: state.usage }), // Only persist usage locally
        }
    )
);
