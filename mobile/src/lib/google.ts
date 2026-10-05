import { config } from "./config";

type GoogleModule = typeof import("@react-native-google-signin/google-signin");

/**
 * Loaded lazily: the native module only exists in a development/production build, not in Expo Go,
 * and importing it eagerly would crash the whole app there.
 */
function loadGoogle(): GoogleModule | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod: GoogleModule = require("@react-native-google-signin/google-signin");
    mod.GoogleSignin.configure({
      // The ID token's audience is the web client — the same one the website uses (AUTH_GOOGLE_ID).
      webClientId: config.googleWebClientId,
      iosClientId: config.googleIosClientId || undefined,
    });
    return mod;
  } catch {
    return null;
  }
}

let cached: GoogleModule | null | undefined;
const google = () => (cached === undefined ? (cached = loadGoogle()) : cached);

export const isGoogleSignInAvailable = () => !!config.googleWebClientId && !!google();

/** Opens the native Google account picker and returns an ID token, or null if the user cancelled. */
export async function getGoogleIdToken(): Promise<string | null> {
  const mod = google();
  if (!mod) throw new Error("Google sign-in needs the Snoware app build (it isn't available in Expo Go).");
  const { GoogleSignin, isSuccessResponse, isErrorWithCode, statusCodes } = mod;
  try {
    await GoogleSignin.hasPlayServices();
    const res = await GoogleSignin.signIn();
    if (!isSuccessResponse(res)) return null;
    if (!res.data.idToken) throw new Error("Google didn't return a sign-in token. Please try again.");
    return res.data.idToken;
  } catch (err) {
    if (isErrorWithCode(err) && (err.code === statusCodes.SIGN_IN_CANCELLED || err.code === statusCodes.IN_PROGRESS)) return null;
    throw err;
  }
}

export async function googleSignOut() {
  await google()?.GoogleSignin.signOut().catch(() => {});
}
