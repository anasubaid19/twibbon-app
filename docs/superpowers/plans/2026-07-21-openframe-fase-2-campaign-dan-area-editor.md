# OpenFrame Fase 2: Campaign, Unggah Frame, dan Area Editor — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Creator yang sudah masuk bisa mengunggah frame PNG, menggambar satu area foto di atasnya, menyimpannya sebagai campaign, melihatnya di dashboard, lalu membukanya lagi untuk mengubah nama/deskripsi/posisi area.

**Architecture:** Satu server function `createCampaign` menerima `FormData` berisi berkas frame **dan** definisi slot sekaligus — tidak ada langkah unggah terpisah, jadi tidak ada berkas yatim kalau penyimpanan gagal. Frame disimpan di direktori `uploads/` di luar webroot dan disajikan lewat route `/api/frame/$id` yang membaca `framePath` dari database. Area editor adalah overlay SVG di atas `<img>` frame; seluruh matematika koordinatnya hidup di `lib/geometry.ts` dan tidak di tempat lain (P2).

**Tech Stack:** TanStack Start 1.168 · React 19 · Drizzle ORM 0.45 (PostgreSQL) · Sharp 0.35 · Zod 4 · Tailwind CSS v4 · Biome 2.5 · Bun

**Spec:** `docs/superpowers/specs/2026-07-20-openframe-rewrite-design.md`
**Fase sebelumnya:** `docs/superpowers/plans/2026-07-20-openframe-fase-0-1-fondasi-dan-auth.md`

---

## Global Constraints

Berlaku untuk **setiap** task di bawah ini.

- **Bahasa UI dan pesan error: Bahasa Indonesia**, nada santai, sapaan "kamu". Brand: **OpenFrame**.
- **Nol email, nol nomor telepon.** Tidak ada field, form, atau kolom yang meminta keduanya. (Spec P1)
- Sesi memakai cookie HTTP-only. **Tidak ada token di `localStorage`.** (Spec 9.5)
- **`userId` tidak pernah melintasi kabel ke klien.** Server function memproyeksikan hasilnya, persis seperti `getSession` di Fase 0–1 (`src/server/session.ts:9-16`).
- **P2 — Satu model koordinat.** `src/lib/geometry.ts` adalah satu-satunya modul yang menerjemahkan persen ↔ piksel. Komponen editor, server function, dan (nanti) compositing memanggilnya; tidak ada yang menghitung sendiri.
- **P4 — YAGNI.** Fase 2 hanya membangun yang tercantum di sini. Multi-slot (Fase 4), halaman partisipan (Fase 3), gallery (Fase 6), dan hapus campaign (Fase 7) **tidak** disentuh.
- Semua input di batas server function divalidasi Zod; koordinat slot dari klien **selalu** divalidasi ulang di server. (Spec bagian 10)
- Foto partisipan tidak pernah dikirim ke server. Di fase ini yang diunggah **hanya** frame milik creator.
- Package manager & test runner: `bun`. Jangan pakai `npm install`/`npx` untuk dependensi project.
- Formatter & linter: Biome. Jalankan `bun run check` sebelum tiap commit.
- Tema gelap default. Accent `#CAFF33`, judul Bricolage Grotesque, isi Nunito. Pakai utilitas token yang sudah ada (`bg-surface`, `text-muted`, `rounded-card`, `rounded-pill`, `border-border`, `text-accent`, `text-danger`).
- Commit message berbahasa Indonesia, format conventional commits.

**Catatan `biome-ignore`:** komentar suppression harus **persis** mendahului baris yang ditandai. Kalau alasannya lebih dari satu baris, tulis sebagai blok `/* ... */`, bukan beberapa baris `//`.

---

## Struktur Berkas

| Berkas | Tanggung jawab |
|---|---|
| `src/lib/geometry.ts` | **Baru.** Tipe koordinat, konversi persen↔piksel, clamping, validasi, matematika drag/resize (P2) |
| `src/lib/slug.ts` | **Baru.** Slugify nama campaign + penyelesaian bentrok |
| `src/db/schema.ts` | **Ubah.** Tambah tabel `campaigns` dan `frame_slots` |
| `src/server/upload.ts` | **Baru.** Validasi frame lewat Sharp, tulis/baca/hapus berkas di `uploads/` |
| `src/server/session.ts` | **Ubah.** Tambah `requireUserId()` untuk dipakai di dalam handler server function |
| `src/server/campaigns.ts` | **Baru.** `createCampaign`, `listMyCampaigns`, `getCampaignForEdit`, `updateCampaign` |
| `src/routes/api/frame.$id.ts` | **Baru.** Menyajikan PNG frame dari disk berdasarkan id campaign |
| `src/components/area-editor/use-element-size.ts` | **Baru.** Ukuran render elemen lewat `ResizeObserver` |
| `src/components/area-editor/use-drag-resize.ts` | **Baru.** Pointer capture → delta → `applyDrag` |
| `src/components/area-editor/slot-rect.tsx` | **Baru.** Satu `<rect>` SVG + 8 pegangan resize + jalur keyboard |
| `src/components/area-editor/area-editor.tsx` | **Baru.** Gambar frame + overlay SVG, merakit hook di atas |
| `src/routes/buat.tsx` | **Baru.** Pilih frame → gambar area → simpan |
| `src/routes/edit.$id.tsx` | **Baru.** Muat campaign milik sendiri → ubah → simpan |
| `src/routes/dashboard.tsx` | **Ubah.** Ganti stub dengan daftar kampanye sungguhan |
| `.env.example`, `README.md` | **Ubah.** `UPLOAD_DIR` dan status fase |
| `tests/lib/geometry.test.ts` | **Baru.** Beban uji terberat — semua perilaku spasial bertumpu di sini |
| `tests/lib/slug.test.ts` | **Baru.** Slugify + penyelesaian bentrok |
| `tests/server/upload.test.ts` | **Baru.** Validasi Sharp menolak berkas palsu |

**Yang sengaja tidak dibuat di fase ini:** `campaigns.getBySlug`, `campaigns.listPublic`, `campaigns.delete`, `campaigns.incrementUse`, `lib/composite.ts`, `components/slot-filler/`, route `/twibbon/$slug`. Masing-masing menyusul di fasenya sendiri.

---

## Task 1: `lib/geometry.ts` — model koordinat bersama (TDD)

Logika murni: tanpa React, tanpa DOM, tanpa database. Ini fondasi P2 — kalau modul ini benar, area editor dan compositing Fase 3 otomatis sepakat.

Modul ini memegang **tiga** hal yang sering tercecer di implementasi lain: konversi persen↔piksel, dua aturan clamping yang berbeda (geser vs resize), dan validasi ukuran minimum.

**Files:**
- Create: `src/lib/geometry.ts`
- Test: `tests/lib/geometry.test.ts`

**Interfaces:**
- Consumes: —
- Produces:
  - `type SlotRect = { x: number; y: number; width: number; height: number }` — persen 0–100
  - `type PixelRect = { x: number; y: number; width: number; height: number }` — piksel
  - `type FrameSize = { width: number; height: number }` — piksel
  - `type DragMode = 'move' | 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w'`
  - `const MIN_SLOT_PX = 20`
  - `toPixels(rect: SlotRect, frame: FrameSize): PixelRect`
  - `toPercent(rect: PixelRect, frame: FrameSize): SlotRect`
  - `deltaToPercent(dx: number, dy: number, frame: FrameSize): { dx: number; dy: number }`
  - `clampToFrame(rect: SlotRect): SlotRect` — geser masuk, ukuran dipertahankan
  - `applyDrag(rect: SlotRect, mode: DragMode, dx: number, dy: number): SlotRect` — hasilnya sudah ter-clamp
  - `isValidSlot(rect: SlotRect, frame: FrameSize): boolean`

- [ ] **Step 1: Tulis test yang gagal**

`tests/lib/geometry.test.ts`:

```ts
import { describe, expect, test } from 'bun:test'
import {
  applyDrag,
  clampToFrame,
  deltaToPercent,
  isValidSlot,
  MIN_SLOT_PX,
  toPercent,
  toPixels,
} from '@/lib/geometry'

const FRAME = { width: 1000, height: 500 }

describe('toPixels', () => {
  test('menerjemahkan persen ke piksel frame', () => {
    expect(toPixels({ x: 10, y: 20, width: 50, height: 40 }, FRAME)).toEqual({
      x: 100,
      y: 100,
      width: 500,
      height: 200,
    })
  })

  test('kotak penuh 0-100 persen menutupi seluruh frame', () => {
    expect(toPixels({ x: 0, y: 0, width: 100, height: 100 }, FRAME)).toEqual({
      x: 0,
      y: 0,
      width: 1000,
      height: 500,
    })
  })
})

describe('toPercent', () => {
  test('kebalikan dari toPixels', () => {
    expect(toPercent({ x: 100, y: 100, width: 500, height: 200 }, FRAME)).toEqual({
      x: 10,
      y: 20,
      width: 50,
      height: 40,
    })
  })

  test('roundtrip persen → piksel → persen tidak menggeser nilai', () => {
    const asal = { x: 12.5, y: 33.25, width: 44.75, height: 8.5 }
    const kembali = toPercent(toPixels(asal, FRAME), FRAME)
    expect(kembali.x).toBeCloseTo(asal.x, 10)
    expect(kembali.y).toBeCloseTo(asal.y, 10)
    expect(kembali.width).toBeCloseTo(asal.width, 10)
    expect(kembali.height).toBeCloseTo(asal.height, 10)
  })

  test('roundtrip tetap sama pada frame 1x, 2x, dan 3x', () => {
    // Inti dari koordinat persen: slot yang sama harus berlaku di skala mana pun.
    const asal = { x: 12.5, y: 33.25, width: 44.75, height: 8.5 }
    for (const skala of [1, 2, 3]) {
      const frame = { width: 1000 * skala, height: 500 * skala }
      expect(toPercent(toPixels(asal, frame), frame).x).toBeCloseTo(asal.x, 10)
    }
  })

  test('mengembalikan nol saat frame belum punya ukuran, bukan Infinity', () => {
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

describe('deltaToPercent', () => {
  test('menerjemahkan pergeseran pointer jadi pergeseran persen', () => {
    expect(deltaToPercent(100, 50, FRAME)).toEqual({ dx: 10, dy: 10 })
  })

  test('mengembalikan nol saat frame belum punya ukuran', () => {
    expect(deltaToPercent(100, 50, { width: 0, height: 0 })).toEqual({ dx: 0, dy: 0 })
  })
})

describe('clampToFrame', () => {
  test('membiarkan kotak yang sudah di dalam frame', () => {
    const rect = { x: 10, y: 10, width: 30, height: 30 }
    expect(clampToFrame(rect)).toEqual(rect)
  })

  test('menggeser masuk tanpa mengubah ukuran saat menembus tepi kanan', () => {
    expect(clampToFrame({ x: 90, y: 10, width: 30, height: 30 })).toEqual({
      x: 70,
      y: 10,
      width: 30,
      height: 30,
    })
  })

  test('menggeser masuk saat koordinat negatif', () => {
    expect(clampToFrame({ x: -15, y: -5, width: 30, height: 30 })).toEqual({
      x: 0,
      y: 0,
      width: 30,
      height: 30,
    })
  })

  test('mengecilkan kotak yang lebih besar dari frame', () => {
    expect(clampToFrame({ x: -10, y: -10, width: 150, height: 150 })).toEqual({
      x: 0,
      y: 0,
      width: 100,
      height: 100,
    })
  })
})

describe('applyDrag', () => {
  const rect = { x: 20, y: 20, width: 40, height: 40 }

  test('mode move menggeser tanpa mengubah ukuran', () => {
    expect(applyDrag(rect, 'move', 10, -5)).toEqual({ x: 30, y: 15, width: 40, height: 40 })
  })

  test('mode move berhenti di tepi, tidak mengecil', () => {
    expect(applyDrag(rect, 'move', 90, 0)).toEqual({ x: 60, y: 20, width: 40, height: 40 })
  })

  test('pegangan timur hanya menggerakkan sisi kanan', () => {
    expect(applyDrag(rect, 'e', 10, 999)).toEqual({ x: 20, y: 20, width: 50, height: 40 })
  })

  test('pegangan barat menggerakkan sisi kiri dan menyesuaikan lebar', () => {
    expect(applyDrag(rect, 'w', 10, 0)).toEqual({ x: 30, y: 20, width: 30, height: 40 })
  })

  test('pegangan sudut menggerakkan dua sisi sekaligus', () => {
    expect(applyDrag(rect, 'se', 10, 10)).toEqual({ x: 20, y: 20, width: 50, height: 50 })
  })

  test('resize berhenti di tepi frame tanpa menyeret sisi seberangnya', () => {
    // Bug yang gampang lolos: kalau resize memakai clamp gaya "geser masuk",
    // sisi kiri ikut bergeser padahal pengguna cuma menarik sisi kanan.
    const hasil = applyDrag(rect, 'e', 999, 0)
    expect(hasil).toEqual({ x: 20, y: 20, width: 80, height: 40 })
  })

  test('menarik sisi melewati sisi seberang membalik kotak, bukan bikin lebar negatif', () => {
    // Kotaknya selebar 40% dan pointer ditarik 50% ke kiri, jadi ia melewati
    // sisi kiri sejauh 10%: kotaknya membalik dan kini membentang 10%–20%.
    const hasil = applyDrag(rect, 'e', -50, 0)
    expect(hasil.width).toBeGreaterThanOrEqual(0)
    expect(hasil).toEqual({ x: 10, y: 20, width: 10, height: 40 })
  })
})

describe('isValidSlot', () => {
  test('menerima slot yang cukup besar dan di dalam frame', () => {
    expect(isValidSlot({ x: 10, y: 10, width: 30, height: 30 }, FRAME)).toBe(true)
  })

  test(`menolak slot yang sisinya di bawah ${MIN_SLOT_PX} piksel asli`, () => {
    // 1% dari tinggi 500px = 5px — di layar terlihat wajar, di berkas asli tidak.
    expect(isValidSlot({ x: 10, y: 10, width: 30, height: 1 }, FRAME)).toBe(false)
  })

  test('menerima slot yang sisinya tepat 20 piksel asli', () => {
    expect(isValidSlot({ x: 0, y: 0, width: 2, height: 4 }, FRAME)).toBe(true)
  })

  test('menolak slot yang keluar dari frame', () => {
    expect(isValidSlot({ x: 80, y: 10, width: 30, height: 30 }, FRAME)).toBe(false)
    expect(isValidSlot({ x: -1, y: 10, width: 30, height: 30 }, FRAME)).toBe(false)
  })

  test('memaafkan kelebihan sepersekian akibat pembulatan float', () => {
    expect(isValidSlot({ x: 0, y: 0, width: 100.0000000001, height: 100 }, FRAME)).toBe(true)
  })

  test.each([
    ['NaN', { x: Number.NaN, y: 0, width: 30, height: 30 }],
    ['Infinity', { x: 0, y: 0, width: Number.POSITIVE_INFINITY, height: 30 }],
  ])('menolak koordinat %s', (_label, rect) => {
    expect(isValidSlot(rect, FRAME)).toBe(false)
  })
})
```

