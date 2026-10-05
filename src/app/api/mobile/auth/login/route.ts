import { NextResponse } from "next/server";
import { publicUser, signMobileToken } from "@/lib/api-auth";
import { verifyCredentials } from "@/lib/auth-core";

/** Email + password sign-in for the mobile app. Same accounts and rules as the website. */
export async function POST(req: Request) {
  const result = await verifyCredentials(await req.json().catch(() => null));
  if (!result.ok) {
    return result.reason === "email_not_verified"
      ? NextResponse.json({ error: "Please verify your email first. Check your inbox for the link.", code: "email_not_verified" }, { status: 403 })
      : NextResponse.json({ error: "Incorrect email or password.", code: "invalid" }, { status: 401 });
  }
  return NextResponse.json({ token: await signMobileToken(result.user), user: publicUser(result.user) });
}
