import type { ExpoConfig } from "expo/config";

/** Reversed iOS client ID from Google Cloud Console, e.g. com.googleusercontent.apps.1234-abcd */
const googleIosUrlScheme = process.env.EXPO_PUBLIC_GOOGLE_IOS_URL_SCHEME;

const config: ExpoConfig = {
  name: "Snoware Gadgets",
  slug: "snoware-gadgets",
  version: "1.0.0",
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
      backgroundColor: "#E1251B",
      foregroundImage: "./assets/android-icon-foreground.png",
      backgroundImage: "./assets/android-icon-background.png",
      monochromeImage: "./assets/android-icon-monochrome.png",
    },
    predictiveBackGestureEnabled: false,
  },
  web: { favicon: "./assets/favicon.png" },
  experiments: { typedRoutes: true },
  plugins: [
    "expo-router",
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
