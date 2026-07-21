# OpenFrame Fase 4+5: Multi-Slot dan Mode Multi-Photo — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Membereskan sisa Fase 4 — laju geser yang tidak seragam saat slot berbeda ukuran — lalu menambahkan mode multi-photo: satu foto per slot dengan editor independen.

**Architecture:** Mode single dan multi **bukan dua fitur**, melainkan satu fitur dengan sumber isi berbeda (spec 6.2). `renderComposite` tidak pernah tahu mode mana yang aktif; yang berganti hanya fungsi `getFill`. Transform per slot disimpan sebagai state biasa, sementara slot yang sedang digeser memakai `MotionValue` — jadi tidak ada hook di dalam perulangan, dan tetap nol re-render React per frame.

**Tech Stack:** TanStack Start · React 19 · Canvas 2D · Motion 12 · shadcn/ui + Base UI · Bun

**Dependensi baru:** tidak ada.

**Fase sebelumnya:** `docs/superpowers/plans/2026-07-22-openframe-fase-3-partisipan-dan-compositing.md`

---

## Kenapa keduanya digabung

Fase 3 sudah memenuhi hampir seluruh Fase 4: satu foto otomatis diterapkan ke semua slot, dan menggesernya menggerakkan semua slot bersamaan — terbukti di browser, kedua area menunjukkan RGB identik dan bergeser seiring.

Sisa Fase 4 tinggal satu cacat, dan cacat itu menyentuh berkas yang sama persis dengan yang harus diubah Fase 5:

**`slotSize` diambil dari slot pertama saja.** Delta pointer dibagi ukuran slot pertama untuk jadi pecahan offset, padahal `renderComposite` mengalikan offset itu dengan ukuran **masing-masing** slot. Akibatnya pada campaign dengan slot berbeda ukuran, isi slot kedua bergerak lebih cepat atau lebih lambat daripada jari — melanggar aturan 22 untuk semua slot kecuali yang pertama.

Memperbaikinya terpisah berarti dua kali membongkar `SlotFiller` dan `useSlotTransform` untuk alasan yang bertetangga.

---

## Global Constraints

- **Bahasa Indonesia** untuk UI, pesan error, komentar. Santai, "kamu". Brand: **OpenFrame**.
- **P1** — foto partisipan tidak pernah dikirim ke server, termasuk di mode multi-photo.
- **P2** — persen↔piksel hanya lewat `lib/geometry.ts`.
- **P3** — `renderComposite` tetap satu jalur. **Dilarang** menambah cabang mode di dalamnya; yang berganti hanya `getFill` (spec 6.2).
- **P4 / ponytail.** Tandai penyederhanaan dengan `// ponytail:`.
- **Aturan 22** — tracking 1:1 dengan pointer. Itu justru inti Task 1.
- **Aturan 26** — rubber-banding tetap hanya di pan foto.
- **Jangan ubah** `lib/geometry.ts`, `lib/composite.ts` bagian matematikanya, `area-editor/`, atau kode server. Fase ini murni sisi partisipan.
- Biome, `bun run check` sebelum commit. **`bun run build` wajib.**
- Commit Indonesia, conventional commits.

---

## Struktur Berkas

| Berkas | Tanggung jawab |
|---|---|
| `src/lib/composite.ts` | **Ubah.** Tambah `slotAt()` — mencari slot di bawah titik pointer |
| `src/components/slot-filler/use-slot-transform.ts` | **Ubah.** Laju geser mengikuti slot di bawah pointer; transform bisa dimuat/disimpan per slot |
| `src/components/slot-filler/slot-filler.tsx` | **Ubah.** Toggle mode, unggah per slot, editor per slot |
| `src/routes/twibbon.$slug.tsx` | **Ubah.** Menyimpan foto per slot |
| `tests/lib/composite.test.ts` | **Ubah.** Test `slotAt` |

Tidak ada berkas baru.

---

## Task 1: Laju geser mengikuti slot di bawah pointer

**Files:**
- Modify: `src/lib/composite.ts`, `tests/lib/composite.test.ts`
- Modify: `src/components/slot-filler/use-slot-transform.ts`, `src/components/slot-filler/slot-filler.tsx`

**Interfaces:**
- Produces: `slotAt(slots, point, canvas): number` — indeks slot di titik itu, atau `-1`

- [ ] **Step 1: Tulis test yang gagal**

Tambahkan ke `tests/lib/composite.test.ts`:

