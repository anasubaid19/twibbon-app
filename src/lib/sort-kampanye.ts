export type FilterVisibilitas = "semua" | "publik" | "privat"

export type SortKampanye = "terbaru" | "terlama" | "nama" | "nama-z"

export type KampanyeRingkas = {
  id: string
  name: string
  slug: string
  isPublic: boolean
  useCount: number
  viewCount: number
  shareCount: number
  slotCount: number
  createdAt: string
  updatedAt: string
}

export const SORT_OPTIONS: ReadonlyArray<{ value: SortKampanye; label: string }> = [
  { value: "terbaru", label: "Terbaru" },
  { value: "terlama", label: "Terlama" },
  { value: "nama", label: "Nama A-Z" },
  { value: "nama-z", label: "Nama Z-A" },
]

/** Filter (nama + visibilitas) lalu urut, tanpa mengubah array asal. */
export function filterDanSortKampanye(
  rows: readonly KampanyeRingkas[],
  cari: string,
  filter: FilterVisibilitas,
  sort: SortKampanye,
): KampanyeRingkas[] {
  const kata = cari.trim().toLowerCase()

  const hasil = rows.filter((row) => {
    if (filter === "publik" && !row.isPublic) return false
    if (filter === "privat" && row.isPublic) return false
    if (kata && !row.name.toLowerCase().includes(kata)) return false
    return true
  })

  // Comparator dibalik (b vs a) untuk urutan menurun.
  const pembanding: Record<SortKampanye, (a: KampanyeRingkas, b: KampanyeRingkas) => number> = {
    terbaru: (a, b) => b.createdAt.localeCompare(a.createdAt),
    terlama: (a, b) => a.createdAt.localeCompare(b.createdAt),
    nama: (a, b) => a.name.localeCompare(b.name, "id"),
    // Kebalikan dari `nama`, bukan `localeCompare` dibalik, karena hasilnya
    // memang tidak simetris untuk aksen/lokale.
    "nama-z": (a, b) => b.name.localeCompare(a.name, "id"),
  }

  return hasil.sort(pembanding[sort])
}
