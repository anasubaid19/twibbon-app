import { createRootRoute, HeadContent, Link, Outlet, Scripts } from "@tanstack/react-router"
import { createServerFn } from "@tanstack/react-start"
import { getRequestHeaders } from "@tanstack/react-start/server"
import { asalUrl } from "@/server/origin"
import appCss from "@/styles/app.css?url"

const getPageMeta = createServerFn({ method: "GET" }).handler(() => {
  const cookie = getRequestHeaders().get("cookie") ?? ""
  return {
    theme: cookie.split(";").some((part) => part.trim() === "theme=light") ? "light" : "dark",
    asal: asalUrl(),
  }
})

export const Route = createRootRoute({
  head: ({ loaderData }) => {
    const asal = loaderData?.asal ?? ""
    return {
      meta: [
        { charSet: "utf-8" },
        { name: "viewport", content: "width=device-width, initial-scale=1" },
        { title: "OpenFrame" },
        // Warna bilah browser ikut tema aktual. Diturunkan dari loader, bukan
        // media query: TanStack men-dedup meta berdasarkan `name`, jadi dua tag
        // theme-color akan saling menimpa dan hanya satu yang bertahan.
        { name: "theme-color", content: loaderData?.theme === "light" ? "#ffffff" : "#0b0b0d" },
        { property: "og:type", content: "website" },
        { property: "og:site_name", content: "OpenFrame" },
        { property: "og:title", content: "OpenFrame" },
        {
          property: "og:description",
          content: "Buat dan bagikan twibbon tanpa ribet dengan OpenFrame.",
        },
        { property: "og:image", content: asal ? `${asal}/og-home.png?v=2` : "/og-home.png?v=2" },
        { property: "og:url", content: asal || "/" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
      links: [
        { rel: "stylesheet", href: appCss },
        // SVG favicon jadi yang utama: crisp di layar apa pun, dan monogram OP-nya
        // ikut skema warna browser. PNG 32px jadi cadangan untuk yang tak dukung SVG.
        { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
        { rel: "icon", href: "/favicon-32.png", sizes: "32x32", type: "image/png" },
        { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
        { rel: "manifest", href: "/manifest.webmanifest" },
      ],
    }
  },
  loader: () => getPageMeta(),
  notFoundComponent: () => (
    <main
      style={{
        margin: "4rem auto",
        maxWidth: "28rem",
        padding: "1.5rem",
        textAlign: "center",
      }}
    >
      <h1>Halaman tidak ditemukan</h1>
      <p>Tautan yang dibuka tidak tersedia atau sudah dihapus.</p>
      <Link to="/" search={{ q: "", hal: 1 }}>
        Kembali ke beranda
      </Link>
    </main>
  ),
  component: RootComponent,
})

function RootComponent() {
  const { theme } = Route.useLoaderData()
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
