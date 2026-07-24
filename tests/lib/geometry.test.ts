import { describe, expect, test } from "bun:test"
import {
  applyDrag,
  clampToFrame,
  deltaToPercent,
  isValidSlot,
  MIN_SLOT_PX,
  toPercent,
  toPixels,
} from "@/lib/geometry"

const FRAME = { width: 1000, height: 500 }

describe("toPixels", () => {
  test("menerjemahkan persen ke piksel frame", () => {
    expect(toPixels({ x: 10, y: 20, width: 50, height: 40 }, FRAME)).toEqual({
      x: 100,
      y: 100,
      width: 500,
      height: 200,
    })
  })

  test("kotak penuh 0-100 persen menutupi seluruh frame", () => {
    expect(toPixels({ x: 0, y: 0, width: 100, height: 100 }, FRAME)).toEqual({
      x: 0,
      y: 0,
      width: 1000,
      height: 500,
    })
  })
})

describe("toPercent", () => {
  test("kebalikan dari toPixels", () => {
    expect(toPercent({ x: 100, y: 100, width: 500, height: 200 }, FRAME)).toEqual({
      x: 10,
      y: 20,
      width: 50,
      height: 40,
    })
  })

  test("roundtrip persen → piksel → persen tidak menggeser nilai", () => {
    const asal = { x: 12.5, y: 33.25, width: 44.75, height: 8.5 }
    const kembali = toPercent(toPixels(asal, FRAME), FRAME)
    expect(kembali.x).toBeCloseTo(asal.x, 10)
    expect(kembali.y).toBeCloseTo(asal.y, 10)
    expect(kembali.width).toBeCloseTo(asal.width, 10)
    expect(kembali.height).toBeCloseTo(asal.height, 10)
  })

  test("roundtrip tetap sama pada frame 1x, 2x, dan 3x", () => {
    // Inti dari koordinat persen: slot yang sama harus berlaku di skala mana pun.
    const asal = { x: 12.5, y: 33.25, width: 44.75, height: 8.5 }
    for (const skala of [1, 2, 3]) {
      const frame = { width: 1000 * skala, height: 500 * skala }
      expect(toPercent(toPixels(asal, frame), frame).x).toBeCloseTo(asal.x, 10)
    }
  })

  test("mengembalikan nol saat frame belum punya ukuran, bukan Infinity", () => {
    // Terjadi nyata: ResizeObserver melaporkan 0x0 sebelum gambar termuat.
    // Tanpa penjagaan ini, pembagian menghasilkan Infinity yang menular ke
    // seluruh state editor dan tidak pernah pulih sendiri.
    expect(toPercent({ x: 10, y: 10, width: 10, height: 10 }, { width: 0, height: 0 })).toEqual({
      x: 0,
      y: 0,
      width: 0,
      height: 0,
    })
  })
})

describe("deltaToPercent", () => {
  test("menerjemahkan pergeseran pointer jadi pergeseran persen", () => {
    expect(deltaToPercent(100, 50, FRAME)).toEqual({ dx: 10, dy: 10 })
  })

  test("mengembalikan nol saat frame belum punya ukuran", () => {
    expect(deltaToPercent(100, 50, { width: 0, height: 0 })).toEqual({ dx: 0, dy: 0 })
  })
})

describe("clampToFrame", () => {
  test("membiarkan kotak yang sudah di dalam frame", () => {
    const rect = { x: 10, y: 10, width: 30, height: 30 }
    expect(clampToFrame(rect)).toEqual(rect)
  })

  test("menggeser masuk tanpa mengubah ukuran saat menembus tepi kanan", () => {
    expect(clampToFrame({ x: 90, y: 10, width: 30, height: 30 })).toEqual({
      x: 70,
      y: 10,
      width: 30,
      height: 30,
    })
  })

  test("menggeser masuk saat koordinat negatif", () => {
    expect(clampToFrame({ x: -15, y: -5, width: 30, height: 30 })).toEqual({
      x: 0,
      y: 0,
      width: 30,
      height: 30,
    })
  })

  test("kotak baru yang dipusatkan di pojok tetap masuk frame", () => {
    // Rectangle tool memusatkan kotak 20x20% di titik klik. Klik di pojok
    // berarti separuh kotaknya keluar frame sebelum di-clamp.
    const UKURAN = 20
    expect(
      clampToFrame({ x: 0 - UKURAN / 2, y: 0 - UKURAN / 2, width: UKURAN, height: UKURAN }),
    ).toEqual({ x: 0, y: 0, width: 20, height: 20 })
    expect(
      clampToFrame({ x: 100 - UKURAN / 2, y: 100 - UKURAN / 2, width: UKURAN, height: UKURAN }),
    ).toEqual({ x: 80, y: 80, width: 20, height: 20 })
  })

  test("mengecilkan kotak yang lebih besar dari frame", () => {
    expect(clampToFrame({ x: -10, y: -10, width: 150, height: 150 })).toEqual({
      x: 0,
      y: 0,
      width: 100,
      height: 100,
    })
  })
})

