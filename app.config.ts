import { ConfigContext, ExpoConfig } from "expo/config";

const IS_DEV = process.env.APP_VARIANT === "development";
const IS_PREVIEW = process.env.APP_VARIANT === "preview";

const getBundleId = () => {
  if (IS_DEV) return "com.patrickalvarez.mapvault.dev";
  if (IS_PREVIEW) return "com.patrickalvarez.mapvault.preview";
  return "com.patrickalvarez.mapvault";
};

const getAppName = () => {
  if (IS_DEV) return "(Dev) MapVault";
  if (IS_PREVIEW) return "(Preview) MapVault";
  return "MapVault";
};

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: getAppName(),
  slug: "mapvault",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  scheme: "mapvault",
  userInterfaceStyle: "automatic",
  newArchEnabled: true,
  owner: "patchalv",
  splash: {
    image: "./assets/images/splash-icon.png",
    resizeMode: "contain",
    backgroundColor: "#F8F4E8",
  },
  ios: {
    supportsTablet: false,
    icon: "./assets/images/icon.png",
    bundleIdentifier: getBundleId(),
    infoPlist: {
      NSLocationWhenInUseUsageDescription:
        "MapVault uses your location to show saved places near you on the map.",
      NSLocationAlwaysAndWhenInUseUsageDescription:
        "MapVault uses your location to show saved places near you on the map.",
      ITSAppUsesNonExemptEncryption: false,
    },
    associatedDomains: ["applinks:mapvault.app"],
    entitlements: {
      "com.apple.developer.applesignin": ["Default"],
    },
  },
  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/images/adaptive-icon.png",
      backgroundColor: "#F8F4E8",
    },
    package: getBundleId(),
    edgeToEdgeEnabled: true,
    predictiveBackGestureEnabled: false,
  },
  web: {
    bundler: "metro",
    output: "static",
    favicon: "./assets/images/favicon.png",
  },
  plugins: [
    "expo-router",
    "expo-apple-authentication",
    "@rnmapbox/maps",
    [
      "expo-location",
      {
        locationAlwaysAndWhenInUsePermission:
          "Allow $(PRODUCT_NAME) to use your location.",
      },
    ],
  ],
  extra: {
    revenueCatAppleApiKey: IS_DEV
      ? (process.env.EXPO_PUBLIC_REVENUECAT_DEV_API_KEY ?? "")
      : (process.env.EXPO_PUBLIC_REVENUECAT_API_KEY ?? ""),
    eas: {
      projectId: "1ec7ed48-2f17-4c59-9e71-0f5aea7ea1f7",
    },
  },
  updates: {
    url: "https://u.expo.dev/1ec7ed48-2f17-4c59-9e71-0f5aea7ea1f7",
  },
  runtimeVersion: {
    policy: "sdkVersion",
  },
  experiments: {
    typedRoutes: true,
  },
});
