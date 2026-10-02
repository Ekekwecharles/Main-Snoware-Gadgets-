import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AdminSidebar } from "@/components/admin/sidebar";

export const metadata: Metadata = { title: { default: "Admin", template: "%s · Admin | Snoware" }, robots: { index: false } };

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const session = await auth();
  if (!session?.user) redirect("/sign-in?callbackUrl=/admin");
  if (session.user.role !== "admin") redirect("/account");

  return (
    <div className="flex min-h-dvh bg-mist">
      <AdminSidebar userName={session.user.name ?? session.user.email ?? "Admin"} />
      <main className="min-w-0 flex-1 px-4 pt-20 pb-12 sm:px-6 lg:px-10 lg:pt-10">{children}</main>
    </div>
  );
}
