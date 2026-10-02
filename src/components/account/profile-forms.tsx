"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { changePasswordAction, updateProfileAction } from "@/app/actions/account";
import { AuthField, Notice } from "@/components/auth/auth-shell";

export function ProfileForms({ name, email, phone, hasPassword }: { name: string; email: string; phone: string; hasPassword: boolean }) {
  const [profileState, profileAction, profilePending] = useActionState(updateProfileAction, null);
  const [pwState, pwAction, pwPending] = useActionState(changePasswordAction, null);

  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <form action={profileAction} className="space-y-4 rounded-3xl p-6 ring-1 ring-line">
        <h2 className="text-[18px] font-bold">Personal details</h2>
        {profileState?.message && <Notice ok={profileState.ok}>{profileState.message}</Notice>}
        <AuthField label="Full name" name="name" defaultValue={name} required />
        <AuthField label="Phone" name="phone" type="tel" defaultValue={phone} placeholder="0803 123 4567" />
        <div>
          <p className="mb-1.5 text-[13.5px] font-semibold">Email</p>
          <p className="rounded-xl bg-mist px-4 py-3 text-[15px] text-muted">{email}</p>
        </div>
        <button disabled={profilePending} className="flex h-11 items-center gap-2 rounded-full bg-ink px-6 font-semibold text-white disabled:opacity-60">
          {profilePending && <Loader2 className="h-4 w-4 animate-spin" />} Save changes
        </button>
      </form>

      <form action={pwAction} className="space-y-4 rounded-3xl p-6 ring-1 ring-line">
        <h2 className="text-[18px] font-bold">{hasPassword ? "Change password" : "Set a password"}</h2>
        {!hasPassword && <p className="text-[13.5px] text-muted">You signed up with Google. Add a password to also sign in with your email.</p>}
        {pwState?.message && <Notice ok={pwState.ok}>{pwState.message}</Notice>}
        {hasPassword && <AuthField label="Current password" name="current" type="password" autoComplete="current-password" required />}
        <AuthField label="New password" name="password" type="password" autoComplete="new-password" required />
        <button disabled={pwPending} className="flex h-11 items-center gap-2 rounded-full bg-ink px-6 font-semibold text-white disabled:opacity-60">
          {pwPending && <Loader2 className="h-4 w-4 animate-spin" />} {hasPassword ? "Update password" : "Set password"}
        </button>
      </form>
    </div>
  );
}
