"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { maxOrderQty } from "@/lib/site";
import { CART_ORIGIN_HEADER, type CartItem, type CartSnapshot } from "@/lib/cart-types";

export type { CartItem };

type CartState = {
  items: CartItem[];
  notes: string;
  isOpen: boolean;
  /** Signed-in user whose server cart this mirrors; null for guests (localStorage only). */
  userId: string | null;
  add: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  setQuantity: (variantId: number, quantity: number) => void;
  remove: (variantId: number) => void;
  clear: () => void;
  setNotes: (notes: string) => void;
  open: () => void;
  close: () => void;
  /** Replace the cart with the server's copy (after a sync or a realtime update from another device). */
  hydrateFromServer: (cart: CartSnapshot) => void;
  setUser: (userId: string | null) => void;
};

const clampQty = (q: number, stock: number | null | undefined) => Math.min(Math.max(Math.floor(q) || 0, 0), maxOrderQty(stock));

/** Identifies this tab so it can ignore the realtime echo of its own changes. */
export const cartOrigin =
  typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : Math.random().toString(36).slice(2);

/** Requests still in flight; server snapshots are applied only once all of this tab's writes have landed. */
let pending = 0;

async function syncRequest(path: string, method: string, body?: unknown) {
  const { userId } = useCart.getState();
  if (!userId) return;
  pending++;
  let snapshot: CartSnapshot | null = null;
  try {
    const res = await fetch(path, {
      method,
      headers: { "content-type": "application/json", [CART_ORIGIN_HEADER]: cartOrigin },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    if (res.ok) snapshot = await res.json();
    else if (res.status !== 401) snapshot = await fetchServerCart();
  } catch (err) {
    console.error("[cart] sync failed", err);
  } finally {
    pending--;
  }
  if (snapshot && pending === 0 && useCart.getState().userId === userId) useCart.getState().hydrateFromServer(snapshot);
}

export async function fetchServerCart(): Promise<CartSnapshot | null> {
  const res = await fetch("/api/cart", { cache: "no-store" });
  return res.ok ? res.json() : null;
}

let notesTimer: ReturnType<typeof setTimeout> | undefined;

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      notes: "",
      isOpen: false,
      userId: null,
      add: (item, quantity = 1) => {
        set((state) => {
          const existing = state.items.find((i) => i.variantId === item.variantId);
          const items = existing
            ? state.items.map((i) => (i.variantId === item.variantId ? { ...i, ...item, quantity: clampQty(i.quantity + quantity, item.stock) } : i))
            : [...state.items, { ...item, quantity: clampQty(quantity, item.stock) }];
          return { items, isOpen: true };
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
      open: () => set({ isOpen: true }),
      close: () => set({ isOpen: false }),
      hydrateFromServer: (cart) => set({ items: cart.items, notes: cart.notes }),
      setUser: (userId) => set({ userId }),
    }),
    {
      name: "snoware-cart",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ items: s.items, notes: s.notes, userId: s.userId }),
    },
  ),
);

export const cartCount = (items: CartItem[]) => items.reduce((n, i) => n + i.quantity, 0);
export const cartSubtotal = (items: CartItem[]) => items.reduce((n, i) => n + i.price * i.quantity, 0);
