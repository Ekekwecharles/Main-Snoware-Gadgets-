import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AuthShell } from "@/components/auth/auth-shell";
import { Divider, GoogleButton } from "@/components/auth/google-button";
import { SignUpForm } from "@/components/auth/forms";

export const metadata: Metadata = { title: "Create account" };

export default async function SignUpPage(props: PageProps<"/sign-up">) {
  const sp = await props.searchParams;
  const callbackUrl = typeof sp.callbackUrl === "string" && sp.callbackUrl.startsWith("/") ? sp.callbackUrl : "/account";
  const session = await auth();
  if (session?.user) redirect(callbackUrl);

  return (
    <AuthShell
      title="Create your account"
      subtitle={
        <>
          Already have one? <Link href="/sign-in" className="font-semibold text-sky hover:underline">Sign in</Link>
        </>
      }
    >
      <GoogleButton callbackUrl={callbackUrl} label="Sign up with Google" />
      <Divider />
      <SignUpForm />
      <p className="mt-5 text-center text-[12.5px] text-muted">
        By creating an account you agree to our <Link href="/policies/terms" className="underline">Terms</Link> and{" "}
        <Link href="/policies/privacy" className="underline">Privacy Policy</Link>.
      </p>
    </AuthShell>
  );
}
