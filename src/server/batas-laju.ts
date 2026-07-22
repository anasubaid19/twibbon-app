import { getRequestHeaders } from '@tanstack/react-start/server'
import { sql } from 'drizzle-orm'
import { db } from '@/db'

/**
 * Apakah `sekarang` sudah melewati jendela yang dimulai pada `mulai`.
 *
 * Selisih negatif — jam server mundur karena NTP — sengaja **tidak** dianggap
 * jendela baru. Kalau dianggap baru, siapa pun yang bisa memicunya mendapat
 * kuota tanpa batas.
 */
export function jendelaBaru(mulai: Date, jendelaDetik: number, sekarang: Date): boolean {
  return sekarang.getTime() - mulai.getTime() > jendelaDetik * 1000
}

/**
 * Kunci pembatas untuk permintaan yang sedang berjalan.
 *
 * Di belakang proxy, IP asli ada di `x-forwarded-for`. Kalau header itu tidak
 * diteruskan, semua lalu lintas jatuh ke satu ember bersama — membatasi lebih
 * ketat dari seharusnya, tapi tidak pernah membiarkan lolos. Itu arah gagal
 * yang benar.
 */
export function kunciDariPermintaan(prefiks: string): string {
  const h = getRequestHeaders()
  const ip =
    h.get('x-forwarded-for')?.split(',')[0]?.trim() || h.get('x-real-ip')?.trim() || 'tanpa-ip'
  return `${prefiks}:${ip}`
}

/** Pesan seragam: tidak menyebut username, jadi tidak bisa dipakai menebak akun. */
const TERLALU_SERING = 'Terlalu banyak percobaan. Tunggu sebentar, lalu coba lagi.'

/**
 * Menaikkan penghitung dan melempar bila kuotanya habis.
 *
 * Satu pernyataan upsert, bukan baca-lalu-tulis: dua permintaan bersamaan
 * harus menghasilkan dua hitungan, bukan satu.
 */
export async function batasiLaju(kunci: string, maks: number, jendelaDetik: number): Promise<void> {
  // Hanya `jendelaDetik` yang disisipkan mentah, dan nilainya selalu konstanta
  // di kode kita — tidak pernah datang dari pengguna. Kunci tetap
  // terparameterisasi.
  const jendela = sql.raw(`interval '${Math.trunc(jendelaDetik)} seconds'`)

  let hitungan: number
  try {
    const hasil = await db.execute(sql`
      INSERT INTO rate_limit (key, count, window_start)
      VALUES (${kunci}, 1, now())
      ON CONFLICT (key) DO UPDATE SET
        count = CASE
          WHEN now() - rate_limit.window_start > ${jendela}
          THEN 1 ELSE rate_limit.count + 1 END,
        window_start = CASE
          WHEN now() - rate_limit.window_start > ${jendela}
          THEN now() ELSE rate_limit.window_start END
      RETURNING count
    `)
    const baris = hasil as unknown as Array<{ count: number | string }>
    hitungan = Number(baris[0]?.count ?? 0)
  } catch {
    // Gagal tertutup. Pembatas yang diam saat rusak lebih buruk daripada tidak
    // ada sama sekali, karena ia memberi rasa aman palsu.
    throw new Error(TERLALU_SERING)
  }

  if (hitungan > maks) throw new Error(TERLALU_SERING)
}
