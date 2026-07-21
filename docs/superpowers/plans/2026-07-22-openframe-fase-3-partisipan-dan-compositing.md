# OpenFrame Fase 3: Halaman Partisipan dan Compositing — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Partisipan membuka `/twibbon/$slug`, mengunggah satu foto, menggesernya di dalam area yang digambar creator, lalu mengunduh hasilnya sebagai PNG beralpha pada 1×, 2×, atau 3×.

**Architecture:** Foto **tidak pernah menyentuh server** (P1) — ia hidup sebagai `HTMLImageElement` dari object URL. Preview dan unduhan dihasilkan fungsi yang sama, `renderComposite`, hanya berbeda `scale` (P3), sehingga preview yang berbeda dari hasil unduhan mustahil secara konstruksi. Offset simpan sebagai **pecahan dari ukuran slot**, bukan piksel, supaya nilai yang sama berlaku di skala mana pun.

**Tech Stack:** TanStack Start 1.168 · React 19 · Canvas 2D · **Motion 12** (`motion/react`) · Drizzle · Zod 4 · shadcn/ui + Base UI · Bun

**Dependensi baru:** `motion@^12.42.2`. Paketnya bernama `motion` sekarang, bukan `framer-motion` — keduanya versi sama, `framer-motion` tinggal alias lama. Dipasang di fase ini karena pan foto butuh spring yang bisa di-interrupt, kontinuitas velocity, dan rubber-banding (aturan 23–26); tidak satu pun bisa ditiru CSS transition.

**Spec:** `docs/superpowers/specs/2026-07-20-openframe-rewrite-design.md` bagian 6.2, 6.3
**Referensi kerja:** `legacy file/twibbon-app-main/frontend/src/pages/TwibbonPage.jsx` — pola `drawImage` cover dan unduhan `toDataURL` yang sudah terbukti, meski tanpa konsep slot sama sekali

---

## Global Constraints

- **Bahasa Indonesia** untuk UI, pesan error, dan komentar. Santai, "kamu". Brand: **OpenFrame**.
- **P1 — foto partisipan tidak pernah dikirim ke server.** Tidak ada `fetch` yang membawa berkas foto. Ukurannya divalidasi di klien karena memang tidak pernah menyeberang.
- **P2** — persen↔piksel hanya lewat `lib/geometry.ts`.
- **P3 — satu jalur compositing.** Preview dan unduhan memanggil `renderComposite` yang sama. Kalau ada cabang `if (untukUnduhan)` di dalamnya, desainnya salah.
- **P4 / ponytail.** Tandai penyederhanaan dengan `// ponytail:`.
- **Rubber-banding hanya di sini** (aturan 26). Area editor tetap hard-clamp.
- **Aturan 21–25:** umpan balik saat pointer-down, tracking 1:1 selama drag, spring bisa di-interrupt, velocity ikut saat gesture dilepas.
- **Aturan 30:** `prefers-reduced-motion` → langsung ke nilai akhir, tanpa spring.
- Komponen shadcn baru **hanya** kalau benar-benar dibutuhkan. Rencana: tidak ada. Kontrol zoom memakai `<input type="range">` bawaan seperti aplikasi lama.
- **Jangan ubah kode Fase 0–2 yang tidak disebut plan ini.**
- Biome, `bun run check` sebelum commit. **`bun run build` wajib sebelum menyatakan task selesai.**
- Commit Indonesia, conventional commits.

---

## Struktur Berkas

| Berkas | Tanggung jawab |
|---|---|
| `src/lib/composite.ts` | **Baru.** Matematika cover-fit, batas pan, dan `renderComposite` |
| `src/components/slot-filler/use-slot-transform.ts` | **Baru.** Motion value, pointer, rubber-band, spring settle |
| `src/components/slot-filler/slot-filler.tsx` | **Baru.** Kanvas preview + kontrol zoom + unduh |
| `src/routes/twibbon.$slug.tsx` | **Baru.** Halaman publik partisipan |
| `src/server/campaigns.ts` | **Ubah.** Tambah `incrementUse` |
| `tests/lib/composite.test.ts` | **Baru.** Matematika murni compositing |

`renderComposite` menyentuh canvas dan tidak bisa diuji di `bun test` (tidak ada DOM). Karena itu seluruh keputusan spasialnya ditarik ke fungsi murni yang **bisa** diuji; yang tersisa di `renderComposite` hanya urutan `drawImage`. Perilaku ujungnya diverifikasi di browser pada Task 7.

---

## Task 1: Matematika compositing (TDD)

**Files:**
- Create: `src/lib/composite.ts`
- Test: `tests/lib/composite.test.ts`

**Interfaces:**
- Consumes: `PixelRect` dari `@/lib/geometry`
- Produces:
  - `type Transform = { scale: number; offsetX: number; offsetY: number }` — `scale` ≥ 1, offset **pecahan dari ukuran slot**
  - `const IDENTITAS: Transform`
  - `coverScale(image: FrameSize, slot: FrameSize): number`
  - `drawRect(image: FrameSize, slot: PixelRect, t: Transform): PixelRect` — tempat foto digambar
  - `panBounds(image: FrameSize, slot: FrameSize, scale: number): { x: number; y: number }` — offset maksimum sebelum celah muncul
  - `rubberBand(offset: number, batas: number): number`

