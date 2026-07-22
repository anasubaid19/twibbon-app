/**
 * Penyaji produksi.
 *
 * `bun run build` menghasilkan handler bergaya `{ fetch }` di
 * `dist/server/server.js` — tanpa `listen()` sendiri. Berkas ini yang
 * menyalakannya, sekaligus menyajikan aset statis yang tidak diurus handler itu.
 *
 * ponytail: Bun.serve() langsung, tanpa framework HTTP tambahan. Yang
 * dibutuhkan cuma "coba berkas dulu, kalau tidak ada serahkan ke SSR".
 */
import { serve } from 'bun'
import handler from './dist/server/server.js'

const PORT = Number(process.env.PORT ?? 3000)
const KLIEN = 'dist/client'

/** Aset ber-hash aman di-cache selamanya; sisanya tidak. */
function cacheUntuk(pathname: string): string {
  return pathname.startsWith('/assets/')
    ? 'public, max-age=31536000, immutable'
    : 'public, max-age=3600'
}

serve({
  port: PORT,
  async fetch(request) {
    const url = new URL(request.url)

    // Jangan pernah keluar dari direktori klien: `pathname` datang dari
    // permintaan, jadi ia tidak boleh dipercaya sebagai jalur berkas.
    if (url.pathname !== '/' && !url.pathname.includes('..')) {
      const berkas = Bun.file(`${KLIEN}${url.pathname}`)
      if (await berkas.exists()) {
        return new Response(berkas, {
          headers: { 'Cache-Control': cacheUntuk(url.pathname) },
        })
      }
    }

    return handler.fetch(request)
  },
})

// biome-ignore lint/suspicious/noConsole: satu baris saat start, supaya jelas server benar-benar hidup
console.log(`OpenFrame jalan di http://localhost:${PORT}`)
