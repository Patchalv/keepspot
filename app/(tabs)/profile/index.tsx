import { View, Text, Pressable, Alert } from 'react-native';
import { supabase } from '@/lib/supabase';

export default function ProfileScreen() {
  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      Alert.alert('Error', error.message);
    }
  };

  return (
    <View className="flex-1 items-center justify-center bg-white">
      <Text className="text-lg font-semibold">Profile</Text>
      <Pressable
        onPress={handleSignOut}
        className="mt-8 rounded-xl bg-red-500 px-8 py-3"
      >
        <Text className="text-base font-semibold text-white">Sign Out</Text>
      </Pressable>
    </View>
  );
}
