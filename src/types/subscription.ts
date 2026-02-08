import { CustomerInfo } from 'react-native-purchases';

export type SubscriptionTier = 'free' | 'premium';

export interface SubscriptionLimits {
  aiTokensPerRequest: number;
  aiRequestsPerDay: number;
  maxStorageBytes: number;
}

export interface SubscriptionFeatures {
  enhancedAI: boolean;
  largeStorage: boolean;
  prioritySupport: boolean;
}

export interface SubscriptionUsage {
  aiRequestsToday: number;
  storageUsedBytes: number;
  lastResetDate: string;
}

export interface Subscription {
  tier: SubscriptionTier;
  limits: SubscriptionLimits;
  features: SubscriptionFeatures;
  usage: SubscriptionUsage;
}

// Tier configurations
export const TIER_CONFIGS: Record<
  SubscriptionTier,
  { limits: SubscriptionLimits; features: SubscriptionFeatures }
> = {
  free: {
    limits: {
      aiTokensPerRequest: 10000,
      aiRequestsPerDay: 50,
      maxStorageBytes: 5 * 1024 * 1024, // 5MB
    },
    features: {
      enhancedAI: false,
      largeStorage: false,
      prioritySupport: false,
    },
  },
  premium: {
    limits: {
      aiTokensPerRequest: 100000,
      aiRequestsPerDay: -1, // unlimited
      maxStorageBytes: 50 * 1024 * 1024, // 50MB
    },
    features: {
      enhancedAI: true,
      largeStorage: true,
      prioritySupport: true,
    },
  },
};

export interface SubscriptionState {
  isActive: boolean;
  tier: SubscriptionTier;
  expirationDate?: string | null;
  customerInfo?: CustomerInfo;
}

// RevenueCat identifiers
export const REVENUECAT_ENTITLEMENTS = {
  PREMIUM: 'premium',
} as const;

export const REVENUECAT_OFFERINGS = {
  DEFAULT: 'default',
} as const;
