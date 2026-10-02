import type { MenuIcon } from "@/lib/site";

/** Original thin line-art device icons used in the mega menu, category tiles and image placeholders. */
const paths: Record<MenuIcon, React.ReactNode> = {
  phone: (
    <>
      <rect x="15" y="4" width="18" height="40" rx="4" />
      <path d="M21 7.5h6" />
    </>
  ),
  "phone-used": (
    <>
      <rect x="15" y="4" width="18" height="40" rx="4" />
      <path d="M21 7.5h6" />
      <path d="M20 26l3 3 6-7" />
    </>
  ),
  fold: (
    <>
      <rect x="8" y="8" width="32" height="32" rx="3" />
      <path d="M24 8v32" strokeDasharray="2 2" />
    </>
  ),
  laptop: (
    <>
      <rect x="9" y="11" width="30" height="20" rx="2" />
      <path d="M4 35h40l-2 3H6z" />
    </>
  ),
  tablet: (
    <>
      <rect x="11" y="5" width="26" height="38" rx="3" />
      <circle cx="24" cy="39" r="0.8" />
    </>
  ),
  watch: (
    <>
      <rect x="14" y="14" width="20" height="20" rx="5" />
      <path d="M18 14l1-8h10l1 8M18 34l1 8h10l1-8M34 21h2v4h-2" />
    </>
  ),
  earbuds: (
    <>
      <path d="M14 10a6 6 0 0 1 6 6v4a4 4 0 0 1-4 4h-1v14a2 2 0 0 1-4 0V16a6 6 0 0 1 3-6z" />
      <path d="M34 10a6 6 0 0 0-6 6v4a4 4 0 0 0 4 4h1v14a2 2 0 0 0 4 0V16a6 6 0 0 0-3-6z" />
    </>
  ),
  tag: (
    <>
      <circle cx="24" cy="26" r="13" />
      <circle cx="24" cy="26" r="4" />
      <path d="M24 13V7" />
    </>
  ),
  charger: (
    <>
      <rect x="13" y="6" width="22" height="18" rx="3" />
      <path d="M20 24v6h8v-6M24 30v12" />
      <circle cx="24" cy="15" r="1" />
    </>
  ),
  desktop: (
    <>
      <rect x="5" y="7" width="38" height="26" rx="2" />
      <path d="M20 33l-2 8h12l-2-8" />
    </>
  ),
  printer: (
    <>
      <path d="M14 18V6h20v12" />
      <rect x="6" y="18" width="36" height="16" rx="3" />
      <path d="M14 30h20v12H14z" />
    </>
  ),
  console: (
    <>
      <path d="M17 6c-4 0-6 3-6 8v26l7-3V9" />
      <path d="M31 6c4 0 6 3 6 8v26l-7-3V9" />
      <path d="M18 9h12v28H18" />
    </>
  ),
  monitor: (
    <>
      <path d="M4 10q20-4 40 0v22q-20 4-40 0z" />
      <path d="M20 35l-3 7h14l-3-7" />
    </>
  ),
  speaker: (
    <>
      <rect x="6" y="14" width="36" height="20" rx="10" />
      <circle cx="16" cy="24" r="4" />
      <circle cx="32" cy="24" r="4" />
    </>
  ),
  satellite: (
    <>
      <rect x="9" y="8" width="30" height="22" rx="2" transform="rotate(-12 24 19)" />
      <path d="M24 30v8M16 42h16" />
    </>
  ),
  glasses: (
    <>
      <rect x="5" y="17" width="16" height="12" rx="4" />
      <rect x="27" y="17" width="16" height="12" rx="4" />
      <path d="M21 21q3-2 6 0M5 19l-2-3M43 19l2-3" />
    </>
  ),
  projector: (
    <>
      <rect x="5" y="15" width="38" height="18" rx="4" />
      <circle cx="31" cy="24" r="5" />
      <path d="M10 33v4M38 33v4M10 21h10" />
    </>
  ),
  drone: (
    <>
      <rect x="18" y="20" width="12" height="8" rx="3" />
      <path d="M18 22L10 14M30 22l8-8M18 26l-8 8M30 26l8 8" />
      <path d="M4 14h12M32 14h12M4 34h12M32 34h12" />
    </>
  ),
  accessory: (
    <>
      <rect x="13" y="5" width="22" height="38" rx="5" />
      <circle cx="20" cy="12" r="3" />
      <circle cx="20" cy="20" r="3" />
    </>
  ),
  grid: (
    <>
      <rect x="7" y="7" width="14" height="14" rx="3" />
      <rect x="27" y="7" width="14" height="14" rx="3" />
      <rect x="7" y="27" width="14" height="14" rx="3" />
      <rect x="27" y="27" width="14" height="14" rx="3" />
    </>
  ),
};

export function DeviceIcon({ icon, className, strokeWidth = 1.4 }: { icon: MenuIcon | string; className?: string; strokeWidth?: number }) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={className}
    >
      {paths[icon as MenuIcon] ?? paths.grid}
    </svg>
  );
}

const categoryIconMap: Record<string, MenuIcon> = {
  iphone: "phone", "samsung-phones": "phone", "google-pixel": "phone", "pixel-phones": "phone", apple: "phone", samsung: "phone",
  "pixel-buds": "earbuds", "pixel-watch": "watch",
  macbook: "laptop", computers: "laptop", "office-student-laptops": "laptop", "gaming-laptops": "laptop", "workstation-laptops": "laptop",
  ipad: "tablet", "samsung-tablets": "tablet",
  "apple-watch": "watch", "samsung-watches": "watch",
  airpods: "earbuds", "galaxy-buds": "earbuds",
  airtag: "tag", "apple-chargers": "charger", "samsung-chargers": "charger",
  "all-in-one-pcs": "desktop", printers: "printer",
  gaming: "console", ps5: "console", ps4: "console", "gaming-monitors": "monitor",
  audio: "speaker", jbl: "speaker", onyx: "speaker", zealot: "speaker",
  starlink: "satellite", "ray-ban": "glasses", projectors: "projector", drones: "drone",
  accessories: "accessory", others: "accessory",
};

export function iconForCategory(slug: string): MenuIcon {
  return categoryIconMap[slug] ?? "grid";
}
