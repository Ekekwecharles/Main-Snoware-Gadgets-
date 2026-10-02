"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/** True once on the client — avoids hydration mismatches for localStorage-backed state like the cart. */
export function useHydrated() {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}
