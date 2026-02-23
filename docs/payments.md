# Payments & Freemium System

## Architecture Overview

MapVault uses a freemium model with an annual subscription at €9.99/year via RevenueCat (iOS In-App Purchases).

### Entitlement Flow

```
User taps Subscribe → RevenueCat SDK → Apple StoreKit → Receipt validated
    → RevenueCat fires webhook → Edge Function updates profiles.entitlement
    → Client reads updated entitlement on next query/refresh
```

### Free Tier Limits

Defined in `lib/constants.ts`:
- **1 map** (owned maps only — editor access to shared maps doesn't count)
- **50 places** (total across all maps, counted by `added_by`)

### Key Files

| File | Role |
|---|---|
| `lib/revenuecat.ts` | SDK wrapper: configure, identify, purchase, restore, getOfferings |
| `hooks/use-revenuecat.ts` | React hook: offerings query, purchase/restore mutations, real-time listener |
| `hooks/use-freemium-gate.ts` | Catches `FREEMIUM_LIMIT_EXCEEDED` errors from Edge Functions, shows upgrade alert |
| `app/(tabs)/profile/paywall.tsx` | Paywall screen: feature comparison, annual pricing, subscribe/restore buttons |
| `app/(tabs)/profile/index.tsx` | Profile screen: entitlement badge, map creation gating |
| `supabase/functions/revenuecat-webhook/index.ts` | Webhook: receives RevenueCat events, updates `profiles.entitlement` |
| `supabase/functions/create-map/index.ts` | Edge Function: enforces 1-map limit for free users |
| `supabase/functions/add-place/index.ts` | Edge Function: enforces 50-place limit for free users |
| `lib/constants.ts` | Free tier limits, entitlement values, error codes |

### How Entitlements Work

1. **Database source of truth:** `profiles.entitlement` column (`'free'` or `'premium'`)
2. **Server-side enforcement:** Edge Functions (`create-map`, `add-place`) check entitlement before mutations. Free users exceeding limits get a `403` with code `FREEMIUM_LIMIT_EXCEEDED`.
3. **Client-side display:** The profile hook reads entitlement to show badge and gate UI. The `useFreemiumGate` hook catches limit errors from mutations and shows an upgrade alert.
4. **Webhook updates:** RevenueCat sends events to the webhook Edge Function, which updates `profiles.entitlement` directly using the Supabase service role key.
5. **Client-side sync fallback:** `use-revenuecat.ts` listens for `CustomerInfoUpdate` events and syncs entitlement to the profile cache, so the UI updates even before the webhook roundtrip completes.

### Webhook Event Handling

| Event Type | Action |
|---|---|
| `INITIAL_PURCHASE`, `RENEWAL`, `UNCANCELLATION`, `NON_RENEWING_PURCHASE`, `PRODUCT_CHANGE` | Set `entitlement = 'premium'` |
| `EXPIRATION`, `REFUND` | Set `entitlement = 'free'` |
| `CANCELLATION`, `BILLING_ISSUE`, etc. | No action (subscription still active until period ends) |
| Anonymous user (`$RCAnonymousID:*`) | Skipped — no DB update |

### Paywall

- **Annual-only** subscription at €9.99/year
- Price loaded dynamically from RevenueCat offerings (`offerings.current.annual`)
- Falls back to hardcoded `€9.99/year` if offerings fail to load
- Shows "You're Premium!" screen if user already has premium entitlement
- Restore Purchases button for users who reinstall or switch devices

---

## External Service Configuration

### RevenueCat Dashboard

- **Project:** MapVault
- **Apps:** Production (`com.patrickalvarez.mapvault`) — this is the only app that works with App Store Connect
- **Product:** `com.patrickalvarez.mapvault.premium.annual` (annual subscription)
- **Entitlement:** `premium` — product attached
- **Offering:** `default` with package `$rc_annual` pointing to the product
- **Webhook:** Configured to POST to `https://<ref>.supabase.co/functions/v1/revenuecat-webhook` with Bearer token auth

### App Store Connect

- **Subscription group:** "MapVault Premium"
- **Product ID:** `com.patrickalvarez.mapvault.premium.annual`
- **Sandbox testers:** Create at Users and Access > Sandbox > Test Accounts

### Supabase

- **Edge Function secrets** (set via dashboard or CLI):
  - `REVENUECAT_WEBHOOK_SECRET` — must match the Bearer token configured in RevenueCat webhook settings
  - `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` — auto-injected, no manual setup needed
- **Deploy edge functions:**
  ```bash
  supabase functions deploy revenuecat-webhook
  supabase functions deploy create-map
  supabase functions deploy add-place
  ```

### Environment Variables

| Variable | Where | Purpose |
|---|---|---|
| `EXPO_PUBLIC_REVENUECAT_API_KEY` | `.env` + EAS secrets | RevenueCat Apple API key, read at build time |
| `REVENUECAT_WEBHOOK_SECRET` | Supabase Edge Function secrets | Webhook auth, server-side only |

---

## Testing Guide

### Simulator Limitations

The iOS simulator **cannot** make real purchases or fetch products from App Store Connect. On simulator:
- Paywall shows the fallback price (€9.99) instead of the real App Store price
- Subscribe button will fail (StoreKit can't resolve the product)
- RevenueCat logs will show "Error fetching offerings"

This is expected. **Use a physical device** for all purchase testing (see `docs/builds.md` for the `development:payments` build profile).

### Webhook Testing (No Device Needed)

After deploying edge functions and setting the webhook secret, test with curl:

**Auth check (wrong secret):**
```bash
curl -s -X POST https://<ref>.supabase.co/functions/v1/revenuecat-webhook \
  -H "Authorization: Bearer wrong-secret" \
  -H "Content-Type: application/json" \
  -d '{"event":{"type":"INITIAL_PURCHASE","app_user_id":"test"}}'
# Expected: 401 {"error":"Unauthorized"}
```

**Grant event (INITIAL_PURCHASE):**
```bash
curl -s -X POST https://<ref>.supabase.co/functions/v1/revenuecat-webhook \
  -H "Authorization: Bearer <your-secret>" \
  -H "Content-Type: application/json" \
  -d '{"event":{"type":"INITIAL_PURCHASE","app_user_id":"<user-uuid>"}}'
# Expected: 200 — profiles.entitlement = 'premium'
```

**Revoke event (EXPIRATION):**
```bash
curl -s -X POST https://<ref>.supabase.co/functions/v1/revenuecat-webhook \
  -H "Authorization: Bearer <your-secret>" \
  -H "Content-Type: application/json" \
  -d '{"event":{"type":"EXPIRATION","app_user_id":"<user-uuid>"}}'
# Expected: 200 — profiles.entitlement = 'free'
```

**Anonymous user skip:**
```bash
curl -s -X POST https://<ref>.supabase.co/functions/v1/revenuecat-webhook \
  -H "Authorization: Bearer <your-secret>" \
  -H "Content-Type: application/json" \
  -d '{"event":{"type":"INITIAL_PURCHASE","app_user_id":"$RCAnonymousID:abc123"}}'
# Expected: 200 {"message":"Skipped anonymous user"}
```

**No-action event (CANCELLATION):**
```bash
curl -s -X POST https://<ref>.supabase.co/functions/v1/revenuecat-webhook \
  -H "Authorization: Bearer <your-secret>" \
  -H "Content-Type: application/json" \
  -d '{"event":{"type":"CANCELLATION","app_user_id":"<user-uuid>"}}'
# Expected: 200 {"message":"No action for event type: CANCELLATION"}
```

### On-Device Testing Flows

**Prerequisites:**
1. Build with `eas build --profile development:payments --platform ios` and install on physical device
2. Start dev server with `npx expo start --dev-client` (NOT `npm run start:dev` — that sets the dev variant)
3. Create a sandbox tester in App Store Connect (Users and Access > Sandbox > Test Accounts)
4. Sign into the sandbox account on device: Settings > App Store > Sandbox Account (iOS 16+)
5. Ensure `profiles.entitlement = 'free'` for your test user in Supabase

**Flow A — Free Tier Baseline:**
1. Sign in as test user (entitlement = free)
2. Profile tab shows "Free" badge (tappable)
3. Tap badge → navigates to paywall
4. Try creating a second map → "Map Limit Reached" alert
5. Try adding 51st place → freemium gate alert

**Flow B — Paywall & Offerings:**
1. Navigate to paywall (Profile > tap "Free" badge)
2. Should see loading spinner, then real App Store price (not fallback €9.99)
3. Subscribe button should be enabled
4. If price shows €9.99 with no spinner, offerings failed — check Metro logs

**Flow C — Sandbox Purchase:**
1. Tap Subscribe on paywall
2. iOS shows StoreKit purchase sheet (sandbox = instant, no real charge)
3. Confirm purchase
4. Verify: "Welcome to Premium!" alert, profile badge changes to "Premium"
5. Check Supabase: `profiles.entitlement = 'premium'`
6. Check RevenueCat dashboard: user shows `INITIAL_PURCHASE` event

**Flow D — Limits Lifted:**
1. With premium entitlement: create additional maps → no limit alert
2. Add places beyond 50 → no freemium gate

**Flow E — Restore Purchases:**
1. Sign out, sign back in → badge should show "Premium" (RevenueCat `logIn()` syncs)
2. Manually set `entitlement = 'free'` in Supabase
3. Go to paywall, tap "Restore Purchases"
4. Verify: "Restored!" alert, profile updates to premium

**Flow F — Sandbox Renewal & Expiration:**

Sandbox subscription timing is accelerated:

| Real Duration | Sandbox Duration |
|---|---|
| 1 year | ~1 hour |
| Renewal | ~5 minutes |

1. After purchase, observe RevenueCat dashboard for RENEWAL events
2. Each renewal triggers webhook — entitlement stays 'premium'
3. After ~6 renewals, sandbox stops renewing → EXPIRATION event fires
4. Verify entitlement reverts to 'free'