- [ ] **Step 2: Jalankan test untuk memastikan gagal**

```bash
bun test tests/lib/geometry.test.ts
```
Expected: FAIL — `Cannot find module '@/lib/geometry'`.

- [ ] **Step 3: Tulis implementasi**

`src/lib/geometry.ts`:

```ts
/**
 * Satu-satunya modul yang tahu cara menerjemahkan antara persen dan piksel.
 *
 * Spec P2: creator menggambar kotak, partisipan menggeser foto di dalam kotak
 * yang sama, dan compositing merender keduanya. Tiga tempat itu wajib memakai
 * modul ini. Dua implementasi koordinat berarti dua peluang untuk tidak
 * sinkron, dan bug semacam itu baru terlihat di berkas hasil unduhan.
 */

/** Kotak slot dalam persen 0–100 terhadap dimensi frame. Bentuk yang tersimpan di database. */
export type SlotRect = { x: number; y: number; width: number; height: number }

/** Kotak dalam piksel. Bisa piksel asli frame, bisa piksel elemen yang dirender di layar. */
export type PixelRect = { x: number; y: number; width: number; height: number }

/** Ukuran acuan dalam piksel. */
export type FrameSize = { width: number; height: number }

/** Arah tarikan: `move` menggeser seluruh kotak, sisanya menggerakkan sisi/sudut. */
export type DragMode = 'move' | 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w'

/** Sisi terpendek slot yang masih masuk akal, dalam piksel asli frame. Spec bagian 10. */
export const MIN_SLOT_PX = 20

/**
 * Kelebihan sekecil ini datang dari pembulatan float saat roundtrip
 * persen→piksel→persen, bukan dari slot yang benar-benar keluar frame.
 */
const EPSILON = 0.001

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

/** Frame belum punya ukuran selama gambar masih dimuat; jangan bagi dengan nol. */
function hasSize(frame: FrameSize): boolean {
  return frame.width > 0 && frame.height > 0
}

export function toPixels(rect: SlotRect, frame: FrameSize): PixelRect {
  return {
    x: (rect.x / 100) * frame.width,
    y: (rect.y / 100) * frame.height,
    width: (rect.width / 100) * frame.width,
    height: (rect.height / 100) * frame.height,
  }
}

export function toPercent(rect: PixelRect, frame: FrameSize): SlotRect {
  if (!hasSize(frame)) return { x: 0, y: 0, width: 0, height: 0 }
  return {
    x: (rect.x / frame.width) * 100,
    y: (rect.y / frame.height) * 100,
    width: (rect.width / frame.width) * 100,
    height: (rect.height / frame.height) * 100,
  }
}

/** Pergeseran pointer (piksel elemen yang dirender) menjadi pergeseran persen. */
export function deltaToPercent(dx: number, dy: number, frame: FrameSize): { dx: number; dy: number } {
  if (!hasSize(frame)) return { dx: 0, dy: 0 }
  return { dx: (dx / frame.width) * 100, dy: (dy / frame.height) * 100 }
}

/**
 * Aturan clamp untuk **menggeser**: kotak didorong kembali ke dalam frame dan
 * ukurannya dipertahankan. Kotak yang lebih besar dari frame dikecilkan karena
 * tidak ada posisi yang bisa memuatnya.
 */
export function clampToFrame(rect: SlotRect): SlotRect {
  const width = clamp(rect.width, 0, 100)
  const height = clamp(rect.height, 0, 100)
  return {
    x: clamp(rect.x, 0, 100 - width),
    y: clamp(rect.y, 0, 100 - height),
    width,
    height,
  }
}

/**
 * Aturan clamp untuk **resize**: tiap sisi berhenti sendiri di tepi frame.
 *
 * Bedanya dengan clampToFrame penting. Kalau resize memakai "geser masuk",
 * menarik sisi kanan sampai tepi akan ikut menyeret sisi kiri — kotaknya
 * berpindah padahal pengguna hanya bermaksud melebarkan.
 */
function clampEdges(rect: SlotRect): SlotRect {
  const left = clamp(rect.x, 0, 100)
  const top = clamp(rect.y, 0, 100)
  const right = clamp(rect.x + rect.width, 0, 100)
  const bottom = clamp(rect.y + rect.height, 0, 100)
  return {
    x: left,
    y: top,
    width: Math.max(0, right - left),
    height: Math.max(0, bottom - top),
  }
}

/**
 * Menerapkan tarikan pointer ke sebuah kotak. `dx`/`dy` dalam persen.
 * Hasilnya selalu sudah ter-clamp ke frame, jadi pemanggil tidak perlu
 * mengingat aturan mana yang berlaku untuk mode mana.
 */
export function applyDrag(rect: SlotRect, mode: DragMode, dx: number, dy: number): SlotRect {
  if (mode === 'move') {
    return clampToFrame({ ...rect, x: rect.x + dx, y: rect.y + dy })
  }

  let { x, y, width, height } = rect
  if (mode.includes('w')) {
    x = rect.x + dx
    width = rect.width - dx
  }
  if (mode.includes('e')) width = rect.width + dx
  if (mode.includes('n')) {
    y = rect.y + dy
    height = rect.height - dy
  }
  if (mode.includes('s')) height = rect.height + dy

  // Tarikan yang melewati sisi seberang membalik kotaknya. Normalkan supaya
  // width/height tidak pernah negatif — nilai negatif lolos ke database
  // sebagai slot yang tidak mungkin dirender.
  if (width < 0) {
    x += width
    width = -width
  }
  if (height < 0) {
    y += height
    height = -height
  }

  return clampEdges({ x, y, width, height })
}

/**
 * Apakah slot layak disimpan. Dipakai editor untuk menyalakan tombol simpan
 * **dan** dipakai ulang di server — klien tidak pernah jadi satu-satunya
 * penjaga (spec bagian 10).
 */
export function isValidSlot(rect: SlotRect, frame: FrameSize): boolean {
  const values = [rect.x, rect.y, rect.width, rect.height]
  if (!values.every((value) => Number.isFinite(value))) return false
  if (rect.x < -EPSILON || rect.y < -EPSILON) return false
  if (rect.x + rect.width > 100 + EPSILON) return false
  if (rect.y + rect.height > 100 + EPSILON) return false

  const px = toPixels(rect, frame)
  return px.width >= MIN_SLOT_PX && px.height >= MIN_SLOT_PX
}
```

- [ ] **Step 4: Jalankan test untuk memastikan lulus**

```bash
bun test tests/lib/geometry.test.ts
```
Expected: PASS, 26 test.

- [ ] **Step 5: Commit**

```bash
bun run check
git add -A
git commit -m "feat: modul geometri sebagai satu-satunya model koordinat

Persen 0-100 di database, piksel di layar dan di berkas hasil. Resize
dan geser memakai aturan clamp yang berbeda: menggeser mempertahankan
ukuran, resize menghentikan tiap sisi sendiri di tepi frame."
```

---

## Task 2: `lib/slug.ts` — slug dari nama campaign (TDD)

Logika murni. Penyelesaian bentrok dipisah dari database supaya bisa diuji tanpa Postgres; pemanggil di Task 5 yang menyediakan daftar slug yang sudah terpakai.

**Files:**
- Create: `src/lib/slug.ts`
- Test: `tests/lib/slug.test.ts`

**Interfaces:**
- Consumes: —
- Produces:
  - `const SLUG_PATTERN: RegExp` — `^[a-z0-9-]{3,60}$`
  - `slugify(name: string): string` — selalu memenuhi `SLUG_PATTERN`
  - `resolveSlug(base: string, taken: readonly string[]): string`

- [ ] **Step 1: Tulis test yang gagal**

`tests/lib/slug.test.ts`:

```ts
import { describe, expect, test } from 'bun:test'
import { resolveSlug, SLUG_PATTERN, slugify } from '@/lib/slug'

describe('slugify', () => {
  test.each([
    ['HUT RI 80', 'hut-ri-80'],
    ['Kampanye   Keren!!', 'kampanye-keren'],
    ['  Spasi Di Tepi  ', 'spasi-di-tepi'],
    ['Café Ñoño', 'cafe-nono'],
    ['Sudah-Berbentuk-Slug', 'sudah-berbentuk-slug'],
  ])('mengubah %p menjadi %p', (masuk, keluar) => {
    expect(slugify(masuk)).toBe(keluar)
  })

  test.each([
    ['string kosong', ''],
    ['hanya tanda baca', '!!!'],
    ['terlalu pendek', 'ab'],
    ['hanya emoji', '🎉🎉'],
  ])('jatuh ke kata cadangan untuk %s', (_label, masuk) => {
    expect(slugify(masuk)).toBe('kampanye')
  })

  test('memotong nama panjang di 60 karakter tanpa menyisakan tanda hubung di ujung', () => {
    const hasil = slugify('a'.repeat(58) + ' bagian kedua yang panjang sekali')
    expect(hasil.length).toBeLessThanOrEqual(60)
    expect(hasil.endsWith('-')).toBe(false)
  })

  test('hasilnya selalu memenuhi SLUG_PATTERN', () => {
    const contoh = ['HUT RI 80', '', '!!!', 'Café Ñoño', 'x'.repeat(200), '  ', '99']
    for (const nama of contoh) {
      expect(slugify(nama)).toMatch(SLUG_PATTERN)
    }
  })
})

describe('resolveSlug', () => {
  test('memakai slug apa adanya kalau belum terpakai', () => {
    expect(resolveSlug('hut-ri-80', [])).toBe('hut-ri-80')
  })

  test('menambah sufiks -2 saat bentrok', () => {
    expect(resolveSlug('hut-ri-80', ['hut-ri-80'])).toBe('hut-ri-80-2')
  })

  test('melompat ke -3 saat -2 juga terpakai', () => {
    expect(resolveSlug('hut-ri-80', ['hut-ri-80', 'hut-ri-80-2'])).toBe('hut-ri-80-3')
  })

  test('tidak terganggu slug lain yang kebetulan berawalan sama', () => {
    expect(resolveSlug('hut-ri', ['hut-ri-80', 'hut-ri-81'])).toBe('hut-ri')
  })

  test('tetap di bawah 60 karakter saat base sudah sepanjang batas', () => {
    const base = 'a'.repeat(60)
    const hasil = resolveSlug(base, [base])
    expect(hasil.length).toBeLessThanOrEqual(60)
    expect(hasil).toMatch(SLUG_PATTERN)
  })
})
```

- [ ] **Step 2: Jalankan test untuk memastikan gagal**

```bash
bun test tests/lib/slug.test.ts
```
Expected: FAIL — `Cannot find module '@/lib/slug'`.

- [ ] **Step 3: Tulis implementasi**

`src/lib/slug.ts`:

```ts
/**
 * Slug selalu ada dan tidak pernah null (spec 5.4). Aplikasi lama
 * membolehkan slug kosong lalu jatuh ke id numerik, sehingga satu campaign
 * punya dua URL yang sah dan dua cabang kode di setiap tempat yang
 * menyelesaikannya.
 */
export const SLUG_PATTERN = /^[a-z0-9-]{3,60}$/

const MAX_LENGTH = 60
const MIN_LENGTH = 3
/** Dipakai saat nama tidak menyisakan huruf atau angka sama sekali. */
const CADANGAN = 'kampanye'
/** Ambang penyerah: setelah sekian percobaan, pakai sufiks acak. */
const MAX_ATTEMPTS = 1000

function trimHyphens(value: string): string {
  return value.replace(/^-+|-+$/g, '')
}

export function slugify(name: string): string {
  const base = trimHyphens(
    name
      // Pisahkan huruf beraksen dari tanda diakritiknya, lalu buang tandanya:
      // "Café" → "Cafe" alih-alih "Caf". Rentangnya ditulis dengan escape
      // \u karena tanda diakritik itu sendiri tidak terlihat di editor teks.
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-'),
  ).slice(0, MAX_LENGTH)

  const rapi = trimHyphens(base)
  return rapi.length >= MIN_LENGTH ? rapi : CADANGAN
}

/** Menambahkan sufiks angka sampai slug-nya bebas: `hut-ri-80`, `hut-ri-80-2`, … */
export function resolveSlug(base: string, taken: readonly string[]): string {
  const terpakai = new Set(taken)
  if (!terpakai.has(base)) return base

  for (let n = 2; n < MAX_ATTEMPTS; n++) {
    const kandidat = withSuffix(base, `-${n}`)
    if (!terpakai.has(kandidat)) return kandidat
  }

  // Praktis tidak tercapai. Lebih baik slug jelek daripada perulangan tanpa henti.
  return withSuffix(base, `-${Date.now().toString(36)}`)
}

function withSuffix(base: string, suffix: string): string {
  return `${trimHyphens(base.slice(0, MAX_LENGTH - suffix.length))}${suffix}`
}
```

- [ ] **Step 4: Jalankan test untuk memastikan lulus**

```bash
bun test tests/lib/slug.test.ts
```
Expected: PASS, 16 test.

- [ ] **Step 5: Commit**

```bash
bun run check
git add -A
git commit -m "feat: generator slug campaign dengan penyelesaian bentrok

Penyelesaian bentrok dipisah dari database supaya bisa diuji tanpa
Postgres. Slug selalu ada dan tidak pernah null (spec 5.4)."
```

---

## Task 3: Tabel `campaigns` dan `frame_slots`

**Files:**
- Modify: `src/db/schema.ts`
- Create: `drizzle/0002_*.sql` (hasil generate, nama otomatis)

**Interfaces:**
- Consumes: tabel `user` yang sudah ada di `src/db/schema.ts:3`
- Produces: `campaigns` dan `frameSlots` diekspor dari `@/db/schema`

- [ ] **Step 1: Tambahkan tabel ke `src/db/schema.ts`**

Ganti baris import paling atas — `integer`, `real`, dan `unique` belum ada di sana:

```ts
import { boolean, index, integer, pgTable, real, text, timestamp, unique } from 'drizzle-orm/pg-core'
```

Lalu **tambahkan** di akhir berkas (jangan sentuh tabel Better Auth yang sudah ada):

```ts
export const campaigns = pgTable(
  'campaigns',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    description: text('description').default('').notNull(),
    // Satu URL kanonik per campaign. Unique-nya ditegakkan database, bukan
    // hanya oleh pemeriksaan di aplikasi — dua permintaan bersamaan dengan
    // nama sama akan lolos pemeriksaan itu.
    slug: text('slug').notNull().unique(),
    // Relatif terhadap direktori upload, mis. `frames/<id>/a1b2c3d4.png`.
    framePath: text('frame_path').notNull(),
    // Piksel asli, dibaca Sharp. Jadi acuan saat koordinat persen
    // diterjemahkan kembali ke piksel di berkas hasil.
    frameWidth: integer('frame_width').notNull(),
    frameHeight: integer('frame_height').notNull(),
    isPublic: boolean('is_public').default(true).notNull(),
    useCount: integer('use_count').default(0).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [index('campaigns_user_id_idx').on(table.userId)],
)

export const frameSlots = pgTable(
  'frame_slots',
  {
    id: text('id').primaryKey(),
    campaignId: text('campaign_id')
      .notNull()
      .references(() => campaigns.id, { onDelete: 'cascade' }),
    slotIndex: integer('slot_index').notNull(),
    // Persen 0–100 dari dimensi frame — bebas resolusi, sehingga slot yang
    // sama bekerja pada keluaran 1x, 2x, maupun 3x (spec 5.3).
    x: real('x').notNull(),
    y: real('y').notNull(),
    width: real('width').notNull(),
    height: real('height').notNull(),
    label: text('label').default('').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    index('frame_slots_campaign_id_idx').on(table.campaignId),
    // Nomor slot adalah kunci urutan yang dilihat partisipan. Dua baris
    // dengan nomor sama membuat urutannya bergantung pada kebetulan.
    unique('frame_slots_campaign_slot_unique').on(table.campaignId, table.slotIndex),
  ],
)
```

> Kolom `slot_count` yang ada di PRD sengaja **tidak** dibuat — turunan dari
> `COUNT(frame_slots)`, dan data ganda yang bisa desinkron (spec bagian 8).

- [ ] **Step 2: Generate dan jalankan migrasi**

```bash
bun run db:generate
bun run db:migrate
```
Expected: berkas SQL baru muncul di `drizzle/`, migrasi selesai tanpa error.

- [ ] **Step 3: Verifikasi tabel benar-benar ada**

```bash
psql -d openframe -c '\d campaigns'
psql -d openframe -c '\d frame_slots'
```
Expected: `campaigns` punya `slug` (unique) dan `frame_width`/`frame_height`;
`frame_slots` punya constraint `frame_slots_campaign_slot_unique` dan foreign
key ke `campaigns` dengan `ON DELETE CASCADE`.

- [ ] **Step 4: Commit**

```bash
bun run check
git add -A
git commit -m "feat: tabel campaigns dan frame_slots

Koordinat slot disimpan sebagai persen 0-100 supaya bebas resolusi.
slot_count dari PRD tidak dibuat: turunan COUNT(frame_slots) yang bisa
desinkron."
```

---

## Task 4: `server/upload.ts` — validasi Sharp dan penyimpanan berkas (TDD)

Sharp mem-parse berkasnya sendiri. `file.type` dari klien tidak dipercaya sama sekali — itu bug 9.2 di spec, dan di aplikasi lama satu-satunya penjaganya adalah header yang klien tulis sendiri.

**Files:**
- Create: `src/server/upload.ts`
- Test: `tests/server/upload.test.ts`
- Modify: `.env.example`

**Interfaces:**
- Consumes: —
- Produces:
  - `const MAX_FRAME_BYTES = 10 * 1024 * 1024`
  - `validateFrame(bytes: Buffer): Promise<{ width: number; height: number }>` — melempar `Error` berbahasa Indonesia bila ditolak
  - `saveFrame(campaignId: string, bytes: Buffer): Promise<string>` — mengembalikan jalur relatif
  - `readFrame(relativePath: string): Promise<Buffer>`
  - `deleteFrameDir(campaignId: string): Promise<void>`

- [ ] **Step 1: Tulis test yang gagal**

`tests/server/upload.test.ts`:

```ts
import { describe, expect, test } from 'bun:test'
import sharp from 'sharp'
import { MAX_FRAME_BYTES, validateFrame } from '@/server/upload'

function kanvas(width: number, height: number) {
  return sharp({
    create: { width, height, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  })
}

describe('validateFrame', () => {
  test('menerima PNG yang sah dan mengembalikan dimensinya', async () => {
    const png = await kanvas(800, 600).png().toBuffer()
    expect(await validateFrame(png)).toEqual({ width: 800, height: 600 })
  })

  test('menolak JPEG meskipun berkasnya sendiri sah', async () => {
    // Spec 9.2: yang menentukan adalah hasil parse Sharp, bukan mimetype kiriman.
    const jpeg = await kanvas(800, 600).jpeg().toBuffer()
    expect(validateFrame(jpeg)).rejects.toThrow(/PNG/)
  })

  test('menolak berkas yang bukan gambar sama sekali', async () => {
    expect(validateFrame(Buffer.from('ini bukan gambar'))).rejects.toThrow(/PNG/)
  })

  test('menolak berkas di atas 10MB sebelum menyentuh Sharp', async () => {
    const kegedean = Buffer.alloc(MAX_FRAME_BYTES + 1)
    expect(validateFrame(kegedean)).rejects.toThrow(/10MB/)
  })

  test('menolak frame yang terlalu kecil untuk digambari area', async () => {
    const png = await kanvas(120, 120).png().toBuffer()
    expect(validateFrame(png)).rejects.toThrow(/minimal/)
  })

  test('menolak frame yang dimensinya tidak masuk akal', async () => {
    // Tingginya sengaja tetap sah (>= 200): kalau kedua sisi melanggar,
    // pemeriksaan minimum yang jalan lebih dulu dan test ini lulus karena
    // alasan yang salah.
    const png = await kanvas(7000, 300).png().toBuffer()
    expect(validateFrame(png)).rejects.toThrow(/maksimal/)
  })

  test('pesan penolakan berbahasa Indonesia, bukan pesan mentah Sharp', async () => {
    try {
      await validateFrame(Buffer.from('bukan gambar'))
      throw new Error('seharusnya ditolak')
    } catch (error) {
      expect((error as Error).message).toBe('Frame harus berkas PNG yang valid')
    }
  })
})
```

- [ ] **Step 2: Jalankan test untuk memastikan gagal**

```bash
bun test tests/server/upload.test.ts
```
Expected: FAIL — `Cannot find module '@/server/upload'`.

- [ ] **Step 3: Tulis implementasi**

`src/server/upload.ts`:

