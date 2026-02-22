# KeepSpot — Branding Assets Guide

## Asset Files

| File                | Dimensions | Format                      | Purpose                          | Expo Config Key                             |
| ------------------- | ---------- | --------------------------- | -------------------------------- | ------------------------------------------- |
| `icon.png`          | 1024×1024  | PNG, RGB (no transparency)  | iOS App Store icon + fallback    | `expo.icon`                                 |
| `adaptive-icon.png` | 1024×1024  | PNG, transparent background | Android adaptive icon foreground | `expo.android.adaptiveIcon.foregroundImage` |
| `splash-icon.png`   | 512×512    | PNG, transparent background | Splash screen centered logo      | `expo.splash.image`                         |
| `favicon.png`       | 48×48      | PNG, RGB                    | Web browser tab icon             | `expo.web.favicon`                          |

## Brand Colors

| Color              | Hex       | Usage                                       |
| ------------------ | --------- | ------------------------------------------- |
| Cream / Background | `#F8F4E8` | Splash background, adaptive icon background |
| Pin Red            | `#E8453C` | Primary brand color                         |
| Pin Red Dark       | `#C83A32` | Pin shadow/depth                            |
| Heart Pink         | `#E87070` | Heart accent                                |
| Navy Text          | `#2D3748` | Text color                                  |

## app.json / app.config.ts Configuration

Add or update these fields in your Expo config:

```json
{
  "expo": {
    "icon": "./assets/images/icon.png",
    "splash": {
      "image": "./assets/images/splash-icon.png",
      "resizeMode": "contain",
      "backgroundColor": "#F8F4E8"
    },
    "ios": {
      "supportsTablet": false,
      "icon": "./assets/images/icon.png"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/images/adaptive-icon.png",
        "backgroundColor": "#F8F4E8"
      }
    },
    "web": {
      "favicon": "./assets/images/favicon.png"
    }
  }
}
```

## File Placement

Copy all 4 image files into `assets/images/` in the Expo project root:

```
assets/
└── images/
    ├── icon.png              ← iOS app icon (1024×1024)
    ├── adaptive-icon.png     ← Android adaptive icon foreground (1024×1024)
    ├── splash-icon.png       ← Splash screen logo (512×512)
    └── favicon.png           ← Web favicon (48×48)
```

## Notes

- **iOS icon**: Apple automatically applies rounded corners — do NOT add them manually.
- **Android adaptive icon**: The OS applies various masks (circle, squircle, etc.). Content is within the center 66% safe zone. The `backgroundColor` provides the background layer.
- **Splash screen**: Uses `resizeMode: "contain"` so the logo scales to fit any screen size. The `backgroundColor` fills the remaining space — matches the cream from the logo.
- **Source image**: Generated from the KeepSpot logo (red map pin with heart on cream background). The text "KeepSpot" is intentionally excluded from the icon and splash — app icons should be recognizable without text.
