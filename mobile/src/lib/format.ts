/** Prices are whole naira integers, formatted like the website (₦1,250,000). */
export function formatNaira(amount: number) {
  return `₦${Math.round(amount).toLocaleString("en-NG")}`;
}

export function discountPercent(price: number, compareAt?: number | null) {
  if (!compareAt || compareAt <= price) return 0;
  return Math.round(((compareAt - price) / compareAt) * 100);
}

const conditionLabels: Record<string, string> = {
  new: "Brand New",
  "open-box": "Open Box",
  boxed: "Boxed",
  "uk-used": "UK Used",
  "us-used": "US Used",
  "nigeria-used": "Nigerian Used",
};

export const conditionLabel = (value: string) => conditionLabels[value] ?? value;

/** One line for a product card: "Brand New", "UK Used", "New & Pre-owned" or "Pre-owned" — same wording as the website. */
export function conditionSummary(conditions: string[]) {
  if (conditions.length === 1) return conditionLabel(conditions[0]);
  return conditions.includes("new") ? "New & Pre-owned" : "Pre-owned";
}

/** Same label the website builds for a variant (storage · color · condition when not new). */
export function variantLabel(v: { condition: string; storage: string | null; color: string | null }) {
  const cond = v.condition === "new" ? null : conditionLabel(v.condition);
  return [v.storage, v.color, cond].filter(Boolean).join(" · ");
}

/** Mirrors maxOrderQty on the website: the variant's stock if set, otherwise effectively unlimited. */
export const maxOrderQty = (stock: number | null | undefined) => (stock == null ? 9999 : Math.max(stock, 0));