- [ ] **Step 1: Tulis test yang gagal**

`tests/lib/composite.test.ts`:

```ts
import { describe, expect, test } from 'bun:test'
import { coverScale, drawRect, IDENTITAS, panBounds, rubberBand } from '@/lib/composite'

const SLOT = { x: 100, y: 50, width: 200, height: 200 }

describe('coverScale', () => {
  test('foto lanskap diperbesar sampai tingginya menutup slot', () => {
    // 400x200 ke slot 200x200: skala tinggi 1.0 menang atas skala lebar 0.5.
    expect(coverScale({ width: 400, height: 200 }, { width: 200, height: 200 })).toBe(1)
  })

  test('foto potret diperbesar sampai lebarnya menutup slot', () => {
    expect(coverScale({ width: 200, height: 400 }, { width: 200, height: 200 })).toBe(1)
  })

  test('foto kecil diperbesar, bukan dibiarkan menyisakan celah', () => {
    expect(coverScale({ width: 100, height: 100 }, { width: 200, height: 200 })).toBe(2)
  })
})

describe('drawRect', () => {
  test('tanpa transform, foto persegi memenuhi slot persegi tepat', () => {
    expect(drawRect({ width: 200, height: 200 }, SLOT, IDENTITAS)).toEqual({
      x: 100,
      y: 50,
      width: 200,
      height: 200,
    })
  })

  test('foto lanskap meluber setara di kiri dan kanan', () => {
    // 400x200 di slot 200x200 -> digambar 400x200, luber 100px per sisi.
    expect(drawRect({ width: 400, height: 200 }, SLOT, IDENTITAS)).toEqual({
      x: 0,
      y: 50,
      width: 400,
      height: 200,
    })
  })

  test('offset dihitung sebagai pecahan dari ukuran slot', () => {
    const digeser = drawRect({ width: 400, height: 200 }, SLOT, {
      ...IDENTITAS,
      offsetX: 0.25,
    })
    // 0.25 x lebar slot 200 = 50px.
    expect(digeser.x).toBe(50)
  })

  test('zoom memperbesar dari titik tengah slot, bukan dari pojok', () => {
    const dizoom = drawRect({ width: 200, height: 200 }, SLOT, { ...IDENTITAS, scale: 2 })
    expect(dizoom.width).toBe(400)
    // Pusat gambar harus tetap berimpit dengan pusat slot.
    expect(dizoom.x + dizoom.width / 2).toBe(SLOT.x + SLOT.width / 2)
    expect(dizoom.y + dizoom.height / 2).toBe(SLOT.y + SLOT.height / 2)
  })

  test('hasilnya identik di skala keluaran mana pun', () => {
    // Inti P3: nilai transform yang sama harus menghasilkan tata letak yang
    // sebangun pada 1x, 2x, dan 3x. Diuji dengan menskalakan slotnya.
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

describe('panBounds', () => {
  test('foto yang pas menutup slot tidak boleh digeser sama sekali', () => {
    expect(panBounds({ width: 200, height: 200 }, { width: 200, height: 200 }, 1)).toEqual({
      x: 0,
      y: 0,
    })
  })

  test('luberan dibagi dua sisi, dinyatakan sebagai pecahan slot', () => {
    // 400x200 di slot 200x200 -> luber 200px, 100px per sisi = 0.5 slot.
    expect(panBounds({ width: 400, height: 200 }, { width: 200, height: 200 }, 1).x).toBe(0.5)
  })

  test('zoom memperbesar ruang gerak', () => {
    const b = panBounds({ width: 200, height: 200 }, { width: 200, height: 200 }, 2)
    expect(b.x).toBe(0.5)
    expect(b.y).toBe(0.5)
  })
})

describe('rubberBand', () => {
  test('di dalam batas, nilainya lewat apa adanya', () => {
    expect(rubberBand(0.3, 0.5)).toBe(0.3)
    expect(rubberBand(-0.5, 0.5)).toBe(-0.5)
  })

  test('melewati batas, kelebihannya ditahan tapi tetap bergerak', () => {
    const ditahan = rubberBand(1, 0.5)
    expect(ditahan).toBeGreaterThan(0.5)
    expect(ditahan).toBeLessThan(1)
  })

  test('makin jauh ditarik, makin berat — tidak pernah linear', () => {
    const a = rubberBand(0.6, 0.5) - rubberBand(0.5, 0.5)
    const b = rubberBand(1.6, 0.5) - rubberBand(1.5, 0.5)
    expect(b).toBeLessThan(a)
  })

  test('simetris untuk arah negatif', () => {
    expect(rubberBand(-1, 0.5)).toBe(-rubberBand(1, 0.5))
  })

  test('batas nol tetap memberi perlawanan, bukan mengunci mati', () => {
    // Slot yang fotonya pas: menariknya masih terasa bergerak sedikit,
    // lalu memantul balik. Mengunci mati terasa seperti UI-nya hang.
    expect(rubberBand(0.4, 0)).toBeGreaterThan(0)
    expect(rubberBand(0.4, 0)).toBeLessThan(0.4)
  })
})
```