```ts
import { randomBytes } from 'node:crypto'
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { dirname, resolve, sep } from 'node:path'
import sharp from 'sharp'

/** PRD US-02. Diperiksa sebelum Sharp supaya berkas raksasa tidak sempat di-parse. */
export const MAX_FRAME_BYTES = 10 * 1024 * 1024
/** Di bawah ini area 20px sudah lebih dari seperlima frame — tidak bisa dipakai. */
const MIN_FRAME_PX = 200
/** Batas atas supaya satu unggahan tidak menghabiskan memori proses. */
const MAX_FRAME_PX = 6000

/**
 * Berkas disimpan di luar webroot dan hanya bisa dijangkau lewat route
 * `/api/frame/$id`, sehingga direktori ini tidak pernah bisa dijelajahi.
 */
const UPLOAD_ROOT = resolve(process.env.UPLOAD_DIR ?? 'uploads')

const DITOLAK = 'Frame harus berkas PNG yang valid'

export async function validateFrame(bytes: Buffer): Promise<{ width: number; height: number }> {
  if (bytes.byteLength > MAX_FRAME_BYTES) throw new Error('Ukuran frame maksimal 10MB')

  let metadata: sharp.Metadata
  try {
    metadata = await sharp(bytes).metadata()
  } catch {
    // Spec 9.2: aplikasi lama hanya memeriksa `file.mimetype`, yang dikirim
    // klien dan bisa diisi apa saja. Di sini Sharp yang mem-parse berkasnya,
    // jadi klaim klien tidak berpengaruh sama sekali.
    throw new Error(DITOLAK)
  }

  if (metadata.format !== 'png') throw new Error(DITOLAK)

  const { width, height } = metadata
  if (!width || !height) throw new Error(DITOLAK)
  if (width < MIN_FRAME_PX || height < MIN_FRAME_PX) {
    throw new Error(`Frame minimal ${MIN_FRAME_PX}x${MIN_FRAME_PX} piksel`)
  }
  if (width > MAX_FRAME_PX || height > MAX_FRAME_PX) {
    throw new Error(`Frame maksimal ${MAX_FRAME_PX}x${MAX_FRAME_PX} piksel`)
  }

  return { width, height }
}

/**
 * Menerjemahkan jalur relatif dari database menjadi jalur absolut, sambil
 * memastikan hasilnya tetap di dalam direktori upload. Jalurnya memang berasal
 * dari database, bukan dari URL — tapi satu baris rusak di sana tidak boleh
 * berarti berkas apa pun di disk bisa disajikan.
 */
export function frameAbsolutePath(relativePath: string): string {
  const absolute = resolve(UPLOAD_ROOT, relativePath)
  if (!absolute.startsWith(`${UPLOAD_ROOT}${sep}`)) throw new Error('Jalur berkas tidak sah')
  return absolute
}

/**
 * Nama berkas diacak, bukan tetap `original.png`. Saat frame diganti (Fase 7)
 * jalurnya ikut berubah, sehingga ETag di route penyaji berubah dan browser
 * tidak menyajikan gambar lama dari cache.
 */
export async function saveFrame(campaignId: string, bytes: Buffer): Promise<string> {
  const relativePath = `frames/${campaignId}/${randomBytes(4).toString('hex')}.png`
  const absolute = frameAbsolutePath(relativePath)
  await mkdir(dirname(absolute), { recursive: true })
  // Ditulis apa adanya, tanpa re-encode: itulah yang menjaga alpha channel
  // frame tetap utuh (PRD US-02).
  await writeFile(absolute, bytes)
  return relativePath
}

export async function readFrame(relativePath: string): Promise<Buffer> {
  return await readFile(frameAbsolutePath(relativePath))
}

/** Dipakai sebagai kompensasi saat penyimpanan database gagal, dan saat hapus campaign. */
export async function deleteFrameDir(campaignId: string): Promise<void> {
  await rm(frameAbsolutePath(`frames/${campaignId}`), { recursive: true, force: true })
}
```

- [ ] **Step 4: Jalankan test untuk memastikan lulus**

```bash
bun test tests/server/upload.test.ts
```
Expected: PASS, 7 test.

- [ ] **Step 5: Catat variabel environment baru**

Tambahkan satu baris ke `.env.example`:

```
UPLOAD_DIR=./uploads
```

`.env` lokal boleh dibiarkan tanpa baris ini — nilai bawaan `./uploads` sudah
benar untuk pengembangan, dan `uploads` sudah ada di `.gitignore`.

- [ ] **Step 6: Commit**

```bash
bun run check
git add -A
git commit -m "feat: validasi frame lewat Sharp dan penyimpanan berkas

Sharp yang mem-parse berkasnya, bukan mimetype kiriman klien (spec 9.2).
Nama berkas diacak supaya penggantian frame tidak tersaji dari cache.
Berkas ditulis apa adanya supaya alpha channel tetap utuh."
```

---

## Task 5: Server function campaign

Empat fungsi sekaligus karena keempatnya berbagi skema Zod dan aturan kepemilikan yang sama; memisahkannya berarti menyalin blok validasi yang identik.

**Files:**
- Modify: `src/server/session.ts`
- Create: `src/server/campaigns.ts`

**Interfaces:**
- Consumes: `db` (`@/db`), `campaigns`/`frameSlots` (Task 3), `isValidSlot` (Task 1), `slugify`/`resolveSlug` (Task 2), `validateFrame`/`saveFrame`/`deleteFrameDir` (Task 4)
- Produces:
  - `requireUserId(): Promise<string>` dari `@/server/session`
  - `createCampaign` — input `FormData` (`frame`, `name`, `description`, `isPublic`, `slots`), keluaran `{ id: string; slug: string }`
  - `listMyCampaigns` — keluaran `{ id, name, slug, isPublic, useCount, slotCount, createdAt }[]`
  - `getCampaignForEdit` — input `{ id: string }`, keluaran `{ id, name, description, slug, isPublic, frameWidth, frameHeight, slots: { x, y, width, height, label }[] }`
  - `updateCampaign` — input `{ id, name, description, isPublic, slots }`, keluaran `{ ok: true }`

- [ ] **Step 1: Tambahkan `requireUserId` ke `src/server/session.ts`**

Tambahkan di akhir berkas, di bawah `getSession` yang sudah ada:

```ts
/**
 * Dipakai DI DALAM handler server function untuk tahu siapa pemilik data.
 *
 * Sengaja bukan server function sendiri: `userId` tidak boleh melintasi kabel
 * ke klien. Alasannya sama dengan proyeksi di `getSession` di atas — apa pun
 * yang dikembalikan server function ikut terserialisasi ke payload hidrasi.
 */
export async function requireUserId(): Promise<string> {
  const session = await auth.api.getSession({ headers: getRequestHeaders() })
  if (!session) throw new Error('Kamu harus masuk dulu')
  return session.user.id
}
```

- [ ] **Step 2: Tulis `src/server/campaigns.ts`**

```ts
import { randomUUID } from 'node:crypto'
import { createServerFn } from '@tanstack/react-start'
import { and, count, desc, eq, like, or } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '@/db'
import { campaigns, frameSlots } from '@/db/schema'
import { isValidSlot } from '@/lib/geometry'
import { resolveSlug, slugify } from '@/lib/slug'
import { requireUserId } from '@/server/session'
import { deleteFrameDir, saveFrame, validateFrame } from '@/server/upload'

/* --- Skema bersama ------------------------------------------------------ */

// `crypto.randomUUID()` selalu menghasilkan UUID v4, jadi pola ini cocok
// untuk semua id yang kita terbitkan sendiri.
const idSchema = z
  .string()
  .regex(
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    'Kampanye tidak ditemukan',
  )

const slotSchema = z.object({
  x: z.number(),
  y: z.number(),
  width: z.number(),
  height: z.number(),
  label: z.string().max(40, 'Label area maksimal 40 karakter').default(''),
})

const detailSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, 'Nama kampanye minimal 3 karakter')
    .max(80, 'Nama kampanye maksimal 80 karakter'),
  description: z.string().trim().max(500, 'Deskripsi maksimal 500 karakter').default(''),
  isPublic: z.boolean(),
  // Fase 2 hanya membuat satu slot lewat UI, tapi bentuk datanya memang array
  // (tabel frame_slots). Batas 20 mengikuti PRD US-02.
  slots: z
    .array(slotSchema)
    .min(1, 'Tentukan minimal satu area foto')
    .max(20, 'Maksimal 20 area foto'),
})

/** Pesan yang sama untuk "tidak ada" dan "bukan milikmu" — keberadaan campaign orang lain tidak bocor. */
const TIDAK_DITEMUKAN = 'Kampanye tidak ditemukan'
const AREA_TIDAK_SAH = 'Area foto harus berada di dalam frame dan minimal 20x20 piksel'

function assertSlotsFit(
  slots: readonly { x: number; y: number; width: number; height: number }[],
  frame: { width: number; height: number },
): void {
  // Klien sudah mencegah ini lewat editor, tapi klien bukan penjaga —
  // permintaannya bisa dibuat tangan (spec bagian 10).
  for (const slot of slots) {
    if (!isValidSlot(slot, frame)) throw new Error(AREA_TIDAK_SAH)
  }
}

function slotRows(campaignId: string, slots: z.infer<typeof detailSchema>['slots']) {
  return slots.map((slot, i) => ({
    id: randomUUID(),
    campaignId,
    slotIndex: i + 1,
    x: slot.x,
    y: slot.y,
    width: slot.width,
    height: slot.height,
    label: slot.label,
  }))
}

/* --- createCampaign ----------------------------------------------------- */

function parseCreateInput(input: unknown) {
  // Berkas dan field menyatu dalam satu FormData supaya penyimpanannya satu
  // langkah. Tidak ada endpoint unggah terpisah, jadi tidak ada berkas yatim
  // yang perlu dibersihkan kalau creator kabur di tengah jalan.
  if (!(input instanceof FormData)) throw new Error('Kiriman tidak sah')

  const frame = input.get('frame')
  if (!(frame instanceof File) || frame.size === 0) throw new Error('Frame PNG wajib diunggah')

  let slots: unknown
  try {
    slots = JSON.parse(String(input.get('slots') ?? '[]'))
  } catch {
    throw new Error('Data area foto rusak, coba muat ulang halaman')
  }

  return {
    frame,
    ...detailSchema.parse({
      name: String(input.get('name') ?? ''),
      description: String(input.get('description') ?? ''),
      isPublic: input.get('isPublic') === 'true',
      slots,
    }),
  }
}

export const createCampaign = createServerFn({ method: 'POST' })
  .validator(parseCreateInput)
  .handler(async ({ data }) => {
    const userId = await requireUserId()

    const bytes = Buffer.from(await data.frame.arrayBuffer())
    const frame = await validateFrame(bytes)
    assertSlotsFit(data.slots, frame)

    const base = slugify(data.name)
    const mirip = await db
      .select({ slug: campaigns.slug })
      .from(campaigns)
      .where(or(eq(campaigns.slug, base), like(campaigns.slug, `${base}-%`)))
    const slug = resolveSlug(
      base,
      mirip.map((row) => row.slug),
    )

    const id = randomUUID()
    const framePath = await saveFrame(id, bytes)

    try {
      await db.transaction(async (tx) => {
        await tx.insert(campaigns).values({
          id,
          userId,
          name: data.name,
          description: data.description,
          slug,
          framePath,
          frameWidth: frame.width,
          frameHeight: frame.height,
          isPublic: data.isPublic,
        })
        await tx.insert(frameSlots).values(slotRows(id, data.slots))
      })
    } catch (error) {
      // Berkas sudah telanjur ditulis sebelum transaksi. Kalau transaksinya
      // gagal, hapus lagi — kalau tidak, direktori upload menumpuk frame yang
      // tidak dirujuk baris mana pun dan tidak ada yang tahu boleh dihapus.
      await deleteFrameDir(id)

      // Celah antara SELECT slug di atas dan INSERT ini: dua permintaan dengan
      // nama sama bisa sama-sama lolos pemeriksaan lalu bertabrakan di
      // constraint. Jarang, dan pengguna bisa langsung mencoba lagi.
      if (error instanceof Error && error.message.includes('campaigns_slug_unique')) {
        throw new Error('Nama itu barusan dipakai orang lain. Ganti sedikit, lalu simpan lagi.')
      }
      throw error
    }

    return { id, slug }
  })

/* --- listMyCampaigns ---------------------------------------------------- */

export const listMyCampaigns = createServerFn({ method: 'GET' }).handler(async () => {
  const userId = await requireUserId()

  const rows = await db
    .select({
      id: campaigns.id,
      name: campaigns.name,
      slug: campaigns.slug,
      isPublic: campaigns.isPublic,
      useCount: campaigns.useCount,
      createdAt: campaigns.createdAt,
      slotCount: count(frameSlots.id),
    })
    .from(campaigns)
    .leftJoin(frameSlots, eq(frameSlots.campaignId, campaigns.id))
    .where(eq(campaigns.userId, userId))
    .groupBy(campaigns.id)
    .orderBy(desc(campaigns.createdAt))

  // `userId` sengaja tidak ikut: tidak dipakai UI, dan apa pun yang
  // dikembalikan server function terlihat di payload hidrasi.
  return rows.map((row) => ({ ...row, createdAt: row.createdAt.toISOString() }))
})

/* --- getCampaignForEdit ------------------------------------------------- */

export const getCampaignForEdit = createServerFn({ method: 'GET' })
  .validator((input: unknown) => z.object({ id: idSchema }).parse(input))
  .handler(async ({ data }) => {
    const userId = await requireUserId()

    // Spec 9.1: aplikasi lama mengambil data lewat endpoint publik yang
    // menolak campaign private tanpa memeriksa pemiliknya, sehingga pemilik
    // terkunci dari campaign private-nya sendiri. Kepemilikan ikut ke dalam
    // WHERE, jadi tidak ada cabang kode yang bisa lupa memeriksanya.
    const [row] = await db
      .select({
        id: campaigns.id,
        name: campaigns.name,
        description: campaigns.description,
        slug: campaigns.slug,
        isPublic: campaigns.isPublic,
        frameWidth: campaigns.frameWidth,
        frameHeight: campaigns.frameHeight,
      })
      .from(campaigns)
      .where(and(eq(campaigns.id, data.id), eq(campaigns.userId, userId)))
      .limit(1)

    if (!row) throw new Error(TIDAK_DITEMUKAN)

    const slots = await db
      .select({
        x: frameSlots.x,
        y: frameSlots.y,
        width: frameSlots.width,
        height: frameSlots.height,
        label: frameSlots.label,
      })
      .from(frameSlots)
      .where(eq(frameSlots.campaignId, row.id))
      .orderBy(frameSlots.slotIndex)

    return { ...row, slots }
  })

/* --- updateCampaign ----------------------------------------------------- */

export const updateCampaign = createServerFn({ method: 'POST' })
  .validator((input: unknown) => detailSchema.extend({ id: idSchema }).parse(input))
  .handler(async ({ data }) => {
    const userId = await requireUserId()

    const [existing] = await db
      .select({ frameWidth: campaigns.frameWidth, frameHeight: campaigns.frameHeight })
      .from(campaigns)
      .where(and(eq(campaigns.id, data.id), eq(campaigns.userId, userId)))
      .limit(1)

    if (!existing) throw new Error(TIDAK_DITEMUKAN)

    assertSlotsFit(data.slots, { width: existing.frameWidth, height: existing.frameHeight })

    await db.transaction(async (tx) => {
      // `slug` sengaja TIDAK ikut diperbarui saat nama berubah. Tautan yang
      // sudah dibagikan creator harus tetap hidup; slug adalah alamat, bukan
      // cerminan nama.
      await tx
        .update(campaigns)
        .set({
          name: data.name,
          description: data.description,
          isPublic: data.isPublic,
          updatedAt: new Date(),
        })
        .where(eq(campaigns.id, data.id))

      // Hapus-lalu-tulis, bukan diff. Slot tidak punya identitas yang berarti
      // di luar nomor urutnya, dan keduanya dalam satu transaksi.
      await tx.delete(frameSlots).where(eq(frameSlots.campaignId, data.id))
      await tx.insert(frameSlots).values(slotRows(data.id, data.slots))
    })

    return { ok: true as const }
  })
```

