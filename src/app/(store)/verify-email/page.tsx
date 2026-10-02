import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, XCircle } from "lucide-react";
import { verifyEmail } from "@/app/actions/auth";
import { AuthShell } from "@/components/auth/auth-shell";

export const metadata: Metadata = { title: "Verify email", robots: { index: false } };

export default async function VerifyEmailPage(props: PageProps<"/verify-email">) {
  const sp = await props.searchParams;
  const email = typeof sp.email === "string" ? sp.email : "";
  const token = typeof sp.token === "string" ? sp.token : "";
  const ok = await verifyEmail(email, token);

  return (
    <AuthShell title={ok ? "Email verified" : "Link expired"}>
      <div className="flex flex-col items-center text-center">
        {ok ? <CheckCircle2 className="h-14 w-14 text-success" /> : <XCircle className="h-14 w-14 text-brand-600" />}
        <p className="mt-4 text-[15px] text-muted">
          {ok
            ? "Your account is active. Sign in to track orders and check out faster."
            : "This verification link is invalid or has already been used. Sign in and we'll help you get a fresh one."}
        </p>
        <Link href="/sign-in" className="mt-6 flex h-12 w-full items-center justify-center rounded-full bg-ink font-semibold text-white">
          Go to sign in
        </Link>
      </div>
    </AuthShell>
  );
}
