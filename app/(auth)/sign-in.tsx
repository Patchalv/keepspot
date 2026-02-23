import { signInWithApple, signInWithGoogle } from "@/lib/auth";
import AntDesign from "@expo/vector-icons/AntDesign";
import * as AppleAuthentication from "expo-apple-authentication";
import { useEffect, useState } from "react";
import { Alert, Image, Platform, Pressable, Text, View } from "react-native";

export default function SignInScreen() {
  const [appleAvailable, setAppleAvailable] = useState(false);

  useEffect(() => {
    if (Platform.OS === "ios") {
      AppleAuthentication.isAvailableAsync().then(setAppleAvailable);
    }
  }, []);
  const handleAppleSignIn = async () => {
    try {
      const result = await signInWithApple();
      if (!result.success) {
        Alert.alert("Sign In Error", result.error);
      }
    } catch (e: unknown) {
      const error = e as { code?: string };
      if (error.code !== "ERR_REQUEST_CANCELED") {
        Alert.alert("Error", "An unexpected error occurred.");
      }
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const result = await signInWithGoogle();
      if (!result.success) {
        Alert.alert("Sign In Error", result.error);
      }
    } catch {
      Alert.alert("Error", "An unexpected error occurred.");
    }
  };

  return (
    <View className="flex-1 items-center justify-center bg-cream px-8">
      <Image
        source={require("@/assets/images/splash-icon.png")}
        className="mb-4 h-32 w-32"
      />
      <Text className="mb-2 text-4xl font-bold">MapVault</Text>
      <Text className="mb-12 text-base text-gray-500">
        Save places you love.
      </Text>

      <View className="w-full gap-4">
        {appleAvailable && (
          <AppleAuthentication.AppleAuthenticationButton
            buttonType={
              AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN
            }
            buttonStyle={
              AppleAuthentication.AppleAuthenticationButtonStyle.BLACK
            }
            cornerRadius={12}
            style={{ width: "100%", height: 52 }}
            onPress={handleAppleSignIn}
          />
        )}

        <Pressable
          onPress={handleGoogleSignIn}
          className="h-[52px] w-full flex-row items-center justify-center gap-3 rounded-xl border border-gray-300 bg-white"
        >
          <AntDesign name="google" size={24} color="#4285F4" />
          <Text className="text-xl font-medium text-gray-800">
            Continue with Google
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
