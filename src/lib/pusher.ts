import "server-only";
import Pusher from "pusher";

const globalForPusher = globalThis as unknown as { pusher?: Pusher | null };

/** Server-side Pusher client, or null when the PUSHER_* env vars aren't set (realtime then degrades to refetching). */
export function getPusher() {
  if (globalForPusher.pusher !== undefined) return globalForPusher.pusher;
  const { PUSHER_APP_ID: appId, PUSHER_SECRET: secret } = process.env;
  const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
  const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;
  globalForPusher.pusher = appId && secret && key && cluster ? new Pusher({ appId, key, secret, cluster, useTLS: true }) : null;
  if (!globalForPusher.pusher) console.warn("[pusher] PUSHER_* env vars not set — live cart sync is disabled.");
  return globalForPusher.pusher;
}

/** Private channel carrying one user's cart updates. Only that user is authorised to subscribe. */
export const cartChannel = (userId: string) => `private-cart-${userId}`;