- [ ] **Step 2: Jalankan test untuk memastikan gagal**

```bash
bun test tests/lib/composite.test.ts
```
Expected: FAIL — `Cannot find module '@/lib/composite'`.

- [ ] **Step 3: Tulis implementasinya**

`src/lib/composite.ts`:

```ts
import type { FrameSize, PixelRect } from '@/lib/geometry'

/**
 * Posisi foto di dalam satu slot.
 *
 * `offsetX`/`offsetY` adalah **pecahan dari ukuran slot**, bukan piksel. Itu
 * yang membuat transform yang sama menghasilkan hasil sebangun di 1x, 2x,
 * maupun 3x — syarat P3, karena preview dan unduhan memakai fungsi yang sama
 * dan cuma berbeda skala.
 */
export type Transform = { scale: number; offsetX: number; offsetY: number }

export const IDENTITAS: Transform = { scale: 1, offsetX: 0, offsetY: 0 }

/** Seberapa besar foto harus diperbesar agar menutup slot tanpa menyisakan celah. */
export function coverScale(image: FrameSize, slot: FrameSize): number {
  if (image.width <= 0 || image.height <= 0) return 1
  return Math.max(slot.width / image.width, slot.height / image.height)
}

/** Di mana foto digambar, dalam piksel kanvas yang sama dengan `slot`. */
export function drawRect(image: FrameSize, slot: PixelRect, t: Transform): PixelRect {
  const skala = coverScale(image, slot) * t.scale
  const width = image.width * skala
  const height = image.height * skala

  return {
    // Dipusatkan lebih dulu, baru digeser. Karena itu zoom membesar dari
    // tengah slot, bukan dari pojok kiri-atas.
    x: slot.x + (slot.width - width) / 2 + t.offsetX * slot.width,
    y: slot.y + (slot.height - height) / 2 + t.offsetY * slot.height,
    width,
    height,
  }
}

/**
 * Sejauh mana foto boleh digeser sebelum tepinya masuk ke dalam slot dan
 * meninggalkan celah kosong. Dinyatakan sebagai pecahan ukuran slot, satuan
 * yang sama dengan `Transform.offset*`.
 */
export function panBounds(image: FrameSize, slot: FrameSize, scale: number): {
  x: number
  y: number
} {
  const s = coverScale(image, slot) * scale
  const luberX = image.width * s - slot.width
  const luberY = image.height * s - slot.height
  return {
    x: slot.width > 0 ? Math.max(0, luberX / 2 / slot.width) : 0,
    y: slot.height > 0 ? Math.max(0, luberY / 2 / slot.height) : 0,
  }
}

/** Seberapa cepat perlawanan menumpuk di luar batas. Makin kecil, makin berat. */
const KEKENYALAN = 0.35

/**
 * Menahan gerakan di luar batas alih-alih menghentikannya mendadak
 * (aturan 26).
 *
 * Bentuknya asimptotik, bukan linear: kelebihan dibagi `1 + kelebihan/…`
 * sehingga makin jauh ditarik makin berat, dan tidak pernah benar-benar
 * berhenti. Berhenti keras terasa seperti aplikasi macet; ini terasa seperti
 * karet.
 */
export function rubberBand(offset: number, batas: number): number {
  const besar = Math.abs(offset)
  if (besar <= batas) return offset

  const kelebihan = besar - batas
  const ditahan = batas + (kelebihan * KEKENYALAN) / (1 + kelebihan)
  return Math.sign(offset) * ditahan
}
```

- [ ] **Step 4: Jalankan test untuk memastikan lulus**

```bash
bun test tests/lib/composite.test.ts
```
Expected: PASS, 17 test.

- [ ] **Step 5: Commit**

```bash
bun run check && bun run typecheck && bun run build
git add -A
git commit -m "feat: matematika compositing untuk halaman partisipan

Offset disimpan sebagai pecahan ukuran slot, bukan piksel, supaya
transform yang sama menghasilkan tata letak sebangun di 1x, 2x, dan 3x —
itu yang membuat preview dan unduhan mustahil berbeda (P3).

Rubber-banding berbentuk asimptotik, bukan linear: makin jauh ditarik
makin berat dan tidak pernah berhenti mendadak."
```

---

## Task 2: `renderComposite` — satu jalur, dua ukuran

**Files:**
- Modify: `src/lib/composite.ts`

**Interfaces:**
- Consumes: `drawRect`, `toPixels` (`@/lib/geometry`)
- Produces: `renderComposite(opts): HTMLCanvasElement`

- [ ] **Step 1: Tambahkan fungsinya**

