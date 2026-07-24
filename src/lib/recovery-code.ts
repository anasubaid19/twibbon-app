import { randomBytes, scrypt, timingSafeEqual } from "node:crypto"
import { promisify } from "node:util"

const scryptAsync = promisify(scrypt)
const GROUP_SIZE = 8
const BYTE_COUNT = 16
const SALT_BYTES = 16
const KEY_LENGTH = 64

/** Kode 32 heksadesimal huruf besar: XXXXXXXX-XXXXXXXX-XXXXXXXX-XXXXXXXX */
export function generateRecoveryCode(): string {
  const hex = randomBytes(BYTE_COUNT).toString("hex").toUpperCase()
  return (hex.match(new RegExp(`.{${GROUP_SIZE}}`, "g")) ?? []).join("-")
}

/** Menyeragamkan kode sebelum hash/verifikasi agar salin-tempel yang berantakan tetap diterima. */
function normalize(code: string): string {
  return code.replace(/\s/g, "").toUpperCase()
}

/** Mengembalikan `<salt hex>:<turunan hex>`. */
export async function hashRecoveryCode(code: string): Promise<string> {
  const salt = randomBytes(SALT_BYTES)
  const derived = (await scryptAsync(normalize(code), salt, KEY_LENGTH)) as Buffer
  return `${salt.toString("hex")}:${derived.toString("hex")}`
}

export async function verifyRecoveryCode(code: string, stored: string): Promise<boolean> {
  // Bentuk sah: "<salt hex>:<turunan hex>". Nilai tersimpan yang cacat adalah
  // jalur yang memang diharapkan — diperiksa terang-terangan di sini, bukan
  // ditangkap sebagai exception, supaya `catch` di bawah hanya menyisakan
  // hal-hal yang benar-benar tak terduga.
  const parts = typeof stored === "string" ? stored.split(":") : []
  const [saltHex, hashHex] = parts
  if (!saltHex || !hashHex) return false

  const expected = Buffer.from(hashHex, "hex")
  // Buffer.from memotong diam-diam pada hex yang tidak valid, jadi panjangnya
  // yang menentukan — sekaligus menjamin timingSafeEqual tidak pernah menerima
  // dua buffer berbeda panjang (ia melempar kalau itu terjadi).
  if (expected.length !== KEY_LENGTH) return false

  try {
    const derived = (await scryptAsync(
      normalize(code),
      Buffer.from(saltHex, "hex"),
      KEY_LENGTH,
    )) as Buffer

    // Perbandingan waktu-tetap: jangan bocorkan berapa banyak byte yang cocok.
    return timingSafeEqual(expected, derived)
  } catch (error) {
    /* biome-ignore lint/suspicious/noConsole: sampai di sini berarti ada yang
       tidak beres di luar dugaan — bukan sekadar kode salah, karena semua
       bentuk cacat yang diharapkan sudah disaring di atas. Tetap gagal
       tertutup, tapi jangan ditelan diam-diam: di aplikasi tanpa email,
       recovery code adalah satu-satunya jalan pulih, jadi kegagalan yang
       tak terjelaskan harus meninggalkan jejak untuk diselidiki. */
    console.error("verifyRecoveryCode gagal tak terduga:", error)
    return false
  }
}
