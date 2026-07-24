import { randomBytes } from "node:crypto"
import { mkdir, writeFile } from "node:fs/promises"
import { dirname, resolve } from "node:path"
import { createServerFn } from "@tanstack/react-start"
import { getRequestHeaders } from "@tanstack/react-start/server"
import { eq } from "drizzle-orm"
import { z } from "zod"
import { db } from "@/db"
import { user } from "@/db/schema"
import { auth } from "@/lib/auth"
import { generateRecoveryCode, hashRecoveryCode, verifyRecoveryCode } from "@/lib/recovery-code"
import { batasiLaju, kunciDariPermintaan } from "@/server/batas-laju"
import { requireUserId } from "@/server/require-user"

const MAX_AVATAR_BYTES = 5 * 1024 * 1024

/**
 * Better Auth mewajibkan kolom email. OpenFrame tidak pernah memintanya
 * (lihat spec P1), jadi alamatnya dibentuk di sini dan tidak pernah
 * ditampilkan, dikirimi, atau dipakai untuk masuk.
 */
export function syntheticEmail(username: string): string {
  return `${username.toLowerCase()}@openframe.local`
}

const usernameSchema = z
  .string()
  .min(3, "Username minimal 3 karakter")
  .max(30, "Username maksimal 30 karakter")
  .regex(/^[a-zA-Z0-9_]+$/, "Username hanya boleh huruf, angka, dan garis bawah")

const passwordSchema = z.string().min(6, "Password minimal 6 karakter")

const registerSchema = z.object({
  username: usernameSchema,
  password: passwordSchema,
})

export const registerUser = createServerFn({ method: "POST" })
  .validator((input: unknown) => registerSchema.parse(input))
  .handler(async ({ data }) => {
    // Pendaftaran adalah titik terlemah: rate limiter Better Auth hanya
    // menutupi route auth.handler, sedangkan ini server function yang
    // memanggil auth.api secara langsung. Dipanggil paling awal supaya
    // percobaan yang ditolak tidak sempat memakan CPU untuk scrypt.
    await batasiLaju(kunciDariPermintaan("daftar"), 5, 600)

    const recoveryCode = generateRecoveryCode()
    const recoveryCodeHash = await hashRecoveryCode(recoveryCode)

    const result = await auth.api.signUpEmail({
      body: {
        email: syntheticEmail(data.username),
        username: data.username,
        name: data.username,
        password: data.password,
      },
      headers: getRequestHeaders(),
    })

    // Ditempelkan setelah pendaftaran karena recoveryCodeHash memakai
    // input:false — klien tidak boleh menentukannya lewat endpoint sign-up.
    //
    // Dua penulisan ini TIDAK bisa dijadikan satu transaksi: signUpEmail
    // berjalan lewat koneksi milik Better Auth sendiri, di luar kendali kita.
    // Jadi dipakai kompensasi. Kalau tanpa ini penulisan kedua gagal, yang
    // tertinggal adalah akun dengan recovery_code_hash NULL: kode plaintext
    // sudah hilang, username tidak bisa didaftarkan ulang ("already taken"),
    // dan reset langsung ditolak karena tidak ada hash. Di aplikasi tanpa
    // email, itu terkunci permanen tanpa jalan pulih apa pun.
    try {
      await db.update(user).set({ recoveryCodeHash }).where(eq(user.id, result.user.id))
    } catch (error) {
      // Kembalikan ke keadaan semula supaya username bebas dan pengguna bisa
      // mencoba lagi. Baris session dan account ikut terhapus lewat cascade.
      await db.delete(user).where(eq(user.id, result.user.id))
      /* biome-ignore lint/suspicious/noConsole: kegagalan ini menghapus akun
         yang baru saja dibuat — harus meninggalkan jejak untuk diselidiki. */
      console.error("Gagal menyimpan recovery code, pendaftaran dibatalkan:", error)
      throw new Error("Pendaftaran gagal, silakan coba lagi")
    }

    // Satu-satunya kesempatan kode ini terlihat.
    return { recoveryCode }
  })

/**
 * Hash boneka untuk menyetarakan waktu respons saat username tidak ditemukan.
 * Dihitung sekali saat modul dimuat; isinya tidak pernah cocok dengan kode apa
 * pun karena berasal dari nilai acak yang langsung dibuang.
 */
const DUMMY_HASH = await hashRecoveryCode(generateRecoveryCode())

