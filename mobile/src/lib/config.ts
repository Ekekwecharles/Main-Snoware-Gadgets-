/** Public build-time config (see .env.example). */
export const config = {
  apiUrl: (process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000").replace(/\/$/, ""),
  pusherKey: process.env.EXPO_PUBLIC_PUSHER_KEY ?? "",
  pusherCluster: process.env.EXPO_PUBLIC_PUSHER_CLUSTER ?? "",
  googleWebClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? "",
  googleIosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ?? "",
};

/** Resolves site-relative image paths (e.g. /snoware-hero.png) against the website. */
export function imageUrl(src: string | null | undefined) {
  if (!src) return null;
  return src.startsWith("http") ? src : `${config.apiUrl}${src.startsWith("/") ? "" : "/"}${src}`;
}
