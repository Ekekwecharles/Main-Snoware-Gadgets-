import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/auth/auth-shell";
import { ResetPasswordForm } from "@/components/auth/forms";

export const metadata: Metadata = { title: "Reset password", robots: { index: false } };

export default async function ResetPasswordPage(props: PageProps<"/reset-password">) {
  const sp = await props.searchParams;
  const email = typeof sp.email === "string" ? sp.email : "";
  const token = typeof sp.token === "string" ? sp.token : "";

  return (
    <AuthShell title="Choose a new password">
      {email && token ? (
        <ResetPasswordForm email={email} token={token} />
      ) : (
        <p className="text-muted">
          This link is incomplete. <Link href="/forgot-password" className="font-semibold text-sky hover:underline">Request a new reset link</Link>.
        </p>
      )}
    </AuthShell>
  );
}
