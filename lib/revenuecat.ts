import { Platform } from 'react-native';
import Purchases, {
  LOG_LEVEL,
  type CustomerInfo,
  type PurchasesOfferings,
  type PurchasesPackage,
} from 'react-native-purchases';
import Constants from 'expo-constants';

let isConfigured = false;

export function isRevenueCatReady(): boolean {
  return isConfigured;
}

export function configureRevenueCat(): void {
  if (isConfigured) return;

  const apiKey =
    (Constants.expoConfig?.extra?.revenueCatAppleApiKey as string) ?? '';

  if (!apiKey) {
    console.warn('RevenueCat: No API key configured');
    return;
  }

  Purchases.configure({
    apiKey,
    appUserID: null, // anonymous until login
  });

  if (__DEV__) {
    Purchases.setLogLevel(LOG_LEVEL.DEBUG);
  }

  isConfigured = true;
}

export async function identifyUser(userId: string): Promise<void> {
  if (!isConfigured) return;
  await Purchases.logIn(userId);
}

export async function logOutUser(): Promise<void> {
  if (!isConfigured) return;
  try {
    await Purchases.logOut();
  } catch {
    // Swallow errors (e.g. "user is anonymous") to avoid blocking sign-out
  }
}

export async function getOfferings(): Promise<PurchasesOfferings | null> {
  if (!isConfigured) return null;
  return Purchases.getOfferings();
}

export async function purchasePackage(
  pkg: PurchasesPackage,
): Promise<CustomerInfo> {
  if (!isConfigured) {
    throw new Error('RevenueCat is not configured');
  }
  const { customerInfo } = await Purchases.purchasePackage(pkg);
  return customerInfo;
}

export async function restorePurchases(): Promise<CustomerInfo> {
  if (!isConfigured) {
    throw new Error('RevenueCat is not configured');
  }
  return Purchases.restorePurchases();
}

export async function getCustomerInfo(): Promise<CustomerInfo | null> {
  if (!isConfigured) return null;
  return Purchases.getCustomerInfo();
}

export function isPremium(customerInfo: CustomerInfo): boolean {
  return !!customerInfo.entitlements.active['premium'];
}
