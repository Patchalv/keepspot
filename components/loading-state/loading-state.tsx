import { View, Text, ActivityIndicator } from 'react-native';

interface LoadingStateProps {
  message?: string;
}

export function LoadingState({ message }: LoadingStateProps) {
  return (
    <View className="flex-1 items-center justify-center bg-white">
      <ActivityIndicator size="large" color="#3B82F6" />
      {message && (
        <Text className="mt-4 text-base text-gray-500">{message}</Text>
      )}
    </View>
  );
}
