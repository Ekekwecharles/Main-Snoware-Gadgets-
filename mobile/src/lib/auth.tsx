import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import * as SecureStore from "expo-secure-store";
import { api, ApiError, setAuthToken, setUnauthorizedHandler } from "./api";
import { attachCartToUser, detachCart, fetchServerCart, useCart } from "./cart";
import { getGoogleIdToken, googleSignOut } from "./google";
import { useCartRealtime } from "./realtime";
import type { User } from "./types";

const TOKEN_KEY = "snoware.token";

type AuthContextValue = {
  user: User | null;
  /** True until the stored session has been checked on launch. */
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<boolean>;
  signOut: () => Promise<void>;
  setUser: (user: User) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

type SessionResponse = { token: string; user: User };

function whenCartHydrated() {
  return new Promise<void>((resolve) => {
    if (useCart.persist.hasHydrated()) resolve();
    else {
      const unsub = useCart.persist.onFinishHydration(() => {
        unsub();
        resolve();
      });
    }
  });
}

/** Same account as the website: email/password or Google, exchanged for a bearer token kept in SecureStore. */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const clearSession = useCallback(async () => {
    setAuthToken(null);
    setUser(null);
    detachCart();
    await SecureStore.deleteItemAsync(TOKEN_KEY).catch(() => {});
  }, []);

  /** Links the device cart to the account: merge on a fresh sign-in, otherwise just load the account cart. */
  const syncCart = useCallback(async (u: User) => {
    await whenCartHydrated();
    if (useCart.getState().userId === u.id) {
      const cart = await fetchServerCart().catch(() => null);
      if (cart) useCart.getState().hydrateFromServer(cart);
    } else {
      await attachCartToUser(u.id).catch((err) => console.warn("[cart] merge failed", err));
    }
  }, []);

  const startSession = useCallback(
    async ({ token, user: u }: SessionResponse) => {
      await SecureStore.setItemAsync(TOKEN_KEY, token);
      setAuthToken(token);
      setUser(u);
      await syncCart(u);
    },
    [syncCart],
  );

  // Restore the session on launch.
  useEffect(() => {
    setUnauthorizedHandler(() => void clearSession());
    (async () => {
      const token = await SecureStore.getItemAsync(TOKEN_KEY).catch(() => null);
      if (token) {
        setAuthToken(token);
        try {
          const me = await api<User>("/api/mobile/me");
          setUser(me);
          void syncCart(me);
        } catch (err) {
          // Offline: keep the token and try again next launch. Rejected: sign out.
          if (err instanceof ApiError && err.status === 401) await clearSession();
        }
      }
      setLoading(false);
    })();
    return () => setUnauthorizedHandler(null);
  }, [clearSession, syncCart]);

  useCartRealtime(user?.id ?? null);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      setUser,
      signIn: async (email, password) => {
        await startSession(await api<SessionResponse>("/api/mobile/auth/login", { method: "POST", body: { email, password } }));
      },
      signInWithGoogle: async () => {
        const idToken = await getGoogleIdToken();
        if (!idToken) return false;
        await startSession(await api<SessionResponse>("/api/mobile/auth/google", { method: "POST", body: { idToken } }));
        return true;
      },
      signOut: async () => {
        await googleSignOut();
        await clearSession();
      },
    }),
    [user, loading, startSession, clearSession],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
