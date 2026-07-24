import { describe, expect, test } from "bun:test"
import { generateRecoveryCode, hashRecoveryCode, verifyRecoveryCode } from "@/lib/recovery-code"

describe("generateRecoveryCode", () => {
  test("menghasilkan 4 grup 8 heksadesimal huruf besar", () => {
    expect(generateRecoveryCode()).toMatch(/^[0-9A-F]{8}-[0-9A-F]{8}-[0-9A-F]{8}-[0-9A-F]{8}$/)
  })

  test("menghasilkan kode berbeda tiap panggilan", () => {
    const codes = new Set(Array.from({ length: 50 }, generateRecoveryCode))
    expect(codes.size).toBe(50)
  })
})

describe("hashRecoveryCode", () => {
  test("kode aslinya tidak muncul di mana pun dalam hash", async () => {
    // Bukan sekadar `not.toBe(code)` — itu masih lolos kalau implementasinya
    // menyisipkan kode apa adanya, misal `${salt}:${code}`.
    const code = generateRecoveryCode()
    const hash = await hashRecoveryCode(code)
    expect(hash).not.toContain(code)
    expect(hash).not.toContain(code.replace(/-/g, ""))
  })

  test("dua hash dari kode sama tetap berbeda karena salt", async () => {
    const code = generateRecoveryCode()
    expect(await hashRecoveryCode(code)).not.toBe(await hashRecoveryCode(code))
  })
})

describe("verifyRecoveryCode", () => {
  test("menerima kode yang benar", async () => {
    const code = generateRecoveryCode()
    expect(await verifyRecoveryCode(code, await hashRecoveryCode(code))).toBe(true)
  })

  test("menolak kode yang salah", async () => {
    const hash = await hashRecoveryCode(generateRecoveryCode())
    expect(await verifyRecoveryCode(generateRecoveryCode(), hash)).toBe(false)
  })

  test("mengabaikan spasi yang tidak sengaja tersalin", async () => {
    const code = generateRecoveryCode()
    const hash = await hashRecoveryCode(code)
    expect(await verifyRecoveryCode(`  ${code} `, hash)).toBe(true)
  })

  test("mengabaikan besar-kecil huruf", async () => {
    const code = generateRecoveryCode()
    const hash = await hashRecoveryCode(code)
    expect(await verifyRecoveryCode(code.toLowerCase(), hash)).toBe(true)
  })

  // Bentuk-bentuk nilai tersimpan yang rusak. Yang penting bukan cuma
  // "kembalikan false", tapi "jangan melempar" — verifyRecoveryCode dipanggil
  // di jalur reset password, dan exception di sana mengunci pengguna keluar
  // dari satu-satunya cara pulih yang ia punya.
  test.each([
    ["tanpa titik dua", "bukan-hash"],
    ["titik dua tapi hex tidak valid", "zzzz:zzzz"],
    ["hex valid tapi terlalu pendek", "aabb:ccdd"],
    ["salt kosong", ":abcdef"],
    ["bagian hash kosong", "abcdef:"],
    ["string kosong", ""],
  ])("mengembalikan false untuk nilai tersimpan %s", async (_label, stored) => {
    expect(await verifyRecoveryCode(generateRecoveryCode(), stored)).toBe(false)
  })

  test("mengembalikan false, bukan melempar, saat nilai tersimpan bukan string", async () => {
    // Bisa terjadi kalau kolomnya NULL di database.
    const nilaiTakTerduga = null as unknown as string
    expect(await verifyRecoveryCode(generateRecoveryCode(), nilaiTakTerduga)).toBe(false)
  })
})
