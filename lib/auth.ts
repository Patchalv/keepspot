import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
import { supabase } from '@/lib/supabase';

export async function signInWithGoogle(): Promise<
  { success: true } | { success: false; error: string }
> {
  const redirectTo = makeRedirectUri();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
      skipBrowserRedirect: true,
    },
  });

  if (error) {
    return { success: false, error: error.message };
  }

  if (!data.url) {
    return { success: false, error: 'No OAuth URL returned from Supabase.' };
  }

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);

  if (result.type !== 'success' || !result.url) {
    return { success: false, error: 'Authentication was cancelled.' };
  }

  const hashParams = new URLSearchParams(
    result.url.includes('#') ? result.url.split('#')[1] : '',
  );

  const accessToken = hashParams.get('access_token');
  const refreshToken = hashParams.get('refresh_token');

  if (!accessToken || !refreshToken) {
    return { success: false, error: 'Missing tokens in redirect URL.' };
  }

  const { error: sessionError } = await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  if (sessionError) {
    return { success: false, error: sessionError.message };
  }

  return { success: true };
}
