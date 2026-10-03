/**
 * Seeds categories, brands, delivery zones, banners, an admin user and starter products.
 *   npm run db:seed            – seeds an empty database
 *   npm run db:seed -- --force – wipes catalogue/banners/zones first (keeps users & orders)
 *
 * Prices are sample values — edit them in /admin/products.
 */
import { config } from "dotenv";
config({ path: ".env.local" });
config();

import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";

type Condition = import("../lib/site").ConditionValue;

type CategoryNode = { name: string; slug: string; icon?: string; description?: string; children?: CategoryNode[] };

const categoryTree: CategoryNode[] = [
  {
    name: "Apple",
    slug: "apple",
    icon: "phone",
    description: "New and UK/US used iPhones, MacBooks, iPads, Apple Watch, AirPods and original chargers.",
    children: [
      { name: "iPhone", slug: "iphone", icon: "phone" },
      { name: "MacBook", slug: "macbook", icon: "laptop" },
      { name: "iPad", slug: "ipad", icon: "tablet" },
      { name: "Apple Watch", slug: "apple-watch", icon: "watch" },
      { name: "AirPods", slug: "airpods", icon: "earbuds" },
      { name: "AirTag", slug: "airtag", icon: "tag" },
      { name: "Apple Chargers", slug: "apple-chargers", icon: "charger" },
    ],
  },
  {
    name: "Samsung",
    slug: "samsung",
    icon: "phone",
    description: "Galaxy S, Galaxy Z Fold, tablets, watches, Buds and original Samsung chargers.",
    children: [
      { name: "Galaxy Phones", slug: "samsung-phones", icon: "phone" },
      { name: "Galaxy Tablets", slug: "samsung-tablets", icon: "tablet" },
      { name: "Galaxy Watches", slug: "samsung-watches", icon: "watch" },
      { name: "Galaxy Buds", slug: "galaxy-buds", icon: "earbuds" },
      { name: "Samsung Chargers", slug: "samsung-chargers", icon: "charger" },
    ],
  },
  {
    name: "Google Pixel",
    slug: "google-pixel",
    icon: "phone",
    description: "Pixel 9, Pixel 10 Pro XL and Pixel Fold phones — new and used — plus Pixel Buds and Pixel Watch.",
    children: [
      { name: "Pixel Phones", slug: "pixel-phones", icon: "phone" },
      { name: "Pixel Buds", slug: "pixel-buds", icon: "earbuds" },
      { name: "Pixel Watch", slug: "pixel-watch", icon: "watch" },
    ],
  },
  {
    name: "Laptops & Computers",
    slug: "computers",
    icon: "laptop",
    description: "Office, student, gaming and workstation laptops, all-in-one PCs and printers.",
    children: [
      { name: "Office & Student Laptops", slug: "office-student-laptops", icon: "laptop" },
      { name: "Gaming Laptops", slug: "gaming-laptops", icon: "laptop" },
      { name: "Workstation & Graphics Laptops", slug: "workstation-laptops", icon: "laptop" },
      { name: "All-in-One PCs", slug: "all-in-one-pcs", icon: "desktop" },
      { name: "Printers", slug: "printers", icon: "printer" },
    ],
  },
  {
    name: "Gaming",
    slug: "gaming",
    icon: "console",
    description: "PlayStation 5, PlayStation 4 and gaming monitors.",
    children: [
      { name: "PlayStation 5", slug: "ps5", icon: "console" },
      { name: "PlayStation 4", slug: "ps4", icon: "console" },
      { name: "Gaming Monitors", slug: "gaming-monitors", icon: "monitor" },
    ],
  },
  {
    name: "Audio",
    slug: "audio",
    icon: "speaker",
    description: "Bluetooth speakers from JBL, Onyx and Zealot.",
    children: [
      { name: "JBL", slug: "jbl", icon: "speaker" },
      { name: "Onyx", slug: "onyx", icon: "speaker" },
      { name: "Zealot", slug: "zealot", icon: "speaker" },
    ],
  },
  { name: "Starlink", slug: "starlink", icon: "satellite", description: "Starlink Mini and Standard kits for fast internet anywhere." },
  {
    name: "Others",
    slug: "others",
    icon: "accessory",
    description: "Ray-Ban smart glasses, projectors, drones and accessories.",
    children: [
      { name: "Ray-Ban Glasses", slug: "ray-ban", icon: "glasses" },
      { name: "Projectors", slug: "projectors", icon: "projector" },
      { name: "Drones", slug: "drones", icon: "drone" },
      { name: "Accessories", slug: "accessories", icon: "accessory" },
    ],
  },
];

const brandNames = ["Apple", "Samsung", "Google", "HP", "Dell", "Lenovo", "ASUS", "Sony", "JBL", "Onyx", "Zealot", "Starlink", "Ray-Ban", "DJI", "Canon", "LG", "Anker"];

type V = { condition?: Condition; storage?: string; color?: string; hex?: string; price: number; compareAt?: number; stock?: number };
type P = {
  name: string;
  category: string;
  brand: string;
  short: string;
  highlights: string[];
  specs: [string, string][];
  badge?: string;
  featured?: boolean;
  sales?: number;
  variants: V[];
};

const colors = {
  black: { color: "Black", hex: "#1d1d1f" },
  silver: { color: "Silver", hex: "#d9dadc" },
  blue: { color: "Deep Blue", hex: "#2c3e63" },
  orange: { color: "Cosmic Orange", hex: "#e6772e" },
  white: { color: "White", hex: "#f5f5f0" },
  sky: { color: "Sky Blue", hex: "#b9d3ea" },
  titanium: { color: "Titanium Gray", hex: "#8a8d91" },
  navy: { color: "Navy", hex: "#1f2a44" },
  mint: { color: "Mint", hex: "#cfe8d9" },
  pink: { color: "Pink", hex: "#f2c9d1" },
};

/** Expand storage × colour × condition combos with a price per storage+condition. */
function matrix(
  storages: string[],
  cols: (keyof typeof colors)[],
  priceFor: (storage: string, condition: Condition) => number | null,
  conds: Condition[] = ["new"],
): V[] {
  const out: V[] = [];
  for (const condition of conds)
    for (const storage of storages) {
      const price = priceFor(storage, condition);
      if (price == null) continue;
      cols.forEach((c, i) =>
        out.push({ condition, storage, ...colors[c], price, stock: (storage.length + i + condition.length) % 4 === 0 ? 0 : 3 + i }),
      );
    }
  return out;
}

