import { View, Text, ActivityIndicator } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

export default function InviteScreen() {
  const { token } = useLocalSearchParams<{ token: string }>();

  return (
    <View className="flex-1 items-center justify-center bg-white">
      <ActivityIndicator size="large" />
      <Text className="mt-4 text-base text-gray-500">
        Processing invite...
      </Text>
    </View>
  );
}