```ts
import { type SlotRect, toPixels } from '@/lib/geometry'

/** Isi satu slot: fotonya dan posisinya. */
export type SlotFill = { image: HTMLImageElement; transform: Transform }

type RenderOpts = {
  frame: HTMLImageElement
  /** Dimensi asli frame dalam piksel; jadi acuan kanvas pada skala 1x. */
  frameSize: FrameSize
  slots: readonly SlotRect[]
  /** Mode single-photo mengembalikan isi yang sama untuk semua indeks. */
  getFill: (index: number) => SlotFill | undefined
  scale: number
}

/**
 * Menggambar komposit lengkap dan mengembalikan kanvasnya.
 *
 * Fungsi ini melayani preview di layar **dan** berkas unduhan; satu-satunya
 * yang berbeda adalah `scale` (P3). Tidak boleh ada cabang "kalau untuk
 * unduhan" di sini — begitu ada, preview dan hasil unduhan bisa berbeda, dan
 * itu justru kelas bug yang desain ini hapus.
 */
export function renderComposite({
  frame,
  frameSize,
  slots,
  getFill,
  scale,
}: RenderOpts): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(frameSize.width * scale)
  canvas.height = Math.round(frameSize.height * scale)

  const ctx = canvas.getContext('2d')
  if (!ctx) return canvas

  const kanvasSize = { width: canvas.width, height: canvas.height }

  slots.forEach((slot, index) => {
    const fill = getFill(index)
    if (!fill) return

    const kotak = toPixels(slot, kanvasSize)

    ctx.save()
    // Foto dipotong tepat di batas slot. Tanpa ini bagian yang meluber akan
    // menutupi slot tetangga.
    ctx.beginPath()
    ctx.rect(kotak.x, kotak.y, kotak.width, kotak.height)
    ctx.clip()

    const gambar = drawRect(
      { width: fill.image.naturalWidth, height: fill.image.naturalHeight },
      kotak,
      fill.transform,
    )
    ctx.drawImage(fill.image, gambar.x, gambar.y, gambar.width, gambar.height)
    ctx.restore()
  })

  // Frame digambar paling akhir supaya transparansinya tetap menunjukkan foto
  // di bawahnya, bukan sebaliknya.
  ctx.drawImage(frame, 0, 0, canvas.width, canvas.height)
  return canvas
}
```

> Argumen pertama `drawImage` harus sumber gambarnya. Menghilangkannya adalah
> kekeliruan paling gampang di seluruh fase ini, dan TypeScript **tidak selalu**
> menangkapnya karena `drawImage` punya beberapa overload.

- [ ] **Step 2: Verifikasi**

```bash
bun run check && bun run typecheck && bun run build
```
Expected: bersih. Perilakunya diuji di browser pada Task 7.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: renderComposite melayani preview dan unduhan sekaligus

Satu-satunya yang membedakan keduanya adalah argumen scale (P3). Frame
digambar paling akhir supaya transparansinya menunjukkan foto di
bawahnya."
```

---

## Task 3: `campaigns.incrementUse`

**Files:**
- Modify: `src/server/campaigns.ts`

**Interfaces:**
- Produces: `incrementUse` — input `{ id: string }`, keluaran `{ ok: true }`

- [ ] **Step 1: Tambahkan fungsinya**

```ts
/* --- incrementUse -------------------------------------------------------- */

export const incrementUse = createServerFn({ method: 'POST' })
  .validator((input: unknown) => z.object({ id: idSchema }).parse(input))
  .handler(async ({ data }) => {
    // Tanpa sesi: partisipan memang anonim. Dinaikkan lewat SQL, bukan
    // baca-lalu-tulis, supaya dua unduhan bersamaan tidak saling menimpa.
    await db
      .update(campaigns)
      .set({ useCount: sql`${campaigns.useCount} + 1` })
      .where(and(eq(campaigns.id, data.id), eq(campaigns.isPublic, true)))

    return { ok: true as const }
  })
```

Tambahkan `sql` ke impor drizzle yang sudah ada:

```ts
import { and, count, desc, eq, like, or, sql } from 'drizzle-orm'
```

- [ ] **Step 2: Verifikasi dan commit**

```bash
bun run check && bun run typecheck && bun run build
git add -A
git commit -m "feat: campaigns.incrementUse

Dinaikkan lewat ekspresi SQL, bukan baca-lalu-tulis, supaya dua unduhan
bersamaan tidak saling menimpa."
```

---

## Task 4: `useSlotTransform` — pointer, rubber-band, spring

Di sinilah Motion masuk. Nilai posisi disimpan sebagai `MotionValue`, bukan state React: kanvas digambar ulang lewat langganan perubahan, jadi tidak ada re-render React per frame saat menggeser.

**Files:**
- Create: `src/components/slot-filler/use-slot-transform.ts`
- Modify: `package.json` (`bun add motion`)

**Interfaces:**
- Consumes: `panBounds`, `rubberBand`, `IDENTITAS` (`@/lib/composite`)
- Produces: `useSlotTransform({ image, slotSize })` → `{ offsetX, offsetY, scale, setScale, mulai, geser, selesai, reset, bacaTransform }`

- [ ] **Step 1: Pasang Motion**

```bash
bun add motion@^12.42.2
```

- [ ] **Step 2: Tulis hook-nya**

```ts
import { animate, type MotionValue, useMotionValue } from 'motion/react'
import { type PointerEvent as ReactPointerEvent, useCallback, useRef, useState } from 'react'
import { IDENTITAS, panBounds, rubberBand, type Transform } from '@/lib/composite'
import type { FrameSize } from '@/lib/geometry'

/** Aturan 24: critically damped untuk gerakan yang bukan lemparan. */
const PEGAS = { type: 'spring', damping: 1, bounce: 0, duration: 0.35 } as const

