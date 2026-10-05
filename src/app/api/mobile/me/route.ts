import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { getApiUser, publicUser, unauthorized } from "@/lib/api-auth";
import { updateProfile } from "@/lib/auth-core";

export async function GET(req: Request) {
  const apiUser = await getApiUser(req);
  if (!apiUser) return unauthorized();
  const user = await db.query.users.findFirst({ where: eq(users.id, apiUser.id) });
  if (!user) return unauthorized();
  return NextResponse.json(publicUser(user));
}

export async function PATCH(req: Request) {
  const apiUser = await getApiUser(req);
  if (!apiUser) return unauthorized();
  const result = await updateProfile(apiUser.id, await req.json().catch(() => null));
  if (!result?.ok) return NextResponse.json(result, { status: 400 });
  const user = await db.query.users.findFirst({ where: eq(users.id, apiUser.id) });
  return NextResponse.json({ ...result, user: user && publicUser(user) });
}
