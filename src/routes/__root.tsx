import { createRootRoute, HeadContent, Outlet, Scripts } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { getRequestHeaders } from '@tanstack/react-start/server'
import appCss from '@/styles/app.css?url'

const getTheme = createServerFn({ method: 'GET' }).handler(() => {
  const cookie = getRequestHeaders().get('cookie') ?? ''
  return cookie.includes('theme=light') ? 'light' : 'dark'
})

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'OpenFrame' },
    ],
    links: [{ rel: 'stylesheet', href: appCss }],
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
