import {
	boolean,
	integer,
	jsonb,
	numeric,
	pgTable,
	serial,
	text,
	timestamp,
} from "drizzle-orm/pg-core";

// ── Better Auth tables (do not modify) ──────────────

export const user = pgTable("user", {
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	email: text("email").notNull().unique(),
	username: text("username").unique(),
	displayUsername: text("display_username"),
	emailVerified: boolean("email_verified").notNull(),
	image: text("image"),
	createdAt: timestamp("created_at").notNull(),
	updatedAt: timestamp("updated_at").notNull(),
});

export const session = pgTable("session", {
	id: text("id").primaryKey(),
	expiresAt: timestamp("expires_at").notNull(),
	token: text("token").notNull().unique(),
	createdAt: timestamp("created_at").notNull(),
	updatedAt: timestamp("updated_at").notNull(),
	ipAddress: text("ip_address"),
	userAgent: text("user_agent"),
	userId: text("user_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
	id: text("id").primaryKey(),
	accountId: text("account_id").notNull(),
	providerId: text("provider_id").notNull(),
	userId: text("user_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	accessToken: text("access_token"),
	refreshToken: text("refresh_token"),
	idToken: text("id_token"),
	accessTokenExpiresAt: timestamp("access_token_expires_at"),
	refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
	scope: text("scope"),
	password: text("password"),
	createdAt: timestamp("created_at").notNull(),
	updatedAt: timestamp("updated_at").notNull(),
});

export const verification = pgTable("verification", {
	id: text("id").primaryKey(),
	identifier: text("identifier").notNull(),
	value: text("value").notNull(),
	expiresAt: timestamp("expires_at").notNull(),
	createdAt: timestamp("created_at"),
	updatedAt: timestamp("updated_at"),
});

// ── Services Catalog ─────────────────────────────────

export const services = pgTable("services", {
	id: serial("id").primaryKey(),
	name: text("name").notNull(), // "Cuci Kiloan", "Setrika", "Dry Cleaning"
	category: text("category").notNull(), // "kiloan" or "satuan"
	unit: text("unit").notNull(), // "kg", "pcs"
	price: integer("price").notNull(), // price per unit
	active: boolean("active").default(true),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ── Customers ────────────────────────────────────────

export const customers = pgTable("customers", {
	id: serial("id").primaryKey(),
	name: text("name").notNull(),
	phone: text("phone").notNull(),
	address: text("address"),
	totalOrders: integer("total_orders").default(0),
	totalSpent: integer("total_spent").default(0),
	balance: integer("balance").default(0), // positive = credit (store owes customer), negative = debt (customer owes store)
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ── Orders ───────────────────────────────────────────

export type OrderStatus =
	| "PENDING"
	| "DIPROSES"
	| "SELESAI"
	| "DIAMBIL"
	| "BATAL";
export type PaymentStatus = "LUNAS" | "BELUM_BAYAR" | "SEBAGIAN";

export const orders = pgTable("orders", {
	id: serial("id").primaryKey(),
	customerId: integer("customer_id")
		.notNull()
		.references(() => customers.id, { onDelete: "cascade" }),
	status: text("status").notNull().default("PENDING"), // PENDING, DIPROSES, SELESAI, DIAMBIL, BATAL
	paymentStatus: text("payment_status").notNull().default("BELUM_BAYAR"), // LUNAS, BELUM_BAYAR, SEBAGIAN
	paymentMethod: text("payment_method").default("TUNAI"),
	amountPaid: integer("amount_paid").default(0), // how much has been paid
	notes: text("notes"), // special instructions
	estimatedCompletion: timestamp("estimated_completion"), // estimated ready time
	nominal: integer("nominal").notNull(), // total amount (computed from items)
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ── Order Items ──────────────────────────────────────

export const orderItems = pgTable("order_items", {
	id: serial("id").primaryKey(),
	orderId: integer("order_id")
		.notNull()
		.references(() => orders.id, { onDelete: "cascade" }),
	serviceId: integer("service_id").references(() => services.id),
	serviceName: text("service_name").notNull(), // denormalized for display
	quantity: integer("quantity").notNull().default(1),
	unitPrice: integer("unit_price").notNull(), // price per unit at time of order
	subtotal: integer("subtotal").notNull(), // quantity * unitPrice
});

// ── Store Settings ──────────────────────────────────

export const storeSettings = pgTable("store_settings", {
	id: serial("id").primaryKey(),
	name: text("name").notNull().default("LaundryKu"),
	address: text("address"),
	waTemplate: text("wa_template").default(
		"Halo {nama}, pesanan laundry Anda sudah SELESAI! Silakan diambil. Terimakasih 🙏",
	),
	autoWaEnabled: boolean("auto_wa_enabled").default(false),
	paymentConfigs: jsonb("payment_configs")
		.$type<string[]>()
		.default(["TUNAI", "TRANSFER"]),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
