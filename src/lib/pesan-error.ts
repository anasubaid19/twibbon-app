/** Padanan Indonesia untuk pesan yang datang dari pustaka pihak ketiga. */
const PADANAN: ReadonlyArray<readonly [RegExp, string]> = [
  [/already taken|already exists/i, 'Username ini sudah dipakai. Coba yang lain.'],
  [
    /failed to fetch|networkerror|load failed/i,
    'Gagal terhubung ke server. Cek koneksi kamu, lalu coba lagi.',
  ],
  [/invalid username or password/i, 'Username atau password salah.'],
  [/password too short|minPasswordLength/i, 'Password minimal 6 karakter.'],
]

const UMUM = 'Terjadi kesalahan. Coba lagi sebentar lagi.'

/**
 * Zod yang dilempar dari server function tiba sebagai JSON array of issues
 * di dalam `message`. Ambil kalimat pertamanya — pesan Zod di proyek ini
 * memang sudah ditulis dalam Bahasa Indonesia.
 */
function pesanZod(message: string): string | null {
  try {
    const parsed: unknown = JSON.parse(message)
    if (!Array.isArray(parsed)) return null
    const pertama = parsed[0]
    if (pertama && typeof pertama === 'object' && 'message' in pertama) {
      const m = (pertama as { message: unknown }).message
      if (typeof m === 'string' && m.length > 0) return m
    }
    return null
  } catch {
    return null
  }
}

export function pesanError(err: unknown): string {
  if (!(err instanceof Error) || !err.message) return UMUM

  const dariZod = pesanZod(err.message)
  if (dariZod) return dariZod

  for (const [pola, padanan] of PADANAN) {
    if (pola.test(err.message)) return padanan
  }

  // Jangan tampilkan pesan asing apa adanya — pengguna tidak bisa berbuat
  // apa-apa dengan "TypeError: undefined is not a function".
  return UMUM
}
