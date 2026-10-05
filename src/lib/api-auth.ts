import "server-only";
import { jwtVerify, SignJWT } from "jose";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import type { User } from "@/db/schema";

export type ApiUser = { id: string; role: "customer" | "admin" };

const AUDIENCE = "snoware-mobile";
const secret = () => new TextEncoder().encode(process.env.AUTH_SECRET);

/** Issues the bearer token the mobile app stores after signing in. */
export async function signMobileToken(user: Pick<User, "id" | "role">) {
  return new SignJWT({ role: user.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setAudience(AUDIENCE)
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secret());
}

/**
 * Resolves the signed-in user for an API request: a mobile bearer token if present,
 * otherwise the website's Auth.js session cookie. Both refer to the same `users` row.
 */
export async function getApiUser(req: Request): Promise<ApiUser | null> {
  const header = req.headers.get("authorization");
  if (header?.startsWith("Bearer ")) {
    try {
      const { payload } = await jwtVerify(header.slice(7), secret(), { audience: AUDIENCE });
      if (!payload.sub) return null;
      return { id: payload.sub, role: payload.role === "admin" ? "admin" : "customer" };
    } catch {
      return null;
    }
  }
  const session = await auth().catch(() => null);
  return session?.user?.id ? { id: session.user.id, role: session.user.role } : null;
}

export const unauthorized = () => NextResponse.json({ error: "Please sign in." }, { status: 401 });

/** Shape returned to the mobile app for the signed-in user. */
export function publicUser(u: Pick<User, "id" | "name" | "email" | "image" | "phone" | "role" | "passwordHash">) {
  return { id: u.id, name: u.name, email: u.email, image: u.image, phone: u.phone, role: u.role, hasPassword: !!u.passwordHash };
}
