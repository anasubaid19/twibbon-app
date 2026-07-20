import { drizzleAdapter } from '@better-auth/drizzle-adapter'
import { betterAuth } from 'better-auth'
import { username } from 'better-auth/plugins'
import { tanstackStartCookies } from 'better-auth/tanstack-start'
import { db } from '@/db'
import * as schema from '@/db/schema'

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: 'pg', schema }),
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL,

  emailAndPassword: {
    enabled: true,
    minPasswordLength: 6,
    // Tidak ada verifikasi email: alamatnya sintetis dan tidak pernah dikirimi apa pun.
    requireEmailVerification: false,
  },

  user: {
    additionalFields: {
      recoveryCodeHash: {
        type: 'string',
        required: false,
        // input: false — klien tidak boleh menentukan hash-nya sendiri.
        input: false,
        // returned: false — dan tidak boleh ikut terkirim balik. Tanpa ini
        // /sign-in/username dan /get-session mengembalikan objek user
        // lengkap beserta hash-nya di badan respons JSON.
        returned: false,
      },
    },
  },

  rateLimit: {
    enabled: true,
    window: 60,
    max: 10,
  },

  plugins: [
    username(),
    // tanstackStartCookies HARUS jadi plugin terakhir.
    tanstackStartCookies(),
  ],
})
