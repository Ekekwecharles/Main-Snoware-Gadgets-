"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { updateOrderStatus } from "@/app/actions/admin";
import type { OrderStatus } from "@/db/schema";
import { statusLabels } from "@/lib/order-status";
import { buttonClass, inputClass } from "./ui";

export function OrderStatusForm({ orderId, current, isPickup }: { orderId: number; current: OrderStatus; isPickup: boolean }) {
  const options: OrderStatus[] = isPickup ? ["paid", "processing", "ready_for_pickup", "delivered", "cancelled"] : ["paid", "processing", "shipped", "delivered", "cancelled"];
  const [status, setStatus] = useState<OrderStatus>(current);
  const [notify, setNotify] = useState(true);
  const [pending, startTransition] = useTransition();

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        startTransition(async () => {
          const res = await updateOrderStatus(orderId, status, notify);
          toast.success(res.message);
        });
      }}
      className="space-y-3"
    >
      <select value={status} onChange={(e) => setStatus(e.target.value as OrderStatus)} className={inputClass} aria-label="Order status">
        {options.map((s) => (
          <option key={s} value={s}>{statusLabels[s]}</option>
        ))}
      </select>
      <label className="flex items-center gap-2 text-[14px]">
        <input type="checkbox" checked={notify} onChange={(e) => setNotify(e.target.checked)} className="h-4 w-4 accent-ink" /> Email the customer about this update
      </label>
      <button disabled={pending || status === current} className={`${buttonClass} w-full`}>
        {pending && <Loader2 className="h-4 w-4 animate-spin" />} Update status
      </button>
    </form>
  );
}
