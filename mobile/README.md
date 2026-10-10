# Snoware Gadgets — mobile app

Expo (SDK 57) + Expo Router app for iOS and Android. It uses the website's API (`../src/app/api`), so people sign in with the
same account, and signed-in shoppers get **one cart shared with the website** that updates live over Pusher.

## Setup

1. On the website, apply the new cart tables and add the new env vars (see `../.env.example`):
   `npm run db:push`, then set `PUSHER_*`, `NEXT_PUBLIC_PUSHER_*`, and `AUTH_GOOGLE_IOS_ID` / `AUTH_GOOGLE_ANDROID_ID` if you use Google.
2. Here: `cp .env.example .env` and fill it in. `EXPO_PUBLIC_API_URL` must be reachable from the phone
   (your computer's LAN IP while developing, e.g. `http://192.168.1.20:3000`, or the live site).
3. `npm install`, then `npx expo start` and scan the QR code with Expo Go.

## Google sign-in

Native Google sign-in needs a development build (it isn't in Expo Go; the button is hidden there):

- In Google Cloud Console (same project as the website), create an **iOS** client (bundle ID `com.snowaregadgets.app`) and an
  **Android** client (package `com.snowaregadgets.app` + your signing SHA-1).
- Set `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` (= website `AUTH_GOOGLE_ID`), `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` and
  `EXPO_PUBLIC_GOOGLE_IOS_URL_SCHEME`, then `npx expo run:android` / `npx expo run:ios` (or `eas build --profile development`).

## How the shared cart works

- Guests: the cart lives on the device (same as the website's browser cart).
- On sign-in the guest cart is merged into the account cart (`POST /api/cart/merge`).
- Every change is applied instantly on screen and written to `/api/cart`; the server publishes the new cart on the private
  Pusher channel `private-cart-{userId}`, so the website and other devices update within about a second.
- The app also refetches when it returns to the foreground. Without Pusher keys it polls every 20s instead.
- Paying for an order empties the account cart everywhere.

## Releasing (Android APK, outside the Play Store)

There are two kinds of update.

**Small changes (screens, text, logic): over-the-air, no reinstall.**
Run `npm run publish-update -- "what changed"`. Installed apps download it the next time they open and switch to it on the
following launch. Always use this script rather than bare `eas update`: it bundles with the live-site values from
`eas.json` instead of the LAN address in `.env`, which would break every customer's app.

**Native changes (new Expo package, permissions, icon, SDK upgrade): a new APK.**
1. Bump `version` in `app.config.ts` (e.g. `1.0.0` → `1.1.0`). Over-the-air updates only reach builds with the same
   version, so older APKs never receive JS they can't run.
2. `npx eas-cli@latest build -p android --profile preview`, then download the `.apk` from the link it prints.
3. Rename it to `snoware-gadgets.apk` and publish a new GitHub release (tag `v1.1.0`) with it attached. The website's
   download button always serves the newest release's `snoware-gadgets.apk`.
4. On the website, open **Admin › Store settings** and set **Latest app version** to `1.1.0`. Older installs then show
   an "Update available" popup. Set **Minimum allowed version** too if old versions must stop working (e.g. a checkout change).

## Checks

`npm run typecheck`, `npm run lint`, `npx expo-doctor`
