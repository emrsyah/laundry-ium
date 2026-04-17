import { z } from 'zod'
import { createTRPCRouter, publicProcedure } from '../init'
import { db } from '../../../db/index'
import { orders, customers } from '../../../db/schema'
import { eq, desc } from 'drizzle-orm'

export const ordersRouter = createTRPCRouter({
  list: publicProcedure.query(async () => {
    // Join with customers to get the name
    const result = await db.select({
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
    return result;
  }),
  
  create: publicProcedure
    .input(z.object({
      customerId: z.number(),
      type: z.string(),
      nominal: z.number(),
    }))
    .mutation(async ({ input }) => {
      const newOrder = await db.insert(orders).values({
        customerId: input.customerId,
        type: input.type,
        nominal: input.nominal,
        status: "PENDING",
      }).returning();
      return newOrder[0];
    }),

  updateStatus: publicProcedure
    .input(z.object({
      id: z.number(),
      status: z.enum(["PENDING", "DIPROSES", "SELESAI"]),
    }))
    .mutation(async ({ input }) => {
      const updated = await db.update(orders)
        .set({ status: input.status, updatedAt: new Date() })
        .where(eq(orders.id, input.id))
        .returning();
        
      // if (input.status === "SELESAI") {
      //   // Trigger WA Notif conceptually here.
      // }  
        
      return updated[0];
    }),
})
