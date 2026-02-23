# Universal Links — Website Changes for mapvault.app

Changes required on the mapvault.app marketing website to support iOS Universal Links and Android App Links for MapVault's invite flow.

## 1. Apple App Site Association (AASA) File

**Path:** `/.well-known/apple-app-site-association`

**Requirements:**
- Served at exactly `https://mapvault.app/.well-known/apple-app-site-association`
- `Content-Type: application/json`
- No redirects (must resolve directly at that path)
- Accessible over HTTPS
- No file extension (not `.json`)

**Content:**

```json
{
  "applinks": {
    "apps": [],
    "details": [
      {
        "appIDs": ["NLVM332ZPW.com.patrickalvarez.mapvault"],
        "paths": ["/invite/*"]
      }
    ]
  }
}
```

**Validation:** After deploying, verify at `https://app-site-association.cdn-apple.com/a/v1/mapvault.app` — Apple caches this file via their CDN. Initial propagation can take up to 24 hours.

## 2. Android Asset Links File

**Path:** `/.well-known/assetlinks.json`

**Requirements:**
- Served at exactly `https://mapvault.app/.well-known/assetlinks.json`
- `Content-Type: application/json`
- No redirects

**Content:**

```json
[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "com.patrickalvarez.mapvault",
      "sha256_cert_fingerprints": ["2F:B9:C5:D1:34:71:5D:FD:2C:3C:0F:31:F2:E1:8E:20:63:F1:CD:8A:D7:9C:A2:17:B7:F7:A3:60:40:54:11:C1"]
    }
  }
]
```

**Note:** If you later enroll in Google Play App Signing, you'll also need to add Google Play's signing certificate fingerprint to the array (found in Google Play Console > Setup > App signing).

## 3. Invite Fallback Page

**Route:** `/invite/[token]` (dynamic — must match any token value, e.g. `/invite/550e8400-e29b-41d4-a716-446655440000`)

This page is shown when a user clicks an invite link but:
- They're on a desktop browser (Universal Links only work on mobile)
- They don't have the app installed
- The OS didn't intercept the link to open the app

### Behavior

1. On mobile: automatically attempt to open the app via `mapvault://invite/{token}` custom scheme
2. Show a landing page with:
   - A message explaining they've been invited to a map
   - An "Open in MapVault" button (links to `mapvault://invite/{token}`)
   - App Store download link (use placeholder `https://apps.apple.com/app/mapvault/idTODO` until the app is published)
3. Style consistently with the mapvault.app marketing site

### Open Graph / Social Meta Tags

When invite links are shared in messaging apps (iMessage, WhatsApp, Slack), they show a preview card. Add these meta tags to the invite fallback page:

```html
<meta property="og:title" content="You've been invited to a map on MapVault" />
<meta property="og:description" content="Tap to open in MapVault and start exploring saved places." />
<meta property="og:type" content="website" />
<meta property="og:url" content="https://mapvault.app/invite/{token}" />
```

### Reference Implementation

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Join my map on MapVault</title>
  <meta property="og:title" content="You've been invited to a map on MapVault" />
  <meta property="og:description" content="Tap to open in MapVault and start exploring saved places." />
</head>
<body>
  <h1>You've been invited to a map!</h1>
  <p>Open this link on your phone with MapVault installed.</p>
  <a id="open-app" href="#">Open in MapVault</a>
  <a href="https://apps.apple.com/app/mapvault/idTODO">Download on the App Store</a>
  <script>
    var token = window.location.pathname.split('/invite/')[1];
    var appLink = 'mapvault://invite/' + token;
    document.getElementById('open-app').href = appLink;
    if (/iPhone|iPad|Android/i.test(navigator.userAgent)) {
      window.location.href = appLink;
    }
  </script>
</body>
</html>
```

This is a minimal reference. Adapt the styling to match the mapvault.app marketing site design. The key requirements are:
- Extract the token from the URL path
- Set the "Open in MapVault" button to `mapvault://invite/{token}`
- Auto-redirect on mobile devices
- Show App Store link as fallback

## Summary Checklist

- [ ] Serve AASA file at `/.well-known/apple-app-site-association` (exact content above, no redirects, `application/json`)
- [ ] Serve Android asset links at `/.well-known/assetlinks.json` (replace SHA-256 placeholder)
- [ ] Create `/invite/[token]` fallback page with app deep link, auto-redirect on mobile, and App Store link
- [ ] Add Open Graph meta tags to invite fallback page for link preview cards
- [ ] Verify AASA via `https://app-site-association.cdn-apple.com/a/v1/mapvault.app` (may take up to 24h)
- [ ] Verify Android asset links via `https://digitalassetlinks.googleapis.com/v1/statements:list?source.web.site=https://mapvault.app&relation=delegate_permission/common.handle_all_urls`
