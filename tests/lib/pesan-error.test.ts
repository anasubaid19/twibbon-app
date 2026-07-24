import { describe, expect, test } from "bun:test"
import { pesanError } from "@/lib/pesan-error"

describe("pesanError", () => {
  test("mengambil kalimat pertama dari ZodError yang ter-serialisasi", () => {
    const zod = new Error(
      JSON.stringify([{ code: "too_small", message: "Username minimal 3 karakter" }]),
    )
    expect(pesanError(zod)).toBe("Username minimal 3 karakter")
  })

  test.each([
    [
      "Username is already taken. Please try another.",
      "Username ini sudah dipakai. Coba yang lain.",
    ],
    ["Failed to fetch", "Gagal terhubung ke server. Cek koneksi kamu, lalu coba lagi."],
    ["Invalid username or password", "Username atau password salah."],
  ])("menerjemahkan %p", (masuk, keluar) => {
    expect(pesanError(new Error(masuk))).toBe(keluar)
  })

  test("tidak pernah membocorkan pesan asing yang tidak dikenal", () => {
    expect(pesanError(new Error("TypeError: undefined is not a function"))).toBe(
      "Terjadi kesalahan. Coba lagi sebentar lagi.",
    )
  })

  test("menangani nilai yang bukan Error", () => {
    expect(pesanError("cuma string")).toBe("Terjadi kesalahan. Coba lagi sebentar lagi.")
    expect(pesanError(null)).toBe("Terjadi kesalahan. Coba lagi sebentar lagi.")
  })

  test("hasilnya tidak pernah kosong", () => {
    for (const kasus of [new Error(""), new Error("  "), undefined, 42]) {
      expect(pesanError(kasus).length).toBeGreaterThan(0)
    }
  })
})
