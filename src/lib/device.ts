"use client";

import { useSyncExternalStore } from "react";

export type MobilePlatform = "android" | "ios" | null;

const subscribe = () => () => {};

function detectPlatform(): MobilePlatform {
  const ua = navigator.userAgent;
  if (/android/i.test(ua)) return "android";
  // iPadOS 13+ reports itself as a Mac, so also check for a touch screen.
  if (/iphone|ipad|ipod/i.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)) return "ios";
  return null;
}

/** Already running as an installed home-screen app (PWA / iOS "Add to Home Screen"). */
function detectStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

/** The visitor's phone OS — null on desktop and during server render, so it never causes a hydration mismatch. */
export function useMobilePlatform(): MobilePlatform {
  return useSyncExternalStore(subscribe, detectPlatform, () => null);
}

export function useIsStandalone() {
  return useSyncExternalStore(subscribe, detectStandalone, () => false);
}
