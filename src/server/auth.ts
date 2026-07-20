import { createServerFn } from '@tanstack/react-start'
import { getRequestHeaders } from '@tanstack/react-start/server'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '@/db'
import { user } from '@/db/schema'
import { auth } from '@/lib/auth'
import { generateRecoveryCode, hashRecoveryCode, verifyRecoveryCode } from '@/lib/recovery-code'

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
  .min(3, 'Username minimal 3 karakter')
  .max(30, 'Username maksimal 30 karakter')
  .regex(/^[a-zA-Z0-9_]+$/, 'Username hanya boleh huruf, angka, dan garis bawah')

const passwordSchema = z.string().min(6, 'Password minimal 6 karakter')

const registerSchema = z.object({
  username: usernameSchema,
  password: passwordSchema,
})

export const registerUser = createServerFn({ method: 'POST' })
  .validator((input: unknown) => registerSchema.parse(input))
  .handler(async ({ data }) => {
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
    await db.update(user).set({ recoveryCodeHash }).where(eq(user.id, result.user.id))

    // Satu-satunya kesempatan kode ini terlihat.
    return { recoveryCode }
  })

const resetSchema = z.object({
  username: usernameSchema,
  recoveryCode: z.string().min(1, 'Recovery code wajib diisi'),
  newPassword: passwordSchema,
})

export const resetPassword = createServerFn({ method: 'POST' })
  .validator((input: unknown) => resetSchema.parse(input))
  .handler(async ({ data }) => {
    const [found] = await db
      .select()
      .from(user)
      .where(eq(user.username, data.username.toLowerCase()))
      .limit(1)

    // Pesan yang sama untuk username tidak ada maupun kode salah, supaya
    // tidak bisa dipakai menebak username mana yang terdaftar.
    const invalid = new Error('Username atau recovery code salah')
    if (!found?.recoveryCodeHash) throw invalid
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
