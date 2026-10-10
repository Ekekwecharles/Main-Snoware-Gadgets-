import "server-only";
import nodemailer from "nodemailer";
import { bankAccounts, onOrderLeadTime, site } from "@/lib/site";
import { absoluteUrl, formatNaira } from "@/lib/utils";
import type { Order, OrderItem, OrderStatus } from "@/db/schema";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST ?? "smtp.gmail.com",
  port: Number(process.env.SMTP_PORT ?? 465),
  secure: Number(process.env.SMTP_PORT ?? 465) === 465,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
});

type Attachment = { filename: string; content: Buffer; contentType: string };

async function send(to: string, subject: string, html: string, attachments?: Attachment[]) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn(`[mail] SMTP not configured — skipped "${subject}" to ${to}`);
    return;
  }
  try {
    await transporter.sendMail({
      from: process.env.MAIL_FROM ?? `"${site.name}" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
      attachments,
    });
  } catch (err) {
    // Email failures must never break checkout or sign-up.
    console.error(`[mail] failed to send "${subject}" to ${to}`, err);
  }
}

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

function layout(title: string, body: string) {
  return `<!doctype html><html><body style="margin:0;background:#f4f5f7;font-family:Segoe UI,Helvetica,Arial,sans-serif;color:#0a0a0b">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:24px 12px"><tr><td align="center">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fff;border-radius:16px;overflow:hidden">
    <tr><td style="background:#0a0a0b;padding:20px 28px">
      <span style="font-size:22px;font-weight:800;color:#e1251b">Sno</span><span style="font-size:22px;font-weight:800;color:#fff">ware</span>
      <span style="font-size:13px;color:#9aa3b2;margin-left:6px">Gadgets</span>
    </td></tr>
    <tr><td style="padding:28px">
      <h1 style="font-size:22px;margin:0 0 16px">${title}</h1>
      ${body}
    </td></tr>
    <tr><td style="padding:20px 28px;background:#f8f9fb;font-size:12px;color:#667085;line-height:1.6">
      ${site.name} · RC ${site.rcNumber}<br/>
      WhatsApp ${site.whatsapp} · ${site.email}<br/>
      Instagram &amp; TikTok ${site.socials.handle}
    </td></tr>
  </table></td></tr></table></body></html>`;
}

function button(href: string, label: string) {
  return `<a href="${href}" style="display:inline-block;background:#e1251b;color:#fff;text-decoration:none;font-weight:600;padding:12px 24px;border-radius:999px">${label}</a>`;
}

export async function sendVerificationEmail(email: string, token: string) {
  const url = absoluteUrl(`/verify-email?token=${token}&email=${encodeURIComponent(email)}`);
  await send(
    email,
    `Verify your ${site.name} account`,
    layout(
      "Confirm your email",
      `<p style="line-height:1.6">Welcome to ${site.name}! Tap the button below to verify your email and activate your account.</p>
       <p style="margin:24px 0">${button(url, "Verify email")}</p>
       <p style="font-size:13px;color:#667085">This link expires in 24 hours. If you didn't create an account, you can ignore this email.</p>`,
    ),
  );
}

export async function sendPasswordResetEmail(email: string, token: string) {
  const url = absoluteUrl(`/reset-password?token=${token}&email=${encodeURIComponent(email)}`);
  await send(
    email,
    `Reset your ${site.name} password`,
    layout(
      "Reset your password",
      `<p style="line-height:1.6">We received a request to reset your password. Tap below to choose a new one.</p>
       <p style="margin:24px 0">${button(url, "Reset password")}</p>
       <p style="font-size:13px;color:#667085">This link expires in 1 hour. If you didn't request this, no action is needed.</p>`,
    ),
  );
}

