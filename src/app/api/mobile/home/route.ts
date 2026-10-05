import { NextResponse } from "next/server";
import { getBanners, getFeaturedProducts, getProductsByCategorySlug, getSettings, getUsedHighlights } from "@/lib/catalog";

export const revalidate = 300;

/** Everything the app's home tab needs in one request. Banner links are website paths (/c/…, /p/…). */
export async function GET() {
  const [hero, featured, apple, samsung, used, settings] = await Promise.all([
    getBanners("hero"),
    getFeaturedProducts(10),
    getProductsByCategorySlug("apple", 10),
    getProductsByCategorySlug("samsung", 10),
    getUsedHighlights(10),
    getSettings(),
  ]);
  return NextResponse.json({
    announcement: settings.announcement,
    banners: hero.map(({ id, eyebrow, title, subtitle, priceText, ctaLabel, ctaHref, image, theme }) => ({
      id, eyebrow, title, subtitle, priceText, ctaLabel, ctaHref, image, theme,
    })),
    sections: [
      { title: "Featured", category: null, products: featured },
      { title: "Apple", category: "apple", products: apple },
      { title: "Samsung", category: "samsung", products: samsung },
      { title: "Pre-owned deals", category: null, used: true, products: used },
    ].filter((s) => s.products.length),
  });
}