```ts
import { slotAt } from '@/lib/composite'

describe('slotAt', () => {
  const KANVAS = { width: 1000, height: 500 }
  const SLOTS = [
    { x: 10, y: 10, width: 30, height: 30 },
    { x: 60, y: 60, width: 30, height: 30 },
  ]

  test('menemukan slot di bawah titik', () => {
    // 20% dari 1000 = 200px, di dalam slot pertama (100..400px).
    expect(slotAt(SLOTS, { x: 200, y: 100 }, KANVAS)).toBe(0)
    expect(slotAt(SLOTS, { x: 700, y: 400 }, KANVAS)).toBe(1)
  })

  test('mengembalikan -1 saat titiknya di luar semua slot', () => {
    expect(slotAt(SLOTS, { x: 500, y: 250 }, KANVAS)).toBe(-1)
  })

  test('slot yang digambar belakangan menang saat bertumpuk', () => {
    // Nomor slot yang lebih besar digambar di atas, jadi ia yang tersentuh.
    const tumpuk = [
      { x: 10, y: 10, width: 80, height: 80 },
      { x: 20, y: 20, width: 20, height: 20 },
    ]
    expect(slotAt(tumpuk, { x: 250, y: 125 }, KANVAS)).toBe(1)
  })

  test('daftar kosong tidak melempar', () => {
    expect(slotAt([], { x: 10, y: 10 }, KANVAS)).toBe(-1)
  })
})
```

- [ ] **Step 2: Jalankan test**

```bash
bun test tests/lib/composite.test.ts
```
Expected: FAIL — `slotAt` belum diekspor.

- [ ] **Step 3: Tulis `slotAt`**

Tambahkan ke `src/lib/composite.ts`:

```ts
/**
 * Indeks slot yang berada di bawah sebuah titik kanvas, atau -1.
 *
 * Dicari dari belakang karena slot bernomor besar digambar paling akhir dan
 * karena itu tampak paling atas; yang terlihat itulah yang harus tersentuh.
 */
export function slotAt(
  slots: readonly SlotRect[],
  point: { x: number; y: number },
  canvas: FrameSize,
): number {
  for (let i = slots.length - 1; i >= 0; i--) {
    const slot = slots[i]
    if (!slot) continue
    const kotak = toPixels(slot, canvas)
    if (
      point.x >= kotak.x &&
      point.x <= kotak.x + kotak.width &&
      point.y >= kotak.y &&
      point.y <= kotak.y + kotak.height
    ) {
      return i
    }
  }
  return -1
}
```

- [ ] **Step 4: Pakai di `useSlotTransform`**

Ganti parameter `slotSize` yang tetap dengan pencarian saat gesture dimulai. Ubah `Params`:

```ts
type Params = {
  image: HTMLImageElement | null
  slots: readonly SlotRect[]
  /** Ukuran kanvas preview dalam piksel. */
  canvas: FrameSize
  /** Di mode multi, hanya slot ini yang boleh digeser. -1 = semua slot (mode single). */
  slotAktif: number
}
```

Di `mulai`, tentukan slot acuan dan simpan ukurannya untuk seluruh tarikan:

```ts
  function mulai(event: ReactPointerEvent) {
    if (!image) return

    const box = event.currentTarget.getBoundingClientRect()
    const titik = { x: event.clientX - box.left, y: event.clientY - box.top }
    const kena = slotAt(slots, titik, canvas)
    if (kena < 0) return
    // Di mode multi, menggeser di luar slot yang sedang diedit tidak melakukan
    // apa-apa — kalau tidak, jari di slot lain diam-diam memindahkan slot ini.
    if (slotAktif >= 0 && kena !== slotAktif) return

    const slot = slots[kena]
    if (!slot) return

    // Aturan 22: laju geser memakai ukuran slot YANG DISENTUH, bukan slot
    // pertama. Tanpa ini, isi slot berukuran lain bergerak lebih cepat atau
    // lebih lambat daripada jari.
    const ukuran = {
      width: (slot.width / 100) * canvas.width,
      height: (slot.height / 100) * canvas.height,
    }

    event.currentTarget.setPointerCapture(event.pointerId)
    drag.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      awal: bacaTransform(),
      ukuran,
    }
  }
```

`geser` memakai `d.ukuran` alih-alih `slotSize`, dan `batasUntuk` menerima ukuran itu sebagai argumen. Simpan `ukuran` terakhir di ref supaya `selesai` dan `setScale` memakai acuan yang sama.