function itemsTable(items: OrderItem[], order: Order, totalLabel = "Total paid") {
  const rows = items
    .map(
      (i) => `<tr>
        <td style="padding:10px 0;border-bottom:1px solid #eef0f3">${esc(i.name)}${
          i.variantLabel ? `<br/><span style="font-size:12px;color:#667085">${esc(i.variantLabel)}</span>` : ""
        }${i.onOrder ? `<br/><span style="font-size:12px;color:#b45309">Available on order · ships in ${onOrderLeadTime}</span>` : ""}</td>
        <td style="padding:10px 0;border-bottom:1px solid #eef0f3;text-align:center">${i.quantity}</td>
        <td style="padding:10px 0;border-bottom:1px solid #eef0f3;text-align:right">${formatNaira(i.unitPrice * i.quantity)}</td>
      </tr>`,
    )
    .join("");
  return `<table width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;margin:16px 0">
    <tr style="color:#667085;font-size:12px"><td>Item</td><td style="text-align:center">Qty</td><td style="text-align:right">Total</td></tr>
    ${rows}
    <tr><td colspan="2" style="padding-top:12px">Subtotal</td><td style="padding-top:12px;text-align:right">${formatNaira(order.subtotal)}</td></tr>
    <tr><td colspan="2">${order.deliveryMethod === "pickup" ? "In-store pickup" : `Delivery (${esc(order.zoneName ?? "")})`}</td><td style="text-align:right">${
      order.deliveryFee ? formatNaira(order.deliveryFee) : "Free"
    }</td></tr>
    <tr><td colspan="2" style="padding-top:8px;font-weight:700">${totalLabel}</td><td style="padding-top:8px;text-align:right;font-weight:700">${formatNaira(order.total)}</td></tr>
  </table>`;
}

export async function sendOrderConfirmation(order: Order, items: OrderItem[]) {
  const fulfilment =
    order.deliveryMethod === "pickup"
      ? `<p style="line-height:1.6">We'll message you on <b>${esc(order.phone)}</b> as soon as your order is ready for pickup.</p>`
      : `<p style="line-height:1.6">Delivering to: <b>${esc([order.addressLine, order.city, order.state].filter(Boolean).join(", "))}</b></p>`;
  await send(
    order.email,
    `Order confirmed — ${order.reference}`,
    layout(
      `Thank you, ${esc(order.fullName.split(" ")[0])}!`,
      `<p style="line-height:1.6">Your payment was received and order <b>${order.reference}</b> is confirmed.</p>
       ${itemsTable(items, order)}
       ${fulfilment}
       <p style="margin:24px 0">${button(absoluteUrl(`/order/${order.reference}`), "Track your order")}</p>
       <p style="font-size:13px;color:#667085">Questions? Reply to this email or chat with us on WhatsApp ${site.whatsapp}.</p>`,
    ),
  );
}

function customerBlock(order: Order) {
  const wa = order.whatsapp ?? order.phone;
  const waLink = `https://wa.me/${wa.replace(/^0/, "234").replace(/^\+/, "")}`;
  const where = order.deliveryMethod === "pickup" ? "In-store pickup" : esc([order.addressLine, order.city, order.state].filter(Boolean).join(", "));
  return `<table cellpadding="0" cellspacing="0" style="font-size:14px;line-height:1.7">
    <tr><td style="color:#667085;padding-right:12px">Customer</td><td><b>${esc(order.fullName)}</b></td></tr>
    <tr><td style="color:#667085;padding-right:12px">Phone</td><td>${esc(order.phone)}</td></tr>
    <tr><td style="color:#667085;padding-right:12px">WhatsApp</td><td><a href="${waLink}">${esc(wa)}</a></td></tr>
    <tr><td style="color:#667085;padding-right:12px">Email</td><td>${esc(order.email)}</td></tr>
    <tr><td style="color:#667085;padding-right:12px">Fulfilment</td><td>${where}</td></tr>
  </table>${order.notes ? `<p style="margin-top:12px;font-size:14px"><b>Notes:</b> ${esc(order.notes)}</p>` : ""}`;
}

export async function sendAdminNewOrderAlert(order: Order, items: OrderItem[]) {
  const to = process.env.ADMIN_EMAIL ?? site.email;
  await send(
    to,
    `🛒 New paid order ${order.reference} — ${formatNaira(order.total)}`,
    layout(
      "New paid order",
      `${customerBlock(order)}${itemsTable(items, order)}
       <p style="margin:24px 0">${button(absoluteUrl(`/admin/orders/${order.id}`), "Open in admin")}</p>`,
    ),
  );
}

