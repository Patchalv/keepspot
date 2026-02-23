# Troubleshooting

Common issues and their solutions, organized by area.

## Supabase & Database

### RLS Recursion Error (42P17)

**Symptom:** Queries on `map_members` or related tables fail with PostgreSQL error `42P17` (infinite recursion detected in policy).

**Cause:** An RLS policy on `map_members` that queries `map_members` to check membership creates a circular dependency.

**Fix:** This was fixed in migration `20260222000001`. The `is_map_member()` SECURITY DEFINER function bypasses RLS for the membership check. If you see this error on a new table, follow the same pattern — create a SECURITY DEFINER helper instead of self-referencing in the policy.

### Edge Function Returns 401 Despite Valid Token

**Symptom:** Calls to Edge Functions fail with 401 even though the user is signed in.

**Cause:** Edge Functions are deployed with `--no-verify-jwt` because the Supabase relay's JWT verification rejects ES256 tokens. If you deployed without this flag, the relay rejects the token before your function code runs.

**Fix:** Always deploy with `--no-verify-jwt`:
```bash
supabase functions deploy <name> --no-verify-jwt
```

### Freemium Limit Errors in Development

**Symptom:** "Free accounts are limited to..." error when testing, even though you want to bypass limits.

**Fix:** Set your test user's entitlement to `premium` directly in Supabase:
```sql
UPDATE profiles SET entitlement = 'premium' WHERE id = '<your-user-id>';
```

Freemium limits are enforced server-side in Edge Functions, so there's no client-side toggle.

### Place Insert Fails with 23505

**Symptom:** Adding a place returns a Postgres `23505` error (unique constraint violation).

**Cause:** The `places` table deduplicates by `google_place_id`. If two users add the same place simultaneously, both inserts race.

**Not a bug:** The `add-place` Edge Function catches `23505` and fetches the existing place instead. If you see this in logs, it's working as intended. If the error surfaces to the user, check that the catch block in the Edge Function is intact.

## Mapbox

### Emoji Markers Not Rendering on iOS

**Symptom:** Map markers show colored circles but no emoji text.

**Cause:** Mapbox `PointAnnotation` converts children to a bitmap on iOS, which drops emoji rendering.

**Fix:** Use `MarkerView` instead of `PointAnnotation`. This renders actual React Native views. See `components/map-markers/map-markers.tsx` for the current implementation.

### Map Blank or Token Error

**Symptom:** Map area is blank or console shows Mapbox token errors.

**Fix:**
1. Check `EXPO_PUBLIC_MAPBOX_TOKEN` is set in `.env`
2. Verify the token has the `Vector Tiles` scope in your [Mapbox account](https://account.mapbox.com/)
3. Token works on simulator — no device-specific restrictions needed

## RevenueCat & Payments

### RevenueCat Errors in Development

**Symptom:** Console spam about RevenueCat errors, or sign-out fails.

**Not a bug:** RevenueCat is intentionally disabled in development builds. The API key is set to an empty string when `APP_VARIANT=development`. You'll see `RevenueCat: No API key configured` in the console — this is expected.

**To test payments:** Use the `development:payments` build profile on a physical device. See `docs/payments.md` for the full testing guide.

### Paywall Shows Fallback Price

**Symptom:** Paywall shows "€9.99/year" immediately without a loading spinner.

**Cause:** RevenueCat offerings failed to load, so the UI falls back to the hardcoded price.

**Check:**
- Are you on a `development:payments` or production build? (dev builds have RevenueCat disabled)
- Is the RevenueCat API key valid and set in EAS secrets?
- Check Metro logs for RevenueCat initialization errors

### Webhook Not Updating Entitlement

**Symptom:** Purchase succeeds in RevenueCat dashboard but `profiles.entitlement` stays `free`.

**Check:**
1. Is the webhook URL correct in RevenueCat dashboard? (`https://<ref>.supabase.co/functions/v1/revenuecat-webhook`)
2. Does the Bearer token in RevenueCat match `REVENUECAT_WEBHOOK_SECRET` in Supabase secrets?
3. Is the Edge Function deployed? Check with: `curl -s -o /dev/null -w "%{http_code}" https://<ref>.supabase.co/functions/v1/revenuecat-webhook`
4. Check Supabase Edge Function logs for errors

## Google Places API

### Search Returns No Results

**Symptom:** Place search shows nothing or returns generic results.

**Check:**
- `EXPO_PUBLIC_GOOGLE_PLACES_API_KEY` is set in `.env`
- The key has "Places API (New)" enabled in Google Cloud Console
- The key's iOS bundle ID restriction matches your build variant's bundle ID
- If no location permission granted, search results lack location bias (expected — results are just less relevant)

## Auth & Sign-In

### Deep Links Don't Work in Dev

**Symptom:** Tapping `https://mapvault.app/invite/...` links doesn't open the app in development.

**Cause:** Associated Domains (`applinks:mapvault.app`) only work with the production bundle ID. Dev and preview builds can't handle domain-based deep links.

**Fix:** Use scheme-based links for testing: `mapvault://invite/<token>`

### crypto.randomUUID() Crash

**Symptom:** App crashes when creating invite tokens.

**Cause:** The Web Crypto API isn't available in React Native.

**Fix:** Use `expo-crypto` instead:
```typescript
import * as Crypto from 'expo-crypto';
const token = Crypto.randomUUID();
```

This is already fixed in `hooks/use-create-invite.ts` but watch for it if writing new code that needs UUIDs.

## Build & Dev Server

### Wrong Dev Server Command for Payment Testing

**Symptom:** Payment testing build can't connect to dev server, or RevenueCat is disabled.

**Cause:** Using `npm run start:dev` sets `APP_VARIANT=development`, which disables RevenueCat.

**Fix:** For the `development:payments` build, use:
```bash
npx expo start --dev-client
```
Not `npm run start:dev`.

### Stale Screen After Navigation

**Symptom:** Navigating between tabs shows stale data from a previous screen.

**Cause:** Expo Router preserves screen state within tab stacks. Screens need to be explicitly dismissed or data needs to be reset.

**Pattern:** Use `router.replace()` instead of `router.push()` when the previous screen shouldn't persist, or reset form state in a `useFocusEffect` callback.

### Build Fails After Adding Native Module

**Symptom:** JS-only dev server works but the built app crashes or shows a module not found error.

**Cause:** Native modules require a new dev client build. OTA updates can't deliver native code.

**Fix:** Rebuild the dev client:
```bash
eas build --profile development:simulator --platform ios
```

## Analytics (PostHog)

### Events Silently Dropped

**Symptom:** PostHog dashboard shows no events, but no errors in console.

**Cause:** If PostHog isn't initialized when an event fires, the event is silently dropped (not queued).

**Check:**
- `EXPO_PUBLIC_POSTHOG_API_KEY` and `EXPO_PUBLIC_POSTHOG_HOST` are set in `.env`
- In dev mode, look for: `[Analytics] PostHog not initialized, dropping event: <name>`
- Events during app startup may be lost if PostHog hasn't finished initializing