const products: P[] = [
  /* ── Apple ── */
  {
    name: "iPhone 17 Pro Max",
    category: "iphone",
    brand: "Apple",
    short: "The biggest Pro iPhone with the largest battery, a 6.9-inch ProMotion display and a pro-grade triple camera.",
    highlights: ["6.9-inch Super Retina XDR, up to 120Hz", "48MP triple camera system with 8x optical-quality zoom", "A19 Pro chip with vapour-chamber cooling", "All-day battery, USB-C fast charging"],
    specs: [["Display", "6.9-inch OLED, 120Hz ProMotion"], ["Chip", "A19 Pro"], ["Cameras", "48MP Main · 48MP Ultra Wide · 48MP Telephoto"], ["Front camera", "18MP Center Stage"], ["Connector", "USB-C"], ["Warranty", "1 year (new) · 6 months (used)"]],
    badge: "New",
    featured: true,
    sales: 140,
    variants: matrix(
      ["256GB", "512GB", "1TB", "2TB"],
      ["orange", "blue", "silver"],
      (s, c) => {
        const base = { "256GB": 2_350_000, "512GB": 2_750_000, "1TB": 3_250_000, "2TB": 3_950_000 }[s]!;
        if (c === "new") return base;
        if (s === "2TB") return null;
        return Math.round((base * 0.82) / 1000) * 1000;
      },
      ["new", "uk-used"],
    ),
  },
  {
    name: "iPhone 17 Pro",
    category: "iphone",
    brand: "Apple",
    short: "Pro performance and the full Pro camera system in a more compact 6.3-inch design.",
    highlights: ["6.3-inch ProMotion display", "48MP Pro camera system", "A19 Pro chip", "Aluminium unibody design"],
    specs: [["Display", "6.3-inch OLED, 120Hz"], ["Chip", "A19 Pro"], ["Cameras", "Triple 48MP"], ["Connector", "USB-C"]],
    featured: true,
    sales: 98,
    variants: matrix(["256GB", "512GB", "1TB"], ["orange", "blue", "silver"], (s, c) => {
      const base = { "256GB": 2_050_000, "512GB": 2_450_000, "1TB": 2_900_000 }[s]!;
      return c === "new" ? base : Math.round((base * 0.82) / 1000) * 1000;
    }, ["new", "uk-used", "us-used"]),
  },
  {
    name: "iPhone Air",
    category: "iphone",
    brand: "Apple",
    short: "Apple's thinnest iPhone — remarkably light, with a pro-class chip inside.",
    highlights: ["Ultra-thin, lightweight titanium frame", "6.5-inch ProMotion display", "48MP Fusion camera", "A19 Pro chip"],
    specs: [["Display", "6.5-inch OLED, 120Hz"], ["Chip", "A19 Pro"], ["Camera", "48MP Fusion"], ["SIM", "eSIM only"]],
    sales: 51,
    variants: matrix(["256GB", "512GB", "1TB"], ["sky", "white", "black"], (s) => ({ "256GB": 1_800_000, "512GB": 2_250_000, "1TB": 2_650_000 })[s]!),
  },
  {
    name: "iPhone 16 Pro Max",
    category: "iphone",
    brand: "Apple",
    short: "Last year's flagship at a friendlier price — available new and UK/US used.",
    highlights: ["6.9-inch display", "A18 Pro chip", "5x Telephoto camera", "Camera Control button"],
    specs: [["Display", "6.9-inch OLED, 120Hz"], ["Chip", "A18 Pro"], ["Cameras", "48MP Fusion · 48MP Ultra Wide · 12MP 5x Telephoto"]],
    badge: "Hot deal",
    featured: true,
    sales: 160,
    variants: matrix(["256GB", "512GB", "1TB"], ["titanium", "black", "white"], (s, c) => {
      const base = { "256GB": 1_650_000, "512GB": 1_950_000, "1TB": 2_250_000 }[s]!;
      const factor: Partial<Record<Condition, number>> = { new: 1, "uk-used": 0.78, "us-used": 0.76, "nigeria-used": 0.7 };
      return factor[c] ? base * factor[c] : null;
    }, ["new", "uk-used", "us-used", "nigeria-used"]).map((v) => ({ ...v, price: Math.round(v.price / 1000) * 1000, compareAt: v.condition === "new" ? v.price + 150_000 : undefined })),
  },
  {
    name: "iPhone 16",
    category: "iphone",
    brand: "Apple",
    short: "A great all-rounder with Camera Control and the A18 chip.",
    highlights: ["6.1-inch Super Retina XDR", "A18 chip", "48MP Fusion camera", "Action button"],
    specs: [["Display", "6.1-inch OLED"], ["Chip", "A18"], ["Camera", "48MP Fusion · 12MP Ultra Wide"]],
    sales: 120,
    variants: matrix(["128GB", "256GB"], ["black", "pink", "white"], (s, c) => {
      const base = { "128GB": 1_150_000, "256GB": 1_300_000 }[s]!;
      return Math.round((c === "new" ? base : base * 0.75) / 1000) * 1000;
    }, ["new", "uk-used", "nigeria-used"]),
  },
  {
    name: 'MacBook Pro 14" M5',
    category: "macbook",
    brand: "Apple",
    short: "Serious power for creators and developers, with an M5 chip and a stunning Liquid Retina XDR display.",
    highlights: ["Apple M5 chip", "14.2-inch Liquid Retina XDR", "Up to 24 hours battery life", "HDMI, SD card slot, MagSafe"],
    specs: [["Chip", "Apple M5 (10-core CPU, 10-core GPU)"], ["Memory", "16GB / 24GB unified memory"], ["Display", "14.2-inch Liquid Retina XDR"], ["Ports", "3× Thunderbolt, HDMI, SDXC, MagSafe 3"]],
    badge: "New",
    featured: true,
    sales: 44,
    variants: matrix(["16GB · 512GB", "16GB · 1TB", "24GB · 1TB"], ["black", "silver"], (s) => ({ "16GB · 512GB": 2_950_000, "16GB · 1TB": 3_350_000, "24GB · 1TB": 3_750_000 })[s]!),
  },
  {
    name: 'MacBook Air 13" M4',
    category: "macbook",
    brand: "Apple",
    short: "Thin, silent and fast — the everyday laptop for students and professionals.",
    highlights: ["Apple M4 chip", "Fanless, silent design", "Up to 18 hours battery", "12MP Center Stage camera"],
    specs: [["Chip", "Apple M4"], ["Memory", "16GB unified memory"], ["Display", "13.6-inch Liquid Retina"], ["Weight", "1.24 kg"]],
    featured: true,
    sales: 75,
    variants: matrix(["16GB · 256GB", "16GB · 512GB"], ["sky", "silver", "black"], (s, c) => {
      const base = { "16GB · 256GB": 1_650_000, "16GB · 512GB": 1_950_000 }[s]!;
      return c === "new" ? base : Math.round((base * 0.8) / 1000) * 1000;
    }, ["new", "uk-used"]),
  },
  {
    name: 'iPad Pro 11" M5',
    category: "ipad",
    brand: "Apple",
    short: "The ultimate iPad experience with the M5 chip and an Ultra Retina XDR tandem-OLED display.",
    highlights: ["Apple M5 chip", "Ultra Retina XDR OLED", "Apple Pencil Pro support", "Wi-Fi 7"],
    specs: [["Chip", "Apple M5"], ["Display", "11-inch tandem OLED"], ["Connectivity", "Wi-Fi 7 / optional 5G"]],
    sales: 30,
    variants: matrix(["256GB", "512GB", "1TB"], ["black", "silver"], (s) => ({ "256GB": 1_700_000, "512GB": 2_050_000, "1TB": 2_700_000 })[s]!),
  },
  {
    name: "Apple Watch Series 11",
    category: "apple-watch",
    brand: "Apple",
    short: "Health, fitness and safety features on your wrist, now with longer battery life.",
    highlights: ["Always-On Retina display", "Sleep score & hypertension notifications", "Up to 24 hours battery", "Water resistant to 50m"],
    specs: [["Case", "Aluminium"], ["Sizes", "42mm / 46mm"], ["Battery", "Up to 24 hours"]],
    sales: 40,
    variants: matrix(["42mm", "46mm"], ["black", "silver", "pink"], (s) => ({ "42mm": 729_000, "46mm": 799_000 })[s]!).map((v) => ({ ...v, compareAt: v.price + 70_000 })),
  },
  {
    name: "Apple Watch Ultra 3",
    category: "apple-watch",
    brand: "Apple",
    short: "The most rugged Apple Watch, built for endurance, adventure and the outdoors.",
    highlights: ["49mm titanium case", "Brightest Apple display", "Satellite SOS", "Up to 42 hours battery"],
    specs: [["Case", "49mm titanium"], ["Battery", "Up to 42 hours"]],
    sales: 18,
    variants: [{ storage: "49mm", ...colors.black, price: 1_350_000, stock: 4 }, { storage: "49mm", ...colors.titanium, price: 1_350_000, stock: 2 }],
  },
  {
    name: "AirPods Pro 3",
    category: "airpods",
    brand: "Apple",
    short: "Next-level Active Noise Cancellation, heart-rate sensing and a more secure fit.",
    highlights: ["Active Noise Cancellation", "Heart-rate sensing", "Live Translation", "USB-C MagSafe case"],
    specs: [["Battery", "Up to 8 hours (ANC on)"], ["Water resistance", "IP57"]],
    featured: true,
    sales: 210,
    variants: [{ ...colors.white, price: 389_000, compareAt: 420_000, stock: 12 }],
  },
  {
    name: "AirPods 4 with ANC",
    category: "airpods",
    brand: "Apple",
    short: "Open-fit comfort with Active Noise Cancellation and personalised spatial audio.",
    highlights: ["Active Noise Cancellation", "Open-ear design", "USB-C case"],
    specs: [["Battery", "Up to 5 hours"], ["Case", "USB-C, wireless charging"]],
    sales: 150,
    variants: [{ ...colors.white, price: 269_000, stock: 15 }],
  },
  {
    name: "AirTag (4 Pack)",
    category: "airtag",
    brand: "Apple",
    short: "Keep track of your keys, bags and luggage with Precision Finding.",
    highlights: ["Precision Finding", "Replaceable battery", "Water resistant"],
    specs: [["Pack", "4 AirTags"], ["Battery", "CR2032, about 1 year"]],
    sales: 60,
    variants: [{ ...colors.white, price: 145_000, stock: 20 }],
  },
  {
    name: "Apple 20W USB-C Power Adapter",
    category: "apple-chargers",
    brand: "Apple",
    short: "Original Apple fast charger for iPhone, iPad and AirPods.",
    highlights: ["100% original", "Fast-charges iPhone to 50% in ~30 min"],
    specs: [["Output", "20W USB-C"]],
    sales: 300,
    variants: [{ ...colors.white, price: 32_000, stock: 50 }],
  },

  /* ── Samsung ── */
  {
    name: "Samsung Galaxy S26 Ultra",
    category: "samsung-phones",
    brand: "Samsung",
    short: "Samsung's ultimate flagship with a 200MP camera, built-in S Pen and Galaxy AI.",
    highlights: ["200MP wide camera, 5x optical zoom", "Built-in S Pen", "Snapdragon for Galaxy", "7 years of OS updates"],
    specs: [["Display", "6.9-inch Dynamic AMOLED 2X, 120Hz"], ["Main camera", "200MP"], ["Battery", "5,000mAh"]],
    badge: "New",
    featured: true,
    sales: 88,
    variants: matrix(["256GB", "512GB", "1TB"], ["titanium", "black", "blue"], (s, c) => {
      const base = { "256GB": 1_950_000, "512GB": 2_250_000, "1TB": 2_750_000 }[s]!;
      return c === "new" ? base : Math.round((base * 0.8) / 1000) * 1000;
    }, ["new", "uk-used"]),
  },
  {
    name: "Samsung Galaxy Z Fold 7",
    category: "samsung-phones",
    brand: "Samsung",
    short: "A tablet-sized screen that folds into your pocket — thinner and lighter than ever.",
    highlights: ["8-inch main display", "200MP camera", "Ultra-slim when folded", "Multitasking with Galaxy AI"],
    specs: [["Main display", "8.0-inch Dynamic AMOLED 2X"], ["Cover display", "6.5-inch"], ["Battery", "4,400mAh"]],
    featured: true,
    sales: 35,
    variants: matrix(["256GB", "512GB"], ["navy", "silver", "black"], (s, c) => {
      const base = { "256GB": 2_550_000, "512GB": 2_850_000 }[s]!;
      return c === "new" ? base : Math.round((base * 0.78) / 1000) * 1000;
    }, ["new", "uk-used"]),
  },
  {
    name: "Samsung Galaxy Tab S11",
    category: "samsung-tablets",
    brand: "Samsung",
    short: "A premium Android tablet with S Pen included — perfect for notes, study and entertainment.",
    highlights: ["11-inch AMOLED", "S Pen included", "IP68"],
    specs: [["Display", "11-inch Dynamic AMOLED 2X"], ["Storage", "128GB / 256GB"]],
    sales: 14,
    variants: matrix(["128GB", "256GB"], ["titanium", "silver"], (s) => ({ "128GB": 1_150_000, "256GB": 1_300_000 })[s]!),
  },
  {
    name: "Samsung Galaxy Watch 8",
    category: "samsung-watches",
    brand: "Samsung",
    short: "Advanced health tracking with antioxidant index and bedtime guidance.",
    highlights: ["Sapphire crystal glass", "Antioxidant index", "Up to 40 hours battery"],
    specs: [["Sizes", "40mm / 44mm"]],
    sales: 22,
    variants: matrix(["40mm", "44mm"], ["black", "silver"], (s) => ({ "40mm": 420_000, "44mm": 460_000 })[s]!),
  },
  {
    name: "Samsung Galaxy Buds 3 Pro",
    category: "galaxy-buds",
    brand: "Samsung",
    short: "Hi-fi sound and intelligent noise cancelling in a sleek blade design.",
    highlights: ["Adaptive ANC", "24-bit Hi-Fi audio", "IP57"],
    specs: [["Battery", "Up to 6 hours (ANC on)"]],
    sales: 41,
    variants: [{ ...colors.silver, price: 245_000, stock: 9 }, { ...colors.white, price: 245_000, stock: 6 }],
  },
  {
    name: "Samsung 45W Super Fast Charger",
    category: "samsung-chargers",
    brand: "Samsung",
    short: "Original Samsung 45W USB-C adapter with Super Fast Charging 2.0.",
    highlights: ["100% original", "Super Fast Charging 2.0"],
    specs: [["Output", "45W USB-C PD"]],
    sales: 120,
    variants: [{ ...colors.black, price: 38_000, stock: 30 }],
  },

  /* ── Google Pixel ── */
  {
    name: "Google Pixel 10 Pro XL",
    category: "pixel-phones",
    brand: "Google",
    short: "Google's largest Pixel with a Tensor G5 chip, pro triple camera and seven years of updates.",
    highlights: ["Tensor G5", "50MP triple camera, 5x telephoto", "6.8-inch Super Actua display", "7 years of updates"],
    specs: [["Display", "6.8-inch LTPO OLED, 120Hz"], ["Chip", "Google Tensor G5"], ["Battery", "5,200mAh"]],
    badge: "New",
    featured: true,
    sales: 26,
    variants: matrix(["256GB", "512GB"], ["black", "mint", "white"], (s, c) => {
      const base = { "256GB": 1_750_000, "512GB": 2_000_000 }[s]!;
      return c === "new" ? base : Math.round((base * 0.75) / 1000) * 1000;
    }, ["new", "us-used"]),
  },
  {
    name: "Google Pixel 9",
    category: "pixel-phones",
    brand: "Google",
    short: "Clean Android, a brilliant camera and Gemini built in — at a great price.",
    highlights: ["Tensor G4", "50MP main camera", "Actua display"],
    specs: [["Display", "6.3-inch OLED, 120Hz"], ["Chip", "Google Tensor G4"]],
    sales: 33,
    variants: matrix(["128GB", "256GB"], ["black", "pink"], (s, c) => {
      const base = { "128GB": 950_000, "256GB": 1_050_000 }[s]!;
      return Math.round((c === "new" ? base : base * 0.7) / 1000) * 1000;
    }, ["new", "uk-used", "us-used"]),
  },
  {
    name: "Google Pixel 9 Pro Fold",
    category: "pixel-phones",
    brand: "Google",
    short: "Pixel's thinnest foldable with the largest inner display on a phone.",
    highlights: ["8-inch inner display", "Tensor G4", "Pro triple camera"],
    specs: [["Inner display", "8.0-inch"], ["Cover display", "6.3-inch"]],
    sales: 8,
    variants: matrix(["256GB"], ["black", "white"], (_s, c) => (c === "new" ? 1_950_000 : 1_450_000), ["new", "us-used"]),
  },

  {
    name: "Google Pixel Buds Pro 2",
    category: "pixel-buds",
    brand: "Google",
    short: "Small, comfortable earbuds with strong noise cancellation and Gemini on hand.",
    highlights: ["Active Noise Cancellation", "Tensor A1 chip", "Up to 8 hours playback (ANC on)", "IP54 earbuds"],
    specs: [["Battery", "Up to 8 hours earbuds, 30 hours with case"], ["Charging", "USB-C & wireless"]],
    badge: "New",
    featured: true,
    sales: 24,
    variants: [
      { ...colors.black, price: 285_000, stock: 6 },
      { ...colors.white, price: 285_000, stock: 4 },
      { ...colors.mint, price: 285_000, stock: 3 },
    ],
  },
  {
    name: "Google Pixel Buds 2a",
    category: "pixel-buds",
    brand: "Google",
    short: "Affordable Pixel earbuds with noise cancellation and a secure, comfortable fit.",
    highlights: ["Active Noise Cancellation", "Up to 7 hours playback", "IP54"],
    specs: [["Battery", "Up to 7 hours earbuds, 20 hours with case"], ["Charging", "USB-C"]],
    sales: 15,
    variants: [{ ...colors.black, price: 165_000, stock: 8 }, { ...colors.white, price: 165_000, stock: 5 }],
  },
  {
    name: "Google Pixel Watch 4",
    category: "pixel-watch",
    brand: "Google",
    short: "A bright domed display with Fitbit health tracking and Gemini on your wrist.",
    highlights: ["Brighter domed AMOLED display", "Fitbit heart-rate, sleep and fitness tracking", "All-day battery with fast charging"],
    specs: [["Sizes", "41mm / 45mm"], ["Water resistance", "5 ATM, IP68"]],
    badge: "New",
    featured: true,
    sales: 12,
    variants: matrix(["41mm", "45mm"], ["black", "silver"], (s) => ({ "41mm": 520_000, "45mm": 580_000 })[s]!),
  },
  {
    name: "Google Pixel Watch 3",
    category: "pixel-watch",
    brand: "Google",
    short: "Pixel's smartwatch with accurate Fitbit tracking — new and UK-used.",
    highlights: ["AMOLED Actua display", "Fitbit health & fitness tracking", "Up to 24 hours battery"],
    specs: [["Sizes", "41mm / 45mm"], ["Water resistance", "5 ATM, IP68"]],
    sales: 18,
    variants: matrix(["41mm", "45mm"], ["black", "silver"], (s, c) => {
      const base = { "41mm": 420_000, "45mm": 470_000 }[s]!;
      return c === "new" ? base : Math.round((base * 0.72) / 1000) * 1000;
    }, ["new", "uk-used"]),
  },

  /* ── Computers ── */
  {
    name: "HP 15 Core i5 13th Gen Laptop",
    category: "office-student-laptops",
    brand: "HP",
    short: "Reliable everyday laptop for school, office work and online classes.",
    highlights: ["Intel Core i5-1335U", "16GB RAM, 512GB SSD", "15.6-inch Full HD", "Windows 11"],
    specs: [["Processor", "Intel Core i5 13th Gen"], ["RAM", "16GB DDR4"], ["Storage", "512GB SSD"], ["Display", "15.6-inch FHD"]],
    sales: 64,
    variants: [{ storage: "16GB · 512GB", ...colors.silver, price: 720_000, stock: 7 }, { condition: "uk-used", storage: "8GB · 256GB", ...colors.silver, price: 430_000, stock: 5 }],
  },
  {
    name: "Lenovo ThinkPad E14 Gen 6",
    category: "office-student-laptops",
    brand: "Lenovo",
    short: "Business-grade durability and the legendary ThinkPad keyboard.",
    highlights: ["AMD Ryzen 7", "16GB RAM, 512GB SSD", "Military-grade tested"],
    specs: [["Processor", "AMD Ryzen 7 7735HS"], ["RAM", "16GB"], ["Storage", "512GB SSD"]],
    sales: 20,
    variants: [{ storage: "16GB · 512GB", ...colors.black, price: 980_000, stock: 4 }],
  },
  {
    name: "ASUS ROG Strix G16 RTX 4070",
    category: "gaming-laptops",
    brand: "ASUS",
    short: "Desktop-class gaming performance with an RTX 4070 and a 165Hz display.",
    highlights: ["Intel Core i9-14900HX", "NVIDIA RTX 4070 8GB", "16-inch 165Hz QHD+", "RGB keyboard"],
    specs: [["CPU", "Intel Core i9-14900HX"], ["GPU", "RTX 4070 8GB"], ["RAM", "16GB DDR5"], ["Storage", "1TB SSD"]],
    badge: "Gamer pick",
    featured: true,
    sales: 15,
    variants: [{ storage: "16GB · 1TB", ...colors.black, price: 2_650_000, stock: 3 }],
  },
  {
    name: "Dell Precision 5690 Workstation",
    category: "workstation-laptops",
    brand: "Dell",
    short: "Mobile workstation with pro graphics for CAD, 3D and video editing.",
    highlights: ["Intel Core Ultra 7", "NVIDIA RTX 2000 Ada", "32GB RAM", "16-inch OLED option"],
    specs: [["CPU", "Intel Core Ultra 7 165H"], ["GPU", "NVIDIA RTX 2000 Ada 8GB"], ["RAM", "32GB"], ["Storage", "1TB SSD"]],
    sales: 5,
    variants: [{ storage: "32GB · 1TB", ...colors.titanium, price: 4_200_000, stock: 2 }],
  },
  {
    name: "HP All-in-One 24 Desktop",
    category: "all-in-one-pcs",
    brand: "HP",
    short: "A tidy, space-saving desktop for home offices and reception desks.",
    highlights: ["23.8-inch Full HD touch", "Intel Core i5", "Built-in webcam & speakers"],
    specs: [["CPU", "Intel Core i5-1335U"], ["RAM", "8GB"], ["Storage", "512GB SSD"]],
    sales: 6,
    variants: [{ storage: "8GB · 512GB", ...colors.white, price: 890_000, stock: 3 }],
  },
  {
    name: "Canon PIXMA G3470 Ink Tank Printer",
    category: "printers",
    brand: "Canon",
    short: "Low-cost printing with refillable ink tanks — print, scan and copy over Wi-Fi.",
    highlights: ["Refillable ink tanks", "Wi-Fi printing", "Print · Scan · Copy"],
    specs: [["Type", "Ink tank all-in-one"], ["Connectivity", "Wi-Fi, USB"]],
    sales: 10,
    variants: [{ ...colors.black, price: 260_000, stock: 6 }],
  },

  /* ── Gaming ── */
  {
    name: "PlayStation 5 Slim (Disc Edition)",
    category: "ps5",
    brand: "Sony",
    short: "Lightning-fast loading, stunning 4K gaming and the DualSense controller.",
    highlights: ["1TB SSD", "4K up to 120fps", "DualSense wireless controller", "Ultra HD Blu-ray drive"],
    specs: [["Storage", "1TB SSD"], ["Resolution", "Up to 4K, 120fps"]],
    featured: true,
    sales: 95,
    variants: [{ storage: "1TB", ...colors.white, price: 850_000, compareAt: 920_000, stock: 8 }, { condition: "uk-used", storage: "1TB", ...colors.white, price: 640_000, stock: 3 }],
  },
  {
    name: "PlayStation 5 Pro",
    category: "ps5",
    brand: "Sony",
    short: "The most powerful PlayStation with enhanced graphics and AI upscaling.",
    highlights: ["2TB SSD", "PSSR AI upscaling", "Advanced ray tracing"],
    specs: [["Storage", "2TB SSD"], ["Resolution", "Up to 8K output"]],
    sales: 30,
    variants: [{ storage: "2TB", ...colors.white, price: 1_350_000, stock: 4 }],
  },
  {
    name: "PlayStation 4 Slim 1TB",
    category: "ps4",
    brand: "Sony",
    short: "Huge game library at a great price — tested and ready to play.",
    highlights: ["1TB storage", "Includes one controller"],
    specs: [["Storage", "1TB HDD"]],
    sales: 40,
    variants: [{ condition: "uk-used", storage: "1TB", ...colors.black, price: 330_000, stock: 5 }, { condition: "nigeria-used", storage: "1TB", ...colors.black, price: 270_000, stock: 2 }],
  },
  {
    name: 'LG UltraGear 27" 180Hz Gaming Monitor',
    category: "gaming-monitors",
    brand: "LG",
    short: "Fast IPS panel with 1ms response and 180Hz refresh for smooth competitive play.",
    highlights: ["27-inch QHD IPS", "180Hz, 1ms GtG", "HDR10, G-Sync compatible"],
    specs: [["Size", "27-inch"], ["Resolution", "2560×1440"], ["Refresh rate", "180Hz"]],
    sales: 12,
    variants: [{ ...colors.black, price: 420_000, stock: 5 }],
  },

  /* ── Audio ── */
  {
    name: "JBL Charge 6",
    category: "jbl",
    brand: "JBL",
    short: "Bold JBL Pro Sound, IP68 protection and up to 28 hours of playtime.",
    highlights: ["Up to 28 hours playtime", "IP68 dust & waterproof", "Built-in power bank", "Auracast multi-speaker"],
    specs: [["Battery", "Up to 28 hours"], ["Rating", "IP68"]],
    featured: true,
    sales: 85,
    variants: [{ ...colors.black, price: 245_000, stock: 10 }, { ...colors.blue, price: 245_000, stock: 6 }],
  },
  {
    name: "JBL Flip 7",
    category: "jbl",
    brand: "JBL",
    short: "Compact, punchy and drop-proof — take the party anywhere.",
    highlights: ["Up to 16 hours playtime", "IP68", "Drop-proof design"],
    specs: [["Battery", "Up to 16 hours"]],
    sales: 70,
    variants: [{ ...colors.black, price: 165_000, stock: 12 }, { ...colors.pink, price: 165_000, stock: 4 }],
  },
  {
    name: "JBL PartyBox 320",
    category: "jbl",
    brand: "JBL",
    short: "Massive sound and a dazzling light show for parties and events.",
    highlights: ["240W output", "Up to 18 hours battery", "Mic & guitar inputs"],
    specs: [["Output", "240W RMS"], ["Battery", "Up to 18 hours"]],
    sales: 16,
    variants: [{ ...colors.black, price: 780_000, stock: 3 }],
  },
  {
    name: "Onyx Studio 8",
    category: "onyx",
    brand: "Onyx",
    short: "Room-filling sound in an elegant design that looks great on any shelf.",
    highlights: ["360° room-filling sound", "Up to 8 hours battery", "Speakerphone"],
    specs: [["Battery", "Up to 8 hours"]],
    sales: 19,
    variants: [{ ...colors.black, price: 230_000, stock: 5 }],
  },
  {
    name: "Zealot S79 Portable Speaker",
    category: "zealot",
    brand: "Zealot",
    short: "Big bass on a budget with a long-lasting battery.",
    highlights: ["Dual subwoofers", "Up to 20 hours playtime", "TWS pairing"],
    specs: [["Battery", "Up to 20 hours"]],
    sales: 55,
    variants: [{ ...colors.black, price: 45_000, stock: 20 }],
  },

  /* ── Starlink ── */
  {
    name: "Starlink Mini Kit",
    category: "starlink",
    brand: "Starlink",
    short: "Compact satellite internet that fits in a backpack — perfect for travel and remote work.",
    highlights: ["Built-in Wi-Fi router", "100+ Mbps typical speeds", "Runs on USB-C PD power"],
    specs: [["Weight", "1.1 kg"], ["Power", "12–48V, USB-C PD 100W"]],
    badge: "Top seller",
    featured: true,
    sales: 130,
    variants: [{ ...colors.white, price: 285_000, stock: 15 }],
  },
  {
    name: "Starlink Standard Kit",
    category: "starlink",
    brand: "Starlink",
    short: "High-speed, low-latency internet for homes and offices anywhere in Nigeria.",
    highlights: ["Wi-Fi 6 router included", "Self-orienting dish", "IP67 weather-rated"],
    specs: [["Field of view", "110°"], ["Router", "Gen 3, Wi-Fi 6"]],
    sales: 90,
    variants: [{ ...colors.white, price: 445_000, stock: 9 }],
  },

  /* ── Others ── */
  {
    name: "Ray-Ban Meta Wayfarer (Gen 2)",
    category: "ray-ban",
    brand: "Ray-Ban",
    short: "Smart glasses with a 12MP camera, open-ear audio and Meta AI built in.",
    highlights: ["12MP ultra-wide camera", "Open-ear speakers", "Up to 8 hours battery"],
    specs: [["Camera", "12MP, 3K video"], ["Battery", "Up to 8 hours"]],
    sales: 21,
    variants: [{ ...colors.black, price: 620_000, stock: 4 }],
  },
  {
    name: "Smart 4K Home Projector",
    category: "projectors",
    brand: "Anker",
    short: "Big-screen movies at home with built-in streaming apps and auto-focus.",
    highlights: ["Native 1080p, 4K supported", "Auto focus & keystone", "Built-in speakers"],
    specs: [["Brightness", "700 ANSI lumens"], ["Screen size", "Up to 150-inch"]],
    sales: 9,
    variants: [{ ...colors.white, price: 520_000, stock: 3 }],
  },
  {
    name: "DJI Mini 4 Pro Fly More Combo",
    category: "drones",
    brand: "DJI",
    short: "Lightweight 4K HDR drone with omnidirectional obstacle sensing.",
    highlights: ["4K/60fps HDR video", "Under 249g", "Omnidirectional obstacle sensing", "3 batteries included"],
    specs: [["Video", "4K/60fps HDR"], ["Flight time", "Up to 34 min"]],
    sales: 7,
    variants: [{ ...colors.titanium, price: 1_450_000, stock: 2 }],
  },
  {
    name: "Anker 20,000mAh Power Bank (30W)",
    category: "accessories",
    brand: "Anker",
    short: "Fast-charge your phone up to four times on a single charge.",
    highlights: ["20,000mAh", "30W USB-C PD", "Charges 2 devices at once"],
    specs: [["Capacity", "20,000mAh"], ["Output", "30W"]],
    sales: 140,
    variants: [{ ...colors.black, price: 48_000, stock: 25 }],
  },
  {
    name: "MagSafe Clear Case for iPhone 17 Pro Max",
    category: "accessories",
    brand: "Anker",
    short: "Crystal-clear protection that won't yellow, with strong MagSafe magnets.",
    highlights: ["Anti-yellowing", "MagSafe compatible", "Raised camera lip"],
    specs: [["Compatibility", "iPhone 17 Pro Max"]],
    sales: 180,
    variants: [{ ...colors.white, price: 18_000, stock: 40 }],
  },
];

