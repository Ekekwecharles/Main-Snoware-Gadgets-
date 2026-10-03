"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { maxOrderQty } from "@/lib/site";

export type CartItem = {
  variantId: number;
  productId: number;
  slug: string;
  name: string;
  variantLabel: string;
  image: string | null;
  categorySlug: string;
  /** Display price only — the server re-prices every item at checkout. */
  price: number;
  quantity: number;
  /** "Available on order" — shown so the shopper knows it ships after sourcing. */
  onOrder?: boolean;
  /** Optional quantity limit for this variant (null/undefined = unlimited). Re-checked at checkout. */
  stock?: number | null;
};

type CartState = {
  items: CartItem[];
  notes: string;
  isOpen: boolean;
  add: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  setQuantity: (variantId: number, quantity: number) => void;
  remove: (variantId: number) => void;
  clear: () => void;
  setNotes: (notes: string) => void;
  open: () => void;
  close: () => void;
};

const clampQty = (q: number, stock: number | null | undefined) => Math.min(Math.max(Math.floor(q) || 0, 0), maxOrderQty(stock));

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      notes: "",
      isOpen: false,
      add: (item, quantity = 1) =>
        set((state) => {
          const existing = state.items.find((i) => i.variantId === item.variantId);
          const items = existing
            ? state.items.map((i) => (i.variantId === item.variantId ? { ...i, ...item, quantity: clampQty(i.quantity + quantity, item.stock) } : i))
            : [...state.items, { ...item, quantity: clampQty(quantity, item.stock) }];
          return { items, isOpen: true };
        }),
      setQuantity: (variantId, quantity) =>
        set((state) => ({
          items: state.items
            .map((i) => (i.variantId === variantId ? { ...i, quantity: clampQty(quantity, i.stock) } : i))
            .filter((i) => i.quantity > 0),
        })),
      remove: (variantId) => set((state) => ({ items: state.items.filter((i) => i.variantId !== variantId) })),
      clear: () => set({ items: [], notes: "" }),
      setNotes: (notes) => set({ notes }),
      open: () => set({ isOpen: true }),
      close: () => set({ isOpen: false }),
    }),
    {
      name: "snoware-cart",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ items: s.items, notes: s.notes }),
    },
  ),
);

export const cartCount = (items: CartItem[]) => items.reduce((n, i) => n + i.quantity, 0);
export const cartSubtotal = (items: CartItem[]) => items.reduce((n, i) => n + i.price * i.quantity, 0);
