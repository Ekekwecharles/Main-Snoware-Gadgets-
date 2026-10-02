import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AccountNav } from "@/components/account/account-nav";

export default async function AccountLayout({ children }: LayoutProps<"/account">) {
  const session = await auth();
  if (!session?.user) redirect("/sign-in?callbackUrl=/account");

  return (
    <div className="container-x py-10 lg:py-14">
      <div className="mb-8">
        <p className="text-[14px] text-muted">Hello,</p>
        <h1 className="text-[30px] font-extrabold sm:text-[36px]">{session.user.name ?? session.user.email}</h1>
      </div>
      <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
        <AccountNav isAdmin={session.user.role === "admin"} />
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
