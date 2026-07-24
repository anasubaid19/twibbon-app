import { describe, expect, test } from "bun:test"
import { resolveSlug, SLUG_PATTERN, slugify } from "@/lib/slug"

describe("slugify", () => {
  test.each([
    ["HUT RI 80", "hut-ri-80"],
    ["Kampanye   Keren!!", "kampanye-keren"],
    ["  Spasi Di Tepi  ", "spasi-di-tepi"],
    ["Café Ñoño", "cafe-nono"],
    ["Sudah-Berbentuk-Slug", "sudah-berbentuk-slug"],
  ])("mengubah %p menjadi %p", (masuk, keluar) => {
    expect(slugify(masuk)).toBe(keluar)
  })

  test.each([
    ["string kosong", ""],
    ["hanya tanda baca", "!!!"],
    ["terlalu pendek", "ab"],
    ["hanya emoji", "🎉🎉"],
  ])("jatuh ke kata cadangan untuk %s", (_label, masuk) => {
    expect(slugify(masuk)).toBe("kampanye")
  })

  test("memotong nama panjang di 60 karakter tanpa menyisakan tanda hubung di ujung", () => {
    const hasil = slugify(`${"a".repeat(58)} bagian kedua yang panjang sekali`)
    expect(hasil.length).toBeLessThanOrEqual(60)
    expect(hasil.endsWith("-")).toBe(false)
  })

  test("hasilnya selalu memenuhi SLUG_PATTERN", () => {
    const contoh = ["HUT RI 80", "", "!!!", "Café Ñoño", "x".repeat(200), "  ", "99"]
    for (const nama of contoh) {
      expect(slugify(nama)).toMatch(SLUG_PATTERN)
    }
  })
})

describe("resolveSlug", () => {
  test("memakai slug apa adanya kalau belum terpakai", () => {
    expect(resolveSlug("hut-ri-80", [])).toBe("hut-ri-80")
  })

  test("menambah sufiks -2 saat bentrok", () => {
    expect(resolveSlug("hut-ri-80", ["hut-ri-80"])).toBe("hut-ri-80-2")
  })

  test("melompat ke -3 saat -2 juga terpakai", () => {
    expect(resolveSlug("hut-ri-80", ["hut-ri-80", "hut-ri-80-2"])).toBe("hut-ri-80-3")
  })

  test("tidak terganggu slug lain yang kebetulan berawalan sama", () => {
    expect(resolveSlug("hut-ri", ["hut-ri-80", "hut-ri-81"])).toBe("hut-ri")
  })

  test("tetap di bawah 60 karakter saat base sudah sepanjang batas", () => {
    const base = "a".repeat(60)
    const hasil = resolveSlug(base, [base])
    expect(hasil.length).toBeLessThanOrEqual(60)
    expect(hasil).toMatch(SLUG_PATTERN)
  })
})