/** Zoom minimum 1 = tepat menutup slot. Di bawah itu celah kosong muncul. */
const ZOOM_MIN = 1
const ZOOM_MAKS = 3

type Params = {
  image: HTMLImageElement | null
  /** Ukuran slot dalam piksel preview. */
  slotSize: FrameSize
}

export function useSlotTransform({ image, slotSize }: Params) {
  const offsetX = useMotionValue(0)
  const offsetY = useMotionValue(0)
  const [scale, setScaleState] = useState(1)

  const drag = useRef<{ pointerId: number; startX: number; startY: number; awal: Transform } | null>(
    null,
  )

  const batas = useCallback(() => {
    if (!image) return { x: 0, y: 0 }
    return panBounds(
      { width: image.naturalWidth, height: image.naturalHeight },
      slotSize,
      scale,
    )
  }, [image, slotSize, scale])

  /** Nilai transform saat ini — dibaca renderComposite tiap kali menggambar. */
  const bacaTransform = useCallback(
    (): Transform => ({ scale, offsetX: offsetX.get(), offsetY: offsetY.get() }),
    [scale, offsetX, offsetY],
  )

  function mulai(event: ReactPointerEvent) {
    if (!image) return
    // Aturan 21: umpan balik saat pointer-down, bukan saat klik.
    event.currentTarget.setPointerCapture(event.pointerId)
    drag.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      awal: bacaTransform(),
    }
  }

  function geser(event: ReactPointerEvent) {
    const d = drag.current
    if (!d || d.pointerId !== event.pointerId || slotSize.width <= 0) return

    // Aturan 22: 1:1 dengan pointer. Delta dihitung dari titik awal, bukan
    // bertahap, supaya tidak menumpuk galat sepanjang tarikan.
    const b = batas()
    const mentahX = d.awal.offsetX + (event.clientX - d.startX) / slotSize.width
    const mentahY = d.awal.offsetY + (event.clientY - d.startY) / slotSize.height

    offsetX.set(rubberBand(mentahX, b.x))
    offsetY.set(rubberBand(mentahY, b.y))
  }

  function selesai(event: ReactPointerEvent) {
    const d = drag.current
    if (!d || d.pointerId !== event.pointerId) return
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    drag.current = null

    // Aturan 25: animasi lanjut dari velocity jari. `animate` pada MotionValue
    // mewarisi velocity-nya, dan bisa di-interrupt tarikan berikutnya (23).
    const b = batas()
    kembalikan(offsetX, b.x)
    kembalikan(offsetY, b.y)
  }

  function reset() {
    animate(offsetX, 0, PEGAS)
    animate(offsetY, 0, PEGAS)
    setScaleState(IDENTITAS.scale)
  }

  function setScale(nilai: number) {
    const berikut = Math.min(ZOOM_MAKS, Math.max(ZOOM_MIN, nilai))
    setScaleState(berikut)
    // Mengecilkan zoom menyempitkan ruang gerak; tarik offsetnya masuk lagi
    // supaya celah kosong tidak muncul.
    if (!image) return
    const b = panBounds(
      { width: image.naturalWidth, height: image.naturalHeight },
      slotSize,
      berikut,
    )
    kembalikan(offsetX, b.x)
    kembalikan(offsetY, b.y)
  }

  return { offsetX, offsetY, scale, setScale, mulai, geser, selesai, reset, bacaTransform }
}

/** Memantulkan nilai kembali ke dalam batas, kalau ia memang di luar. */
function kembalikan(nilai: MotionValue<number>, batas: number) {
  const sekarang = nilai.get()
  const tujuan = Math.min(batas, Math.max(-batas, sekarang))
  if (tujuan === sekarang) return

  // Aturan 30: yang butuh gerakan minim langsung dilompatkan.
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    nilai.set(tujuan)
    return
  }
  animate(nilai, tujuan, PEGAS)
}
```

- [ ] **Step 3: Verifikasi**

```bash
bun run check && bun run typecheck && bun run build
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: useSlotTransform dengan rubber-banding dan spring settle

Posisi disimpan sebagai MotionValue, bukan state React: kanvas digambar
ulang lewat langganan perubahan, jadi menggeser foto tidak memicu
re-render React per frame.

Motion dipasang di sini, bukan lebih awal: baru pan foto yang benar-benar
butuh spring bisa-interrupt dan kontinuitas velocity."
```

---

## Task 5: `SlotFiller` — kanvas preview dan kontrolnya

**Files:**
- Create: `src/components/slot-filler/slot-filler.tsx`

**Interfaces:**
- Consumes: `renderComposite`, `useSlotTransform`, `<Button>`
- Produces: `<SlotFiller frameSrc frameSize slots photo onUnduh />`

- [ ] **Step 1: Tulis komponennya**

```tsx
import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { renderComposite, type SlotFill } from '@/lib/composite'
import type { FrameSize, SlotRect } from '@/lib/geometry'
import { useSlotTransform } from './use-slot-transform'

/** Sisi terpanjang kanvas preview di layar. */
const PREVIEW_MAKS = 460

type Props = {
  frameSrc: string
  frameSize: FrameSize
  slots: readonly SlotRect[]
  /** Foto partisipan. Null selama belum ada yang diunggah. */
  photo: HTMLImageElement | null
  onUnduh: (scale: number) => void
  sedangUnduh: boolean
}

