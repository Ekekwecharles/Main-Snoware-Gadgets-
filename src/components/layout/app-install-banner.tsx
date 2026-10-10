"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useSyncExternalStore } from "react";
import { X } from "lucide-react";
import { useIsStandalone, useMobilePlatform } from "@/lib/device";

const DISMISS_KEY = "snoware:app-banner-dismissed-at";
const DISMISS_DAYS = 14;

const subscribe = () => () => {};

function dismissedRecently() {
  try {
    const at = Number(localStorage.getItem(DISMISS_KEY));
    return at > 0 && Date.now() - at < DISMISS_DAYS * 24 * 60 * 60 * 1000;
  } catch {
    return false;
  }
}

/** "Smart app banner" for phone visitors: points Android users to the APK and iPhone users to Add to Home Screen, via /app. */
export function AppInstallBanner() {
  const pathname = usePathname();
  const platform = useMobilePlatform();
  const standalone = useIsStandalone();
  const wasDismissed = useSyncExternalStore(subscribe, dismissedRecently, () => true);
  const [closed, setClosed] = useState(false);

  if (!platform || standalone || wasDismissed || closed) return null;
  if (pathname.startsWith("/checkout") || pathname.startsWith("/app")) return null;

  const dismiss = () => {
    setClosed(true);
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      // Private mode — the banner just comes back next visit.
    }
  };

  return (
    <div role="region" aria-label="Get the Snoware Gadgets app" className="border-b border-line bg-mist">
      <div className="container-x flex items-center gap-3 py-2.5">
        <button type="button" onClick={dismiss} aria-label="Dismiss" className="-ml-1 rounded-full p-1 text-muted hover:text-ink">
          <X className="h-4 w-4" />
        </button>
        <Image src="/icons/icon-192.png" alt="" width={44} height={44} className="h-11 w-11 shrink-0 rounded-[10px] shadow-sm" />
        <div className="min-w-0 flex-1 leading-tight">
          <p className="truncate text-[14px] font-semibold text-ink">Snoware Gadgets</p>
          <p className="truncate text-[12px] text-muted">
            {platform === "android" ? "Faster shopping in our Android app" : "Add the store to your Home Screen"}
          </p>
          <p className="text-[11px] font-medium text-muted/80">Free</p>
        </div>
        <Link
          href={`/app#${platform}`}
          className="shrink-0 rounded-full bg-brand-600 px-4 py-1.5 text-[13px] font-semibold text-white hover:bg-brand-700"
        >
          {platform === "android" ? "Install" : "Get"}
        </Link>
      </div>
    </div>
  );
}
