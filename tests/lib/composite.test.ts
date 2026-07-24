import { describe, expect, test } from "bun:test"
import { coverScale, drawRect, IDENTITAS, panBounds, rubberBand, slotAt } from "@/lib/composite"

const SLOT = { x: 100, y: 50, width: 200, height: 200 }

describe("coverScale", () => {
  test("foto lanskap diperbesar sampai tingginya menutup slot", () => {
    expect(coverScale({ width: 400, height: 200 }, { width: 200, height: 200 })).toBe(1)
  })

  test("foto potret diperbesar sampai lebarnya menutup slot", () => {
    expect(coverScale({ width: 200, height: 400 }, { width: 200, height: 200 })).toBe(1)
  })

  test("foto kecil diperbesar, bukan dibiarkan menyisakan celah", () => {
    expect(coverScale({ width: 100, height: 100 }, { width: 200, height: 200 })).toBe(2)
  })
})

describe("drawRect", () => {
  test("tanpa transform, foto persegi memenuhi slot persegi tepat", () => {
    expect(drawRect({ width: 200, height: 200 }, SLOT, IDENTITAS)).toEqual({
      x: 100,
      y: 50,
      width: 200,
      height: 200,
    })
  })

  test("foto lanskap meluber setara di kiri dan kanan", () => {
    expect(drawRect({ width: 400, height: 200 }, SLOT, IDENTITAS)).toEqual({
      x: 0,
      y: 50,
      width: 400,
      height: 200,
    })
  })

  test("offset dihitung sebagai pecahan dari ukuran slot", () => {
    const digeser = drawRect({ width: 400, height: 200 }, SLOT, { ...IDENTITAS, offsetX: 0.25 })
    expect(digeser.x).toBe(50)
  })

  test("zoom memperbesar dari titik tengah slot, bukan dari pojok", () => {
    const dizoom = drawRect({ width: 200, height: 200 }, SLOT, { ...IDENTITAS, scale: 2 })
    expect(dizoom.width).toBe(400)
    expect(dizoom.x + dizoom.width / 2).toBe(SLOT.x + SLOT.width / 2)
    expect(dizoom.y + dizoom.height / 2).toBe(SLOT.y + SLOT.height / 2)
  })

  test("hasilnya sebangun di skala keluaran mana pun", () => {
    // Inti P3: transform yang sama harus menghasilkan tata letak sebangun
    // pada 1x, 2x, dan 3x.
    const t = { scale: 1.4, offsetX: 0.1, offsetY: -0.2 }
    const img = { width: 640, height: 480 }
    const satuX = drawRect(img, SLOT, t)
    for (const s of [2, 3]) {
      const besar = drawRect(
        img,
        { x: SLOT.x * s, y: SLOT.y * s, width: SLOT.width * s, height: SLOT.height * s },
        t,
      )
      expect(besar.x).toBeCloseTo(satuX.x * s, 6)
      expect(besar.width).toBeCloseTo(satuX.width * s, 6)
    }
  })
})

describe("panBounds", () => {
  test("foto yang pas menutup slot tidak boleh digeser sama sekali", () => {
    expect(panBounds({ width: 200, height: 200 }, { width: 200, height: 200 }, 1)).toEqual({
      x: 0,
      y: 0,
    })
  })

  test("luberan dibagi dua sisi, dinyatakan sebagai pecahan slot", () => {
    expect(panBounds({ width: 400, height: 200 }, { width: 200, height: 200 }, 1).x).toBe(0.5)
  })

  test("zoom memperbesar ruang gerak", () => {
    const b = panBounds({ width: 200, height: 200 }, { width: 200, height: 200 }, 2)
    expect(b.x).toBe(0.5)
    expect(b.y).toBe(0.5)
  })
})

describe("rubberBand", () => {
  test("di dalam batas, nilainya lewat apa adanya", () => {
    expect(rubberBand(0.3, 0.5)).toBe(0.3)
    expect(rubberBand(-0.5, 0.5)).toBe(-0.5)
  })

  test("melewati batas, kelebihannya ditahan tapi tetap bergerak", () => {
    const ditahan = rubberBand(1, 0.5)
    expect(ditahan).toBeGreaterThan(0.5)
    expect(ditahan).toBeLessThan(1)
  })

  test("makin jauh ditarik, makin berat — tidak pernah linear", () => {
    const a = rubberBand(0.6, 0.5) - rubberBand(0.5, 0.5)
    const b = rubberBand(1.6, 0.5) - rubberBand(1.5, 0.5)
    expect(b).toBeLessThan(a)
  })

  test("simetris untuk arah negatif", () => {
    expect(rubberBand(-1, 0.5)).toBe(-rubberBand(1, 0.5))
  })

  test("batas nol tetap memberi perlawanan, bukan mengunci mati", () => {
    expect(rubberBand(0.4, 0)).toBeGreaterThan(0)
    expect(rubberBand(0.4, 0)).toBeLessThan(0.4)
  })
})

describe("slotAt", () => {
  const KANVAS = { width: 1000, height: 500 }
  const SLOTS = [
    { x: 10, y: 10, width: 30, height: 30 },
    { x: 60, y: 60, width: 30, height: 30 },
  ]

  test("menemukan slot di bawah titik", () => {
    // 20% dari 1000 = 200px, di dalam slot pertama (100..400px).
    expect(slotAt(SLOTS, { x: 200, y: 100 }, KANVAS)).toBe(0)
    expect(slotAt(SLOTS, { x: 700, y: 400 }, KANVAS)).toBe(1)
  })

  test("mengembalikan -1 saat titiknya di luar semua slot", () => {
    expect(slotAt(SLOTS, { x: 500, y: 250 }, KANVAS)).toBe(-1)
  })

  test("slot yang digambar belakangan menang saat bertumpuk", () => {
    // Nomor slot lebih besar digambar paling akhir, jadi ia yang tampak atas.
    const tumpuk = [
      { x: 10, y: 10, width: 80, height: 80 },
      { x: 20, y: 20, width: 20, height: 20 },
    ]
    expect(slotAt(tumpuk, { x: 250, y: 125 }, KANVAS)).toBe(1)
  })

  test("daftar kosong tidak melempar", () => {
    expect(slotAt([], { x: 10, y: 10 }, KANVAS)).toBe(-1)
  })
})