- [ ] **Step 5: Verifikasi di browser**

Buat campaign dengan dua slot **berbeda ukuran** — misal 40%×60% dan 20%×25%. Unggah foto, lalu:

1. Geser dengan jari di atas slot besar → isinya mengikuti pointer 1:1
2. Geser dengan jari di atas slot kecil → isinya juga mengikuti pointer 1:1

Sebelum perbaikan ini, salah satunya pasti meleset.

- [ ] **Step 6: Commit**

```bash
bun run check && bun run typecheck && bun run build
git add -A
git commit -m "fix: laju geser mengikuti slot yang disentuh, bukan slot pertama

Delta pointer dibagi ukuran slot pertama padahal renderComposite
mengalikannya dengan ukuran masing-masing slot. Pada campaign dengan slot
berbeda ukuran, isi slot kedua bergerak lebih cepat atau lebih lambat
daripada jari — melanggar aturan 22 untuk semua slot kecuali yang pertama."
```

---

## Task 2: Transform per slot

Prasyarat mode multi-photo, tapi berguna sendiri: menyiapkan tempat menyimpan posisi tiap slot.

**Files:**
- Modify: `src/components/slot-filler/use-slot-transform.ts`

**Interfaces:**
- Produces: `muat(t: Transform)` dan `simpan(): Transform` pada hook

- [ ] **Step 1: Tambahkan muat/simpan**

```ts
  /** Memuat posisi tersimpan ke motion value, tanpa animasi. */
  const muat = useCallback(
    (t: Transform) => {
      // jump() memutus kontinuitas dengan sengaja: ini berpindah slot, bukan
      // melanjutkan gerakan. Tanpa itu, velocity slot sebelumnya ikut terbawa.
      offsetX.jump(t.offsetX)
      offsetY.jump(t.offsetY)
      setScaleState(t.scale)
    },
    [offsetX, offsetY],
  )
```

`simpan` cukup memakai `bacaTransform` yang sudah ada — ekspor saja dengan nama itu.

- [ ] **Step 2: Verifikasi dan commit**

```bash
bun run check && bun run typecheck && bun run build
git add -A
git commit -m "feat: transform slot bisa dimuat dan disimpan

jump() dipakai saat berpindah slot, bukan set(): berpindah slot adalah
diskontinuitas yang disengaja, dan tanpa itu velocity slot sebelumnya
ikut terbawa ke slot berikutnya."
```

---

## Task 3: Mode multi-photo

**Files:**
- Modify: `src/components/slot-filler/slot-filler.tsx`, `src/routes/twibbon.$slug.tsx`

**Interfaces:**
- Consumes: `muat`, `bacaTransform`, `slotAt`
- Produces: `<SlotFiller>` menerima `mode`, `fotoPerSlot`, `onPilihFotoSlot`

- [ ] **Step 1: State foto per slot di halaman**

```tsx
type ModeIsi = 'satu' | 'perSlot'

const [mode, setMode] = useState<ModeIsi>('satu')
/** Mode perSlot: satu foto per indeks slot. Mode satu: tidak dipakai. */
const [fotoPerSlot, setFotoPerSlot] = useState<Record<number, HTMLImageElement>>({})
```

Batas ukuran berbeda per mode (PRD US-04):

```tsx
/** Mode satu foto: 15MB. Mode per slot: 5MB per slot. */
const MAKS_SATU = 15 * 1024 * 1024
const MAKS_PER_SLOT = 5 * 1024 * 1024
```

- [ ] **Step 2: Toggle mode**

Mode single ditawarkan lebih dulu dan jadi bawaan (PRD US-04, spec 6.2). Pakai dua `<Button>` yang sudah ada, bukan komponen tabs baru — `// ponytail:`.

```tsx
<div className="flex gap-2">
  <Button
    type="button"
    variant={mode === 'satu' ? 'default' : 'outline'}
    size="sm"
    onClick={() => setMode('satu')}
  >
    Satu foto
  </Button>
  <Button
    type="button"
    variant={mode === 'perSlot' ? 'default' : 'outline'}
    size="sm"
    onClick={() => setMode('perSlot')}
  >
    Upload per Slot
  </Button>
</div>
```

- [ ] **Step 3: Ganti `getFill`, JANGAN sentuh `renderComposite`**

Inti spec 6.2. Fungsi render tidak tahu mode mana yang aktif:

```tsx
  const transformsRef = useRef<Record<number, Transform>>({})

  const getFill = useCallback(
    (index: number): SlotFill | undefined => {
      const hidup = index === slotAktif
      if (mode === 'satu') {
        // Semua slot membaca isi yang sama.
        return photo ? { image: photo, transform: t.bacaTransform() } : undefined
      }
      const img = fotoPerSlot[index]
      if (!img) return undefined
      return {
        image: img,
        // Slot yang sedang digeser membaca motion value; sisanya membaca
        // posisi tersimpan.
        transform: hidup ? t.bacaTransform() : (transformsRef.current[index] ?? IDENTITAS),
      }
    },
    [mode, photo, fotoPerSlot, slotAktif, t.bacaTransform],
  )
```

- [ ] **Step 4: Berpindah slot menyimpan lalu memuat**

```tsx
  function pilihSlot(index: number) {
    if (index === slotAktif) return
    if (slotAktif >= 0) transformsRef.current[slotAktif] = t.bacaTransform()
    setSlotAktif(index)
    t.muat(transformsRef.current[index] ?? IDENTITAS)
  }
```

- [ ] **Step 5: Daftar slot dengan unggahnya masing-masing**

Di mode `perSlot`, tampilkan satu baris per slot berisi nomor, labelnya, tombol pilih, dan input berkas. Slot yang belum terisi ditandai.

- [ ] **Step 6: Verifikasi dan commit**

```bash
bun run check && bun run typecheck && bun run build
git add -A
git commit -m "feat: mode multi-photo dengan editor independen per slot

Mode single dan multi bukan dua fitur melainkan satu fitur dengan sumber
isi berbeda (spec 6.2): yang berganti hanya getFill, sementara
renderComposite tidak pernah tahu mode mana yang aktif."
```

---

## Task 4: Verifikasi menyeluruh

- [ ] **Step 1: Gerbang otomatis**

```bash
bun test && bun run typecheck && bun run check && bun run build
```
Expected: 95 test (91 + 4 `slotAt`), sisanya bersih.

- [ ] **Step 2: Laju geser seragam (sisa Fase 4)**

Campaign dua slot berbeda ukuran, mode satu foto. Geser di atas masing-masing
slot dan bandingkan pergeseran isi dengan jarak pointer. Keduanya harus 1:1.

- [ ] **Step 3: Mode multi-photo**

1. Ganti ke "Upload per Slot" → daftar slot muncul
2. Unggah foto berbeda ke slot 1 dan slot 2 → keduanya tampil berbeda
3. Geser slot 1 → **hanya slot 1 yang bergerak**
4. Pilih slot 2, geser → slot 1 tetap di posisi terakhirnya
5. Kembali ke slot 1 → posisinya masih seperti ditinggalkan
6. Unduh 2× → kedua foto ada di posisi yang sama dengan preview

- [ ] **Step 4: P1 tetap terjaga di mode multi**

`performance.getEntriesByType('resource')` setelah mengunggah beberapa foto
per slot: **nol** permintaan. Uji kontrol seperti Fase 3 — alat yang sama harus
menangkap `incrementUse` saat mengunduh.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "test: verifikasi multi-slot dan mode multi-photo"
```

---

## Definition of Done

- [ ] `bun test` (95), `typecheck`, `check`, `build` bersih
- [ ] Menggeser di atas slot mana pun mengikuti pointer 1:1, termasuk saat slot berbeda ukuran
- [ ] Mode "Satu foto" tetap jadi bawaan dan ditawarkan lebih dulu
- [ ] Mode "Upload per Slot" menerima foto berbeda per slot, maks 5MB masing-masing
- [ ] Menggeser satu slot **tidak** menggerakkan slot lain di mode multi
- [ ] Posisi tiap slot bertahan saat berpindah-pindah slot
- [ ] `renderComposite` **tidak** punya satu pun cabang mode di dalamnya
- [ ] Unduhan sama dengan preview di kedua mode
- [ ] Nol permintaan jaringan saat mengunggah foto, terbukti dengan uji kontrol
- [ ] Semua teks berbahasa Indonesia

---

## Yang menyusul

| Fase | Isi |
|---|---|
| 6 | `campaigns.listPublic`, `/` jadi landing + galeri, pencarian, paginasi, `hero.png` |
| 7 | `campaigns.delete` (**wajib panggil `deleteFrameDir`**), ganti frame, OG metadata, aksesibilitas, responsive |
