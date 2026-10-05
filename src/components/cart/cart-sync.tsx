"use client";

import { useEffect } from "react";
import Pusher from "pusher-js";
import { cartOrigin, fetchServerCart, useCart } from "@/store/cart";
import { CART_ORIGIN_HEADER, type CartSnapshot, type CartUpdatedEvent } from "@/lib/cart-types";

const PUSHER_KEY = process.env.NEXT_PUBLIC_PUSHER_KEY;
const PUSHER_CLUSTER = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;
/** Without Pusher configured, fall back to polling so devices still converge. */
const FALLBACK_POLL_MS = 20_000;

function whenHydrated(cb: () => void) {
  if (useCart.persist.hasHydrated()) {
    cb();
    return () => {};
  }
  return useCart.persist.onFinishHydration(cb);
}

/**
 * Keeps a signed-in shopper's cart in sync with their account, so it matches the mobile app:
 * merges the guest cart on sign-in, loads the server cart, and applies live updates from other devices.
 */
export function CartSync({ userId }: { userId: string | null }) {
  useEffect(() => {
    let cancelled = false;
    let pusher: Pusher | null = null;
    let poll: ReturnType<typeof setInterval> | undefined;

    const apply = (cart: CartSnapshot | null) => {
      if (cart && !cancelled && useCart.getState().userId === userId) useCart.getState().hydrateFromServer(cart);
    };
    const refetch = () => void fetchServerCart().then(apply).catch(() => {});
    const onVisible = () => document.visibilityState === "visible" && refetch();

    const unsubscribeHydration = whenHydrated(async () => {
      const state = useCart.getState();

      if (!userId) {
        // Signed out: drop the account cart from this browser so the next person doesn't see it.
        if (state.userId) useCart.setState({ items: [], notes: "", userId: null });
        return;
      }

      if (state.userId !== userId) {
        // Fresh sign-in on this browser. Fold in the guest cart (but never another account's leftovers).
        const guest = state.userId === null ? state : { items: [], notes: "" };
        useCart.setState({ userId });
        const res = await fetch("/api/cart/merge", {
          method: "POST",
          headers: { "content-type": "application/json", [CART_ORIGIN_HEADER]: cartOrigin },
          body: JSON.stringify({
            items: guest.items.map((i) => ({ variantId: i.variantId, quantity: i.quantity })),
            notes: guest.notes || undefined,
          }),
        }).catch(() => null);
        apply(res?.ok ? await res.json() : null);
      } else {
        refetch();
      }
      if (cancelled) return;

      if (PUSHER_KEY && PUSHER_CLUSTER) {
        pusher = new Pusher(PUSHER_KEY, { cluster: PUSHER_CLUSTER, channelAuthorization: { endpoint: "/api/pusher/auth", transport: "ajax" } });
        const channel = pusher.subscribe(`private-cart-${userId}`);
        channel.bind("cart-updated", (event: CartUpdatedEvent) => {
          if (event.origin === cartOrigin) return;
          if (event.cart) apply(event.cart);
          else refetch();
        });
        // Catch up on anything missed while the socket was down.
        pusher.connection.bind("connected", refetch);
      } else {
        poll = setInterval(refetch, FALLBACK_POLL_MS);
      }
      document.addEventListener("visibilitychange", onVisible);
    });

    return () => {
      cancelled = true;
      unsubscribeHydration();
      pusher?.disconnect();
      clearInterval(poll);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [userId]);

  return null;
}
