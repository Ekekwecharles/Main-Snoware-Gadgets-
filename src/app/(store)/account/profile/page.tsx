import type { Metadata } from "next";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { ProfileForms } from "@/components/account/profile-forms";

export const metadata: Metadata = { title: "Profile", robots: { index: false } };

export default async function ProfilePage() {
  const session = await auth();
  const user = await db.query.users.findFirst({ where: eq(users.id, session!.user.id) });
  if (!user) return null;
  return <ProfileForms name={user.name ?? ""} email={user.email} phone={user.phone ?? ""} hasPassword={!!user.passwordHash} />;
}
