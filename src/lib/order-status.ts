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
