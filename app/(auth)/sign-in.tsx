import { View, Text, Pressable, Platform, Alert } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import { supabase } from '@/lib/supabase';
import { signInWithGoogle } from '@/lib/auth';

export default function SignInScreen() {
  const handleAppleSignIn = async () => {
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      if (!credential.identityToken) {
        Alert.alert('Error', 'No identity token received from Apple.');
        return;
      }

      const { error } = await supabase.auth.signInWithIdToken({
        provider: 'apple',
        token: credential.identityToken,
      });

      if (error) {
        Alert.alert('Sign In Error', error.message);
      }
    } catch (e: unknown) {
      const error = e as { code?: string };
      if (error.code !== 'ERR_REQUEST_CANCELED') {
        Alert.alert('Error', 'An unexpected error occurred.');
      }
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const result = await signInWithGoogle();
      if (!result.success) {
        Alert.alert('Sign In Error', result.error);
      }
    } catch {
      Alert.alert('Error', 'An unexpected error occurred.');
    }
  };

  return (
    <View className="flex-1 items-center justify-center bg-white px-8">
      <Text className="mb-2 text-3xl font-bold">Keepspot</Text>
      <Text className="mb-12 text-base text-gray-500">
        Save places you love.
      </Text>

      <View className="w-full gap-4">
        {Platform.OS === 'ios' && (
          <AppleAuthentication.AppleAuthenticationButton
            buttonType={
              AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN
            }
            buttonStyle={
              AppleAuthentication.AppleAuthenticationButtonStyle.BLACK
            }
            cornerRadius={12}
            style={{ width: '100%', height: 52 }}
            onPress={handleAppleSignIn}
          />
        )}

        <Pressable
          onPress={handleGoogleSignIn}
          className="h-[52px] w-full items-center justify-center rounded-xl border border-gray-300 bg-white"
        >
          <Text className="text-base font-semibold text-gray-800">
            Continue with Google
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
