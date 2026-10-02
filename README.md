# Snoware Gadgets — Online Store

Full e-commerce site for **Snoware Gadgets** (RC 8611693): new & UK/US/Nigerian-used phones, laptops, gaming, Starlink, audio and accessories.

**Stack:** Next.js 16 (App Router) · TypeScript · Tailwind CSS 4 · Neon Postgres + Drizzle ORM · Auth.js (email/password + Google) · Nodemailer · Paystack · Cloudinary

---

## 1. Set up your accounts (one-time)

| Service | What to do | Env vars |
|---|---|---|
| **Neon** (database) | Create a project at [console.neon.tech](https://console.neon.tech) → copy the **pooled** connection string | `DATABASE_URL` |
| **Auth secret** | Run `npx auth secret` (or paste any long random string) | `AUTH_SECRET` |
| **Google sign-in** | [Google Cloud Console](https://console.cloud.google.com) → APIs & Services → OAuth consent screen (External) → Credentials → *Create OAuth client ID* → **Web application**. Authorised redirect URIs: `http://localhost:3000/api/auth/callback/google` and `https://YOUR-DOMAIN/api/auth/callback/google` | `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET` |
| **Gmail (Nodemailer)** | On snowaregadgets@gmail.com: turn on 2-Step Verification → [App passwords](https://myaccount.google.com/apppasswords) → create one | `SMTP_USER`, `SMTP_PASS` |
| **Paystack** | [Dashboard](https://dashboard.paystack.com/#/settings/developers) → copy **test** keys first. Set Webhook URL to `https://YOUR-DOMAIN/api/paystack/webhook` | `PAYSTACK_SECRET_KEY`, `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` |
| **Cloudinary** (product photos) | Free account at [cloudinary.com](https://cloudinary.com) → Dashboard → API keys | `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` |

## 2. Run it locally

```bash
cp .env.example .env.local     # then fill in the values above
npm install
npm run db:push                # creates all tables in Neon
npm run db:seed                # categories, delivery zones, banners, starter products + admin account
npm run dev                    # http://localhost:3000
```

Sign in with `ADMIN_EMAIL` / `ADMIN_PASSWORD` from `.env.local` and open **/admin**.

> Re-seed from scratch (keeps users & orders): `npm run db:seed -- --force`

## 3. Before you go live

1. **Admin → Store settings:** add your real store address, opening hours and map location.
2. **Admin → Delivery zones:** set your actual delivery fees per area.
3. **Admin → Products:** correct the prices and stock, and **upload your own product photos** (your own pictures or the manufacturer's official press images). Starter products show a branded placeholder until a photo is added.
4. **Admin → Banners:** adjust homepage slides and promo tiles.
5. Review the policy pages (`src/app/(store)/policies/[slug]/page.tsx`, `warranty`, `shipping`) — they're starter drafts.
6. Switch Paystack to **live** keys and update the webhook URL.

## Deploying (Vercel)

Import the repo on [vercel.com](https://vercel.com), add every variable from `.env.example` (set `NEXT_PUBLIC_SITE_URL` to your domain), and deploy. Add the production Google redirect URI and Paystack webhook URL.

## Useful scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Local dev server |
| `npm run build` | Production build |
| `npm run lint` / `npm run typecheck` | Code checks |
| `npm run db:push` | Sync schema to the database |
| `npm run db:studio` | Browse the database in your browser |
| `npm run db:seed` | Seed starter data |

## Where things live

- `src/lib/site.ts` — business details, mega-menu, footer links
- `src/db/schema.ts` — database tables
- `src/app/(store)` — storefront pages · `src/app/admin` — admin dashboard
- `src/app/actions` — server actions (checkout, auth, admin…)
- `src/lib/orders.ts` — Paystack payment confirmation (shared by redirect + webhook)
- `src/lib/mail.ts` — email templates
