import { createRootRoute, HeadContent, Outlet, Scripts } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { getRequestHeaders } from '@tanstack/react-start/server'
import appCss from '@/styles/app.css?url'

const getTheme = createServerFn({ method: 'GET' }).handler(() => {
  const cookie = getRequestHeaders().get('cookie') ?? ''
  return cookie.includes('theme=light') ? 'light' : 'dark'
})

export const Route = createRootRoute({
  head: ({ loaderData }) => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'OpenFrame' },
      // Warna bilah browser ikut tema aktual. Diturunkan dari loader, bukan
      // media query: TanStack men-dedup meta berdasarkan `name`, jadi dua tag
      // theme-color akan saling menimpa dan hanya satu yang bertahan.
      { name: 'theme-color', content: loaderData === 'light' ? '#ffffff' : '#0b0b0d' },
    ],
    links: [
      { rel: 'stylesheet', href: appCss },
      // SVG favicon jadi yang utama: crisp di layar apa pun, dan monogram OP-nya
      // ikut skema warna browser. PNG 32px jadi cadangan untuk yang tak dukung SVG.
      { rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' },
      { rel: 'icon', href: '/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' },
      { rel: 'manifest', href: '/manifest.webmanifest' },
    ],
  }),
  loader: () => getTheme(),
  component: RootComponent,
})

function RootComponent() {
  const theme = Route.useLoaderData()
  return (
    <html lang="id" data-theme={theme}>
      <head>
        <HeadContent />
      </head>
      <body>
        <Outlet />
        <Scripts />
      </body>
    </html>
  )
}