- [ ] **Step 3: Pastikan tipe dan lint bersih**

```bash
bun run check
bun run typecheck
```
Expected: keduanya tanpa error.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: server function CRUD campaign

Kepemilikan masuk ke dalam WHERE, bukan pemeriksaan terpisah, supaya
tidak ada cabang kode yang bisa lupa (spec 9.1). Koordinat slot
divalidasi ulang di server. Slug tidak berubah saat nama diubah supaya
tautan yang sudah dibagikan tetap hidup."
```

---

## Task 6: Route penyaji frame

Frame disimpan di luar webroot, jadi butuh satu route untuk menyajikannya. Route ini juga yang dipakai `<img>` di dashboard, halaman edit, dan (Fase 3) halaman partisipan.

**Files:**
- Create: `src/routes/api/frame.$id.ts`

**Interfaces:**
- Consumes: `db`, `campaigns` (Task 3), `readFrame` (Task 4)
- Produces: `GET /api/frame/<campaignId>` → `image/png`

- [ ] **Step 1: Tulis route**

`src/routes/api/frame.$id.ts`:

```ts
import { createFileRoute } from '@tanstack/react-router'
import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { campaigns } from '@/db/schema'
import { readFrame } from '@/server/upload'

/* Fungsi, bukan satu objek Response yang dipakai ulang: badan Response hanya
   bisa dibaca sekali, jadi objek modul-level akan gagal pada permintaan kedua. */
function tidakDitemukan(): Response {
  return new Response('Tidak ditemukan', { status: 404 })
}

export const Route = createFileRoute('/api/frame/$id')({
  server: {
    handlers: {
      GET: async ({ params, request }: { params: { id: string }; request: Request }) => {
        const [row] = await db
          .select({ framePath: campaigns.framePath })
          .from(campaigns)
          .where(eq(campaigns.id, params.id))
          .limit(1)

        // Frame memang publik — ia tampil di halaman campaign dan bisa diunduh
        // siapa pun dari network tab (spec 3.1). Jadi tidak ada pemeriksaan
        // sesi di sini; yang penting hanya jalurnya berasal dari database.
        if (!row) return tidakDitemukan()

        // Jalur berkas berubah setiap frame diganti, jadi ia sekaligus
        // penanda versi. Tanpa ini, `max-age` apa pun akan menyajikan gambar
        // lama setelah frame diganti karena URL-nya tetap sama.
        const etag = `"${row.framePath}"`
        if (request.headers.get('if-none-match') === etag) {
          return new Response(null, { status: 304 })
        }

        let bytes: Buffer
        try {
          bytes = await readFrame(row.framePath)
        } catch {
          // Baris ada tapi berkasnya hilang — perlakukan sama dengan tidak ada.
          return tidakDitemukan()
        }

        return new Response(bytes, {
          headers: {
            'Content-Type': 'image/png',
            'Cache-Control': 'public, max-age=60, must-revalidate',
            ETag: etag,
          },
        })
      },
    },
  },
})
```

- [ ] **Step 2: Verifikasi route terpasang**

```bash
bun dev
```
Di terminal lain:
```bash
curl -s -o /dev/null -w '%{http_code}\n' http://localhost:3000/api/frame/bukan-id-yang-ada
```
Expected: `404`. (Frame sungguhan diuji di Task 8 setelah ada campaign.)

- [ ] **Step 3: Commit**

```bash
bun run check
git add -A
git commit -m "feat: route penyaji frame PNG dari direktori upload

ETag diturunkan dari jalur berkas, yang berubah setiap frame diganti,
supaya penggantian frame tidak tersaji dari cache browser."
```

---

## Task 7: Komponen area editor

Overlay SVG di atas `<img>` frame. Nol dependensi tambahan — Fabric.js dibuang di spec 3.1.

Kuncinya: SVG memakai `viewBox` seukuran **piksel tampilan**, bukan `0 0 100 100`. Dengan viewBox persen, frame yang tidak persegi akan meregangkan pegangan resize jadi elips dan menebalkan garis di satu sumbu saja. Piksel tampilan didapat dari `ResizeObserver`, lalu `geometry.toPixels` yang menerjemahkan slot ke sana — persis pemakaian yang sama seperti compositing nanti, hanya beda `FrameSize`.

**Files:**
- Create: `src/components/area-editor/use-element-size.ts`
- Create: `src/components/area-editor/use-drag-resize.ts`
- Create: `src/components/area-editor/slot-rect.tsx`
- Create: `src/components/area-editor/area-editor.tsx`

**Interfaces:**
- Consumes: `SlotRect`, `PixelRect`, `FrameSize`, `DragMode`, `toPixels`, `deltaToPercent`, `applyDrag`, `isValidSlot` (Task 1)
- Produces:
  - `useElementSize(ref): FrameSize`
  - `useDragResize({ slots, display, onChange }): { begin, move, end, nudge }`
  - `<SlotRect />` — satu kotak SVG
  - `<AreaEditor frameSrc frameSize slots onChange selectedIndex onSelect />`

- [ ] **Step 1: Tulis `src/components/area-editor/use-element-size.ts`**

```ts
import { type RefObject, useEffect, useState } from 'react'
import type { FrameSize } from '@/lib/geometry'

/**
 * Ukuran render sebuah elemen dalam piksel CSS.
 *
 * Ukurannya berubah dua kali di luar kendali kita: saat gambar frame selesai
 * dimuat, dan saat jendela diubah ukurannya. Membacanya sekali lewat
 * `getBoundingClientRect` akan menjebak editor pada ukuran yang salah.
 */
export function useElementSize(ref: RefObject<HTMLElement | null>): FrameSize {
  const [size, setSize] = useState<FrameSize>({ width: 0, height: 0 })

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const observer = new ResizeObserver((entries) => {
      const box = entries[0]?.contentRect
      if (box) setSize({ width: box.width, height: box.height })
    })
    observer.observe(element)
    return () => observer.disconnect()
  }, [ref])

  return size
}
```

- [ ] **Step 2: Tulis `src/components/area-editor/use-drag-resize.ts`**

```ts
import { type PointerEvent as ReactPointerEvent, useRef } from 'react'
import { applyDrag, deltaToPercent, type DragMode, type FrameSize, type SlotRect } from '@/lib/geometry'

type Params = {
  slots: readonly SlotRect[]
  /** Ukuran gambar frame seperti yang dirender di layar, dalam piksel CSS. */
  display: FrameSize
  onChange: (slots: SlotRect[]) => void
}

type DragState = {
  index: number
  mode: DragMode
  pointerId: number
  startX: number
  startY: number
  /** Kotak saat tarikan dimulai. Delta selalu dihitung dari sini, bukan bertahap. */
  start: SlotRect
}

export function useDragResize({ slots, display, onChange }: Params) {
  // Ref, bukan state: tarikan yang sedang berjalan tidak perlu memicu render
  // sendiri — render dipicu oleh onChange yang mengubah slot.
  const dragRef = useRef<DragState | null>(null)

  function replace(index: number, next: SlotRect) {
    onChange(slots.map((slot, i) => (i === index ? next : slot)))
  }

  function begin(index: number, mode: DragMode, event: ReactPointerEvent) {
    const slot = slots[index]
    if (!slot) return

    event.preventDefault()
    event.stopPropagation()
    // Pointer capture membuat pointermove tetap terkirim ke elemen ini
    // walaupun kursor sudah keluar dari kotak — tanpa itu tarikan cepat
    // "lepas" di tengah jalan.
    event.currentTarget.setPointerCapture(event.pointerId)

    dragRef.current = {
      index,
      mode,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      start: slot,
    }
  }

  function move(event: ReactPointerEvent) {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== event.pointerId) return

    // Selalu dari posisi awal, bukan dari frame sebelumnya. Akumulasi delta
    // per-frame akan menumpuk galat pembulatan sepanjang tarikan.
    const delta = deltaToPercent(event.clientX - drag.startX, event.clientY - drag.startY, display)
    replace(drag.index, applyDrag(drag.start, drag.mode, delta.dx, delta.dy))
  }

  function end(event: ReactPointerEvent) {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== event.pointerId) return

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    dragRef.current = null
  }

  /** Jalur keyboard: satu langkah papan ketik setara satu tarikan kecil. */
  function nudge(index: number, mode: DragMode, dx: number, dy: number) {
    const slot = slots[index]
    if (!slot) return
    replace(index, applyDrag(slot, mode, dx, dy))
  }

  return { begin, move, end, nudge }
}
```

- [ ] **Step 3: Tulis `src/components/area-editor/slot-rect.tsx`**

```tsx
import type { PointerEvent as ReactPointerEvent } from 'react'
import type { DragMode, PixelRect } from '@/lib/geometry'

