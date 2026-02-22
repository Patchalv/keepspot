import { Redirect } from 'expo-router';
import { useAuth } from '@/hooks/use-auth';

export default function Index() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return null;

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/sign-in" />;
  }

  return <Redirect href="/(tabs)/explore" />;
}
