import { NextResponse } from "next/server";
import { requestPasswordReset } from "@/lib/auth-core";

/** Emails a reset link; the link opens the website's reset page. */
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const result = await requestPasswordReset(body?.email);
  return NextResponse.json(result, { status: result?.ok ? 200 : 400 });
}
