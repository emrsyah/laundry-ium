import { z } from 'zod'
import { createTRPCRouter, publicProcedure } from '../init'
import { db } from '../../../db/index'
import { customers } from '../../../db/schema'
import { eq, desc } from 'drizzle-orm'

export const customersRouter = createTRPCRouter({
  list: publicProcedure.query(async () => {
    return await db.select().from(customers).orderBy(desc(customers.createdAt));
  }),
  
  create: publicProcedure
    .input(z.object({
      name: z.string(),
      phone: z.string(),
      address: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const newCustomer = await db.insert(customers).values({
        name: input.name,
        phone: input.phone,
        address: input.address || "",
      }).returning();
      return newCustomer[0];
    }),
    
  getById: publicProcedure
    .input(z.number())
    .query(async ({ input }) => {
      const res = await db.select().from(customers).where(eq(customers.id, input));
      return res[0];
    })
})
