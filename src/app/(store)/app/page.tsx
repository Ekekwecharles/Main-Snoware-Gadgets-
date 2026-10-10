import type { Metadata } from "next";
import Image from "next/image";
import { Download, Heart, PackageCheck, RefreshCw, Share, ShieldCheck, Smartphone, SquarePlus } from "lucide-react";
import { ContentPage } from "@/components/content/content-page";
import { appDownloads, site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Get the App",
  description: `Download the ${site.name} app for Android, or add the store to your iPhone Home Screen.`,
};

const perks = [
  { icon: RefreshCw, title: "One cart everywhere", text: "Sign in and your cart syncs live between the app and the website." },
  { icon: PackageCheck, title: "Track your orders", text: "See every order and its delivery status in one place." },
  { icon: Heart, title: "Wishlist", text: "Save gadgets you love and come back when you're ready." },
  { icon: ShieldCheck, title: "Same secure checkout", text: "Pay with Paystack or bank transfer, just like on the website." },
];

export default function GetTheAppPage() {
  return (
    <ContentPage eyebrow="Mobile app" title="Get the Snoware Gadgets app" intro="Shop faster, keep one cart across your devices, and track your orders on the go.">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {perks.map(({ icon: Icon, title, text }) => (
          <div key={title} className="rounded-2xl border border-line p-5">
            <Icon className="h-6 w-6 text-brand-600" />
            <h2 className="mt-3 text-[15px] font-semibold">{title}</h2>
            <p className="mt-1 text-[14px] text-muted">{text}</p>
          </div>
        ))}
      </div>

      <div className="mt-12 grid gap-6 lg:grid-cols-2">
        <section id="android" className="scroll-mt-24 rounded-3xl bg-ink p-6 text-white sm:p-8">
          <div className="flex items-center gap-4">
            <Image src="/icons/icon-192.png" alt="" width={64} height={64} className="h-16 w-16 rounded-2xl" />
            <div>
              <p className="text-[13px] font-semibold tracking-[0.18em] text-brand-200 uppercase">Android</p>
              <h2 className="text-[22px] font-extrabold">Install the app</h2>
            </div>
          </div>
          <a
            href={appDownloads.android}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-brand-600 px-6 py-3.5 text-[15px] font-semibold hover:bg-brand-700 sm:w-auto sm:inline-flex"
          >
            <Download className="h-5 w-5" /> Download for Android (APK)
          </a>
          <ol className="mt-6 space-y-3 text-[14px] text-white/80">
            <Step n={1}>Tap <b className="text-white">Download for Android</b>. If Chrome asks, tap <b className="text-white">Download anyway</b>.</Step>
            <Step n={2}>Open the downloaded file from your notifications or <b className="text-white">Files › Downloads</b>.</Step>
            <Step n={3}>
              If you see &ldquo;For your security, your phone is not allowed to install unknown apps&rdquo;, tap <b className="text-white">Settings</b>,
              turn on <b className="text-white">Allow from this source</b>, then go back.
            </Step>
            <Step n={4}>Tap <b className="text-white">Install</b> (and <b className="text-white">Install anyway</b> if Play Protect asks), then <b className="text-white">Open</b>.</Step>
          </ol>
          <p className="mt-6 text-[12.5px] text-white/50">
            We&rsquo;re not on the Play Store yet, so Android shows these warnings for any app installed outside it. Only download the app from this page.
          </p>
        </section>

        <section id="ios" className="scroll-mt-24 rounded-3xl border border-line bg-mist p-6 sm:p-8">
          <div className="flex items-center gap-4">
            <Image src="/icons/icon-192.png" alt="" width={64} height={64} className="h-16 w-16 rounded-2xl" />
            <div>
              <p className="text-[13px] font-semibold tracking-[0.18em] text-brand-600 uppercase">iPhone &amp; iPad</p>
              <h2 className="text-[22px] font-extrabold">{appDownloads.ios ? "Join the beta" : "Add to Home Screen"}</h2>
            </div>
          </div>
          {appDownloads.ios ? (
            <>
              <a
                href={appDownloads.ios}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-ink px-6 py-3.5 text-[15px] font-semibold text-white hover:bg-ink-soft sm:w-auto sm:inline-flex"
              >
                <Smartphone className="h-5 w-5" /> Get it on TestFlight
              </a>
              <ol className="mt-6 space-y-3 text-[14px] text-muted">
                <Step n={1} light>Install Apple&rsquo;s free <b className="text-ink">TestFlight</b> app from the App Store.</Step>
                <Step n={2} light>Come back and tap <b className="text-ink">Get it on TestFlight</b>, then <b className="text-ink">Accept</b> and <b className="text-ink">Install</b>.</Step>
              </ol>
            </>
          ) : (
            <>
              <p className="mt-6 text-[14px] text-muted">
                Our iPhone app is on its way to the App Store. Until then, add the store to your Home Screen — it opens full-screen, just like an app.
              </p>
              <ol className="mt-5 space-y-3 text-[14px] text-muted">
                <Step n={1} light>Open this page in <b className="text-ink">Safari</b> (other browsers can&rsquo;t add apps to the Home Screen on older iPhones).</Step>
                <Step n={2} light>
                  Tap the <b className="text-ink">Share</b> button <Share className="inline h-4 w-4 align-[-3px] text-sky" /> at the bottom of the screen.
                </Step>
                <Step n={3} light>
                  Scroll down and tap <b className="text-ink">Add to Home Screen</b> <SquarePlus className="inline h-4 w-4 align-[-3px]" />, then <b className="text-ink">Add</b>.
                </Step>
                <Step n={4} light>Open <b className="text-ink">Snoware</b> from your Home Screen and shop.</Step>
              </ol>
            </>
          )}
        </section>
      </div>
    </ContentPage>
  );
}

function Step({ n, light, children }: { n: number; light?: boolean; children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <span
        className={
          light
            ? "flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-ink text-[12px] font-bold text-white"
            : "flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/15 text-[12px] font-bold text-white"
        }
      >
        {n}
      </span>
      <span className="pt-0.5">{children}</span>
    </li>
  );
}
