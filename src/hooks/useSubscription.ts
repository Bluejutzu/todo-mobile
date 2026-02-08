import { useEffect } from 'react';
import { useSubscriptionStore } from '../stores/subscriptionStore';
import { revenueCatService } from '../services/revenuecat';

export function useSubscription() {
  const store = useSubscriptionStore();

  useEffect(() => {
    // Check for daily reset on mount
    store.resetDailyUsage();
  }, []);

  const restorePurchases = async () => {
    try {
      await revenueCatService.restorePurchases();
      await store.refreshSubscription();
      return true;
    } catch (error) {
      console.error('Failed to restore purchases:', error);
      return false;
    }
  };

  return {
    ...store,
    restorePurchases,
    limits: store.getLimits(),
    isPremium: store.tier === 'premium',
  };
}
