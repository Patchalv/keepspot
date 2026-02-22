import { ExpoConfig, ConfigContext } from 'expo/config';

const IS_DEV = process.env.APP_VARIANT === 'development';
const IS_PREVIEW = process.env.APP_VARIANT === 'preview';

const getBundleId = () => {
  if (IS_DEV) return 'com.patrickalvarez.keepspot.dev';
  if (IS_PREVIEW) return 'com.patrickalvarez.keepspot.preview';
  return 'com.patrickalvarez.keepspot';
};

const getAppName = () => {
  if (IS_DEV) return 'Keepspot (Dev)';
  if (IS_PREVIEW) return 'Keepspot (Preview)';
  return 'Keepspot';
};

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: getAppName(),
  slug: 'keepspot',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  scheme: 'keepspot',
  userInterfaceStyle: 'automatic',
  newArchEnabled: true,
  splash: {
    image: './assets/images/splash-icon.png',
    resizeMode: 'contain',
    backgroundColor: '#ffffff',
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: getBundleId(),
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
    },
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/images/adaptive-icon.png',
      backgroundColor: '#ffffff',
    },
    package: getBundleId(),
    edgeToEdgeEnabled: true,
    predictiveBackGestureEnabled: false,
  },
  web: {
    bundler: 'metro',
    output: 'static',
    favicon: './assets/images/favicon.png',
  },
  plugins: [
    'expo-router',
    'expo-apple-authentication',
    '@rnmapbox/maps',
    [
      'expo-location',
      {
        locationAlwaysAndWhenInUsePermission:
          'Allow $(PRODUCT_NAME) to use your location.',
      },
    ],
  ],
  extra: {
    eas: {
      projectId: 'e68615bd-089b-438c-bf12-3693f0cbcc58',
    },
  },
  updates: {
    url: 'https://u.expo.dev/e68615bd-089b-438c-bf12-3693f0cbcc58',
  },
  runtimeVersion: {
    policy: 'sdkVersion',
  },
  experiments: {
    typedRoutes: true,
  },
});
