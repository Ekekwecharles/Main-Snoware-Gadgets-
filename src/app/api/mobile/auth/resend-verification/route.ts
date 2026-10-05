import { NextResponse } from "next/server";
import { resendVerification } from "@/lib/auth-core";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const result = await resendVerification(body?.email);
  return NextResponse.json(result, { status: result?.ok ? 200 : 400 });
}
