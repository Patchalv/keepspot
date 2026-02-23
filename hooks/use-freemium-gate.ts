import { Alert } from 'react-native';
import { router } from 'expo-router';
import { EdgeFunctionError } from '@/lib/edge-function-error';
import { ERROR_CODES } from '@/lib/constants';

export function useFreemiumGate() {
  /** Returns true if the error was a freemium limit error (and was handled). */
  function handleMutationError(error: Error): boolean {
    if (
      error instanceof EdgeFunctionError &&
      error.code === ERROR_CODES.freemiumLimitExceeded
    ) {
      Alert.alert(
        'Upgrade Required',
        error.message,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'View Plans',
            onPress: () => router.push('/(tabs)/profile/paywall?trigger=place_limit'),
          },
        ],
      );
      return true;
    }

    Alert.alert('Error', error.message);
    return false;
  }

  return { handleMutationError };
}