const resetSchema = z.object({
  username: usernameSchema,
  recoveryCode: z.string().min(1, "Recovery code wajib diisi"),
  newPassword: passwordSchema,
})

export const resetPassword = createServerFn({ method: "POST" })
  .validator((input: unknown) => resetSchema.parse(input))
  .handler(async ({ data }) => {
    // Lebih ketat daripada pendaftaran: jalur ini menebak recovery code, dan
    // itu satu-satunya kunci pemulihan yang dipunya akun tanpa email.
    await batasiLaju(kunciDariPermintaan("reset"), 5, 900)

    const [found] = await db
      .select()
      .from(user)
      .where(eq(user.username, data.username.toLowerCase()))
      .limit(1)

    // Pesan yang sama untuk username tidak ada maupun kode salah, supaya
    // tidak bisa dipakai menebak username mana yang terdaftar.
    const invalid = new Error("Username atau recovery code salah")
    if (!found?.recoveryCodeHash) {
      // Pesan seragam saja tidak cukup: tanpa baris ini, "username tidak ada"
      // balas dalam ~3ms sementara "kode salah" butuh ~40ms karena menjalankan
      // scrypt. Selisih itu stopwatch sederhana pun bisa membacanya, dan
      // enumerasi username yang hendak dicegah pesan seragam tadi jadi
      // terbuka lagi. Jalankan verifikasi boneka supaya waktunya setara —
      // pola yang sama dipakai Better Auth di handler sign-in miliknya.
      await verifyRecoveryCode(data.recoveryCode, DUMMY_HASH)
      throw invalid
    }
    if (!(await verifyRecoveryCode(data.recoveryCode, found.recoveryCodeHash))) throw invalid

    const ctx = await auth.$context
    const hashed = await ctx.password.hash(data.newPassword)
    await ctx.internalAdapter.updatePassword(found.id, hashed)

    // Kode lama hangus begitu dipakai.
    const nextCode = generateRecoveryCode()
    await db
      .update(user)
      .set({ recoveryCodeHash: await hashRecoveryCode(nextCode) })
      .where(eq(user.id, found.id))

    return { recoveryCode: nextCode }
  })

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Password saat ini wajib diisi"),
  newPassword: passwordSchema,
})

export const changePassword = createServerFn({ method: "POST" })
  .validator((input: unknown) => changePasswordSchema.parse(input))
  .handler(async ({ data }) => {
    const result = await auth.api.changePassword({
      body: {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      },
      headers: getRequestHeaders(),
    })
    return result
  })

const uploadAvatarSchema = z.object({
  data: z.string().min(1, "Data gambar wajib diisi"),
  ext: z.enum(["png", "jpg", "jpeg", "webp"]),
})

export const uploadAvatar = createServerFn({ method: "POST" })
  .validator((input: unknown) => uploadAvatarSchema.parse(input))
  .handler(async ({ data }) => {
    const userId = await requireUserId()
    const match = data.data.match(/^data:image\/\w+;base64,(.+)$/)
    if (!match) throw new Error("Format gambar tidak valid")

    const buffer = Buffer.from(match[1], "base64")
    if (buffer.byteLength > MAX_AVATAR_BYTES) throw new Error("Ukuran gambar maksimal 5MB")

    const ext = data.ext === "jpeg" ? "jpg" : data.ext
    const relativePath = `avatars/${userId}/${randomBytes(4).toString("hex")}.${ext}`
    const absolute = resolve(process.env.UPLOAD_DIR ?? "uploads", relativePath)
    await mkdir(dirname(absolute), { recursive: true })
    await writeFile(absolute, buffer)

    // Delete old avatar if exists
    const [existing] = await db.select({ image: user.image }).from(user).where(eq(user.id, userId))
    if (existing?.image?.startsWith("/api/avatar/")) {
      const oldAbsolute = resolve(
        process.env.UPLOAD_DIR ?? "uploads",
        existing.image.replace("/api/avatar/", ""),
      )
      try {
        const { rm } = await import("node:fs/promises")
        await rm(oldAbsolute, { force: true })
      } catch {}
    }

    const imagePath = `/api/avatar/${relativePath.replace("avatars/", "")}`
    await auth.api.updateUser({
      body: { image: imagePath },
      headers: getRequestHeaders(),
    })
    return { image: imagePath }
  })
