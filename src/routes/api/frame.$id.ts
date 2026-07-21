import { createFileRoute } from '@tanstack/react-router'
import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { campaigns } from '@/db/schema'
import { readFrame } from '@/server/upload'

/* Fungsi, bukan satu objek Response yang dipakai ulang: badan Response hanya
   bisa dibaca sekali, jadi objek modul-level akan gagal pada permintaan kedua. */
function tidakDitemukan(): Response {
  return new Response('Tidak ditemukan', { status: 404 })
}

export const Route = createFileRoute('/api/frame/$id')({
  server: {
    handlers: {
      GET: async ({ params, request }: { params: { id: string }; request: Request }) => {
        const [row] = await db
          .select({ framePath: campaigns.framePath })
          .from(campaigns)
          .where(eq(campaigns.id, params.id))
          .limit(1)

        // Frame memang publik — ia tampil di halaman campaign dan bisa diunduh
        // siapa pun dari network tab (spec 3.1). Jadi tidak ada pemeriksaan
        // sesi di sini; yang penting hanya jalurnya berasal dari database.
        if (!row) return tidakDitemukan()

        // Jalur berkas berubah setiap frame diganti, jadi ia sekaligus
        // penanda versi. Tanpa ini, `max-age` apa pun akan menyajikan gambar
        // lama setelah frame diganti karena URL-nya tetap sama.
        const etag = `"${row.framePath}"`
        if (request.headers.get('if-none-match') === etag) {
          return new Response(null, { status: 304 })
        }

        let bytes: Uint8Array<ArrayBuffer>
        try {
          bytes = await readFrame(row.framePath)
        } catch {
          // Baris ada tapi berkasnya hilang — perlakukan sama dengan tidak ada.
          return tidakDitemukan()
        }

        return new Response(bytes, {
          headers: {
            'Content-Type': 'image/png',
            'Cache-Control': 'public, max-age=60, must-revalidate',
            ETag: etag,
          },
        })
      },
    },
  },
})
