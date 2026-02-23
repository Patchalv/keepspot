import { View, Text, Pressable } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({
  message = 'Something went wrong. Please try again.',
  onRetry,
}: ErrorStateProps) {
  return (
    <View className="flex-1 items-center justify-center bg-white px-8">
      <View className="mb-4 h-16 w-16 items-center justify-center rounded-full bg-red-100">
        <FontAwesome name="exclamation-circle" size={32} color="#EF4444" />
      </View>
      <Text className="mb-2 text-center text-lg font-semibold text-gray-900">
        Something went wrong
      </Text>
      <Text className="mb-8 text-center text-base text-gray-500">
        {message}
      </Text>
      {onRetry && (
        <Pressable
          onPress={onRetry}
          className="rounded-xl bg-blue-500 px-8 py-3 active:bg-blue-600"
        >
          <Text className="text-base font-semibold text-white">Try Again</Text>
        </Pressable>
      )}
    </View>
  );
}