describe("applyDrag", () => {
  const rect = { x: 20, y: 20, width: 40, height: 40 }

  test("mode move menggeser tanpa mengubah ukuran", () => {
    expect(applyDrag(rect, "move", 10, -5)).toEqual({ x: 30, y: 15, width: 40, height: 40 })
  })

  test("mode move berhenti di tepi, tidak mengecil", () => {
    expect(applyDrag(rect, "move", 90, 0)).toEqual({ x: 60, y: 20, width: 40, height: 40 })
  })

  test("pegangan timur hanya menggerakkan sisi kanan", () => {
    expect(applyDrag(rect, "e", 10, 999)).toEqual({ x: 20, y: 20, width: 50, height: 40 })
  })

  test("pegangan barat menggerakkan sisi kiri dan menyesuaikan lebar", () => {
    expect(applyDrag(rect, "w", 10, 0)).toEqual({ x: 30, y: 20, width: 30, height: 40 })
  })

  test("pegangan sudut menggerakkan dua sisi sekaligus", () => {
    expect(applyDrag(rect, "se", 10, 10)).toEqual({ x: 20, y: 20, width: 50, height: 50 })
  })

  test("resize berhenti di tepi frame tanpa menyeret sisi seberangnya", () => {
    // Bug yang gampang lolos: kalau resize memakai clamp gaya "geser masuk",
    // sisi kiri ikut bergeser padahal pengguna cuma menarik sisi kanan.
    const hasil = applyDrag(rect, "e", 999, 0)
    expect(hasil).toEqual({ x: 20, y: 20, width: 80, height: 40 })
  })

  test("menarik sisi melewati sisi seberang membalik kotak, bukan bikin lebar negatif", () => {
    // Kotaknya selebar 40% dan pointer ditarik 50% ke kiri, jadi ia melewati
    // sisi kiri sejauh 10%: kotaknya membalik dan kini membentang 10%–20%.
    const hasil = applyDrag(rect, "e", -50, 0)
    expect(hasil.width).toBeGreaterThanOrEqual(0)
    expect(hasil).toEqual({ x: 10, y: 20, width: 10, height: 40 })
  })
})

describe("isValidSlot", () => {
  test("menerima slot yang cukup besar dan di dalam frame", () => {
    expect(isValidSlot({ x: 10, y: 10, width: 30, height: 30 }, FRAME)).toBe(true)
  })

  test(`menolak slot yang sisinya di bawah ${MIN_SLOT_PX} piksel asli`, () => {
    // 1% dari tinggi 500px = 5px — di layar terlihat wajar, di berkas asli tidak.
    expect(isValidSlot({ x: 10, y: 10, width: 30, height: 1 }, FRAME)).toBe(false)
  })

  test("menerima slot yang sisinya tepat 20 piksel asli", () => {
    expect(isValidSlot({ x: 0, y: 0, width: 2, height: 4 }, FRAME)).toBe(true)
  })

  test("menolak slot yang keluar dari frame", () => {
    expect(isValidSlot({ x: 80, y: 10, width: 30, height: 30 }, FRAME)).toBe(false)
    expect(isValidSlot({ x: -1, y: 10, width: 30, height: 30 }, FRAME)).toBe(false)
  })

  test("memaafkan kelebihan sepersekian akibat pembulatan float", () => {
    expect(isValidSlot({ x: 0, y: 0, width: 100.0000000001, height: 100 }, FRAME)).toBe(true)
  })

  test.each([
    ["NaN", { x: Number.NaN, y: 0, width: 30, height: 30 }],
    ["Infinity", { x: 0, y: 0, width: Number.POSITIVE_INFINITY, height: 30 }],
  ])("menolak koordinat %s", (_label, rect) => {
    expect(isValidSlot(rect, FRAME)).toBe(false)
  })
})
