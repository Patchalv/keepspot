import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Purchases, { type PurchasesPackage } from 'react-native-purchases';
import { useAuth } from '@/hooks/use-auth';
import { updateUserProperties } from '@/lib/analytics';
import {
  configureRevenueCat,
  isRevenueCatReady,
  identifyUser,
  getOfferings,
  purchasePackage,
  restorePurchases,
  isPremium,
} from '@/lib/revenuecat';
import type { Profile } from '@/types';

export function useRevenueCat() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Configure SDK and identify user when authenticated
  useEffect(() => {
    if (!user) return;

    configureRevenueCat();

    if (!isRevenueCatReady()) return;

    identifyUser(user.id).then(async () => {
      // Sync entitlement to profile cache as client-side fallback
      try {
        const customerInfo = await Purchases.getCustomerInfo();
        const premium = isPremium(customerInfo);
        updateUserProperties({ entitlement: premium ? 'premium' : 'free' });
        queryClient.setQueryData<Profile>(['profile'], (old) => {
          if (!old) return old;
          return { ...old, entitlement: premium ? 'premium' : 'free' };
        });
      } catch {
        // Non-critical — webhook will handle server-side sync
      }
    });
  }, [user, queryClient]);

  // Listen for real-time purchase events
  useEffect(() => {
    if (!isRevenueCatReady()) return;

    const listener = (customerInfo: import('react-native-purchases').CustomerInfo) => {
      const premium = isPremium(customerInfo);
      updateUserProperties({ entitlement: premium ? 'premium' : 'free' });
      // Cancel in-flight refetches so they don't overwrite this update
      queryClient.cancelQueries({ queryKey: ['profile'] });
      queryClient.setQueryData<Profile>(['profile'], (old) => {
        if (!old) return old;
        return { ...old, entitlement: premium ? 'premium' : 'free' };
      });
    };

    Purchases.addCustomerInfoUpdateListener(listener);
    return () => {
      Purchases.removeCustomerInfoUpdateListener(listener);
    };
  }, [queryClient]);

  const offerings = useQuery({
    queryKey: ['rc-offerings'],
    queryFn: getOfferings,
    staleTime: 30 * 60 * 1000, // 30 minutes
    enabled: !!user && isRevenueCatReady(),
  });

  const purchase = useMutation({
    mutationFn: (pkg: PurchasesPackage) => purchasePackage(pkg),
    onSuccess: (customerInfo) => {
      const premium = isPremium(customerInfo);
      queryClient.cancelQueries({ queryKey: ['profile'] });
      queryClient.setQueryData<Profile>(['profile'], (old) => {
        if (!old) return old;
        return { ...old, entitlement: premium ? 'premium' : 'free' };
      });
      // Delayed invalidation — gives webhook time to update DB
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['profile'] });
      }, 10_000);
    },
  });

  const restore = useMutation({
    mutationFn: restorePurchases,
    onSuccess: (customerInfo) => {
      const premium = isPremium(customerInfo);
      queryClient.cancelQueries({ queryKey: ['profile'] });
      queryClient.setQueryData<Profile>(['profile'], (old) => {
        if (!old) return old;
        return { ...old, entitlement: premium ? 'premium' : 'free' };
      });
      // Delayed invalidation — gives webhook time to update DB
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['profile'] });
      }, 10_000);
    },
  });

  return {
    offerings: offerings.data,
    isLoadingOfferings: offerings.isLoading,
    purchase: purchase.mutate,
    purchaseAsync: purchase.mutateAsync,
    isPurchasing: purchase.isPending,
    restore: restore.mutate,
    isRestoring: restore.isPending,
  };
}
