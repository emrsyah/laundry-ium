import type { ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import superjson from 'superjson'
import { createTRPCClient, httpBatchStreamLink } from '@trpc/client'
import { createTRPCOptionsProxy } from '@trpc/tanstack-react-query'

import type { TRPCRouter } from '#/integrations/trpc/router'
import { TRPCProvider } from '#/integrations/trpc/react'

function getUrl() {
  const base = (() => {
    if (typeof window !== 'undefined') return ''
    // SSR: use current request host (works on Vercel, Node, etc.)
    return process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : `http://localhost:${process.env.PORT ?? 3000}`
  })()
  return `${base}/api/trpc`
}

export const trpcClient = createTRPCClient<TRPCRouter>({
  links: [
    httpBatchStreamLink({
      transformer: superjson,
      url: getUrl(),
    }),
  ],
})

export function getContext() {
  const queryClient = new QueryClient({
    defaultOptions: {
      dehydrate: { serializeData: superjson.serialize },
      hydrate: { deserializeData: superjson.deserialize },
    },
  })

  const serverHelpers = createTRPCOptionsProxy({
    client: trpcClient,
    queryClient: queryClient,
  })
  const context = {
    queryClient,
    trpc: serverHelpers,
  }

  return context
}

export default function TanstackQueryProvider({
  children,
  context,
}: {
  children: ReactNode
  context: ReturnType<typeof getContext>
}) {
  const { queryClient } = context

  return (
    <TRPCProvider trpcClient={trpcClient} queryClient={queryClient}>
      {children}
    </TRPCProvider>
  )
}
