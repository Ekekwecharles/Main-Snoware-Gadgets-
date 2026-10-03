import {
  boolean,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  serial,
  text,
  timestamp,
  uniqueIndex,
  index,
  type AnyPgColumn,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import type { AdapterAccountType } from "next-auth/adapters";

/* ───────────────────────── Auth ───────────────────────── */

export const roleEnum = pgEnum("role", ["customer", "admin"]);

export const users = pgTable("users", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").notNull().unique(),
  emailVerified: timestamp("email_verified", { mode: "date" }),
  image: text("image"),
  passwordHash: text("password_hash"),
  phone: text("phone"),
  role: roleEnum("role").notNull().default("customer"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const accounts = pgTable(
  "accounts",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccountType>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (t) => [primaryKey({ columns: [t.provider, t.providerAccountId] })],
);

export const sessions = pgTable("sessions", {
  sessionToken: text("session_token").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

/** Used by Auth.js and by our own email-verification / password-reset flows. */
export const verificationTokens = pgTable(
  "verification_tokens",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (t) => [primaryKey({ columns: [t.identifier, t.token] })],
);

/* ───────────────────────── Catalogue ───────────────────────── */

export const availabilityEnum = pgEnum("availability", ["in_stock", "on_order", "sold_out"]);

export const conditionEnum = pgEnum("condition", ["new", "open-box", "boxed", "uk-used", "us-used", "nigeria-used"]);

export const categories = pgTable(
  "categories",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    parentId: integer("parent_id").references((): AnyPgColumn => categories.id, {
      onDelete: "set null",
    }),
    icon: text("icon"),
    description: text("description"),
    image: text("image"),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (t) => [uniqueIndex("categories_slug_idx").on(t.slug)],
);

export const brands = pgTable("brands", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
});

export type ProductSpec = { label: string; value: string };

export const products = pgTable(
  "products",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    categoryId: integer("category_id")
      .notNull()
      .references(() => categories.id),
    brandId: integer("brand_id").references(() => brands.id),
    shortDescription: text("short_description"),
    description: text("description"),
    highlights: jsonb("highlights").$type<string[]>().notNull().default([]),
    specs: jsonb("specs").$type<ProductSpec[]>().notNull().default([]),
    badge: text("badge"),
    featured: boolean("featured").notNull().default(false),
    isActive: boolean("is_active").notNull().default(true),
    salesCount: integer("sales_count").notNull().default(0),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [uniqueIndex("products_slug_idx").on(t.slug), index("products_category_idx").on(t.categoryId)],
);

export const productVariants = pgTable(
  "product_variants",
  {
    id: serial("id").primaryKey(),
    productId: integer("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    condition: conditionEnum("condition").notNull().default("new"),
    storage: text("storage"),
    color: text("color"),
    colorHex: text("color_hex"),
    /** Whole naira */
    price: integer("price").notNull(),
    compareAtPrice: integer("compare_at_price"),
    /** in_stock | on_order (sourced after purchase) | sold_out — drives what customers can buy. */
    availability: availabilityEnum("availability").notNull().default("in_stock"),
    /**
     * Optional quantity available. null = no limit (customers can order any amount).
     * When set, orders are capped at it, it's shown to customers, and it decreases on each paid order.
     */
    stock: integer("stock"),
    sku: text("sku"),
  },
  (t) => [index("variants_product_idx").on(t.productId)],
);

export const productImages = pgTable("product_images", {
  id: serial("id").primaryKey(),
  productId: integer("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  publicId: text("public_id"),
  alt: text("alt"),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const bannerPlacementEnum = pgEnum("banner_placement", ["hero", "promo"]);

export const banners = pgTable("banners", {
  id: serial("id").primaryKey(),
  placement: bannerPlacementEnum("placement").notNull().default("hero"),
  eyebrow: text("eyebrow"),
  title: text("title").notNull(),
  subtitle: text("subtitle"),
  priceText: text("price_text"),
  ctaLabel: text("cta_label"),
  ctaHref: text("cta_href"),
  secondaryLabel: text("secondary_label"),
  secondaryHref: text("secondary_href"),
  image: text("image"),
  /** light | dark | red | navy | blue */
  theme: text("theme").notNull().default("light"),
  sortOrder: integer("sort_order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
});

/* ───────────────────────── Commerce ───────────────────────── */

export const deliveryZones = pgTable("delivery_zones", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  state: text("state").notNull(),
  fee: integer("fee").notNull(),
  eta: text("eta").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const settings = pgTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});

export const addresses = pgTable("addresses", {
  id: serial("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  fullName: text("full_name").notNull(),
  phone: text("phone").notNull(),
  line1: text("line1").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  isDefault: boolean("is_default").notNull().default(false),
});

export const orderStatusEnum = pgEnum("order_status", [
  "pending",
  "paid",
  "processing",
  "shipped",
  "ready_for_pickup",
  "delivered",
  "cancelled",
]);

export const paymentStatusEnum = pgEnum("payment_status", ["unpaid", "paid", "failed", "refunded"]);
export const deliveryMethodEnum = pgEnum("delivery_method", ["delivery", "pickup"]);

export const orders = pgTable(
  "orders",
  {
    id: serial("id").primaryKey(),
    reference: text("reference").notNull(),
    userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
    email: text("email").notNull(),
    fullName: text("full_name").notNull(),
    phone: text("phone").notNull(),
    deliveryMethod: deliveryMethodEnum("delivery_method").notNull(),
    zoneId: integer("zone_id").references(() => deliveryZones.id),
    zoneName: text("zone_name"),
    addressLine: text("address_line"),
    city: text("city"),
    state: text("state"),
    notes: text("notes"),
    subtotal: integer("subtotal").notNull(),
    deliveryFee: integer("delivery_fee").notNull().default(0),
    total: integer("total").notNull(),
    status: orderStatusEnum("status").notNull().default("pending"),
    paymentStatus: paymentStatusEnum("payment_status").notNull().default("unpaid"),
    paidAt: timestamp("paid_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [uniqueIndex("orders_reference_idx").on(t.reference), index("orders_user_idx").on(t.userId)],
);

export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  productId: integer("product_id").references(() => products.id, { onDelete: "set null" }),
  variantId: integer("variant_id").references(() => productVariants.id, { onDelete: "set null" }),
  name: text("name").notNull(),
  variantLabel: text("variant_label"),
  image: text("image"),
  unitPrice: integer("unit_price").notNull(),
  quantity: integer("quantity").notNull(),
  /** True when the variant was "available on order" at purchase time — the admin needs to source it. */
  onOrder: boolean("on_order").notNull().default(false),
});

export const newsletterSubscribers = pgTable("newsletter_subscribers", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const wishlist = pgTable(
  "wishlist",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    productId: integer("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.productId] })],
);

/* ───────────────────────── Relations ───────────────────────── */

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  parent: one(categories, { fields: [categories.parentId], references: [categories.id], relationName: "tree" }),
  children: many(categories, { relationName: "tree" }),
  products: many(products),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, { fields: [products.categoryId], references: [categories.id] }),
  brand: one(brands, { fields: [products.brandId], references: [brands.id] }),
  variants: many(productVariants),
  images: many(productImages),
}));

export const brandsRelations = relations(brands, ({ many }) => ({ products: many(products) }));

export const productVariantsRelations = relations(productVariants, ({ one }) => ({
  product: one(products, { fields: [productVariants.productId], references: [products.id] }),
}));

export const productImagesRelations = relations(productImages, ({ one }) => ({
  product: one(products, { fields: [productImages.productId], references: [products.id] }),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(users, { fields: [orders.userId], references: [users.id] }),
  items: many(orderItems),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, { fields: [orderItems.orderId], references: [orders.id] }),
  product: one(products, { fields: [orderItems.productId], references: [products.id] }),
}));

export const wishlistRelations = relations(wishlist, ({ one }) => ({
  product: one(products, { fields: [wishlist.productId], references: [products.id] }),
}));

export type User = typeof users.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type Product = typeof products.$inferSelect;
export type ProductVariant = typeof productVariants.$inferSelect;
export type ProductImage = typeof productImages.$inferSelect;
export type Banner = typeof banners.$inferSelect;
export type DeliveryZone = typeof deliveryZones.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type OrderItem = typeof orderItems.$inferSelect;
export type OrderStatus = (typeof orderStatusEnum.enumValues)[number];
