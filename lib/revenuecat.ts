import { Platform } from 'react-native';
import Purchases, {
  LOG_LEVEL,
  type CustomerInfo,
  type PurchasesOfferings,
  type PurchasesPackage,
} from 'react-native-purchases';
import Constants from 'expo-constants';

let isConfigured = false;

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
  await Purchases.logOut();
}

export async function getOfferings(): Promise<PurchasesOfferings> {
  return Purchases.getOfferings();
}

export async function purchasePackage(
  pkg: PurchasesPackage,
): Promise<CustomerInfo> {
  const { customerInfo } = await Purchases.purchasePackage(pkg);
  return customerInfo;
}

export async function restorePurchases(): Promise<CustomerInfo> {
  return Purchases.restorePurchases();
}

export async function getCustomerInfo(): Promise<CustomerInfo> {
  return Purchases.getCustomerInfo();
}

export function isPremium(customerInfo: CustomerInfo): boolean {
  return !!customerInfo.entitlements.active['premium'];
}
