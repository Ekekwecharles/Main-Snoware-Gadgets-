import { NextResponse } from "next/server";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { accounts, users } from "@/db/schema";
import { publicUser, signMobileToken } from "@/lib/api-auth";

const googleKeys = createRemoteJWKSet(new URL("https://www.googleapis.com/oauth2/v3/certs"));

/** Google OAuth client IDs whose ID tokens we accept: the website's plus the native iOS/Android ones. */
const audiences = () =>
  [process.env.AUTH_GOOGLE_ID, process.env.AUTH_GOOGLE_IOS_ID, process.env.AUTH_GOOGLE_ANDROID_ID].filter((v): v is string => !!v);

/**
 * Native Google sign-in: the app gets an ID token from Google and exchanges it here for our token.
 * Mirrors the website's Google provider (verified email, account linking by email), so a person
 * lands in the same account whichever device or method they use.
 */
export async function POST(req: Request) {
  const parsed = z.object({ idToken: z.string().min(20) }).safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Missing Google token" }, { status: 400 });

  let claims: { sub?: string; email?: string; email_verified?: boolean; name?: string; picture?: string };
  try {
    const { payload } = await jwtVerify(parsed.data.idToken, googleKeys, {
      issuer: ["https://accounts.google.com", "accounts.google.com"],
      audience: audiences(),
    });
    claims = payload as typeof claims;
  } catch {
    return NextResponse.json({ error: "Google sign-in failed. Please try again." }, { status: 401 });
  }
  if (!claims.sub || !claims.email || !claims.email_verified) {
    return NextResponse.json({ error: "Your Google account's email isn't verified." }, { status: 401 });
  }

  const email = claims.email.toLowerCase();
  let user = await db.query.users.findFirst({ where: eq(users.email, email) });
  if (!user) {
    [user] = await db.insert(users).values({ email, name: claims.name ?? null, image: claims.picture ?? null, emailVerified: new Date() }).returning();
  } else if (!user.emailVerified) {
    // Google verifies email ownership, same as the website's linkAccount event.
    [user] = await db.update(users).set({ emailVerified: new Date() }).where(eq(users.id, user.id)).returning();
  }
  await db
    .insert(accounts)
    .values({ userId: user.id, type: "oidc", provider: "google", providerAccountId: claims.sub })
    .onConflictDoNothing();

  return NextResponse.json({ token: await signMobileToken(user), user: publicUser(user) });
}
