import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { api, CART_ORIGIN_HEADER } from "./api";
import { maxOrderQty } from "./format";
import type { CartItem, CartSnapshot } from "./types";

/**
 * Cart store with the same rules as the website's (src/store/cart.ts).
 * Guests: kept on the device. Signed in: every change is applied instantly, then written to
 * /api/cart, which pushes it to the user's other devices (website included).
 */

type CartState = {
  items: CartItem[];
  notes: string;
  /** Signed-in user whose account cart this mirrors; null for guests. */
  userId: string | null;
  add: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  setQuantity: (variantId: number, quantity: number) => void;
  remove: (variantId: number) => void;
  clear: () => void;
  setNotes: (notes: string) => void;
  hydrateFromServer: (cart: CartSnapshot) => void;
};

const clampQty = (q: number, stock: number | null | undefined) => Math.min(Math.max(Math.floor(q) || 0, 0), maxOrderQty(stock));

/** Identifies this app session so it can ignore the realtime echo of its own changes. */
export const cartOrigin = `app-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;

let pending = 0;

async function syncRequest(path: string, method: string, body?: unknown) {
  const { userId } = useCart.getState();
  if (!userId) return;
  pending++;
  let snapshot: CartSnapshot | null = null;
  try {
    snapshot = await api<CartSnapshot>(path, { method, body, headers: { [CART_ORIGIN_HEADER]: cartOrigin } });
  } catch (err) {
    console.warn("[cart] sync failed", err);
    snapshot = await fetchServerCart().catch(() => null);
  } finally {
    pending--;
  }
  // Only apply once this device's writes have all landed, so quick taps don't flicker.
  if (snapshot && pending === 0 && useCart.getState().userId === userId) useCart.getState().hydrateFromServer(snapshot);
}

export const fetchServerCart = () => api<CartSnapshot>("/api/cart");

/** Merges the guest cart into the account cart right after signing in, then mirrors the account cart. */
export async function attachCartToUser(userId: string) {
  const state = useCart.getState();
  const guest = state.userId === null ? state : { items: [], notes: "" };
  useCart.setState({ userId });
  const cart = await api<CartSnapshot>("/api/cart/merge", {
    method: "POST",
    body: { items: guest.items.map((i) => ({ variantId: i.variantId, quantity: i.quantity })), notes: guest.notes || undefined },
    headers: { [CART_ORIGIN_HEADER]: cartOrigin },
  });
  if (useCart.getState().userId === userId) useCart.getState().hydrateFromServer(cart);
}

/** On sign-out the account cart stays on the server; the device starts a fresh guest cart. */
export function detachCart() {
  useCart.setState({ items: [], notes: "", userId: null });
}

let notesTimer: ReturnType<typeof setTimeout> | undefined;

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      notes: "",
      userId: null,
      add: (item, quantity = 1) => {
        set((state) => {
          const existing = state.items.find((i) => i.variantId === item.variantId);
          const items = existing
            ? state.items.map((i) => (i.variantId === item.variantId ? { ...i, ...item, quantity: clampQty(i.quantity + quantity, item.stock) } : i))
            : [...state.items, { ...item, quantity: clampQty(quantity, item.stock) }];
          return { items };
        });
        void syncRequest("/api/cart/items", "POST", { variantId: item.variantId, quantity });
      },
      setQuantity: (variantId, quantity) => {
        set((state) => ({
          items: state.items
            .map((i) => (i.variantId === variantId ? { ...i, quantity: clampQty(quantity, i.stock) } : i))
            .filter((i) => i.quantity > 0),
        }));
        const line = get().items.find((i) => i.variantId === variantId);
        void syncRequest(`/api/cart/items/${variantId}`, "PUT", { quantity: line?.quantity ?? 0 });
      },
      remove: (variantId) => {
        set((state) => ({ items: state.items.filter((i) => i.variantId !== variantId) }));
        void syncRequest(`/api/cart/items/${variantId}`, "DELETE");
      },
      clear: () => {
        set({ items: [], notes: "" });
        void syncRequest("/api/cart", "DELETE");
      },
      setNotes: (notes) => {
        set({ notes });
        clearTimeout(notesTimer);
        notesTimer = setTimeout(() => void syncRequest("/api/cart", "PATCH", { notes }), 600);
      },
      hydrateFromServer: (cart) => set({ items: cart.items, notes: cart.notes }),
    }),
    {
      name: "snoware-cart",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ items: s.items, notes: s.notes, userId: s.userId }),
    },
  ),
);

export const cartCount = (items: CartItem[]) => items.reduce((n, i) => n + i.quantity, 0);
export const cartSubtotal = (items: CartItem[]) => items.reduce((n, i) => n + i.price * i.quantity, 0);
