import { NextResponse } from "next/server";
import { registerUser } from "@/lib/auth-core";

/** Creates an account (or adds a password to a Google account) and emails a verification link. */
export async function POST(req: Request) {
  const result = await registerUser(await req.json().catch(() => null));
  return NextResponse.json(result, { status: result?.ok ? 200 : 400 });
}
