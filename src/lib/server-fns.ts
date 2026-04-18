import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { auth } from "#/lib/auth";
import { and, desc, eq, gte, ne, sql } from "drizzle-orm";
import { db } from "#/db/index";
import type { OrderStatus, PaymentStatus } from "#/db/schema";
import {
	customers,
	orderItems,
	orders,
	services,
	storeSettings,
} from "#/db/schema";

export const getAuthSession = createServerFn({ method: "GET" }).handler(async () => {
	const req = getRequest();
	const session = await auth.api.getSession({
		headers: req?.headers,
	});
	return session;
});

// ── Services Catalog ────────────────────────────────

export const servicesList = createServerFn({ method: "GET" }).handler(
	async () => {
		return await db
			.select()
			.from(services)
			.where(eq(services.active, true))
			.orderBy(services.name);
	},
);

export const servicesCreate = createServerFn({ method: "POST" })
	.inputValidator(
		(d: { name: string; category: string; unit: string; price: number }) => d,
	)
	.handler(async ({ data }) => {
		const created = await db
			.insert(services)
			.values({
				name: data.name,
				category: data.category,
				unit: data.unit,
				price: data.price,
			})
			.returning();
		return created[0];
	});

export const servicesUpdate = createServerFn({ method: "POST" })
	.inputValidator(
		(d: {
			id: number;
			name?: string;
			category?: string;
			unit?: string;
			price?: number;
			active?: boolean;
		}) => d,
	)
	.handler(async ({ data }) => {
		const { id, ...rest } = data;
		const updated = await db
			.update(services)
			.set({ ...rest, updatedAt: new Date() })
			.where(eq(services.id, id))
			.returning();
		return updated[0];
	});

export const servicesDelete = createServerFn({ method: "POST" })
	.inputValidator((d: { id: number }) => d)
	.handler(async ({ data }) => {
		await db
			.update(services)
			.set({ active: false, updatedAt: new Date() })
			.where(eq(services.id, data.id));
		return { success: true };
	});

// ── Customers ───────────────────────────────────────