const zones = [
  { name: "Lagos Mainland", state: "Lagos", fee: 3_000, eta: "Same day / next day" },
  { name: "Lagos Island & Lekki", state: "Lagos", fee: 4_000, eta: "Same day / next day" },
  { name: "Ikorodu, Epe & Badagry", state: "Lagos", fee: 5_000, eta: "1–2 business days" },
  { name: "Ogun State", state: "Ogun", fee: 6_000, eta: "1–2 business days" },
  { name: "Abuja (FCT)", state: "FCT", fee: 7_000, eta: "1–3 business days" },
  { name: "Port Harcourt", state: "Rivers", fee: 7_500, eta: "2–3 business days" },
  { name: "Ibadan", state: "Oyo", fee: 6_500, eta: "1–3 business days" },
  { name: "Other South-West states", state: "South-West", fee: 7_000, eta: "2–4 business days" },
  { name: "South-East & South-South", state: "South", fee: 8_000, eta: "2–4 business days" },
  { name: "Northern states", state: "North", fee: 9_000, eta: "3–5 business days" },
];

const heroBanners = [
  { eyebrow: "Just landed", title: "iPhone 17 Pro Max", subtitle: "Bigger battery. Brighter display. Pro cameras that go further.", priceText: "From ₦2,350,000", ctaLabel: "Shop now", ctaHref: "/p/iphone-17-pro-max", secondaryLabel: "Compare models", secondaryHref: "/c/apple/iphone", theme: "dark" },
  { eyebrow: "UK & US Used", title: "Premium phones. Smarter prices.", subtitle: "Every used device is inspected, graded and covered by our warranty.", priceText: "Save up to 30%", ctaLabel: "Shop used", ctaHref: "/used", secondaryLabel: "How we grade", secondaryHref: "/warranty", theme: "navy" },
  { eyebrow: "Internet anywhere", title: "Starlink Mini", subtitle: "Fast satellite internet that fits in your backpack.", priceText: "₦285,000", ctaLabel: "Order now", ctaHref: "/p/starlink-mini-kit", secondaryLabel: "Learn more", secondaryHref: "/c/starlink", theme: "light" },
  { eyebrow: "Game on", title: "PlayStation 5", subtitle: "Pick up in-store today or get it delivered to your door.", priceText: "From ₦850,000", ctaLabel: "Shop gaming", ctaHref: "/c/gaming", secondaryLabel: "See PS5 Pro", secondaryHref: "/p/playstation-5-pro", theme: "red" },
];

