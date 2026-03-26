import { Alert } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { EdgeFunctionError } from '@/lib/edge-function-error';
import { ERROR_CODES } from '@/lib/constants';

type PaywallTrigger = 'place_limit' | 'invite_limit';

export function useFreemiumGate() {
  const { t } = useTranslation();

  /** Returns true if the error was a freemium limit error (and was handled). */
  function handleMutationError(
    error: Error,
    trigger: PaywallTrigger = 'place_limit',
  ): boolean {
    if (
      error instanceof EdgeFunctionError &&
      error.code === ERROR_CODES.freemiumLimitExceeded
    ) {
      Alert.alert(
        t('common.upgradeRequired'),
        error.message,
        [
          { text: t('common.cancel'), style: 'cancel' },
          {
            text: t('common.viewPlans'),
            onPress: () => router.push(`/(tabs)/settings/paywall?trigger=${trigger}`),
          },
        ],
      );
      return true;
    }

    Alert.alert(t('common.error'), error.message);
    return false;
  }

  return { handleMutationError };
}
