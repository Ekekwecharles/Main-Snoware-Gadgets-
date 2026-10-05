import type { Href } from "expo-router";

/**
 * Banners and menus store website paths (/p/slug, /c/apple/iphone, /used?condition=boxed, /shop).
 * Map them to the matching app screen.
 */
export function hrefFromSitePath(path: string | null | undefined): Href | null {
  if (!path) return null;
  const [pathname, query = ""] = path.split("?");
  const params = Object.fromEntries(new URLSearchParams(query));
  const parts = pathname.split("/").filter(Boolean);

  if (parts[0] === "p" && parts[1]) return `/product/${parts[1]}`;
  if (parts[0] === "c" && parts.length > 1) {
    return { pathname: "/listing", params: { category: parts[parts.length - 1], q: params.q ?? "" } };
  }
  if (parts[0] === "used") return { pathname: "/listing", params: { used: "1", title: "Pre-owned", condition: params.condition ?? "" } };
  if (parts[0] === "shop") return { pathname: "/listing", params: { title: "All products" } };
  return null;
}
