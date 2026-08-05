export type FilterVisibilitas = "semua" | "publik" | "privat"

export type SortKampanye =
  | "terbaru"
  | "terakhir-diubah"
  | "nama"
  | "sering-dipakai"
  | "banyak-dilihat"

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
  { value: "terakhir-diubah", label: "Terakhir diubah" },
  { value: "nama", label: "Nama" },
  { value: "sering-dipakai", label: "Paling sering dipakai" },
  { value: "banyak-dilihat", label: "Paling banyak dilihat" },
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
    "terakhir-diubah": (a, b) => b.updatedAt.localeCompare(a.updatedAt),
    nama: (a, b) => a.name.localeCompare(b.name, "id"),
    "sering-dipakai": (a, b) => b.useCount - a.useCount,
    "banyak-dilihat": (a, b) => b.viewCount - a.viewCount,
  }

  return hasil.sort(pembanding[sort])
}
