import { getRequestHeaders } from "@tanstack/react-start/server"
import { auth } from "@/lib/auth"

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
  if (!session) throw new Error("Kamu harus masuk dulu")
  return session.user.id
}

export async function getOptionalUserId(): Promise<string | null> {
  const session = await auth.api.getSession({ headers: getRequestHeaders() })
  return session?.user.id ?? null
}

import { eq } from "drizzle-orm"
import { db } from "@/db"
import { user } from "@/db/schema"

/**
 * Memastikan pemanggil adalah super admin. Periksa peran di database (bukan
 * klaim klien), ditambah daftar username dari env SUPER_ADMIN_USERNAMES
 * (pisah koma) agar bootstrap tanpa migrasi data manual.
 */
export async function requireSuperAdmin(): Promise<string> {
  const session = await auth.api.getSession({ headers: getRequestHeaders() })
  if (!session) throw new Error("Kamu harus masuk dulu")

  const [row] = await db
    .select({ role: user.role, username: user.username, name: user.name })
    .from(user)
    .where(eq(user.id, session.user.id))
    .limit(1)

  const username = (row?.username ?? session.user.username ?? session.user.name ?? "").toLowerCase()
  const envAdmins = (process.env.SUPER_ADMIN_USERNAMES ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)

  if (row?.role === "superadmin" || envAdmins.includes(username)) return session.user.id
  throw new Error("Akses ditolak: hanya super admin")
}
