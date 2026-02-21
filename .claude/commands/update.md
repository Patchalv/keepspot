---
name: update
description: Prepare for EAS Update (OTA) - validates channels, config, and ensures no local env vars leak
argument-hint: '[channel] [--message "..."]'
model: sonnet
---

# EAS Update Preparation

Prepare for an EAS Update (over-the-air update) by validating configuration, checking runtime version compatibility, and ensuring no sensitive data is included.

## Workflow Overview

1. **Gather update parameters** - Channel, message, branch
2. **Validate EAS Update configuration** - updates URL, runtime version
3. **Check environment variables** - Ensure no secrets leak
4. **Verify runtime version compatibility** - Updates only work with matching runtime
5. **Run pre-flight checks** - Expo doctor, bundle analysis
6. **Output ready-to-run command** - With all validated parameters

## Interactive Setup

Use AskUserQuestion to gather update parameters:

```typescript
AskUserQuestion({
  questions: [
    {
      question: "Which update channel/branch are you targeting?",
      header: "Channel",
      options: [
        {
          label: "production",
          description: "Production users with production builds",
        },
        {
          label: "preview",
          description: "Preview/staging builds for internal testing",
        },
        {
          label: "development",
          description: "Development builds (dev clients)",
        },
      ],
      multiSelect: false,
    },
    {
      question: "What type of update is this?",
      header: "Type",
      options: [
        {
          label: "Bug fix",
          description: "Fixes issues without new features",
        },
        {
          label: "Feature update",
          description: "Adds new functionality",
        },
        {
          label: "Hotfix",
          description: "Critical fix that needs immediate rollout",
        },
        {
          label: "Content update",
          description: "Updates assets, copy, or configuration",
        },
      ],
      multiSelect: false,
    },
  ],
});
```

## Pre-Flight Validation

### 1. EAS Update Configuration Check

**Check app.config.js for updates configuration:**

```typescript
Read({ file_path: "app.config.js" });
```

**Required configuration:**

- [ ] `updates.url` is set to `https://u.expo.dev/{projectId}`
- [ ] `runtimeVersion` is configured (policy or explicit version)
- [ ] `extra.eas.projectId` matches the updates URL

**Example valid configuration:**

```javascript
export default {
  // ...
  updates: {
    url: "https://u.expo.dev/your-project-id",
    fallbackToCacheTimeout: 0,
  },
  runtimeVersion: {
    policy: "appVersion", // or 'sdkVersion', 'fingerprint', explicit string
  },
  extra: {
    eas: {
      projectId: "your-project-id",
    },
  },
};
```

### 2. Runtime Version Compatibility

**CRITICAL:** OTA updates only work when the runtime version matches between the update and the installed app.

**Check current runtime version:**

```bash
# Get current runtime version from config
npx expo config --type public | grep -A5 runtimeVersion
```

**Runtime Version Policies:**

| Policy        | Description           | When Updates Apply       |
| ------------- | --------------------- | ------------------------ |
| `appVersion`  | Uses `version` field  | Same app version         |
| `sdkVersion`  | Uses Expo SDK version | Same SDK version         |
| `fingerprint` | Hash of native code   | Same native dependencies |
| `"1.0.0"`     | Explicit string       | Exact match              |

**Warning if using `fingerprint`:**

```
⚠️  FINGERPRINT RUNTIME VERSION
------------------------------------------
You're using 'fingerprint' policy. Updates will only apply to builds
with identical native code. If you've changed any native dependencies
since the last build, users won't receive this update.

Consider if you need a new native build instead.
```

### 3. Environment Variables Check

**CRITICAL:** EAS Updates bundle JavaScript, including any `EXPO_PUBLIC_*` variables at build time.

**Scan for sensitive data:**

```typescript
// Check for EXPO_PUBLIC_ variables in .env files
Grep({ pattern: "EXPO_PUBLIC_", glob: ".env*" });

// Check what's currently in the environment
Bash({ command: "env | grep EXPO_PUBLIC_ || echo 'No EXPO_PUBLIC_ vars set'" });
```

**Validate:**

