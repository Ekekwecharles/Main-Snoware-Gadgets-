import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { ArrowLeft, Mail, MapPin, Phone } from "lucide-react";
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
  const waNumber = order.phone.replace(/^0/, "234").replace(/^\+/, "");

  return (
    <>
      <Link href="/admin/orders" className="mb-4 inline-flex items-center gap-1.5 text-[14px] font-medium text-muted hover:text-ink">
        <ArrowLeft className="h-4 w-4" /> All orders
      </Link>
      <PageHeader title={order.reference} description={`Placed ${order.createdAt.toLocaleString("en-NG", { dateStyle: "full", timeStyle: "short" })}`} actions={<StatusPill status={order.paymentStatus === "paid" ? order.status : order.paymentStatus} />} />

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
            {order.paidAt && <p className="mt-1 text-[14px] text-muted">Paid {order.paidAt.toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" })}</p>}
            <p className="mt-1 text-[13px] text-muted">Paystack reference: <span className="font-mono">{order.reference}</span></p>
          </Card>
        </div>
      </div>
    </>
  );
}
