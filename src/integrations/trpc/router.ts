import { createTRPCRouter } from './init'
import { customersRouter } from './routers/customers'
import { ordersRouter } from './routers/orders'
import { analyticsRouter } from './routers/analytics'
import { settingsRouter } from './routers/settings'

export const trpcRouter = createTRPCRouter({
  customers: customersRouter,
  orders: ordersRouter,
  analytics: analyticsRouter,
  settings: settingsRouter,
})

export type TRPCRouter = typeof trpcRouter
