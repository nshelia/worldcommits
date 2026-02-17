import {
  HeadContent,
  Link,
  Outlet,
  Scripts,
  createRootRouteWithContext,
} from '@tanstack/react-router'
import * as React from 'react'
import type { QueryClient } from '@tanstack/react-query'
import { useAuthActions } from '@convex-dev/auth/react'
import { useQuery, useConvexAuth } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar'
import { Globe, BarChart3, Plug } from 'lucide-react'
import appCss from '~/styles/app.css?url'

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient
}>()({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'Worldcommits',
      },
    ],
    links: [
      { rel: 'stylesheet', href: appCss },
      {
        rel: 'apple-touch-icon',
        sizes: '180x180',
        href: '/apple-touch-icon.png',
      },
      {
        rel: 'icon',
        type: 'image/png',
        sizes: '32x32',
        href: '/favicon-32x32.png',
      },
      {
        rel: 'icon',
        type: 'image/png',
        sizes: '16x16',
        href: '/favicon-16x16.png',
      },
      { rel: 'manifest', href: '/site.webmanifest', color: '#fffff' },
      { rel: 'icon', href: '/favicon.ico' },
    ],
  }),
  notFoundComponent: () => <div>Route not found</div>,
  component: RootComponent,
})

function RootComponent() {
  return (
    <RootDocument>
      <Outlet />
    </RootDocument>
  )
}

function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
    </svg>
  )
}

function Header() {
  const { signIn, signOut } = useAuthActions()
  const { isAuthenticated, isLoading } = useConvexAuth()
  const viewer = useQuery(api.users.viewer)

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex justify-center px-4 pt-3">
      <div className="flex h-12 w-full max-w-2xl items-center justify-between rounded-2xl bg-neutral-900/80 px-5 shadow-lg shadow-black/20 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2 text-sm font-semibold tracking-tight text-white">
            <Globe className="size-4 text-neutral-400" />
            Worldcommits
          </Link>

          <Link
            to="/leaderboard"
            className="flex items-center justify-center rounded-xl p-2 text-neutral-400 transition-colors hover:bg-neutral-800 hover:text-white"
            aria-label="Leaderboard"
          >
            <BarChart3 className="size-4" />
          </Link>

          <Link
            to="/setup"
            className="flex items-center justify-center rounded-xl p-2 text-neutral-400 transition-colors hover:bg-neutral-800 hover:text-white"
            aria-label="Setup"
          >
            <Plug className="size-4" />
          </Link>
        </div>

        <div className="flex items-center gap-2">
          {!isLoading && !isAuthenticated && (
            <button
              type="button"
              onClick={() => void signIn('github', { redirectTo: '/' })}
              className="flex items-center gap-2 rounded-xl bg-neutral-800 px-3.5 py-1.5 text-sm font-medium text-white transition-colors hover:bg-neutral-700"
            >
              <GitHubIcon className="size-4" />
              Sign in with GitHub
            </button>
          )}

          {!isLoading && isAuthenticated && viewer && (
            <div className="flex items-center gap-2">
              <Link to="/users/$username" params={{ username: viewer.githubUsername! }} className="flex items-center gap-2 rounded-xl px-2 py-1 transition-colors hover:bg-neutral-800">
                <Avatar size="sm">
                  <AvatarImage
                    src={`https://github.com/${viewer.githubUsername}.png`}
                    alt={viewer.githubUsername ?? ''}
                  />
                  <AvatarFallback>
                    {(viewer.githubUsername ?? 'U').slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm text-neutral-300">@{viewer.githubUsername}</span>
              </Link>
              <button
                type="button"
                onClick={() => void signOut()}
                className="rounded-xl px-3 py-1.5 text-sm text-neutral-400 transition-colors hover:bg-neutral-800 hover:text-white"
              >
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html className="dark">
      <head>
        <HeadContent />
      </head>
      <body className="dark">
        <Header />
        <div className="pt-20">
          {children}
        </div>
        <Scripts />
      </body>
    </html>
  )
}
