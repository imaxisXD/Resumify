import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRouteWithContext,
} from '@tanstack/react-router'

import appCss from '../styles.css?url'
import { Sidebar } from '../components/shell/Sidebar'
import { ThemeBridge } from '../components/ThemeBridge'

import type { QueryClient } from '@tanstack/react-query'

interface MyRouterContext {
  queryClient: QueryClient
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { name: 'theme-color', content: '#0a0a0c' },
      { title: 'Resumify - Resume builder' },
      {
        name: 'description',
        content:
          'Build your resume on a canvas. Drag sections, link them in order, see the preview live, and export to PDF.',
      },
    ],
    links: [{ rel: 'stylesheet', href: appCss }],
  }),
  shellComponent: RootDocument,
  component: AppShell,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <head>
        <HeadContent />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var s=localStorage.getItem('resumify.v1');if(s){var t=JSON.parse(s).state.theme;if(t){document.documentElement.dataset.theme=t;}}}catch(_){}})();`,
          }}
        />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  )
}

function AppShell() {
  return (
    <div className="flex h-dvh w-screen overflow-hidden bg-[var(--bg)] text-[var(--text)]">
      <ThemeBridge />
      <Sidebar />
      <main className="flex-1 min-w-0 flex flex-col">
        <Outlet />
      </main>
    </div>
  )
}
