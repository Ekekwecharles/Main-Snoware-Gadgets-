import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { XCircle } from "lucide-react";
import { confirmPayment } from "@/lib/orders";
import { site } from "@/lib/site";

export const metadata: Metadata = { title: "Confirming payment", robots: { index: false } };

/** Paystack redirects here with ?reference=… after payment. */
export default async function VerifyPage(props: PageProps<"/checkout/verify">) {
  const sp = await props.searchParams;
  const reference = typeof sp.reference === "string" ? sp.reference : typeof sp.trxref === "string" ? sp.trxref : null;

  if (reference) {
    const result = await confirmPayment(reference).catch((err) => {
      console.error("[verify]", err);
      return null;
    });
    if (result?.ok) redirect(`/order/${reference}?success=1`);
  }

  return (
    <div className="container-x flex min-h-[60vh] flex-col items-center justify-center py-16 text-center">
      <XCircle className="h-14 w-14 text-brand-600" />
      <h1 className="mt-5 text-[28px] font-extrabold">Payment not completed</h1>
      <p className="mt-2 max-w-md text-muted">
        Your payment wasn't confirmed, so you haven't been charged for this order. If money left your account, don't worry — message us with your
        reference and we'll sort it out right away.
      </p>
      {reference && <p className="mt-3 rounded-full bg-mist px-4 py-1.5 font-mono text-[13px]">{reference}</p>}
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/checkout" className="rounded-full bg-ink px-6 py-3 font-semibold text-white">Try again</Link>
        <a href={`${site.whatsappLink}?text=${encodeURIComponent(`Hi, I need help with my payment. Reference: ${reference ?? ""}`)}`} target="_blank" rel="noreferrer" className="rounded-full px-6 py-3 font-semibold ring-1 ring-ink">
          Get help on WhatsApp
        </a>
      </div>
    </div>
  );
}