const promoTiles = [
  { eyebrow: "Exclusive offer", title: "Free accessories bundle", subtitle: "Get a case, screen guard and charger free with any iPhone 17 Pro Max.", ctaLabel: "Shop iPhone", ctaHref: "/c/apple/iphone", theme: "light" },
  { eyebrow: "Snoware Care", title: "Peace of mind, included", subtitle: "Every device comes with warranty and free first-week support.", ctaLabel: "Our warranty", ctaHref: "/warranty", theme: "blue" },
  { eyebrow: "Trade-in", title: "Upgrade for less", subtitle: "Swap your old phone towards a new one. Get a quote on WhatsApp in minutes.", ctaLabel: "Get a quote", ctaHref: "/trade-in", theme: "red" },
  { eyebrow: "Students", title: "Laptops for every course", subtitle: "Reliable laptops from ₦430,000 — perfect for school and work.", ctaLabel: "Shop laptops", ctaHref: "/c/computers", theme: "navy" },
];

function slug(s: string) {
  return s.toLowerCase().replace(/["']/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

async function main() {
  const { db } = await import("./index");
  const s = await import("./schema");
  const force = process.argv.includes("--force");
  const sync = process.argv.includes("--sync");

  const existing = await db.select({ id: s.products.id }).from(s.products).limit(1);
  if (existing.length && sync) {
    await syncCatalogue(db, s);
    process.exit(0);
  }
  if (existing.length && !force) {
    console.log("Database already has products. Use --sync to add new categories/products, or --force to wipe and reseed.");
    process.exit(0);
  }

  if (force) {
    console.log("Wiping catalogue, banners and delivery zones…");
    await db.delete(s.productImages);
    await db.delete(s.productVariants);
    await db.delete(s.wishlist);
    await db.delete(s.products);
    await db.delete(s.categories);
    await db.delete(s.brands);
    await db.delete(s.banners);
    await db.update(s.orders).set({ zoneId: null });
    await db.delete(s.deliveryZones);
  }

  console.log("Seeding categories…");
  const catIds = new Map<string, number>();
  let order = 0;
  for (const node of categoryTree) {
    const [parent] = await db
      .insert(s.categories)
      .values({ name: node.name, slug: node.slug, icon: node.icon, description: node.description, sortOrder: order++ })
      .returning();
    catIds.set(node.slug, parent.id);
    for (const [i, child] of (node.children ?? []).entries()) {
      const [c] = await db
        .insert(s.categories)
        .values({ name: child.name, slug: child.slug, icon: child.icon, parentId: parent.id, sortOrder: i })
        .returning();
      catIds.set(child.slug, c.id);
    }
  }

  console.log("Seeding brands…");
  const brandRows = await db.insert(s.brands).values(brandNames.map((name) => ({ name, slug: slug(name) }))).returning();
  const brandIds = new Map(brandRows.map((b) => [b.name, b.id]));

  console.log(`Seeding ${products.length} products…`);
  const now = Date.now();
  for (const [i, p] of products.entries()) {
    const [row] = await db
      .insert(s.products)
      .values({
        name: p.name,
        slug: slug(p.name),
        categoryId: catIds.get(p.category)!,
        brandId: brandIds.get(p.brand),
        shortDescription: p.short,
        description: p.short,
        highlights: p.highlights,
        specs: p.specs.map(([label, value]) => ({ label, value })),
        badge: p.badge,
        featured: p.featured ?? false,
        salesCount: p.sales ?? 0,
        createdAt: new Date(now - i * 3_600_000),
      })
      .returning();
    await db.insert(s.productVariants).values(
      p.variants.map((v) => ({
        productId: row.id,
        condition: v.condition ?? "new",
        storage: v.storage,
        color: v.color,
        colorHex: v.hex,
        price: v.price,
        compareAtPrice: v.compareAt,
        stock: null, // no quantity limit — set one per variant in admin if needed
        sku: `${slug(p.name).slice(0, 18)}-${[v.storage, v.color, v.condition].filter(Boolean).map((x) => slug(x!)).join("-")}`.toUpperCase(),
      })),
    );
  }

  console.log("Seeding delivery zones, banners and settings…");
  await db.insert(s.deliveryZones).values(zones.map((z, i) => ({ ...z, sortOrder: i })));
  await db.insert(s.banners).values([
    ...heroBanners.map((b, i) => ({ ...b, placement: "hero" as const, sortOrder: i })),
    ...promoTiles.map((b, i) => ({ ...b, placement: "promo" as const, sortOrder: i })),
  ]);

  const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (adminEmail && adminPassword) {
    const found = await db.query.users.findFirst({ where: eq(s.users.email, adminEmail) });
    const passwordHash = await bcrypt.hash(adminPassword, 12);
    if (found) {
      await db.update(s.users).set({ role: "admin", emailVerified: found.emailVerified ?? new Date() }).where(eq(s.users.id, found.id));
    } else {
      await db.insert(s.users).values({ email: adminEmail, name: "Snoware Admin", role: "admin", passwordHash, emailVerified: new Date() });
    }
    console.log(`Admin account ready: ${adminEmail}`);
  } else {
    console.log("Tip: set ADMIN_EMAIL and ADMIN_PASSWORD in .env.local and re-run to create an admin account.");
  }

  console.log("✅ Seed complete");
  process.exit(0);
}

/**
 * Non-destructive: adds categories, brands and products from this file that aren't in the database yet
 * (matched by slug), and moves seeded products into the category listed here. Prices, stock,
 * photos and admin edits on existing products are left alone.
 */
async function syncCatalogue(db: typeof import("./index").db, s: typeof import("./schema")) {
  const cats = await db.select().from(s.categories);
  const catIds = new Map(cats.map((c) => [c.slug, c.id]));
  let added = 0;

  for (const [order, node] of categoryTree.entries()) {
    if (!catIds.has(node.slug)) {
      const [row] = await db.insert(s.categories).values({ name: node.name, slug: node.slug, icon: node.icon, description: node.description, sortOrder: order }).returning();
      catIds.set(node.slug, row.id);
      console.log(`+ category ${node.name}`);
    } else if (node.description) {
      await db.update(s.categories).set({ description: node.description }).where(eq(s.categories.slug, node.slug));
    }
    for (const [i, child] of (node.children ?? []).entries()) {
      if (catIds.has(child.slug)) continue;
      const [row] = await db.insert(s.categories).values({ name: child.name, slug: child.slug, icon: child.icon, parentId: catIds.get(node.slug)!, sortOrder: i }).returning();
      catIds.set(child.slug, row.id);
      console.log(`+ category ${node.name} › ${child.name}`);
    }
  }

  const brandRows = await db.select().from(s.brands);
  const brandIds = new Map(brandRows.map((b) => [b.name, b.id]));
  for (const name of brandNames) {
    if (brandIds.has(name)) continue;
    const [row] = await db.insert(s.brands).values({ name, slug: slug(name) }).returning();
    brandIds.set(name, row.id);
  }

  for (const p of products) {
    const productSlug = slug(p.name);
    const categoryId = catIds.get(p.category)!;
    const found = await db.query.products.findFirst({ where: eq(s.products.slug, productSlug) });
    if (found) {
      if (found.categoryId !== categoryId) {
        await db.update(s.products).set({ categoryId }).where(eq(s.products.id, found.id));
        console.log(`~ moved ${p.name} → ${p.category}`);
      }
      continue;
    }
    const [row] = await db
      .insert(s.products)
      .values({
        name: p.name,
        slug: productSlug,
        categoryId,
        brandId: brandIds.get(p.brand),
        shortDescription: p.short,
        description: p.short,
        highlights: p.highlights,
        specs: p.specs.map(([label, value]) => ({ label, value })),
        badge: p.badge,
        featured: p.featured ?? false,
        salesCount: p.sales ?? 0,
      })
      .returning();
    await db.insert(s.productVariants).values(
      p.variants.map((v) => ({
        productId: row.id,
        condition: v.condition ?? "new",
        storage: v.storage,
        color: v.color,
        colorHex: v.hex,
        price: v.price,
        compareAtPrice: v.compareAt,
        stock: null, // no quantity limit — set one per variant in admin if needed
        sku: `${productSlug.slice(0, 18)}-${[v.storage, v.color, v.condition].filter(Boolean).map((x) => slug(x!)).join("-")}`.toUpperCase(),
      })),
    );
    added++;
    console.log(`+ product ${p.name}`);
  }
  console.log(`✅ Sync complete — ${added} new product(s).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
