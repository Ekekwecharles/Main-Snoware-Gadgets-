"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { confirmTransferPayment, updateOrderStatus } from "@/app/actions/admin";
import { buttonClass, secondaryButtonClass } from "./ui";

/** Buttons for an unpaid bank-transfer order: confirm the money arrived, or cancel the order. */
export function TransferReview({ orderId, total }: { orderId: number; total: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const confirm = () => {
    if (!window.confirm(`Confirm you have received ${total} for this order? The customer will be emailed that their payment is confirmed.`)) return;
    startTransition(async () => {
      const res = await confirmTransferPayment(orderId);
      if (res.ok) toast.success(res.message);
      else toast.error(res.message);
      router.refresh();
    });
  };

  const cancel = () => {
    if (!window.confirm("Cancel this unpaid order? The customer will be emailed that it was cancelled.")) return;
    startTransition(async () => {
      const res = await updateOrderStatus(orderId, "cancelled", true);
      toast.success(res.message);
      router.refresh();
    });
  };

  return (
    <div className="flex flex-col gap-2">
      <button onClick={confirm} disabled={pending} className={`${buttonClass} w-full bg-success hover:bg-success/90`}>
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />} Confirm payment received
      </button>
      <button onClick={cancel} disabled={pending} className={`${secondaryButtonClass} w-full`}>
        <XCircle className="h-4 w-4" /> Cancel order
      </button>
    </div>
  );
}
