import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/auth/auth-shell";
import { ForgotPasswordForm } from "@/components/auth/forms";

export const metadata: Metadata = { title: "Forgot password" };

export default function ForgotPasswordPage() {
  return (
    <AuthShell title="Forgot your password?" subtitle="Enter your email and we'll send you a link to reset it.">
      <ForgotPasswordForm />
      <p className="mt-5 text-center text-[14px]">
        <Link href="/sign-in" className="font-semibold text-sky hover:underline">Back to sign in</Link>
      </p>
    </AuthShell>
  );
}
