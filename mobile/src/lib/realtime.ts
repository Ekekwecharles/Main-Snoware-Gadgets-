import { useEffect } from "react";
import { AppState } from "react-native";
import type PusherClient from "pusher-js/react-native";
import { getAuthToken } from "./api";
import { cartOrigin, fetchServerCart, useCart } from "./cart";
import { config } from "./config";
import type { CartSnapshot, CartUpdatedEvent } from "./types";

// The React Native bundle is CommonJS and exports `{ Pusher }`; its typings claim a default export,
// which Metro resolves to the module object ("Object cannot be used as a constructor").
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { Pusher } = require("pusher-js/react-native") as { Pusher: typeof PusherClient };

/** Without Pusher configured, poll so devices still converge (just not instantly). */
const FALLBACK_POLL_MS = 20_000;

/**
 * Live cart sync: subscribes to the user's private Pusher channel, so an item added on the
 * website shows up here immediately. Also refetches when the app returns to the foreground.
 */
export function useCartRealtime(userId: string | null) {
  useEffect(() => {
    if (!userId) return;
    let active = true;

    const apply = (cart: CartSnapshot | null) => {
      if (cart && active && useCart.getState().userId === userId) useCart.getState().hydrateFromServer(cart);
    };
    const refetch = () => void fetchServerCart().then(apply).catch(() => {});

    let pusher: PusherClient | null = null;
    let poll: ReturnType<typeof setInterval> | undefined;
    if (config.pusherKey && config.pusherCluster) {
      pusher = new Pusher(config.pusherKey, {
        cluster: config.pusherCluster,
        channelAuthorization: {
          endpoint: `${config.apiUrl}/api/pusher/auth`,
          transport: "ajax",
          headersProvider: () => ({ Authorization: `Bearer ${getAuthToken() ?? ""}` }),
        },
      });
      const channel = pusher.subscribe(`private-cart-${userId}`);
      channel.bind("cart-updated", (event: CartUpdatedEvent) => {
        if (event.origin === cartOrigin) return;
        if (event.cart) apply(event.cart);
        else refetch();
      });
      // Catch up on anything missed while disconnected (pusher-js reconnects on network changes).
      pusher.connection.bind("connected", refetch);
    } else {
      poll = setInterval(refetch, FALLBACK_POLL_MS);
    }

    const sub = AppState.addEventListener("change", (state) => state === "active" && refetch());

    return () => {
      active = false;
      sub.remove();
      clearInterval(poll);
      pusher?.disconnect();
    };
  }, [userId]);
}