/** Sisi pegangan resize dalam piksel tampilan. */
const HANDLE = 10

/**
 * Delapan pegangan: 4 sudut + 4 sisi. `fx`/`fy` adalah posisinya sebagai
 * pecahan dari kotak, jadi satu daftar ini melayani kotak ukuran apa pun.
 */
const HANDLES: ReadonlyArray<{ mode: DragMode; fx: number; fy: number; cursor: string; label: string }> = [
  { mode: 'nw', fx: 0, fy: 0, cursor: 'nwse-resize', label: 'kiri atas' },
  { mode: 'n', fx: 0.5, fy: 0, cursor: 'ns-resize', label: 'atas' },
  { mode: 'ne', fx: 1, fy: 0, cursor: 'nesw-resize', label: 'kanan atas' },
  { mode: 'e', fx: 1, fy: 0.5, cursor: 'ew-resize', label: 'kanan' },
  { mode: 'se', fx: 1, fy: 1, cursor: 'nwse-resize', label: 'kanan bawah' },
  { mode: 's', fx: 0.5, fy: 1, cursor: 'ns-resize', label: 'bawah' },
  { mode: 'sw', fx: 0, fy: 1, cursor: 'nesw-resize', label: 'kiri bawah' },
  { mode: 'w', fx: 0, fy: 0.5, cursor: 'ew-resize', label: 'kiri' },
]

type Props = {
  index: number
  /** Kotak dalam piksel tampilan, sudah diterjemahkan lewat geometry.toPixels. */
  rect: PixelRect
  isSelected: boolean
  isValid: boolean
  onSelect: () => void
  onHandleDown: (mode: DragMode, event: ReactPointerEvent) => void
  onKeyDown: (event: React.KeyboardEvent) => void
}

export function SlotRect({
  index,
  rect,
  isSelected,
  isValid,
  onSelect,
  onHandleDown,
  onKeyDown,
}: Props) {
  const stroke = isValid ? 'var(--color-accent)' : 'var(--color-danger)'

  return (
    <g>
      <rect
        x={rect.x}
        y={rect.y}
        width={rect.width}
        height={rect.height}
        fill={isValid ? 'rgb(202 255 51 / 0.16)' : 'rgb(255 77 77 / 0.16)'}
        stroke={stroke}
        strokeWidth={2}
        strokeDasharray={isSelected ? undefined : '6 4'}
        style={{ cursor: 'move', touchAction: 'none', outline: 'none' }}
        tabIndex={0}
        role="button"
        aria-label={`Area foto ${index + 1}. Panah untuk menggeser, Shift+panah untuk mengubah ukuran.`}
        onFocus={onSelect}
        onPointerDown={(event) => {
          onSelect()
          onHandleDown('move', event)
        }}
        onKeyDown={onKeyDown}
      />

      <text
        x={rect.x + 8}
        y={rect.y + 20}
        fill={stroke}
        fontSize={13}
        fontWeight={700}
        style={{ pointerEvents: 'none', userSelect: 'none' }}
      >
        {index + 1}
      </text>

      {isSelected &&
        HANDLES.map((handle) => (
          <rect
            key={handle.mode}
            x={rect.x + handle.fx * rect.width - HANDLE / 2}
            y={rect.y + handle.fy * rect.height - HANDLE / 2}
            width={HANDLE}
            height={HANDLE}
            rx={2}
            fill="var(--color-bg)"
            stroke={stroke}
            strokeWidth={2}
            style={{ cursor: handle.cursor, touchAction: 'none' }}
            aria-label={`Ubah ukuran dari ${handle.label}`}
            onPointerDown={(event) => onHandleDown(handle.mode, event)}
          />
        ))}
    </g>
  )
}
```

- [ ] **Step 4: Tulis `src/components/area-editor/area-editor.tsx`**

```tsx
import { useRef } from 'react'
import { type FrameSize, isValidSlot, type SlotRect as Rect, toPixels } from '@/lib/geometry'
import { SlotRect } from './slot-rect'
import { useDragResize } from './use-drag-resize'
import { useElementSize } from './use-element-size'

/** Satu tekan panah menggeser sebesar ini, dalam persen. */
const NUDGE = 1

type Props = {
  frameSrc: string
  /** Dimensi asli frame dalam piksel — dipakai memeriksa ukuran minimum slot. */
  frameSize: FrameSize
  slots: readonly Rect[]
  onChange: (slots: Rect[]) => void
  selectedIndex: number
  onSelect: (index: number) => void
}

export function AreaEditor({
  frameSrc,
  frameSize,
  slots,
  onChange,
  selectedIndex,
  onSelect,
}: Props) {
  const imageRef = useRef<HTMLImageElement>(null)
  // Piksel tampilan, bukan piksel asli: gambar frame dilebarkan mengikuti
  // kolomnya. Slot tersimpan dalam persen, jadi keduanya tetap sepakat.
  const display = useElementSize(imageRef)
  const drag = useDragResize({ slots, display, onChange })

  function handleKeyDown(index: number, event: React.KeyboardEvent) {
    const arah: Record<string, [number, number]> = {
      ArrowLeft: [-NUDGE, 0],
      ArrowRight: [NUDGE, 0],
      ArrowUp: [0, -NUDGE],
      ArrowDown: [0, NUDGE],
    }
    const langkah = arah[event.key]
    if (!langkah) return

    event.preventDefault()
    // Shift menahan sudut kiri-atas dan menggerakkan sudut kanan-bawah,
    // sehingga panah yang sama bisa dipakai untuk mengubah ukuran.
    drag.nudge(index, event.shiftKey ? 'se' : 'move', langkah[0], langkah[1])
  }

  return (
    <div className="relative select-none overflow-hidden rounded-card border border-border bg-surface2">
      {/* Gambar frame yang jadi latar. Dekoratif: informasinya sudah ada di
          nama campaign dan label tiap area. */}
      <img
        ref={imageRef}
        src={frameSrc}
        alt=""
        draggable={false}
        className="block w-full"
        // Checkerboard supaya bagian transparan PNG terlihat sebagai transparan,
        // bukan sebagai putih atau hitam.
        style={{
          backgroundImage:
            'linear-gradient(45deg, var(--color-border) 25%, transparent 25%), linear-gradient(-45deg, var(--color-border) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, var(--color-border) 75%), linear-gradient(-45deg, transparent 75%, var(--color-border) 75%)',
          backgroundSize: '16px 16px',
          backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0',
        }}
      />

      <svg
        className="absolute inset-0 h-full w-full"
        width={display.width}
        height={display.height}
        viewBox={`0 0 ${display.width || 1} ${display.height || 1}`}
        style={{ touchAction: 'none' }}
        onPointerMove={drag.move}
        onPointerUp={drag.end}
        onPointerCancel={drag.end}
        aria-label="Area foto di atas frame"
      >
        <title>Area foto</title>
        {slots.map((slot, index) => (
          <SlotRect
            // Slot belum punya id sampai tersimpan; urutannya yang jadi
            // identitas, dan urutan itu memang tidak berubah saat digeser.
            // biome-ignore lint/suspicious/noArrayIndexKey: lihat catatan di atas
            key={index}
            index={index}
            rect={toPixels(slot, display)}
            isSelected={index === selectedIndex}
            isValid={isValidSlot(slot, frameSize)}
            onSelect={() => onSelect(index)}
            onHandleDown={(mode, event) => drag.begin(index, mode, event)}
            onKeyDown={(event) => handleKeyDown(index, event)}
          />
        ))}
      </svg>
    </div>
  )
}
```

- [ ] **Step 5: Pastikan tipe dan lint bersih**

```bash
bun run check
bun run typecheck
```
Expected: keduanya tanpa error. Kalau Biome mengeluhkan `noArrayIndexKey`,
periksa komentar `biome-ignore` berada **persis** di baris sebelum `key`.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: area editor SVG dengan drag, resize, dan jalur keyboard

viewBox mengikuti piksel tampilan, bukan persen, supaya pegangan resize
tidak meregang pada frame yang tidak persegi. Seluruh matematikanya
dipinjam dari lib/geometry."
```

---

## Task 8: Route `/buat` — buat campaign

**Files:**
- Create: `src/routes/buat.tsx`

**Interfaces:**
- Consumes: `getSession` (`@/server/session`), `createCampaign` (Task 5), `AreaEditor` (Task 7), `MIN_SLOT_PX`/`SlotRect` (Task 1), `pesanError` (`@/lib/pesan-error`)
- Produces: halaman `/buat`

- [ ] **Step 1: Tulis route**

`src/routes/buat.tsx`:

