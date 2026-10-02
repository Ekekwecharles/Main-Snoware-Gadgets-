import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AuthShell } from "@/components/auth/auth-shell";
import { Divider, GoogleButton } from "@/components/auth/google-button";
import { SignInForm } from "@/components/auth/forms";

export const metadata: Metadata = { title: "Sign in" };

const errorMessages: Record<string, string> = {
  OAuthAccountNotLinked: "This email is linked to another sign-in method. Sign in with your password instead.",
  AccessDenied: "Access was denied. Please try again.",
  Configuration: "Sign-in is temporarily unavailable. Please try again shortly.",
};

export default async function SignInPage(props: PageProps<"/sign-in">) {
  const sp = await props.searchParams;
  const callbackUrl = typeof sp.callbackUrl === "string" && sp.callbackUrl.startsWith("/") ? sp.callbackUrl : "/account";
  const session = await auth();
  if (session?.user) redirect(callbackUrl);
  const error = typeof sp.error === "string" ? (errorMessages[sp.error] ?? "Sign-in failed. Please try again.") : undefined;

  return (
    <AuthShell
      title="Welcome back"
      subtitle={
        <>
          New to Snoware? <Link href={`/sign-up${callbackUrl !== "/account" ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : ""}`} className="font-semibold text-sky hover:underline">Create an account</Link>
        </>
      }
    >
      <GoogleButton callbackUrl={callbackUrl} />
      <Divider />
      <SignInForm callbackUrl={callbackUrl} initialError={error} />
    </AuthShell>
  );
}
