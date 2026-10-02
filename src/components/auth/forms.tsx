"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import {
  forgotPasswordAction,
  resendVerificationAction,
  resetPasswordAction,
  signInAction,
  signUpAction,
} from "@/app/actions/auth";
import { AuthField, Notice } from "./auth-shell";

function Submit({ pending, children }: { pending: boolean; children: React.ReactNode }) {
  return (
    <button disabled={pending} className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-ink text-[15px] font-semibold text-white transition hover:bg-ink-soft disabled:opacity-60">
      {pending && <Loader2 className="h-4.5 w-4.5 animate-spin" />}
      {children}
    </button>
  );
}

function PasswordField({ name, label, error, autoComplete }: { name: string; label: string; error?: string; autoComplete: string }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <AuthField label={label} name={name} type={show ? "text" : "password"} autoComplete={autoComplete} error={error} required />
      <button type="button" onClick={() => setShow(!show)} className="absolute top-[34px] right-3 rounded-full p-1.5 text-muted hover:bg-mist" aria-label={show ? "Hide password" : "Show password"}>
        {show ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
      </button>
    </div>
  );
}

export function SignInForm({ callbackUrl, initialError }: { callbackUrl: string; initialError?: string }) {
  const [state, action, pending] = useActionState(signInAction, null);
  const [email, setEmail] = useState("");
  return (
    <div className="space-y-4">
      {(state?.message || initialError) && <Notice>{state?.message ?? initialError}</Notice>}
      {state?.fieldErrors?.unverified && <ResendVerification email={email} />}
      <form action={action} className="space-y-4">
        <input type="hidden" name="callbackUrl" value={callbackUrl} />
        <AuthField label="Email" name="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        <PasswordField name="password" label="Password" autoComplete="current-password" />
        <div className="text-right">
          <Link href="/forgot-password" className="text-[13.5px] font-medium text-sky hover:underline">Forgot password?</Link>
        </div>
        <Submit pending={pending}>Sign in</Submit>
      </form>
    </div>
  );
}

export function SignUpForm() {
  const [state, action, pending] = useActionState(signUpAction, null);
  if (state?.ok) return <Notice ok>{state.message}</Notice>;
  return (
    <form action={action} className="space-y-4">
      {state?.message && <Notice>{state.message}</Notice>}
      <AuthField label="Full name" name="name" autoComplete="name" required error={state?.fieldErrors?.name} />
      <AuthField label="Email" name="email" type="email" autoComplete="email" required error={state?.fieldErrors?.email} />
      <PasswordField name="password" label="Password" autoComplete="new-password" error={state?.fieldErrors?.password} />
      <p className="text-[12.5px] text-muted">At least 8 characters, with a letter and a number.</p>
      <Submit pending={pending}>Create account</Submit>
    </form>
  );
}

function ResendVerification({ email }: { email: string }) {
  const [state, action, pending] = useActionState(resendVerificationAction, null);
  if (state?.ok) return <Notice ok>{state.message}</Notice>;
  return (
    <form action={action}>
      <input type="hidden" name="email" value={email} />
      <button disabled={pending} className="text-[13.5px] font-semibold text-sky hover:underline">
        {pending ? "Sending…" : "Resend verification email"}
      </button>
    </form>
  );
}

export function ForgotPasswordForm() {
  const [state, action, pending] = useActionState(forgotPasswordAction, null);
  if (state?.ok) return <Notice ok>{state.message}</Notice>;
  return (
    <form action={action} className="space-y-4">
      <AuthField label="Email" name="email" type="email" autoComplete="email" required error={state?.fieldErrors?.email} />
      <Submit pending={pending}>Send reset link</Submit>
    </form>
  );
}

export function ResetPasswordForm({ email, token }: { email: string; token: string }) {
  const [state, action, pending] = useActionState(resetPasswordAction, null);
  if (state?.ok)
    return (
      <div className="space-y-4">
        <Notice ok>{state.message}</Notice>
        <Link href="/sign-in" className="flex h-12 items-center justify-center rounded-full bg-ink font-semibold text-white">Sign in</Link>
      </div>
    );
  return (
    <form action={action} className="space-y-4">
      {state?.message && <Notice>{state.message}</Notice>}
      <input type="hidden" name="email" value={email} />
      <input type="hidden" name="token" value={token} />
      <PasswordField name="password" label="New password" autoComplete="new-password" error={state?.fieldErrors?.password} />
      <PasswordField name="confirm" label="Confirm new password" autoComplete="new-password" error={state?.fieldErrors?.confirm} />
      <Submit pending={pending}>Reset password</Submit>
    </form>
  );
}
