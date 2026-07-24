import { describe, expect, test } from "bun:test"
import { bersihkanKataKunci } from "@/server/campaigns"

describe("bersihkanKataKunci", () => {
  test("memangkas spasi di tepi", () => {
    expect(bersihkanKataKunci("  hut ri  ")).toBe("hut ri")
  })

  test("kata kunci kosong tetap kosong", () => {
    expect(bersihkanKataKunci("   ")).toBe("")
  })

  test("meloloskan % supaya tidak jadi wildcard", () => {
    // Tanpa ini, mencari "50%" mencocokkan SELURUH isi tabel.
    expect(bersihkanKataKunci("50%")).toBe("50\\%")
  })

  test("meloloskan _ supaya tidak mencocokkan sembarang satu huruf", () => {
    expect(bersihkanKataKunci("a_b")).toBe("a\\_b")
  })

  test("meloloskan backslash lebih dulu supaya tidak dobel", () => {
    expect(bersihkanKataKunci("a\\b")).toBe("a\\\\b")
  })

  test("memotong kata kunci yang kelewat panjang", () => {
    expect(bersihkanKataKunci("x".repeat(200)).length).toBe(80)
  })
})