- [ ] No API keys in `EXPO_PUBLIC_` variables
- [ ] No authentication secrets exposed
- [ ] Environment URLs are correct for target channel
- [ ] `.env.local` is gitignored (won't affect EAS builds)

**Warning for potential leaks:**

```
⚠️  ENVIRONMENT VARIABLE CHECK
------------------------------------------
Found EXPO_PUBLIC_ variables:
- EXPO_PUBLIC_API_URL: https://api.staging.example.com

Ensure these are correct for the target channel (production).

Remember: EXPO_PUBLIC_ variables are bundled into the JavaScript
and visible to anyone who decompiles your app.
```

### 4. Channel/Branch Configuration

**Check EAS Update branches:**

```bash
# List existing update branches
eas update:list --branch production --limit 5
```

**Validate:**

- [ ] Target branch exists (or will be created)
- [ ] Branch corresponds to correct build profile
- [ ] No conflicting updates pending

### 5. Bundle Size Check

**Analyse bundle to ensure update isn't too large:**

```bash
# Export and check bundle size
npx expo export --platform ios --output-dir dist-check
du -sh dist-check/
rm -rf dist-check
```

**Size guidelines:**

- [ ] iOS bundle < 50MB (recommended for OTA)
- [ ] Android bundle < 50MB (recommended for OTA)
- [ ] Large assets should use CDN, not bundled

**Warning for large updates:**

```
⚠️  LARGE UPDATE SIZE
------------------------------------------
Estimated update size: 45MB

Large OTA updates may:
- Take longer to download
- Use significant user data
- Fail on poor connections

Consider:
- Moving large assets to CDN
- Using expo-asset for lazy loading
- Creating a new native build instead
```

### 6. Code Verification

**Check for common issues:**

```typescript
// Check for console.log statements (may want to remove)
Grep({ pattern: "console\\.log", type: "ts", output_mode: "count" });

// Check for debug flags
Grep({ pattern: "__DEV__|isDev|isDebug", type: "ts" });

// Check for hardcoded URLs
Grep({ pattern: "http://localhost|127\\.0\\.0\\.1", type: "ts" });
```

**Verify:**

- [ ] No localhost URLs in production update
- [ ] Debug logging minimised (or acceptable)
- [ ] Feature flags set correctly for channel

### 7. Native Code Check

**Ensure update doesn't require native changes:**

```bash
# Check if native code has changed since last build
# This is approximate - fingerprint policy handles this automatically
ls -la ios/Podfile.lock android/build.gradle 2>/dev/null
```

**If native code changed:**

```
🚫 NATIVE CODE CHANGES DETECTED
------------------------------------------
Changes detected in native code since last build:
- ios/Podfile.lock modified
- New native module added

OTA updates cannot include native code changes.
You must create a new native build first:

  eas build --platform all --profile production

Then publish OTA updates to that build's runtime version.
```

## Output Report

Generate comprehensive pre-flight report:

```
============================================
EAS UPDATE PRE-FLIGHT CHECK
============================================
Channel: {channel}
Branch: {branch}
Message: {message}
Date: {date}

📋 CONFIGURATION
------------------------------------------
✅ EAS Update configured in app.config.js
✅ Project ID: {projectId}
✅ Updates URL: https://u.expo.dev/{projectId}
✅ Runtime Version: {runtimeVersion} ({policy})

🔐 ENVIRONMENT VARIABLES
------------------------------------------
✅ No sensitive data in EXPO_PUBLIC_ variables
✅ API URLs correct for {channel}
⚠️  Found {n} console.log statements (consider removing)

📦 BUNDLE SIZE
------------------------------------------
✅ iOS bundle: {size}MB
✅ Android bundle: {size}MB
✅ Within recommended limits

🔄 RUNTIME COMPATIBILITY
------------------------------------------
✅ Runtime version: {version}
✅ Compatible with existing {channel} builds
ℹ️  Last build: {date}

============================================
✅ ALL CHECKS PASSED - READY TO UPDATE
============================================

Run this command to publish the update:

eas update --branch {branch} --message "{message}"

============================================
```

## Final Command Generation

Based on validated parameters:

**Standard update:**

```bash
eas update --branch {branch} --message "{message}"
```

**With channel (auto-selects branch):**

```bash
eas update --channel {channel} --message "{message}"
```

**Platform-specific update:**

```bash
eas update --branch {branch} --platform ios --message "{message}"
```

**With explicit runtime version:**

```bash
eas update --branch {branch} --message "{message}"
```

## Handling Issues

### Missing EAS Update Configuration

```
🚫 EAS UPDATE NOT CONFIGURED
------------------------------------------
Your app.config.js is missing EAS Update configuration.

Add the following to your app.config.js:

  updates: {
    url: 'https://u.expo.dev/{projectId}',
    fallbackToCacheTimeout: 0,
  },
  runtimeVersion: {
    policy: 'appVersion',
  },

Then create a new native build to enable OTA updates.
```

### Runtime Version Mismatch

```
🚫 RUNTIME VERSION MISMATCH
------------------------------------------
Current runtime version: 1.1.0
Latest production build: 1.0.0

Users with the 1.0.0 build won't receive this update.

Options:
1. Change runtime version to match existing builds
2. Create a new native build with current runtime version
3. Proceed anyway (update will only reach matching builds)
```

### No Builds on Channel

```
⚠️  NO BUILDS ON CHANNEL
------------------------------------------
No builds found on the '{channel}' channel.

OTA updates require users to have a native build installed.

First, create and distribute a native build:

  eas build --platform all --profile {profile}
  eas submit --platform all

Then publish OTA updates to that channel.
```

## Update Channels vs Branches

**Channels** = User-facing distribution groups
**Branches** = Named update streams

| Channel     | Branch      | Profile     | Use Case         |
| ----------- | ----------- | ----------- | ---------------- |
| production  | production  | production  | Live users       |
| preview     | preview     | preview     | Internal testing |
| development | development | development | Dev team         |

**Typical setup in eas.json:**

```json
{
  "build": {
    "production": {
      "channel": "production"
    },
    "preview": {
      "channel": "preview"
    },
    "development": {
      "channel": "development"
    }
  }
}
```

## Rollback Guidance

If an update causes issues:

```bash
# List recent updates on branch
eas update:list --branch production --limit 10

# Roll back by republishing previous update
eas update:republish --group {previous-update-group-id}
```

**Include in output:**

```
📋 ROLLBACK INFORMATION
------------------------------------------
If this update causes issues, roll back with:

  eas update:list --branch {branch} --limit 10
  eas update:republish --group {previous-group-id}

Or publish a new fix:

  eas update --branch {branch} --message "Hotfix: ..."
```

## Best Practices Checklist

Before publishing:

- [ ] Tested changes locally with `npx expo start`
- [ ] Verified on physical device (not just simulator)
- [ ] Confirmed environment variables are correct
- [ ] Checked bundle size is reasonable
- [ ] Prepared rollback plan
- [ ] Communicated to team (if production)

## Quick Reference

```bash
# Publish update to production
eas update --branch production --message "Bug fixes and improvements"

# Publish to preview for testing
eas update --branch preview --message "Testing new feature X"

# List updates on a branch
eas update:list --branch production

# View update details
eas update:view {group-id}

# Republish (rollback to) previous update
eas update:republish --group {previous-group-id}

# Delete an update (cannot undo distribution)
eas update:delete --group {group-id}
```
