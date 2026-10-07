/**
 * Slug selalu ada dan tidak pernah null (spec 5.4). Aplikasi lama
 * membolehkan slug kosong lalu jatuh ke id numerik, sehingga satu campaign
 * punya dua URL yang sah dan dua cabang kode di setiap tempat yang
 * menyelesaikannya.
 */
export const SLUG_PATTERN = /^[a-z0-9-]{3,60}$/

const MAX_LENGTH = 60
const MIN_LENGTH = 3
/** Dipakai saat nama tidak menyisakan huruf atau angka sama sekali. */
const CADANGAN = "kampanye"
/** Ambang penyerah: setelah sekian percobaan, pakai sufiks acak. */
const MAX_ATTEMPTS = 1000

function trimHyphens(value: string): string {
  return value.replace(/^-+|-+$/g, "")
}

export function slugify(name: string): string {
  const base = trimHyphens(
    name
      // Pisahkan huruf beraksen dari tanda diakritiknya, lalu buang tandanya:
      // "Café" → "Cafe" alih-alih "Caf". Rentangnya ditulis dengan escape
      // \u karena tanda diakritik itu sendiri tidak terlihat di editor teks.
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-"),
  ).slice(0, MAX_LENGTH)

  const rapi = trimHyphens(base)
  return rapi.length >= MIN_LENGTH ? rapi : CADANGAN
}

/** Menambahkan sufiks angka sampai slug-nya bebas: `hut-ri-80`, `hut-ri-80-2`, … */
export function resolveSlug(base: string, taken: readonly string[]): string {
  const terpakai = new Set(taken)
  if (!terpakai.has(base)) return base

  for (let n = 2; n < MAX_ATTEMPTS; n++) {
    const kandidat = withSuffix(base, `-${n}`)
    if (!terpakai.has(kandidat)) return kandidat
  }

  // Praktis tidak tercapai. Lebih baik slug jelek daripada perulangan tanpa henti.
  return withSuffix(base, `-${Date.now().toString(36)}`)
}

function withSuffix(base: string, suffix: string): string {
  return `${trimHyphens(base.slice(0, MAX_LENGTH - suffix.length))}${suffix}`
}

const MAKS_NAMA_BERKAS = 80

/**
 * Nama berkas unduhan mengikuti judul kampanye apa adanya — huruf besar dan
 * spasi dipertahankan supaya terbaca ("FIELD TRIP 1 SMP & SMA AW1-1x.png").
 * Hanya karakter yang ilegal sebagai nama berkas (Windows/macOS/Linux) yang
 * dibuang. Jatuh ke `cadangan` (slug) kalau judul tidak menyisakan apa-apa.
 */
export function namaBerkasUnduhan(judul: string, cadangan: string, skala: number): string {
  // Karakter kontrol tidak bisa ditulis sebagai rentang regex (aturan
  // biome), jadi disaring lewat kode karakternya.
  const tanpaKontrol = [...judul]
    .filter((ch) => {
      const kode = ch.codePointAt(0) ?? 32
      return kode >= 32 && kode !== 127
    })
    .join("")
  const bersih = tanpaKontrol
    .replace(/[\\/:*?"<>|]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[. ]+$/g, "")
    .slice(0, MAKS_NAMA_BERKAS)
  return `${bersih || cadangan}-${skala}x.png`
}
