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

## Checks

`npm run typecheck`, `npm run lint`, `npx expo-doctor`