```tsx
import { createFileRoute, Link, redirect, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { AreaEditor } from '@/components/area-editor/area-editor'
import { ThemeToggle } from '@/components/theme-toggle'
import { type FrameSize, isValidSlot, type SlotRect } from '@/lib/geometry'
import { pesanError } from '@/lib/pesan-error'
import { createCampaign } from '@/server/campaigns'
import { getSession } from '@/server/session'

/** Cermin dari MAX_FRAME_BYTES di server — di sini hanya supaya pesannya cepat muncul. */
const MAX_BYTES = 10 * 1024 * 1024

/** Area awal: kotak di tengah frame, cukup besar untuk langsung terlihat. */
const SLOT_AWAL: SlotRect = { x: 20, y: 20, width: 60, height: 60 }

export const Route = createFileRoute('/buat')({
  beforeLoad: async () => {
    const session = await getSession()
    if (!session) throw redirect({ to: '/login' })
    return { username: session.user.username }
  },
  component: BuatPage,
})

function BuatPage() {
  const navigate = useNavigate()
  const [file, setFile] = useState<File | null>(null)
  const [frameSrc, setFrameSrc] = useState('')
  const [frameSize, setFrameSize] = useState<FrameSize>({ width: 0, height: 0 })
  const [slots, setSlots] = useState<SlotRect[]>([SLOT_AWAL])
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isPublic, setIsPublic] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  // Object URL memegang berkasnya di memori sampai dicabut. Tanpa ini, memilih
  // beberapa frame berturut-turut menahan semuanya sekaligus.
  useEffect(() => {
    if (!frameSrc) return
    return () => URL.revokeObjectURL(frameSrc)
  }, [frameSrc])

  function handleFile(chosen: File | undefined) {
    if (!chosen) return
    setError('')

    if (chosen.size > MAX_BYTES) {
      setError('Ukuran frame maksimal 10MB')
      return
    }
    if (chosen.type !== 'image/png') {
      // Pemeriksaan cepat supaya pengguna tidak menunggu unggahan sia-sia.
      // Penentu sesungguhnya tetap Sharp di server (spec 9.2).
      setError('Frame harus berkas PNG')
      return
    }

    const url = URL.createObjectURL(chosen)
    const probe = new Image()
    probe.onload = () => {
      setFrameSize({ width: probe.naturalWidth, height: probe.naturalHeight })
      setFrameSrc(url)
      setFile(chosen)
      setSlots([SLOT_AWAL])
    }
    probe.onerror = () => {
      URL.revokeObjectURL(url)
      setError('Frame harus berkas PNG yang valid')
    }
    probe.src = url
  }

  const areaValid = slots.every((slot) => isValidSlot(slot, frameSize))
  const bisaSimpan = Boolean(file) && name.trim().length >= 3 && areaValid && !saving

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!file) return

    setError('')
    setSaving(true)
    try {
      const form = new FormData()
      form.set('frame', file)
      form.set('name', name)
      form.set('description', description)
      form.set('isPublic', String(isPublic))
      form.set('slots', JSON.stringify(slots))

      await createCampaign({ data: form })
      navigate({ to: '/dashboard' })
    } catch (err) {
      setError(pesanError(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="mx-auto max-w-5xl p-6">
      <header className="flex items-center justify-between py-6">
        <h1 className="font-display text-2xl">Bikin Kampanye</h1>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link
            to="/dashboard"
            className="rounded-pill border border-border px-4 py-1.5 text-sm transition-colors hover:bg-surface2"
          >
            Batal
          </Link>
        </div>
      </header>

      {error && (
        <p
          role="alert"
          className="mb-4 rounded-sm border border-danger/30 bg-danger/10 p-3 text-sm text-danger"
        >
          {error}
        </p>
      )}

      <form onSubmit={handleSubmit} className="grid gap-6 md:grid-cols-[1fr_20rem]">
        <section>
          {frameSrc ? (
            <>
              <AreaEditor
                frameSrc={frameSrc}
                frameSize={frameSize}
                slots={slots}
                onChange={setSlots}
                selectedIndex={0}
                onSelect={() => undefined}
              />
              <p className="mt-3 text-sm text-muted">
                Geser kotaknya untuk memindahkan area foto, tarik pegangannya untuk mengubah ukuran.
                Bisa juga pakai panah keyboard setelah kotaknya dipilih.
              </p>
              {!areaValid && (
                <p className="mt-2 text-sm text-danger">
                  Area foto terlalu kecil. Perbesar sampai minimal 20x20 piksel pada ukuran frame
                  aslinya.
                </p>
              )}
            </>
          ) : (
            <label className="flex min-h-64 cursor-pointer flex-col items-center justify-center gap-2 rounded-card border-2 border-dashed border-border bg-surface2 p-10 text-center transition-colors hover:border-accent">
              <span className="font-display text-lg">Pilih frame PNG</span>
              <span className="text-sm text-muted">Maksimal 10MB, dengan latar transparan</span>
              <input
                type="file"
                accept="image/png"
                className="sr-only"
                onChange={(event) => handleFile(event.target.files?.[0])}
              />
            </label>
          )}
        </section>

        <aside className="flex flex-col gap-4 rounded-card border border-border bg-surface p-5">
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted">
              Nama kampanye
            </span>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
              maxLength={80}
              placeholder="HUT RI 80"
              className="w-full rounded-sm border-[1.5px] border-border bg-surface2 px-3.5 py-2.5 outline-none transition-colors focus:border-accent"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted">
              Deskripsi <span className="normal-case tracking-normal">opsional</span>
            </span>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              maxLength={500}
              rows={3}
              placeholder="Ceritakan sedikit soal kampanye ini"
              className="w-full rounded-sm border-[1.5px] border-border bg-surface2 px-3.5 py-2.5 outline-none transition-colors focus:border-accent"
            />
          </label>

          <label className="flex items-start gap-2 text-sm text-muted">
            <input
              type="checkbox"
              checked={isPublic}
              onChange={(event) => setIsPublic(event.target.checked)}
              className="mt-0.5"
            />
            Tampilkan di galeri publik
          </label>

          <button
            type="submit"
            disabled={!bisaSimpan}
            className="w-full rounded-pill bg-accent py-3 font-semibold text-bg transition-transform hover:-translate-y-px disabled:opacity-45"
          >
            {saving ? 'Menyimpan...' : 'Simpan Kampanye'}
          </button>
        </aside>
      </form>
    </main>
  )
}
```

- [ ] **Step 2: Jalankan dan buat satu campaign sungguhan**

```bash
bun dev
```

Di browser: masuk, buka `http://localhost:3000/buat`, pilih sebuah PNG
transparan, geser dan ubah ukuran kotaknya, isi nama, lalu simpan.
Expected: berpindah ke `/dashboard` tanpa error.

- [ ] **Step 3: Verifikasi data dan berkasnya benar-benar mendarat**

```bash
psql -d openframe -c "SELECT id, name, slug, frame_width, frame_height, is_public FROM campaigns;"
psql -d openframe -c "SELECT campaign_id, slot_index, x, y, width, height FROM frame_slots;"
ls -R uploads/frames
```
Expected: satu baris campaign dengan slug turunan nama, satu baris slot dengan
`slot_index = 1` dan empat koordinat persen di rentang 0–100, dan satu berkas
`.png` di bawah `uploads/frames/<id>/`.

Lunasi juga verifikasi frame sungguhan dari Task 6:
```bash
curl -s -o /dev/null -w '%{http_code} %{content_type}\n' \
  "http://localhost:3000/api/frame/$(psql -d openframe -tAc 'SELECT id FROM campaigns LIMIT 1;')"
```
Expected: `200 image/png`.

- [ ] **Step 4: Buktikan koordinat dari klien tidak dipercaya**

Kirim slot yang lebih besar dari frame lewat permintaan buatan tangan.
Ambil dulu cookie sesi dari DevTools (Application → Cookies), lalu:

```bash
curl -s -X POST 'http://localhost:3000/_serverFn/src_server_campaigns_ts--createCampaign_createServerFn_handler' \
  -H "Cookie: <tempel cookie sesi di sini>" \
  -F 'frame=@/jalur/ke/frame.png' \
  -F 'name=Percobaan Nakal' \
  -F 'description=' \
  -F 'isPublic=true' \
  -F 'slots=[{"x":0,"y":0,"width":500,"height":500,"label":""}]'
```

Expected: respons berisi pesan `Area foto harus berada di dalam frame dan
minimal 20x20 piksel`, dan `SELECT count(*) FROM campaigns` tidak bertambah.

> URL server function di atas dicetak TanStack Start di panel Network saat
> kamu menyimpan campaign lewat UI. Kalau bentuknya berbeda di versi yang
> terpasang, salin yang muncul di sana — yang diuji adalah penolakannya,
> bukan bentuk URL-nya.

Bersihkan campaign percobaan bila ada yang tersimpan:
```bash
psql -d openframe -c "DELETE FROM campaigns WHERE name = 'Percobaan Nakal';"
```

- [ ] **Step 5: Commit**

```bash
bun run check
git add -A
git commit -m "feat: halaman buat kampanye dengan pemetaan area

Berkas frame dan definisi slot dikirim dalam satu FormData supaya tidak
ada langkah unggah terpisah yang bisa meninggalkan berkas yatim."
```

---

## Task 9: Route `/edit/$id` — ubah campaign

**Files:**
- Create: `src/routes/edit.$id.tsx`

**Interfaces:**
- Consumes: `getSession`, `getCampaignForEdit`/`updateCampaign` (Task 5), `AreaEditor` (Task 7)
- Produces: halaman `/edit/<id>`

- [ ] **Step 1: Tulis route**

`src/routes/edit.$id.tsx`:

```tsx
import { createFileRoute, Link, redirect, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { AreaEditor } from '@/components/area-editor/area-editor'
import { ThemeToggle } from '@/components/theme-toggle'
import { isValidSlot, type SlotRect } from '@/lib/geometry'
import { pesanError } from '@/lib/pesan-error'
import { getCampaignForEdit, updateCampaign } from '@/server/campaigns'
import { getSession } from '@/server/session'

export const Route = createFileRoute('/edit/$id')({
  beforeLoad: async () => {
    const session = await getSession()
    if (!session) throw redirect({ to: '/login' })
    return { username: session.user.username }
  },
  // getCampaignForEdit sudah memfilter berdasarkan pemilik, jadi kampanye
  // orang lain sampai di sini sebagai "tidak ditemukan" — tidak ada cabang
  // otorisasi kedua yang perlu dijaga tetap sinkron (spec 9.1).
  loader: ({ params }) => getCampaignForEdit({ data: { id: params.id } }),
  errorComponent: () => (
    <main className="mx-auto max-w-md p-6 text-center">
      <h1 className="mb-2 mt-16 font-display text-2xl">Kampanye tidak ditemukan</h1>
      <p className="mb-6 text-muted">Mungkin sudah dihapus, atau bukan milik akun ini.</p>
      <Link to="/dashboard" className="text-accent hover:underline">
        Kembali ke dashboard
      </Link>
    </main>
  ),
  component: EditPage,
})

function EditPage() {
  const campaign = Route.useLoaderData()
  const { id } = Route.useParams()
  const navigate = useNavigate()

  const [slots, setSlots] = useState<SlotRect[]>(campaign.slots)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [name, setName] = useState(campaign.name)
  const [description, setDescription] = useState(campaign.description)
  const [isPublic, setIsPublic] = useState(campaign.isPublic)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const frameSize = { width: campaign.frameWidth, height: campaign.frameHeight }
  const areaValid = slots.every((slot) => isValidSlot(slot, frameSize))
  const bisaSimpan = name.trim().length >= 3 && areaValid && !saving

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError('')
    setSaving(true)
    try {
      await updateCampaign({
        data: {
          id,
          name,
          description,
          isPublic,
          slots: slots.map((slot) => ({ ...slot, label: '' })),
        },
      })
      navigate({ to: '/dashboard' })
    } catch (err) {
      setError(pesanError(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="mx-auto max-w-5xl p-6">
      <header className="flex items-center justify-between py-6">
        <div>
          <h1 className="font-display text-2xl">Ubah Kampanye</h1>
          {/* Slug tidak ikut berubah saat nama diubah — tautan yang sudah
              dibagikan harus tetap hidup. */}
          <p className="text-sm text-muted">/twibbon/{campaign.slug}</p>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link
            to="/dashboard"
            className="rounded-pill border border-border px-4 py-1.5 text-sm transition-colors hover:bg-surface2"
          >
            Batal
          </Link>
        </div>
      </header>

      {error && (
        <p
          role="alert"
          className="mb-4 rounded-sm border border-danger/30 bg-danger/10 p-3 text-sm text-danger"
        >
          {error}
        </p>
      )}

      <form onSubmit={handleSubmit} className="grid gap-6 md:grid-cols-[1fr_20rem]">
        <section>
          <AreaEditor
            frameSrc={`/api/frame/${id}`}
            frameSize={frameSize}
            slots={slots}
            onChange={setSlots}
            selectedIndex={selectedIndex}
            onSelect={setSelectedIndex}
          />
          <p className="mt-3 text-sm text-muted">
            Geser kotaknya untuk memindahkan area foto, tarik pegangannya untuk mengubah ukuran.
          </p>
          {!areaValid && (
            <p className="mt-2 text-sm text-danger">
              Area foto terlalu kecil. Perbesar sampai minimal 20x20 piksel pada ukuran frame
              aslinya.
            </p>
          )}
        </section>

        <aside className="flex flex-col gap-4 rounded-card border border-border bg-surface p-5">
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted">
              Nama kampanye
            </span>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
              maxLength={80}
              className="w-full rounded-sm border-[1.5px] border-border bg-surface2 px-3.5 py-2.5 outline-none transition-colors focus:border-accent"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted">
              Deskripsi <span className="normal-case tracking-normal">opsional</span>
            </span>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              maxLength={500}
              rows={3}
              className="w-full rounded-sm border-[1.5px] border-border bg-surface2 px-3.5 py-2.5 outline-none transition-colors focus:border-accent"
            />
          </label>

          <label className="flex items-start gap-2 text-sm text-muted">
            <input
              type="checkbox"
              checked={isPublic}
              onChange={(event) => setIsPublic(event.target.checked)}
              className="mt-0.5"
            />
            Tampilkan di galeri publik
          </label>

          <button
            type="submit"
            disabled={!bisaSimpan}
            className="w-full rounded-pill bg-accent py-3 font-semibold text-bg transition-transform hover:-translate-y-px disabled:opacity-45"
          >
            {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
          </button>
        </aside>
      </form>
    </main>
  )
}
```

> Mengganti berkas frame belum ada di sini. Itu Fase 7, karena butuh
> pembersihan berkas lama dan pemetaan ulang slot ke dimensi baru.

- [ ] **Step 2: Verifikasi cek kepemilikan sungguhan**

```bash
bun dev
```

1. Sebagai pengguna A, buka `/edit/<id campaign milik A>`. Expected: form
   terisi, frame tampil, kotak area berada di posisi yang tersimpan.
