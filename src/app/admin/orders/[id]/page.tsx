import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { ArrowLeft, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { TransferReview } from "@/components/admin/transfer-review";
import { privateFileUrl } from "@/lib/cloudinary";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { Card, PageHeader, StatusPill } from "@/components/admin/ui";
import { OrderStatusForm } from "@/components/admin/order-status-form";
import { ProductImage } from "@/components/product/product-image";
import { formatNaira } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminOrderPage(props: PageProps<"/admin/orders/[id]">) {
  const { id } = await props.params;
  const order = await db.query.orders.findFirst({ where: eq(orders.id, Number(id)), with: { items: true } });
  if (!order) notFound();
  const waNumber = (order.whatsapp ?? order.phone).replace(/^0/, "234").replace(/^\+/, "");
  const awaitingTransfer = order.paymentMethod === "bank_transfer" && order.paymentStatus !== "paid" && order.status !== "cancelled";
  const proofUrl = order.paymentProofPublicId && order.paymentProofFormat ? privateFileUrl(order.paymentProofPublicId, order.paymentProofFormat) : null;

  return (
    <>
      <Link href="/admin/orders" className="mb-4 inline-flex items-center gap-1.5 text-[14px] font-medium text-muted hover:text-ink">
        <ArrowLeft className="h-4 w-4" /> All orders
      </Link>
      <PageHeader title={order.reference} description={`Placed ${order.createdAt.toLocaleString("en-NG", { dateStyle: "full", timeStyle: "short" })}`} actions={<StatusPill status={order.paymentStatus === "paid" ? order.status : awaitingTransfer ? (order.paymentProofAt ? "proof_sent" : "awaiting_transfer") : order.paymentStatus} />} />

      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <div className="space-y-6">
          <Card>
            <h2 className="mb-4 text-[17px] font-bold">Items</h2>
            <ul className="divide-y divide-line">
              {order.items.map((i) => (
                <li key={i.id} className="flex items-center gap-4 py-3">
                  <span className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-mist">
                    <ProductImage src={i.image} alt={i.name} sizes="56px" />
                  </span>
                  <div className="min-w-0 flex-1">
                    {i.productId ? <Link href={`/admin/products/${i.productId}`} className="font-medium hover:underline">{i.name}</Link> : <p className="font-medium">{i.name}</p>}
                    <p className="text-[13px] text-muted">{[i.variantLabel, `${formatNaira(i.unitPrice)} × ${i.quantity}`].filter(Boolean).join(" · ")}</p>
                    {i.onOrder && (
                      <span className="mt-1 inline-block rounded-full bg-amber-50 px-2 py-0.5 text-[11.5px] font-semibold text-amber-800 ring-1 ring-amber-200">
                        On order — source from vendor
                      </span>
                    )}
                  </div>
                  <p className="font-semibold">{formatNaira(i.unitPrice * i.quantity)}</p>
                </li>
              ))}
            </ul>
            <dl className="mt-4 space-y-1.5 border-t border-line pt-4 text-[14.5px]">
              <div className="flex justify-between"><dt className="text-muted">Subtotal</dt><dd>{formatNaira(order.subtotal)}</dd></div>
              <div className="flex justify-between"><dt className="text-muted">{order.deliveryMethod === "pickup" ? "Pickup" : `Delivery (${order.zoneName})`}</dt><dd>{order.deliveryFee ? formatNaira(order.deliveryFee) : "Free"}</dd></div>
              <div className="flex justify-between text-[17px] font-bold"><dt>Total</dt><dd>{formatNaira(order.total)}</dd></div>
            </dl>
          </Card>
          {order.notes && (
            <Card>
              <h2 className="mb-2 text-[17px] font-bold">Customer notes</h2>
              <p className="text-[14.5px] whitespace-pre-wrap">{order.notes}</p>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          {awaitingTransfer && (
            <Card className="ring-2 ring-amber-300">
              <h2 className="text-[17px] font-bold">Bank transfer — awaiting confirmation</h2>
              <p className="mt-1 text-[14px] text-muted">
                Check your OPay / Moniepoint for <b className="text-ink">{formatNaira(order.total)}</b> with narration{" "}
                <span className="font-mono font-semibold text-ink">{order.reference}</span>.
              </p>
              {order.paymentProofAt ? (
                <div className="mt-4">
                  <p className="mb-2 text-[13px] font-semibold">
                    Screenshot uploaded {order.paymentProofAt.toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" })}
                  </p>
                  {proofUrl ? (
                    order.paymentProofFormat === "pdf" ? (
                      <a href={proofUrl} target="_blank" rel="noreferrer" className="text-[14px] font-semibold text-sky hover:underline">Open PDF receipt</a>
                    ) : (
                      <a href={proofUrl} target="_blank" rel="noreferrer" title="Open full size">
                        {/* eslint-disable-next-line @next/next/no-img-element -- private signed Cloudinary URL */}
                        <img src={proofUrl} alt={`Payment screenshot for ${order.reference}`} className="max-h-96 w-full rounded-xl object-contain ring-1 ring-line" />
                      </a>
                    )
                  ) : (
                    <p className="text-[13px] text-muted">The screenshot was emailed to you (file storage isn&apos;t configured).</p>
                  )}
                </div>
              ) : (
                <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-[13.5px] text-amber-800">No screenshot uploaded yet.</p>
              )}
              <div className="mt-4">
                <TransferReview orderId={order.id} total={formatNaira(order.total)} />
              </div>
            </Card>
          )}
          {order.paymentStatus === "paid" && (
            <Card>
              <h2 className="mb-4 text-[17px] font-bold">Update status</h2>
              <OrderStatusForm orderId={order.id} current={order.status} isPickup={order.deliveryMethod === "pickup"} />
            </Card>
          )}
          <Card>
            <h2 className="mb-4 text-[17px] font-bold">Customer</h2>
            <p className="font-semibold">{order.fullName}</p>
            <ul className="mt-3 space-y-2 text-[14px]">
              <li className="flex items-center gap-2"><Mail className="h-4 w-4 text-muted" /><a href={`mailto:${order.email}`} className="hover:underline">{order.email}</a></li>
              <li className="flex items-center gap-2"><Phone className="h-4 w-4 text-muted" /><a href={`tel:${order.phone}`} className="hover:underline">{order.phone}</a></li>
              {order.whatsapp && order.whatsapp !== order.phone && (
                <li className="flex items-center gap-2"><MessageCircle className="h-4 w-4 text-muted" /><span>WhatsApp {order.whatsapp}</span></li>
              )}
              <li className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 text-muted" />
                <span>{order.deliveryMethod === "pickup" ? "In-store pickup" : [order.addressLine, order.city, order.state].filter(Boolean).join(", ")}</span>
              </li>
            </ul>
            <a
              href={`https://wa.me/${waNumber}?text=${encodeURIComponent(`Hi ${order.fullName.split(" ")[0]}, this is Snoware Gadgets about your order ${order.reference}.`)}`}
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex h-10 items-center rounded-full bg-[#25D366] px-4 text-[13.5px] font-semibold text-white"
            >
              Message on WhatsApp
            </a>
          </Card>
          <Card>
            <h2 className="mb-3 text-[17px] font-bold">Payment</h2>
            <p className="text-[14px]">Status: <StatusPill status={order.paymentStatus} /></p>
            <p className="mt-1 text-[14px]">Method: <b>{order.paymentMethod === "bank_transfer" ? "Bank transfer" : "Paystack"}</b></p>
            {order.paidAt && <p className="mt-1 text-[14px] text-muted">Paid {order.paidAt.toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" })}</p>}
            <p className="mt-1 text-[13px] text-muted">
              {order.paymentMethod === "bank_transfer" ? "Transfer narration" : "Paystack reference"}: <span className="font-mono">{order.reference}</span>
            </p>
            {order.paymentMethod === "bank_transfer" && order.paymentStatus === "paid" && proofUrl && (
              <a href={proofUrl} target="_blank" rel="noreferrer" className="mt-2 inline-block text-[13.5px] font-semibold text-sky hover:underline">View payment screenshot</a>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
