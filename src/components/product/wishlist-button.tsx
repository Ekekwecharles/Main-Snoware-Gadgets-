"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Heart } from "lucide-react";
import { toast } from "sonner";
import { toggleWishlist } from "@/app/actions/account";
import { cn } from "@/lib/utils";

export function WishlistButton({ productId, initialSaved, slug }: { productId: number; initialSaved: boolean; slug: string }) {
  const router = useRouter();
  const [saved, setSaved] = useState(initialSaved);
  const [pending, startTransition] = useTransition();

  return (
    <button
      onClick={() =>
        startTransition(async () => {
          const res = await toggleWishlist(productId);
          if (!res.signedIn) {
            router.push(`/sign-in?callbackUrl=/p/${slug}`);
            return;
          }
          setSaved(!!res.saved);
          toast.success(res.saved ? "Saved to your wishlist" : "Removed from wishlist");
        })
      }
      disabled={pending}
      aria-pressed={saved}
      aria-label={saved ? "Remove from wishlist" : "Save to wishlist"}
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full ring-1 ring-line transition hover:ring-ink disabled:opacity-60"
    >
      <Heart className={cn("h-5 w-5 transition", saved && "fill-brand-600 text-brand-600")} />
    </button>
  );
}
