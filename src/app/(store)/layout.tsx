import { auth } from "@/auth";
import { getSettings } from "@/lib/catalog";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { CartDrawer } from "@/components/cart/cart-drawer";
import { CartSync } from "@/components/cart/cart-sync";
import { WhatsAppFab } from "@/components/layout/whatsapp-fab";
import { AppInstallBanner } from "@/components/layout/app-install-banner";
import { JsonLd, storeJsonLd } from "@/lib/seo";

export default async function StoreLayout({ children }: LayoutProps<"/">) {
  const [session, settings] = await Promise.all([auth().catch(() => null), getSettings()]);
  const user = session?.user ? { name: session.user.name, role: session.user.role } : null;

  return (
    <>
      <JsonLd data={storeJsonLd(settings.store_address)} />
      <AppInstallBanner />
      <Header user={user} announcement={settings.announcement} />
      <main className="flex-1">{children}</main>
      <Footer storeAddress={settings.store_address} />
      <CartDrawer />
      <CartSync userId={session?.user?.id ?? null} />
      <WhatsAppFab />
    </>
  );
}
