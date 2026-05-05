import { ExpoConfig, ConfigContext } from 'expo/config';
import versionData from './version.json';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Wutsup',
  slug: 'wutsup',
  version: versionData.version,
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'light',
  scheme: 'wutsup',
  newArchEnabled: true,
  splash: {
    image: './assets/splash-icon.png',
    resizeMode: 'contain',
    backgroundColor: '#ffffff',
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.anonymous.wutsup',
    buildNumber: String(versionData.buildNumber),
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#ffffff',
    },
    edgeToEdgeEnabled: true,
    predictiveBackGestureEnabled: false,
    package: 'com.anonymous.wutsup',
    versionCode: versionData.buildNumber,
  },
  web: {
    favicon: './assets/favicon.png',
  },
  plugins: ['expo-router'],
});
