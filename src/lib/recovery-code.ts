import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'

const scryptAsync = promisify(scrypt)
const GROUP_SIZE = 8
const BYTE_COUNT = 16
const SALT_BYTES = 16
const KEY_LENGTH = 64

/** Kode 32 heksadesimal huruf besar: XXXXXXXX-XXXXXXXX-XXXXXXXX-XXXXXXXX */
export function generateRecoveryCode(): string {
  const hex = randomBytes(BYTE_COUNT).toString('hex').toUpperCase()
  return (hex.match(new RegExp(`.{${GROUP_SIZE}}`, 'g')) ?? []).join('-')
}

/** Menyeragamkan kode sebelum hash/verifikasi agar salin-tempel yang berantakan tetap diterima. */
function normalize(code: string): string {
  return code.replace(/\s/g, '').toUpperCase()
}

/** Mengembalikan `<salt hex>:<turunan hex>`. */
export async function hashRecoveryCode(code: string): Promise<string> {
  const salt = randomBytes(SALT_BYTES)
  const derived = (await scryptAsync(normalize(code), salt, KEY_LENGTH)) as Buffer
  return `${salt.toString('hex')}:${derived.toString('hex')}`
}

export async function verifyRecoveryCode(code: string, stored: string): Promise<boolean> {
  try {
    const [saltHex, hashHex] = stored.split(':')
    if (!saltHex || !hashHex) return false

    const expected = Buffer.from(hashHex, 'hex')
    if (expected.length !== KEY_LENGTH) return false

    const derived = (await scryptAsync(
      normalize(code),
      Buffer.from(saltHex, 'hex'),
      KEY_LENGTH,
    )) as Buffer

    // Perbandingan waktu-tetap: jangan bocorkan berapa banyak byte yang cocok.
    return timingSafeEqual(expected, derived)
  } catch {
    // Hash rusak atau formatnya tidak dikenal — perlakukan sebagai tidak cocok.
    return false
  }
}
