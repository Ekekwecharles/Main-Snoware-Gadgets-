// Publishes an over-the-air update to installed APKs: `npm run publish-update -- "what changed"`
//
// `eas update` bundles the JavaScript on this computer, so it would pick up the dev values in .env
// (e.g. a LAN API URL) and break every customer's app. This uses the preview build profile's env from
// eas.json instead, which Expo's .env loading never overrides.
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";

const PROFILE = "preview";
const message = process.argv.slice(2).join(" ").trim();
if (!message) {
  console.error('Describe the update, e.g. npm run publish-update -- "Fix checkout button"');
  process.exit(1);
}

const eas = JSON.parse(readFileSync(new URL("../eas.json", import.meta.url), "utf8"));
const profile = eas.build[PROFILE];
const env = { ...process.env, ...profile.env };
console.log(`Publishing to channel "${profile.channel}" with API ${env.EXPO_PUBLIC_API_URL}`);

const result = spawnSync(
  "npx",
  ["eas-cli@latest", "update", "--channel", profile.channel, "--environment", PROFILE, "--platform", "android", "--message", JSON.stringify(message)],
  { stdio: "inherit", env, shell: true },
);
process.exit(result.status ?? 1);
