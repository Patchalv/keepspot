import '@/global.css';

import { useEffect, useRef } from 'react';
import { Slot, useRouter, useSegments } from 'expo-router';
import { useFonts } from 'expo-font';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';

export { ErrorBoundary } from 'expo-router';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
  },
});

function AuthGate({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const pendingDeepLink = useRef<string | null>(null);

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inInviteRoute = segments[0] === 'invite';

    if (!isAuthenticated && !inAuthGroup) {
      // Store invite deep link before redirecting to sign-in
      if (inInviteRoute && segments[1]) {
        pendingDeepLink.current = `/invite/${segments[1]}`;
      }
      router.replace('/(auth)/sign-in');
    } else if (isAuthenticated && inAuthGroup) {
      // After sign-in, redirect to pending deep link or explore
      if (pendingDeepLink.current) {
        const path = pendingDeepLink.current;
        pendingDeepLink.current = null;
        router.replace(path as never);
      } else {
        router.replace('/(tabs)/explore');
      }
    }
  }, [isAuthenticated, isLoading, segments]);

  return <>{children}</>;
}

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <BottomSheetModalProvider>
          <AuthGate>
            <Slot />
          </AuthGate>
        </BottomSheetModalProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
