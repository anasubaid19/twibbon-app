import { randomBytes } from 'node:crypto'
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { dirname, resolve, sep } from 'node:path'
import sharp, { type Metadata } from 'sharp'

/** PRD US-02. Diperiksa sebelum Sharp supaya berkas raksasa tidak sempat di-parse. */
export const MAX_FRAME_BYTES = 10 * 1024 * 1024
/** Di bawah ini area 20px sudah lebih dari seperlima frame — tidak bisa dipakai. */
const MIN_FRAME_PX = 200
/** Batas atas supaya satu unggahan tidak menghabiskan memori proses. */
const MAX_FRAME_PX = 6000

/**
 * Berkas disimpan di luar webroot dan hanya bisa dijangkau lewat route
 * `/api/frame/$id`, sehingga direktori ini tidak pernah bisa dijelajahi.
 */
const UPLOAD_ROOT = resolve(process.env.UPLOAD_DIR ?? 'uploads')

const DITOLAK = 'Frame harus berkas PNG yang valid'

export async function validateFrame(bytes: Buffer): Promise<{ width: number; height: number }> {
  if (bytes.byteLength > MAX_FRAME_BYTES) throw new Error('Ukuran frame maksimal 10MB')

  let metadata: Metadata
  try {
    metadata = await sharp(bytes).metadata()
  } catch {
    // Spec 9.2: aplikasi lama hanya memeriksa `file.mimetype`, yang dikirim
    // klien dan bisa diisi apa saja. Di sini Sharp yang mem-parse berkasnya,
    // jadi klaim klien tidak berpengaruh sama sekali.
    throw new Error(DITOLAK)
  }

  if (metadata.format !== 'png') throw new Error(DITOLAK)

  const { width, height } = metadata
  if (!width || !height) throw new Error(DITOLAK)
  if (width < MIN_FRAME_PX || height < MIN_FRAME_PX) {
    throw new Error(`Frame minimal ${MIN_FRAME_PX}x${MIN_FRAME_PX} piksel`)
  }
  if (width > MAX_FRAME_PX || height > MAX_FRAME_PX) {
    throw new Error(`Frame maksimal ${MAX_FRAME_PX}x${MAX_FRAME_PX} piksel`)
  }

  return { width, height }
}

/**
 * Menerjemahkan jalur relatif dari database menjadi jalur absolut, sambil
 * memastikan hasilnya tetap di dalam direktori upload. Jalurnya memang berasal
 * dari database, bukan dari URL — tapi satu baris rusak di sana tidak boleh
 * berarti berkas apa pun di disk bisa disajikan.
 */
export function frameAbsolutePath(relativePath: string): string {
  const absolute = resolve(UPLOAD_ROOT, relativePath)
  if (!absolute.startsWith(`${UPLOAD_ROOT}${sep}`)) throw new Error('Jalur berkas tidak sah')
  return absolute
}

/**
 * Nama berkas diacak, bukan tetap `original.png`. Saat frame diganti (Fase 7)
 * jalurnya ikut berubah, sehingga ETag di route penyaji berubah dan browser
 * tidak menyajikan gambar lama dari cache.
 */
export async function saveFrame(campaignId: string, bytes: Buffer): Promise<string> {
  const relativePath = `frames/${campaignId}/${randomBytes(4).toString('hex')}.png`
  const absolute = frameAbsolutePath(relativePath)
  await mkdir(dirname(absolute), { recursive: true })
  // Ditulis apa adanya, tanpa re-encode: itulah yang menjaga alpha channel
  // frame tetap utuh (PRD US-02).
  await writeFile(absolute, bytes)
  return relativePath
}

/**
 * Mengembalikan `Uint8Array`, bukan `Buffer`, karena itulah yang diterima
 * `BodyInit` milik Response.
 *
 * Parameter generiknya harus `ArrayBuffer`, bukan `ArrayBufferLike` bawaan
 * `Buffer.buffer`: `ArrayBufferLike` juga mencakup `SharedArrayBuffer`, yang
 * tidak diterima `BodyInit`. Maka isinya disalin ke buffer milik sendiri.
 */
export async function readFrame(relativePath: string): Promise<Uint8Array<ArrayBuffer>> {
  return new Uint8Array(await readFile(frameAbsolutePath(relativePath)))
}

/** Dipakai sebagai kompensasi saat penyimpanan database gagal, dan saat hapus campaign. */
export async function deleteFrameDir(campaignId: string): Promise<void> {
  await rm(frameAbsolutePath(`frames/${campaignId}`), { recursive: true, force: true })
}
