import {
  HeadContent,
  Scripts,
  createRootRouteWithContext,
} from '@tanstack/react-router'
import { BottomNav } from '../components/BottomNav'

import appCss from '../styles.css?url'

import type { QueryClient } from '@tanstack/react-query'

import type { TRPCRouter } from '#/integrations/trpc/router'
import type { TRPCOptionsProxy } from '@trpc/tanstack-react-query'

interface MyRouterContext {
  queryClient: QueryClient

  trpc: TRPCOptionsProxy<TRPCRouter>
}

const THEME_INIT_SCRIPT = `(function(){try{var stored=window.localStorage.getItem('theme');var mode=(stored==='light'||stored==='dark'||stored==='auto')?stored:'auto';var prefersDark=window.matchMedia('(prefers-color-scheme: dark)').matches;var resolved=mode==='auto'?(prefersDark?'dark':'light'):mode;var root=document.documentElement;root.classList.remove('light','dark');root.classList.add(resolved);if(mode==='auto'){root.removeAttribute('data-theme')}else{root.setAttribute('data-theme',mode)}root.style.colorScheme=resolved;}catch(e){}})();`

export const Route = createRootRouteWithContext<MyRouterContext>()({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1, viewport-fit=cover',
      },
      {
        name: 'theme-color',
        content: '#f95d85',
      },
      {
        name: 'description',
        content: 'LaundryKu - Aplikasi CRM untuk bisnis laundry Anda',
      },
      {
        title: 'LaundryKu - CRM Laundry',
      },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: appCss,
      },
    ],
  }),
  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        <HeadContent />
      </head>
      <body className="font-sans antialiased bg-[var(--bg-base)]">
        {/* Mobile-first constrained container */}
        <div className="relative mx-auto min-h-screen max-w-md shadow-2xl overflow-hidden bg-background">
          <main className="pb-[4.5rem]">
            {children}
          </main>
          <BottomNav />
        </div>
        <Scripts />
      </body>
    </html>
  )
}
