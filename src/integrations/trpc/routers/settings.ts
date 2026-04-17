import { z } from 'zod'
import { createTRPCRouter, publicProcedure } from '../init'
import { db } from '../../../db/index'
import { storeSettings } from '../../../db/schema'
import { eq } from 'drizzle-orm'

export const settingsRouter = createTRPCRouter({
  get: publicProcedure.query(async () => {
    const rows = await db.select().from(storeSettings).limit(1)
    if (rows.length > 0) return rows[0]
    // Auto-create default row if none exists
    const created = await db.insert(storeSettings).values({}).returning()
    return created[0]
  }),

  update: publicProcedure
    .input(z.object({
      name: z.string().optional(),
      address: z.string().optional(),
      waTemplate: z.string().optional(),
      autoWaEnabled: z.boolean().optional(),
      paymentConfigs: z.array(z.string()).optional(),
    }))
    .mutation(async ({ input }) => {
      const rows = await db.select().from(storeSettings).limit(1)
      
      if (rows.length === 0) {
        const created = await db.insert(storeSettings).values({
          ...input,
          updatedAt: new Date(),
        }).returning()
        return created[0]
      }

      const updated = await db.update(storeSettings)
        .set({ ...input, updatedAt: new Date() })
        .where(eq(storeSettings.id, rows[0].id))
        .returning()
      return updated[0]
    }),
})
