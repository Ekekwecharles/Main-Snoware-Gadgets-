// Renders the Snoware app icon (the red power-button "o" from the logo) into every size the
// mobile app and the website need. Run from the repo root: `node scripts/generate-app-icons.mjs`
import sharp from "sharp";
import { mkdir } from "node:fs/promises";

const INK = "#0a0a0b";

/** The power-"o" mark, drawn in the same 64-unit space as src/app/icon.svg. */
function mark({ scale, color = "url(#red)", glow = true }) {
  const paths = `
    <path d="M20.6 19.8a17 17 0 1 0 22.8 0" fill="none" stroke="${color}" stroke-width="6.5" stroke-linecap="round"/>
    <path d="M32 12v17" fill="none" stroke="${color}" stroke-width="6.5" stroke-linecap="round"/>`;
  // The mark spans roughly y 8.75–52.65, so its visual centre is (32, 30.7).
  return `
    <g transform="translate(512 512) scale(${scale}) translate(-32 -30.7)">
      ${glow ? `<g filter="url(#glow)" opacity="0.55">${paths}</g>` : ""}
      ${paths}
    </g>`;
}

const defs = `
  <defs>
    <radialGradient id="bg" cx="30%" cy="20%" r="95%">
      <stop offset="0" stop-color="#26262b"/>
      <stop offset="0.55" stop-color="#121214"/>
      <stop offset="1" stop-color="${INK}"/>
    </radialGradient>
    <!-- userSpaceOnUse (in mark units): a bounding-box gradient can't paint the zero-width stem. -->
    <linearGradient id="red" x1="0" y1="9" x2="0" y2="53" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#ff4a3d"/>
      <stop offset="1" stop-color="#c81c13"/>
    </linearGradient>
    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="2.4"/>
    </filter>
  </defs>`;

const svg = (body, background = true) =>
  Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
    ${defs}
    ${background ? `<rect width="1024" height="1024" fill="url(#bg)"/>` : ""}
    ${body}
  </svg>`);

// Full-bleed icon (iOS rounds the corners itself) and a smaller mark for maskable/adaptive icons,
// which must keep the artwork inside the central ~66% safe zone.
const fullIcon = svg(mark({ scale: 14 }));
const safeIcon = svg(mark({ scale: 10 }));
const foreground = svg(mark({ scale: 10 }), false);
const monochrome = svg(mark({ scale: 10, color: "#ffffff", glow: false }), false);
const background = svg("");
const splash = svg(mark({ scale: 14, glow: false }), false);

const out = [
  // Expo / native app
  [fullIcon, "mobile/assets/icon.png", 1024],
  [foreground, "mobile/assets/android-icon-foreground.png", 1024],
  [background, "mobile/assets/android-icon-background.png", 1024],
  [monochrome, "mobile/assets/android-icon-monochrome.png", 1024],
  [splash, "mobile/assets/splash-icon.png", 1024],
  [fullIcon, "mobile/assets/favicon.png", 48],
  // Website: iOS home-screen icon, PWA manifest icons, and the install banner/page
  [fullIcon, "src/app/apple-icon.png", 180],
  [fullIcon, "public/icons/icon-192.png", 192],
  [fullIcon, "public/icons/icon-512.png", 512],
  [safeIcon, "public/icons/maskable-512.png", 512],
];

await mkdir("public/icons", { recursive: true });
for (const [input, file, size] of out) {
  await sharp(input)
    .resize(size, size)
    .png({ compressionLevel: 9 })
    .toFile(file);
  console.log(`wrote ${file} (${size}px)`);
}
