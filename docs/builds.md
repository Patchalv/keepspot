# EAS Build Profiles & Variants

## How Variants Work

The `APP_VARIANT` environment variable drives bundle ID and app name via `app.config.ts`:

| `APP_VARIANT` | Bundle ID | App Name |
|---|---|---|
| `development` | `com.patrickalvarez.mapvault.dev` | (Dev) MapVault |
| `preview` | `com.patrickalvarez.mapvault.preview` | (Preview) MapVault |
| _(not set)_ | `com.patrickalvarez.mapvault` | MapVault |

Different bundle IDs allow multiple variants to be installed side-by-side on the same device.

## Build Profiles

All profiles are defined in `eas.json`.

| Profile | APP_VARIANT | Bundle ID | Target | Purpose |
|---|---|---|---|---|
| `development` | `development` | `.dev` | (base profile) | Base for dev builds |
| `development:simulator` | `development` | `.dev` | Simulator | Daily dev work on iOS simulator |
| `development:device` | `development` | `.dev` | Physical device | Daily dev work on physical device |
| `development:payments` | _(none)_ | production | Physical device | Payment/IAP testing with sandbox |
| `preview` | `preview` | `.preview` | Internal distribution | Stakeholder testing, QA |
| `production` | _(none)_ | production | App Store | App Store submission |

### `development` / `development:simulator` / `development:device`

Standard development builds with the `.dev` bundle ID. Use for everyday development.

```bash
# Simulator
eas build --profile development:simulator --platform ios

# Physical device
eas build --profile development:device --platform ios
```

Start the dev server:
```bash
npm run start:dev
```

### `development:payments`

Special dev client build that uses the **production bundle ID** (`com.patrickalvarez.mapvault`). Required for payment testing because RevenueCat and App Store Connect only recognize the production bundle ID.

```bash
eas build --profile development:payments --platform ios
```

Start the dev server (**without** the development variant):
```bash
npx expo start --dev-client
```

**Important:** This build shares the production bundle ID, so it **cannot be installed alongside the production app** on the same device. Uninstall one before installing the other.

See `docs/payments.md` for the full payment testing guide.

### `preview`

Internal distribution builds for stakeholder testing and QA. Uses the `.preview` bundle ID so it can coexist with dev and production builds.

```bash
eas build --profile preview --platform ios
```

### `production`

App Store submission builds. Version auto-increments on each build.

```bash
eas build --profile production --platform ios
eas submit --profile production --platform ios
```

## Dev Server Commands

| Command | When to Use |
|---|---|
| `npm run start:dev` | Normal development (sets `APP_VARIANT=development`) |
| `npx expo start --dev-client` | Payment testing with `development:payments` build (no variant = production bundle ID) |
| `npx expo start` | General dev server without dev client |

## Common Workflows

**Daily development:**
1. Build once: `eas build --profile development:simulator --platform ios`
2. Start server: `npm run start:dev`
3. Press `i` to open in simulator

**Testing payments:**
1. Build once: `eas build --profile development:payments --platform ios`
2. Install on physical device
3. Start server: `npx expo start --dev-client`
4. Follow testing flows in `docs/payments.md`

**Preparing a release:**
1. Build: `eas build --profile production --platform ios`
2. Submit: `eas submit --profile production --platform ios`
