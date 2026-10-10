import type { ExpoConfig } from "expo/config";

/** Reversed iOS client ID from Google Cloud Console, e.g. com.googleusercontent.apps.1234-abcd */
const googleIosUrlScheme = process.env.EXPO_PUBLIC_GOOGLE_IOS_URL_SCHEME;

const projectId = "ad487ef5-8a47-4d90-ba5b-b48fc13a6894";

const config: ExpoConfig = {
  name: "Snoware Gadgets",
  slug: "snoware-gadgets",
  // Bump this for every new APK. Over-the-air updates only reach builds with the same version (runtimeVersion below),
  // and the website's "latest app version" setting is compared against it to show the update prompt.
  version: "1.0.0",
  runtimeVersion: { policy: "appVersion" },
  // EAS Update: JS/screen changes published with `eas update` download on launch and apply on the next start.
  updates: { url: `https://u.expo.dev/${projectId}` },
  orientation: "portrait",
  icon: "./assets/icon.png",
  // Must match MOBILE_APP_SCHEME on the website (Paystack returns to snowaregadgets://checkout-complete).
  scheme: "snowaregadgets",
  userInterfaceStyle: "light",
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.snowaregadgets.app",
  },
  android: {
    package: "com.snowaregadgets.app",
    adaptiveIcon: {
      backgroundColor: "#0A0A0B",
      foregroundImage: "./assets/android-icon-foreground.png",
      backgroundImage: "./assets/android-icon-background.png",
      monochromeImage: "./assets/android-icon-monochrome.png",
    },
    predictiveBackGestureEnabled: false,
  },
  web: { favicon: "./assets/favicon.png" },
  experiments: { typedRoutes: true },
  // EAS project @snowaregadgets/snoware-gadgets (cloud builds / APKs).
  owner: "snowaregadgets",
  extra: { eas: { projectId } },
  plugins: [
    "expo-router",
    "expo-updates",
    "expo-status-bar",
    "expo-secure-store",
    "expo-web-browser",
    "expo-image",
    "expo-font",
    // Native Google sign-in needs a development build and the iOS URL scheme from Google Cloud Console.
    ...(googleIosUrlScheme
      ? [["@react-native-google-signin/google-signin", { iosUrlScheme: googleIosUrlScheme }] as [string, Record<string, string>]]
      : []),
  ],
};

export default config;
