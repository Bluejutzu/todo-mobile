import Purchases, { PurchasesOffering, PurchasesPackage, CustomerInfo, LOG_LEVEL } from 'react-native-purchases';
import { Platform } from 'react-native';
import { REVENUECAT_ENTITLEMENTS } from '../types/subscription';

// Mock Mode Configuration
const MOCK_MODE = true;

// Mock State - tracks if user has purchased premium in mock mode
let mockHasPremium = false;

const MOCK_PACKAGES = [
    {
        identifier: '$rc_monthly',
        packageType: 'MONTHLY',
        product: {
            identifier: 'premium_monthly',
            description: 'Premium Monthly Subscription',
            title: 'Premium Monthly',
            price: 9.99,
            priceString: '$9.99',
            currencyCode: 'USD',
            introPrice: null,
            discounts: [],
            productCategory: 'SUBSCRIPTION',
            productType: 'AUTO_RENEWABLE_SUBSCRIPTION',
            subscriptionPeriod: 'P1M',
        },
        offeringIdentifier: 'default',
    },
    {
        identifier: '$rc_annual',
        packageType: 'ANNUAL',
        product: {
            identifier: 'premium_yearly',
            description: 'Premium Yearly Subscription',
            title: 'Premium Yearly',
            price: 99.99,
            priceString: '$99.99',
            currencyCode: 'USD',
            introPrice: null,
            discounts: [],
            productCategory: 'SUBSCRIPTION',
            productType: 'AUTO_RENEWABLE_SUBSCRIPTION',
            subscriptionPeriod: 'P1Y',
        },
        offeringIdentifier: 'default',
    },
];

const MOCK_OFFERING: PurchasesOffering = {
    identifier: 'default',
    serverDescription: 'Default Offering',
    metadata: {},
    availablePackages: MOCK_PACKAGES as any,
    lifetime: null,
    annual: MOCK_PACKAGES[1] as any,
    sixMonth: null,
    threeMonth: null,
    twoMonth: null,
    monthly: MOCK_PACKAGES[0] as any,
    weekly: null,
};

const MOCK_CUSTOMER_INFO_PREMIUM: CustomerInfo = {
    entitlements: {
        all: {
            [REVENUECAT_ENTITLEMENTS.PREMIUM]: {
                identifier: REVENUECAT_ENTITLEMENTS.PREMIUM,
                isActive: true,
                willRenew: true,
                periodType: 'NORMAL',
                latestPurchaseDate: new Date().toISOString(),
                originalPurchaseDate: new Date().toISOString(),
                expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                store: 'APP_STORE',
                productIdentifier: 'premium_monthly',
                isSandbox: true,
                unsubscribeDetectedAt: null,
                billingIssueDetectedAt: null,
            },
        },
        active: {
            [REVENUECAT_ENTITLEMENTS.PREMIUM]: {
                identifier: REVENUECAT_ENTITLEMENTS.PREMIUM,
                isActive: true,
                willRenew: true,
                periodType: 'NORMAL',
                latestPurchaseDate: new Date().toISOString(),
                originalPurchaseDate: new Date().toISOString(),
                expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                store: 'APP_STORE',
                productIdentifier: 'premium_monthly',
                isSandbox: true,
                unsubscribeDetectedAt: null,
                billingIssueDetectedAt: null,
            },
        },
    },
    activeSubscriptions: ['premium_monthly'],
    allPurchasedProductIdentifiers: ['premium_monthly'],
    nonSubscriptionTransactions: [],
    latestExpirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    firstSeen: new Date().toISOString(),
    originalAppUserId: 'mock-user-id',
    requestDate: new Date().toISOString(),
    managementURL: null,
    originalApplicationVersion: '1.0',
    originalPurchaseDate: new Date().toISOString(),
} as any;

const MOCK_CUSTOMER_INFO_FREE: CustomerInfo = {
    entitlements: {
        all: {},
        active: {},
    },
    activeSubscriptions: [],
    allPurchasedProductIdentifiers: [],
    nonSubscriptionTransactions: [],
    latestExpirationDate: null,
    firstSeen: new Date().toISOString(),
    originalAppUserId: 'mock-user-id',
    requestDate: new Date().toISOString(),
    managementURL: null,
    originalApplicationVersion: '1.0',
    originalPurchaseDate: null,
} as any;

export const revenueCatService = {
    async initialize(userId?: string) {
        if (MOCK_MODE) {
            console.log('RevenueCat initialized in MOCK MODE');
            return;
        }

        try {
            if (Platform.OS === 'ios') {
                Purchases.configure({ apiKey: process.env.EXPO_PUBLIC_RC_IOS_KEY || 'placeholder' });
            } else if (Platform.OS === 'android') {
                Purchases.configure({ apiKey: process.env.EXPO_PUBLIC_RC_ANDROID_KEY || 'placeholder' });
            }

            if (userId) {
                await Purchases.logIn(userId);
            }

            await Purchases.setLogLevel(LOG_LEVEL.DEBUG);
        } catch (error) {
            console.error('Error initializing RevenueCat:', error);
        }
    },

    async getOfferings(): Promise<PurchasesOffering | null> {
        if (MOCK_MODE) {
            return new Promise(resolve => setTimeout(() => resolve(MOCK_OFFERING), 500));
        }

        try {
            const offerings = await Purchases.getOfferings();
            return offerings.current;
        } catch (error) {
            console.error('Error fetching offerings:', error);
            return null;
        }
    },

    async purchasePackage(pack: PurchasesPackage): Promise<{ customerInfo: CustomerInfo; productIdentifier: string }> {
        if (MOCK_MODE) {
            mockHasPremium = true; // Set premium status
            return new Promise(resolve =>
                setTimeout(() => resolve({
                    customerInfo: MOCK_CUSTOMER_INFO_PREMIUM,
                    productIdentifier: pack.product.identifier
                }), 1000)
            );
        }

        try {
            const { customerInfo, productIdentifier } = await Purchases.purchasePackage(pack);
            return { customerInfo, productIdentifier };
        } catch (error: any) {
            if (!error.userCancelled) {
                console.error('Error purchasing package:', error);
            }
            throw error;
        }
    },

    async restorePurchases(): Promise<CustomerInfo> {
        if (MOCK_MODE) {
            mockHasPremium = true; // Set premium status on restore
            return new Promise(resolve => setTimeout(() => resolve(MOCK_CUSTOMER_INFO_PREMIUM), 1000));
        }

        try {
            const customerInfo = await Purchases.restorePurchases();
            return customerInfo;
        } catch (error) {
            console.error('Error restoring purchases:', error);
            throw error;
        }
    },

    async getCustomerInfo(): Promise<CustomerInfo | null> {
        if (MOCK_MODE) {
            // Return premium or free customer info based on mock state
            return mockHasPremium ? MOCK_CUSTOMER_INFO_PREMIUM : MOCK_CUSTOMER_INFO_FREE;
        }

        try {
            const customerInfo = await Purchases.getCustomerInfo();
            return customerInfo;
        } catch (error) {
            console.error('Error getting customer info:', error);
            return null;
        }
    },

    isPremium(customerInfo: CustomerInfo | null): boolean {
        if (!customerInfo) return false;
        return customerInfo.entitlements.active[REVENUECAT_ENTITLEMENTS.PREMIUM] !== undefined;
    },

    // Helper function to reset mock premium status (for testing)
    resetMockPremium() {
        if (MOCK_MODE) {
            mockHasPremium = false;
            console.log('Mock premium status reset to free');
        }
    }
};
