# Android Launch — Manual Setup Steps

These are the external setup steps required for a full Android launch. Complete them in order.

---

## Step 1: Google Play Console Setup

1. **Create developer account** at https://play.google.com/console (one-time $25 fee)
2. **Create app:**
   - App name: `MapVault`
   - Package name: `com.patrickalvarez.mapvault`
   - Default language, free app
3. **Opt into Google Play App Signing** (recommended — Google manages the signing key)
4. **Update SHA256 fingerprint:**
   - After enrolling in Play App Signing, go to Play Console > Setup > App signing
   - Copy the SHA256 fingerprint from the "App signing key certificate" section
   - Update it in the mapvault-website's `assetlinks.json` route handler so Android App Links (deep links) verify correctly
5. **Create internal test track:**
   - Go to Testing > Internal testing > Create new release
   - Upload an initial AAB (see Step 3 below for how to build it)
6. **Add license testers:**
   - Play Console > Setup > License testing
   - Add your test Gmail accounts (these can make test purchases without being charged)

## Step 2: Google Play Service Account (for automated uploads)

1. Go to **Google Cloud Console** > IAM & Admin > Service Accounts > Create Service Account
2. Name it something like `mapvault-play-upload`
3. Grant the **"Service Account User"** role
4. Go to Keys tab > Add Key > Create new key > JSON
5. Save the downloaded JSON file as `keys/google-play-service-account.json` in the project root
6. Back in **Play Console** > Setup > API access:
   - Link the Google Cloud project if not already linked
   - Find the service account and click "Manage Play Console permissions"
   - Grant **"Release manager"** permission (under Release section)
   - Apply to the MapVault app
7. **Add `keys/` to `.gitignore`** if not already there (verify with `git check-ignore keys/`)

## Step 3: First Android Build

1. Run the first production build (EAS will prompt you to set up Android signing on the first build):
   ```bash
   eas build --platform android --profile production
   ```
2. Upload the resulting AAB to the internal test track in Play Console (Step 1.5)
3. Build a dev client for daily work:
   ```bash
   eas build --platform android --profile development
   ```
4. Install the APK on a physical Android device or emulator

## Step 4: RevenueCat Android Setup

1. **Add Google Play app** in RevenueCat dashboard:
   - Project > Apps > + New App > Google Play
   - Package name: `com.patrickalvarez.mapvault`
2. **Upload service account JSON** to RevenueCat:
   - App settings > Google Play service credentials
   - Upload the same `google-play-service-account.json` from Step 2
3. **Create subscription product** in Google Play Console:
   - Monetize > Products > Subscriptions > Create subscription
   - Product ID: `com.patrickalvarez.mapvault.premium.annual`
   - Base plan: €9.99/year (match iOS pricing)
4. **Import product into RevenueCat:**
   - Products > + New > select from Google Play
5. **Attach to existing entitlement:**
   - Entitlements > `premium` > Attach > select the Google product
6. **Attach to existing offering:**
   - Offerings > `default` > `$rc_annual` package > add the Google product
7. **Copy Google API key:**
   - RevenueCat dashboard > App > API Keys > copy the public Google API key
   - Set it locally in `.env` as `EXPO_PUBLIC_REVENUECAT_GOOGLE_API_KEY`
   - Set it in EAS secrets:
     ```bash
     eas secret:create --name EXPO_PUBLIC_REVENUECAT_GOOGLE_API_KEY --value goog_xxxxx --scope project
     ```
8. **Webhook** — no action needed, already configured and platform-agnostic

## Step 5: Test Everything

### Basic functionality (dev build)
1. Start server: `npm run start:dev`
2. Press `a` to connect to Android device
3. Test these flows:
   - [ ] Google Sign-In works
   - [ ] Mapbox map loads and renders
   - [ ] Create a map, add a place
   - [ ] Get directions (opens external maps app)
   - [ ] Invite link flow: `adb shell am start -a android.intent.action.VIEW -d "https://mapvault.app/invite/test-token"`

### Payments (payments build)
1. Build: `eas build --platform android --profile development:payments`
2. Install APK on device
3. Start server: `npx expo start --dev-client`
4. Test these flows:
   - [ ] RevenueCat initializes (check Metro logs for "RevenueCat" debug output)
   - [ ] Paywall shows real Google Play price (not fallback €9.99)
   - [ ] Test purchase completes (use a license tester Gmail account)
   - [ ] Webhook fires — check `profiles.entitlement = 'premium'` in Supabase
   - [ ] Restore Purchases works

### Deep link verification
1. Verify `assetlinks.json` is correct using Google's validator:
   - https://developers.google.com/digital-asset-links/tools/generator
   - Enter: `https://mapvault.app`, package `com.patrickalvarez.mapvault`, and the SHA256 fingerprint from Play Console
2. Test on device:
   ```bash
   adb shell am start -a android.intent.action.VIEW -d "https://mapvault.app/invite/test-token"
   ```

---

## Quick Reference: What Goes Where

| Item | Location |
|---|---|
| Service account JSON | `keys/google-play-service-account.json` (local, gitignored) |
| Google API key (local) | `.env` → `EXPO_PUBLIC_REVENUECAT_GOOGLE_API_KEY` |
| Google API key (CI/CD) | EAS secrets → `EXPO_PUBLIC_REVENUECAT_GOOGLE_API_KEY` |
| SHA256 fingerprint | mapvault-website `assetlinks.json` route handler |
| License testers | Play Console > Setup > License testing |
| Service account permissions | Play Console > Setup > API access |
