import { NextResponse } from "next/server";
import { getAllCategories } from "@/lib/catalog";

export const revalidate = 300;

/** All categories (flat, with parentId) — the app builds the tree. */
export async function GET() {
  const all = await getAllCategories();
  return NextResponse.json(all.map(({ id, name, slug, parentId, image, icon, sortOrder }) => ({ id, name, slug, parentId, image, icon, sortOrder })));
}
