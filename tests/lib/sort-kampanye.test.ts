import { describe, expect, test } from "bun:test"
import { filterDanSortKampanye, type KampanyeRingkas, type SortKampanye } from "@/lib/sort-kampanye"

function kampanye(overrides: Partial<KampanyeRingkas>): KampanyeRingkas {
  return {
    id: "id",
    name: "Kampanye",
    slug: "kampanye",
    isPublic: true,
    useCount: 0,
    viewCount: 0,
    shareCount: 0,
    slotCount: 1,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  }
}

const data = [
  kampanye({
    id: "a",
    name: "HUT RI",
    useCount: 5,
    viewCount: 20,
    createdAt: "2026-01-03T00:00:00.000Z",
    updatedAt: "2026-01-03T00:00:00.000Z",
  }),
  kampanye({
    id: "b",
    name: "Festival Kopi",
    isPublic: false,
    useCount: 2,
    viewCount: 40,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-05T00:00:00.000Z",
  }),
  kampanye({
    id: "c",
    name: "HUT Kota",
    useCount: 9,
    viewCount: 10,
    createdAt: "2026-01-02T00:00:00.000Z",
    updatedAt: "2026-01-02T00:00:00.000Z",
  }),
]

function ambilId(rows: KampanyeRingkas[]): string[] {
  return rows.map((r) => r.id)
}

describe("filterDanSortKampanye", () => {
  test("mencari berdasarkan nama tanpa peka huruf", () => {
    expect(ambilId(filterDanSortKampanye(data, "hut", "semua", "terbaru"))).toEqual(["a", "c"])
  })

  test("memfilter visibilitas", () => {
    expect(ambilId(filterDanSortKampanye(data, "", "publik", "terbaru"))).toEqual(["a", "c"])
    expect(ambilId(filterDanSortKampanye(data, "", "privat", "terbaru"))).toEqual(["b"])
  })

  test("sorting terbaru pakai createdAt menurun", () => {
    expect(ambilId(filterDanSortKampanye(data, "", "semua", "terbaru"))).toEqual(["a", "c", "b"])
  })

  test("sorting terlama pakai createdAt menaik", () => {
    expect(ambilId(filterDanSortKampanye(data, "", "semua", "terlama"))).toEqual(["b", "c", "a"])
  })

  test("sorting nama A-Z", () => {
    expect(ambilId(filterDanSortKampanye(data, "", "semua", "nama"))).toEqual(["b", "c", "a"])
  })

  test("sorting nama Z-A", () => {
    expect(ambilId(filterDanSortKampanye(data, "", "semua", "nama-z"))).toEqual(["a", "c", "b"])
  })

  test("tidak mengubah array asal", () => {
    const salinan = [...data]
    filterDanSortKampanye(data, "", "semua", "terbaru")
    expect(data).toEqual(salinan)
  })

  test("kombinasi cari + filter + sort", () => {
    const semuaSort: SortKampanye[] = ["terbaru", "terlama", "nama", "nama-z"]
    for (const sort of semuaSort) {
      const nama = filterDanSortKampanye(data, "hut", "publik", sort).map((r) => r.name)
      expect(new Set(nama)).toEqual(new Set(["HUT RI", "HUT Kota"]))
    }
  })
})