export function SlotFiller({
  frameSrc,
  frameSize,
  slots,
  photo,
  onUnduh,
  sedangUnduh,
}: Props) {
  const kanvasRef = useRef<HTMLCanvasElement>(null)
  const [frame, setFrame] = useState<HTMLImageElement | null>(null)

  // Frame dimuat sekali sebagai elemen gambar; renderComposite butuh elemen,
  // bukan URL.
  useEffect(() => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => setFrame(img)
    img.src = frameSrc
  }, [frameSrc])

  const rasio = frameSize.width / frameSize.height
  const lebarPreview = rasio >= 1 ? PREVIEW_MAKS : Math.round(PREVIEW_MAKS * rasio)
  const tinggiPreview = rasio >= 1 ? Math.round(PREVIEW_MAKS / rasio) : PREVIEW_MAKS

  // Semua slot berbagi satu foto di Fase 3, jadi ukuran acuan geser diambil
  // dari slot pertama. Mode multi-photo di Fase 5 mengganti ini.
  const slotPertama = slots[0]
  const slotSize = slotPertama
    ? { width: (slotPertama.width / 100) * lebarPreview, height: (slotPertama.height / 100) * tinggiPreview }
    : { width: 0, height: 0 }

  const t = useSlotTransform({ image: photo, slotSize })

  // Gambar ulang tiap kali apa pun berubah — termasuk tiap frame animasi
  // spring, lewat langganan MotionValue.
  useEffect(() => {
    function gambar() {
      const kanvas = kanvasRef.current
      if (!kanvas || !frame) return

      const hasil = renderComposite({
        frame,
        frameSize,
        slots,
        // ponytail: satu foto untuk semua slot. Fase 5 mengganti fungsi ini,
        // bukan menambah cabang di renderComposite.
        getFill: (): SlotFill | undefined =>
          photo ? { image: photo, transform: t.bacaTransform() } : undefined,
        scale: lebarPreview / frameSize.width,
      })

      kanvas.width = hasil.width
      kanvas.height = hasil.height
      kanvas.getContext('2d')?.drawImage(hasil, 0, 0)
    }

    gambar()
    const lepasX = t.offsetX.on('change', gambar)
    const lepasY = t.offsetY.on('change', gambar)
    return () => {
      lepasX()
      lepasY()
    }
  }, [frame, frameSize, slots, photo, lebarPreview, t.offsetX, t.offsetY, t.bacaTransform])

  return (
    <div className="flex flex-col items-center gap-4">
      {/* biome-ignore lint/a11y/noStaticElementInteractions: kanvas komposit memang permukaan gesture; alternatif elemen semantiknya tidak ada, dan jalur non-pointer disediakan slider zoom serta tombol reset. */}
      <canvas
        ref={kanvasRef}
        style={{
          width: lebarPreview,
          height: tinggiPreview,
          touchAction: 'none',
          cursor: photo ? 'grab' : 'default',
        }}
        className="rounded-card shadow-[0_8px_40px_#00000050]"
        onPointerDown={t.mulai}
        onPointerMove={t.geser}
        onPointerUp={t.selesai}
        onPointerCancel={t.selesai}
      />

      {photo && (
        <div className="flex w-full max-w-md flex-col gap-3">
          <div className="rounded-base border border-border bg-surface p-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted">
                Zoom
              </span>
              <span className="rounded-pill border border-border bg-surface2 px-2.5 py-0.5 font-mono text-sm text-brand">
                {Math.round(t.scale * 100)}%
              </span>
            </div>
            <input
              type="range"
              min={1}
              max={3}
              step={0.01}
              value={t.scale}
              onChange={(e) => t.setScale(Number(e.target.value))}
              className="w-full accent-brand"
              aria-label="Zoom foto"
            />
            <button
              type="button"
              onClick={t.reset}
              className="mt-2 w-full text-xs text-muted hover:text-text"
            >
              ↺ Reset posisi
            </button>
          </div>

          <p className="text-center text-sm text-muted">
            Geser fotonya langsung di gambar untuk mengatur posisi.
          </p>

          <div className="grid grid-cols-3 gap-2">
            {[1, 2, 3].map((s) => (
              <Button
                key={s}
                type="button"
                variant={s === 1 ? 'default' : 'outline'}
                disabled={sedangUnduh}
                onClick={() => onUnduh(s)}
              >
                Unduh {s}×
              </Button>
            ))}
          </div>
          <p className="text-center text-xs text-muted">
            {frameSize.width}×{frameSize.height} px pada 1×
          </p>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verifikasi dan commit**

```bash
bun run check && bun run typecheck && bun run build
git add -A
git commit -m "feat: SlotFiller — kanvas preview partisipan dan kontrolnya

Kanvas digambar ulang lewat langganan MotionValue, jadi spring settle
ikut terlihat mulus tanpa satu pun re-render React."
```

---

## Task 6: Route `/twibbon/$slug`

**Files:**
- Create: `src/routes/twibbon.$slug.tsx`

**Interfaces:**
- Consumes: `getCampaignBySlug`, `incrementUse`, `<SlotFiller>`, `<Navbar>`
- Produces: halaman publik partisipan

- [ ] **Step 1: Tulis route-nya**

```tsx
import { createFileRoute, Link } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { Navbar } from '@/components/navbar'
import { SlotFiller } from '@/components/slot-filler/slot-filler'
import { renderComposite } from '@/lib/composite'
import { pesanError } from '@/lib/pesan-error'
import { getCampaignBySlug, incrementUse } from '@/server/campaigns'

/** PRD US-04 mode single: maksimum 15MB. Divalidasi di klien karena
    fotonya memang tidak pernah dikirim ke mana pun (P1). */
const MAKS_FOTO = 15 * 1024 * 1024

export const Route = createFileRoute('/twibbon/$slug')({
  loader: ({ params }) => getCampaignBySlug({ data: { slug: params.slug } }),
  errorComponent: () => (
    <>
      <Navbar />
      <main className="mx-auto max-w-md p-6 text-center">
        <p className="mb-3 mt-16 text-5xl">😕</p>
        <h1 className="mb-2 font-display text-2xl">Kampanye tidak ditemukan</h1>
        <p className="mb-6 text-muted">Mungkin tautannya salah, atau kampanyenya sudah privat.</p>
        <Link to="/" className="text-brand hover:underline">
          Kembali ke beranda
        </Link>
      </main>
    </>
  ),
  component: TwibbonPage,
})

function TwibbonPage() {
  const campaign = Route.useLoaderData()
  const [photo, setPhoto] = useState<HTMLImageElement | null>(null)
  const [photoUrl, setPhotoUrl] = useState('')
  const [error, setError] = useState('')
  const [sedangUnduh, setSedangUnduh] = useState(false)

  useEffect(() => {
    if (!photoUrl) return
    return () => URL.revokeObjectURL(photoUrl)
  }, [photoUrl])

  function pilihFoto(berkas: File | undefined) {
    if (!berkas) return
    setError('')

    if (berkas.size > MAKS_FOTO) {
      setError('Ukuran foto maksimal 15MB')
      return
    }
    if (!berkas.type.startsWith('image/')) {
      setError('Berkasnya harus berupa gambar')
      return
    }

    const url = URL.createObjectURL(berkas)
    const img = new Image()
    img.onload = () => {
      setPhotoUrl(url)
      setPhoto(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      setError('Gambarnya tidak bisa dibaca. Coba berkas lain.')
    }
    img.src = url
  }

  async function unduh(scale: number) {
    if (!photo) return
    setSedangUnduh(true)
    setError('')
    try {
      const frame = new Image()
      frame.crossOrigin = 'anonymous'
      await new Promise<void>((selesai, gagal) => {
        frame.onload = () => selesai()
        frame.onerror = () => gagal(new Error('Frame gagal dimuat'))
        frame.src = `/api/frame/${campaign.id}`
      })

      // Fungsi yang sama dengan preview — cuma skalanya berbeda (P3).
      const kanvas = renderComposite({
        frame,
        frameSize: { width: campaign.frameWidth, height: campaign.frameHeight },
        slots: campaign.slots,
        getFill: () => ({ image: photo, transform: bacaTransform.current() }),
        scale,
      })

      const tautan = document.createElement('a')
      tautan.download = `openframe-${campaign.slug}-${scale}x.png`
      tautan.href = kanvas.toDataURL('image/png')
      tautan.click()

      // Dihitung setelah berkasnya benar-benar dibuat, bukan saat tombol
      // ditekan — kalau rendernya gagal, hitungannya tidak ikut naik.
      await incrementUse({ data: { id: campaign.id } })
    } catch (err) {
      setError(pesanError(err))
    } finally {
      setSedangUnduh(false)
    }
  }

  return (
    <>
      <Navbar />
      <main className="atmosfer mx-auto flex max-w-3xl flex-col items-center px-6 py-10">
        <h1 className="fade-up text-center font-display text-3xl tracking-[-0.02em]">
          {campaign.name}
        </h1>
        {campaign.description && (
          <p className="fade-up mt-2 max-w-md text-center text-muted">{campaign.description}</p>
        )}
        <p className="fade-up mb-7 mt-2 text-sm text-muted">
          {campaign.slots.length} area foto · oleh <strong>@{campaign.username}</strong>
        </p>

        {error && (
          <p
            role="alert"
            className="mb-4 rounded-sm border border-danger/30 bg-danger/10 p-3 text-sm text-danger"
          >
            {error}
          </p>
        )}

        <div className="fade-up-2 flex w-full flex-col items-center gap-5">
          <SlotFiller
            frameSrc={`/api/frame/${campaign.id}`}
            frameSize={{ width: campaign.frameWidth, height: campaign.frameHeight }}
            slots={campaign.slots}
            photo={photo}
            onUnduh={unduh}
            sedangUnduh={sedangUnduh}
          />

          <label className="w-full max-w-md cursor-pointer rounded-base border-2 border-dashed border-border bg-surface2 p-5 text-center transition-colors hover:border-brand">
            <span className="font-semibold">
              {photo ? '🔄 Ganti foto' : '📸 Pilih foto kamu'}
            </span>
            <span className="mt-1 block text-xs text-muted">
              Maksimal 15MB · fotonya diproses di browser, tidak dikirim ke mana pun
            </span>
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(e) => pilihFoto(e.target.files?.[0])}
            />
          </label>
        </div>
      </main>
    </>
  )
}
```

> **Transform dipegang `SlotFiller`, sedangkan unduhan terjadi di halaman ini.**
> Karena itu `SlotFiller` menerima prop `onTransform: (baca: () => Transform) => void`
> dan memanggilnya sekali lewat `useEffect`, sehingga halaman menyimpan
> *pembacanya*, bukan salinan nilainya:
>
> ```tsx
> const bacaTransform = useRef<() => Transform>(() => IDENTITAS)
> // <SlotFiller onTransform={(baca) => { bacaTransform.current = baca }} … />
> // lalu saat mengunduh:
> getFill: () => ({ image: photo, transform: bacaTransform.current() }),
> ```
>
> Menyimpan nilainya, bukan pembacanya, akan membekukan posisi foto pada saat
> render terakhir — persis kelas bug "unduhan tidak sama dengan preview" yang
> P3 hapus.

- [ ] **Step 2: Verifikasi dan commit**

```bash
bun run check && bun run typecheck && bun run build
git add -A
git commit -m "feat: halaman partisipan /twibbon/\$slug

Foto tidak pernah menyentuh server (P1) — ia object URL yang hidup di
memori tab. Unduhan memanggil renderComposite yang sama dengan preview,
cuma dengan skala berbeda (P3). Hitungan pemakaian naik setelah
berkasnya benar-benar jadi, bukan saat tombol ditekan."
```

---

## Task 7: Verifikasi menyeluruh

- [ ] **Step 1: Gerbang otomatis**

```bash
bun test && bun run typecheck && bun run check && bun run build
```
Expected: 92 test (75 + 17 composite), sisanya bersih.

- [ ] **Step 2: Alur partisipan di browser**

1. Buat campaign publik dengan 2 area lewat `/buat`
2. Buka `/twibbon/<slug>` di jendela penyamaran (tanpa sesi) → halaman tampil
3. Unggah foto → kedua area terisi foto yang sama
4. Geser foto → **kedua area bergerak bersamaan**, 1:1 dengan pointer
5. Geser jauh melewati batas → terasa menahan, lalu **memantul balik** saat dilepas
6. Zoom → area gerak melebar; kecilkan lagi → offsetnya ikut tertarik masuk
7. Unduh 1× → berkas `openframe-<slug>-1x.png` terunduh

- [ ] **Step 3: Buktikan P1 — foto tidak pernah ke server**

Buka DevTools → Network, saring `Fetch/XHR`, lalu unggah foto dan geser.
Expected: **tidak ada permintaan** yang membawa isi berkas. Yang muncul hanya
`GET /api/frame/<id>` dan, saat mengunduh, satu POST `incrementUse`.

- [ ] **Step 4: Buktikan P3 — preview sama dengan unduhan**

```bash
# dimensi berkas hasil harus tepat kelipatan dimensi frame
sips -g pixelWidth -g pixelHeight ~/Downloads/openframe-<slug>-2x.png
```
Expected: persis 2× `frame_width` dan `frame_height` di database. Buka
berkasnya: posisi foto di dalam area harus sama persis dengan preview, dan
bagian frame yang transparan tetap transparan.

- [ ] **Step 5: Reduced motion**

DevTools → Rendering → `prefers-reduced-motion: reduce`. Geser foto melewati
batas lalu lepas. Expected: langsung berada di posisi akhir, tanpa pantulan.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "test: verifikasi alur partisipan, P1, dan P3"
```

---

## Definition of Done — Fase 3

- [ ] `bun test` (92), `typecheck`, `check`, `build` bersih
- [ ] `/twibbon/$slug` terbuka tanpa sesi; campaign privat → "tidak ditemukan"
- [ ] Foto **tidak pernah** muncul di Network tab — terbukti, bukan diasumsikan
- [ ] Menggeser foto mengikuti pointer 1:1 dan menggerakkan semua area bersamaan
- [ ] Melewati batas terasa menahan, lalu memantul balik dengan spring
- [ ] Tarikan baru bisa menyela pantulan yang sedang berjalan (aturan 23)
- [ ] `prefers-reduced-motion` mematikan pantulan
- [ ] Unduhan 1×/2×/3× menghasilkan PNG beralpha berdimensi tepat kelipatan frame
- [ ] Posisi foto di berkas hasil sama persis dengan preview
- [ ] `use_count` naik setelah unduhan berhasil, tidak naik kalau render gagal
- [ ] Semua teks berbahasa Indonesia

---

## Yang menyusul

| Fase | Isi |
|---|---|
| 4 | Satu foto ke semua slot sudah jadi di sini; Fase 4 menambah global pan/zoom lintas slot yang berbeda ukuran |
| 5 | Mode multi-photo — mengganti `getFill`, bukan menambah cabang di `renderComposite` |
| 6 | `campaigns.listPublic`, `/` jadi landing + galeri, pencarian, paginasi |
| 7 | `campaigns.delete` (**wajib memanggil `deleteFrameDir`** — cascade database tidak menghapus berkas), ganti frame, OG metadata, aksesibilitas |
