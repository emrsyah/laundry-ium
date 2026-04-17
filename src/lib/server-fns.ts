import { createServerFn } from "@tanstack/react-start";
import { desc, eq, gte, sql } from "drizzle-orm";
import { db } from "#/db/index";
import { customers, orders, storeSettings } from "#/db/schema";

// ── Customers ──────────────────────────────────────────

export const customersList = createServerFn({ method: "GET" }).handler(
	async () => {
		return await db.select().from(customers).orderBy(desc(customers.createdAt));
	},
);

export const customersCreate = createServerFn({ method: "POST" })
	.inputValidator((d: { name: string; phone: string; address?: string }) => d)
	.handler(async ({ data }) => {
		const created = await db
			.insert(customers)
			.values({
				name: data.name,
				phone: data.phone,
				address: data.address || "",
			})
			.returning();
		return created[0];
	});

// ── Orders ─────────────────────────────────────────────

export const ordersList = createServerFn({ method: "GET" }).handler(
	async () => {
		return await db
			.select({
				id: orders.id,
				customerId: orders.customerId,
				customerName: customers.name,
				customerPhone: customers.phone,
				type: orders.type,
				status: orders.status,
				nominal: orders.nominal,
				paymentMethod: orders.paymentMethod,
				createdAt: orders.createdAt,
			})
			.from(orders)
			.innerJoin(customers, eq(orders.customerId, customers.id))
			.orderBy(desc(orders.createdAt));
	},
);

export const ordersCreate = createServerFn({ method: "POST" })
	.inputValidator((d: { customerId: number; type: string; nominal: number }) => d)
	.handler(async ({ data }) => {
		const created = await db
			.insert(orders)
			.values({
				customerId: data.customerId,
				type: data.type,
				nominal: data.nominal,
				status: "PENDING",
			})
			.returning();
		return created[0];
	});

export const ordersUpdateStatus = createServerFn({ method: "POST" })
	.inputValidator(
		(d: { id: number; status: "PENDING" | "DIPROSES" | "SELESAI" }) => d,
	)
	.handler(async ({ data }) => {
		const updated = await db
			.update(orders)
			.set({ status: data.status, updatedAt: new Date() })
			.where(eq(orders.id, data.id))
			.returning();
		return updated[0];
	});

// ── Analytics ──────────────────────────────────────────

export const analyticsSummary = createServerFn({ method: "GET" }).handler(
	async () => {
		const today = new Date();
		today.setHours(0, 0, 0, 0);

		const revenueRes = await db
			.select({ total: sql<number>`coalesce(sum(${orders.nominal}), 0)` })
			.from(orders)
			.where(gte(orders.createdAt, today));

		const ordersCountRes = await db
			.select({ count: sql<number>`count(${orders.id})` })
			.from(orders)
			.where(gte(orders.createdAt, today));

		return {
			revenueToday: Number(revenueRes[0]?.total ?? 0),
			ordersToday: Number(ordersCountRes[0]?.count ?? 0),
		};
	},
);

export const analyticsWeeklyRevenue = createServerFn({ method: "GET" }).handler(
	async () => {
		const days: { label: string; revenue: number; count: number }[] = [];

		for (let i = 6; i >= 0; i--) {
			const date = new Date();
			date.setDate(date.getDate() - i);
			date.setHours(0, 0, 0, 0);

			const nextDate = new Date(date);
			nextDate.setDate(nextDate.getDate() + 1);

			const res = await db
				.select({
					total: sql<number>`coalesce(sum(${orders.nominal}), 0)`,
					count: sql<number>`count(${orders.id})`,
				})
				.from(orders)
				.where(
					sql`${orders.createdAt} >= ${date} AND ${orders.createdAt} < ${nextDate}`,
				);

			days.push({
				label: date.toLocaleDateString("id-ID", { weekday: "short" }),
				revenue: Number(res[0]?.total ?? 0),
				count: Number(res[0]?.count ?? 0),
			});
		}

		return days;
	},
);

export const analyticsServiceBreakdown = createServerFn({
	method: "GET",
}).handler(async () => {
	const result = await db
		.select({
			type: orders.type,
			count: sql<number>`count(${orders.id})`,
			revenue: sql<number>`coalesce(sum(${orders.nominal}), 0)`,
		})
		.from(orders)
		.groupBy(orders.type);

	return result.map((r) => ({
		type: r.type,
		count: Number(r.count),
		revenue: Number(r.revenue),
	}));
});

// ── Settings ───────────────────────────────────────────

export const settingsGet = createServerFn({ method: "GET" }).handler(
	async () => {
		const rows = await db.select().from(storeSettings).limit(1);
		if (rows.length > 0) return rows[0];
		const created = await db.insert(storeSettings).values({}).returning();
		return created[0];
	},
);

export const settingsUpdate = createServerFn({ method: "POST" })
	.inputValidator(
		(d: {
			name?: string;
			address?: string;
			waTemplate?: string;
			autoWaEnabled?: boolean;
			paymentConfigs?: string[];
		}) => d,
	)
	.handler(async ({ data }) => {
		const rows = await db.select().from(storeSettings).limit(1);

		if (rows.length === 0) {
			const created = await db
				.insert(storeSettings)
				.values({ ...data, updatedAt: new Date() })
				.returning();
			return created[0];
		}

		const updated = await db
			.update(storeSettings)
			.set({ ...data, updatedAt: new Date() })
			.where(eq(storeSettings.id, rows[0].id))
			.returning();
		return updated[0];
	});
