import { createTRPCRouter, publicProcedure } from '../init'
import { db } from '../../../db/index'
import { orders } from '../../../db/schema'
import { sql, gte } from 'drizzle-orm'

export const analyticsRouter = createTRPCRouter({
  summary: publicProcedure.query(async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Sum of nominal for today
    const revenueRes = await db.select({ total: sql<number>`coalesce(sum(${orders.nominal}), 0)` })
      .from(orders)
      .where(gte(orders.createdAt, today));
      
    // Count of orders today
    const ordersCountRes = await db.select({ count: sql<number>`count(${orders.id})` })
      .from(orders)
      .where(gte(orders.createdAt, today));

    return {
      revenueToday: Number(revenueRes[0]?.total ?? 0),
      ordersToday: Number(ordersCountRes[0]?.count ?? 0),
    };
  }),

  weeklyRevenue: publicProcedure.query(async () => {
    const days: { label: string; revenue: number; count: number }[] = [];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);
      
      const res = await db.select({
        total: sql<number>`coalesce(sum(${orders.nominal}), 0)`,
        count: sql<number>`count(${orders.id})`,
      })
        .from(orders)
        .where(
          sql`${orders.createdAt} >= ${date} AND ${orders.createdAt} < ${nextDate}`
        );
      
      days.push({
        label: date.toLocaleDateString('id-ID', { weekday: 'short' }),
        revenue: Number(res[0]?.total ?? 0),
        count: Number(res[0]?.count ?? 0),
      });
    }
    
    return days;
  }),

  serviceBreakdown: publicProcedure.query(async () => {
    const result = await db.select({
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
  }),
})
