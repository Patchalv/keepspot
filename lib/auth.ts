import * as WebBrowser from 'expo-web-browser';
import * as AppleAuthentication from 'expo-apple-authentication';
import { makeRedirectUri } from 'expo-auth-session';
import { supabase } from '@/lib/supabase';

export async function signInWithGoogle(): Promise<
  { success: true } | { success: false; error: string }
> {
  const redirectTo = makeRedirectUri({ scheme: 'mapvault' });
  if (__DEV__) {
    console.log('[Auth] Redirect URI:', redirectTo);
  }

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

export async function signInWithApple(): Promise<
  { success: true } | { success: false; error: string }
> {
  const credential = await AppleAuthentication.signInAsync({
    requestedScopes: [
      AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
      AppleAuthentication.AppleAuthenticationScope.EMAIL,
    ],
  });

  if (!credential.identityToken) {
    return { success: false, error: 'No identity token received from Apple.' };
  }

  const { error } = await supabase.auth.signInWithIdToken({
    provider: 'apple',
    token: credential.identityToken,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  // Apple only provides full name on first sign-in — persist it now or lose it
  if (credential.fullName?.givenName) {
    const fullName = [credential.fullName.givenName, credential.fullName.familyName]
      .filter(Boolean)
      .join(' ');
    await supabase.auth.updateUser({
      data: {
        full_name: fullName,
        given_name: credential.fullName.givenName,
        family_name: credential.fullName.familyName ?? undefined,
      },
    });

    // Sync to profiles table (trigger already fired with NULL before updateUser ran)
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('profiles').update({ display_name: fullName }).eq('id', user.id);
    }
  }

  return { success: true };
}
