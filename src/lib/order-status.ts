/** Client-safe order status metadata (no server imports). */

export const statusSteps = [
  { key: "paid", label: "Order placed" },
  { key: "processing", label: "Preparing" },
  { key: "shipped", label: "On the way" },
  { key: "delivered", label: "Delivered" },
] as const;

export const pickupSteps = [
  { key: "paid", label: "Order placed" },
  { key: "processing", label: "Preparing" },
  { key: "ready_for_pickup", label: "Ready for pickup" },
  { key: "delivered", label: "Collected" },
] as const;

export const statusLabels: Record<string, string> = {
  pending: "Awaiting payment",
  paid: "Paid",
  processing: "Processing",
  shipped: "Shipped",
  ready_for_pickup: "Ready for pickup",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

type StatusInput = { status: string; paymentStatus: string; paymentMethod: string; paymentProofAt: Date | string | null };

/** Unpaid bank-transfer orders the customer should still see (to pay or upload their screenshot). */
export const isAwaitingTransfer = (o: StatusInput) => o.paymentMethod === "bank_transfer" && o.paymentStatus !== "paid" && o.status !== "cancelled";

/** Customer-facing status, including the two bank-transfer waiting states. */
export function orderStatusText(o: StatusInput) {
  if (isAwaitingTransfer(o)) return o.paymentProofAt ? "Confirming payment" : "Awaiting transfer";
  return statusLabels[o.status] ?? o.status;
}

/** Orders shown in "My orders": paid, cancelled, or bank transfers still being paid. */
export const isVisibleToCustomer = (o: StatusInput) => o.paymentStatus === "paid" || o.status === "cancelled" || isAwaitingTransfer(o);
