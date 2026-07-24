import { createServerFn } from "@tanstack/react-start"
import { getRequestHeaders } from "@tanstack/react-start/server"
import { auth } from "@/lib/auth"

export const getSession = createServerFn({ method: "GET" }).handler(async () => {
  const session = await auth.api.getSession({ headers: getRequestHeaders() })
  if (!session) return null

  /* Proyeksikan sisi server: JANGAN pernah kirim objek session mentah ke
   * klien. getSession adalah server function — saat beforeLoad jalan di
   * klien (navigasi client-side atau preload 'intent'), respons RPC ini
   * melintasi kabel dan terlihat di Network tab. Session mentah memuat
   * email sintetis <username>@openframe.local yang pengguna tidak boleh
   * tahu ada. Kembalikan hanya field aman yang memang dipakai — sekaligus
   * menetapkan bentuk aman untuk Fase 2 saat role/data campaign menempel. */
  return {
    user: { username: session.user.username ?? session.user.name, image: session.user.image },
  }
})

/* `requireUserId` sengaja TIDAK tinggal di sini, melainkan di
   `require-user.ts`. Berkas ini diimpor komponen klien (mereka butuh
   `getSession`), dan hanya badan server function yang dipisahkan ke bundel
   server. Fungsi biasa yang menyentuh `auth` akan ikut terseret ke bundel
   klien dan membuat `bun run build` gagal me-resolve modul server. */
