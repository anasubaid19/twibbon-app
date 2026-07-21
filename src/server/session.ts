import { createServerFn } from '@tanstack/react-start'
import { getRequestHeaders } from '@tanstack/react-start/server'
import { auth } from '@/lib/auth'

export const getSession = createServerFn({ method: 'GET' }).handler(async () => {
  const session = await auth.api.getSession({ headers: getRequestHeaders() })
  if (!session) return null

  /* Proyeksikan sisi server: JANGAN pernah kirim objek session mentah ke
   * klien. getSession adalah server function — saat beforeLoad jalan di
   * klien (navigasi client-side atau preload 'intent'), respons RPC ini
   * melintasi kabel dan terlihat di Network tab. Session mentah memuat
   * email sintetis <username>@openframe.local yang pengguna tidak boleh
   * tahu ada. Kembalikan hanya field aman yang memang dipakai — sekaligus
   * menetapkan bentuk aman untuk Fase 2 saat role/data campaign menempel. */
  return { user: { username: session.user.username ?? session.user.name } }
})

/**
 * Dipakai DI DALAM handler server function untuk tahu siapa pemilik data.
 *
 * Sengaja bukan server function sendiri: `userId` tidak boleh melintasi kabel
 * ke klien. Alasannya sama dengan proyeksi di `getSession` di atas — apa pun
 * yang dikembalikan server function ikut terserialisasi ke payload hidrasi.
 */
export async function requireUserId(): Promise<string> {
  const session = await auth.api.getSession({ headers: getRequestHeaders() })
  if (!session) throw new Error('Kamu harus masuk dulu')
  return session.user.id
}
