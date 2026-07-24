import { describe, expect, test } from "bun:test"
import sharp from "sharp"
import { MAX_FRAME_BYTES, validateFrame } from "@/server/upload"

function kanvas(width: number, height: number) {
  return sharp({
    create: { width, height, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  })
}

describe("validateFrame", () => {
  test("menerima PNG yang sah dan mengembalikan dimensinya", async () => {
    const png = await kanvas(800, 600).png().toBuffer()
    expect(await validateFrame(png)).toEqual({ width: 800, height: 600 })
  })

  test("menolak JPEG meskipun berkasnya sendiri sah", async () => {
    // Spec 9.2: yang menentukan adalah hasil parse Sharp, bukan mimetype kiriman.
    const jpeg = await kanvas(800, 600).jpeg().toBuffer()
    expect(validateFrame(jpeg)).rejects.toThrow(/PNG/)
  })

  test("menolak berkas yang bukan gambar sama sekali", async () => {
    expect(validateFrame(Buffer.from("ini bukan gambar"))).rejects.toThrow(/PNG/)
  })

  test("menolak berkas di atas 10MB sebelum menyentuh Sharp", async () => {
    const kegedean = Buffer.alloc(MAX_FRAME_BYTES + 1)
    expect(validateFrame(kegedean)).rejects.toThrow(/10MB/)
  })

  test("menolak frame yang terlalu kecil untuk digambari area", async () => {
    const png = await kanvas(120, 120).png().toBuffer()
    expect(validateFrame(png)).rejects.toThrow(/minimal/)
  })

  test("menolak frame yang dimensinya tidak masuk akal", async () => {
    // Tingginya sengaja tetap sah (>= 200): kalau kedua sisi melanggar,
    // pemeriksaan minimum yang jalan lebih dulu dan test ini lulus karena
    // alasan yang salah.
    const png = await kanvas(7000, 300).png().toBuffer()
    expect(validateFrame(png)).rejects.toThrow(/maksimal/)
  })

  test("pesan penolakan berbahasa Indonesia, bukan pesan mentah Sharp", async () => {
    try {
      await validateFrame(Buffer.from("bukan gambar"))
      throw new Error("seharusnya ditolak")
    } catch (error) {
      expect((error as Error).message).toBe("Frame harus berkas PNG yang valid")
    }
  })
})
