import { describe, expect, test } from "bun:test"
import { coverScale, drawRect, IDENTITAS, panBounds, slotAt } from "@/lib/composite"

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

  test("rotasi 90° membuat lanskap lebih sulit menutup slot lanskap", () => {
    // Lanskap 400×200 di slot 400×200 pas menutup saat lurus (skala 1), tapi
    // setelah diputar 90° lebar/tinnginya bertukar jadi 200×400 sehingga harus
    // diperbesar sampai lebarnya menutup (skala 2).
    expect(coverScale({ width: 400, height: 200 }, { width: 400, height: 200 }, 0)).toBe(1)
    expect(coverScale({ width: 400, height: 200 }, { width: 400, height: 200 }, 90)).toBe(2)
    expect(coverScale({ width: 400, height: 200 }, { width: 400, height: 200 }, 270)).toBe(2)
  })

  test("rotasi 180° tidak mengubah dimensi efektif", () => {
    expect(coverScale({ width: 400, height: 200 }, { width: 400, height: 200 }, 180)).toBe(1)
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

  test("rotasi 90° memakai dimensi efektif (lebar/tinggi bertukar) dan tetap memusat di slot", () => {
    const diputar = drawRect({ width: 400, height: 200 }, SLOT, {
      ...IDENTITAS,
      rotate: 90,
      scale: 1,
    })
    // Skala penutup untuk lanskap dirotasi = 1, jadi gambar 200×400 (bertukar),
    // duduk di tengah slot persegi.
    expect(diputar.width).toBe(200)
    expect(diputar.height).toBe(400)
    expect(diputar.x + diputar.width / 2).toBe(SLOT.x + SLOT.width / 2)
    expect(diputar.y + diputar.height / 2).toBe(SLOT.y + SLOT.height / 2)
  })

  test("rotasi di bawah nilai default 0 menghasilkan kotak yang sama dengan tanpa rotasi", () => {
    expect(drawRect({ width: 400, height: 200 }, SLOT, IDENTITAS)).toEqual(
      drawRect({ width: 400, height: 200 }, SLOT, { ...IDENTITAS, rotate: 0 as const }),
    )
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

  test("rotasi 90° menghitung ruang gerak dengan dimensi efektif", () => {
    // Lanskap 400×200 dirotasi jadi 200×400: luberan vertikal 200 → 0.5 slot,
    // horizontal 0.
    const b = panBounds({ width: 400, height: 200 }, { width: 200, height: 200 }, 1, 90)
    expect(b.x).toBe(0)
    expect(b.y).toBe(0.5)
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

  test("slot yang dirotasi 90 derajat tetap diuji lewat ruang lokalnya", () => {
    // Persegi 10% (100px) diputar 90° di sekitar tengahnya (50%,50%).
    const miring = [{ x: 45, y: 45, width: 10, height: 10, rotation: 90 }]
    expect(slotAt(miring, { x: 500, y: 250 }, KANVAS)).toBe(0) // tengah
    expect(slotAt(miring, { x: 500, y: 260 }, KANVAS)).toBe(0) // dalam jari-jari
    expect(slotAt(miring, { x: 440, y: 250 }, KANVAS)).toBe(-1) // di luar
  })

  test("rotasi memotong pojok yang di dalam kotak axis-aligned", () => {
    // Kotak 20% (200px) diputar 45°: pojok kiri-bawah kotak axis-aligned ada
    // di luar area miring yang sebenarnya.
    const miring = [{ x: 40, y: 40, width: 20, height: 20, rotation: 45 }]
    // (450,350) — pojok kiri-bawah kotak 40..60% — berada di luar kotak miring.
    expect(slotAt(miring, { x: 450, y: 350 }, KANVAS)).toBe(-1)
    expect(slotAt(miring, { x: 500, y: 250 }, KANVAS)).toBe(0)
  })
})
