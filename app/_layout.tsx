import '@/global.css';

import { useEffect, useRef } from 'react';
import { Slot, useRouter, useSegments } from 'expo-router';
import { useFonts } from 'expo-font';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PostHogProvider, usePostHog } from 'posthog-react-native';
import { useAuth } from '@/hooks/use-auth';
import { setPostHogInstance } from '@/lib/analytics';
import * as Sentry from '@sentry/react-native';

Sentry.init({
  dsn: 'https://039a0687d8e49c793aa0b1eb08e07ded@o4508054876061696.ingest.de.sentry.io/4510937169592400',

  // Adds more context data to events (IP address, cookies, user, etc.)
  // For more information, visit: https://docs.sentry.io/platforms/react-native/data-management/data-collected/
  sendDefaultPii: true,

  // Enable Logs
  enableLogs: true,

  // Configure Session Replay
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1,
  integrations: [Sentry.mobileReplayIntegration()],

  // uncomment the line below to enable Spotlight (https://spotlightjs.com)
  // spotlight: __DEV__,
});

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

function PostHogConnector({ children }: { children: React.ReactNode }) {
  const posthog = usePostHog();
  useEffect(() => {
    if (posthog) setPostHogInstance(posthog);
  }, [posthog]);
  return <>{children}</>;
}

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

export default Sentry.wrap(function RootLayout() {
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
      <PostHogProvider
        apiKey={process.env.EXPO_PUBLIC_POSTHOG_API_KEY!}
        options={{
          host: process.env.EXPO_PUBLIC_POSTHOG_HOST!,
          enableSessionReplay: false,
          captureAppLifecycleEvents: true,
        }}
        autocapture={{
          captureScreens: true,
          captureTouches: false,
        }}
      >
        <PostHogConnector>
          <QueryClientProvider client={queryClient}>
            <BottomSheetModalProvider>
              <AuthGate>
                <Slot />
              </AuthGate>
            </BottomSheetModalProvider>
          </QueryClientProvider>
        </PostHogConnector>
      </PostHogProvider>
    </GestureHandlerRootView>
  );
});