2. Ubah nama dan geser kotaknya, lalu simpan. Expected: kembali ke dashboard;
   `psql -d openframe -c "SELECT name, slug FROM campaigns;"` menunjukkan nama
   baru dengan **slug yang tidak berubah**.
3. Daftar pengguna B di jendela penyamaran, lalu buka `/edit/<id milik A>`.
   Expected: halaman "Kampanye tidak ditemukan" — bukan 403, dan bukan
   formulir milik A.

- [ ] **Step 3: Commit**

```bash
bun run check
git add -A
git commit -m "feat: halaman ubah kampanye dengan cek kepemilikan

Kampanye orang lain menghasilkan 'tidak ditemukan', bukan 403, supaya
keberadaannya tidak bocor. Slug tidak ikut berubah saat nama diubah."
```

---

## Task 10: Dashboard berisi daftar kampanye

**Files:**
- Modify: `src/routes/dashboard.tsx`

**Interfaces:**
- Consumes: `listMyCampaigns` (Task 5), route `/api/frame/$id` (Task 6), route `/buat` (Task 8), route `/edit/$id` (Task 9)
- Produces: `/dashboard` menampilkan kartu kampanye

- [ ] **Step 1: Ganti isi `src/routes/dashboard.tsx`**

Pertahankan `beforeLoad` dan `handleLogout` yang sudah ada; yang berubah adalah
tambahan `loader` dan isi badan halaman.

```tsx
import { createFileRoute, Link, redirect, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { ThemeToggle } from '@/components/theme-toggle'
import { authClient } from '@/lib/auth-client'
import { pesanError } from '@/lib/pesan-error'
import { listMyCampaigns } from '@/server/campaigns'
import { getSession } from '@/server/session'

export const Route = createFileRoute('/dashboard')({
  beforeLoad: async () => {
    const session = await getSession()
    if (!session) throw redirect({ to: '/login' })
    // Kembalikan HANYA yang dipakai. TanStack Start men-serialisasi apa pun
    // yang dikembalikan beforeLoad ke payload hidrasi, tak peduli komponennya
    // memakainya atau tidak. Mengembalikan `session` utuh berarti mengirim
    // email sintetis <username>@openframe.local ke sumber halaman, yang
    // membocorkan pola internal yang pengguna tidak boleh tahu ada.
    return { username: session.user.username }
  },
  loader: () => listMyCampaigns(),
  component: DashboardPage,
})

function DashboardPage() {
  const { username } = Route.useRouteContext()
  const campaigns = Route.useLoaderData()
  const navigate = useNavigate()
  const [logoutError, setLogoutError] = useState('')

  async function handleLogout() {
    setLogoutError('')
    try {
      await authClient.signOut()
      navigate({ to: '/login' })
    } catch (err) {
      // Sama seperti signIn, signOut bisa MELEMPAR saat jaringan putus —
      // tanpa blok ini tombol "Keluar" tidak melakukan apa-apa yang terlihat.
      setLogoutError(pesanError(err))
    }
  }

  return (
    <main className="mx-auto max-w-5xl p-6">
      <header className="flex flex-wrap items-center justify-between gap-3 py-6">
        <h1 className="font-display text-2xl">Kampanye Saya</h1>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <span className="rounded-pill border border-border bg-surface2 px-3 py-1 text-sm text-muted">
            👤 {username}
          </span>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-pill border border-border px-4 py-1.5 text-sm transition-colors hover:bg-surface2"
          >
            Keluar
          </button>
        </div>
      </header>

      {logoutError && (
        <p
          role="alert"
          className="mb-4 rounded-sm border border-danger/30 bg-danger/10 p-3 text-sm text-danger"
        >
          {logoutError}
        </p>
      )}

      <Link
        to="/buat"
        className="mb-6 inline-block rounded-pill bg-accent px-6 py-2.5 font-semibold text-bg transition-transform hover:-translate-y-px"
      >
        + Bikin Kampanye
      </Link>

      {campaigns.length === 0 ? (
        <p className="rounded-card border border-dashed border-border bg-surface p-10 text-center text-muted">
          Belum ada kampanye. Unggah frame PNG-mu, gambar area fotonya, lalu bagikan tautannya.
        </p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {campaigns.map((campaign) => (
            <li key={campaign.id}>
              <Link
                to="/edit/$id"
                params={{ id: campaign.id }}
                className="block overflow-hidden rounded-card border border-border bg-surface transition-colors hover:border-accent"
              >
                <img
                  src={`/api/frame/${campaign.id}`}
                  alt=""
                  loading="lazy"
                  className="aspect-square w-full bg-surface2 object-contain"
                />
                <div className="p-4">
                  <h2 className="mb-1 truncate font-display text-base">{campaign.name}</h2>
                  <p className="flex flex-wrap gap-2 text-xs text-muted">
                    {/* Aplikasi lama menampilkan badge rasio di sini. Jumlah
                        slot lebih berguna di produk multi-slot (spec bagian 8). */}
                    <span className="rounded-pill bg-surface2 px-2 py-0.5">
                      {campaign.slotCount} area
                    </span>
                    <span className="rounded-pill bg-surface2 px-2 py-0.5">
                      {campaign.isPublic ? 'Publik' : 'Privat'}
                    </span>
                    <span className="rounded-pill bg-surface2 px-2 py-0.5">
                      {campaign.useCount}x dipakai
                    </span>
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
```

> Tautan ke halaman partisipan (`/twibbon/$slug`) belum ada di kartu. Route-nya
> baru dibuat di Fase 3, dan `Link` bertipe akan menolak tujuan yang belum ada.

- [ ] **Step 2: Verifikasi di browser**

```bash
bun dev
```
Buka `/dashboard`.
Expected: kartu berisi thumbnail frame, nama, badge `1 area`, badge Publik/Privat,
dan `0x dipakai`. Klik kartu → masuk ke halaman ubah. Akun baru yang belum
punya kampanye melihat teks kosong, bukan grid kosong.

- [ ] **Step 3: Commit**

```bash
bun run check
git add -A
git commit -m "feat: dashboard menampilkan daftar kampanye

Badge jumlah area menggantikan badge rasio dari aplikasi lama —
informasi yang lebih berguna di produk multi-slot."
```

---

## Task 11: Verifikasi menyeluruh Fase 2

**Files:**
- Modify: `README.md`

**Interfaces:**
- Consumes: semuanya
- Produces: `README.md` yang menyebutkan status Fase 2 dengan jujur

- [ ] **Step 1: Jalankan seluruh test**

```bash
bun test
```
Expected: PASS, 74 test (25 dari Fase 0–1 + 26 geometry + 16 slug + 7 upload),
0 gagal.

- [ ] **Step 2: Pastikan lint, tipe, dan build bersih**

```bash
bun run check
bun run typecheck
bun run build
```
Expected: ketiganya tanpa error.

- [ ] **Step 3: Telusuri alur lengkap sekali lagi dari awal**

```bash
bun dev
```

1. Daftar akun baru → simpan recovery code → masuk dashboard.
2. Dashboard kosong menampilkan ajakan membuat kampanye.
3. `+ Bikin Kampanye` → pilih PNG transparan → kotak muncul di tengah frame.
4. Geser kotak sampai menyentuh tepi. Expected: berhenti di tepi, **ukurannya
   tidak mengecil**.
5. Tarik pegangan kanan sampai tepi. Expected: hanya sisi kanan yang bergerak,
   sisi kiri diam.
6. Kecilkan kotak sampai lebih kecil dari 20px pada ukuran asli. Expected:
   kotaknya jadi merah dan tombol simpan mati.
7. Perbesar lagi, isi nama, simpan. Expected: kembali ke dashboard, kartu muncul
   dengan thumbnail.
8. Klik kartu → posisi kotak persis seperti saat disimpan.
9. Ubah nama, simpan, buka lagi. Expected: nama baru, slug lama.

- [ ] **Step 4: Pastikan tidak ada kebocoran di sumber halaman**

```bash
curl -s http://localhost:3000/dashboard | grep -c 'openframe.local'
```
Expected: `0`. Angka selain nol berarti ada server function yang mengembalikan
objek user mentah — periksa proyeksi di `src/server/session.ts`.

- [ ] **Step 5: Perbarui bagian Status di `README.md`**

Ganti bagian `## Status` yang sekarang dengan:

```markdown
## Status

Repositori ini sedang dibangun bertahap. **Yang sudah jadi (Fase 0–2):**
fondasi aplikasi, autentikasi penuh tanpa email, dan sisi creator — unggah
frame PNG, gambar satu area foto di atasnya, simpan sebagai kampanye, lalu
ubah lagi lewat dashboard.

**Yang belum:** halaman partisipan untuk mengisi area dan mengunduh hasilnya
(Fase 3), multi-slot (Fase 4–5), galeri publik (Fase 6), dan hapus kampanye
(Fase 7). Rinciannya ada di `docs/superpowers/plans/`. Sampai fase itu
mendarat, aplikasi dijalankan lewat `bun dev`; penyajian produksi
(`bun run start`) belum disambungkan.
```

Tambahkan juga satu baris ke blok `.env` di bagian **Jalankan lokal**, tepat
sebelum baris `} > .env`:

```
  echo "UPLOAD_DIR=./uploads"
```

- [ ] **Step 6: Commit**

```bash
bun run check
git add -A
git commit -m "docs: README dengan status Fase 2

Sisi creator sudah jalan: unggah frame, gambar area, simpan, ubah."
```

---

## Definition of Done — Fase 2

- [ ] `bun test` lulus semua (74 test)
- [ ] `bun run check`, `bun run typecheck`, dan `bun run build` bersih
- [ ] Creator bisa mengunggah frame PNG dan hasilnya tersimpan di `uploads/frames/<id>/`
- [ ] Berkas non-PNG ditolak walaupun `Content-Type`-nya dipalsukan (Sharp yang menentukan)
- [ ] Berkas di atas 10MB ditolak
- [ ] Kotak area bisa digeser dan diubah ukurannya lewat pointer **dan** lewat panah keyboard
- [ ] Kotak tidak bisa keluar frame; menggeser mempertahankan ukuran, resize menghentikan sisi yang ditarik saja
- [ ] Area di bawah 20×20 piksel asli ditolak — di UI (tombol mati) **dan** di server (permintaan buatan tangan gagal)
- [ ] Koordinat tersimpan sebagai persen 0–100, bukan piksel
- [ ] Slug digenerate dari nama, unik, dan **tidak berubah** saat nama diubah
- [ ] Campaign orang lain di `/edit/$id` menghasilkan "tidak ditemukan", bukan 403 dan bukan formulir orang lain
- [ ] Dashboard menampilkan thumbnail, jumlah area, status publik/privat, dan jumlah pemakaian
- [ ] Transaksi gagal tidak meninggalkan berkas frame yatim di `uploads/`
- [ ] Tidak ada `openframe.local` di sumber halaman mana pun
- [ ] Semua teks yang terlihat pengguna berbahasa Indonesia

---

## Yang menyusul di fase berikutnya

Sengaja **tidak** ada dalam plan ini.

| Menyusul di | Isi |
|---|---|
| Fase 3 | `campaigns.getBySlug`, route `/twibbon/$slug`, `components/slot-filler/`, `lib/composite.ts`, unduhan sisi klien |
| Fase 4 | Tambah/hapus/urutkan ulang slot di editor; satu foto diterapkan ke semua slot |
| Fase 5 | Mode multi-photo, unduhan 1×/2×/3× |
| Fase 6 | `campaigns.listPublic`, route `/` jadi landing + galeri, pencarian, paginasi |
| Fase 7 | `campaigns.delete` (cascade + hapus berkas), ganti frame, `campaigns.incrementUse`, OG metadata, E2E Playwright |

**Utang yang dibawa dari Fase 0–1** dan harus lunas sebelum deploy publik
(dicatat di review akhir fase lalu, bukan pekerjaan Fase 2):

- Belum ada preset server produksi — `bun run start` masih mencetak pesan "belum disambungkan".
- `registerUser` adalah `createServerFn`, sehingga rate limiter Better Auth (yang hanya menutupi route `auth.handler`) tidak membatasinya.
- Rate limit memakai penyimpanan dalam memori per-proses.
