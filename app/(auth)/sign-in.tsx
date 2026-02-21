import { View, Text, Pressable, Platform, Alert } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { supabase } from '@/lib/supabase';

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
      const redirectTo = Linking.createURL('auth/callback');

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          skipBrowserRedirect: true,
        },
      });

      if (error) {
        Alert.alert('Sign In Error', error.message);
        return;
      }

      if (data.url) {
        const result = await WebBrowser.openAuthSessionAsync(
          data.url,
          redirectTo,
        );

        if (result.type === 'success' && result.url) {
          // Extract tokens from the redirect URL hash fragment
          const url = result.url;
          const hashParams = new URLSearchParams(
            url.includes('#') ? url.split('#')[1] : '',
          );

          const accessToken = hashParams.get('access_token');
          const refreshToken = hashParams.get('refresh_token');

          if (accessToken && refreshToken) {
            await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });
          }
        }
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