export const customersList = createServerFn({ method: "GET" }).handler(
	async () => {
		const res = await db
			.select({
				id: customers.id,
				name: customers.name,
				phone: customers.phone,
				address: customers.address,
				totalOrders: sql<number>`count(${orders.id})`,
				totalSpent: sql<number>`coalesce(sum(${orders.nominal}), 0)`,
				balance: customers.balance,
				createdAt: customers.createdAt,
			})
			.from(customers)
			.leftJoin(orders, eq(customers.id, orders.customerId))
			.groupBy(customers.id)
			.orderBy(desc(customers.createdAt));

		return res.map((r) => ({
			...r,
			totalOrders: Number(r.totalOrders),
			totalSpent: Number(r.totalSpent),
			balance: Number(r.balance ?? 0),
		}));
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

export const customersUpdate = createServerFn({ method: "POST" })
	.inputValidator(
		(d: { id: number; name?: string; phone?: string; address?: string }) => d,
	)
	.handler(async ({ data }) => {
		const { id, ...rest } = data;
		const updated = await db
			.update(customers)
			.set({ ...rest, updatedAt: new Date() })
			.where(eq(customers.id, id))
			.returning();
		return updated[0];
	});

export const customersDelete = createServerFn({ method: "POST" })
	.inputValidator((d: { id: number }) => d)
	.handler(async ({ data }) => {
		await db.delete(customers).where(eq(customers.id, data.id));
		return { success: true };
	});

export const customersGet = createServerFn({ method: "GET" })
	.inputValidator((id: number) => id)
	.handler(async ({ data: id }) => {
		const customer = await db
			.select()
			.from(customers)
			.where(eq(customers.id, id))
			.limit(1);

		if (customer.length === 0) return null;

		const customerOrders = await db
			.select({
				id: orders.id,
				customerId: orders.customerId,
				status: orders.status,
				paymentStatus: orders.paymentStatus,
				paymentMethod: orders.paymentMethod,
				amountPaid: orders.amountPaid,
				notes: orders.notes,
				nominal: orders.nominal,
				createdAt: orders.createdAt,
				updatedAt: orders.updatedAt,
			})
			.from(orders)
			.where(eq(orders.customerId, id))
			.orderBy(desc(orders.createdAt));

		// Get order items for each order
		const ordersWithItems = await Promise.all(
			customerOrders.map(async (order) => {
				const items = await db
					.select()
					.from(orderItems)
					.where(eq(orderItems.orderId, order.id));
				return { ...order, items };
			}),
		);

		const stats = await db
			.select({
				totalOrders: sql<number>`count(*)`,
				totalSpent: sql<number>`coalesce(sum(${orders.nominal}), 0)`,
			})
			.from(orders)
			.where(eq(orders.customerId, id));

		return {
			...customer[0],
			balance: Number(customer[0].balance ?? 0),
			orders: ordersWithItems.map((o) => ({
				...o,
				amountPaid: Number(o.amountPaid ?? 0),
				nominal: Number(o.nominal),
			})),
			totalOrders: Number(stats[0]?.totalOrders ?? 0),
			totalSpent: Number(stats[0]?.totalSpent ?? 0),
		};
	});

// ── Orders ──────────────────────────────────────────

export const ordersList = createServerFn({ method: "GET" }).handler(
	async () => {
		return await db
			.select({
				id: orders.id,
				customerId: orders.customerId,
				customerName: customers.name,
				customerPhone: customers.phone,
				status: orders.status,
				paymentStatus: orders.paymentStatus,
				paymentMethod: orders.paymentMethod,
				amountPaid: orders.amountPaid,
				notes: orders.notes,
				nominal: orders.nominal,
				estimatedCompletion: orders.estimatedCompletion,
				createdAt: orders.createdAt,
				updatedAt: orders.updatedAt,
			})
			.from(orders)
			.innerJoin(customers, eq(orders.customerId, customers.id))
			.orderBy(desc(orders.createdAt));
	},
);

export const ordersGet = createServerFn({ method: "GET" })
	.inputValidator((id: number) => id)
	.handler(async ({ data: id }) => {
		const order = await db
			.select({
				id: orders.id,
				customerId: orders.customerId,
				customerName: customers.name,
				customerPhone: customers.phone,
				status: orders.status,
				paymentStatus: orders.paymentStatus,
				paymentMethod: orders.paymentMethod,
				amountPaid: orders.amountPaid,
				notes: orders.notes,
				nominal: orders.nominal,
				estimatedCompletion: orders.estimatedCompletion,
				createdAt: orders.createdAt,
				updatedAt: orders.updatedAt,
			})
			.from(orders)
			.innerJoin(customers, eq(orders.customerId, customers.id))
			.where(eq(orders.id, id))
			.limit(1);

		if (order.length === 0) return null;

		const items = await db
			.select()
			.from(orderItems)
			.where(eq(orderItems.orderId, id));

		return {
			...order[0],
			amountPaid: Number(order[0].amountPaid ?? 0),
			nominal: Number(order[0].nominal),
			items,
		};
	});

export type OrderItemInput = {
	serviceId?: number;
	serviceName: string;
	quantity: number;
	unitPrice: number;
};

export const ordersCreate = createServerFn({ method: "POST" })
	.inputValidator(
		(d: {
			customerId: number;
			items: OrderItemInput[];
			paymentMethod?: string;
			notes?: string;
			estimatedCompletion?: string;
		}) => d,
	)
	.handler(async ({ data }) => {
		const nominal = data.items.reduce(
			(sum, item) => sum + item.quantity * item.unitPrice,
			0,
		);

		const created = await db
			.insert(orders)
			.values({
				customerId: data.customerId,
				nominal,
				paymentMethod: data.paymentMethod || "TUNAI",
				paymentStatus: nominal === 0 ? "LUNAS" : "BELUM_BAYAR",
				notes: data.notes || null,
				estimatedCompletion: data.estimatedCompletion
					? new Date(data.estimatedCompletion)
					: null,
			})
			.returning();

		const orderId = created[0].id;

		// Insert order items
		if (data.items.length > 0) {
			await db.insert(orderItems).values(
				data.items.map((item) => ({
					orderId,
					serviceId: item.serviceId,
					serviceName: item.serviceName,
					quantity: item.quantity,
					unitPrice: item.unitPrice,
					subtotal: item.quantity * item.unitPrice,
				})),
			);
		}

		// Update customer totals
		await db
			.update(customers)
			.set({
				totalOrders: sql`${customers.totalOrders} + 1`,
				totalSpent: sql`${customers.totalSpent} + ${nominal}`,
				updatedAt: new Date(),
			})
			.where(eq(customers.id, data.customerId));

		return created[0];
	});

export const ordersUpdate = createServerFn({ method: "POST" })
	.inputValidator(
		(d: {
			id: number;
			status?: OrderStatus;
			paymentStatus?: PaymentStatus;
			paymentMethod?: string;
			amountPaid?: number;
			notes?: string;
			estimatedCompletion?: string | null;
			items?: OrderItemInput[];
		}) => d,
	)
	.handler(async ({ data }) => {
		const { id, items, estimatedCompletion, ...rest } = data;

		// Calculate new nominal if items provided
		let nominal: number | undefined;
		if (items) {
			nominal = items.reduce(
				(sum, item) => sum + item.quantity * item.unitPrice,
				0,
			);
		}

		const updateData: Record<string, unknown> = {
			...rest,
			updatedAt: new Date(),
		};
		if (nominal !== undefined) updateData.nominal = nominal;
		if (estimatedCompletion !== undefined) {
			updateData.estimatedCompletion = estimatedCompletion
				? new Date(estimatedCompletion)
				: null;
		}

		const updated = await db
			.update(orders)
			.set(updateData)
			.where(eq(orders.id, id))
			.returning();

		// Update items if provided
		if (items) {
			await db.delete(orderItems).where(eq(orderItems.orderId, id));
			if (items.length > 0) {
				await db.insert(orderItems).values(
					items.map((item) => ({
						orderId: id,
						serviceId: item.serviceId,
						serviceName: item.serviceName,
						quantity: item.quantity,
						unitPrice: item.unitPrice,
						subtotal: item.quantity * item.unitPrice,
					})),
				);
			}
		}

		// Update customer balance when payment changes
		if (rest.paymentStatus === "LUNAS" || rest.amountPaid !== undefined) {
			const order = updated[0];
			if (order) {
				const amountPaid = rest.amountPaid ?? order.amountPaid ?? 0;
				const debt = Number(order.nominal) - amountPaid;
				if (rest.paymentStatus === "LUNAS" || debt <= 0) {
					await db
						.update(customers)
						.set({ balance: 0, updatedAt: new Date() })
						.where(eq(customers.id, order.customerId));
				}
			}
		}

		return updated[0];
	});

export const ordersDelete = createServerFn({ method: "POST" })
	.inputValidator((d: { id: number }) => d)
	.handler(async ({ data }) => {
		// Get order to update customer totals
		const order = await db
			.select()
			.from(orders)
			.where(eq(orders.id, data.id))
			.limit(1);

		if (order.length > 0) {
			// Decrement customer totals
			await db
				.update(customers)
				.set({
					totalOrders: sql`GREATEST(${customers.totalOrders} - 1, 0)`,
					totalSpent: sql`GREATEST(${customers.totalSpent} - ${order[0].nominal}, 0)`,
					updatedAt: new Date(),
				})
				.where(eq(customers.id, order[0].customerId));
		}

		// Delete order (order_items cascade)
		await db.delete(orders).where(eq(orders.id, data.id));
		return { success: true };
	});

export const ordersUpdateStatus = createServerFn({ method: "POST" })
	.inputValidator((d: { id: number; status: OrderStatus }) => d)
	.handler(async ({ data }) => {
		const updated = await db
			.update(orders)
			.set({ status: data.status, updatedAt: new Date() })
			.where(eq(orders.id, data.id))
			.returning();
		return updated[0];
	});

// ── Analytics ───────────────────────────────────────

export const analyticsSummary = createServerFn({ method: "GET" }).handler(
	async () => {
		const today = new Date();
		today.setHours(0, 0, 0, 0);

		const revenueRes = await db
			.select({ total: sql<number>`coalesce(sum(${orders.nominal}), 0)` })
			.from(orders)
			.where(and(gte(orders.createdAt, today), ne(orders.status, "BATAL")));

		const ordersCountRes = await db
			.select({ count: sql<number>`count(${orders.id})` })
			.from(orders)
			.where(gte(orders.createdAt, today));

		const unpaidRes = await db
			.select({
				total: sql<number>`coalesce(sum(${orders.nominal} - ${orders.amountPaid}), 0)`,
			})
			.from(orders)
			.where(
				and(
					gte(orders.createdAt, today),
					eq(orders.paymentStatus, "BELUM_BAYAR"),
					ne(orders.status, "BATAL"),
				),
			);

		return {
			revenueToday: Number(revenueRes[0]?.total ?? 0),
			ordersToday: Number(ordersCountRes[0]?.count ?? 0),
			unpaidToday: Number(unpaidRes[0]?.total ?? 0),
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
					and(
						sql`${orders.createdAt} >= ${date} AND ${orders.createdAt} < ${nextDate}`,
						ne(orders.status, "BATAL"),
					),
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
	// Breakdown by order_items service_name
	const result = await db
		.select({
			serviceName: orderItems.serviceName,
			count: sql<number>`sum(${orderItems.quantity})`,
			revenue: sql<number>`sum(${orderItems.subtotal})`,
		})
		.from(orderItems)
		.innerJoin(orders, eq(orderItems.orderId, orders.id))
		.where(ne(orders.status, "BATAL"))
		.groupBy(orderItems.serviceName);

	return result.map((r) => ({
		type: r.serviceName,
		count: Number(r.count),
		revenue: Number(r.revenue),
	}));
});

// ── Settings ────────────────────────────────────────

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