function bankDetailsHtml(order: Order) {
  const accounts = bankAccounts
    .map(
      (a, i) => `<tr><td style="padding:12px 14px;border-top:${i ? "1px solid #eef0f3" : "0"}">
        <span style="font-size:12px;color:#667085">${esc(a.bank)}${i === 0 ? " (main)" : ""}</span><br/>
        <span style="font-size:20px;font-weight:800;letter-spacing:1px">${a.accountNumber}</span><br/>
        <span style="font-size:13px">${esc(a.accountName)}</span></td></tr>`,
    )
    .join("");
  return `<table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f9fb;border-radius:12px;margin:16px 0">${accounts}</table>
    <p style="line-height:1.6">Amount: <b style="font-size:18px">${formatNaira(order.total)}</b><br/>
    Narration / remark: <b style="font-family:monospace;font-size:15px">${order.reference}</b></p>`;
}

/** Sent to the customer as soon as a bank-transfer order is placed. */
export async function sendTransferInstructions(order: Order, items: OrderItem[]) {
  await send(
    order.email,
    `Complete your payment — order ${order.reference}`,
    layout(
      `Thanks, ${esc(order.fullName.split(" ")[0])}! One last step`,
      `<p style="line-height:1.6">Your order is reserved. Transfer <b>exactly ${formatNaira(order.total)}</b> to any of the accounts below and put your order reference in the narration, so we can match your payment quickly.</p>
       ${bankDetailsHtml(order)}
       <p style="line-height:1.6">After paying, upload your payment screenshot on your order page. We'll confirm and email you as soon as we see it.</p>
       <p style="margin:24px 0">${button(absoluteUrl(`/order/${order.reference}`), "Upload payment screenshot")}</p>
       ${itemsTable(items, order, "Total to pay")}
       <p style="font-size:13px;color:#667085">Questions? Reply to this email or chat with us on WhatsApp ${site.whatsapp}.</p>`,
    ),
  );
}

/** Sent to the shop the moment a customer uploads their transfer screenshot (attached). */
export async function sendPaymentProofAlert(order: Order, items: OrderItem[], proof: Attachment) {
  await send(
    process.env.ADMIN_EMAIL ?? site.email,
    `💸 Transfer proof for ${order.reference} — ${formatNaira(order.total)} — ${order.fullName}`,
    layout(
      "Payment screenshot received",
      `<p style="line-height:1.6">Check your account for <b style="font-size:18px">${formatNaira(order.total)}</b> with narration <b style="font-family:monospace">${order.reference}</b>. The screenshot is attached.</p>
       ${customerBlock(order)}
       ${itemsTable(items, order, "Total to receive")}
       <p style="margin:24px 0">${button(absoluteUrl(`/admin/orders/${order.id}`), "Review & confirm payment")}</p>`,
    ),
    [proof],
  );
}

const statusCopy: Partial<Record<OrderStatus, { title: string; body: string }>> = {
  processing: { title: "We're preparing your order", body: "Your items are being checked and packed." },
  shipped: { title: "Your order is on its way", body: "Our delivery partner has your package. You'll get a call before arrival." },
  ready_for_pickup: { title: "Ready for pickup", body: "Your order is ready at our store. Bring your order reference." },
  delivered: { title: "Delivered — enjoy!", body: "Thanks for shopping with us. We'd love to hear what you think." },
  cancelled: { title: "Your order was cancelled", body: "If you were charged, a refund will be processed. Contact us for help." },
};

export async function sendOrderStatusUpdate(order: Order) {
  const copy = statusCopy[order.status];
  if (!copy) return;
  await send(
    order.email,
    `${copy.title} — ${order.reference}`,
    layout(
      copy.title,
      `<p style="line-height:1.6">${copy.body}</p>
       <p style="margin:24px 0">${button(absoluteUrl(`/order/${order.reference}`), "View order")}</p>`,
    ),
  );
}

export async function sendContactMessage(data: { name: string; email: string; phone?: string; message: string }) {
  await send(
    process.env.ADMIN_EMAIL ?? site.email,
    `Website enquiry from ${data.name}`,
    layout(
      "New contact form message",
      `<p><b>${esc(data.name)}</b> · ${esc(data.email)}${data.phone ? ` · ${esc(data.phone)}` : ""}</p>
       <p style="white-space:pre-wrap;line-height:1.6">${esc(data.message)}</p>`,
    ),
  );
}
