import NextAuth, { CredentialsSignin, type DefaultSession } from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { accounts, sessions, users, verificationTokens } from "@/db/schema";
import { verifyCredentials } from "@/lib/auth-core";

declare module "next-auth" {
  interface Session {
    user: { id: string; role: "customer" | "admin" } & DefaultSession["user"];
  }
}

class EmailNotVerified extends CredentialsSignin {
  code = "email_not_verified";
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  // Credentials sign-in requires JWT sessions.
  session: { strategy: "jwt" },
  pages: { signIn: "/sign-in", error: "/sign-in" },
  trustHost: true,
  providers: [
    Google({
      // Google verifies email ownership, so linking to an existing email/password account is safe.
      allowDangerousEmailAccountLinking: true,
    }),
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(raw) {
        const result = await verifyCredentials(raw);
        if (!result.ok) {
          if (result.reason === "email_not_verified") throw new EmailNotVerified();
          return null;
        }
        const { user } = result;
        return { id: user.id, name: user.name, email: user.email, image: user.image };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user?.id || trigger === "update") {
        const id = user?.id ?? token.sub!;
        const dbUser = await db.query.users.findFirst({ where: eq(users.id, id) });
        token.sub = id;
        token.role = dbUser?.role ?? "customer";
        token.name = dbUser?.name ?? token.name;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.sub!;
      session.user.role = (token.role as "customer" | "admin") ?? "customer";
      return session;
    },
  },
  events: {
    async linkAccount({ user }) {
      // Accounts created or linked through Google are verified by Google.
      if (user.id) await db.update(users).set({ emailVerified: new Date() }).where(eq(users.id, user.id));
    },
  },
});

export async function requireAdmin() {
  const session = await auth();
  return session?.user?.role === "admin" ? session : null;
}
