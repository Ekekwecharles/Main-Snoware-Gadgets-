import { googleSignInAction } from "@/app/actions/auth";
import { GoogleIcon } from "@/components/brand/social-icons";

export function GoogleButton({ callbackUrl, label = "Continue with Google" }: { callbackUrl?: string; label?: string }) {
  return (
    <form action={googleSignInAction}>
      <input type="hidden" name="callbackUrl" value={callbackUrl ?? "/account"} />
      <button className="flex h-12 w-full items-center justify-center gap-3 rounded-full bg-white text-[15px] font-semibold ring-1 ring-line transition hover:bg-mist hover:ring-ink/30">
        <GoogleIcon className="h-5 w-5" /> {label}
      </button>
    </form>
  );
}

export function Divider() {
  return (
    <div className="my-6 flex items-center gap-3 text-[12.5px] text-muted">
      <span className="h-px flex-1 bg-line" /> or use email <span className="h-px flex-1 bg-line" />
    </div>
  );
}
