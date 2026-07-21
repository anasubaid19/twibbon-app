import { getRequestHeaders } from '@tanstack/react-start/server'
import { auth } from '@/lib/auth'

/**
 * Dipakai DI DALAM handler server function untuk tahu siapa pemilik data.
 *
 * Sengaja bukan server function sendiri: `userId` tidak boleh melintasi kabel
 * ke klien. Alasannya sama dengan proyeksi di `getSession` — apa pun yang
 * dikembalikan server function ikut terserialisasi ke payload hidrasi.
 *
 * Berkas ini juga sengaja terpisah dari `session.ts`. `session.ts` diimpor
 * komponen klien untuk `getSession`, dan bundler hanya memisahkan **badan
 * server function** ke sisi server. Fungsi biasa seperti ini akan ikut
 * terseret ke bundel klien, lalu `bun run build` gagal me-resolve
 * `@tanstack/react-start/server`. Di sini ia hanya diimpor dari dalam handler,
 * jadi tidak pernah sampai ke klien.
 */
export async function requireUserId(): Promise<string> {
  const session = await auth.api.getSession({ headers: getRequestHeaders() })
  if (!session) throw new Error('Kamu harus masuk dulu')
  return session.user.id
}
