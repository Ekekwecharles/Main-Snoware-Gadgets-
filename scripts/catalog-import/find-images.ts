/**
 * Helper for finding official product photos: fetches a manufacturer page and lists the image URLs in it
 * (from <img>, srcset, og:image and JSON data), filtered by an optional substring.
 *   npx tsx scripts/catalog-import/find-images.ts <page-url> [filter]
 */
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0 Safari/537.36";

// Image servers that serve pictures from extension-less URLs (Apple Store, Samsung, Google Store, ...).
const imageHosts = /(store\.storeimages\.cdn-apple\.com\/[^"'\s\\]+|images\.samsung\.com\/is\/image\/[^"'\s\\]+|lh3\.googleusercontent\.com\/[^"'\s\\]+)/gi;

async function main() {
  const [url, filter] = process.argv.slice(2);
  const res = await fetch(url, { headers: { "user-agent": UA, accept: "text/html,*/*", "accept-language": "en-GB,en;q=0.9" } });
  console.log(`HTTP ${res.status} ${res.url}`);
  const html = (await res.text()).replace(/\\u002F/gi, "/").replace(/\\\//g, "/");
  const found = new Set<string>();
  const add = (raw: string) => {
    let u = raw.replace(/&amp;/g, "&");
    if (u.startsWith("//")) u = `https:${u}`;
    if (!u.startsWith("http")) u = `https://${u}`;
    if (!filter || u.toLowerCase().includes(filter.toLowerCase())) found.add(u);
  };
  for (const m of html.matchAll(/((?:https?:)?\/\/[^"'\s(),\\]+?\.(?:jpe?g|png|webp|avif)(?:\?[^"'\s\\]*)?)/gi)) add(m[1]);
  for (const m of html.matchAll(imageHosts)) add(m[1]);
  for (const u of found) console.log(u);
  console.log(`(${found.size} images)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
