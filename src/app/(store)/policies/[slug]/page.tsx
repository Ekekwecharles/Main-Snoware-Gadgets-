import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ContentPage } from "@/components/content/content-page";
import { site } from "@/lib/site";

/** Starter policy drafts — the owner should review these (ideally with a lawyer) before launch. */
const policies: Record<string, { title: string; body: React.ReactNode }> = {
  terms: {
    title: "Terms of Service",
    body: (
      <>
        <p>These terms apply when you use the {site.name} website or buy from us. By placing an order you agree to them.</p>
        <h2>Orders and pricing</h2>
        <p>All prices are in Nigerian Naira (₦) and include applicable taxes. Prices and availability can change without notice. The price you see at the moment you pay is the price you'll be charged. If an item becomes unavailable after you've paid, we'll offer an alternative or a full refund.</p>
        <h2>Payment</h2>
        <p>Payments are processed by Paystack. An order is confirmed only after payment is successful.</p>
        <h2>Product descriptions</h2>
        <p>We describe products, including the condition of used devices, as accurately as we can. Photos may show a representative unit rather than the exact item.</p>
        <h2>Accounts</h2>
        <p>You're responsible for keeping your login details safe. Let us know straight away if you think someone else has used your account.</p>
        <h2>Contact</h2>
        <p>{site.name} (RC {site.rcNumber}) · {site.email} · WhatsApp {site.whatsapp}</p>
      </>
    ),
  },
  refund: {
    title: "Refund & Returns Policy",
    body: (
      <>
        <h2>7-day fault guarantee</h2>
        <p>If your device has a fault that wasn't caused by misuse, tell us within 7 days of delivery or pickup. After inspection, we'll repair it, replace it or refund you.</p>
        <h2>Change of mind</h2>
        <p>Unopened, sealed items can be returned within 48 hours for store credit, as long as they are in their original condition. Opened or activated devices can only be returned under the fault guarantee or warranty.</p>
        <h2>Not covered</h2>
        <ul>
          <li>Physical damage, liquid damage or broken seals after delivery</li>
          <li>Devices locked with your own iCloud or Google account</li>
          <li>Accessories missing from the original package</li>
        </ul>
        <h2>How refunds are paid</h2>
        <p>Approved refunds go back to your original payment method through Paystack, usually within 5–10 business days.</p>
      </>
    ),
  },
  privacy: {
    title: "Privacy Policy",
    body: (
      <>
        <p>This policy explains how {site.name} collects and uses your personal information, in line with the Nigeria Data Protection Act 2023.</p>
        <h2>What we collect</h2>
        <ul>
          <li>Your name, email, phone number and delivery address when you order or create an account</li>
          <li>Your order history and wishlist</li>
          <li>Basic technical data (such as browser type) used to keep the site secure and working</li>
        </ul>
        <p>Card details are handled entirely by Paystack. We never see or store them.</p>
        <h2>How we use it</h2>
        <p>We use your information to process and deliver orders, send receipts and updates, provide support, and — only if you subscribe — send you offers. You can unsubscribe at any time.</p>
        <h2>Sharing</h2>
        <p>We share only what's needed with Paystack (payments), our delivery partners (to deliver your order), and our email and hosting providers. We never sell your data.</p>
        <h2>Your rights</h2>
        <p>You can ask to see, correct or delete your personal data by emailing {site.email}.</p>
      </>
    ),
  },
};

export function generateStaticParams() {
  return Object.keys(policies).map((slug) => ({ slug }));
}

export async function generateMetadata(props: PageProps<"/policies/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  return { title: policies[slug]?.title };
}

export default async function PolicyPage(props: PageProps<"/policies/[slug]">) {
  const { slug } = await props.params;
  const policy = policies[slug];
  if (!policy) notFound();
  return (
    <ContentPage title={policy.title} intro={`Last updated ${new Date().toLocaleDateString("en-NG", { month: "long", year: "numeric" })}`}>
      <div className="prose-snow max-w-3xl">{policy.body}</div>
    </ContentPage>
  );
}
